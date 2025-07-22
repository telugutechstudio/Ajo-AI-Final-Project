
import type { AppState, AppAction, User } from './types';
import { AppScreen as AppScreenEnum } from './types';

export const initialState: AppState = {
    currentUser: null,
    screen: AppScreenEnum.CHECKING_BACKEND,
    backendStatus: 'checking',
    activeTool: null,
    isProcessing: false,
    loadingMessage: 'Connecting to server...',
    loadingSubMessage: null,
    currentFile: null,
    error: null,
};

export function appReducer(state: AppState, action: AppAction): AppState {
    switch (action.type) {
        case 'SET_BACKEND_STATUS':
            return {
                ...state,
                backendStatus: action.payload.status,
                screen: action.payload.screen,
                currentUser: action.payload.user || null,
            };
        case 'LOGIN_SUCCESS':
            return {
                ...state,
                currentUser: action.payload,
                screen: action.payload.subscriptionRequest ? AppScreenEnum.UPGRADE_PENDING_VIEW : AppScreenEnum.DASHBOARD,
            };
        case 'LOGOUT':
            return {
                ...state,
                currentUser: null,
                screen: AppScreenEnum.LOGIN,
            };
        case 'USER_UPDATED':
            return {
                ...state,
                currentUser: action.payload,
            };
        case 'NAVIGATE':
            return {
                ...state,
                error: null,
                screen: action.payload.screen,
                activeTool: action.payload.tool !== undefined ? action.payload.tool : state.activeTool,
            };
        case 'START_PROCESSING':
            return {
                ...state,
                isProcessing: true,
                loadingMessage: action.payload.message,
                loadingSubMessage: null,
                activeTool: action.payload.tool,
                error: null,
            };
        case 'PROCESSING_SUCCESS':
            return {
                ...state,
                isProcessing: false,
                loadingMessage: '',
                currentFile: action.payload.file,
                currentUser: action.payload.user,
                screen: action.payload.screen,
            };
        case 'DOWNLOAD_COMPLETE':
            return {
                ...state,
                isProcessing: false,
                loadingMessage: '',
                screen: AppScreenEnum.DASHBOARD,
                activeTool: null,
                error: null,
            };
        case 'PROCESSING_FAILED':
            return {
                ...state,
                isProcessing: false,
                loadingMessage: '',
                error: action.payload,
                screen: AppScreenEnum.DASHBOARD, // Go back to dashboard on failure
                activeTool: null, // Reset the active tool
            };
        case 'RESET_VIEW':
            return {
                ...state,
                error: null,
                screen: AppScreenEnum.DASHBOARD,
                activeTool: null,
                currentFile: null,
            };
        case 'SET_CURRENT_FILE':
             return {
                ...state,
                currentFile: action.payload.file,
                screen: action.payload.screen,
            };
        case 'CLEAR_ERROR':
            return { ...state, error: null };
        case 'SET_LOADING_MESSAGE':
            return { ...state, loadingMessage: action.payload };
        case 'SET_LOADING_SUB_MESSAGE':
            return { ...state, loadingSubMessage: action.payload };
        default:
            return state;
    }
}