
import React from 'react';
import { XIcon, MicIcon, FileTextIcon, PdfToolboxIcon, MessageCircleIcon, BotIcon, LiveTranslateIcon } from './icons';

interface AboutModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const FeatureItem: React.FC<{
    icon: React.ReactElement<{ className?: string }>;
    title: string;
    children: React.ReactNode;
}> = ({ icon, title, children }) => (
    <div className="flex gap-4">
        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-white/5 rounded-lg">
            {React.cloneElement(icon, { className: "w-5 h-5 text-pink-300" })}
        </div>
        <div>
            <h4 className="font-bold text-lg text-white">{title}</h4>
            <div className="text-gray-300 space-y-2 mt-1">{children}</div>
        </div>
    </div>
);

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div
                className="glass-card rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col fade-in"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-6 border-b border-white/10">
                    <h2 className="text-2xl font-bold text-white">About Ajo AI Technologies Scribe</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                        aria-label="Close"
                    >
                        <XIcon className="w-6 h-6" />
                    </button>
                </header>

                <main className="flex-grow p-8 overflow-y-auto space-y-8">
                    <section>
                        <h3 className="text-xl font-semibold text-pink-300 mb-3">Welcome!</h3>
                        <p className="text-gray-300">
                            Ajo AI Technologies Scribe is your all-in-one AI-powered productivity suite designed to streamline your document and media workflows. From transcribing meetings to building custom chatbots, our suite of tools is here to save you time and unlock new creative possibilities.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-semibold text-pink-300 mb-4">Core Features & How to Use Them</h3>
                        <div className="space-y-6">
                            <FeatureItem icon={<MicIcon />} title="AI Scribe (Audio/Video Transcription)">
                                <p><strong>What it does:</strong> Accurately transcribes speech from audio and video files into text, with optional speaker identification.</p>
                                <p><strong>How to use:</strong> On the Dashboard, select "AI Scribe", upload your file(s) or start a live recording. Choose your language and options, then click "Transcribe". You can later translate, export (DOCX, PDF, SRT, etc.), or chat with the transcript.</p>
                            </FeatureItem>

                            <FeatureItem icon={<FileTextIcon />} title="Extract Text (OCR)">
                                <p><strong>What it does:</strong> Uses Optical Character Recognition (OCR) to pull text from PDFs and images, including handwritten notes.</p>
                                <p><strong>How to use:</strong> Select "Extract Text", upload your file, and let the AI work its magic. On the result screen, you can edit, use "Polish with AI" to improve the text, translate it, or export it.</p>
                            </FeatureItem>
                            
                            <FeatureItem icon={<PdfToolboxIcon />} title="PDF Toolkit">
                                <p><strong>What it does:</strong> A complete suite of tools for managing PDF files.</p>
                                <p><strong>How to use:</strong> Select "PDF Tools", then choose from options like Scan to PDF, Merge, Split, Compress, or convert PDFs to Word, Excel, and PowerPoint formats using AI.</p>
                            </FeatureItem>

                             <FeatureItem icon={<LiveTranslateIcon />} title="Live Translate">
                                <p><strong>What it does:</strong> Captures audio from your microphone and provides real-time transcription and translation.</p>
                                <p><strong>How to use:</strong> Select "Live Translate" from the dashboard, choose your source and target languages, and click "Start".</p>
                            </FeatureItem>

                            <FeatureItem icon={<MessageCircleIcon />} title="AI Chat">
                                <p><strong>What it does:</strong> A powerful chat interface for general conversation or for querying your own documents.</p>
                                <p><strong>How to use:</strong> Select "AI Chat" for a general discussion. From your "My Files" list, click the chat icon next to a file to ask questions based on its specific content.</p>
                            </FeatureItem>

                            <FeatureItem icon={<BotIcon />} title="Chatbot Builder">
                                <p><strong>What it does:</strong> Create custom AI assistants with specific personalities and knowledge bases.</p>
                                <p><strong>How to use:</strong> Select "Chatbot Builder", define a name and persona, and upload knowledge documents (like PDFs or text files). Your custom bot will appear on your dashboard, ready to assist.</p>
                            </FeatureItem>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-xl font-semibold text-pink-300 mb-3">Getting Started</h3>
                        <p className="text-gray-300">
                           <strong>Login/Get Started:</strong> Use your email to sign in. New users must be approved by an administrator.<br/>
                           <strong>Dashboard:</strong> This is your central hub for accessing all tools, recent files, and custom chatbots. <br/>
                           <strong>Usage & Credits:</strong> Free users have a limited number of uses for each AI tool. Pro and Business users have a monthly credit allowance. Your current status is shown on the dashboard. You can upgrade your plan at any time for more access.
                        </p>
                    </section>
                </main>
                
                 <footer className="p-4 border-t border-white/10 text-right">
                    <button
                        onClick={onClose}
                        className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                    >
                        Close
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default AboutModal;