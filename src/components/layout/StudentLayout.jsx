import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, FileText, Settings, User, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const StudentLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user: authUser, logout } = useAuth();
    const user = authUser || { name: 'STUDENT', role: 'student' };
    
    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-[#EFEFF5] p-2 sm:p-4 md:p-8 font-sans text-gray-800 flex justify-center w-full">
            <div className="w-full max-w-[1400px] bg-[#EFEFF5] rounded-[2.5rem] overflow-hidden flex flex-col min-h-[90vh]">
                
                {/* TOP NAVIGATION */}
                <div className="flex flex-wrap items-center justify-between px-4 sm:px-8 py-6 pb-2 gap-4">
                    <div className="flex items-center gap-4 sm:gap-8">
                        <img src="/logo_compact.png" alt="Logo" className="h-[42px] w-auto object-contain drop-shadow-sm" />
                        
                        <div className="hidden md:flex relative items-center bg-white/40 shadow-[inset_0_2px_10px_rgba(255,255,255,0.8),0_4px_15px_rgba(0,0,0,0.05)] rounded-full p-1 backdrop-blur-md">
                            <Link to="/student/dashboard" className={`px-5 lg:px-6 py-2 rounded-full text-[10px] lg:text-xs font-bold tracking-wider transition-all ${location.pathname === '/student/dashboard' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400 hover:text-gray-600'}`}>DASHBOARD</Link>
                            <Link to="/student/results" className={`px-5 lg:px-6 py-2 rounded-full text-[10px] lg:text-xs font-bold tracking-wider transition-all ${location.pathname === '/student/results' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400 hover:text-gray-600'}`}>RESULTS</Link>
                            <Link to="/student/profile" className={`px-5 lg:px-6 py-2 rounded-full text-[10px] lg:text-xs font-bold tracking-wider transition-all ${location.pathname === '/student/profile' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400 hover:text-gray-600'}`}>SECURITY</Link>
                        </div>
                    </div>

                    <div className="hidden sm:flex items-center gap-4 lg:gap-6 text-gray-400">
                        <Link to="/student/dashboard" className={`p-2 rounded-full transition-transform hover:scale-105 ${location.pathname === '/student/dashboard' ? 'bg-white shadow-sm text-gray-800' : 'hover:text-gray-800 transition-colors'}`}><Home size={18} /></Link>
                        <Link to="/student/results" className={`p-2 rounded-full transition-transform hover:scale-105 ${location.pathname === '/student/results' ? 'bg-white shadow-sm text-gray-800' : 'hover:text-gray-800 transition-colors'}`}><FileText size={18} /></Link>
                        <Link to="/student/profile" className={`p-2 rounded-full transition-transform hover:scale-105 ${location.pathname === '/student/profile' ? 'bg-white shadow-sm text-gray-800' : 'hover:text-gray-800 transition-colors'}`}><Settings size={18} /></Link>
                        <div className="w-[1px] h-5 bg-gray-300 mx-2"></div>
                        <button onClick={handleLogout} className="p-2 hover:text-red-500 transition-colors rounded-full" title="Log Out"><LogOut size={18} /></button>
                    </div>

                    <div className="flex items-center gap-3 lg:gap-4">
                        <div className="hidden sm:block text-[10px] lg:text-xs font-bold tracking-wider uppercase text-gray-700">
                            {user?.name || 'STUDENT'}
                        </div>
                        <Link to="/student/profile" className="w-8 h-8 rounded-full bg-indigo-100 overflow-hidden shadow-inner flex items-center justify-center shrink-0 border-2 border-white cursor-pointer hover:scale-105 transition-transform">
                            <User size={16} className="text-indigo-600" />
                        </Link>
                    </div>
                </div>

                {/* Inner Views rendered here */}
                <div className="flex-1 overflow-x-hidden">
                    <Outlet />
                </div>
                
                {/* Mobile Bottom Nav */}
                <div className="md:hidden flex items-center justify-around bg-white/80 backdrop-blur-md p-4 sticky bottom-0 border-t border-gray-200">
                    <Link to="/student/dashboard" className={`${location.pathname === '/student/dashboard' ? 'text-indigo-600' : 'text-gray-400'}`}><Home size={20} /></Link>
                    <Link to="/student/results" className={`${location.pathname === '/student/results' ? 'text-indigo-600' : 'text-gray-400'}`}><FileText size={20} /></Link>
                    <Link to="/student/profile" className={`${location.pathname === '/student/profile' ? 'text-indigo-600' : 'text-gray-400'}`}><Settings size={20} /></Link>
                    <button onClick={handleLogout} className="text-red-400"><LogOut size={20} /></button>
                </div>
            </div>
        </div>
    );
};

export default StudentLayout;
