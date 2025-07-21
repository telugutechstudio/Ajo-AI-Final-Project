

import { ADMIN_PASSWORD } from '../config';
import type { SubscriptionTier, User, AdminUserAnalytics, AuditLogEntry, Tool } from '../types';

// --- MOCK DATABASE ---

// Helper to simulate a user database
let mockUsers: (User & { password?: string; status: 'Active' | 'Inactive' | 'Pending'; registeredAt: string })[] = [
    { 
        id: 'user_admin',
        username: 'admin@ajoai.com', 
        password: ADMIN_PASSWORD,
        name: 'Admin User',
        isAdmin: true,
        subscription: { tier: 'Business', aiCredits: Infinity },
        status: 'Active',
        registeredAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        lastLogin: new Date(Date.now() - 3600000).toISOString(),
        loginCount: 15,
        timeSpent: 128,
        analysesCount: 20,
        reportsCount: 10
    },
    { 
        id: 'user_pro',
        username: 'pro@ajo.ai', 
        password: 'propassword123',
        name: 'Pro User',
        isAdmin: false,
        subscription: { tier: 'Pro', aiCredits: 350, toolUsage: {} },
        status: 'Active',
        registeredAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        lastLogin: new Date(Date.now() - 86400000).toISOString(),
        loginCount: 5,
        timeSpent: 45,
        analysesCount: 12,
        reportsCount: 3
    },
     { 
        id: 'user_free',
        username: 'free@ajo.ai', 
        password: 'freepassword',
        name: 'Free User',
        isAdmin: false,
        subscription: { tier: 'Free', aiCredits: 0, toolUsage: { 'SCRIBE': 1 } },
        status: 'Active',
        registeredAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        lastLogin: new Date(Date.now() - 86400000 * 2).toISOString(),
        loginCount: 2,
        timeSpent: 15,
        analysesCount: 1,
        reportsCount: 0
    },
    { 
        id: 'user_denied',
        username: 'denied@ajo.ai', 
        password: 'deniedpassword',
        name: 'Denied User',
        isAdmin: false,
        subscription: { tier: 'Free', aiCredits: 0, toolUsage: {} },
        status: 'Inactive',
        registeredAt: new Date(Date.now() - 86400000).toISOString(),
        lastLogin: '',
        loginCount: 0,
        timeSpent: 0,
        analysesCount: 0,
        reportsCount: 0
    },
    { 
        id: 'user_pending',
        username: 'pending@ajo.ai', 
        password: 'pendingpassword',
        name: 'Pending User',
        isAdmin: false,
        subscription: { tier: 'Free', aiCredits: 0, toolUsage: {} },
        status: 'Pending',
        registeredAt: new Date().toISOString(),
        lastLogin: '',
        loginCount: 0,
        timeSpent: 0,
        analysesCount: 0,
        reportsCount: 0
    },
];

let mockAuditLogs: AuditLogEntry[] = [
    { id: 'log1', timestamp: new Date(Date.now() - 10000).toISOString(), user: 'pro@ajo.ai', action: 'USE_TOOL', details: '{"tool":"SCRIBE","fileName":"meeting.mp4"}' },
    { id: 'log2', timestamp: new Date(Date.now() - 3600000).toISOString(), user: 'admin@ajoai.com', action: 'LOGIN', details: '{}' },
    { id: 'log3', timestamp: new Date(Date.now() - 7200000).toISOString(), user: 'pro@ajo.ai', action: 'CHAT_MESSAGE', details: '{"role":"user"}' },
    { id: 'log4', timestamp: new Date(Date.now() - 7300000).toISOString(), user: 'pending@ajo.ai', action: 'REGISTER_USER', details: '{}' },
];

// --- MOCK SERVICE IMPLEMENTATION ---

// Helper for logging
const addLog = (userEmail: string, actionType: string, details: Record<string, any>): void => {
    mockAuditLogs.push({
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: userEmail,
        action: actionType,
        details: JSON.stringify(details),
    });
     if(actionType === 'USE_TOOL') {
        const user = mockUsers.find(u => u.username === userEmail);
        if (user) user.analysesCount++;
    }
};

const simulateDelay = (ms: number) => new Promise(res => setTimeout(res, ms));

// --- Subscription & Billing ---
export const requestSubscriptionUpgrade = async (email: string, tier: SubscriptionTier): Promise<{ message: string }> => {
    await simulateDelay(300);
    const user = mockUsers.find(u => u.username === email);
    if (!user) {
        throw new Error("User not found.");
    }
    // In a real scenario, this would create a request. Here, we just log it.
    addLog(email, 'REQUEST_UPGRADE', { tier });
    return { message: 'Upgrade request submitted successfully.' };
};

// --- MOCK ADMIN & LOGGING (To be replaced by backend calls) ---
export const getAuditLog = async (): Promise<AuditLogEntry[]> => {
    await simulateDelay(300);
    return [...mockAuditLogs].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};


// --- Activity Logging ---
export const logActivity = async (userEmail: string, actionType: string, details: Record<string, any>): Promise<void> => {
    await simulateDelay(50);
    addLog(userEmail, actionType, details);
};

export const logReportGeneration = async (username: string): Promise<void> => {
    await simulateDelay(50);
    const user = mockUsers.find(u => u.username === username);
    if (user) {
        user.reportsCount++;
        addLog(username, 'GENERATE_REPORT', {});
    }
};

export const addSessionTime = async (username: string, minutes: number): Promise<void> => {
    await simulateDelay(50);
    const user = mockUsers.find(u => u.username === username);
    if (user) {
        user.timeSpent += minutes;
    }
};