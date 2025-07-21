const mongoose = require('mongoose');

const StoredFileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    fileName: {
        type: String,
        required: true
    },
    tool: {
        type: String,
        required: true
    },
    result: {
        type: mongoose.Schema.Types.Mixed, // Since result can be Transcript, OcrResult, etc.
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Mongoose's toJSON transform will automatically convert _id to id
StoredFileSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) { delete ret._id; }
});

module.exports = mongoose.model('StoredFile', StoredFileSchema);
