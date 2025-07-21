
import type { User, StoredFile, Tool, StoredFileResult, AdminUserAnalytics, CustomChatbot, AuditLogEntry, SubscriptionTier } from '../types';
import * as googleSheetService from './googleSheetService';

const API_URL = '/api'; // Use relative path for proxy

const SESSION_KEY = 'ajo_ai_technologies_session'; // Will store { token, user }

// --- SESSION MANAGEMENT ---

export const logout = (): void => {
    localStorage.removeItem(SESSION_KEY);
};

export const getCurrentUser = (): User | null => {
    try {
        const session = localStorage.getItem(SESSION_KEY);
        if (!session) return null;
        const { user } = JSON.parse(session);
        return user || null;
    } catch (e) {
        console.error("Failed to parse session from localStorage", e);
        return null;
    }
};

export const getToken = (): string | null => {
    try {
        const session = localStorage.getItem(SESSION_KEY);
        if (!session) return null;
        const { token } = JSON.parse(session);
        return token || null;
    } catch {
        return null;
    }
}

export const updateCurrentUser = (user: User): void => {
    const token = getToken();
    localStorage.setItem(SESSION_KEY, JSON.stringify({ token, user }));
};

const handleFetchError = (error: any) => {
    if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Connection Error: Could not connect to the backend server. Please ensure it is running.');
    }
    throw error;
};


// Fetches the latest user data from the backend and updates the session
export const refreshUser = async (): Promise<User | null> => {
    const token = getToken();
    if (!token) return null;

    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            headers: { 'x-auth-token': token },
        });

        if (!response.ok) {
            if (response.status === 401) logout();
            return null;
        }

        const user: User = await response.json();
        updateCurrentUser(user);
        return user;
    } catch (e) {
        handleFetchError(e);
        return null; // Should not be reached due to throw, but for type safety
    }
};


export const register = async (userData: { name: string; mobile: string; email: string; password: string; }): Promise<{ msg: string }> => {
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.msg || 'Registration failed');
        }

        return data;
    } catch (error: any) {
        handleFetchError(error);
        throw error; // For type safety
    }
};

export const loginWithEmailAndPassword = async (email: string, password: string): Promise<User> => {
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.msg || 'Login failed');
        }

        const { token, user } = data;
        
        if (!token || !user) {
            throw new Error('Invalid response from server');
        }
        
        localStorage.setItem(SESSION_KEY, JSON.stringify({ token, user }));
        
        return user as User;
    } catch (error: any) {
        handleFetchError(error);
        throw error; // For type safety
    }
};


// --- PROFILE MANAGEMENT ---
export const updateUserDetails = async (name: string, mobile: string): Promise<User> => {
    try {
        const token = getToken();
        if (!token) throw new Error("Authentication error.");

        const response = await fetch(`${API_URL}/profile/details`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token,
            },
            body: JSON.stringify({ name, mobile }),
        });

        const updatedUser = await response.json();
        if (!response.ok) {
            throw new Error(updatedUser.msg || 'Failed to update details.');
        }
        
        updateCurrentUser(updatedUser); // Update local session
        return updatedUser;
    } catch (error) {
        handleFetchError(error);
        throw error;
    }
};

export const updatePassword = async (currentPassword: string, newPassword: string): Promise<{ msg: string }> => {
    try {
        const token = getToken();
        if (!token) throw new Error("Authentication error.");

        const response = await fetch(`${API_URL}/profile/password`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token,
            },
            body: JSON.stringify({ currentPassword, newPassword }),
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.msg || 'Failed to update password.');
        }
        return data;
    } catch (error) {
        handleFetchError(error);
        throw error;
    }
};


// --- FILE MANAGEMENT ---

export const saveFile = async (data: { fileName: string; tool: Tool; result: StoredFileResult }): Promise<StoredFile> => {
    try {
        const token = getToken();
        if (!token) throw new Error("Authentication error. Please log in again.");

        const response = await fetch(`${API_URL}/files`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token,
            },
            body: JSON.stringify(data),
        });

        const savedFile = await response.json();
        if (!response.ok) {
            throw new Error(savedFile.msg || 'Failed to save file.');
        }
        return savedFile;
    } catch (error) {
        handleFetchError(error);
        throw error;
    }
};

export const getUserFiles = async (): Promise<StoredFile[]> => {
    try {
        const token = getToken();
        if (!token) return [];

        const response = await fetch(`${API_URL}/files`, {
            headers: { 'x-auth-token': token },
        });

        if (response.status === 401) {
            logout();
            window.location.reload(); // Force re-login if token is invalid
            return [];
        }
        if (!response.ok) {
            throw new Error('Could not fetch files.');
        }
        return await response.json();
    } catch (error) {
        handleFetchError(error);
        return [];
    }
};

