
import React, { useState, useCallback, useEffect } from 'react';
import type { ProcessingOptions, FileObject, Tool } from '../types';
import { TranscriptionMode } from '../types';
import { LANGUAGES } from '../constants';
import { UploadCloudIcon, FileIcon, TrashIcon, SpeakerIcon, WandSparklesIcon, MicIcon, ChevronLeftIcon } from './icons';
import { formatBytes } from '../utils';

interface FileUploadProps {
    onStartProcessing: (files: FileObject[], options: ProcessingOptions, tool: Tool | null) => void;
    isProcessing: boolean;
    tool: Tool | null;
    onBack: () => void;
    initialFiles?: FileObject[];
}

const TOOL_CONFIG = {
    SCRIBE: {
        title: 'Transcribe Audio/Video',
        description: 'Upload audio or video files to generate a transcript with speaker labels.',
        accept: 'audio/*,video/*',
        buttonText: 'Transcribe',
        showOptions: true,
        allowMultiple: true,
        color: 'blue'
    },
    OCR: {
        title: 'Extract Text from Document',
        description: 'Upload an image or PDF to extract its text content using AI.',
        accept: 'image/png,image/jpeg,image/webp,application/pdf',
        buttonText: 'Extract Text',
        showOptions: false,
        allowMultiple: false,
        color: 'purple'
    },
    IMAGES_TO_PDF: {
        title: 'Images to PDF Converter',
        description: 'Upload JPG or PNG images to combine them into a single PDF file.',
        accept: 'image/jpeg,image/png,image/webp',
        buttonText: 'Convert to PDF',
        showOptions: false,
        allowMultiple: true,
        color: 'green'
    },
    MERGE_PDF: {
        title: 'Merge PDFs',
        description: 'Upload multiple PDF files to combine them into a single document.',
        accept: 'application/pdf',
        buttonText: 'Merge PDFs',
        showOptions: false,
        allowMultiple: true,
        color: 'red'
    },
    SPLIT_PDF: {
        title: 'Split PDF',
        description: 'Upload a PDF to extract specific pages or ranges (e.g., 1, 3-5, 8).',
        accept: 'application/pdf',
        buttonText: 'Split PDF',
        showOptions: true, // Special case for page range
        allowMultiple: false,
        color: 'yellow'
    },
    COMPRESS_PDF: {
        title: 'Compress PDF',
        description: 'Upload a PDF to reduce its file size.',
        accept: 'application/pdf',
        buttonText: 'Compress PDF',
        showOptions: false,
        allowMultiple: false,
        color: 'indigo'
    },
    PDF_TO_WORD: {
        title: 'PDF to Word',
        description: 'Upload a PDF to extract its content into an editable Word (DOCX) document.',
        accept: 'application/pdf',
        buttonText: 'Convert to Word',
        showOptions: false,
        allowMultiple: false,
        color: 'blue'
    },
    PDF_TO_EXCEL: {
        title: 'PDF to Excel',
        description: 'Upload a PDF to extract tables into a spreadsheet (CSV) file.',
        accept: 'application/pdf',
        buttonText: 'Extract Tables',
        showOptions: false,
        allowMultiple: false,
        color: 'green'
    },
    PDF_TO_PPT: {
        title: 'PDF to PowerPoint',
        description: 'Upload a PDF to summarize its content into presentation slides.',
        accept: 'application/pdf',
        buttonText: 'Summarize for PPT',
        showOptions: false,
        allowMultiple: false,
        color: 'orange'
    },
    PDF_TO_IMAGE: {
        title: 'PDF to Image',
        description: 'Upload a PDF to convert each page into a high-quality PNG image.',
        accept: 'application/pdf',
        buttonText: 'Convert to Images',
        showOptions: false,
        allowMultiple: false,
        color: 'teal'
    }
};


