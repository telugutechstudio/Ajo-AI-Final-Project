import React from 'react';
import { ChevronLeftIcon, CheckIcon } from './icons';
import { SubscriptionTier } from '../types';
import { PLANS } from '../config';

interface PricingViewProps {
    onSelectPlan: (tier: SubscriptionTier) => void;
    onBack: () => void;
}

const PricingCard: React.FC<{
    tier: SubscriptionTier;
    plan: typeof PLANS[SubscriptionTier];
    onSelect: () => void;
    isPopular?: boolean;
}> = ({ tier, plan, onSelect, isPopular }) => {
    
    const colors = {
        Free: { border: 'border-gray-500', button: 'bg-gray-600 hover:bg-gray-500' },
        Pro: { border: 'border-pink-500', button: 'bg-pink-600 hover:bg-pink-500' },
        Business: { border: 'border-purple-500', button: 'bg-purple-600 hover:bg-purple-500' },
    };

    return (
        <div className={`relative glass-card rounded-2xl p-8 border-2 ${colors[tier].border} flex flex-col`}>
            {isPopular && (
                <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 text-sm font-semibold text-white bg-pink-500 rounded-full">
                        MOST POPULAR
                    </span>
                </div>
            )}
            <h3 className="text-2xl font-bold text-white text-center">{plan.name}</h3>
            <p className="text-4xl font-bold text-white text-center my-4">{plan.price}</p>

            <ul className="space-y-3 my-6 flex-grow">
                {plan.features.map(feature => (
                    <li key={feature} className="flex items-center gap-3">
                        <CheckIcon className="w-5 h-5 text-green-400 flex-shrink-0" />
                        <span className="text-gray-300">{feature}</span>
                    </li>
                ))}
            </ul>
            
            <button
                onClick={onSelect}
                disabled={tier === 'Free'}
                className={`w-full mt-auto font-bold py-3 px-4 rounded-lg transition-colors text-white ${colors[tier].button} disabled:bg-gray-700 disabled:cursor-not-allowed`}
            >
                {tier === 'Free' ? 'Current Plan' : `Choose ${plan.name}`}
            </button>
        </div>
    );
};

const PricingView: React.FC<PricingViewProps> = ({ onSelectPlan, onBack }) => {
    return (
        <div className="w-full max-w-6xl mx-auto p-4 md:p-8 fade-in">
             <button onClick={onBack} className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors mb-6 self-start">
                <ChevronLeftIcon className="w-5 h-5"/>
                Back to Dashboard
            </button>
            <div className="text-center mb-12">
                <h1 className="text-5xl font-extrabold text-white mb-3">Find the right plan for you</h1>
                <p className="text-lg text-gray-400">Unlock powerful AI features and boost your productivity.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                 <PricingCard tier="Free" plan={PLANS.Free} onSelect={() => onSelectPlan('Free')} />
                 <PricingCard tier="Pro" plan={PLANS.Pro} onSelect={() => onSelectPlan('Pro')} isPopular />
                 <PricingCard tier="Business" plan={PLANS.Business} onSelect={() => onSelectPlan('Business')} />
            </div>
        </div>
    );
};

export default PricingView;
