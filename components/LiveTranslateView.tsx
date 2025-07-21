import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LANGUAGES, TRANSLATION_LANGUAGES } from '../constants';
import { ChevronLeftIcon, MicIcon, StopCircleIcon, LanguagesIcon } from './icons';
import type { Tool } from '../types';
import { getBcp47Tag } from '../utils';
import CopyShareButtons from './CopyShareButtons';

interface LiveTranslateViewProps {
    onBack: () => void;
    onTranslate: (text: string, language: string) => Promise<string | null>;
    checkAccess: (tool: Tool) => Promise<boolean>;
}

type Status = 'idle' | 'listening' | 'processing';

const LiveTranslateView: React.FC<LiveTranslateViewProps> = ({ onBack, onTranslate, checkAccess }) => {
    const [status, setStatus] = useState<Status>('idle');
    const [sourceLang, setSourceLang] = useState('English');
    const [targetLang, setTargetLang] = useState('Telugu');
    const [transcribedText, setTranscribedText] = useState('');
    const [translatedText, setTranslatedText] = useState('');
    const [error, setError] = useState<string | null>(null);

    const recognitionRef = useRef<any>(null); // SpeechRecognition instance
    const finalTranscriptRef = useRef<string>('');
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const textToTranslateBufferRef = useRef<string>('');
    const statusRef = useRef<Status>('idle'); 
    
    useEffect(() => {
        statusRef.current = status;
    }, [status]);


    const handleTranslation = useCallback(async (textToTranslate: string) => {
        if (!textToTranslate) return;

        setStatus('processing');
        const hasAccess = await checkAccess('LIVE_TRANSLATE');
        if (!hasAccess) {
            setError("Translation stopped. Access denied.");
            if (recognitionRef.current) recognitionRef.current.stop();
            setStatus('idle');
            return;
        }
        
        try {
            const translation = await onTranslate(textToTranslate, targetLang);
            if (translation) {
                setTranslatedText(prev => (prev ? prev + ' ' : '') + translation);
            }
        } catch (e: any) {
            console.error("Translation error", e);
            setError(e.message || "Failed to translate.");
        } finally {
            if (statusRef.current !== 'idle') {
                setStatus('listening');
            }
        }
    }, [checkAccess, onTranslate, targetLang]);

    const stopListening = useCallback(() => {
        setStatus('idle');
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        
        const leftoverText = textToTranslateBufferRef.current.trim();
        if (leftoverText) {
            handleTranslation(leftoverText);
            textToTranslateBufferRef.current = '';
        }
    }, [handleTranslation]);
    
    const startListening = useCallback(() => {
        finalTranscriptRef.current = '';
        textToTranslateBufferRef.current = '';
        setTranscribedText('');
        setTranslatedText('');
        setError(null);
        setStatus('listening');

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setError("Speech recognition is not supported by your browser.");
            setStatus('idle');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = getBcp47Tag(sourceLang);
        recognitionRef.current = recognition;

        recognition.onresult = (event: any) => {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

            let interimTranscript = '';
            let newFinalChunk = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const transcriptPart = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    newFinalChunk += transcriptPart;
                } else {
                    interimTranscript += transcriptPart;
                }
            }
            
            if (newFinalChunk) {
                const trimmedChunk = newFinalChunk.trim();
                finalTranscriptRef.current += trimmedChunk + ' ';
                textToTranslateBufferRef.current += trimmedChunk + ' ';
            }

            setTranscribedText(finalTranscriptRef.current + interimTranscript);

            debounceTimerRef.current = setTimeout(() => {
                const textToProcess = textToTranslateBufferRef.current.trim();
                if (textToProcess) {
                    handleTranslation(textToProcess);
                    textToTranslateBufferRef.current = ''; // Clear buffer
                }
            }, 1200); // 1.2s pause before translating
        };

        recognition.onerror = (event: any) => {
            console.error("Speech recognition error", event.error);
            setError(`Speech recognition error: ${event.error}. Please check microphone permissions.`);
            setStatus('idle');
        };
        
        recognition.onend = () => {
            if (statusRef.current === 'listening' || statusRef.current === 'processing') {
                recognition.start();
            }
        };
        
        recognition.start();

    }, [sourceLang, handleTranslation]);

    const handleStartStop = () => {
        if (status === 'idle') {
            startListening();
        } else {
            stopListening();
        }
    };

    const handleSourceLangChange = (lang: string) => {
        setSourceLang(lang);
        if (status !== 'idle') {
            stopListening();
        }
    };
    
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);


    return (
        <div className="w-full max-w-4xl mx-auto p-4 md:p-8 fade-in h-full flex flex-col">
            <button onClick={onBack} className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors mb-4 self-start">
                <ChevronLeftIcon className="w-5 h-5"/>
                Back to Dashboard
            </button>
            <div className="glass-card rounded-2xl p-6 flex-grow flex flex-col">
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-white mb-2">Live Translation</h1>
                    <p className="text-gray-300">Speak into your microphone and see the live translation.</p>
                </div>

                {/* Controls */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 p-4 bg-black/20 rounded-lg">
                    <div className="w-full md:w-auto flex-grow">
                        <label className="block text-sm font-medium text-gray-300 mb-1">From</label>
                        <select
                            value={sourceLang}
                            onChange={(e) => handleSourceLangChange(e.target.value)}
                            className="w-full bg-black/20 border border-white/20 rounded-lg py-2 px-3 text-white focus:ring-2 focus:ring-pink-500"
                            disabled={status !== 'idle'}
                        >
                            {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                        </select>
                    </div>
                    
                    <button onClick={handleStartStop} className={`px-6 py-4 rounded-full text-white font-bold flex items-center gap-3 transition-colors text-lg ${status === 'listening' || status === 'processing' ? 'bg-red-600 hover:bg-red-700' : 'bg-pink-600 hover:bg-pink-700'}`}>
                        {status === 'listening' || status === 'processing' ? (
                            <> <StopCircleIcon className="w-7 h-7 animate-pulse" /> Stop </>
                        ) : (
                            <> <MicIcon className="w-7 h-7" /> Start </>
                        )}
                    </button>

                    <div className="w-full md:w-auto flex-grow">
                        <label className="block text-sm font-medium text-gray-300 mb-1 text-left md:text-right">To</label>
                         <select
                            value={targetLang}
                            onChange={(e) => setTargetLang(e.target.value)}
                            className="w-full bg-black/20 border border-white/20 rounded-lg py-2 px-3 text-white focus:ring-2 focus:ring-pink-500"
                            disabled={status !== 'idle'}
                        >
                            {TRANSLATION_LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                        </select>
                    </div>
                </div>

                {error && <p className="text-center text-red-400 p-2">{error}</p>}

                {/* Results */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow min-h-[30vh]">
                    {/* Transcribed Text */}
                    <div className="bg-black/20 rounded-lg p-4 flex flex-col">
                        <h3 className="font-semibold text-lg text-white mb-2 flex items-center gap-2">
                           <MicIcon className="w-5 h-5 text-gray-300"/>
                           What you're saying...
                        </h3>
                        <div className="flex-grow overflow-y-auto text-gray-200 text-lg leading-relaxed">
                            {transcribedText || <span className="text-gray-400">Waiting for you to speak...</span>}
                        </div>
                    </div>
                    {/* Translated Text */}
                    <div className="bg-black/20 rounded-lg p-4 flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-lg text-white flex items-center gap-2">
                                <LanguagesIcon className="w-5 h-5 text-pink-300"/>
                                Translation
                            </h3>
                            {translatedText && (
                                <CopyShareButtons textToCopy={translatedText} shareTitle={`Translation to ${targetLang}`} />
                            )}
                        </div>
                         <div className="flex-grow overflow-y-auto text-pink-200 text-lg leading-relaxed">
                           {translatedText || <span className="text-gray-400">Translation will appear here...</span>}
                           {status === 'processing' && <span className="inline-block w-2 h-2 bg-pink-300 rounded-full animate-pulse ml-2"></span>}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default LiveTranslateView;