export const deleteFile = async (fileId: string): Promise<void> => {
    try {
        const token = getToken();
        if (!token) throw new Error("Authentication error.");

        const response = await fetch(`${API_URL}/files/${fileId}`, {
            method: 'DELETE',
            headers: { 'x-auth-token': token },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.msg || 'Failed to delete file.');
        }
    } catch (error) {
        handleFetchError(error);
    }
};

// --- CHATBOT MANAGEMENT ---

export const saveChatbot = async (data: { name: string; persona: string; knowledgeBaseFileIds: string[] }): Promise<CustomChatbot> => {
    try {
        const token = getToken();
        if (!token) throw new Error("Authentication error.");

        const response = await fetch(`${API_URL}/chatbots`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token,
            },
            body: JSON.stringify(data),
        });
        
        const savedBot = await response.json();
        if (!response.ok) {
            throw new Error(savedBot.msg || 'Failed to save chatbot.');
        }
        return savedBot;
    } catch (error) {
        handleFetchError(error);
        throw error;
    }
};

export const getUserChatbots = async (): Promise<CustomChatbot[]> => {
    try {
        const token = getToken();
        if (!token) return [];

        const response = await fetch(`${API_URL}/chatbots`, {
            headers: { 'x-auth-token': token },
        });

        if (response.status === 401) {
            logout();
            window.location.reload();
            return [];
        }
        if (!response.ok) {
            throw new Error('Could not fetch chatbots.');
        }
        return await response.json();
    } catch (error) {
        handleFetchError(error);
        return [];
    }
};

export const deleteChatbot = async (chatbotId: string): Promise<void> => {
    try {
        const token = getToken();
        if (!token) throw new Error("Authentication error.");

        const response = await fetch(`${API_URL}/chatbots/${chatbotId}`, {
            method: 'DELETE',
            headers: { 'x-auth-token': token },
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.msg || 'Failed to delete chatbot.');
        }
    } catch (error) {
        handleFetchError(error);
    }
};


// --- ADMIN & SUBSCRIPTION FUNCTIONS ---

const fetchWithAdminAuth = async (endpoint: string, options: RequestInit = {}) => {
    try {
        const token = getToken();
        if (!token) throw new Error("Unauthorized: Admin token not found.");
        
        const headers = new Headers(options.headers || {});
        headers.set('x-auth-token', token);
        headers.set('Content-Type', 'application/json');

        const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.msg || 'An admin operation failed.');
        }
        return data;
    } catch (error) {
        handleFetchError(error);
        throw error;
    }
};

export const getAdminAnalytics = async (): Promise<AdminUserAnalytics[]> => {
    return fetchWithAdminAuth('/admin/users');
};

export const updateUserStatus = async (userId: string, status: 'Active' | 'Inactive'): Promise<void> => {
    await fetchWithAdminAuth(`/admin/users/${userId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
    });
};

export const deleteUserByAdmin = async (userId: string): Promise<void> => {
    await fetchWithAdminAuth(`/admin/users/${userId}`, {
        method: 'DELETE',
    });
};

export const requestSubscriptionUpgrade = async (tier: SubscriptionTier): Promise<{ msg: string }> => {
    try {
        const token = getToken();
        if (!token) throw new Error("Authentication error.");

        const response = await fetch(`${API_URL}/subscriptions/request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token,
            },
            body: JSON.stringify({ tier }),
        });
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.msg || 'Failed to request upgrade.');
        }
        return data;
    } catch (error) {
        handleFetchError(error);
        throw error;
    }
};

export const approveSubscription = async (userId: string): Promise<void> => {
    await fetchWithAdminAuth(`/admin/users/${userId}/subscription`, {
        method: 'PUT',
        body: JSON.stringify({ action: 'approve' }),
    });
};

export const denySubscription = async (userId: string): Promise<void> => {
     await fetchWithAdminAuth(`/admin/users/${userId}/subscription`, {
        method: 'PUT',
        body: JSON.stringify({ action: 'deny' }),
    });
};


// --- LEGACY/MOCK FUNCTIONS (to be phased out) ---

export const getAuditLogByAdmin = async (): Promise<AuditLogEntry[]> => {
    // This is still mocked as it hasn't been migrated to the backend.
    return googleSheetService.getAuditLog();
};

export const logReportGeneration = async (): Promise<void> => {
    const user = getCurrentUser();
    if (user) {
        // This should be a backend call in a real app, but for now it's mocked.
        // The backend already handles credit deduction, this is for analytics.
        // await googleSheetService.logReportGeneration(user.username);
    }
};

export const logSessionTime = async (minutes: number): Promise<void> => {
    const user = getCurrentUser();
    if (user && minutes > 0) {
        // This should be a backend call.
        // await googleSheetService.addSessionTime(user.username, minutes);
    }
};