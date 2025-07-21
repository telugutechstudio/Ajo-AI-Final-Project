
import React, { useMemo } from 'react';
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } from 'docx';
import type { PptResult } from '../types';
import { DownloadIcon } from './icons';
import { downloadFile } from '../utils';
import * as authService from '../services/authService';

// --- EXPORT HELPERS ---

const exportAsTxt = (result: PptResult, fileName: string) => {
    let content = `${result.title}\n\n`;
    content += result.slides.map(slide => 
        `--- SLIDE: ${slide.title} ---\n` + slide.bulletPoints.map(bp => `- ${bp}`).join('\n')
    ).join('\n\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    downloadFile(blob, `${fileName}_presentation.txt`);
};

const exportAsDocx = async (result: PptResult, fileName: string) => {
    const doc = new Document({
        sections: [{
            children: [
                new Paragraph({
                    text: result.title,
                    heading: HeadingLevel.TITLE,
                    alignment: AlignmentType.CENTER,
                }),
                ...result.slides.flatMap(slide => [
                    new Paragraph({
                        text: slide.title,
                        heading: HeadingLevel.HEADING_1,
                        spacing: { before: 400, after: 200 },
                    }),
                    ...slide.bulletPoints.map(bp => new Paragraph({
                        text: bp,
                        bullet: { level: 0 },
                    }))
                ]),
            ],
        }],
    });
    const blob = await Packer.toBlob(doc);
    downloadFile(blob, `${fileName}_presentation.docx`);
};


// --- COMPONENT ---

interface PptResultViewProps {
  result: PptResult | null;
  fileName: string;
  onStartNew: () => void;
}

const PptResultView: React.FC<PptResultViewProps> = ({ result, fileName, onStartNew }) => {
    
    const handleExport = (format: 'TXT' | 'DOCX') => {
        if (!result) return;
        const baseFileName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
        if (format === 'TXT') {
            exportAsTxt(result, baseFileName);
        } else {
            exportAsDocx(result, baseFileName);
            authService.logReportGeneration();
        }
    };

    if (!result) {
        return <div className="text-center p-8">No presentation data available.</div>;
    }

    if (result.slides.length === 0) {
        return (
            <div className="w-full max-w-2xl mx-auto p-4 md:p-8 text-center">
                 <div className="glass-card rounded-2xl p-8">
                    <h1 className="text-2xl font-bold text-white mb-2">{result.title}</h1>
                    <p className="text-lg text-gray-300 my-6">The AI could not summarize this document into a presentation.</p>
                    <button
                        onClick={onStartNew}
                        className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-5xl mx-auto p-4 md:p-8">
            <div className="glass-card rounded-2xl">
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <div>
                       <h1 className="text-2xl font-bold text-white">{result.title}</h1>
                       <p className="text-gray-300">Summary of: {fileName}</p>
                    </div>
                     <div className="flex gap-2">
                         <button onClick={() => handleExport('TXT')} className="bg-white/5 hover:bg-white/10 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
                            <DownloadIcon className="w-5 h-5"/> TXT
                         </button>
                         <button onClick={() => handleExport('DOCX')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
                            <DownloadIcon className="w-5 h-5"/> DOCX
                         </button>
                     </div>
                </div>
                <div className="p-6 h-[65vh] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {result.slides.map((slide, slideIndex) => (
                            <div key={slideIndex} className="bg-black/20 rounded-lg p-5 flex flex-col h-full border border-white/10">
                                <h2 className="text-lg font-bold text-orange-300 border-b-2 border-orange-400/50 pb-2 mb-3">{slide.title}</h2>
                                <ul className="space-y-2 list-disc list-inside text-gray-300">
                                    {slide.bulletPoints.map((point, pointIndex) => (
                                        <li key={pointIndex}>{point}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="p-6 border-t border-white/10">
                     <button
                        onClick={onStartNew}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PptResultView;
