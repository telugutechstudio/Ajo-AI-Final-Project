
import React, { useState, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';
import type { Transcript, TranscriptSegment } from '../types';
import { TRANSLATION_LANGUAGES, EXPORT_FORMATS } from '../constants';
import { TOOL_CREDIT_COSTS } from '../config';
import { LanguagesIcon, DownloadIcon, ChevronDownIcon, LoaderIcon, SpeakerIcon } from './icons';
import CopyShareButtons from './CopyShareButtons';
import { downloadFile, blobToBase64 } from '../utils';
import * as authService from '../services/authService';

// --- HELPERS ---

const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// --- EXPORT HELPERS ---

const formatSrtTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
    const milliseconds = Math.round((totalSeconds - Math.floor(totalSeconds)) * 1000).toString().padStart(3, '0');
    return `${hours}:${minutes}:${seconds},${milliseconds}`;
};

const formatVttTime = (totalSeconds: number): string => {
    return formatSrtTime(totalSeconds).replace(',', '.');
};

const exportAsTxt = (transcript: Transcript, fileName: string) => {
    let content = `${transcript.title}\n\n`;
    content += transcript.segments.map(s => 
        `${s.speaker ? `[${s.speaker}]` : ''} (${formatTime(s.startTime)}) \n${s.text}`
    ).join('\n\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    downloadFile(blob, `${fileName}.txt`);
};

const exportAsCsv = (transcript: Transcript, fileName: string) => {
    let csvContent = 'startTime,endTime,speaker,text\n';
    transcript.segments.forEach(s => {
        const row = [
            s.startTime,
            s.endTime,
            s.speaker || 'Unknown',
            `"${s.text.replace(/"/g, '""')}"`
        ].join(',');
        csvContent += row + '\n';
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadFile(blob, `${fileName}.csv`);
};

const exportAsSrt = (transcript: Transcript, fileName: string) => {
    const srtContent = transcript.segments.map((s, i) => 
        `${i + 1}\n${formatSrtTime(s.startTime)} --> ${formatSrtTime(s.endTime)}\n${s.text}`
    ).join('\n\n');
    const blob = new Blob([srtContent], { type: 'application/x-subrip;charset=utf-8;' });
    downloadFile(blob, `${fileName}.srt`);
};

const exportAsVtt = (transcript: Transcript, fileName: string) => {
    let vttContent = 'WEBVTT\n\n';
    vttContent += transcript.segments.map(s => 
        `${formatVttTime(s.startTime)} --> ${formatVttTime(s.endTime)}\n${s.text}`
    ).join('\n\n');
    const blob = new Blob([vttContent], { type: 'text/vtt;charset=utf-8;' });
    downloadFile(blob, `${fileName}.vtt`);
};

const exportAsPdf = async (transcript: Transcript, fileName: string) => {
    const doc = new jsPDF();

    try {
        // Fetch a font that supports Telugu and other non-Latin characters.
        const fontBlob = await fetch('https://fonts.gstatic.com/s/notosanstelugu/v28/0FlxVET-GvOmsD2zQvD28rYso5gBSy1K93EWpc4P.ttf').then(res => {
            if (!res.ok) throw new Error(`Failed to download font: ${res.statusText}`);
            return res.blob();
        });

        const base64Font = await blobToBase64(fontBlob);
        
        doc.addFileToVFS("NotoSansTelugu-Regular.ttf", base64Font);
        doc.addFont("NotoSansTelugu-Regular.ttf", "NotoSansTelugu", "normal");
        doc.setFont("NotoSansTelugu");
    } catch (error) {
        console.error("Failed to load custom font for PDF. Non-latin characters may not render correctly.", error);
        alert("Could not load the special font for PDF export. The resulting file may not display some characters correctly.");
    }
    
    doc.text(transcript.title, 15, 15);

    autoTable(doc, {
        startY: 25,
        head: [['Time', 'Speaker', 'Text']],
        body: transcript.segments.map(s => [
            `${formatTime(s.startTime)}`,
            s.speaker || 'N/A',
            s.text
        ]),
        styles: { 
            font: "NotoSansTelugu", // Use the custom font for the table body
            cellPadding: 2, 
            fontSize: 10 
        },
        headStyles: { 
            fillColor: [249, 83, 198], // Pink color
            font: "helvetica" // Use a standard font for the header
        },
        didDrawPage: (data: any) => {
            doc.setFont("NotoSansTelugu");
            doc.text(`Page ${data.pageNumber}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
        }
    });

    doc.save(`${fileName}.pdf`);
};

const exportAsDocx = async (transcript: Transcript, fileName: string) => {
    const doc = new Document({
        sections: [{
            children: [
                new Paragraph({
                    children: [new TextRun({ text: transcript.title, bold: true, size: 32 })],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 300 },
                }),
                ...transcript.segments.flatMap(s => [
                    new Paragraph({
                        children: [
                            new TextRun({ text: `${formatTime(s.startTime)}`, color: "808080", size: 18 }),
                            new TextRun({ text: `\t${s.speaker ? s.speaker : ''}`, bold: true, size: 24 }),
                        ],
                        spacing: { before: 200 }
                    }),
                    new Paragraph({
                        children: [new TextRun({ text: s.text, size: 22 })],
                        spacing: { after: 150 },
                    }),
                ]),
            ],
        }],
    });
    const blob = await Packer.toBlob(doc);
    downloadFile(blob, `${fileName}.docx`);
};

// --- COMPONENT ---

interface TranscriptionViewProps {
  transcript: Transcript | null;
  fileName: string;
  onStartNew: () => void;
  onTranslate: (text: string, language: string) => Promise<string | null>;
}

const Segment: React.FC<{ segment: TranscriptSegment }> = ({ segment }) => {
    return (
        <div className="flex gap-4 group">
            <div className="w-24 flex-shrink-0 text-right text-sm font-mono text-gray-300 pt-1">{formatTime(segment.startTime)}</div>
            <div className="flex-grow">
                {segment.speaker && (
                    <p className="font-semibold text-pink-300 mb-1 flex items-center gap-2">
                        <SpeakerIcon className="w-4 h-4" />
                        {segment.speaker}
                    </p>
                )}
                <p className="text-gray-200 leading-relaxed">{segment.text}</p>
            </div>
        </div>
    );
};

const TranscriptionView: React.FC<TranscriptionViewProps> = ({ transcript, fileName, onStartNew, onTranslate }) => {
    const [isTranslating, setIsTranslating] = useState(false);
    const [translation, setTranslation] = useState<string | null>(null);
    const [targetLanguage, setTargetLanguage] = useState('Spanish');

    const fullText = useMemo(() => {
        return transcript?.segments.map(s => `${s.speaker ? `[${s.speaker}] ${s.text}` : s.text}`).join('\n\n') || '';
    }, [transcript]);

    const handleTranslate = async () => {
        if (!fullText) return;
        setIsTranslating(true);
        setTranslation(null);
        
        const result = await onTranslate(fullText, targetLanguage);
        if (result) {
            setTranslation(result);
        }
        
        setIsTranslating(false);
    };
    
    const handleExport = async (format: string) => {
        if (!transcript) return;
        const baseFileName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
        
        try {
            switch (format) {
                case 'TXT': return exportAsTxt(transcript, baseFileName);
                case 'CSV': return exportAsCsv(transcript, baseFileName);
                case 'SRT': return exportAsSrt(transcript, baseFileName);
                case 'VTT': return exportAsVtt(transcript, baseFileName);
                case 'PDF': 
                    await exportAsPdf(transcript, baseFileName);
                    authService.logReportGeneration();
                    return;
                case 'DOCX':
                    await exportAsDocx(transcript, baseFileName);
                    authService.logReportGeneration();
                    return;
            }
        } catch (e) {
            console.error(`Failed to export as ${format}`, e);
            alert(`Sorry, there was an error exporting as ${format}.`);
        }
    };

    if (!transcript) {
        return <div className="text-center p-8">No transcript data available.</div>;
    }

    return (
        <div className="w-full max-w-5xl mx-auto p-4 md:p-8">
            <div className="glass-card rounded-2xl">
                <div className="p-6 border-b border-white/10">
                    <h1 className="text-2xl font-bold text-white">{transcript.title}</h1>
                    <p className="text-gray-300">Original file: {fileName}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3">
                    <div className="md:col-span-2 p-6 h-[60vh] overflow-y-auto space-y-4">
                        <div className="flex justify-end -mr-2 -mt-2 mb-2">
                             <CopyShareButtons textToCopy={fullText} shareTitle={transcript.title} />
                        </div>
                        {transcript.segments.map((segment, index) => (
                            <Segment key={index} segment={segment} />
                        ))}
                    </div>
                    <div className="md:col-span-1 bg-black/10 md:border-l border-white/10 p-6">
                        <div className="sticky top-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Tools</h3>
                            
                            {/* Translation */}
                            <div className="bg-black/20 p-4 rounded-lg">
                                <h4 className="font-semibold text-white flex items-center gap-2 mb-3">
                                    <LanguagesIcon className="w-5 h-5 text-green-400"/>
                                    Translate Transcript
                                </h4>
                                <div className="relative">
                                    <select
                                        value={targetLanguage}
                                        onChange={e => setTargetLanguage(e.target.value)}
                                        className="w-full bg-black/20 border border-white/20 rounded-lg py-2 pl-3 pr-8 appearance-none text-white focus:ring-2 focus:ring-green-500"
                                    >
                                        {TRANSLATION_LANGUAGES.map(lang => <option key={lang}>{lang}</option>)}
                                    </select>
                                    <ChevronDownIcon className="w-5 h-5 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"/>
                                </div>
                                <button 
                                    onClick={handleTranslate}
                                    disabled={isTranslating}
                                    className="w-full mt-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    {isTranslating ? <LoaderIcon className="w-5 h-5 animate-spin"/> : `Translate (${TOOL_CREDIT_COSTS.AI_TRANSLATE} Credits)`}
                                </button>
                            </div>

                             {translation && (
                                <div className="mt-4 p-4 rounded-lg bg-black/20">
                                    <div className="flex justify-between items-center mb-2">
                                        <h5 className="font-semibold text-white">{targetLanguage} Translation</h5>
                                        <CopyShareButtons textToCopy={translation} shareTitle={`${transcript.title} (Translation)`} />
                                    </div>
                                    <div className="max-h-48 overflow-y-auto">
                                      <p className="text-gray-300 text-sm whitespace-pre-wrap">{translation}</p>
                                    </div>
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

export default TranscriptionView;