import React from 'react';
import { LoaderIcon, ChevronLeftIcon } from './icons';

interface UpgradePendingViewProps {
    onBack: () => void;
}

const UpgradePendingView: React.FC<UpgradePendingViewProps> = ({ onBack }) => {
    return (
        <div className="w-full max-w-lg mx-auto p-4 md:p-8 text-center fade-in">
            <div className="glass-card rounded-2xl p-10">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <LoaderIcon className="w-8 h-8 text-yellow-300 animate-spin" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-3">Upgrade Request Submitted</h1>
                <p className="text-gray-300 mb-8">
                    Your request has been sent to the administrator for approval. Your plan will be updated automatically once it's approved. You can continue using your current plan in the meantime.
                </p>
                <button
                    onClick={onBack}
                    className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                    <ChevronLeftIcon className="w-5 h-5"/>
                    Back to Dashboard
                </button>
            </div>
        </div>
    );
};

export default UpgradePendingView;