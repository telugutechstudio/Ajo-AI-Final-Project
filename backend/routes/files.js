const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const StoredFile = require('../models/StoredFile');

// @route   GET /api/files
// @desc    Get all files for a user
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const files = await StoredFile.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(50);
        res.json(files);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/files
// @desc    Save a new file
// @access  Private
router.post('/', auth, async (req, res) => {
    const { fileName, tool, result } = req.body;

    if (!fileName || !tool || !result) {
        return res.status(400).json({ msg: 'Please provide all file data' });
    }

    try {
        const newFile = new StoredFile({
            fileName,
            tool,
            result,
            userId: req.user.id
        });

        const file = await newFile.save();
        res.json(file);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/files/:id
// @desc    Delete a file
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        let file = await StoredFile.findById(req.params.id);

        if (!file) {
            return res.status(404).json({ msg: 'File not found' });
        }

        // Make sure user owns the file
        if (file.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        await StoredFile.findByIdAndDelete(req.params.id);

        res.json({ msg: 'File removed' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'File not found' });
        }
        res.status(500).send('Server Error');
    }
});

module.exports = router;
