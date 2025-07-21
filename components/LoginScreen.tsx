

import React, { useState } from 'react';
import * as authService from '../services/authService';
import type { User } from '../types';
import { LoaderIcon, MicIcon, FileTextIcon, PdfToolboxIcon, MessageCircleIcon, LiveTranslateIcon, BotIcon, EyeIcon, EyeOffIcon } from './icons';

interface LoginScreenProps {
    onLogin: (user: User) => void;
}

type View = 'login' | 'register' | 'pending';

type ShowcaseTool = {
    name: string;
    icon: React.FC<{ className?: string; }>;
    color: string;
    description: string;
};

const aiTools: ShowcaseTool[] = [
    { name: 'AI Scribe', icon: MicIcon, color: 'text-blue-300', description: 'Transcribe audio & video with speaker labels.' },
    { name: 'AI Chat', icon: MessageCircleIcon, color: 'text-cyan-300', description: 'Chat with AI or your own documents.' },
    { name: 'Live Translate', icon: LiveTranslateIcon, color: 'text-orange-300', description: 'Real-time voice translation.' },
    { name: 'Chatbot Builder', icon: BotIcon, color: 'text-yellow-300', description: 'Create custom AI assistants.' },
];

const utilityTools: ShowcaseTool[] = [
    { name: 'Extract Text', icon: FileTextIcon, color: 'text-purple-300', description: 'Extract text from PDFs and images.' },
    { name: 'PDF Tools', icon: PdfToolboxIcon, color: 'text-red-400', description: 'Merge, split, compress, and convert PDFs.' },
];


