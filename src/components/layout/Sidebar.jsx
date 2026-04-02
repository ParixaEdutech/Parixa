import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, LayoutDashboard, Users, FileText, Calendar, BarChart3, Settings } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

// Helper to get icon by name
const getIcon = (iconName, size = 20) => {
    const icons = {
        dashboard: <LayoutDashboard size={size} />,
        users: <Users size={size} />,
        exams: <FileText size={size} />,
        calendar: <Calendar size={size} />,
        analytics: <BarChart3 size={size} />,
        settings: <Settings size={size} />
    };
    return icons[iconName] || <FileText size={size} />;
};

const Sidebar = ({ isOpen, toggleSidebar }) => {
    const { user } = useAuth();
    const location = useLocation();

    // Define navigation links based on roles
    const adminLinks = [
        { name: 'Dashboard', path: '/admin/dashboard', icon: 'dashboard' },
        { name: 'User Management', path: '/admin/users', icon: 'users' },
        { name: 'Security Profile', path: '/admin/profile', icon: 'settings' }
    ];

    const teacherLinks = [
        { name: 'Dashboard', path: '/teacher/dashboard', icon: 'dashboard' },
        { name: 'Create Exam', path: '/teacher/exam/create', icon: 'exams' },
        { name: 'Schedule Exam', path: '/teacher/exam/schedule', icon: 'calendar' },
        { name: 'Results', path: '/teacher/results', icon: 'analytics' },
        { name: 'Security Profile', path: '/teacher/profile', icon: 'settings' }
    ];

    const studentLinks = [
        { name: 'Dashboard', path: '/student/dashboard', icon: 'dashboard' },
        { name: 'My Results', path: '/student/results', icon: 'analytics' },
        { name: 'Security Profile', path: '/student/profile', icon: 'settings' }
    ];

    let links = [];
    if (user?.role === 'admin') links = adminLinks;
    else if (user?.role === 'teacher') links = teacherLinks;
    else if (user?.role === 'student') links = studentLinks;

    return (
        <>
            {/* Mobile Sidebar Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-20 bg-gray-600 bg-opacity-75 transition-opacity md:hidden"
                    onClick={toggleSidebar}
                />
            )}

            {/* Sidebar Content */}
            <div className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:h-screen md:pt-16
      `}>
                <div className="h-full flex flex-col pt-5 pb-4 md:pt-0 overflow-y-auto">
                    {/* Mobile close button & brand */}
                    <div className="flex items-center justify-between px-4 mb-5 md:hidden">
                        <img src="/logo_compact.png" alt="Parixa Logo" className="h-[42px] w-auto object-contain drop-shadow-sm" />
                        <button onClick={toggleSidebar} className="text-gray-500 hover:text-gray-700">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Navigation Links */}
                    <nav className="mt-5 md:mt-8 px-2 space-y-1">
                        {links.map((link) => {
                            const isActive = location.pathname.includes(link.path);
                            return (
                                <Link
                                    key={link.name}
                                    to={link.path}
                                    className={`
                    group flex items-center px-2 py-3 text-sm font-medium rounded-md transition-colors
                    ${isActive
                                            ? 'bg-indigo-50 text-indigo-700'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                  `}
                                    onClick={() => {
                                        if (window.innerWidth < 768) {
                                            toggleSidebar();
                                        }
                                    }}
                                >
                                    <div className={`mr-3 flex-shrink-0 ${isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'}`}>
                                        {getIcon(link.icon)}
                                    </div>
                                    {link.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
