
import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';
import type { OcrResult } from '../types';
import { TRANSLATION_LANGUAGES } from '../constants';
import { TOOL_CREDIT_COSTS } from '../config';
import { LanguagesIcon, DownloadIcon, ChevronDownIcon, WandSparklesIcon, LoaderIcon } from './icons';
import CopyShareButtons from './CopyShareButtons';
import { downloadFile, blobToBase64 } from '../utils';
import * as authService from '../services/authService';

// --- EXPORT HELPERS ---
const exportAsTxt = (content: string, fileName: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    downloadFile(blob, `${fileName}.txt`);
};

const exportAsPdf = async (title: string, text: string, fileName: string) => {
    const doc = new jsPDF();
    try {
        const fontBlob = await fetch('https://fonts.gstatic.com/s/notosans/v27/o-0IIpQlx3QUlC5A4PNr5TRG.ttf').then(res => res.blob());
        const base64Font = await blobToBase64(fontBlob);
        doc.addFileToVFS("NotoSans-Regular.ttf", base64Font);
        doc.addFont("NotoSans-Regular.ttf", "NotoSans", "normal");
        doc.setFont("NotoSans");
    } catch (error) {
        console.error("Failed to load custom font for PDF.", error);
    }
    
    doc.setFontSize(18);
    doc.text(title, 15, 20);
    
    doc.setFontSize(11);
    const splitText = doc.splitTextToSize(text, 180);
    doc.text(splitText, 15, 30);

    doc.save(`${fileName}.pdf`);
};

const exportAsDocx = async (title: string, text: string, fileName: string) => {
    const paragraphs = text.split('\n').map(p => new Paragraph({ children: [new TextRun({ text: p, size: 22 })], spacing: { after: 150 } }));
    const doc = new Document({
        sections: [{
            children: [
                new Paragraph({ children: [new TextRun({ text: title, bold: true, size: 32 })], alignment: AlignmentType.CENTER, spacing: { after: 300 } }),
                ...paragraphs,
            ],
        }],
    });
    const blob = await Packer.toBlob(doc);
    downloadFile(blob, `${fileName}.docx`);
};

// --- COMPONENT ---

interface OcrResultViewProps {
  result: OcrResult | null;
  fileName: string;
  onStartNew: () => void;
  onPolish: (text: string) => Promise<string | null>;
  onTranslate: (text: string, language: string) => Promise<string | null>;
}

type TextState = 'original' | 'polished' | 'translated';

