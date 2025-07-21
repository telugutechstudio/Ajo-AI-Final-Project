const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const CustomChatbot = require('../models/CustomChatbot');
const StoredFile = require('../models/StoredFile');
const mongoose = require('mongoose');

// @route   GET /api/chatbots
// @desc    Get all chatbots for a user
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const chatbots = await CustomChatbot.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(chatbots);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/chatbots
// @desc    Save a new chatbot
// @access  Private
router.post('/', auth, async (req, res) => {
    const { name, persona, knowledgeBaseFileIds } = req.body;

    if (!name || !persona) {
        return res.status(400).json({ msg: 'Name and persona are required' });
    }

    try {
        const newChatbot = new CustomChatbot({
            name,
            persona,
            knowledgeBaseFileIds: knowledgeBaseFileIds || [],
            userId: req.user.id
        });

        const chatbot = await newChatbot.save();
        res.json(chatbot);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/chatbots/:id
// @desc    Delete a chatbot and its associated knowledge files
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const chatbot = await CustomChatbot.findById(req.params.id);

        if (!chatbot) {
            return res.status(404).json({ msg: 'Chatbot not found' });
        }

        // Make sure user owns the chatbot
        if (chatbot.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }
        
        // Start a session for transaction
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Delete associated knowledge base files
            if (chatbot.knowledgeBaseFileIds && chatbot.knowledgeBaseFileIds.length > 0) {
                await StoredFile.deleteMany({ _id: { $in: chatbot.knowledgeBaseFileIds } }).session(session);
            }

            // Delete the chatbot itself
            await CustomChatbot.findByIdAndDelete(req.params.id).session(session);
            
            await session.commitTransaction();
            session.endSession();

            res.json({ msg: 'Chatbot and associated files removed' });

        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error; // Rethrow to be caught by outer catch block
        }

    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Chatbot not found' });
        }
        res.status(500).send('Server Error');
    }
});

module.exports = router;
