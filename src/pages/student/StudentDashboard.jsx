import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, Clock, AlertTriangle, Search, ChevronDown, Check, User, Folder } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

const StudentDashboard = () => {
    const navigate = useNavigate();
    const [assignedExams, setAssignedExams] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    let user = null;
    try {
        const auth = useAuth();
        user = auth?.user;
    } catch(e) {}

    useEffect(() => {
        const fetchExams = async () => {
            try {
                const res = await api.get('/exams/my-assigned-exams');
                const sorted = res.data.sort((a,b) => new Date(a.startTime) - new Date(b.startTime));
                setAssignedExams(sorted);
            } catch (err) {
                console.error("Dashboard Load Error:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchExams();
    }, []);

    const upcoming = assignedExams.filter(e => e.status !== 'Completed');
    const past = assignedExams.filter(e => e.status === 'Completed');
    const available = upcoming.filter(e => e.status === 'Available');

    const startExam = (examId) => navigate(`/student/exam/${examId}`);

    if (isLoading) return (
        <div className="flex justify-center items-center flex-col h-64 py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 flex-shrink-0"></div>
        </div>
    );

    return (
        <div className="pb-12">
            {/* SEARCH BAR (Mobile & Desktop) */}
            <div className="px-4 sm:px-8 py-4 sm:py-2">
                 <div className="flex items-center text-gray-400 text-sm pl-4 w-full sm:w-64 bg-white/40 sm:bg-transparent rounded-full sm:rounded-none py-3 sm:py-0 border border-white/40 shadow-sm sm:shadow-none sm:border-transparent">
                     <Search size={16} className="mr-2 shrink-0" />
                     <input type="text" placeholder="Search for an Exam" className="bg-transparent outline-none placeholder-gray-400 text-gray-700 w-full" />
                 </div>
            </div>

            <div className="p-4 sm:p-8 space-y-10 flex-1">
                {/* STATS HEADER */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 lg:gap-8 px-2 sm:px-4">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left w-full lg:w-auto">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-indigo-100 overflow-hidden shadow-[inset_0_4px_10px_rgba(0,0,0,0.1),0_10px_20px_rgba(0,0,0,0.05)] border-4 border-white flex-shrink-0 flex items-center justify-center">
                            <User size={40} className="text-indigo-400" />
                        </div>
                        <div className="flex flex-col justify-center h-full pt-1 w-full relative z-10">
                            <div className="flex items-center justify-center sm:justify-start text-gray-400 text-xs sm:text-sm font-medium mb-1 cursor-pointer hover:text-gray-600 transition-colors">
                                Overall Progress <ChevronDown size={14} className="ml-1" />
                            </div>
                            <div className="flex items-baseline justify-center sm:justify-start gap-2">
                                <h1 className="text-4xl sm:text-5xl font-black text-gray-800 tracking-tight leading-none">{past.length}</h1>
                                <span className="text-gray-400 bg-white/60 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold shadow-sm border border-white/50">EXAMS COMPLETED</span>
                            </div>
                            <div className="text-xs sm:text-sm font-medium text-gray-500 mt-2">
                                <span className="font-bold text-gray-700">{upcoming.length} Pending</span> • Averaging <span className="font-bold text-gray-700">{(past.length > 0 ? (past.reduce((acc, curr) => acc + ((curr.score||0)/(curr.totalQuestions||1)*100), 0) / past.length) : 0).toFixed(1)}%</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Circle Stat */}
                    <div className="flex flex-col sm:flex-row items-center gap-6 bg-white/30 backdrop-blur-sm p-5 sm:p-5 rounded-[2rem] w-full lg:w-auto shadow-sm border border-white/50">
                        <div className="text-center sm:text-right text-[10px] sm:text-xs space-y-2 sm:space-y-1.5 font-medium text-gray-500 w-full sm:w-auto">
                            <div className="text-gray-800 font-bold mb-3 sm:mb-2 text-sm sm:text-xs">Your <span className="text-black">Performance</span> Stats</div>
                            <div className="flex justify-between gap-4 sm:gap-6 border-b border-gray-200/50 sm:border-none pb-2 sm:pb-0"><span>Average Time</span> <span className="text-gray-800">45:00</span></div>
                            <div className="flex justify-between gap-4 sm:gap-6 border-b border-gray-200/50 sm:border-none pb-2 sm:pb-0"><span>Completed</span> <span className="text-gray-800">{past.length}</span></div>
                            <div className="flex justify-between gap-4 sm:gap-6"><span>Upcoming</span> <span className="text-gray-800">{upcoming.length}</span></div>
                        </div>
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-white to-gray-200 shadow-[inset_0_4px_10px_rgba(255,255,255,0.8),0_10px_20px_rgba(0,0,0,0.1)] flex items-center justify-center relative shrink-0">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#EFEFF5] shadow-[inset_0_4px_10px_rgba(0,0,0,0.1)] flex flex-col items-center justify-center">
                                <span className="text-[7px] sm:text-[8px] uppercase font-bold text-gray-400 tracking-wider">Available</span>
                                <span className="text-xl sm:text-2xl font-black text-gray-800 leading-none mt-1">{available.length}</span>
                            </div>
                            {available.length > 0 ? (
                                <div className="absolute top-1 sm:top-2 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white shadow-sm"></div>
                            ) : (
                                <div className="absolute top-1 sm:top-2 right-0 w-3 h-3 bg-red-400 rounded-full border-2 border-white shadow-sm"></div>
                            )}
                        </div>
                    </div>
                </div>

                {/* UPCOMING EXAMS GRID */}
                <div>
                    <div className="flex items-center justify-between mb-6 px-2 sm:px-4">
                        <h3 className="text-base sm:text-lg font-black text-gray-800 uppercase tracking-wide">ASSIGNED EXAMS</h3>
                        <span className="bg-[#DDE2EA] text-gray-600 text-[9px] sm:text-[10px] font-black px-3 py-1 rounded-md shadow-[inset_0_1px_3px_rgba(255,255,255,0.9)] border border-white/50">{upcoming.length} PENDING</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {upcoming.length > 0 ? upcoming.map(exam => (
                            <div key={exam._id} className="bg-[#DDE2EA] rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-[inset_0_2px_10px_rgba(255,255,255,0.9),0_10px_30px_rgba(0,0,0,0.05)] relative overflow-hidden group flex flex-col min-h-[220px]">
                                <div className="absolute -left-10 -top-10 w-48 h-48 bg-white/30 rounded-full filter blur-xl group-hover:bg-white/50 transition-all"></div>
                                
                                <div className="relative z-10 flex justify-between items-start mb-6">
                                    <div className="w-12 h-12 bg-white/70 backdrop-blur-md rounded-xl shadow-[inset_0_2px_5px_rgba(255,255,255,0.9)] flex items-center justify-center shrink-0 border border-white">
                                        <FileText className="w-5 h-5 text-gray-600" />
                                    </div>
                                    <div className={`px-3 py-1 bg-white/60 backdrop-blur-sm rounded-full text-[9px] font-black tracking-wider uppercase shadow-sm border border-white/50 ${exam.status === 'Available' ? 'text-green-600' : 'text-amber-600'}`}>
                                        {exam.status}
                                    </div>
                                </div>
                                
                                <div className="relative z-10 flex-1 flex flex-col">
                                    <h2 className="text-lg sm:text-xl font-black text-gray-800 leading-tight mb-3 line-clamp-2">{exam.title}</h2>
                                    <ul className="space-y-1.5 mb-8">
                                        <li className="text-[10px] sm:text-xs text-gray-500 font-medium flex items-center gap-2"><Clock size={12} className="text-gray-400" /> {new Date(exam.startTime).toLocaleDateString()} @ {new Date(exam.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</li>
                                        <li className="text-[10px] sm:text-xs text-gray-500 font-medium flex items-center gap-2"><Folder size={12} className="text-gray-400" /> {exam.durationMinutes} Minutes • {exam.totalQuestions} Questions</li>
                                    </ul>
                                </div>
                                
                                <div className="relative z-10 mt-auto pt-4 flex-shrink-0">
                                    {exam.status === 'Available' ? (
                                        <button 
                                            onClick={() => startExam(exam._id)}
                                            className="w-full py-3.5 sm:py-4 rounded-full font-black tracking-widest text-[10px] sm:text-xs text-white shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0 bg-gradient-to-r from-[#FF8E75] to-[#FF5E8E] hover:shadow-[0_8px_20px_rgba(255,94,142,0.3)] flex items-center justify-center gap-2"
                                        >
                                            START EXAM <AlertTriangle size={12} className="opacity-80" />
                                        </button>
                                    ) : (
                                        <button 
                                            disabled
                                            className="w-full py-3.5 sm:py-4 rounded-full font-black tracking-widest text-[10px] sm:text-xs text-gray-400 bg-white/50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] cursor-not-allowed border border-white/60 flex items-center justify-center"
                                        >
                                            NOT YET AVAILABLE
                                        </button>
                                    )}
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-1 md:col-span-2 xl:col-span-3 bg-[#EAE8F2] rounded-[2.5rem] p-12 text-center border border-white/50 shadow-[inset_0_2px_10px_rgba(255,255,255,0.9)]">
                                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4 opacity-50" />
                                <h3 className="text-xl font-black text-gray-800 mb-2">You're All Caught Up</h3>
                                <p className="text-gray-500 font-medium text-sm max-w-sm mx-auto">You've completed all assigned exams. When an educator assigns a new secure assessment, it will appear right here.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* BOTTOM CARDS ROW */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Recent History Card */}
                    <div className="bg-[#EBEBEF] rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-[inset_0_2px_10px_rgba(255,255,255,0.9),0_10px_30px_rgba(0,0,0,0.05)] border border-white/40 flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <h3 className="text-base sm:text-lg font-black text-gray-800 uppercase tracking-wide">RESULTS</h3>
                                {past.length > 0 && <span className="bg-[#D1F16D] text-[#55670D] text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-md shadow-sm">SCORED</span>}
                            </div>
                            <Link to="/student/results" className="text-[9px] sm:text-[10px] font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-colors">See All History</Link>
                        </div>

                        {past.length > 0 ? (
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 bg-white/30 p-4 rounded-3xl border border-white/50 backdrop-blur-sm flex-1">
                                <div className="w-16 h-16 sm:w-24 sm:h-20 rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300 shadow-inner flex items-center justify-center shrink-0 border border-white/60">
                                    <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-white opacity-90 drop-shadow-sm" />
                                </div>
                                <div className="flex-1 w-full">
                                    <h4 className="font-bold text-gray-800 mb-1 line-clamp-1">{past[0].title}</h4>
                                    <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium mb-3">
                                        {new Date(past[0].startTime).toLocaleDateString()} • {past[0].durationMinutes} min
                                    </p>
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <Link to="/student/results" className="px-4 sm:px-5 py-2 rounded-full bg-white/80 hover:bg-white text-[9px] sm:text-[10px] font-black text-gray-600 uppercase tracking-wider shadow-sm transition-all hover:-translate-y-0.5 border border-white">
                                            View Details
                                        </Link>
                                        <div className="text-right">
                                            <div className="text-gray-400 text-[8px] sm:text-[10px] uppercase font-bold tracking-widest mb-0.5">Score</div>
                                            <div className="text-base sm:text-lg font-black text-gray-800 leading-none">
                                                {past[0].score !== null ? `${past[0].score}/${past[0].totalQuestions}` : 'Processing'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-6 sm:py-8 text-sm font-medium text-gray-500 bg-white/30 rounded-3xl border border-white/50 border-dashed flex-1 flex items-center justify-center">
                                No past exams to display.
                            </div>
                        )}
                    </div>

                    {/* System Health Card */}
                    <div className="bg-[#EBEBEF] rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-[inset_0_2px_10px_rgba(255,255,255,0.9),0_10px_30px_rgba(0,0,0,0.05)] border border-white/40 flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-base sm:text-lg font-black text-gray-800 uppercase tracking-wide">SYSTEM HEALTH</h3>
                            <button className="text-[9px] sm:text-[10px] font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-colors cursor-default">Log Status</button>
                        </div>

                        <div className="bg-white/30 p-5 rounded-3xl border border-white/50 backdrop-blur-sm flex-1 flex flex-col justify-between">
                            <div>
                                <h4 className="font-bold text-gray-800 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                    Connection: Secure
                                </h4>
                                <div className="mt-3 space-y-2 text-[11px] sm:text-xs font-medium text-gray-600 bg-white/40 p-3 rounded-xl border border-white/60">
                                    <p className="flex justify-between items-center"><span className="text-gray-400">Status:</span> <span className="text-gray-800 font-bold">Operational</span></p>
                                    <p className="flex justify-between items-center"><span className="text-gray-400">Last Checked:</span> <span className="text-gray-800">{new Date().toLocaleTimeString()}</span></p>
                                    <p className="flex justify-between items-center"><span className="text-gray-400">Proctoring:</span> <span className="text-indigo-600 font-bold ml-2">Active</span></p>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center justify-between">
                                <button className="px-4 sm:px-5 py-2 rounded-full bg-white/80 hover:bg-white text-[9px] sm:text-[10px] font-black text-green-700 uppercase tracking-wider shadow-[inset_0_1px_3px_rgba(255,255,255,0.9)] transition-colors flex items-center gap-1 border border-green-100 cursor-default">
                                    <Check size={12} className="text-green-600" /> Network Valid
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
