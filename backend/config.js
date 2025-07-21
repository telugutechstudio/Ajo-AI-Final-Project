// This file holds all backend configuration.

const FREE_TIER_USAGE_LIMIT = 2; // Each AI tool can be used 2 times for free.

// Define the credit cost for each AI tool for Pro/Business tiers
const TOOL_CREDIT_COSTS = {
    SCRIBE: 25, // Per file
    OCR: 5, // Per file
    PDF_TO_WORD: 5, // Same as OCR
    PDF_TO_EXCEL: 10, // More complex extraction
    PDF_TO_PPT: 15, // Summarization is costly
    AI_CHAT: 1, // Per message
    AI_CHATBOT_BUILDER: 20, // One-time cost for creation
    AI_POLISH: 2, // Per polish action
    AI_TRANSLATE: 3, // Per translation
    LIVE_TRANSLATE: 5, // Per translation chunk
    // Non-AI tools have no cost
    IMAGES_TO_PDF: 0,
    MERGE_PDF: 0,
    SPLIT_PDF: 0,
    COMPRESS_PDF: 0,
    PDF_TO_IMAGE: 0,
    SCAN_TO_PDF: 1, // Minimal cost for analysis
    KNOWLEDGE_DOCUMENT: 2, // Cost for processing knowledge files
};

// Define the available plans for the backend to reference
const PLANS = {
    Free: {
        name: 'Free',
        price: '₹0/mo',
        features: ['2 uses per AI tool', 'Basic PDF Tools', 'Standard AI Chat', 'Limited File Storage'],
        aiCredits: 0,
    },
    Pro: {
        name: 'Pro',
        price: '₹299/mo',
        features: ['500 AI Credits/mo', 'All PDF Tools', 'Advanced AI Chat', '5GB File Storage'],
        aiCredits: 500,
    },
    Business: {
        name: 'Business',
        price: '₹999/mo',
        features: ['Unlimited AI Credits', 'All PDF Tools & API Access', 'Priority Support', '20GB File Storage'],
        aiCredits: Infinity,
    },
};

module.exports = { PLANS, TOOL_CREDIT_COSTS, FREE_TIER_USAGE_LIMIT };