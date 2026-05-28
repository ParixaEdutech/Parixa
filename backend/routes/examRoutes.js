const express = require('express');
const mongoose = require('mongoose');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const User = require('../models/User');
const Submission = require('../models/Submission');
const sendEmail = require('../utils/sendEmail');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const visionModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-8b' }); // Smaller/faster for proctoring scans

// Middleware checking... (already handled by user or my recent update)
// ...

// Route: POST /api/exams/:id/submit
// Desc : Submit exam answers and handle automated grading
router.post('/:id/submit', protect, async (req, res) => {
    try {
        const { answers } = req.body;
        const examId = req.params.id;
        console.log(`[Submit] Received submission for exam: ${examId} from ${req.user.email}`);

        const exam = await Exam.findById(examId);
        if (!exam) {
            console.warn(`[Submit] Exam not found: ${examId}`);
            return res.status(404).json({ message: 'Exam not found' });
        }

        const isAssigned = exam.assignedStudents.some(asst => asst.user.toString() === req.user._id.toString());
        if (!isAssigned) {
            console.warn(`[Submit] Student ${req.user.email} not assigned to exam ${examId}`);
            return res.status(403).json({ message: 'Not assigned to this exam' });
        }

        let existing = await Submission.findOne({ exam: examId, student: req.user._id });
        if (existing && (existing.answers?.length > 0 || existing.score > 0)) {
            console.warn(`[Submit] Full submission already detected for ${req.user.email}`);
            return res.status(400).json({ message: 'Already submitted' });
        }

        let score = 0;
        const totalQuestions = answers.length;

        console.log(`[Submit] Grading ${totalQuestions} answers...`);
        const gradedAnswers = [];
        for (const ans of (answers || [])) {
            try {
                const question = await Question.findById(ans.questionId);
                if (question) {
                    if (question.correctAnswer === parseInt(ans.selectedOption)) {
                        score++;
                    }
                    gradedAnswers.push({
                        question: question._id,
                        selectedOption: (ans.selectedOption === null || ans.selectedOption === undefined) ? -1 : parseInt(ans.selectedOption)
                    });
                }
            } catch (err) {
                console.error(`[Submit] Grading err for ID ${ans.questionId}:`, err);
            }
        }

        // Use findOneAndUpdate to handle potential early proctor logs
        const submission = await Submission.findOneAndUpdate(
            { exam: examId, student: req.user._id },
            { 
                answers: gradedAnswers,
                score,
                totalQuestions,
                submittedAt: new Date()
            },
            { upsert: true, new: true }
        );

        console.log(`[Submit] Success! ${req.user.email} scored ${score}/${totalQuestions}`);
        res.status(201).json({ 
            message: 'Exam submitted successfully!',
            score,
            totalQuestions,
            percentage: ((score / totalQuestions) * 100).toFixed(1),
            showResults: !!exam.showResults
        });
    } catch (error) {
        console.error('[Submit] ERROR:', error);
        res.status(500).json({ message: 'Server error during submission' });
    }
});

// Middleware checking if user is teacher or admin (who are allowed to modify exams)
const isEducator = (req, res, next) => {
    if (req.user && (req.user.role === 'teacher' || req.user.role === 'admin')) {
        next();
    } else {
        res.status(403).json({ message: 'Educator access strictly required.' });
    }
};

// Route: GET /api/exams/students
// Desc : List all students for assigning to an exam
router.get('/students', protect, isEducator, async (req, res) => {
    try {
        const students = await User.find({ role: 'student' }).select('name email assignedClass');
        res.json(students);
    } catch (error) {
        console.error('Failed to fetch students:', error);
        res.status(500).json({ message: 'Server error fetching students' });
    }
});

// Route: GET /api/exams/my-exams
// Desc : List all exams created by the logged-in teacher
router.get('/my-exams', protect, isEducator, async (req, res) => {
    try {
        const exams = await Exam.find({ creator: req.user._id })
            .sort({ createdAt: -1 });
        res.json(exams);
    } catch (error) {
        console.error('Failed to fetch teacher exams:', error);
        res.status(500).json({ message: 'Server error fetching exams' });
    }
});



