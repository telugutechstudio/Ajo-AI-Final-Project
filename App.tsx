
import React, { useState, useCallback, useRef, useEffect } from 'react';
import FileUpload from './components/FileUpload';
import TranscriptionView from './components/TranscriptionView';
import OcrResultView from './components/OcrResultView';
import Loader from './components/Loader';
import { polishText, translateText, sendMessage, extractTextFromDocument } from './services/geminiService';
import * as authService from './services/authService';
import type { AppScreen, FileObject, ProcessingOptions, Transcript, OcrResult, Tool, TableResult, PptResult, User, StoredFile, ChatMessage, SubscriptionTier, CustomChatbot, ChatContext, BackendStatus } from './types';
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
import LiveTranslateView from './components/LiveTranslateView';
import { AjoAiLogo } from './components/Logo';
import ProfileView from './components/ProfileView';
import BackendOfflineView from './components/BackendOfflineView';

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


const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [screen, setScreen] = useState<AppScreen>(AppScreenEnum.CHECKING_BACKEND);
    const [backendStatus, setBackendStatus] = useState<BackendStatus>('checking');
    const [activeTool, setActiveTool] = useState<Tool | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    
    const [currentFile, setCurrentFile] = useState<StoredFile | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
    const [planToPurchase, setPlanToPurchase] = useState<SubscriptionTier | null>(null);


    // Chat State
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [chatContext, setChatContext] = useState<ChatContext | null>(null);
    
    // Recording State
    const [isRecording, setIsRecording] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Session Tracking
    const loginTimestamp = useRef<number | null>(null);
    
    // --- App Initialization & Auth ---
    useEffect(() => {
        const checkBackendStatus = async () => {
            try {
                const response = await fetch('/api/status');
                if (response.ok) {
                    setBackendStatus('online');
                    const user = authService.getCurrentUser();
                    if (user) {
                        handleLogin(user); // Use handleLogin to set timestamp
                    } else {
                        setScreen(AppScreenEnum.LOGIN);
                    }
                } else {
                    throw new Error('Backend offline');
                }
            } catch (error) {
                setBackendStatus('offline');
                setScreen(AppScreenEnum.BACKEND_OFFLINE);
            }
        };

        checkBackendStatus();

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
                 mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const handleLogin = (user: User) => {
        setCurrentUser(user);
        setScreen(AppScreenEnum.DASHBOARD);
        loginTimestamp.current = Date.now();
        if (user.subscriptionRequest) {
            setScreen(AppScreenEnum.UPGRADE_PENDING_VIEW);
        }
    };

    const handleLogout = () => {
        if (loginTimestamp.current && currentUser) {
            const durationMinutes = Math.round((Date.now() - loginTimestamp.current) / 60000);
            if (durationMinutes > 0) {
                // This is now handled by backend, but could be useful for frontend analytics
            }
            loginTimestamp.current = null;
        }
        authService.logout();
        setCurrentUser(null);
        setScreen(AppScreenEnum.LOGIN);
    };

    const handleUserUpdate = (user: User) => {
        setCurrentUser(user);
    };
    
    const checkAccess = async (tool: Tool): Promise<boolean> => {
        // Backend now handles all access control and credit deduction.
        // This function remains as a placeholder for potential future simple frontend checks.
        return true;
    };


    // --- Navigation and Tool Selection ---
    const handleNavigateToPricing = () => setScreen(AppScreenEnum.PRICING_VIEW);
    const handleNavigateToProfile = () => setScreen(AppScreenEnum.PROFILE_VIEW);
    const handleBackToDashboard = () => setScreen(AppScreenEnum.DASHBOARD);

    const handleToolSelect = (toolOrGroup: Tool | 'PDF_TOOLS_GROUP') => {
        setError(null);
        if (toolOrGroup === 'PDF_TOOLS_GROUP') {
            setScreen(AppScreenEnum.PDF_TOOL_SELECTION);
        } else if (toolOrGroup === 'LIVE_TRANSLATE') {
            setActiveTool(toolOrGroup);
            setScreen(AppScreenEnum.LIVE_TRANSLATE_VIEW);
        } else if (toolOrGroup === 'AI_CHAT') {
            handleStartChatSession();
        } else if (toolOrGroup === 'AI_CHATBOT_BUILDER') {
            setActiveTool(toolOrGroup);
            setScreen(AppScreenEnum.CHATBOT_BUILDER_VIEW);
        } else {
            setActiveTool(toolOrGroup);
            setScreen(AppScreenEnum.UPLOAD);
        }
    };

    const handlePdfToolSelect = (tool: Tool) => {
        setActiveTool(tool);
        if (tool === 'SCAN_TO_PDF') {
            setScreen(AppScreenEnum.SCAN_VIEW);
        } else {
            setScreen(AppScreenEnum.UPLOAD);
        }
        setError(null);
    }
    
    // --- Main Processing Logic ---
    const handleProcessFiles = useCallback(async (files: FileObject[], options: ProcessingOptions, tool: Tool | null) => {
        if (files.length === 0 || !tool || !currentUser) return;
        
        setIsProcessing(true);
        setError(null);
        
        const fileToProcess = files[0];
        
        try {
            const formData = new FormData();
            files.forEach(f => formData.append('file', f.file));
            formData.append('options', JSON.stringify(options));
            formData.append('fileName', fileToProcess.file.name);

            setLoadingMessage(`Processing ${fileToProcess.file.name}...`);
            
            const response = await fetch(`/api/ai/${tool.toLowerCase()}`, {
                method: 'POST',
                headers: { 'x-auth-token': authService.getToken() || '' },
                body: formData,
            });

            if (!response.ok) {
                 const data = await response.json();
                throw new Error(data.msg || 'An error occurred during processing.');
            }

            // If the response is a blob for download
            const contentType = response.headers.get('Content-Type');
            if (contentType && !contentType.includes('application/json')) {
                 const blob = await response.blob();
                 const contentDisposition = response.headers.get('Content-Disposition');
                 let downloadFilename = `processed_${fileToProcess.file.name}`;
                 if(contentDisposition) {
                    const filenameMatch = contentDisposition.match(/filename="(.+)"/);
                    if (filenameMatch && filenameMatch.length > 1) {
                        downloadFilename = filenameMatch[1];
                    }
                 }
                 downloadFile(blob, downloadFilename);
                 handleBackToDashboard();
                 return;
            }

            // If it's JSON data
            const data = await response.json();
            const savedFile = await authService.saveFile({ fileName: fileToProcess.file.name, tool, result: data });
            setCurrentFile(savedFile);
            
            const refreshedUser = await authService.refreshUser();
            if (refreshedUser) setCurrentUser(refreshedUser);

            const screenMap: Partial<Record<Tool, AppScreen>> = {
                SCRIBE: AppScreenEnum.TRANSCRIPTION,
                OCR: AppScreenEnum.OCR_RESULT,
                PDF_TO_WORD: AppScreenEnum.OCR_RESULT,
                PDF_TO_EXCEL: AppScreenEnum.TABLE_RESULT,
                PDF_TO_PPT: AppScreenEnum.PPT_RESULT,
            };
            setScreen(screenMap[tool] || AppScreenEnum.DASHBOARD);
            
        } catch (e: any) {
             setError(e.message || `An unknown error occurred during ${tool} processing.`);
             setActiveTool(tool);
             setScreen(AppScreenEnum.UPLOAD);
        } finally {
            setIsProcessing(false);
            setLoadingMessage('');
        }
    }, [currentUser]);


    // --- AI Sub-Actions (Polish, Translate) ---
    const handlePolish = async (text: string): Promise<string | null> => {
        try {
            const polishedResult = await polishText(text);
            const user = await authService.refreshUser();
            if (user) setCurrentUser(user);
            return polishedResult;
        } catch (e: any) {
            setError(e.message || "Failed to polish text.");
            return null;
        }
    };
    
    const handleTranslate = async (text: string, language: string): Promise<string | null> => {
        try {
            const translatedResult = await translateText(text, language);
            const user = await authService.refreshUser();
            if (user) setCurrentUser(user);
            return translatedResult;
        } catch (e: any) {
            setError(e.message || "Failed to translate text.");
            return null;
        }
    };

    // --- Specific Tool Handlers (Chat, etc.) ---
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
                    systemInstruction = `You are an expert on the following document. Your role is to answer questions based ONLY on the provided text. Do not make up information. Document content:\n\n---\n${resultText}\n---`;
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
            if (user) setCurrentUser(user);

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
        setScreen(AppScreenEnum.CHAT_VIEW);
    };

    const handleSaveChatbot = async (name: string, persona: string, files: File[]) => {
        if (!currentUser) return;
        
        setIsProcessing(true);
        setLoadingMessage('Creating chatbot and processing knowledge files...');
        setError(null);
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
            if (user) setCurrentUser(user);
            setScreen(AppScreenEnum.DASHBOARD);
        } catch (e: any) {
             setError(e.message || "Failed to create chatbot.");
             setScreen(AppScreenEnum.CHATBOT_BUILDER_VIEW);
        } finally {
             setIsProcessing(false);
             setLoadingMessage('');
        }
    };

    const handleOpenFile = (file: StoredFile) => {
        setCurrentFile(file);
        const screenMap: Partial<Record<Tool, AppScreen>> = {
            SCRIBE: AppScreenEnum.TRANSCRIPTION,
            OCR: AppScreenEnum.OCR_RESULT,
            PDF_TO_WORD: AppScreenEnum.OCR_RESULT,
            PDF_TO_EXCEL: AppScreenEnum.TABLE_RESULT,
            PDF_TO_PPT: AppScreenEnum.PPT_RESULT,
        };
        const targetScreen = screenMap[file.tool];
        if (targetScreen) {
            setScreen(targetScreen);
        }
    };

    // --- Recording ---
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];
            
            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const audioFile = new File([audioBlob], `recording_${new Date().toISOString()}.webm`, { type: 'audio/webm' });
                const fileObject: FileObject = { id: audioFile.name, file: audioFile };
                
                 handleProcessFiles([fileObject], {
                    language: 'English',
                    mode: TranscriptionMode.DOLPHIN,
                    enableSpeakerRecognition: true,
                    enableAudioRestoration: false,
                }, 'SCRIBE');

                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsProcessing(true); // Show loader immediately
            setLoadingMessage("Recording... Click stop when finished.");
            setIsRecording(true);
            setElapsedTime(0);
            timerRef.current = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);

        } catch (error) {
            console.error("Error starting recording:", error);
            setError("Could not start recording. Please ensure microphone access is granted.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setLoadingMessage("Finalizing recording..."); // Update loader message
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };
    
    // --- Subscription ---
    const handleSelectPlan = (tier: SubscriptionTier) => {
        if(tier === 'Free' || !currentUser) return;
        setPlanToPurchase(tier);
        setScreen(AppScreenEnum.PAYMENT_VIEW);
    };

    const handlePaymentComplete = async () => {
        if (!planToPurchase || !currentUser) return;
        try {
            await authService.requestSubscriptionUpgrade(planToPurchase);
            const refreshedUser = await authService.refreshUser();
            if (refreshedUser) setCurrentUser(refreshedUser);
            setScreen(AppScreenEnum.UPGRADE_PENDING_VIEW);
        } catch(e: any) {
            console.error("Failed to request upgrade:", e.message);
            setError("Could not submit your upgrade request. Please try again.");
            setScreen(AppScreenEnum.PAYMENT_VIEW);
        }
    };

    // --- Render Logic ---
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
                    startRecording={startRecording}
                    stopRecording={stopRecording}
                    isRecording={isRecording}
                    elapsedTime={elapsedTime}
                    onUpgradePlan={handleNavigateToPricing}
                /> : <LoginScreen onLogin={handleLogin} />;
            case AppScreenEnum.PDF_TOOL_SELECTION:
                return <PdfToolsSelection onSelectTool={handlePdfToolSelect} onBack={handleBackToDashboard} />;
            case AppScreenEnum.UPLOAD:
                return <FileUpload 
                    onStartProcessing={(files, opts) => handleProcessFiles(files, opts, activeTool)} 
                    isProcessing={isProcessing} 
                    tool={activeTool} 
                    onBack={handleBackToDashboard} 
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
                    onBack={() => setScreen(AppScreenEnum.PDF_TOOL_SELECTION)} 
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
                 return <PaymentView onPaymentComplete={handlePaymentComplete} onBack={() => setScreen(AppScreenEnum.PRICING_VIEW)} plan={planDetails} />;
             case AppScreenEnum.UPGRADE_PENDING_VIEW:
                 return <UpgradePendingView onBack={handleBackToDashboard} />;
             case AppScreenEnum.LIVE_TRANSLATE_VIEW:
                 return <LiveTranslateView onBack={handleBackToDashboard} onTranslate={handleTranslate} checkAccess={checkAccess} />;
            case AppScreenEnum.CHATBOT_BUILDER_VIEW:
                return <ChatbotBuilderView onBack={handleBackToDashboard} onSave={handleSaveChatbot} isProcessing={isProcessing} />;
            case AppScreenEnum.PROFILE_VIEW:
                return currentUser ? <ProfileView user={currentUser} onBack={handleBackToDashboard} onUserUpdate={handleUserUpdate} /> : <LoginScreen onLogin={handleLogin} />;
             case AppScreenEnum.BACKEND_OFFLINE:
                return <BackendOfflineView />;
            case AppScreenEnum.CHECKING_BACKEND:
            default:
                return <div className="flex items-center justify-center h-full"><Loader message="Connecting to server..." /></div>;
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-900">
            <header className="w-full p-4 flex justify-between items-center glass-card border-b border-white/10 sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <AjoAiLogo className="h-10 w-auto" />
                    <h1 className="text-xl font-bold text-white hidden md:block">
                        Scribe
                    </h1>
                </div>
                 <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsAboutModalOpen(true)}
                        className="p-2 text-gray-300 hover:text-white transition-colors rounded-full hover:bg-white/10"
                        title="About Ajo AI Scribe"
                    >
                        <InfoIcon className="w-6 h-6" />
                    </button>
                    {currentUser && <UserMenu user={currentUser} onLogout={handleLogout} onNavigateProfile={handleNavigateToProfile} />}
                </div>
            </header>
            <main className="flex-grow flex items-center justify-center p-4">
                {renderScreen()}
            </main>
            <AboutModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} />
        </div>
    );
};

export default App;