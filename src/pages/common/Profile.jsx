import React, { useState } from 'react';
import { User, Mail, Shield, Key, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

const Profile = () => {
    const { user: authUser } = useAuth();
    const user = authUser || { name: 'Loading...', email: '...', role: 'loading...' };
    
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [isUpdating, setIsUpdating] = useState(false);
    const [message, setMessage] = useState(null);

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        
        if (!passwordData.currentPassword || !passwordData.newPassword) {
            setMessage({ type: 'error', text: 'Please fill in all fields.' });
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match!' });
            return;
        }

        setIsUpdating(true);
        setMessage(null);
        try {
            await api.put('/auth/change-password', {
                oldPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            setMessage({ type: 'success', text: 'Password encrypted and updated successfully.' });
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update credentials. Please verify your current PIN.' });
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="pb-8">
            <div className="px-4 sm:px-8 py-2">
                 <div className="flex items-center text-gray-400 text-sm sm:pl-4 w-full sm:w-64 bg-white/40 sm:bg-transparent rounded-full sm:rounded-none px-4 sm:px-0 py-2 sm:py-0">
                     <Shield size={16} className="mr-2 shrink-0" />
                     <span className="text-gray-600 font-bold text-xs uppercase tracking-wider">Encrypted Portal</span>
                 </div>
            </div>

            <div className="p-4 sm:p-8 space-y-8 flex-1">
                {/* HEADER */}
                <div className="flex flex-col gap-2 px-2 sm:px-4">
                    <h1 className="text-3xl sm:text-4xl font-black text-gray-800 tracking-tight">Security Profile</h1>
                    <p className="text-sm font-medium text-gray-500">Manage your identity access, security credentials, and view system health.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Profile Info Side */}
                    <div className="md:col-span-1 space-y-6">
                        <div className="bg-[#DDE2EA] rounded-[2rem] sm:rounded-[2.5rem] p-8 shadow-[inset_0_2px_10px_rgba(255,255,255,0.9),0_10px_30px_rgba(0,0,0,0.05)] relative overflow-hidden group text-center flex flex-col items-center">
                            <div className="absolute -left-10 -top-10 w-48 h-48 bg-white/30 rounded-full filter blur-xl transition-all"></div>
                            
                            <div className="relative z-10 w-24 h-24 bg-gradient-to-br from-white to-gray-200 rounded-full shadow-[0_10px_20px_rgba(0,0,0,0.05)] flex items-center justify-center border-4 border-white shrink-0 mb-6">
                                <User className="w-10 h-10 text-gray-500" />
                            </div>
                            <h2 className="relative z-10 text-2xl font-black text-gray-800 truncate w-full">{user.name}</h2>
                            <span className="relative z-10 inline-block px-4 py-1.5 bg-white/60 backdrop-blur-sm border border-white/50 text-gray-700 rounded-full text-[10px] font-black uppercase tracking-widest mt-2 shadow-sm">
                                {user.role} Privilege
                            </span>
                            
                            <div className="relative z-10 mt-8 pt-8 border-t border-white/40 w-full space-y-4 text-left">
                                <div className="flex items-center gap-4 text-sm bg-white/30 p-3 rounded-2xl border border-white/50 backdrop-blur-sm">
                                    <Mail className="text-gray-500" size={18} />
                                    <span className="text-gray-700 font-bold truncate text-xs">{user.email}</span>
                                </div>
                                <div className="flex items-center gap-4 text-sm bg-green-500/10 p-3 rounded-2xl border border-green-500/20 backdrop-blur-sm">
                                    <Shield className="text-green-600" size={18} />
                                    <span className="text-green-800 font-bold uppercase text-[9px] tracking-widest">Biometric AI Secure</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-[#EAE8F2] rounded-[2.5rem] p-8 shadow-[inset_0_2px_10px_rgba(255,255,255,0.9),0_10px_30px_rgba(0,0,0,0.05)] relative overflow-hidden flex flex-col justify-center text-gray-800">
                            <div className="absolute right-0 top-0 bottom-0 w-full bg-gradient-to-tr from-[#E6D4F9]/60 to-transparent"></div>
                            <Key className="absolute bottom-4 right-4 w-20 h-20 text-gray-400 opacity-20 pointer-events-none" />
                            
                            <h3 className="relative z-10 text-lg font-black mb-3 uppercase tracking-wider text-gray-800">Encryption Tip</h3>
                            <p className="relative z-10 text-gray-600 text-xs leading-relaxed font-medium italic">"Regularly updating your security PIN prevents unauthorized session hijacking and protects your academic integrity."</p>
                        </div>
                    </div>

                    {/* Forms Container */}
                    <div className="md:col-span-2">
                        <div className="bg-[#EBEBEF] rounded-[2rem] sm:rounded-[2.5rem] p-8 sm:p-12 shadow-[inset_0_2px_10px_rgba(255,255,255,0.9),0_10px_30px_rgba(0,0,0,0.05)] h-full border border-white/40">
                            
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm flex items-center justify-center border border-white">
                                    <Key size={20} className="text-gray-600" />
                                </div>
                                <h2 className="text-2xl font-black text-gray-800 tracking-tight">Credential Update</h2>
                            </div>

                            {message && (
                                <div className={`mb-8 p-4 rounded-3xl flex items-center gap-3 animate-in zoom-in duration-300 font-medium text-xs sm:text-sm border shadow-[inset_0_2px_5px_rgba(255,255,255,0.8)] ${
                                    message.type === 'success' ? 'bg-[#E8F5E9] border-[#C8E6C9] text-green-800' : 'bg-[#FFEBEE] border-[#FFCDD2] text-red-800'
                                }`}>
                                    {message.type === 'success' ? <CheckCircle size={20} className="shrink-0" /> : <AlertCircle size={20} className="shrink-0" />}
                                    <p className="font-bold tracking-wide">{message.text}</p>
                                </div>
                            )}

                            <form onSubmit={handlePasswordChange} className="space-y-6">
                                <div className="space-y-2 text-left">
                                    <label className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-500 ml-2">Identity Verification PIN (Current)</label>
                                    <input 
                                        type="password"
                                        placeholder="Enter Current Password"
                                        value={passwordData.currentPassword}
                                        onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                                        required
                                        className="w-full px-5 h-14 bg-white/50 border border-white shadow-[inset_0_2px_5px_rgba(0,0,0,0.05)] focus:bg-white text-gray-800 rounded-2xl outline-none transition-all text-sm font-medium placeholder-gray-400"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2 text-left">
                                        <label className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-500 ml-2">New Access Key</label>
                                        <input 
                                            type="password"
                                            placeholder="New Password"
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                                            required
                                            className="w-full px-5 h-14 bg-white/50 border border-white shadow-[inset_0_2px_5px_rgba(0,0,0,0.05)] focus:bg-white text-gray-800 rounded-2xl outline-none transition-all text-sm font-medium placeholder-gray-400"
                                        />
                                    </div>
                                    <div className="space-y-2 text-left">
                                        <label className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-500 ml-2">Confirm Access Key</label>
                                        <input 
                                            type="password"
                                            placeholder="Confirm New Password"
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                                            required
                                            className="w-full px-5 h-14 bg-white/50 border border-white shadow-[inset_0_2px_5px_rgba(0,0,0,0.05)] focus:bg-white text-gray-800 rounded-2xl outline-none transition-all text-sm font-medium placeholder-gray-400"
                                        />
                                    </div>
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={isUpdating}
                                    className="w-full mt-6 h-14 bg-gray-800 hover:bg-gray-900 text-white text-xs tracking-widest uppercase font-black rounded-2xl shadow-lg transition-all hover:shadow-[0_8px_20px_rgba(0,0,0,0.2)] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isUpdating ? 'Encrypting & Transmitting...' : 'Issue Secure Upgrade Command'}
                                </button>
                            </form>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Profile;
