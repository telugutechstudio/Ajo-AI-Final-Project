
import React, { useState, useEffect, useRef } from 'react';
import type { ChatMessage } from '../types';
import { ChevronLeftIcon, UserIcon, WandSparklesIcon, LoaderIcon, PaperclipIcon, MicIcon, TrashIcon, FileIcon } from './icons';
import CopyShareButtons from './CopyShareButtons';

interface ChatViewProps {
    history: ChatMessage[];
    onSendMessage: (message: string, file?: File) => void;
    onBack: () => void;
    isProcessing: boolean;
    contextFileName?: string;
}

const ChatMessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isUser = message.role === 'user';
    return (
        <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : ''}`}>
            {!isUser && (
                <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <WandSparklesIcon className="w-5 h-5 text-cyan-400" />
                </div>
            )}
            <div className={`max-w-xl p-3 rounded-2xl text-left flex flex-col gap-2 ${isUser ? 'bg-pink-600 rounded-br-lg' : 'bg-black/20 rounded-bl-lg'}`}>
                {message.isProcessing ? (
                    <div className="flex items-center gap-2">
                        <LoaderIcon className="w-5 h-5 animate-spin" />
                        <span className="text-gray-300">Thinking...</span>
                    </div>
                ) : (
                    <p className="text-white whitespace-pre-wrap">{message.text}</p>
                )}
                {message.attachment && (
                    <div className="border-t border-white/20 pt-2 mt-2">
                        <div className="flex items-center gap-2 text-xs text-white/80 bg-black/20 p-2 rounded-md">
                           <FileIcon className="w-4 h-4 flex-shrink-0" />
                           <span className="truncate">{message.attachment.fileName}</span>
                        </div>
                    </div>
                )}
                {!isUser && !message.isProcessing && message.text && (
                    <div className="pt-2 border-t border-white/10 flex justify-end">
                        <CopyShareButtons textToCopy={message.text} shareTitle="AI Chatbot Answer" />
                    </div>
                )}
            </div>
            {isUser && (
                <div className="w-8 h-8 rounded-full bg-black/30 flex items-center justify-center flex-shrink-0">
                    <UserIcon className="w-5 h-5 text-gray-300" />
                </div>
            )}
        </div>
    );
};


const ChatView: React.FC<ChatViewProps> = ({ history, onSendMessage, onBack, isProcessing, contextFileName }) => {
    const [input, setInput] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);
    const [isListening, setIsListening] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const recognitionRef = useRef<any | null>(null); // SpeechRecognition

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [history]);

    // --- Speech Recognition Logic ---
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn("Speech recognition not supported in this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
            let interimTranscript = '';
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            setInput(prev => prev + finalTranscript);
        };

        recognition.onerror = (event: any) => {
            console.error("Speech recognition error:", event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            if (isListening) {
                 recognition.start(); // Restart if it was manually stopped
            }
        };

        recognitionRef.current = recognition;

        return () => {
             if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };

    }, [isListening]);
    
    const handleMicClick = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            recognitionRef.current?.start();
            setIsListening(true);
        }
    };
    
    // --- Form & File Logic ---
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setAttachment(e.target.files[0]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if ((input.trim() || attachment) && !isProcessing) {
            onSendMessage(input, attachment || undefined);
            setInput('');
            setAttachment(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <div className="w-full max-w-3xl mx-auto p-4 md:p-6 h-full flex flex-col">
            <div className="glass-card rounded-2xl flex flex-col flex-grow">
                <div className="p-4 border-b border-white/10 flex items-center gap-4 flex-shrink-0">
                    <button onClick={onBack} className="text-gray-300 hover:text-white transition-colors">
                        <ChevronLeftIcon className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-white">{contextFileName ? contextFileName : "AI Chat"}</h1>
                        {contextFileName && <p className="text-sm text-cyan-400 truncate">Live Chat Session</p>}
                    </div>
                </div>

                <div className="flex-grow p-6 overflow-y-auto space-y-6">
                    {history.map((msg, index) => (
                        <ChatMessageBubble key={index} message={msg} />
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-white/10 flex-shrink-0">
                    {attachment && (
                        <div className="mb-2 p-2 bg-black/20 rounded-lg flex items-center justify-between">
                             <div className="flex items-center gap-2 overflow-hidden">
                                <FileIcon className="w-5 h-5 text-gray-300 flex-shrink-0" />
                                <span className="text-sm text-gray-300 truncate">{attachment.name}</span>
                             </div>
                             <button onClick={() => setAttachment(null)} className="p-1 text-gray-400 hover:text-red-400 transition-colors">
                                <TrashIcon className="w-4 h-4"/>
                             </button>
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="flex items-center gap-3">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept="image/*,application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        />
                         <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isProcessing}
                            className="p-2 text-gray-300 hover:text-white transition-colors disabled:text-gray-500 disabled:cursor-not-allowed"
                            aria-label="Attach file"
                        >
                            <PaperclipIcon className="w-5 h-5"/>
                        </button>
                         <button
                            type="button"
                            onClick={handleMicClick}
                            disabled={isProcessing}
                            className={`p-2 transition-colors disabled:text-gray-500 disabled:cursor-not-allowed ${isListening ? 'text-red-500 hover:text-red-600' : 'text-gray-300 hover:text-white'}`}
                            aria-label={isListening ? "Stop listening" : "Start listening"}
                        >
                            <MicIcon className={`w-5 h-5 ${isListening ? 'animate-pulse' : ''}`}/>
                        </button>
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit(e);
                                }
                            }}
                            placeholder="Type a message or attach a file..."
                            rows={1}
                            className="flex-grow bg-black/20 border border-white/20 rounded-lg py-2 px-4 text-white resize-none focus:ring-2 focus:ring-cyan-500"
                            disabled={isProcessing}
                        />
                        <button
                            type="submit"
                            disabled={(!input.trim() && !attachment) || isProcessing}
                            className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                        >
                            Send
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChatView;