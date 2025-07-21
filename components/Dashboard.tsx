
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Tool, StoredFile, User, AdminUserAnalytics, CustomChatbot, AuditLogEntry } from '../types';
import * as authService from '../services/authService';
import { MicIcon, FileTextIcon, PdfToolboxIcon, RecordingIcon, StopCircleIcon, TrashIcon, LoaderIcon, UserIcon, MessageCircleIcon, CrownIcon, ShieldIcon, BotIcon, LiveTranslateIcon, CheckIcon, XIcon } from './icons';

interface DashboardProps {
    currentUser: User;
    onSelectTool: (tool: Tool | 'PDF_TOOLS_GROUP') => void;
    onOpenFile: (file: StoredFile) => void;
    onStartChat: (context?: StoredFile | CustomChatbot) => void;
    startRecording: () => void;
    stopRecording: () => void;
    isRecording: boolean;
    elapsedTime: number;
    onUpgradePlan: () => void;
}

const mainTools: { id: Tool | 'PDF_TOOLS_GROUP'; title: string; description: string; icon: React.FC<{className?:string}>; color: string; }[] = [
    { id: 'SCRIBE', title: 'AI Scribe', description: 'Transcribe audio or video files.', icon: MicIcon, color: 'blue' },
    { id: 'OCR', title: 'Extract Text', description: 'Scan text from images or PDFs.', icon: FileTextIcon, color: 'purple' },
    { id: 'PDF_TOOLS_GROUP', title: 'PDF Tools', description: 'Merge, split, or convert PDFs.', icon: PdfToolboxIcon, color: 'red' },
    { id: 'AI_CHAT', title: 'AI Chat', description: 'Chat with AI or your docs.', icon: MessageCircleIcon, color: 'cyan' },
    { id: 'LIVE_TRANSLATE', title: 'Live Translate', description: 'Real-time voice translation.', icon: LiveTranslateIcon, color: 'orange' },
    { id: 'AI_CHATBOT_BUILDER', title: 'Chatbot Builder', description: 'Create custom AI assistants.', icon: BotIcon, color: 'yellow' }
];


const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
};

const ToolCard: React.FC<{tool: typeof mainTools[0], onSelect: () => void}> = ({ tool, onSelect }) => {
    const colorMap: { [key: string]: string } = {
        blue: 'text-blue-300',
        purple: 'text-purple-300',
        red: 'text-red-400',
        green: 'text-green-300',
        cyan: 'text-cyan-300',
        yellow: 'text-yellow-300',
        orange: 'text-orange-300',
    };

    return (
        <button
            onClick={onSelect}
            className={`group relative flex flex-col items-center justify-center text-center p-6 w-56 h-56 rounded-2xl transform transition-all duration-300 glass-card hover:bg-white/10 hover:-translate-y-2 cursor-pointer overflow-hidden`}
            aria-label={tool.title}
        >
            {/* Content visible by default */}
            <div className="transition-opacity duration-300 group-hover:opacity-0">
                <tool.icon className={`w-20 h-20 mb-3 ${colorMap[tool.color] || 'text-pink-300'} transition-colors`} />
                <h3 className="font-semibold text-white text-xl">{tool.title}</h3>
            </div>
            
            {/* Content visible on hover */}
            <div className="absolute inset-0 p-4 flex flex-col items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <h3 className="font-semibold text-white text-xl mb-2">{tool.title}</h3>
                <p className="text-sm text-gray-300">{tool.description}</p>
            </div>
        </button>
    );
};

const getToolIcon = (tool: Tool) => {
    switch (tool) {
        case 'SCRIBE': return <MicIcon className="w-5 h-5 text-blue-300" />;
        case 'OCR':
        case 'PDF_TO_WORD':
        case 'KNOWLEDGE_DOCUMENT':
            return <FileTextIcon className="w-5 h-5 text-purple-300" />;
        case 'LIVE_TRANSLATE':
            return <LiveTranslateIcon className="w-5 h-5 text-orange-300" />;
        case 'AI_CHAT':
             return <MessageCircleIcon className="w-5 h-5 text-cyan-300" />;
        case 'AI_CHATBOT_BUILDER':
            return <BotIcon className="w-5 h-5 text-yellow-300" />;
        default:
            return <PdfToolboxIcon className="w-5 h-5 text-red-400" />;
    }
};

