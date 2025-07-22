
import React from 'react';
import { XIcon } from './icons';

const BackendOfflineView: React.FC = () => {
    
    const handleRefresh = () => {
        window.location.reload();
    };

    return (
        <div className="w-full max-w-2xl mx-auto p-4 md:p-8 fade-in text-center">
            <div className="glass-card rounded-2xl p-8 border-2 border-red-500/50">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                    <XIcon className="w-8 h-8 text-red-300" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-3">Service Unavailable</h1>
                <p className="text-gray-300 mb-6">
                    We're sorry, but the Ajo AI service is temporarily unavailable. This might be due to server maintenance or a connection issue.
                </p>

                <div className="text-left bg-black/30 p-4 rounded-lg border border-white/10">
                    <h2 className="font-semibold text-lg text-white mb-3">What you can do:</h2>
                     <ul className="list-disc list-inside text-gray-300 space-y-2">
                        <li>Please try refreshing the page in a few moments.</li>
                        <li>If the problem persists, please check back later.</li>
                    </ul>
                </div>
                
                <button
                    onClick={handleRefresh}
                    className="w-full mt-8 bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                >
                    Refresh Page
                </button>
            </div>
        </div>
    );
};

export default BackendOfflineView;