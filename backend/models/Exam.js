const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String
    },
    subject: {
        type: String,
        required: true
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    startTime: {
        type: Date,
        required: true
    },
    durationMinutes: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'completed'],
        default: 'draft'
    },
    // We can assign this exam to a specific group or array of students later.
    // For now, if it's "published", assigned students can see it.
    assignedStudents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Exam', examSchema);
