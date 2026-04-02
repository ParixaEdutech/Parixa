import React, { useState, useEffect } from 'react';
import { BookOpen, FileText, CheckCircle, Clock, User, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const TeacherDashboard = () => {
    const [exams, setExams] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadStats = async () => {
            try {
                const [exRes, subRes] = await Promise.all([
                    api.get('/exams/my-exams'),
                    api.get('/exams/recent-submissions')
                ]);
                setExams(exRes.data);
                setSubmissions(subRes.data);
            } catch (err) {
                console.error("Failed to load dashboard data", err);
            } finally {
                setIsLoading(false);
            }
        };
        loadStats();
    }, []);

    const stats = [
        { name: 'Total Exams Created', value: exams.length, icon: BookOpen, color: 'text-indigo-700' },
        { name: 'Active Assignments', value: exams.filter(e => e.status === 'published').length, icon: Clock, color: 'text-amber-700' },
        { name: 'Recent Submissions', value: submissions.length, icon: FileText, color: 'text-blue-700' },
        { name: 'Avg Performance', value: submissions.length > 0 ? `${(submissions.reduce((a,b) => a+(b.score/b.totalQuestions), 0) / submissions.length * 100).toFixed(0)}%` : 'N/A', icon: CheckCircle, color: 'text-green-700' },
    ];

    if (isLoading) return (
        <div className="flex justify-center items-center flex-col h-64 py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 flex-shrink-0"></div>
        </div>
    );

    return (
        <div className="pb-8">
            <div className="p-4 sm:p-8 space-y-8 flex-1">
                {/* Header section standardized */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-2 sm:px-4">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl sm:text-4xl font-black text-gray-800 tracking-tight">Teacher Dashboard</h1>
                        <p className="text-sm font-medium text-gray-500">Manage your exams and student performance.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <Link to="/teacher/exam/create" className="px-4 py-3.5 sm:py-4 rounded-full bg-white/80 hover:bg-white text-[10px] sm:text-xs font-black text-gray-600 uppercase tracking-widest shadow-sm transition-all hover:-translate-y-0.5 border border-white flex items-center justify-center">
                            Create Exam
                        </Link>
                        <Link to="/teacher/exam/schedule" className="px-4 py-3.5 sm:py-4 rounded-full font-black tracking-widest text-[10px] sm:text-xs text-white shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0 bg-gradient-to-r from-[#FF8E75] to-[#FF5E8E] hover:shadow-[0_8px_20px_rgba(255,94,142,0.3)] flex items-center justify-center gap-2 uppercase">
                            Schedule Exam <ArrowRight size={14} className="opacity-80" />
                        </Link>
                    </div>
                </div>

                {/* Stats Grid standardized */}
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

                {/* Quick Actions & Recent Submissions standardized */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* AI Question Lab - Secondary Card Style */}
                    <div className="bg-[#EBEBEF] rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-[inset_0_2px_10px_rgba(255,255,255,0.9),0_10px_30px_rgba(0,0,0,0.05)] border border-white/40 flex flex-col">
                        <div className="flex justify-between items-center mb-6 px-2">
                            <h3 className="text-base sm:text-lg font-black text-gray-800 uppercase tracking-wide">AI Question Lab</h3>
                            <span className="bg-[#D1F16D] text-[#55670D] text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-md shadow-sm">BETA</span>
                        </div>
                        
                        <div className="bg-white/30 p-2 sm:p-4 rounded-3xl border border-white/50 backdrop-blur-sm flex-1 flex flex-col gap-2">
                            <Link to="/teacher/upload-pdf" className="flex items-center gap-4 sm:gap-6 p-4 rounded-3xl hover:bg-white/60 transition-all border border-transparent hover:border-white shadow-sm hover:shadow-[inset_0_2px_5px_rgba(255,255,255,0.8)] cursor-pointer group">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 shadow-inner flex items-center justify-center shrink-0 border border-white/60 group-hover:scale-105 transition-transform">
                                    <FileText className="w-6 h-6 text-blue-700" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-gray-800 mb-1 line-clamp-1">PDF Intelligent Extraction</h4>
                                    <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium line-clamp-2">Turn your PDF stacks into interactive MCQ sets using ParixaAI Vision.</p>
                                </div>
                                <div className="shrink-0">
                                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-800 transform group-hover:translate-x-1 transition-all" />
                                </div>
                            </Link>
                            
                            <hr className="border-white/40 w-full" />

                            <Link to="/teacher/generate-syllabus" className="flex items-center gap-4 sm:gap-6 p-4 rounded-3xl hover:bg-white/60 transition-all border border-transparent hover:border-white shadow-sm hover:shadow-[inset_0_2px_5px_rgba(255,255,255,0.8)] cursor-pointer group">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-200 shadow-inner flex items-center justify-center shrink-0 border border-white/60 group-hover:scale-105 transition-transform">
                                    <BookOpen className="w-6 h-6 text-purple-700" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-gray-800 mb-1 line-clamp-1">Syllabus-to-Exam</h4>
                                    <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium line-clamp-2">Generate context-aware questions from any text input instantly.</p>
                                </div>
                                <div className="shrink-0">
                                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-800 transform group-hover:translate-x-1 transition-all" />
                                </div>
                            </Link>

                        </div>
                    </div>

                    {/* Recent Submissions List - Secondary Card Style */}
                    <div className="bg-[#EBEBEF] rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-[inset_0_2px_10px_rgba(255,255,255,0.9),0_10px_30px_rgba(0,0,0,0.05)] border border-white/40 flex flex-col">
                        <div className="flex justify-between items-center mb-6 px-2">
                            <h3 className="text-base sm:text-lg font-black text-gray-800 uppercase tracking-wide">Recent Activity</h3>
                            <Link to="/teacher/results" className="text-[9px] sm:text-[10px] font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-colors">See All Evaluated</Link>
                        </div>
                        
                        <div className="bg-white/30 p-2 sm:p-4 rounded-3xl border border-white/50 backdrop-blur-sm overflow-x-auto min-h-[160px]">
                            {submissions.length === 0 ? (
                                <div className="text-center py-10 text-sm font-medium text-gray-500 h-full flex items-center justify-center">
                                    No submissions recorded yet.
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse min-w-[400px]">
                                    <thead>
                                        <tr>
                                            <th className="px-4 py-3 text-[10px] sm:text-[11px] font-black uppercase text-gray-500 tracking-widest border-b border-white/40">Student / Exam</th>
                                            <th className="px-4 py-3 text-[10px] sm:text-[11px] font-black uppercase text-gray-500 tracking-widest border-b border-white/40 text-right">Score</th>
                                            <th className="px-4 py-3 text-[10px] sm:text-[11px] font-black uppercase text-gray-500 tracking-widest border-b border-white/40 text-right">Submitted</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {submissions.map((sub) => (
                                            <tr key={sub._id} className="hover:bg-white/40 transition-colors border-b border-white/20 last:border-0 rounded-2xl overflow-hidden">
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-white/60 flex items-center justify-center text-gray-500 flex-shrink-0">
                                                            <User size={18} />
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-black text-gray-800 tracking-tight">{sub.student?.name || 'Unknown Student'}</div>
                                                            <div className="text-[10px] sm:text-xs font-medium text-gray-500 line-clamp-1">{sub.exam?.title || 'Exam'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <div className="text-sm sm:text-base font-black text-indigo-900 bg-white/60 shadow-sm border border-white rounded-lg px-2 py-0.5 inline-block">
                                                        {sub.score}/{sub.totalQuestions}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-right text-[10px] sm:text-xs font-black text-gray-500 tracking-wider flex items-center justify-end h-full">
                                                    {new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeacherDashboard;