const OcrResultView: React.FC<OcrResultViewProps> = ({ result, fileName, onStartNew, onPolish, onTranslate }) => {
    const [displayedText, setDisplayedText] = useState(result?.text || '');
    const [lastAction, setLastAction] = useState<TextState>('original');
    const [targetLanguage, setTargetLanguage] = useState('Spanish');
    const [isPolishing, setIsPolishing] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);
    
    const EXPORT_FORMATS = ['DOCX', 'PDF', 'TXT'];

    const handleTranslate = async () => {
        if (!displayedText || isPolishing || isTranslating) return;
        setIsTranslating(true);
        try {
            const translatedResult = await onTranslate(displayedText, targetLanguage);
            if (translatedResult) {
                setDisplayedText(translatedResult);
                setLastAction('translated');
            }
        } finally {
            setIsTranslating(false);
        }
    };
    
    const handlePolishText = async () => {
        if (!displayedText || isPolishing || isTranslating) return;
        setIsPolishing(true);
        try {
            const polishedResult = await onPolish(displayedText);
            if (polishedResult) {
                setDisplayedText(polishedResult);
                setLastAction('polished');
            }
        } finally {
            setIsPolishing(false);
        }
    };

    const handleRevertToOriginal = () => {
        if (!result) return;
        setDisplayedText(result.text);
        setLastAction('original');
    };

    const handleExport = async (format: string) => {
        if (!result) return;
        const baseFileName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
        const textToExport = displayedText;
        
        try {
            switch (format) {
                case 'TXT': return exportAsTxt(textToExport, baseFileName);
                case 'PDF':
                    await exportAsPdf(result.title, textToExport, baseFileName);
                    authService.logReportGeneration();
                    return;
                case 'DOCX':
                    await exportAsDocx(result.title, textToExport, baseFileName);
                    authService.logReportGeneration();
                    return;
            }
        } catch (e) {
            console.error(`Failed to export as ${format}`, e);
            alert(`Sorry, there was an error exporting as ${format}.`);
        }
    };

    if (!result) {
        return <div className="text-center p-8">No text extraction data available.</div>;
    }
    
    const getStatusBadge = () => {
        switch (lastAction) {
            case 'polished':
                return (
                    <span className="bg-purple-500/20 text-purple-300 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                        <WandSparklesIcon className="w-4 h-4" />
                        AI Polished
                    </span>
                );
            case 'translated':
                 return (
                    <span className="bg-green-500/20 text-green-300 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                        <LanguagesIcon className="w-4 h-4" />
                        Translated to {targetLanguage}
                    </span>
                );
            default:
                return null;
        }
    };

    return (
        <div className="w-full max-w-5xl mx-auto p-4 md:p-8">
            <div className="glass-card rounded-2xl">
                <div className="p-6 border-b border-white/10">
                     <div className="flex justify-between items-start">
                        <div>
                           <h1 className="text-2xl font-bold text-white">{result.title}</h1>
                           <p className="text-gray-300">Original file: {fileName}</p>
                        </div>
                        {getStatusBadge()}
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3">
                    <div className="md:col-span-2 p-6 h-[60vh] overflow-y-auto">
                        <div className="flex justify-end -mr-2 -mt-2 mb-2">
                            <CopyShareButtons textToCopy={displayedText} shareTitle={result.title} />
                        </div>
                       <textarea
                          value={displayedText}
                          onChange={(e) => setDisplayedText(e.target.value)}
                          className="w-full h-full bg-transparent text-gray-200 leading-relaxed whitespace-pre-wrap font-sans resize-none border-none focus:ring-0"
                       />
                    </div>
                    <div className="md:col-span-1 bg-black/10 md:border-l border-white/10 p-6">
                        <div className="sticky top-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Tools</h3>
                            
                            {/* AI Polish */}
                            <div className="bg-black/20 p-4 rounded-lg">
                                <h4 className="font-semibold text-white flex items-center gap-2 mb-2">
                                    <WandSparklesIcon className="w-5 h-5 text-purple-400"/>
                                    AI Drafting
                                </h4>
                                 <button 
                                    onClick={handlePolishText}
                                    disabled={isPolishing || isTranslating}
                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:bg-gray-500 disabled:cursor-not-allowed"
                                >
                                    {isPolishing ? <LoaderIcon className="w-5 h-5 animate-spin"/> : `Polish with AI (${TOOL_CREDIT_COSTS.AI_POLISH} Credits)`}
                                </button>
                            </div>

                            {/* Translation */}
                            <div className="mt-6 bg-black/20 p-4 rounded-lg">
                                <h4 className="font-semibold text-white flex items-center gap-2 mb-3">
                                    <LanguagesIcon className="w-5 h-5 text-green-400"/>
                                    Translate Text
                                </h4>
                                <div className="relative">
                                    <select
                                        value={targetLanguage}
                                        onChange={e => setTargetLanguage(e.target.value)}
                                        className="w-full bg-black/20 border border-white/20 rounded-lg py-2 pl-3 pr-8 appearance-none text-white focus:ring-2 focus:ring-green-500"
                                        disabled={isPolishing || isTranslating}
                                    >
                                        {TRANSLATION_LANGUAGES.map(lang => <option key={lang}>{lang}</option>)}
                                    </select>
                                    <ChevronDownIcon className="w-5 h-5 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"/>
                                </div>
                                <button 
                                    onClick={handleTranslate}
                                    disabled={isPolishing || isTranslating}
                                    className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:bg-gray-500 disabled:cursor-not-allowed"
                                >
                                     {isTranslating ? <LoaderIcon className="w-5 h-5 animate-spin"/> : `Translate (${TOOL_CREDIT_COSTS.AI_TRANSLATE} Credits)`}
                                </button>
                            </div>
                            
                            {lastAction !== 'original' && (
                                <div className="mt-4">
                                     <button 
                                        onClick={handleRevertToOriginal}
                                        className="w-full text-sm text-gray-400 hover:text-white transition-colors"
                                    >
                                        Revert to Original
                                    </button>
                                </div>
                            )}

                            {/* Export */}
                            <div className="mt-6 bg-black/20 p-4 rounded-lg">
                                <h4 className="font-semibold text-white flex items-center gap-2 mb-3">
                                    <DownloadIcon className="w-5 h-5 text-pink-400"/>
                                    Export
                                </h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {EXPORT_FORMATS.map(format => (
                                        <button 
                                          key={format} 
                                          onClick={() => handleExport(format)}
                                          className="bg-white/5 hover:bg-white/10 text-gray-200 font-medium py-1.5 px-3 rounded-md text-sm transition-colors">
                                            {format}
                                        </button>
                                    ))}
                                </div>
                            </div>
                           
                            <div className="mt-8 border-t border-white/10 pt-6">
                                <button
                                    onClick={onStartNew}
                                    className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                                >
                                    Back to Dashboard
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OcrResultView;
