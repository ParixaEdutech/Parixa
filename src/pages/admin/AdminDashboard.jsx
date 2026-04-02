import React, { useState, useEffect } from 'react';
import { Users, ShieldCheck, GraduationCap, BookOpen, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { userService } from '../../services/userService';

const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const data = await userService.getAllUsers();
                setUsers(data);
            } catch (error) {
                console.error("Failed to load dashboard stats:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    const studentsCount = users.filter(u => u.role === 'student').length;
    const teachersCount = users.filter(u => u.role === 'teacher').length;

    const stats = [
        { name: 'Total Members', value: loading ? '...' : users.length.toString(), icon: Users, color: 'text-indigo-700' },
        { name: 'Active Students', value: loading ? '...' : studentsCount.toString(), icon: GraduationCap, color: 'text-green-700' },
        { name: 'Active Teachers', value: loading ? '...' : teachersCount.toString(), icon: BookOpen, color: 'text-blue-700' },
        { name: 'Security Alerts', value: '0', icon: ShieldCheck, color: 'text-red-700' },
    ];

    const recentUsers = [...users]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

    return (
        <div className="pb-8">
            <div className="p-4 sm:p-8 space-y-8 flex-1">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-2 sm:px-4">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl sm:text-4xl font-black text-gray-800 tracking-tight">System Overseer</h1>
                        <p className="text-sm font-medium text-gray-500">High-level telemetry and user statistics.</p>
                    </div>
                    <div>
                        <Link to="/admin/users" className="px-4 py-3.5 sm:py-4 rounded-full font-black tracking-widest text-[10px] sm:text-xs text-white shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0 bg-gradient-to-r from-[#FF8E75] to-[#FF5E8E] hover:shadow-[0_8px_20px_rgba(255,94,142,0.3)] flex items-center justify-center gap-2 uppercase">
                            Manage Accounts <ArrowRight size={14} className="opacity-80" />
                        </Link>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {stats.map((item) => (
                        <div key={item.name} className="bg-[#DDE2EA] rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-[inset_0_2px_10px_rgba(255,255,255,0.9),0_10px_30px_rgba(0,0,0,0.05)] relative overflow-hidden group">
                            <div className="absolute -left-10 -top-10 w-48 h-48 bg-white/30 rounded-full filter blur-xl group-hover:bg-white/50 transition-all"></div>
                            
                            <div className="relative z-10 flex items-center gap-4 sm:gap-6 mb-4">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-indigo-100 to-indigo-300 rounded-2xl shadow-xl flex items-center justify-center border-4 border-white/60 shrink-0">
                                    <item.icon className={`w-8 h-8 sm:w-10 sm:h-10 ${item.color}`} />
                                </div>
                            </div>
                            
                            <div className="relative z-10 flex-1 flex flex-col">
                                <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-gray-500 mb-1">{item.name}</p>
                                <p className="text-3xl sm:text-5xl font-black text-gray-800 leading-tight">{item.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Lists Section */}
                <div className="bg-[#EBEBEF] rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-[inset_0_2px_10px_rgba(255,255,255,0.9),0_10px_30px_rgba(0,0,0,0.05)] border border-white/40 flex flex-col">
                    <div className="flex justify-between items-center mb-6 px-2">
                        <h3 className="text-base sm:text-lg font-black text-gray-800 uppercase tracking-wide">Recent Registrations</h3>
                        <Link to="/admin/users" className="text-[9px] sm:text-[10px] font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-colors">See All users</Link>
                    </div>
                    
                    <div className="bg-white/30 p-2 sm:p-4 rounded-3xl border border-white/50 backdrop-blur-sm overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead>
                                <tr>
                                    <th className="px-6 py-4 text-[10px] sm:text-[11px] font-black uppercase text-gray-500 tracking-widest border-b border-white/40">User Profile</th>
                                    <th className="px-6 py-4 text-[10px] sm:text-[11px] font-black uppercase text-gray-500 tracking-widest border-b border-white/40">Authority Level</th>
                                    <th className="px-6 py-4 text-[10px] sm:text-[11px] font-black uppercase text-gray-500 tracking-widest border-b border-white/40">Registration Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-10 text-center text-sm font-medium text-gray-500">Loading directory...</td>
                                    </tr>
                                ) : recentUsers.map((user) => (
                                    <tr key={user._id} className="hover:bg-white/40 transition-colors border-b border-white/20 last:border-0 rounded-2xl overflow-hidden">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-white/60 flex items-center justify-center text-indigo-900 font-bold flex-shrink-0">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-black text-gray-800 tracking-tight">{user.name}</div>
                                                    <div className="text-[10px] sm:text-xs font-medium text-gray-500">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 bg-white/60 backdrop-blur-sm rounded-full text-[9px] font-black tracking-wider uppercase shadow-sm border border-white/50 ${
                                                user.role === 'admin' ? 'text-purple-700' :
                                                user.role === 'teacher' ? 'text-blue-700' :
                                                'text-green-700'
                                            }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-[10px] sm:text-xs font-medium text-gray-500 flex items-center gap-2">
                                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                                        </td>
                                    </tr>
                                ))}
                                {recentUsers.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-10 text-center text-sm font-medium text-gray-500">No users found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
