import React, { useState } from 'react';
import { ShieldIcon } from './icons';

interface AdminLoginScreenProps {
    onVerify: (password: string) => void;
    error: string | null;
}

const AdminLoginScreen: React.FC<AdminLoginScreenProps> = ({ onVerify, error }) => {
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password) {
            onVerify(password);
        }
    };

    return (
        <div className="w-full max-w-sm mx-auto">
            <div className="glass-card rounded-2xl p-8">
                <div className="fade-in w-full">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-black/20 flex items-center justify-center">
                        <ShieldIcon className="w-8 h-8 text-yellow-300" />
                    </div>
                    <h2 className="text-3xl font-bold text-center text-white mb-2">Admin Verification</h2>
                    <p className="text-gray-300 text-center mb-8">Please enter the admin password to proceed.</p>

                    {error && <p className="bg-red-500/20 text-red-300 text-center p-3 rounded-lg mb-4">{error}</p>}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="sr-only" htmlFor="password">Password</label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-black/20 border border-white/20 rounded-lg py-3 px-4 text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                                required
                                placeholder="Admin Password"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!password}
                            className="w-full font-bold py-3 px-4 rounded-lg transition-colors bg-yellow-600 hover:bg-yellow-700 text-white disabled:bg-gray-600 flex items-center justify-center gap-2"
                        >
                            Verify
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdminLoginScreen;
