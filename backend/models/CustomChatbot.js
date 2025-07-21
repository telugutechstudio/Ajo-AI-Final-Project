const mongoose = require('mongoose');

const CustomChatbotSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    persona: {
        type: String,
        required: true
    },
    knowledgeBaseFileIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StoredFile'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

CustomChatbotSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) { delete ret._id; }
});


module.exports = mongoose.model('CustomChatbot', CustomChatbotSchema);
