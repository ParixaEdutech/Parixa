import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, FileText, Settings, User, LogOut, Users, Calendar, PlusCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const DashboardLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user: authUser, logout } = useAuth();
    
    // Fallback user
    const user = authUser || { name: 'USER', role: 'admin' };
    
    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Define navigation links based on roles
    const adminLinks = [
        { name: 'DASHBOARD', path: '/admin/dashboard', Icon: Home },
        { name: 'USERS', path: '/admin/users', Icon: Users },
        { name: 'SECURITY', path: '/admin/profile', Icon: Settings }
    ];

    const teacherLinks = [
        { name: 'DASHBOARD', path: '/teacher/dashboard', Icon: Home },
        { name: 'CREATE EXAM', path: '/teacher/exam/create', Icon: PlusCircle },
        { name: 'SCHEDULE', path: '/teacher/exam/schedule', Icon: Calendar },
        { name: 'RESULTS', path: '/teacher/results', Icon: FileText },
        { name: 'SECURITY', path: '/teacher/profile', Icon: Settings }
    ];

    let links = [];
    if (user.role === 'admin') links = adminLinks;
    else if (user.role === 'teacher') links = teacherLinks;

    return (
        <div className="min-h-screen bg-[#EFEFF5] p-2 sm:p-4 md:p-8 font-sans text-gray-800 flex justify-center w-full">
            <div className="w-full max-w-[1400px] bg-[#EFEFF5] rounded-[2.5rem] overflow-hidden flex flex-col min-h-[90vh]">
                
                {/* TOP NAVIGATION */}
                <div className="flex flex-wrap items-center justify-between px-4 sm:px-8 py-6 pb-2 gap-4">
                    <div className="flex items-center gap-4 sm:gap-8">
                        <img src="/logo_compact.png" alt="Logo" className="h-[42px] w-auto object-contain drop-shadow-sm" />
                        
                        <div className="hidden md:flex relative items-center bg-white/40 shadow-[inset_0_2px_10px_rgba(255,255,255,0.8),0_4px_15px_rgba(0,0,0,0.05)] rounded-full p-1 backdrop-blur-md">
                            {links.map((link) => {
                                // Match exactly or as prefix
                                const isActive = location.pathname.includes(link.path);
                                return (
                                    <Link 
                                        key={link.name}
                                        to={link.path} 
                                        className={`px-3 lg:px-6 py-2 rounded-full text-[10px] lg:text-xs font-bold tracking-wider transition-all whitespace-nowrap ${isActive ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        {link.name}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    <div className="hidden sm:flex items-center gap-2 lg:gap-4 text-gray-400">
                        {links.map((link) => {
                            const isActive = location.pathname.includes(link.path);
                            const IconComp = link.Icon;
                            return (
                                <Link 
                                    key={link.name}
                                    to={link.path} 
                                    className={`p-2 rounded-full transition-transform hover:scale-105 ${isActive ? 'bg-white shadow-sm text-gray-800' : 'hover:text-gray-800 transition-colors'}`}
                                    title={link.name}
                                >
                                    <IconComp size={18} />
                                </Link>
                            );
                        })}
                        <div className="w-[1px] h-5 bg-gray-300 mx-1 lg:mx-2"></div>
                        <button onClick={handleLogout} className="p-2 hover:text-red-500 transition-colors rounded-full" title="Log Out">
                            <LogOut size={18} />
                        </button>
                    </div>

                    <div className="flex items-center gap-3 lg:gap-4">
                        <div className="hidden sm:block text-[10px] lg:text-xs font-bold tracking-wider uppercase text-gray-700">
                            {user?.name || user.role}
                        </div>
                        <Link to={`/${user.role}/profile`} className="w-8 h-8 rounded-full bg-indigo-100 overflow-hidden shadow-inner flex items-center justify-center shrink-0 border-2 border-white cursor-pointer hover:scale-105 transition-transform">
                            <User size={16} className="text-indigo-600" />
                        </Link>
                    </div>
                </div>

                {/* Inner Views rendered here */}
                <div className="flex-1 overflow-x-hidden">
                    <Outlet />
                </div>
                
                {/* Mobile Bottom Nav */}
                <div className="md:hidden flex items-center justify-around bg-white/80 backdrop-blur-md p-4 sticky bottom-0 border-t border-gray-200 overflow-x-auto gap-4">
                    {links.map((link) => {
                        const isActive = location.pathname.includes(link.path);
                        const IconComp = link.Icon;
                        return (
                            <Link 
                                key={link.name}
                                to={link.path} 
                                className={`flex-shrink-0 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}
                            >
                                <IconComp size={20} />
                            </Link>
                        );
                    })}
                    <button onClick={handleLogout} className="flex-shrink-0 text-red-400">
                        <LogOut size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DashboardLayout;