// Route: GET /api/exams/recent-submissions
// Desc : Fetch latest 10 submissions for teacher analytics
router.get('/recent-submissions', protect, isEducator, async (req, res) => {
    try {
        const submissions = await Submission.find()
            .populate('student', 'name email assignedClass')
            .populate('exam', 'title')
            .sort({ submittedAt: -1 })
            .limit(10);
        res.json(submissions);
    } catch (error) {
        console.error('Failed to fetch submissions:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Route: POST /api/exams/create
// Desc : Create a new empty exam shell
router.post('/create', protect, isEducator, async (req, res) => {
    try {
        const { title, description, subject, startTime, durationMinutes } = req.body;
        
        const exam = await Exam.create({
            title,
            description,
            subject,
            startTime,
            durationMinutes,
            creator: req.user._id, // Set automatically from token verification
            status: 'draft' 
        });

        res.status(201).json(exam);
    } catch (error) {
        console.error('Failed to create Exam shell:', error);
        res.status(500).json({ message: 'Server error creating exam' });
    }
});

// Route: POST /api/exams/:id/questions
// Desc : Save an array of AI Generated (or Manual) Questions into the specified Exam
router.post('/:id/questions', protect, isEducator, async (req, res) => {
    try {
        const examId = req.params.id;
        const questionsData = req.body.questions; // Expects an Array of Question Objects

        if (!questionsData || !Array.isArray(questionsData) || questionsData.length === 0) {
            return res.status(400).json({ message: 'No questions provided or payload is not an array' });
        }

        console.log('Received', questionsData.length, 'questions to save for exam', examId);
        const exam = await Exam.findById(examId);
        if (!exam) return res.status(404).json({ message: 'Exam not found' });
        if (exam.creator.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Cannot modify another teachers exam.' });
        }

        // Clean each question: keep only fields that exist in the schema
        const cleaned = questionsData.map(q => ({
            examId: exam._id,
            text: q.text,
            options: q.options,
            correctAnswer: q.correctAnswer,
            difficulty: q.difficulty,
            setNumber: q.setNumber || 1,
            marks: q.marks || 1
        }));

        // Insert many
        const savedQuestions = await Question.insertMany(cleaned);
        exam.status = 'published';
        await exam.save();

        res.status(201).json({
            message: `Successfully saved ${savedQuestions.length} Questions and Published Exam!`,
            savedQuestions
        });
    } catch (error) {
        console.error('Failed to save questions:', error);
        // If it's a Mongoose validation error, send details
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Validation error while saving questions', details: error.message });
        }
        res.status(500).json({ message: 'Server error attaching questions to exam' });
    }
});

// Route: GET /api/exams/:id/questions/student
// Desc : Fetch ONLY the assigned set of questions for a student
router.get('/:id/questions/student', protect, async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id);
        if (!exam) return res.status(404).json({ message: 'Exam not found' });

        // Verify assignment and get set number
        const assignment = exam.assignedStudents.find(
            asst => asst.user.toString() === req.user._id.toString()
        );

        if (!assignment) {
            return res.status(403).json({ message: 'You are not assigned to this exam.' });
        }

        const now = new Date();
        const gateStart = new Date(exam.startTime);
        const gateEnd = new Date(gateStart.getTime() + (exam.entryWindowMinutes || 60) * 60000);

        if (now < gateStart) {
            return res.status(403).json({ message: 'Exam has not started yet.' });
        }
        if (now > gateEnd) {
            return res.status(403).json({ message: 'Exam entry window has closed.' });
        }

        const questions = await Question.find({ 
            examId: exam._id,
            setNumber: assignment.setNumber 
        }).select('-correctAnswer'); // Security: Don't send correct answers to client!

        res.json({
            title: exam.title,
            duration: exam.durationMinutes,
            startTime: exam.startTime,
            isPasswordProtected: !!exam.examPassword,
            questions
        });
    } catch (error) {
        console.error('Failed to fetch student questions:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Route: POST /api/exams/:id/verify-password
// Desc : Verify student entry PIN for secure exams
router.post('/:id/verify-password', protect, async (req, res) => {
    try {
        const { password } = req.body;
        const exam = await Exam.findById(req.params.id);
        if (!exam) return res.status(404).json({ message: "Exam not found" });

        if (exam.examPassword === password) {
            res.json({ success: true });
        } else {
            res.status(401).json({ success: false, message: "Invalid exam password." });
        }
    } catch (error) {
        res.status(500).json({ message: "Verification failed." });
    }
});

// Route: POST /api/exams/:id/publish-results
// Desc : Manually release scores to all students for this exam
router.post('/:id/publish-results', protect, isEducator, async (req, res) => {
    try {
        console.log(`[Results] Attempting to publish results for ID: ${req.params.id}`);
        const exam = await Exam.findById(req.params.id);
        if (!exam) {
            console.warn(`[Results] Exam NOT found for ID: ${req.params.id}`);
            return res.status(404).json({ message: "Exam not found" });
        }

        exam.showResults = true;
        await exam.save();
        
        console.log(`[Results] Published results for Exam: ${exam.title}`);
        res.json({ message: "Results published successfully" });
    } catch (error) {
        console.error(`[Results] Publish ERROR for ${req.params.id}:`, error);
        res.status(500).json({ message: "Failed to publish results" });
    }
});

// Route: GET /api/exams/:id/submissions
// Desc : Fetch all student submissions for a specific exam (Teacher only)
router.get('/:id/submissions', protect, isEducator, async (req, res) => {
    try {
        const submissions = await Submission.find({ exam: req.params.id })
            .populate('student', 'name email assignedClass')
            .populate('answers.question')
            .sort({ submittedAt: -1 });
        
        console.log(`[Results] Fetched ${submissions.length} submissions for Exam ${req.params.id}`);
        res.json(submissions);
    } catch (error) {
        console.error('Failed to fetch submissions:', error);
        res.status(500).json({ message: 'Server error while fetching results.' });
    }
});

// Route: GET /api/exams/my-assigned-exams
// Desc : List all exams assigned to the logged-in student
router.get('/my-assigned-exams', protect, async (req, res) => {
    try {
        console.log(`[Fetch] Checking assignments for Student ID: ${req.user._id}`);
        const exams = await Exam.find({ 
            'assignedStudents.user': req.user._id 
        }).populate('creator', 'name');
        
        console.log(`[Fetch] Found ${exams.length} potential exams for student.`);

        // Transform to explicitly show the student's assigned Set and status
        const studentExams = await Promise.all(exams.map(async exam => {
            const assignment = exam.assignedStudents.find(
                asst => asst.user.toString() === req.user._id.toString()
            );

            // Check if student has already submitted this exam
            const sub = await Submission.findOne({ 
                exam: exam._id, 
                student: req.user._id 
            });

            // Determine if exam is currently available for taking
            const now = new Date();
            const gateStart = new Date(exam.startTime);
            const gateEnd = new Date(gateStart.getTime() + (exam.entryWindowMinutes || 60) * 60000);
            
            let status = 'Upcoming';
            if (sub) {
                status = 'Completed';
            } else if (now >= gateStart && now <= gateEnd) {
                status = 'Available';
            } else if (now > gateEnd) {
                status = 'Completed';
            }

            return {
                _id: exam._id,
                title: exam.title,
                subject: exam.subject,
                startTime: exam.startTime,
                durationMinutes: exam.durationMinutes,
                entryWindowMinutes: exam.entryWindowMinutes || 60,
                creator: exam.creator,
                mySet: assignment ? assignment.setNumber : 1,
                status: status,
                isPasswordProtected: !!exam.examPassword,
                score: (sub && exam.showResults) ? sub.score : null,
                totalQuestions: (sub && exam.showResults) ? sub.totalQuestions : null,
                showResults: exam.showResults
            };
        }));

        res.json(studentExams);
    } catch (error) {
        console.error('Failed to fetch assigned exams:', error);
        res.status(500).json({ message: 'Server error fetching your exams' });
    }
});

// Route: POST /api/exams/:id/schedule
// Desc : Schedule an exam and assign students with automatic Set Distribution (A, B, C)
router.post('/:id/schedule', protect, isEducator, async (req, res) => {
    try {
        console.log('[Schedule] Received payload:', req.body);
        const { date, startTime, durationMinutes, entryWindowMinutes, studentIds, showResults, examPassword } = req.body;
        const exam = await Exam.findById(req.params.id);

        if (!exam) return res.status(404).json({ message: 'Exam not found' });
        if (exam.creator.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // 1. Identify how many Sets were actually generated for this exam
        const questions = await Question.find({ examId: exam._id });
        const setsFound = [...new Set(questions.map(q => q.setNumber))].sort((a,b) => a-b);
        const numSetsAvailable = setsFound.length || 1;

        console.log(`[Schedule] Exam: ${exam.title} | Window: ${entryWindowMinutes} | Password: ${!!examPassword}`);

        // 2. Distribute sets to selected students in a round-robin fashion
        const assignedStudents = (studentIds || []).map((sid, index) => ({
            user: new mongoose.Types.ObjectId(sid),
            setNumber: setsFound[index % numSetsAvailable] || 1
        }));

        // 3. Update the exam shell
        let finalStartDateTime;
        if (startTime && (startTime.includes('T') || startTime.includes('Z'))) {
            finalStartDateTime = new Date(startTime);
        } else {
            finalStartDateTime = new Date(`${date} ${startTime}`);
        }
        
        exam.startTime = finalStartDateTime;
        exam.durationMinutes = parseInt(durationMinutes);
        exam.entryWindowMinutes = parseInt(entryWindowMinutes) || 60;
        exam.assignedStudents = assignedStudents;
        exam.status = 'published';
        exam.showResults = !!showResults;
        exam.examPassword = examPassword || '';

        await exam.save();
        console.log(`[Schedule] Success! Exam ${exam.title} saved with ${assignedStudents.length} assignments.`);

        // 4. Send Immediate Notifications to all assigned students
        console.log(`[Notification] Preparing to notify ${assignedStudents.length} students...`);

        const studentNotificationBatch = assignedStudents.map(async (asst) => {
            try {
                const studentUser = await User.findById(asst.user);
                if (studentUser && studentUser.email) {
                    console.log(`[Notification] Dispatching to: ${studentUser.email}`);
                    const mailSubject = `[ParixaAI] Scheduled Notice: ${exam.title}`;
                    const mailText = `Hello ${studentUser.name},\n\nA new exam has been scheduled for you.\n\n` +
                        `📝 Exam: ${exam.title}\n` +
                        `📘 Subject: ${exam.subject}\n` +
                        `📅 Date: ${date}\n` +
                        `⏰ Start Time: ${startTime}\n` +
                        `🚪 Entry Window: ${entryWindowMinutes} Minutes\n` +
                        `⏳ Exam Duration: ${durationMinutes} Minutes\n\n` +
                        `Please log in to Parixa within the entry window to take your assessment.\n` +
                        `Stay prepared and good luck!`;
                    
                    return await sendEmail({ to: studentUser.email, subject: mailSubject, text: mailText });
                } else {
                    console.warn(`[Notification] Skip student ${asst.user} - no email found.`);
                }
            } catch (err) {
                console.error(`[Notification] Failed for student ${asst.user}:`, err);
            }
        });

        // Fire off all emails and let them resolve in background
        Promise.all(studentNotificationBatch).then((results) => {
            const successCount = results.filter(r => r === true).length;
            console.log(`[Notification] Batch complete. Success: ${successCount}/${assignedStudents.length}`);
        }).catch(err => console.error("Email batch failure:", err));

        res.json({ 
            message: `Exam successfully scheduled for ${assignedStudents.length} students! Notifications sent via email.`,
            exam 
        });

    } catch (error) {
        console.error('Scheduling failure:', error);
        res.status(500).json({ message: 'Server error while scheduling exam.' });
    }
});

// Route: GET /api/exams/:id/my-submission
// Desc : Fetch a single student's complete populated submission for performance breakdown
router.get('/:id/my-submission', protect, async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id);
        if (!exam) return res.status(404).json({ message: 'Exam not found' });
        
        // Ensure student can only view if results are released by teacher
        if (!exam.showResults) {
            return res.status(403).json({ message: 'Results are currently hidden by the educator.' });
        }

        const sub = await Submission.findOne({ exam: req.params.id, student: req.user._id })
            .populate('answers.question');
        
        if (!sub) return res.status(404).json({ message: 'Submission not found' });
        
        res.json(sub);
    } catch (error) {
        console.error('Fetch submission error:', error);
        res.status(500).json({ message: 'Server error fetching your detailed submission.' });
    }
});

// Route: POST /api/exams/:id/proctor/scan
// Desc : Analyze a webcam snapshot for proctoring violations using Gemini Vision
router.post('/:id/proctor/scan', protect, async (req, res) => {
    try {
        const { imageBase64 } = req.body; // Expects "data:image/jpeg;base64,..."
        const examId = req.params.id;
        
        if (!imageBase64) return res.status(400).json({ message: "No image provided" });

        // Convert base64 to parts for Gemini
        const parts = [
            { text: "Analyze this student exam snapshot. You are an AI Proctor. Check for: 1. Multiple people in frame. 2. Mobile phones, tablets, or cheat sheets. 3. Student looking away from camera for too long. If CLEAR violation found, describe it shortly and assign threat level 1-10. If clean, output 'CLEAN'. Return ONLY JSON format: { violation: string, threatLevel: number }." },
            { inlineData: { mimeType: 'image/jpeg', data: imageBase64.split(',')[1] } }
        ];

        const result = await visionModel.generateContent(parts);
        const responseText = result.response.text();
        
        // Safety: Extract JSON from potentially markdown-fenced response
        const jsonMatch = responseText.match(/\{.*\}/s);
        const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { violation: 'CLEAN', threatLevel: 0 };

        if (analysis.violation !== 'CLEAN' && analysis.threatLevel > 3) {
            console.warn(`[AI Proctor] VIOLATION by ${req.user.email} on Exam ${examId}: ${analysis.violation} (Threat: ${analysis.threatLevel})`);
            
            // Save log to the student's submission (upsert or append)
            await Submission.findOneAndUpdate(
                { exam: examId, student: req.user._id },
                { $push: { proctoringLogs: { violation: analysis.violation, threatLevel: analysis.threatLevel, timestamp: new Date() } } },
                { upsert: true } // In case they haven't "submitted" yet, we start the submission doc
            );
        }

        res.json(analysis);
    } catch (error) {
        console.error('[AI Proctor] Scan error:', error);
        res.status(500).json({ message: 'Proctoring analysis failed' });
    }
});

module.exports = router;
