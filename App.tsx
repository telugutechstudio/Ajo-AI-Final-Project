
import React, { useState, useCallback, useRef, useEffect, useReducer } from 'react';
import FileUpload from './components/FileUpload';
import TranscriptionView from './components/TranscriptionView';
import OcrResultView from './components/OcrResultView';
import Loader from './components/Loader';
import { polishText, translateText, sendMessage, extractTextFromDocument } from './services/geminiService';
import * as authService from './services/authService';
import * as pdfTools from './services/pdfToolsService';
import type { AppScreen, FileObject, ProcessingOptions, Tool, User, StoredFile, ChatMessage, SubscriptionTier, CustomChatbot, ChatContext } from './types';
import { AppScreen as AppScreenEnum, TranscriptionMode } from './types';
import PdfToolsSelection from './components/PdfToolsSelection';
import TableResultView from './components/TableResultView';
import PptResultView from './components/PptResultView';
import ScanView from './components/ScanView';
import { downloadFile } from './utils';
import LoginScreen from './components/LoginScreen';
import { PLANS } from './config';
import Dashboard from './components/Dashboard';
import { UserIcon, LogOutIcon, InfoIcon, ChevronDownIcon } from './components/icons';
import ChatView from './components/ChatView';
import PricingView from './components/PricingView';
import PaymentView from './components/PaymentView';
import ChatbotBuilderView from './components/ChatbotBuilderView';
import AboutModal from './components/AboutModal';
import UpgradePendingView from './components/UpgradePendingView';
import { AjoAiLogo } from './components/Logo';
import ProfileView from './components/ProfileView';
import BackendOfflineView from './components/BackendOfflineView';
import { appReducer, initialState } from './state';
import LiveRecordingView from './components/LiveRecordingView';


