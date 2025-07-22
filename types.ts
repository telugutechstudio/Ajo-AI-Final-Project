
export enum TranscriptionMode {
  CHEETAH = 'Cheetah (Fastest)',
  DOLPHIN = 'Dolphin (Balanced)',
  WHALE = 'Whale (Most Accurate)',
}

export type Tool = 'SCRIBE' | 'LIVE_SCRIBE' | 'OCR' | 'IMAGES_TO_PDF' | 'MERGE_PDF' | 'SPLIT_PDF' | 'COMPRESS_PDF' | 'PDF_TO_WORD' | 'PDF_TO_EXCEL' | 'PDF_TO_PPT' | 'PDF_TO_IMAGE' | 'SCAN_TO_PDF' | 'AI_CHAT' | 'AI_CHATBOT_BUILDER' | 'KNOWLEDGE_DOCUMENT' | 'AI_POLISH' | 'AI_TRANSLATE';

/**
 * @deprecated The UploadMode enum is deprecated in favor of the Tool type.
 */
export enum UploadMode {
  AUDIO = 'AUDIO',
  DOCUMENT = 'DOCUMENT',
}

export enum AppScreen {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  PDF_TOOL_SELECTION = 'PDF_TOOL_SELECTION',
  UPLOAD = 'UPLOAD',
  SCAN_VIEW = 'SCAN_VIEW',
  LIVE_RECORDING = 'LIVE_RECORDING',
  TRANSCRIPTION = 'TRANSCRIPTION',
  OCR_RESULT = 'OCR_RESULT',
  TABLE_RESULT = 'TABLE_RESULT',
  PPT_RESULT = 'PPT_RESULT',
  CHAT_VIEW = 'CHAT_VIEW',
  PRICING_VIEW = 'PRICING_VIEW',
  CHATBOT_BUILDER_VIEW = 'CHATBOT_BUILDER_VIEW',
  UPGRADE_PENDING_VIEW = 'UPGRADE_PENDING_VIEW',
  PAYMENT_VIEW = 'PAYMENT_VIEW',
  PROFILE_VIEW = 'PROFILE_VIEW',
  CHECKING_BACKEND = 'CHECKING_BACKEND',
  BACKEND_OFFLINE = 'BACKEND_OFFLINE',
}

export type SubscriptionTier = 'Free' | 'Pro' | 'Business';

export interface UserSubscription {
    tier: SubscriptionTier;
    aiCredits: number;
    toolUsage?: { [key in Tool]?: number }; // Key is tool, value is usage count
}

export interface FileObject {
  id: string;
  file: File;
}

export interface ProcessingOptions {
  language: string;
  mode: TranscriptionMode;
  enableSpeakerRecognition: boolean;
  enableAudioRestoration: boolean;
  pageRange?: string;
}

export interface TranscriptSegment {
  speaker: string | null;
  startTime: number;
  endTime: number;
  text: string;
}

export interface Transcript {
  title: string;
  segments: TranscriptSegment[];
}

export interface OcrResult {
    title: string;
    text: string;
}

export interface Table {
    title: string;
    // Array of rows, where each row is an array of strings (cells)
    data: string[][]; 
}

export interface TableResult {
    title: string;
    tables: Table[];
}

export interface PptSlide {
    title: string;
    bulletPoints: string[];
}

export interface PptResult {
    title: string;
    slides: PptSlide[];
}

export interface ScanAnalysisResult {
    isDocumentFound: boolean;
    feedback: string;
    boundingBox: {
        x: number;
        y: number;
        width: number;
        height: number;
    } | null;
}

export interface User {
    id: string;
    username: string; // This is the email
    name: string;
    mobile?: string;
    isAdmin?: boolean;
    subscription: UserSubscription;
    subscriptionRequest?: {
        tier: SubscriptionTier;
        requestedAt: string;
    };
    // New analytics fields added for tracking
    lastLogin: string;
    loginCount: number;
    timeSpent: number; // in minutes
    analysesCount: number;
    reportsCount: number;
}

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
    isProcessing?: boolean;
    attachment?: {
        fileName: string;
        type: string;
    };
}

export type StoredFileResult = Transcript | OcrResult | TableResult | PptResult;

export interface StoredFile {
    id: string;
    userId: string;
    fileName: string;
    tool: Tool;
    result: StoredFileResult;
    createdAt: string; // ISO string
}

export interface AdminUserAnalytics {
    id: string;
    username: string;
    name: string;
    status: 'Active' | 'Inactive' | 'Pending';
    subscriptionRequest?: {
        tier: SubscriptionTier;
        requestedAt: string;
    };
    lastLogin: string; // ISO string
    loginCount: number;
    timeSpent: number; // in minutes
    analysesCount: number;
    reportsCount: number;
}

export interface CustomChatbot {
    id: string;
    userId: string;
    name: string;
    persona: string;
    knowledgeBaseFileIds: string[];
    createdAt: string; // ISO string
}

export type ChatContext = StoredFile | CustomChatbot;

export interface AuditLogEntry {
    id: string;
    timestamp: string;
    user: string;
    action: string;
    details: string;
}

export type BackendStatus = 'checking' | 'online' | 'offline';

// --- State Management Types for useReducer ---

export interface AppState {
    currentUser: User | null;
    screen: AppScreen;
    backendStatus: BackendStatus;
    activeTool: Tool | null;
    isProcessing: boolean;
    loadingMessage: string;
    loadingSubMessage: string | null;
    currentFile: StoredFile | null;
    error: string | null;
}

export type AppAction =
    | { type: 'SET_BACKEND_STATUS'; payload: { status: BackendStatus; screen: AppScreen; user?: User | null } }
    | { type: 'LOGIN_SUCCESS'; payload: User }
    | { type: 'LOGOUT' }
    | { type: 'USER_UPDATED'; payload: User }
    | { type: 'NAVIGATE'; payload: { screen: AppScreen; tool?: Tool | null } }
    | { type: 'START_PROCESSING'; payload: { message: string; tool: Tool | null } }
    | { type: 'PROCESSING_SUCCESS'; payload: { screen: AppScreen; file: StoredFile; user: User } }
    | { type: 'DOWNLOAD_COMPLETE' }
    | { type: 'PROCESSING_FAILED'; payload: string }
    | { type: 'RESET_VIEW' }
    | { type: 'SET_CURRENT_FILE'; payload: { file: StoredFile; screen: AppScreen } }
    | { type: 'CLEAR_ERROR' }
    | { type: 'SET_LOADING_MESSAGE'; payload: string }
    | { type: 'SET_LOADING_SUB_MESSAGE'; payload: string | null };