const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const { initCronJobs } = require('./utils/cronJobs');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB().then(async () => {
    // Seed default Admin if it doesn't exist
    try {
        const User = require('./models/User');
        const adminExists = await User.findOne({ email: 'admin@parixa.com' });
        if (!adminExists) {
            await User.create({
                name: 'System Admin',
                email: 'admin@parixa.com',
                password: 'admin',
                role: 'admin'
            });
            console.log('Default Admin Account seeded to database');
        }
        
        // Start Background Reminders
        initCronJobs();
    } catch (err) {
        console.error('Error seeding admin account:', err);
    }
});

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

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
