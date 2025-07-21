
import React, { useState } from 'react';
import { ChevronLeftIcon, BotIcon, FileIcon, TrashIcon, UploadCloudIcon } from './icons';
import { formatBytes } from '../utils';

interface ChatbotBuilderViewProps {
    onSave: (name: string, persona: string, files: File[]) => void;
    isProcessing: boolean;
    onBack: () => void;
}

const ChatbotBuilderView: React.FC<ChatbotBuilderViewProps> = ({ onSave, isProcessing, onBack }) => {
    const [name, setName] = useState('');
    const [persona, setPersona] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [isDragging, setIsDragging] = useState(false);

    const handleFileChange = (selectedFiles: FileList | null) => {
        if (selectedFiles) {
            setFiles(prev => [...prev, ...Array.from(selectedFiles)]);
        }
    };

    const handleRemoveFile = (fileNameToRemove: string) => {
        setFiles(prev => prev.filter(f => f.name !== fileNameToRemove));
    };

    const onDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        handleFileChange(e.dataTransfer.files);
    };

    const handleSave = () => {
        if (name.trim() && persona.trim() && !isProcessing) {
            onSave(name, persona, files);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto p-4 md:p-8">
            <button onClick={onBack} className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors mb-4">
                <ChevronLeftIcon className="w-5 h-5" />
                Back to Dashboard
            </button>
            <div className="glass-card rounded-2xl p-6 md:p-8">
                <h1 className="text-3xl font-bold text-white mb-2 text-center">AI Chatbot Builder</h1>
                <p className="text-gray-300 mb-6 text-center">Create a custom AI assistant with its own personality and knowledge.</p>

                <div className="space-y-6">
                    <div>
                        <label htmlFor="botName" className="block text-sm font-medium text-gray-300 mb-2">Chatbot Name</label>
                        <input
                            id="botName"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Internal Support Bot"
                            className="w-full bg-black/20 border border-white/20 rounded-lg py-2 px-3 text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                            disabled={isProcessing}
                        />
                    </div>

                    <div>
                        <label htmlFor="persona" className="block text-sm font-medium text-gray-300 mb-2">Persona (System Instruction)</label>
                        <textarea
                            id="persona"
                            rows={5}
                            value={persona}
                            onChange={(e) => setPersona(e.target.value)}
                            placeholder="You are a helpful assistant for the HR department. Your role is to answer questions based on the provided company policy documents. Be friendly and professional."
                            className="w-full bg-black/20 border border-white/20 rounded-lg py-2 px-3 text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                            disabled={isProcessing}
                        />
                         <p className="text-xs text-gray-400 mt-2">Describe how your chatbot should behave and what its purpose is.</p>
                    </div>

                     <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Knowledge Base (Optional)</label>
                        <div 
                            onDragEnter={onDragEnter}
                            onDragLeave={onDragLeave}
                            onDragOver={onDragOver}
                            onDrop={onDrop}
                            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors duration-300 ${isDragging ? `border-yellow-400 bg-black/20` : 'border-white/20 hover:border-white/40'}`}
                        >
                            <input
                                type="file"
                                multiple
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={(e) => handleFileChange(e.target.files)}
                                accept=".pdf,.txt,.md,.docx"
                                disabled={isProcessing}
                            />
                            <div className="flex flex-col items-center text-gray-300">
                                <UploadCloudIcon className="w-12 h-12 mb-4 text-gray-400" />
                                <p className="text-lg font-semibold">Upload Documents</p>
                                <p>or <span className={`font-semibold text-yellow-400`}>drag and drop</span> (PDF, TXT, DOCX)</p>
                            </div>
                        </div>
                    </div>
                     {files.length > 0 && (
                        <div className="mt-6">
                            <h3 className="font-semibold text-lg text-white mb-3">Knowledge Files ({files.length})</h3>
                            <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                                {files.map((file, i) => (
                                    <div key={`${file.name}-${i}`} className="bg-black/20 p-3 rounded-lg flex items-center justify-between">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <FileIcon className="w-6 h-6 text-gray-300 flex-shrink-0" />
                                            <div className="flex flex-col overflow-hidden">
                                              <span className="text-white font-medium truncate">{file.name}</span>
                                              <span className="text-gray-400 text-sm">{formatBytes(file.size)}</span>
                                            </div>
                                        </div>
                                        <button onClick={() => handleRemoveFile(file.name)} className="p-1 text-gray-400 hover:text-red-400 transition-colors flex-shrink-0 ml-2">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-8 border-t border-white/10 pt-6">
                    <button
                        onClick={handleSave}
                        disabled={!name.trim() || !persona.trim() || isProcessing}
                        className="w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Saving Chatbot...</span>
                            </>
                        ) : (
                           <>
                            <BotIcon className="w-5 h-5"/>
                            Save Chatbot
                           </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatbotBuilderView;