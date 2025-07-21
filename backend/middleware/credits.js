
const User = require('../models/User');
const { FREE_TIER_USAGE_LIMIT, TOOL_CREDIT_COSTS } = require('../config');

const checkCredits = (tool) => async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        
        if (user.isAdmin) {
            return next(); // Admins have unlimited access
        }

        const { subscription } = user;
        
        // --- Free Tier Logic ---
        if (subscription.tier === 'Free') {
            const usage = subscription.toolUsage.get(tool) || 0;
            if (usage >= FREE_TIER_USAGE_LIMIT) {
                return res.status(402).json({ msg: `You've reached the free limit for this tool. Please upgrade to continue.` });
            }
            // Increment usage
            subscription.toolUsage.set(tool, usage + 1);
            await user.save();
            return next();
        }

        // --- Pro/Business Tier Logic (Credit-based) ---
        const cost = TOOL_CREDIT_COSTS[tool] || 0;
        if (cost === 0) {
            return next(); // No cost for this tool
        }

        if (subscription.aiCredits !== Infinity && subscription.aiCredits < cost) {
            return res.status(402).json({ msg: `You need ${cost} AI credits, but you only have ${subscription.aiCredits}. Please upgrade your plan.` });
        }
        
        if (subscription.aiCredits !== Infinity) {
            subscription.aiCredits -= cost;
        }

        await user.save();
        next();

    } catch (err) {
        console.error('Credit check middleware error:', err);
        res.status(500).send('Server Error');
    }
};

module.exports = checkCredits;