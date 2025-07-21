import React from 'react';
import type { Tool } from '../types';
import { ChevronLeftIcon, ImagesToPdfIcon, MergeIcon, SplitIcon, CompressIcon, FileWordIcon, FileExcelIcon, FilePptIcon, FileImageIcon, CameraIcon } from './icons';

interface PdfToolsSelectionProps {
    onSelectTool: (tool: Tool) => void;
    onBack: () => void;
}

const pdfTools: { id: Tool; title: string; description: string; icon: React.FC<{className?:string}>; color: string; enabled: boolean }[] = [
    { id: 'SCAN_TO_PDF', title: 'Scan to PDF', description: 'Use your camera to scan.', icon: CameraIcon, color: 'cyan', enabled: true },
    { id: 'MERGE_PDF', title: 'Merge PDF', description: 'Combine multiple PDF files.', icon: MergeIcon, color: 'red', enabled: true },
    { id: 'SPLIT_PDF', title: 'Split PDF', description: 'Extract pages from a PDF.', icon: SplitIcon, color: 'yellow', enabled: true },
    { id: 'COMPRESS_PDF', title: 'Compress PDF', description: 'Reduce the size of a PDF file.', icon: CompressIcon, color: 'indigo', enabled: true },
    { id: 'IMAGES_TO_PDF', title: 'Images to PDF', description: 'Convert JPG, PNG to a PDF.', icon: ImagesToPdfIcon, color: 'purple', enabled: true },
    { id: 'PDF_TO_WORD', title: 'PDF to Word', description: 'Extract text to a DOCX file.', icon: FileWordIcon, color: 'blue', enabled: true },
    { id: 'PDF_TO_EXCEL', title: 'PDF to Excel', description: 'Extract tables into a CSV.', icon: FileExcelIcon, color: 'green', enabled: true },
    { id: 'PDF_TO_PPT', title: 'PDF to PPT', description: 'Summarize into slides.', icon: FilePptIcon, color: 'orange', enabled: true },
    { id: 'PDF_TO_IMAGE', title: 'PDF to Image', description: 'Convert each page to a PNG.', icon: FileImageIcon, color: 'teal', enabled: true },
];

const ToolCard: React.FC<{tool: typeof pdfTools[0], onSelect: () => void}> = ({ tool, onSelect }) => {
    const baseClasses = "group relative flex flex-col items-center justify-center text-center p-4 w-44 h-44 rounded-2xl transform transition-all duration-300 overflow-hidden";
    const enabledClasses = `glass-card hover:bg-white/10 hover:-translate-y-1 cursor-pointer`;
    const disabledClasses = "glass-card cursor-not-allowed filter grayscale opacity-60";

    const colorMap: { [key: string]: string } = {
        cyan: 'text-cyan-300',
        red: 'text-red-400',
        yellow: 'text-yellow-300',
        indigo: 'text-indigo-300',
        purple: 'text-purple-300',
        blue: 'text-blue-300',
        green: 'text-green-300',
        orange: 'text-orange-300',
        teal: 'text-teal-300',
    };
    
    const iconColor = tool.enabled ? colorMap[tool.color] : 'text-gray-500';

    return (
        <button
            onClick={onSelect}
            disabled={!tool.enabled}
            className={`${baseClasses} ${tool.enabled ? enabledClasses : disabledClasses}`}
            aria-label={tool.title}
        >
            {/* Default State */}
            <div className="transition-opacity duration-300 group-hover:opacity-0">
                <tool.icon className={`w-14 h-14 mb-2 ${iconColor} transition-colors`} />
                <h3 className="font-semibold text-white text-md">{tool.title}</h3>
                {!tool.enabled && <span className="text-xs text-yellow-400 font-bold mt-1">SOON</span>}
            </div>

            {/* Hover State */}
            <div className="absolute inset-0 p-3 flex flex-col items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <h3 className="font-semibold text-white text-md mb-1">{tool.title}</h3>
                <p className="text-xs text-gray-300">{tool.description}</p>
                 {!tool.enabled && <span className="absolute bottom-2 text-xs text-yellow-400 font-bold mt-1">COMING SOON</span>}
            </div>
        </button>
    );
};

const PdfToolsSelection: React.FC<PdfToolsSelectionProps> = ({ onSelectTool, onBack }) => {
    return (
        <div className="w-full max-w-5xl mx-auto p-4 md:p-8">
            <button onClick={onBack} className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors mb-6">
                <ChevronLeftIcon className="w-5 h-5"/>
                Back to Main Menu
            </button>
            <div className="text-center mb-10">
                <h1 className="text-4xl font-bold text-white mb-2">PDF Toolkit</h1>
                <p className="text-lg text-gray-300">Choose a PDF utility to continue.</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8">
                {pdfTools.map(tool => (
                    <ToolCard key={tool.id} tool={tool} onSelect={() => onSelectTool(tool.id)} />
                ))}
            </div>
        </div>
    );
};

export default PdfToolsSelection;