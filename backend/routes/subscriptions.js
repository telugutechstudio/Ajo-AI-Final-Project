const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// @route   POST /api/subscriptions/request
// @desc    User requests a subscription upgrade
// @access  Private
router.post('/request', auth, async (req, res) => {
    const { tier } = req.body;

    if (!tier || !['Pro', 'Business'].includes(tier)) {
        return res.status(400).json({ msg: 'Invalid subscription tier.' });
    }

    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found.' });
        }

        if (user.subscriptionRequest) {
            return res.status(400).json({ msg: 'You already have a pending upgrade request.' });
        }
        
        if (user.subscription.tier === tier) {
            return res.status(400).json({ msg: `You are already on the ${tier} plan.` });
        }

        user.subscriptionRequest = { tier, requestedAt: new Date() };
        await user.save();

        res.json({ msg: 'Subscription upgrade request submitted successfully.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