const FileUpload = ({ onStartProcessing, isProcessing, tool, onBack, initialFiles }: FileUploadProps) => {
    const [files, setFiles] = useState<FileObject[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [options, setOptions] = useState<ProcessingOptions>({
        language: 'English',
        mode: TranscriptionMode.DOLPHIN,
        enableSpeakerRecognition: true,
        enableAudioRestoration: false,
        pageRange: '1',
    });
    
    const config = tool ? TOOL_CONFIG[tool as keyof typeof TOOL_CONFIG] : null;

    useEffect(() => {
        // Clear files if the tool changes, unless initial files are provided (from recording)
        if (initialFiles && initialFiles.length > 0) {
            setFiles(initialFiles);
        } else {
            setFiles([]);
        }
    }, [tool, initialFiles]);


    const handleFileChange = (selectedFiles: FileList | null) => {
        if (selectedFiles) {
             const newFiles = Array.from(selectedFiles).map(file => ({
                id: `${file.name}-${file.lastModified}-${Math.random()}`,
                file,
            }));

            if(config && !config.allowMultiple) {
                setFiles(newFiles.length > 0 ? [newFiles[0]] : []);
            } else {
                setFiles(prev => [...prev, ...newFiles]);
            }
        }
    };

    const handleRemoveFile = (id: string) => {
        setFiles(prev => prev.filter(f => f.id !== id));
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
    
    const handleOptionChange = <K extends keyof ProcessingOptions>(
      key: K, value: ProcessingOptions[K]
    ) => {
        setOptions(prev => ({ ...prev, [key]: value }));
    };

    if (!config) {
        return <div className="text-center">Tool not found. Please go back and select a tool.</div>
    }

    const color = config.color;
    
    return (
        <div className="w-full max-w-2xl mx-auto p-4 md:p-8">
             <button onClick={onBack} className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors mb-4">
                <ChevronLeftIcon className="w-5 h-5"/>
                Back to Dashboard
            </button>
            <div className="glass-card rounded-2xl p-6 md:p-8">

                <h1 className="text-3xl font-bold text-white mb-2 text-center">
                    {config.title}
                </h1>
                <p className="text-gray-300 mb-6 text-center">
                    {config.description}
                </p>
                
                <div 
                    onDragEnter={onDragEnter}
                    onDragLeave={onDragLeave}
                    onDragOver={onDragOver}
                    onDrop={onDrop}
                    className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors duration-300 ${isDragging ? `border-pink-400 bg-black/20` : 'border-white/20 hover:border-white/40'}`}
                >
                    <input
                        type="file"
                        multiple={config.allowMultiple}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => handleFileChange(e.target.files)}
                        accept={config.accept}
                        disabled={isProcessing}
                    />
                    <div className="flex flex-col items-center text-gray-300">
                        <UploadCloudIcon className="w-12 h-12 mb-4 text-gray-400" />
                        <p className="text-lg font-semibold">Drag & drop files here</p>
                        <p>or <span className={`font-semibold text-pink-400`}>click to browse</span></p>
                    </div>
                </div>

                {files.length > 0 && (
                    <div className="mt-6">
                        <h3 className="font-semibold text-lg text-white mb-3">Selected Files ({files.length})</h3>
                        <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                            {files.map(f => (
                                <div key={f.id} className="bg-black/20 p-3 rounded-lg flex items-center justify-between">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        {tool === 'SCRIBE' ? (
                                            <MicIcon className="w-6 h-6 text-gray-300 flex-shrink-0"/>
                                        ) : (
                                            <FileIcon className="w-6 h-6 text-gray-300 flex-shrink-0" />
                                        )}
                                        <div className="flex flex-col overflow-hidden">
                                          <span className="text-white font-medium truncate">{f.file.name}</span>
                                          <span className="text-gray-400 text-sm">{formatBytes(f.file.size)}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => handleRemoveFile(f.id)} className="p-1 text-gray-400 hover:text-red-400 transition-colors flex-shrink-0 ml-2">
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {tool === 'SCRIBE' && (
                    <div className="mt-8">
                        <h3 className="text-lg font-semibold text-white mb-4">Transcription Options</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Transcription Language</label>
                                <select 
                                    value={options.language}
                                    onChange={(e) => handleOptionChange('language', e.target.value)}
                                    className="w-full bg-black/20 border border-white/20 rounded-lg py-2 px-3 text-white focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                                >
                                    {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Transcription Mode</label>
                                <div className="flex bg-black/20 rounded-lg p-1 space-x-1">
                                    {Object.values(TranscriptionMode).map(mode => (
                                        <button 
                                            key={mode} 
                                            onClick={() => handleOptionChange('mode', mode)}
                                            className={`w-full py-1.5 text-sm font-semibold rounded-md transition-colors ${options.mode === mode ? 'bg-pink-500 text-white' : 'text-gray-300 hover:bg-white/10'}`}
                                        >
                                            {mode.split(' ')[0]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 space-y-4">
                            <label className="flex items-center justify-between cursor-pointer bg-black/20 p-3 rounded-lg hover:bg-black/30 transition-colors">
                                <span className="flex items-center gap-3">
                                    <SpeakerIcon className="w-5 h-5 text-pink-400"/>
                                    <span className="font-medium text-white">Speaker Recognition</span>
                                </span>
                                <input 
                                    type="checkbox" 
                                    checked={options.enableSpeakerRecognition}
                                    onChange={(e) => handleOptionChange('enableSpeakerRecognition', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="relative w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-pink-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
                            </label>
                            <label className="flex items-center justify-between cursor-pointer bg-black/20 p-3 rounded-lg hover:bg-black/30 transition-colors">
                                <span className="flex items-center gap-3">
                                    <WandSparklesIcon className="w-5 h-5 text-purple-400"/>
                                    <span className="font-medium text-white">AI Audio Restoration</span>
                                </span>
                                <input 
                                    type="checkbox" 
                                    checked={options.enableAudioRestoration}
                                    onChange={(e) => handleOptionChange('enableAudioRestoration', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="relative w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-purple-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                            </label>
                        </div>
                    </div>
                )}

                {tool === 'SPLIT_PDF' && (
                     <div className="mt-8">
                        <h3 className="text-lg font-semibold text-white mb-4">Split Options</h3>
                        <div>
                            <label htmlFor="pageRange" className="block text-sm font-medium text-gray-300 mb-2">Pages to Extract</label>
                             <input 
                                type="text"
                                id="pageRange"
                                value={options.pageRange}
                                onChange={(e) => handleOptionChange('pageRange', e.target.value)}
                                placeholder="e.g. 1, 3-5, 8"
                                className={`w-full bg-black/20 border border-white/20 rounded-lg py-2 px-3 text-white focus:ring-2 focus:ring-${color}-500 focus:border-${color}-500`}
                            />
                            <p className="text-xs text-gray-400 mt-2">Enter page numbers or ranges separated by commas.</p>
                        </div>
                    </div>
                )}

                <div className="mt-8 border-t border-white/10 pt-6">
                    <button
                        onClick={() => onStartProcessing(files, options, tool)}
                        disabled={files.length === 0 || isProcessing}
                        className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:bg-gray-600 disabled:cursor-not-allowed bg-pink-600 hover:bg-pink-700 text-white shadow-lg shadow-pink-500/20`}
                    >
                        {isProcessing ? (
                           <>
                           <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                           <span>Processing...</span>
                           </>
                        ) : (
                           `${config.buttonText} ${files.length > 0 ? files.length + ` File${files.length > 1 ? 's' : ''}`: ''}`
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FileUpload;