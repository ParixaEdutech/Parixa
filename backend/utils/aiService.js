const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');
const pdfParse = require('pdf-parse');

// The AI generator setup
const apiKey = process.env.GEMINI_API_KEY;
// The initialization depends on the API key, so we check just in case.
const getModel = () => {
    if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured in .env");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // We enforce JSON output strictly so the frontend gets an array
    return genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: SchemaType.ARRAY,
                description: "A list of multiple choice questions generated from the text.",
                items: {
                    type: SchemaType.OBJECT,
                    properties: {
                        text: { type: SchemaType.STRING, description: "The question text" },
                        options: { 
                            type: SchemaType.ARRAY, 
                            items: { type: SchemaType.STRING },
                            description: "Exactly 4 options"
                        },
                        correctAnswer: { type: SchemaType.INTEGER, description: "Index of correct option (0, 1, 2, or 3)" },
                        difficulty: { type: SchemaType.STRING, description: "easy, medium, or hard" },
                    },
                    required: ["text", "options", "correctAnswer", "difficulty"],
                },
            },
        }
    });
};

const aiService = {
    // 1. Convert PDF to raw text
    extractTextFromPDF: async (pdfBuffer) => {
        try {
            const data = await pdfParse(pdfBuffer);
            return data.text;
        } catch (err) {
            console.error('PDF parsing error:', err);
            throw new Error('Failed to read PDF document');
        }
    },

    // 2. Feed text into Gemini to generate highly specific questions
    generateQuestions: async (textContext, topic, numSets, easyCount, mediumCount, hardCount) => {
        const model = getModel();
        
        // Over-generate by 20% for the Swap Buffer mechanics
        const easyTarget = Math.ceil(easyCount * 1.2);
        const mediumTarget = Math.ceil(mediumCount * 1.2);
        const hardTarget = Math.ceil(hardCount * 1.2);

        const totalEasy = easyTarget * numSets;
        const totalMedium = mediumTarget * numSets;
        const totalHard = hardTarget * numSets;
        const totalCount = totalEasy + totalMedium + totalHard;

        const prompt = `
            You are an expert exam setter. Using ONLY the source text provided below, generate exactly ${totalCount} multiple choice questions about "${topic}".
            - You MUST generate exactly ${totalEasy} questions marked as "easy" difficulty.
            - You MUST generate exactly ${totalMedium} questions marked as "medium" difficulty.
            - You MUST generate exactly ${totalHard} questions marked as "hard" difficulty.
            - Ensure options are plausible but only one is mathematically/factually correct based on the text.
            - Do not include questions that cannot be answered referencing the provided text.

            SOURCE TEXT:
            ${textContext.substring(0, 50000)} // Limiting length purely for safety against huge files
        `;

        try {
            const result = await model.generateContent(prompt);
            const responseText = result.response.text();
            
            // Because we used responseSchema, Gemini guarantees this will parse as a valid JSON array
            let rawQuestions = JSON.parse(responseText);

            // POST-PROCESSING: Neatly divide the generated questions strictly across the requested sets
            // To ensure Set 1 gets exactly *easyCount* easy questions, etc.
            const distributedQuestions = [];
            // Track how many questions of each difficulty we have assigned to each set
            const assignmentCounts = {};
            for(let i = 1; i <= numSets; i++) assignmentCounts[i] = { easy: 0, medium: 0, hard: 0 };
            
            const tracking = { easy: 1, medium: 1, hard: 1 };

            rawQuestions.forEach((q) => {
                // Determine which set this goes to by round-robin within its difficulty tier
                const assignedSet = tracking[q.difficulty];
                
                // Check if this specific Set has already hit its main quota for this difficulty
                let isReserve = false;
                if (q.difficulty === 'easy' && assignmentCounts[assignedSet].easy >= easyCount) isReserve = true;
                if (q.difficulty === 'medium' && assignmentCounts[assignedSet].medium >= mediumCount) isReserve = true;
                if (q.difficulty === 'hard' && assignmentCounts[assignedSet].hard >= hardCount) isReserve = true;

                // Increment the counter for what we just placed inside this set
                assignmentCounts[assignedSet][q.difficulty]++;

                distributedQuestions.push({
                    ...q,
                    setNumber: assignedSet,
                    isReserve: isReserve,
                    // Placeholder local ID for the React frontend tables
                    id: Date.now() + Math.random().toString(36).substring(7)
                });

                // Advance the round-robin counter for this difficulty
                tracking[q.difficulty] = tracking[q.difficulty] >= numSets ? 1 : tracking[q.difficulty] + 1;
            });

            // Re-sort them nicely by Set and then Difficulty before returning
            return distributedQuestions.sort((a, b) => a.setNumber - b.setNumber);
        } catch (error) {
            console.error('Gemini API Error (Fallback to Mock Data Activated):', error.message);
            
            // Intelligent mock fallback mimicking exact requests + 20% Reserve Logic
            const fallbackQuestions = [];
            const easyTarget = Math.ceil(easyCount * 1.2);
            const mediumTarget = Math.ceil(mediumCount * 1.2);
            const hardTarget = Math.ceil(hardCount * 1.2);

            for(let setNum = 1; setNum <= numSets; setNum++) {
                // Add Easy
                for(let e=0; e < easyTarget; e++){
                    fallbackQuestions.push({
                        id: Date.now() + Math.random().toString(36).substring(7),
                        setNumber: setNum, text: `[ParixaAI Fallback] Easy Demo Question ${e+1} for ${topic}`,
                        options: ['A', 'B', 'C', 'D'], correctAnswer: 0, difficulty: 'easy',
                        isReserve: e >= easyCount
                    });
                }
                // Add Medium
                for(let m=0; m < mediumTarget; m++){
                    fallbackQuestions.push({
                        id: Date.now() + Math.random().toString(36).substring(7),
                        setNumber: setNum, text: `[ParixaAI Fallback] Medium Demo Question ${m+1} for ${topic}`,
                        options: ['A', 'B', 'C', 'D'], correctAnswer: 1, difficulty: 'medium',
                        isReserve: m >= mediumCount
                    });
                }
                // Add Hard
                for(let h=0; h < hardTarget; h++){
                    fallbackQuestions.push({
                        id: Date.now() + Math.random().toString(36).substring(7),
                        setNumber: setNum, text: `[ParixaAI Fallback] Hard Demo Question ${h+1} for ${topic}`,
                        options: ['A', 'B', 'C', 'D'], correctAnswer: 2, difficulty: 'hard',
                        isReserve: h >= hardCount
                    });
                }
            }

            return fallbackQuestions.sort((a, b) => a.setNumber - b.setNumber);
        }
    },

    // 3. Extract, Solve & Classify from an uploaded Question Bank PDF
    extractQuestionsFromBank: async (textContext, topic, numSets, easyCount, mediumCount, hardCount) => {
        const model = getModel();
        
        // Over-generate by 20% for the Swap Buffer mechanics
        const easyTarget = Math.ceil(easyCount * 1.2);
        const mediumTarget = Math.ceil(mediumCount * 1.2);
        const hardTarget = Math.ceil(hardCount * 1.2);

        const totalEasy = easyTarget * numSets;
        const totalMedium = mediumTarget * numSets;
        const totalHard = hardTarget * numSets;
        const totalCount = totalEasy + totalMedium + totalHard;

        const prompt = `
            You are an expert exam extraction AI. The user has uploaded raw text extracted from a PDF Question Bank or previous Exam Paper.
            
            YOUR MISSION:
            1. Find and extract AT LEAST ${totalCount} valid multiple choice questions from the provided text.
            2. For each extracted question, you MUST determine the Correct Answer. If an answer key is provided in the text, use it. If not, use your vast intellect to solve the question and mark the correct option.
            3. You must classify the difficulty of the questions you extract based on complexity.
            
            We require exactly this distribution from the extracted questions:
            - EXACTLY ${totalEasy} questions classified as "easy".
            - EXACTLY ${totalMedium} questions classified as "medium".
            - EXACTLY ${totalHard} questions classified as "hard".
            
            NOTE: If the source text does not have enough questions, you may generate new high-quality questions in the exact style of the uploaded questions to comfortably meet the quota.

            SOURCE QUESTION BANK RAW TEXT:
            ${textContext.substring(0, 50000)}
        `;

        try {
            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: apiSchema,
                    temperature: 0.1 // Extremely low temperature to force strict extraction rather than creative hallucination
                }
            });

            const responseText = result.response.text();
            let rawQuestions = JSON.parse(responseText);

            // POST-PROCESSING: Neatly divide the extracted questions strictly across the requested sets
            const distributedQuestions = [];
            const assignmentCounts = {};
            for(let i = 1; i <= numSets; i++) assignmentCounts[i] = { easy: 0, medium: 0, hard: 0 };
            
            const tracking = { easy: 1, medium: 1, hard: 1 };

            rawQuestions.forEach((q) => {
                const assignedSet = tracking[q.difficulty];
                
                let isReserve = false;
                if (q.difficulty === 'easy' && assignmentCounts[assignedSet].easy >= easyCount) isReserve = true;
                if (q.difficulty === 'medium' && assignmentCounts[assignedSet].medium >= mediumCount) isReserve = true;
                if (q.difficulty === 'hard' && assignmentCounts[assignedSet].hard >= hardCount) isReserve = true;

                assignmentCounts[assignedSet][q.difficulty]++;

                distributedQuestions.push({
                    ...q,
                    setNumber: assignedSet,
                    isReserve: isReserve,
                    id: Date.now() + Math.random().toString(36).substring(7)
                });

                tracking[q.difficulty] = tracking[q.difficulty] >= numSets ? 1 : tracking[q.difficulty] + 1;
            });

            return distributedQuestions.sort((a, b) => a.setNumber - b.setNumber);
        } catch (error) {
            console.error('Gemini Extraction Error:', error.message);
            throw new Error('Failed to cleanly extract and classify the required number of questions from the PDF. The file may be unreadable or empty.');
        }
    }
};

module.exports = aiService;