const ToolShowcaseColumn: React.FC<{title: string, tools: ShowcaseTool[]}> = ({ title, tools }) => (
    <div className="flex-1 w-full max-w-sm lg:max-w-xs fade-in">
        <h3 className="text-2xl font-semibold text-center text-gray-200 mb-8 tracking-wide">{title}</h3>
        <div className="grid grid-cols-2 gap-6">
            {tools.map((tool) => (
                <div key={tool.name} className="relative flex flex-col items-center text-center group">
                    <div className="w-28 h-28 glass-card rounded-2xl flex items-center justify-center mb-2 group-hover:-translate-y-1.5 transition-transform duration-300">
                        <tool.icon className={`w-14 h-14 ${tool.color}`} />
                    </div>
                    <p className="font-medium text-gray-300">{tool.name}</p>
                    
                    {/* Tooltip */}
                    <div role="tooltip" className="absolute z-10 bottom-full mb-3 w-40 p-2 text-xs font-medium text-white bg-gray-900 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                        {tool.description}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-[5px] border-x-transparent border-t-[5px] border-t-gray-900"></div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);


const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const [view, setView] = useState<View>('login');
    
    // Form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            const user = await authService.loginWithEmailAndPassword(email, password);
            onLogin(user);
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred.");
            setIsLoading(false);
        }
    };

    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (email.toLowerCase() === 'admin@ajoai.com') {
            setError("The admin account is reserved and cannot be registered. Please log in instead.");
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            await authService.register({ name, mobile, email, password });
            setView('pending');
        } catch (err: any) {
            setError(err.message || "Could not complete registration.");
        } finally {
            setIsLoading(false);
        }
    };

    const renderLoginForm = () => (
        <div className="fade-in w-full">
            <h2 className="text-3xl font-bold text-center text-white mb-2">Welcome Back</h2>
            <p className="text-gray-300 text-center mb-8">Sign in to continue to your dashboard.</p>
            {error && <p className="bg-red-500/20 text-red-300 text-center p-3 rounded-lg mb-4">{error}</p>}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/20 border border-white/20 rounded-lg py-3 px-4 text-white focus:ring-2 focus:ring-pink-500"
                    required
                    placeholder="Email Address"
                    disabled={isLoading}
                />
                <div className="relative">
                    <input
                        type={isPasswordVisible ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-black/20 border border-white/20 rounded-lg py-3 pl-4 pr-10 text-white focus:ring-2 focus:ring-pink-500"
                        required
                        placeholder="Password"
                        disabled={isLoading}
                    />
                     <button
                        type="button"
                        onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white"
                        aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                    >
                        {isPasswordVisible ? <EyeOffIcon className="w-5 h-5"/> : <EyeIcon className="w-5 h-5"/>}
                    </button>
                </div>
                <button
                    type="submit"
                    disabled={isLoading || !email || !password}
                    className="w-full font-bold py-3 px-4 rounded-lg transition-colors bg-pink-600 hover:bg-pink-700 text-white disabled:bg-gray-600 flex items-center justify-center gap-2"
                >
                    {isLoading ? <LoaderIcon className="w-5 h-5 animate-spin" /> : 'Login'}
                </button>
            </form>
            <p className="text-center mt-6 text-sm text-gray-300">
                Don't have an account?{' '}
                <button onClick={() => { setView('register'); setError(null); }} className="font-semibold text-pink-400 hover:underline">
                    Register here
                </button>
            </p>
        </div>
    );

    const renderRegisterForm = () => (
        <div className="fade-in w-full">
            <h2 className="text-3xl font-bold text-center text-white mb-2">Create Account</h2>
            <p className="text-gray-300 text-center mb-8">Get started with Ajo AI Technologies.</p>
            {error && <p className="bg-red-500/20 text-red-300 text-center p-3 rounded-lg mb-4">{error}</p>}
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
                 <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-black/20 border border-white/20 rounded-lg py-3 px-4 text-white focus:ring-2 focus:ring-pink-500"
                    required
                    placeholder="Full Name"
                    disabled={isLoading}
                />
                 <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full bg-black/20 border border-white/20 rounded-lg py-3 px-4 text-white focus:ring-2 focus:ring-pink-500"
                    required
                    placeholder="Mobile Number"
                    disabled={isLoading}
                />
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/20 border border-white/20 rounded-lg py-3 px-4 text-white focus:ring-2 focus:ring-pink-500"
                    required
                    placeholder="Email Address"
                    disabled={isLoading}
                />
                <div className="relative">
                    <input
                        type={isPasswordVisible ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-black/20 border border-white/20 rounded-lg py-3 pl-4 pr-10 text-white focus:ring-2 focus:ring-pink-500"
                        required
                        placeholder="Password"
                        disabled={isLoading}
                    />
                     <button
                        type="button"
                        onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white"
                        aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                    >
                        {isPasswordVisible ? <EyeOffIcon className="w-5 h-5"/> : <EyeIcon className="w-5 h-5"/>}
                    </button>
                </div>
                <button
                    type="submit"
                    disabled={isLoading || !email || !password || !name || !mobile}
                    className="w-full font-bold py-3 px-4 rounded-lg transition-colors bg-pink-600 hover:bg-pink-700 text-white disabled:bg-gray-600 flex items-center justify-center gap-2"
                >
                    {isLoading ? <LoaderIcon className="w-5 h-5 animate-spin" /> : 'Create Account'}
                </button>
            </form>
            <p className="text-center mt-6 text-sm text-gray-300">
                Already have an account?{' '}
                <button onClick={() => { setView('login'); setError(null); }} className="font-semibold text-pink-400 hover:underline">
                    Login here
                </button>
            </p>
        </div>
    );
    
    const renderPendingView = () => (
        <div className="fade-in w-full text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-black/20 flex items-center justify-center">
                <LoaderIcon className="w-8 h-8 text-yellow-300"/>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Registration Pending</h2>
            <p className="text-gray-300 mb-8">Your account has been created and is now awaiting approval from an administrator. You will be notified via email once approved.</p>
            <button onClick={() => setView('login')} className="text-pink-400 font-semibold hover:text-pink-300">
                Back to Login
            </button>
        </div>
    );

    const renderContent = () => {
        switch (view) {
            case 'register':
                return renderRegisterForm();
            case 'pending':
                return renderPendingView();
            case 'login':
            default:
                return renderLoginForm();
        }
    };

    return (
        <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-16 p-4">
            
            {/* Left Column: AI Tools */}
            <ToolShowcaseColumn title="AI Tools" tools={aiTools} />

            {/* Center Column: Login/Register Form */}
            <div className="w-full max-w-sm flex-shrink-0 order-first lg:order-none">
                <div className="glass-card rounded-2xl p-8">
                    {renderContent()}
                </div>
            </div>

            {/* Right Column: Other Tools */}
            <ToolShowcaseColumn title="Utility Tools" tools={utilityTools} />

        </div>
    );
};

export default LoginScreen;
