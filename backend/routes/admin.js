const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const User = require('../models/User');
const { PLANS } = require('../config');

// Middleware for all admin routes
router.use(auth, admin);

// @route   GET /api/admin/users
// @desc    Get all users for analytics panel
// @access  Private (Admin)
router.get('/users', async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ registeredAt: -1 });
        // Map to AdminUserAnalytics format
        const analyticsData = users.map(u => ({
            id: u.id,
            username: u.email,
            name: u.name,
            status: u.status,
            subscriptionRequest: u.subscriptionRequest, // Include subscription request
            lastLogin: u.lastLogin,
            loginCount: u.loginCount,
            timeSpent: u.timeSpent,
            analysesCount: u.analysesCount,
            reportsCount: u.reportsCount,
        }));
        res.json(analyticsData);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/admin/users/:id/status
// @desc    Update a user's status (approve, deny, deactivate, reactivate)
// @access  Private (Admin)
router.put('/users/:id/status', async (req, res) => {
    const { status } = req.body;
    const validStatuses = ['Active', 'Inactive'];

    if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ msg: 'Invalid status provided.' });
    }

    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        if (user.isAdmin) {
             return res.status(403).json({ msg: 'Cannot change the status of an admin account.' });
        }

        user.status = status;
        await user.save();

        res.json({ msg: `User status updated to ${status}` });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/admin/users/:id/subscription
// @desc    Approve or deny a subscription request
// @access  Private (Admin)
router.put('/users/:id/subscription', async (req, res) => {
    const { action } = req.body; // 'approve' or 'deny'

    try {
        const user = await User.findById(req.params.id);
        if (!user || !user.subscriptionRequest) {
            return res.status(404).json({ msg: 'User or subscription request not found' });
        }

        if (action === 'approve') {
            const requestedTier = user.subscriptionRequest.tier;
            const planDetails = PLANS[requestedTier];

            if (!planDetails) {
                 return res.status(400).json({ msg: 'Invalid subscription tier requested.' });
            }

            user.subscription.tier = requestedTier;
            user.subscription.aiCredits = planDetails.aiCredits;
        }

        // For both approve and deny, we remove the request
        user.subscriptionRequest = undefined;
        await user.save();

        res.json({ msg: `Subscription request has been ${action}d.` });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user
// @access  Private (Admin)
router.delete('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        if (user.isAdmin) {
             return res.status(403).json({ msg: 'Cannot delete an admin account.' });
        }

        // Add logic here to delete user's files, chatbots etc. if needed
        // For now, just deleting the user.

        await User.findByIdAndDelete(req.params.id);

        res.json({ msg: 'User permanently deleted.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;