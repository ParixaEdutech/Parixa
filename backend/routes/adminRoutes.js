const express = require('express');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const router = express.Router();

const { protect, adminOnly } = require('../middleware/authMiddleware');

// Route: POST /api/admin/register
// Desc : Admin registers a new student or teacher
// Note : Protected so only authenticated Admins can access it
router.post('/register', protect, adminOnly, async (req, res) => {
    try {
        const { name, email, role } = req.body;

        // Validation limits to student or teacher
        if (!['student', 'teacher'].includes(role)) {
            return res.status(400).json({ message: 'Role must be student or teacher.' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'A user with this email already exists.' });
        }

        // The password strategy based on user request
        let rawPassword;
        if (role === 'student') {
            rawPassword = 'student123';
        } else if (role === 'teacher') {
            // Generate an 8 character random string for teachers
            rawPassword = Math.random().toString(36).slice(-8);
        }

        // Send email with the raw password before we hash it and save to MongoDB
        const subject = `Welcome to the Platform - Your Current Initial Credentials!`;
        const text = `Hello ${name},\n\nYou have been registered as a ${role}.\n\nYour login email is: ${email}\nYour initial password is: ${rawPassword}\n\nPlease log in and change your password in your profile immediately.`;
        
        // Wait for the email to send before continuing
        await sendEmail({ to: email, subject, text });

        // Create the user in MongoDB. Upon creation, the internal User model 
        // hook will use bcrypt to ENCRYPT 'rawPassword' before it's actually recorded.
        const user = await User.create({
            name,
            email,
            password: rawPassword,
            role,
        });

        res.status(201).json({
            message: `${role} registered successfully. Credentials sent via email.`,
            userId: user._id,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error creating user' });
    }
});

module.exports = router;
