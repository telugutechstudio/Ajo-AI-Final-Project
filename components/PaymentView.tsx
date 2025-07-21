import React, { useState } from 'react';
import { ChevronLeftIcon, LoaderIcon } from './icons';
import { PLANS } from '../config';

interface PaymentViewProps {
    onPaymentComplete: () => void;
    onBack: () => void;
    plan: typeof PLANS.Pro | typeof PLANS.Business | null;
}

const PaymentView: React.FC<PaymentViewProps> = ({ onPaymentComplete, onBack, plan }) => {
    const [isVerifying, setIsVerifying] = useState(false);

    const handleVerificationRequest = (e: React.FormEvent) => {
        e.preventDefault();
        if (isVerifying) return;
        
        setIsVerifying(true);
        // Simulate a backend call to confirm payment.
        setTimeout(() => {
            onPaymentComplete();
            setIsVerifying(false);
        }, 2000);
    };

    if (!plan) {
        return (
            <div className="text-center p-8">
                <p>No plan selected. Please go back.</p>
                <button onClick={onBack} className="mt-4 text-pink-400">Back to Pricing</button>
            </div>
        );
    }
    
    const color = plan.name === 'Pro' ? 'pink' : 'purple';

    return (
        <div className="w-full max-w-xl mx-auto p-4 md:p-8 fade-in">
            <button onClick={onBack} className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors mb-6 self-start">
                <ChevronLeftIcon className="w-5 h-5"/>
                Back to Pricing
            </button>
             <div className="glass-card rounded-2xl p-8">
                <h2 className="text-3xl font-bold text-white mb-2 text-center">Complete Your Upgrade</h2>
                <p className="text-gray-300 text-center mb-8">You are upgrading to the <span className={`font-bold text-${color}-400`}>{plan.name}</span> plan for <span className="font-bold text-white">{plan.price.replace('/mo', '')}</span>.</p>
                
                <div className="text-center p-6 bg-black/20 rounded-lg border border-white/10 mb-8">
                    <h3 className="text-xl font-semibold text-white mb-3">Payment Instructions</h3>
                    <p className="text-gray-300">
                        To complete your upgrade, please contact our administration team for payment details.
                    </p>
                    <p className="text-gray-300 mt-2">
                        After you have completed the transaction, click the button below to submit your upgrade request.
                    </p>
                </div>

                <div className="border-t border-white/10 pt-6">
                     <button onClick={handleVerificationRequest} disabled={isVerifying} className={`w-full font-bold py-3 px-4 rounded-lg transition-colors text-white bg-pink-600 hover:bg-pink-700 disabled:bg-gray-700 disabled:cursor-wait`}>
                        {isVerifying ? (
                            <span className="flex items-center justify-center gap-2">
                                <LoaderIcon className="w-5 h-5 animate-spin" />
                                Verifying Request...
                            </span>
                        ) : (
                            `I have paid, submit my upgrade request`
                        )}
                    </button>
                    <p className="text-xs text-gray-400 mt-3 text-center">An administrator will review and approve your request. Your plan will be updated automatically upon approval.</p>
                </div>
             </div>
        </div>
    );
};

export default PaymentView;