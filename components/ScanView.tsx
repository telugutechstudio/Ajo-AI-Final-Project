import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CameraIcon, ChevronLeftIcon, LoaderIcon, TrashIcon, CheckIcon } from './icons';
import { analyzeScannedPage } from '../services/geminiService';
import type { ScanAnalysisResult } from '../types';


interface ScanViewProps {
    onComplete: (files: File[]) => void;
    onBack: () => void;
}

type PageStatus = 'analyzing' | 'enhancing' | 'success' | 'error';

interface CapturedPage {
    id: number;
    dataUrl: string; // This will be the *enhanced* dataUrl
    file: File;
    status: PageStatus;
    feedback: string;
}

const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) throw new Error("Could not determine mime type from data URL");
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
}


const ScanView: React.FC<ScanViewProps> = ({ onComplete, onBack }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [capturedPages, setCapturedPages] = useState<CapturedPage[]>([]);
    const [isCapturing, setIsCapturing] = useState(false);
    const [isVideoReady, setIsVideoReady] = useState(false);

    const cleanupCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    }, [stream]);

    useEffect(() => {
        const initCamera = async () => {
            // First, try to get the environment-facing camera (rear camera)
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' },
                    audio: false
                });
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
                setStream(mediaStream);
                setCameraError(null);
            } catch (err: any) {
                console.warn("Could not get environment camera, trying default camera.", err);
                // If that fails (e.g., on a desktop), try getting any camera
                try {
                    const mediaStream = await navigator.mediaDevices.getUserMedia({
                        video: true,
                        audio: false
                    });
                     if (videoRef.current) {
                        videoRef.current.srcObject = mediaStream;
                    }
                    setStream(mediaStream);
                    setCameraError(null);
                } catch (fallbackErr: any) {
                     console.error("Camera error on fallback:", fallbackErr);
                    if (fallbackErr.name === 'NotAllowedError') {
                        setCameraError("Camera access was denied. Please grant permission in your browser settings.");
                    } else if (fallbackErr.name === 'NotFoundError') {
                        setCameraError("No camera found. Please ensure a camera is connected and enabled.");
                    } else {
                        setCameraError("Could not access the camera. Please try again.");
                    }
                }
            }
        };

        initCamera();

        return () => {
            cleanupCamera();
        };
    }, [cleanupCamera]);

    const handleCapture = async () => {
        if (!videoRef.current || !stream || !isVideoReady) return;

        // 1. Initial capture and optimistic UI
        setIsCapturing(true);
        const pageId = Date.now();
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        
        const originalDataUrl = canvas.toDataURL('image/jpeg', 0.95);
        const base64Image = originalDataUrl.split(',')[1];
        
        const newPagePlaceholder: CapturedPage = {
            id: pageId,
            dataUrl: originalDataUrl,
            file: dataURLtoFile(originalDataUrl, `scan_${pageId}.jpg`),
            status: 'analyzing',
            feedback: 'Analyzing...'
        };
        setCapturedPages(prev => [...prev, newPagePlaceholder]);
        
        try {
            // 2. AI Analysis
            const analysis: ScanAnalysisResult = await analyzeScannedPage(base64Image, video.videoWidth, video.videoHeight);
            
            // 3. Process result
            if (!analysis.isDocumentFound || !analysis.boundingBox) {
                setCapturedPages(prev => prev.map(p => 
                    p.id === pageId ? { ...p, status: 'error', feedback: analysis.feedback } : p
                ));
                setIsCapturing(false);
                return;
            }

            // 4. Enhance Image (Crop & Filter)
            setCapturedPages(prev => prev.map(p => 
                p.id === pageId ? { ...p, status: 'enhancing', feedback: 'Enhancing...' } : p
            ));
            
            const enhanceCanvas = document.createElement('canvas');
            const enhanceCtx = enhanceCanvas.getContext('2d');
            if (!enhanceCtx) throw new Error("Could not create enhancement canvas.");

            const { x, y, width, height } = analysis.boundingBox;
            enhanceCanvas.width = width;
            enhanceCanvas.height = height;
            
            enhanceCtx.filter = 'grayscale(1) contrast(1.7) brightness(1.1)';

            const sourceImage = new Image();
            sourceImage.onload = () => {
                enhanceCtx.drawImage(sourceImage, x, y, width, height, 0, 0, width, height);
                const enhancedDataUrl = enhanceCanvas.toDataURL('image/jpeg', 0.9);
                const enhancedFile = dataURLtoFile(enhancedDataUrl, `scan_${pageId}_enhanced.jpg`);
                
                setCapturedPages(prev => prev.map(p => 
                    p.id === pageId 
                    ? { ...p, status: 'success', feedback: analysis.feedback, dataUrl: enhancedDataUrl, file: enhancedFile } 
                    : p
                ));
                setIsCapturing(false);
            };
            sourceImage.onerror = () => { throw new Error("Failed to load source image for enhancement."); };
            sourceImage.src = originalDataUrl;

        } catch (error: any) {
            console.error("Capture & Enhance Error:", error);
            setCapturedPages(prev => prev.map(p => 
                p.id === pageId ? { ...p, status: 'error', feedback: error.message || "Processing failed." } : p
            ));
            setIsCapturing(false);
        }
    };
    
    const handleDeletePage = (id: number) => {
        setCapturedPages(prev => prev.filter(p => p.id !== id));
    };

    const handleCreatePdf = () => {
        const files = capturedPages.filter(p=> p.status === 'success').map(p => p.file);
        if (files.length > 0) {
           onComplete(files);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-4 md:p-8 flex flex-col h-full">
             <button onClick={onBack} className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors mb-4 self-start">
                <ChevronLeftIcon className="w-5 h-5"/>
                Back to PDF Tools
            </button>
            <div className="glass-card rounded-2xl flex-grow flex flex-col p-6">
                <div className="flex-grow flex flex-col items-center justify-center relative bg-black/30 rounded-xl overflow-hidden">
                    {cameraError ? (
                         <div className="text-center text-red-300 p-4">
                            <p className="font-semibold text-lg">Camera Error</p>
                            <p>{cameraError}</p>
                        </div>
                    ) : (
                         <video ref={videoRef} autoPlay playsInline className="w-full h-full object-contain" muted onCanPlay={() => setIsVideoReady(true)} />
                    )}
                     <button
                        onClick={handleCapture}
                        disabled={!stream || isCapturing || !isVideoReady}
                        className="absolute bottom-5 w-20 h-20 bg-white rounded-full border-4 border-gray-400 shadow-lg flex items-center justify-center transition hover:bg-gray-200 disabled:bg-gray-400 disabled:cursor-not-allowed group"
                        aria-label="Capture page"
                    >
                        <div className="w-16 h-16 bg-white rounded-full transition-transform duration-200 group-hover:scale-90" />
                    </button>
                </div>
                
                <div className="mt-6">
                    <h3 className="font-semibold text-lg text-white mb-3">
                        Captured Pages ({capturedPages.length})
                    </h3>
                    {capturedPages.length > 0 ? (
                        <div className="relative">
                           <div className="flex gap-4 overflow-x-auto pb-4">
                                {capturedPages.map((page, index) => (
                                    <div key={page.id} className="flex-shrink-0 w-40 text-center group">
                                        <div className={`relative border-2 rounded-lg overflow-hidden aspect-[3/4] transition-colors ${
                                            page.status === 'error' ? 'border-red-500' : 
                                            page.status === 'success' ? 'border-green-500' : 'border-gray-500'
                                        }`}>
                                            <img src={page.dataUrl} alt={`Page ${index + 1}`} className="w-full h-full object-cover" />
                                            <div className="absolute top-1 right-1">
                                                <button onClick={() => handleDeletePage(page.id)} className="p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className={`absolute bottom-0 left-0 right-0 p-1.5 text-xs text-center text-white transition-colors ${
                                                page.status === 'analyzing' ? 'bg-blue-600/80' : 
                                                page.status === 'enhancing' ? 'bg-purple-600/80' :
                                                page.status === 'success' ? 'bg-green-600/80' :
                                                page.status === 'error' ? 'bg-red-600/80' : ''
                                            }`}>
                                                <div className="flex items-center justify-center gap-1.5">
                                                    {(page.status === 'analyzing' || page.status === 'enhancing') && <LoaderIcon className="w-3 h-3 animate-spin"/>}
                                                    {page.status === 'success' && <CheckIcon className="w-3 h-3" />}
                                                    <span className="font-semibold truncate">{page.feedback}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-400 mt-1">Page {index + 1}</p>
                                    </div>
                                ))}
                           </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 bg-black/20 rounded-lg">
                            <p className="text-gray-400">Capture pages using the button above.</p>
                        </div>
                    )}
                </div>

                <div className="mt-auto pt-6 border-t border-white/10">
                    <button
                        onClick={handleCreatePdf}
                        disabled={capturedPages.length === 0 || capturedPages.some(p => p.status !== 'success')}
                        className="w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-700 text-white disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                       <CameraIcon className="w-5 h-5"/>
                        Create PDF
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ScanView;