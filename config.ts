
import type { SubscriptionTier, Tool } from './types';

// This is a mock password for the mock admin user.
// In a real application, this should never be stored in frontend code.
export const ADMIN_PASSWORD = 'Mandava@1234';

// Define the available plans
export const PLANS: Record<SubscriptionTier, { name: string; price: string; features: string[], aiCredits: number }> = {
    Free: {
        name: 'Free',
        price: '₹0/mo',
        features: ['2 uses per AI tool', 'Basic PDF Tools', 'Standard AI Chat', 'Limited File Storage'],
        aiCredits: 0, // Credits are not used for Free tier, replaced by usage limit
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

// Define the credit cost for each AI tool for Pro/Business tiers
// This is duplicated from backend/config.js for frontend display purposes
export const TOOL_CREDIT_COSTS: { [key in Tool]?: number } = {
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