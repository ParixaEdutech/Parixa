const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const { initCronJobs } = require('./utils/cronJobs');

const mongoose = require('mongoose');

const app = express();

// Load environment variables
dotenv.config();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Database and Seeding Middleware (crucial for Serverless cold-starts on Vercel)
let isSeeded = false;
app.use(async (req, res, next) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            await connectDB();
        }

        if (!isSeeded) {
            const User = require('./models/User');
            let admin = await User.findOne({ email: 'admin@parixa.com' });
            if (!admin) {
                await User.create({
                    name: 'System Admin',
                    email: 'admin@parixa.com',
                    password: 'admin',
                    role: 'admin'
                });
                console.log('Default Admin Account seeded to database');
            }

            // Start local cron jobs for development
            initCronJobs();
            isSeeded = true;
        }
        next();
    } catch (err) {
        console.error('Database connection/seeding failed:', err);
        res.status(500).json({ message: 'Database initialization failed' });
    }
});

// Main App Routes
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/exams', require('./routes/examRoutes'));

// Vercel Cron Trigger (Requires CRON_SECRET header for security)
app.get('/api/cron', async (req, res) => {
    // Check if called by Vercel Cron or with a secret
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.authorization;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const { checkReminders } = require('./utils/cronJobs');
        const result = await checkReminders();
        res.json({ message: 'Cron job executed successfully', result });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// For local development
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Secure Server running on port ${PORT}`));
}

module.exports = app;
