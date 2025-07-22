
import React from 'react';
import { LoaderIcon } from './icons';

interface LoaderProps {
    message: string;
    subMessage?: string | null;
}

const Loader: React.FC<LoaderProps> = ({ message, subMessage }) => {
    return (
        <div className="flex flex-col items-center justify-center text-center p-8 glass-card rounded-2xl shadow-2xl">
            <LoaderIcon className="w-12 h-12 text-pink-300 animate-spin mb-4" />
            <p className="text-lg font-medium text-gray-200">{message}</p>
            <p className="text-sm text-gray-300 mt-1 h-5">
                 {subMessage || 'Please wait, AI is working its magic...'}
            </p>
        </div>
    );
};

export default Loader;