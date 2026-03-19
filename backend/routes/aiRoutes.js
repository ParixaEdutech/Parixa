const express = require('express');
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const aiService = require('../utils/aiService');

const router = express.Router();

const { aiLimiter } = require('../middleware/rateLimiter');

// Memory storage for safety: we don't save teacher PDFs to disk. 
// We hold it in RAM, parse it instantly, then discard.
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB Upload Limit
});

// Route: POST /api/ai/generate-text
// Desc : Generates questions straight from raw syllabus text pasted by teacher
router.post('/generate-text', protect, aiLimiter, async (req, res) => {
    try {
        const { text, topic, numSets = 3, easyCount = 3, mediumCount = 4, hardCount = 3 } = req.body;
        
        if (!text || text.length < 50) return res.status(400).json({ message: 'Provide more context text.' });
        if (!topic) return res.status(400).json({ message: 'Provide a topic name.' });

        const setsOfQuestions = await aiService.generateQuestions(text, topic, parseInt(numSets), parseInt(easyCount), parseInt(mediumCount), parseInt(hardCount));
        
        // This array of objects goes back to the frontend Draft Box (Before they click save!)
        res.json(setsOfQuestions);
    } catch (err) {
        console.error('AI text error:', err);
        res.status(500).json({ message: 'Failed to process AI question generation.' });
    }
});

// Route: POST /api/ai/generate-pdf
// Desc : Exactly the same process, but handles extracting the text out of the file first!
router.post('/generate-pdf', protect, aiLimiter, upload.single('document'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No PDF document uploaded.' });

        const topic = req.body.topic || 'General Exam';
        const numSets = parseInt(req.body.numSets) || 3;
        const easyCount = parseInt(req.body.easyCount) || 3;
        const mediumCount = parseInt(req.body.mediumCount) || 4;
        const hardCount = parseInt(req.body.hardCount) || 3;

        // Step 1: Use pdf-parse on the memory buffer
        const extractedText = await aiService.extractTextFromPDF(req.file.buffer);

        // Step 2: Push it straight into the Gemini pipeline and distribute into sets
        const setsOfQuestions = await aiService.extractQuestionsFromBank(extractedText, topic, numSets, easyCount, mediumCount, hardCount);

        res.json(setsOfQuestions);
    } catch (err) {
        console.error('AI PDF error:', err);
        res.status(500).json({ message: err.message || 'Failed to process PDF' });
    }
});

module.exports = router;
