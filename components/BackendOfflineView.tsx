
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
                <h1 className="text-3xl font-bold text-white mb-3">Server Connection Error</h1>
                <p className="text-gray-300 mb-6">
                    The application could not connect to its backend server. This usually means the server process is not running on your computer.
                </p>

                <div className="text-left bg-black/30 p-4 rounded-lg border border-white/10">
                    <h2 className="font-semibold text-lg text-white mb-3">How to Fix This:</h2>
                    <p className="text-gray-300 mb-4">Please start the backend server by following these steps in your project folder:</p>
                    <div className="space-y-3">
                        <div>
                            <p className="text-sm text-gray-400">1. Open a new terminal or command prompt.</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">2. Navigate into the `backend` directory:</p>
                            <code className="block bg-gray-900 p-2 rounded-md mt-1 text-yellow-300 text-sm">cd backend</code>
                        </div>
                         <div>
                            <p className="text-sm text-gray-400">3. (First time only) Install required packages:</p>
                            <code className="block bg-gray-900 p-2 rounded-md mt-1 text-yellow-300 text-sm">npm install</code>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">4. Start the server:</p>
                            <code className="block bg-gray-900 p-2 rounded-md mt-1 text-yellow-300 text-sm">npm run dev</code>
                        </div>
                    </div>
                     <p className="text-xs text-gray-400 mt-4">Leave the terminal window running. Once the server starts, you can refresh this page.</p>
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