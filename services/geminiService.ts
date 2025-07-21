
import type { ProcessingOptions, Transcript, OcrResult, TableResult, PptResult, ScanAnalysisResult, ChatMessage } from '../types';
import { getToken } from './authService';

const API_URL = '/api/ai'; // Use relative path for proxy

const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
    try {
        const token = getToken();
        if (!token) {
            throw new Error("Authentication token not found. Please log in again.");
        }

        const headers = new Headers(options.headers || {});
        headers.set('x-auth-token', token);

        // If body is FormData, don't set Content-Type, browser will do it with the boundary
        if (!(options.body instanceof FormData)) {
            headers.set('Content-Type', 'application/json');
        }

        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.msg || 'An error occurred with the AI service.');
        }
        return data;
    } catch (error: any) {
         if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new Error('Connection Error: Could not connect to the backend server. Please ensure it is running.');
        }
        throw error;
    }
};

export const generateTranscript = async (
    options: ProcessingOptions,
    file: File
): Promise<Transcript> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('options', JSON.stringify(options));
    
    return fetchWithAuth('/transcribe', {
        method: 'POST',
        body: formData,
    });
};

export const extractTextFromDocument = async (file: File): Promise<OcrResult> => {
    const formData = new FormData();
    formData.append('file', file);
    
    return fetchWithAuth('/ocr', {
        method: 'POST',
        body: formData,
    });
};

export const polishText = async (text: string): Promise<string> => {
    const data = await fetchWithAuth('/polish', {
        method: 'POST',
        body: JSON.stringify({ text }),
    });
    return data.polishedText;
};

export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
    const data = await fetchWithAuth('/translate', {
        method: 'POST',
        body: JSON.stringify({ text, targetLanguage }),
    });
    return data.translatedText;
};

export const extractTablesFromPdf = async (file: File): Promise<TableResult> => {
    const formData = new FormData();
    formData.append('file', file);
    
    return fetchWithAuth('/tables', {
        method: 'POST',
        body: formData,
    });
};

export const summarizePdfForPpt = async (file: File): Promise<PptResult> => {
    const formData = new FormData();
    formData.append('file', file);
    
    return fetchWithAuth('/ppt', {
        method: 'POST',
        body: formData,
    });
};

export const analyzeScannedPage = async (base64Image: string, imageWidth: number, imageHeight: number): Promise<ScanAnalysisResult> => {
    return fetchWithAuth('/analyze-scan', {
        method: 'POST',
        body: JSON.stringify({ base64Image, imageWidth, imageHeight }),
    });
};

export const sendMessage = async (history: ChatMessage[], systemInstruction: string, attachment?: File): Promise<string> => {
    const formData = new FormData();
    formData.append('history', JSON.stringify(history));
    formData.append('systemInstruction', systemInstruction);
    if (attachment) {
        formData.append('file', attachment);
    }

    const data = await fetchWithAuth('/chat', {
        method: 'POST',
        body: formData,
    });
    
    return data.text;
};