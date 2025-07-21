
const mongoose = require('mongoose');

const UserSubscriptionSchema = new mongoose.Schema({
    tier: { type: String, enum: ['Free', 'Pro', 'Business'], default: 'Free' },
    aiCredits: { type: Number, default: 0 },
    toolUsage: { type: Map, of: Number, default: {} }
}, { _id: false });

const SubscriptionRequestSchema = new mongoose.Schema({
    tier: { type: String, enum: ['Pro', 'Business'], required: true },
    requestedAt: { type: Date, default: Date.now }
}, { _id: false });


const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    mobile: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    status: { type: String, enum: ['Active', 'Inactive', 'Pending'], default: 'Pending' },
    subscription: { type: UserSubscriptionSchema, default: () => ({ tier: 'Free', aiCredits: 0, toolUsage: {} }) },
    subscriptionRequest: { type: SubscriptionRequestSchema, required: false },
    // Analytics
    registeredAt: { type: Date, default: Date.now },
    lastLogin: { type: Date },
    loginCount: { type: Number, default: 0 },
    timeSpent: { type: Number, default: 0 }, // in minutes
    analysesCount: { type: Number, default: 0 },
    reportsCount: { type: Number, default: 0 },
});

module.exports = mongoose.model('User', UserSchema);