const AdminAnalyticsPanel = () => {
    const [users, setUsers] = useState<AdminUserAnalytics[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: keyof AdminUserAnalytics | null; direction: 'ascending' | 'descending' }>({ key: 'lastLogin', direction: 'descending' });

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const userList = await authService.getAdminAnalytics();
            setUsers(userList);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleUserStatusAction = async (action: 'approve' | 'deny' | 'deactivate' | 'reactivate', user: AdminUserAnalytics) => {
        const confirmTextMap = {
            approve: `Are you sure you want to approve user "${user.name}"?`,
            deny: `Are you sure you want to deny access for user "${user.name}"? This will set their status to Inactive.`,
            deactivate: `Are you sure you want to deactivate user "${user.name}"? They will no longer be able to log in.`,
            reactivate: `Are you sure you want to re-activate user "${user.name}"?`,
        };
        
        if (window.confirm(confirmTextMap[action])) {
            try {
                let newStatus: 'Active' | 'Inactive' | null = null;
                switch (action) {
                    case 'approve':
                    case 'reactivate':
                        newStatus = 'Active';
                        break;
                    case 'deny':
                    case 'deactivate':
                        newStatus = 'Inactive';
                        break;
                }
                if (newStatus) {
                    await authService.updateUserStatus(user.id, newStatus);
                    fetchData();
                }
            } catch (e: any) {
                alert(`Failed to ${action} user: ${e.message}`);
            }
        }
    };
    
    const handleSubscriptionAction = async(action: 'approve' | 'deny', user: AdminUserAnalytics) => {
         const confirmText = action === 'approve' 
            ? `Are you sure you want to approve the ${user.subscriptionRequest?.tier} plan for "${user.name}"?`
            : `Are you sure you want to deny the subscription request for "${user.name}"?`;

        if (window.confirm(confirmText)) {
            try {
                if (action === 'approve') {
                    await authService.approveSubscription(user.id);
                } else {
                    await authService.denySubscription(user.id);
                }
                fetchData();
            } catch(e:any) {
                 alert(`Failed to ${action} subscription: ${e.message}`);
            }
        }
    };

    const sortedUsers = useMemo(() => {
        let sortableItems = [...users];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key!];
                const bValue = b[sortConfig.key!];

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [users, sortConfig]);

    const requestSort = (key: keyof AdminUserAnalytics) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const SortableHeader: React.FC<{ headerKey: keyof AdminUserAnalytics; title: string }> = ({ headerKey, title }) => (
        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => requestSort(headerKey)}>
            <div className="flex items-center gap-1">
                {title}
                {sortConfig.key === headerKey && <span>{sortConfig.direction === 'ascending' ? '▲' : '▼'}</span>}
            </div>
        </th>
    );

    const pendingUsers = sortedUsers.filter(u => u.status === 'Pending');
    const pendingSubscriptions = sortedUsers.filter(u => u.subscriptionRequest);
    const managedUsers = sortedUsers.filter(u => u.status !== 'Pending');

    return (
        <div className="w-full border-t border-white/10 pt-12 mt-12">
            <h2 className="text-3xl font-bold text-white mb-6 text-center flex items-center justify-center gap-3">
                <ShieldIcon className="w-8 h-8 text-yellow-300" />
                Admin Analytics
            </h2>
            <div className="glass-card rounded-2xl p-6">
                 {isLoading ? (
                    <div className="flex justify-center items-center p-8"><LoaderIcon className="w-8 h-8 animate-spin text-pink-400" /></div>
                ) : error ? (
                    <p className="text-center text-red-400 py-8">{error}</p>
                ) : (
                    <>
                        {pendingUsers.length > 0 && (
                            <div className="mb-8">
                                <h3 className="text-xl font-semibold text-yellow-300 mb-4">Pending User Approvals ({pendingUsers.length})</h3>
                                <div className="space-y-3">
                                {pendingUsers.map(user => (
                                    <div key={user.id} className="bg-black/20 rounded-lg flex items-center justify-between p-3">
                                        <div className="flex flex-col overflow-hidden">
                                            <span className="text-white font-medium truncate">{user.name}</span>
                                            <span className="text-gray-400 text-sm">{user.username}</span>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                            <button onClick={() => handleUserStatusAction('approve', user)} className="p-1.5 text-green-400 hover:text-white rounded-full hover:bg-green-500/30 transition-colors" title="Approve User"><CheckIcon className="w-5 h-5"/></button>
                                            <button onClick={() => handleUserStatusAction('deny', user)} className="p-1.5 text-red-400 hover:text-white rounded-full hover:bg-red-500/30 transition-colors" title="Deny User"><XIcon className="w-5 h-5"/></button>
                                        </div>
                                    </div>
                                ))}
                                </div>
                            </div>
                        )}
                        
                        {pendingSubscriptions.length > 0 && (
                            <div className="mb-8">
                                <h3 className="text-xl font-semibold text-pink-300 mb-4">Pending Subscription Upgrades ({pendingSubscriptions.length})</h3>
                                <div className="space-y-3">
                                {pendingSubscriptions.map(user => (
                                    <div key={user.id} className="bg-black/20 rounded-lg flex items-center justify-between p-3">
                                        <div className="flex flex-col overflow-hidden">
                                            <span className="text-white font-medium truncate">{user.name} wants to upgrade to 
                                                <span className="font-bold text-pink-300"> {user.subscriptionRequest?.tier}</span>
                                            </span>
                                            <span className="text-gray-400 text-sm">{user.username}</span>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                            <button onClick={() => handleSubscriptionAction('approve', user)} className="p-1.5 text-green-400 hover:text-white rounded-full hover:bg-green-500/30 transition-colors" title="Approve Upgrade"><CheckIcon className="w-5 h-5"/></button>
                                            <button onClick={() => handleSubscriptionAction('deny', user)} className="p-1.5 text-red-400 hover:text-white rounded-full hover:bg-red-500/30 transition-colors" title="Deny Upgrade"><XIcon className="w-5 h-5"/></button>
                                        </div>
                                    </div>
                                ))}
                                </div>
                            </div>
                        )}
                        
                        <div>
                            <h3 className="text-xl font-semibold text-white mb-4">User Activity</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-white/10">
                                    <thead className="bg-black/20">
                                        <tr>
                                            <SortableHeader headerKey="name" title="User" />
                                            <SortableHeader headerKey="status" title="Status" />
                                            <SortableHeader headerKey="lastLogin" title="Last Login" />
                                            <SortableHeader headerKey="loginCount" title="Logins" />
                                            <SortableHeader headerKey="timeSpent" title="Time Spent (m)" />
                                            <SortableHeader headerKey="analysesCount" title="Analyses" />
                                            <SortableHeader headerKey="reportsCount" title="Reports" />
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-transparent divide-y divide-white/10">
                                        {managedUsers.map(user => {
                                            const isAdminAccount = user.username.toLowerCase() === 'admin@ajoai.com';
                                            return (
                                            <tr key={user.id}>
                                                <td className="px-4 py-3 whitespace-nowrap"><div className="text-sm font-medium text-white">{user.name}</div><div className="text-xs text-gray-400">{user.username}</div></td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{user.status}</span></td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{user.loginCount}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{user.timeSpent}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{user.analysesCount}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{user.reportsCount}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex items-center gap-2">
                                                        {user.status === 'Active' && (
                                                            <button onClick={() => handleUserStatusAction('deactivate', user)} disabled={isAdminAccount} className="text-yellow-500 hover:text-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed">Deactivate</button>
                                                        )}
                                                        {user.status === 'Inactive' && (
                                                            <button onClick={() => handleUserStatusAction('reactivate', user)} disabled={isAdminAccount} className="text-green-500 hover:text-green-400 disabled:opacity-50 disabled:cursor-not-allowed">Re-activate</button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )})}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};


const Dashboard: React.FC<DashboardProps> = ({ currentUser, onSelectTool, onOpenFile, onStartChat, startRecording, stopRecording, isRecording, elapsedTime, onUpgradePlan }) => {
    const [files, setFiles] = useState<StoredFile[]>([]);
    const [chatbots, setChatbots] = useState<CustomChatbot[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        const [userFiles, userChatbots] = await Promise.all([
            authService.getUserFiles(),
            authService.getUserChatbots(),
        ]);
        setFiles(userFiles);
        setChatbots(userChatbots);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const handleDeleteChatbot = async (botId: string) => {
        if (window.confirm("Are you sure you want to delete this chatbot? This cannot be undone.")) {
            await authService.deleteChatbot(botId);
            fetchData(); // Refresh data
        }
    };
    
    const handleDeleteFile = async (fileId: string) => {
        if (window.confirm("Are you sure you want to delete this file? This cannot be undone.")) {
            await authService.deleteFile(fileId);
            fetchData(); // Refresh data
        }
    };


    const canChatWithFile = (tool: Tool) => {
        return ['SCRIBE', 'OCR', 'PDF_TO_WORD', 'PDF_TO_PPT', 'KNOWLEDGE_DOCUMENT'].includes(tool);
    };
    
    const filesToShow = files.filter(f => f.tool !== 'KNOWLEDGE_DOCUMENT');

    return (
        <div className="w-full max-w-7xl mx-auto p-4 md:p-8 space-y-12">
            <div>
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-white mb-2">Tools</h1>
                    <p className="text-lg text-gray-300">Select a tool or start a recording.</p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-8 md:gap-10">
                    {mainTools.map(tool => (
                        <ToolCard key={tool.id} tool={tool} onSelect={() => onSelectTool(tool.id)} />
                    ))}
                </div>
                 <div className="mt-12 w-full flex justify-center items-center flex-col gap-4">
                     <div className="w-full max-w-lg border-t border-white/10"></div>
                     <h2 className="text-xl font-semibold text-gray-200 mt-4">Or, record audio directly</h2>
                     
                     <div className="mt-2">
                        {!isRecording ? (
                            <button
                                onClick={startRecording}
                                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg shadow-red-500/30"
                            >
                                <MicIcon className="w-6 h-6" />
                                <span className="text-lg">Start Recording</span>
                            </button>
                        ) : (
                            <div className="flex items-center justify-center gap-6 p-4 glass-card rounded-full">
                                <div className="flex items-center gap-3 text-red-300">
                                    <RecordingIcon className="w-6 h-6 text-red-500 animate-pulse" />
                                    <span className="font-mono text-2xl font-semibold tracking-wider">{formatRecordingTime(elapsedTime)}</span>
                                </div>
                                <button
                                    onClick={stopRecording}
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-full transition-colors"
                                >
                                    <StopCircleIcon className="w-6 h-6" />
                                    <span className="text-md">Stop</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="w-full border-t border-white/10 pt-12 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-12">
                
                {/* Left Column: My Chatbots & My Files */}
                <div className="lg:col-span-2 space-y-12">
                    {/* My Chatbots */}
                    <div>
                        <h2 className="text-3xl font-bold text-white mb-6 text-center lg:text-left">My Chatbots</h2>
                        <div className="glass-card rounded-2xl p-6">
                            {isLoading ? (
                                <div className="flex justify-center items-center p-8"><LoaderIcon className="w-8 h-8 animate-spin text-pink-400" /></div>
                            ) : chatbots.length === 0 ? (
                                <p className="text-center text-gray-400 py-8">You have no chatbots. Use the Chatbot Builder to create one.</p>
                            ) : (
                                <div className="space-y-3">
                                    {chatbots.map(bot => (
                                        <div key={bot.id} className="bg-black/20 hover:bg-black/30 transition-colors rounded-lg flex items-center justify-between p-3 cursor-pointer hover:-translate-y-0.5 transform duration-200" onClick={() => onStartChat(bot)}>
                                            <div className="flex items-center gap-4 overflow-hidden flex-grow">
                                                <BotIcon className="w-6 h-6 text-yellow-300 flex-shrink-0" />
                                                <div className="flex flex-col overflow-hidden">
                                                    <span className="text-white font-medium truncate">{bot.name}</span>
                                                    <span className="text-gray-400 text-sm">Created: {new Date(bot.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center flex-shrink-0 ml-2">
                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteChatbot(bot.id); }} className="p-1.5 text-gray-400 hover:text-red-400 rounded-full hover:bg-red-900/20" title="Delete Chatbot"><TrashIcon className="w-5 h-5" /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    {/* My Files */}
                     <div>
                        <h2 className="text-3xl font-bold text-white mb-6 text-center lg:text-left">My Files</h2>
                        <div className="glass-card rounded-2xl p-6">
                            {isLoading ? (
                                <div className="flex justify-center items-center p-8"><LoaderIcon className="w-8 h-8 animate-spin text-pink-400" /></div>
                            ) : filesToShow.length === 0 ? (
                                <p className="text-center text-gray-400 py-8">You have no saved files. Process a new file to see it here.</p>
                            ) : (
                                <div className="space-y-3">
                                    {filesToShow.map(file => (
                                        <div key={file.id} className="bg-black/20 hover:bg-black/30 transition-colors rounded-lg flex items-center justify-between p-3">
                                            <div className="flex items-center gap-4 overflow-hidden flex-grow cursor-pointer" onClick={() => onOpenFile(file)}>
                                                {getToolIcon(file.tool)}
                                                <div className="flex flex-col overflow-hidden">
                                                    <span className="text-white font-medium truncate">{file.fileName}</span>
                                                    <span className="text-gray-400 text-sm">{file.tool} &middot; {new Date(file.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center flex-shrink-0 ml-2">
                                                {canChatWithFile(file.tool) && (
                                                    <button onClick={(e) => { e.stopPropagation(); onStartChat(file); }} className="p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-cyan-600/30 transition-colors" aria-label={`Chat about ${file.fileName}`} title="Chat about this file">
                                                        <MessageCircleIcon className="w-5 h-5 text-cyan-400" />
                                                    </button>
                                                )}
                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteFile(file.id); }} className="p-1.5 text-gray-400 hover:text-red-400 rounded-full hover:bg-red-900/20" title="Delete File"><TrashIcon className="w-5 h-5" /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Subscription Status */}
                <div className="lg:col-span-1">
                    <h2 className="text-3xl font-bold text-white mb-6 text-center lg:text-left">Subscription Status</h2>
                    <div className="max-w-md mx-auto lg:mx-0 glass-card rounded-2xl p-6 sticky top-28">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-semibold text-white">Your Plan</h3>
                            <span className="px-3 py-1 text-sm font-bold bg-yellow-400/20 text-yellow-300 rounded-full flex items-center gap-2">
                                <CrownIcon className="w-4 h-4"/>
                                {currentUser.subscription.tier}
                            </span>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <p className="text-gray-300">
                                    {currentUser.subscription.tier === 'Free' ? 'Free Usage Limit' : 'AI Credits Remaining'}
                                </p>
                                <p className="text-2xl font-bold text-white">
                                    {currentUser.subscription.tier === 'Free' 
                                        ? '2 uses per AI tool'
                                        : currentUser.subscription.aiCredits === Infinity 
                                            ? 'Unlimited' 
                                            : currentUser.subscription.aiCredits
                                    }
                                </p>
                            </div>
                            {currentUser.subscription.tier !== 'Free' && (
                                <div className="w-full bg-gray-700 rounded-full h-2.5">
                                    <div className="bg-gradient-to-r from-green-400 to-blue-500 h-2.5 rounded-full" style={{width: `100%`}}></div>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={onUpgradePlan}
                            className="w-full mt-6 bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                        >
                            Upgrade Plan
                        </button>
                    </div>
                </div>
            </div>

            {currentUser.isAdmin && <AdminAnalyticsPanel />}
        </div>
    );
};

export default Dashboard;