const UserMenu: React.FC<{ user: User; onLogout: () => void; onNavigateProfile: () => void; }> = ({ user, onLogout, onNavigateProfile }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors p-2 rounded-md hover:bg-white/10"
            >
                <UserIcon className="w-5 h-5" />
                <span className="font-medium hidden sm:inline">{user.name || user.username}</span>
                <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-white/10 rounded-lg shadow-lg py-1 z-20 fade-in">
                    <button
                        onClick={() => { onNavigateProfile(); setIsOpen(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-white/10 flex items-center gap-2"
                    >
                        <UserIcon className="w-4 h-4" /> My Profile
                    </button>
                    <button
                        onClick={() => { onLogout(); setIsOpen(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-white/10 flex items-center gap-2"
                    >
                        <LogOutIcon className="w-4 h-4" /> Logout
                    </button>
                </div>
            )}
        </div>
    );
};

const getApiEndpointForTool = (tool: Tool): string => {
    const endpointMap: Partial<Record<Tool, string>> = {
        SCRIBE: 'transcribe',
        LIVE_SCRIBE: 'transcribe', // Live Scribe uses the same backend endpoint
        OCR: 'ocr',
        PDF_TO_WORD: 'pdf_to_word',
        PDF_TO_EXCEL: 'tables',
        PDF_TO_PPT: 'ppt',
    };
    const endpoint = endpointMap[tool];
    if (!endpoint) {
        throw new Error(`No API endpoint defined for tool: ${tool}`);
    }
    return endpoint;
};


const App: React.FC = () => {
    const [state, dispatch] = useReducer(appReducer, initialState);
    const { currentUser, screen, backendStatus, activeTool, isProcessing, loadingMessage, currentFile, error } = state;

    // Local state for UI components that don't affect core app logic
    const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
    const [planToPurchase, setPlanToPurchase] = useState<SubscriptionTier | null>(null);

    // Chat State (kept separate as it's a self-contained feature)
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [chatContext, setChatContext] = useState<ChatContext | null>(null);
    
    // --- App Initialization & Auth ---
    useEffect(() => {
        const checkBackendStatusWithRetry = async (maxRetries = 5, delay = 5000) => {
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    const response = await fetch('/api/status');
                    if (response.ok) {
                        const user = authService.getCurrentUser();
                        dispatch({ 
                            type: 'SET_BACKEND_STATUS', 
                            payload: { status: 'online', screen: user ? (user.subscriptionRequest ? AppScreenEnum.UPGRADE_PENDING_VIEW : AppScreenEnum.DASHBOARD) : AppScreenEnum.LOGIN, user }
                        });
                        return; // Success, exit function
                    }
                    console.warn(`Backend check attempt ${attempt} returned status: ${response.status}`);
                } catch (error) {
                    console.warn(`Backend check attempt ${attempt} failed with network error:`, error);
                }

                if (attempt < maxRetries) {
                    await new Promise(res => setTimeout(res, delay));
                }
            }

            // If all retries fail, set status to offline
            console.error("Backend is offline after multiple attempts.");
            dispatch({ type: 'SET_BACKEND_STATUS', payload: { status: 'offline', screen: AppScreenEnum.BACKEND_OFFLINE } });
        };

        checkBackendStatusWithRetry();
    }, []);

    const handleLogin = (user: User) => {
        dispatch({ type: 'LOGIN_SUCCESS', payload: user });
    };

    const handleLogout = () => {
        authService.logout();
        dispatch({ type: 'LOGOUT' });
    };

    const handleUserUpdate = (user: User) => {
        dispatch({ type: 'USER_UPDATED', payload: user });
    };
    
    // --- Navigation and Tool Selection ---
    const handleNavigateToPricing = () => dispatch({ type: 'NAVIGATE', payload: { screen: AppScreenEnum.PRICING_VIEW } });
    const handleNavigateToProfile = () => dispatch({ type: 'NAVIGATE', payload: { screen: AppScreenEnum.PROFILE_VIEW } });
    const handleBackToDashboard = () => dispatch({ type: 'RESET_VIEW' });

    const handleToolSelect = (toolOrGroup: Tool | 'PDF_TOOLS_GROUP') => {
        const screenMap: Record<Tool | 'PDF_TOOLS_GROUP', AppScreen> = {
            PDF_TOOLS_GROUP: AppScreenEnum.PDF_TOOL_SELECTION,
            AI_CHAT: AppScreenEnum.CHAT_VIEW,
            AI_CHATBOT_BUILDER: AppScreenEnum.CHATBOT_BUILDER_VIEW,
            SCRIBE: AppScreenEnum.UPLOAD,
            LIVE_SCRIBE: AppScreenEnum.LIVE_RECORDING,
            OCR: AppScreenEnum.UPLOAD,
            IMAGES_TO_PDF: AppScreenEnum.UPLOAD,
            MERGE_PDF: AppScreenEnum.UPLOAD,
            SPLIT_PDF: AppScreenEnum.UPLOAD,
            COMPRESS_PDF: AppScreenEnum.UPLOAD,
            PDF_TO_WORD: AppScreenEnum.UPLOAD,
            PDF_TO_EXCEL: AppScreenEnum.UPLOAD,
            PDF_TO_PPT: AppScreenEnum.UPLOAD,
            PDF_TO_IMAGE: AppScreenEnum.UPLOAD,
            SCAN_TO_PDF: AppScreenEnum.UPLOAD,
            KNOWLEDGE_DOCUMENT: AppScreenEnum.UPLOAD,
            AI_POLISH: AppScreenEnum.UPLOAD,
            AI_TRANSLATE: AppScreenEnum.UPLOAD,
        };
        const targetScreen = screenMap[toolOrGroup];

        if (toolOrGroup === 'AI_CHAT') {
            handleStartChatSession();
        } else {
            dispatch({ type: 'NAVIGATE', payload: { screen: targetScreen, tool: toolOrGroup !== 'PDF_TOOLS_GROUP' ? toolOrGroup : null } });
        }
    };
    
    const handlePdfToolSelect = (tool: Tool) => {
        const screen = tool === 'SCAN_TO_PDF' ? AppScreenEnum.SCAN_VIEW : AppScreenEnum.UPLOAD;
        dispatch({ type: 'NAVIGATE', payload: { screen, tool } });
    }
    
    const handleProcessFiles = useCallback(async (files: FileObject[], options: ProcessingOptions, tool: Tool | null) => {
        if (files.length === 0 || !tool || !currentUser) return;
    
        dispatch({ type: 'START_PROCESSING', payload: { message: `Processing ${files[0].file.name}...`, tool } });
    
        try {
            const clientSideTools: Tool[] = ['IMAGES_TO_PDF', 'MERGE_PDF', 'SPLIT_PDF', 'COMPRESS_PDF', 'PDF_TO_IMAGE'];
            
            if (clientSideTools.includes(tool)) {
                const fileList = files.map(f => f.file);
                const baseFileName = fileList[0].name.replace(/\.[^/.]+$/, "");
                let resultBlob: Blob | null = null;
                let downloadFilename = "download.zip";
    
                switch (tool) {
                    case 'IMAGES_TO_PDF':
                        resultBlob = await pdfTools.convertImagesToPdf(fileList);
                        downloadFilename = `${baseFileName || 'converted'}.pdf`;
                        break;
                    case 'MERGE_PDF':
                        resultBlob = await pdfTools.mergePdfs(fileList);
                        downloadFilename = `merged_document.pdf`;
                        break;
                    case 'SPLIT_PDF':
                        resultBlob = await pdfTools.splitPdf(fileList[0], options.pageRange || '1');
                        downloadFilename = `${baseFileName}_split.pdf`;
                        break;
                    case 'COMPRESS_PDF':
                        resultBlob = await pdfTools.compressPdf(fileList[0]);
                        downloadFilename = `${baseFileName}_compressed.pdf`;
                        break;
                    case 'PDF_TO_IMAGE':
                        resultBlob = await pdfTools.convertPdfToImages(fileList[0]);
                        downloadFilename = `${baseFileName}_images.zip`;
                        break;
                }
    
                if (resultBlob) {
                    downloadFile(resultBlob, downloadFilename);
                    dispatch({ type: 'DOWNLOAD_COMPLETE' });
                } else {
                    throw new Error("Client-side processing failed to produce a file.");
                }
                return;
            }
    
            const endpoint = getApiEndpointForTool(tool);
            const fileToProcess = files[0];
            const formData = new FormData();
            files.forEach(f => formData.append('file', f.file));
            formData.append('options', JSON.stringify(options));
            formData.append('fileName', fileToProcess.file.name);
    
            const response = await fetch(`/api/ai/${endpoint}`, {
                method: 'POST',
                headers: { 'x-auth-token': authService.getToken() || '' },
                body: formData,
            });
    
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.msg || 'An error occurred during processing.');
            }
    
            const contentType = response.headers.get('Content-Type');
            if (contentType && !contentType.includes('application/json')) {
                const blob = await response.blob();
                const contentDisposition = response.headers.get('Content-Disposition');
                let downloadFilename = `processed_${fileToProcess.file.name}`;
                if (contentDisposition) {
                    const filenameMatch = contentDisposition.match(/filename="(.+)"/);
                    if (filenameMatch && filenameMatch.length > 1) {
                        downloadFilename = filenameMatch[1];
                    }
                }
                downloadFile(blob, downloadFilename);
                dispatch({ type: 'DOWNLOAD_COMPLETE' });
                return;
            }
    
            const data = await response.json();
            const savedFile = await authService.saveFile({ fileName: fileToProcess.file.name, tool, result: data });
    
            const refreshedUser = await authService.refreshUser();
            if (!refreshedUser) throw new Error("Could not refresh user session.");
    
            const screenMap: Partial<Record<Tool, AppScreen>> = {
                SCRIBE: AppScreenEnum.TRANSCRIPTION,
                LIVE_SCRIBE: AppScreenEnum.TRANSCRIPTION,
                OCR: AppScreenEnum.OCR_RESULT,
                PDF_TO_WORD: AppScreenEnum.OCR_RESULT,
                PDF_TO_EXCEL: AppScreenEnum.TABLE_RESULT,
                PDF_TO_PPT: AppScreenEnum.PPT_RESULT,
            };
    
            dispatch({
                type: 'PROCESSING_SUCCESS',
                payload: {
                    file: savedFile,
                    screen: screenMap[tool] || AppScreenEnum.DASHBOARD,
                    user: refreshedUser
                }
            });
    
        } catch (e: any) {
            dispatch({ type: 'PROCESSING_FAILED', payload: e.message || `An unknown error occurred during ${tool} processing.` });
        }
    }, [currentUser, dispatch]);
    
    const handlePolish = async (text: string): Promise<string | null> => {
        try {
            const polishedResult = await polishText(text);
            const user = await authService.refreshUser();
            if (user) handleUserUpdate(user);
            return polishedResult;
        } catch (e: any) {
             dispatch({ type: 'PROCESSING_FAILED', payload: e.message || "Failed to polish text." });
            return null;
        }
    };
    
    const handleTranslate = async (text: string, language: string): Promise<string | null> => {
        try {
            const translatedResult = await translateText(text, language);
            const user = await authService.refreshUser();
            if (user) handleUserUpdate(user);
            return translatedResult;
        } catch (e: any) {
            dispatch({ type: 'PROCESSING_FAILED', payload: e.message || "Failed to translate text." });
            return null;
        }
    };

    const handleSendMessage = async (message: string, file?: File) => {
        if (!currentUser || (!message.trim() && !file)) return;

        const userMessage: ChatMessage = { role: 'user', text: message, attachment: file ? { fileName: file.name, type: file.type } : undefined };
        const newHistory = [...chatHistory, userMessage];
        setChatHistory(newHistory);
        
        const processingMessage: ChatMessage = { role: 'model', text: '', isProcessing: true };
        setChatHistory(prev => [...prev, processingMessage]);
        
        try {
            let systemInstruction = 'You are a helpful AI assistant.';
            if (chatContext) {
                 if ('persona' in chatContext) {
                    systemInstruction = chatContext.persona;
                 } else {
                    const resultText = JSON.stringify(chatContext.result);
                    systemInstruction = `You are an expert on the following document. Your role is to to answer questions based ONLY on the provided text. Do not make up information. Document content:\n\n---\n${resultText}\n---`;
                 }
            }
            
            const responseText = await sendMessage(newHistory, systemInstruction, file);
            
            setChatHistory(prev => {
                const updatedHistory = [...prev];
                const lastMessage = updatedHistory[updatedHistory.length - 1];
                if(lastMessage.role === 'model'){
                    lastMessage.text = responseText;
                    lastMessage.isProcessing = false;
                }
                return updatedHistory;
            });
            const user = await authService.refreshUser();
            if (user) handleUserUpdate(user);

        } catch (e: any) {
            console.error("Chat send error:", e);
            const errorMessage = e.message || "Sorry, I encountered an error. Please try again.";
            setChatHistory(prev => {
                const updatedHistory = [...prev];
                const lastMessage = updatedHistory[updatedHistory.length - 1];
                if(lastMessage.role === 'model'){
                    lastMessage.text = errorMessage;
                    lastMessage.isProcessing = false;
                }
                return updatedHistory;
            });
        }
    };
    
    const handleStartChatSession = (context?: StoredFile | CustomChatbot) => {
        setChatContext(context || null);
        setChatHistory([]);
        dispatch({ type: 'NAVIGATE', payload: { screen: AppScreenEnum.CHAT_VIEW } });
    };

    const handleSaveChatbot = async (name: string, persona: string, files: File[]) => {
        if (!currentUser) return;
        
        dispatch({ type: 'START_PROCESSING', payload: { message: 'Creating chatbot and processing knowledge files...', tool: 'AI_CHATBOT_BUILDER' } });
        try {
            const knowledgeFileIds: string[] = [];
            for (const file of files) {
                const ocrResult = await extractTextFromDocument(file);
                const savedFile = await authService.saveFile({ 
                    fileName: file.name, 
                    tool: 'KNOWLEDGE_DOCUMENT', 
                    result: ocrResult
                });
                knowledgeFileIds.push(savedFile.id);
            }
            
            await authService.saveChatbot({ name, persona, knowledgeBaseFileIds: knowledgeFileIds });
            const user = await authService.refreshUser();
            if (user) handleUserUpdate(user);
            dispatch({ type: 'RESET_VIEW' });
        } catch (e: any) {
             dispatch({ type: 'PROCESSING_FAILED', payload: e.message || "Failed to create chatbot." });
        }
    };

    const handleOpenFile = (file: StoredFile) => {
        const screenMap: Partial<Record<Tool, AppScreen>> = {
            SCRIBE: AppScreenEnum.TRANSCRIPTION,
            OCR: AppScreenEnum.OCR_RESULT,
            PDF_TO_WORD: AppScreenEnum.OCR_RESULT,
            PDF_TO_EXCEL: AppScreenEnum.TABLE_RESULT,
            PDF_TO_PPT: AppScreenEnum.PPT_RESULT,
        };
        const targetScreen = screenMap[file.tool];
        if (targetScreen) {
            dispatch({ type: 'SET_CURRENT_FILE', payload: { file, screen: targetScreen } });
        }
    };
    
    const handleSelectPlan = (tier: SubscriptionTier) => {
        if(tier === 'Free' || !currentUser) return;
        setPlanToPurchase(tier);
        dispatch({ type: 'NAVIGATE', payload: { screen: AppScreenEnum.PAYMENT_VIEW } });
    };

    const handlePaymentComplete = async () => {
        if (!planToPurchase || !currentUser) return;
        try {
            await authService.requestSubscriptionUpgrade(planToPurchase);
            const refreshedUser = await authService.refreshUser();
            if (refreshedUser) handleUserUpdate(refreshedUser);
            dispatch({ type: 'NAVIGATE', payload: { screen: AppScreenEnum.UPGRADE_PENDING_VIEW } });
        } catch(e: any) {
            console.error("Failed to request upgrade:", e.message);
            alert("Could not submit your upgrade request. Please try again.");
        }
    };

    const handleErrorDismiss = () => {
        dispatch({ type: 'CLEAR_ERROR' });
    };


    const renderScreen = () => {
        if (isProcessing) {
            return <Loader message={loadingMessage} />;
        }

        switch (screen) {
            case AppScreenEnum.LOGIN:
                return <LoginScreen onLogin={handleLogin} />;
            case AppScreenEnum.DASHBOARD:
                return currentUser ? <Dashboard 
                    currentUser={currentUser}
                    onSelectTool={handleToolSelect}
                    onOpenFile={handleOpenFile}
                    onStartChat={handleStartChatSession}
                    onUpgradePlan={handleNavigateToPricing}
                    error={error}
                    onErrorDismiss={handleErrorDismiss}
                /> : <LoginScreen onLogin={handleLogin} />;
            case AppScreenEnum.PDF_TOOL_SELECTION:
                return <PdfToolsSelection onSelectTool={handlePdfToolSelect} onBack={handleBackToDashboard} />;
            case AppScreenEnum.UPLOAD:
                return <FileUpload 
                    onStartProcessing={(files, opts) => handleProcessFiles(files, opts, activeTool)} 
                    isProcessing={isProcessing} 
                    tool={activeTool} 
                    onBack={handleBackToDashboard} 
                    error={error}
                />;
            case AppScreenEnum.LIVE_RECORDING:
                return <LiveRecordingView
                    onBack={handleBackToDashboard}
                    onComplete={(file) => {
                        handleProcessFiles(
                            [{ id: file.name, file: file }], 
                            { 
                                language: 'English', 
                                mode: TranscriptionMode.DOLPHIN, 
                                enableSpeakerRecognition: true, 
                                enableAudioRestoration: false,
                            }, 
                            'LIVE_SCRIBE'
                        );
                    }}
                />;
            case AppScreenEnum.TRANSCRIPTION:
                return currentFile && 'segments' in currentFile.result ? <TranscriptionView 
                    transcript={currentFile.result} 
                    fileName={currentFile.fileName}
                    onStartNew={handleBackToDashboard}
                    onTranslate={handleTranslate}
                /> : <p>Error: Invalid data for transcription view.</p>;
            case AppScreenEnum.OCR_RESULT:
                 return currentFile && 'text' in currentFile.result ? <OcrResultView 
                    result={currentFile.result} 
                    fileName={currentFile.fileName}
                    onStartNew={handleBackToDashboard} 
                    onPolish={handlePolish}
                    onTranslate={handleTranslate}
                /> : <p>Error: Invalid data for OCR view.</p>;
            case AppScreenEnum.TABLE_RESULT:
                return currentFile && 'tables' in currentFile.result ? <TableResultView 
                    result={currentFile.result} 
                    fileName={currentFile.fileName} 
                    onStartNew={handleBackToDashboard} 
                /> : <p>Error: Invalid data for table view.</p>;
            case AppScreenEnum.PPT_RESULT:
                return currentFile && 'slides' in currentFile.result ? <PptResultView 
                    result={currentFile.result} 
                    fileName={currentFile.fileName} 
                    onStartNew={handleBackToDashboard} 
                /> : <p>Error: Invalid data for presentation view.</p>;
            case AppScreenEnum.SCAN_VIEW:
                return <ScanView 
                    onBack={() => dispatch({ type: 'NAVIGATE', payload: { screen: AppScreenEnum.PDF_TOOL_SELECTION } })} 
                    onComplete={(files) => {
                        handleProcessFiles(files.map(f => ({id: f.name, file: f})), {} as ProcessingOptions, 'IMAGES_TO_PDF');
                    }} 
                />;
            case AppScreenEnum.CHAT_VIEW:
                 return <ChatView 
                    history={chatHistory}
                    onSendMessage={handleSendMessage}
                    onBack={handleBackToDashboard}
                    isProcessing={chatHistory.some(m => m.isProcessing)}
                    contextFileName={chatContext ? ('fileName' in chatContext ? chatContext.fileName : chatContext.name) : undefined}
                 />;
            case AppScreenEnum.PRICING_VIEW:
                 return <PricingView onSelectPlan={handleSelectPlan} onBack={handleBackToDashboard} />;
            case AppScreenEnum.PAYMENT_VIEW:
                 const planDetails = planToPurchase ? PLANS[planToPurchase] : null;
                 return <PaymentView onPaymentComplete={handlePaymentComplete} onBack={() => dispatch({ type: 'NAVIGATE', payload: { screen: AppScreenEnum.PRICING_VIEW } })} plan={planDetails} />;
             case AppScreenEnum.UPGRADE_PENDING_VIEW:
                 return <UpgradePendingView onBack={handleBackToDashboard} />;
            case AppScreenEnum.CHATBOT_BUILDER_VIEW:
                return <ChatbotBuilderView onSave={handleSaveChatbot} isProcessing={isProcessing} onBack={handleBackToDashboard} />;
            case AppScreenEnum.PROFILE_VIEW:
                return currentUser ? <ProfileView user={currentUser} onBack={handleBackToDashboard} onUserUpdate={handleUserUpdate} /> : <LoginScreen onLogin={handleLogin} />;
            case AppScreenEnum.CHECKING_BACKEND:
                return <div className="flex items-center justify-center h-screen"><Loader message="Connecting to server..." /></div>;
            case AppScreenEnum.BACKEND_OFFLINE:
                return <BackendOfflineView />;
            default:
                return <LoginScreen onLogin={handleLogin} />;
        }
    };
    
    const showHeader = screen !== AppScreenEnum.LOGIN && 
                       screen !== AppScreenEnum.CHECKING_BACKEND &&
                       screen !== AppScreenEnum.BACKEND_OFFLINE;


    return (
        <div className={`min-h-screen flex flex-col ${screen === AppScreenEnum.LOGIN || screen === AppScreenEnum.BACKEND_OFFLINE ? 'items-center justify-center' : ''}`}>
           {showHeader && currentUser && (
                <header className="w-full flex-shrink-0 bg-black/10 backdrop-blur-lg border-b border-white/10 z-10 sticky top-0">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                             <div className="flex items-center gap-4">
                               <AjoAiLogo className="h-10 w-auto" />
                               
                            </div>
                            <div className="flex items-center gap-2">
                               <button 
                                  onClick={() => setIsAboutModalOpen(true)}
                                  className="p-2 text-gray-300 hover:text-white transition-colors rounded-md hover:bg-white/10"
                                  title="About this application"
                                >
                                  <InfoIcon className="w-5 h-5"/>
                               </button>
                               <UserMenu user={currentUser} onLogout={handleLogout} onNavigateProfile={handleNavigateToProfile} />
                            </div>
                        </div>
                    </div>
                </header>
            )}

            <main className={`flex-grow w-full flex ${isProcessing || screen === AppScreenEnum.LOGIN ? 'items-center justify-center' : ''}`}>
                {renderScreen()}
            </main>

            <AboutModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} />
        </div>
    );
};

export default App;
