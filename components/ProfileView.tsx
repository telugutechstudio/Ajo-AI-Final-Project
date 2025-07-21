import React, { useState } from 'react';
import type { User } from '../types';
import { ChevronLeftIcon, LoaderIcon, UserIcon, EyeIcon, EyeOffIcon } from './icons';
import * as authService from '../services/authService';

interface ProfileViewProps {
    user: User;
    onBack: () => void;
    onUserUpdate: (user: User) => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ user, onBack, onUserUpdate }) => {
    // State for personal details
    const [name, setName] = useState(user.name);
    const [mobile, setMobile] = useState(user.mobile || '');
    const [isSavingDetails, setIsSavingDetails] = useState(false);
    const [detailsMessage, setDetailsMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // State for password change
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);


    const handleDetailsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingDetails(true);
        setDetailsMessage(null);
        try {
            const updatedUser = await authService.updateUserDetails(name, mobile);
            onUserUpdate(updatedUser);
            setDetailsMessage({ type: 'success', text: 'Details updated successfully!' });
        } catch (err: any) {
            setDetailsMessage({ type: 'error', text: err.message || 'Failed to update details.' });
        } finally {
            setIsSavingDetails(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
            return;
        }
        if (newPassword.length < 6) {
            setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters long.' });
            return;
        }

        setIsSavingPassword(true);
        setPasswordMessage(null);
        try {
            await authService.updatePassword(currentPassword, newPassword);
            setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setPasswordMessage({ type: 'error', text: err.message || 'Failed to change password.' });
        } finally {
            setIsSavingPassword(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto p-4 md:p-8 fade-in">
            <button onClick={onBack} className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors mb-4">
                <ChevronLeftIcon className="w-5 h-5" />
                Back to Dashboard
            </button>
            <div className="glass-card rounded-2xl p-6 md:p-8">
                <h1 className="text-3xl font-bold text-white mb-6 text-center">My Profile</h1>

                {/* Personal Details Form */}
                <form onSubmit={handleDetailsSubmit} className="space-y-6">
                    <h2 className="text-xl font-semibold text-pink-300 border-b border-white/10 pb-2">Personal Details</h2>
                    {detailsMessage && (
                        <p className={`p-3 rounded-lg text-center text-sm ${detailsMessage.type === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                            {detailsMessage.text}
                        </p>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                        <input type="email" value={user.username} disabled className="w-full bg-black/30 border border-white/10 rounded-lg py-2 px-3 text-gray-400 cursor-not-allowed" />
                    </div>
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                        <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-black/20 border border-white/20 rounded-lg py-2 px-3 text-white focus:ring-2 focus:ring-pink-500" required />
                    </div>
                    <div>
                        <label htmlFor="mobile" className="block text-sm font-medium text-gray-300 mb-2">Mobile Number</label>
                        <input id="mobile" type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} className="w-full bg-black/20 border border-white/20 rounded-lg py-2 px-3 text-white focus:ring-2 focus:ring-pink-500" required />
                    </div>
                    <div className="text-right">
                        <button type="submit" disabled={isSavingDetails} className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:bg-gray-600 flex items-center justify-center gap-2 min-w-[150px]">
                            {isSavingDetails ? <LoaderIcon className="w-5 h-5 animate-spin" /> : 'Save Details'}
                        </button>
                    </div>
                </form>

                {/* Password Change Form */}
                <form onSubmit={handlePasswordSubmit} className="space-y-6 mt-10 pt-6 border-t border-white/10">
                    <h2 className="text-xl font-semibold text-pink-300 border-b border-white/10 pb-2">Change Password</h2>
                     {passwordMessage && (
                        <p className={`p-3 rounded-lg text-center text-sm ${passwordMessage.type === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                            {passwordMessage.text}
                        </p>
                    )}
                    <div>
                        <label htmlFor="currentPassword"  className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
                        <input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full bg-black/20 border border-white/20 rounded-lg py-2 px-3 text-white focus:ring-2 focus:ring-pink-500" required />
                    </div>
                    <div>
                        <label htmlFor="newPassword"  className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                         <div className="relative">
                            <input id="newPassword" type={isPasswordVisible ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-black/20 border border-white/20 rounded-lg py-2 pl-3 pr-10 text-white focus:ring-2 focus:ring-pink-500" required />
                             <button type="button" onClick={() => setIsPasswordVisible(!isPasswordVisible)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white" >
                                {isPasswordVisible ? <EyeOffIcon className="w-5 h-5"/> : <EyeIcon className="w-5 h-5"/>}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="confirmPassword"  className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
                        <input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-black/20 border border-white/20 rounded-lg py-2 px-3 text-white focus:ring-2 focus:ring-pink-500" required />
                    </div>
                    <div className="text-right">
                        <button type="submit" disabled={isSavingPassword} className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:bg-gray-600 flex items-center justify-center gap-2 min-w-[180px]">
                            {isSavingPassword ? <LoaderIcon className="w-5 h-5 animate-spin" /> : 'Update Password'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfileView;