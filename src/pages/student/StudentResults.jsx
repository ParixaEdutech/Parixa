import React, { useState, useEffect } from 'react';
import { Award, CheckCircle, FileText, Clock, AlertCircle, Search } from 'lucide-react';
import api from '../../services/api';
import Modal from '../../components/common/Modal';

const StudentResults = () => {
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [breakdownData, setBreakdownData] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFetchingBreakdown, setIsFetchingBreakdown] = useState(false);

    const handleViewBreakdown = async (examId) => {
        setIsFetchingBreakdown(true);
        try {
            const res = await api.get(`/exams/${examId}/my-submission`);
            setBreakdownData(res.data);
            setIsModalOpen(true);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to load breakdown. Make sure results are released.');
        } finally {
            setIsFetchingBreakdown(false);
        }
    };

    useEffect(() => {
        const fetchResults = async () => {
            try {
                const res = await api.get('/exams/my-assigned-exams');
                setResults(res.data.filter(e => e.status === 'Completed'));
            } catch (err) {
                console.error("Failed to load results:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchResults();
    }, []);

    if (isLoading) return (
        <div className="flex justify-center items-center flex-col h-64 py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 flex-shrink-0"></div>
        </div>
    );

    return (
        <div className="pb-8">
            <div className="px-4 sm:px-8 py-2">
                 <div className="flex items-center text-gray-400 text-sm sm:pl-4 w-full sm:w-64 bg-white/40 sm:bg-transparent rounded-full sm:rounded-none px-4 sm:px-0 py-2 sm:py-0">
                     <Search size={16} className="mr-2 shrink-0" />
                     <input type="text" placeholder="Search Past Exams" className="bg-transparent outline-none placeholder-gray-400 text-gray-700 w-full" />
                 </div>
            </div>

            <div className="p-4 sm:p-8 space-y-8 flex-1">
                <div className="flex flex-col gap-2 px-2 sm:px-4">
                    <h1 className="text-3xl sm:text-4xl font-black text-gray-800 tracking-tight">Academic Performance</h1>
                    <p className="text-sm font-medium text-gray-500">Review your secure assessment scores and performance analytics.</p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {results.map((result) => (
                        <div key={result._id} className="bg-[#DDE2EA] rounded-[2rem] p-6 sm:p-8 shadow-[inset_0_2px_10px_rgba(255,255,255,0.9),0_10px_30px_rgba(0,0,0,0.05)] relative overflow-hidden group">
                            <div className="absolute -left-10 -top-10 w-48 h-48 bg-white/30 rounded-full filter blur-xl group-hover:bg-white/40 transition-all"></div>
                            
                            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                <div className="flex items-center gap-4 sm:gap-6">
                                    <div className={`w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br ${result.score !== null ? 'from-green-100 to-green-300' : 'from-gray-100 to-gray-300'} rounded-2xl shadow-xl flex items-center justify-center border-4 border-white/60 shrink-0`}>
                                        {result.score !== null ? (
                                            <Award className="w-8 h-8 sm:w-10 sm:h-10 text-green-700" />
                                        ) : (
                                            <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                                        )}
                                    </div>
                                    <div>
                                        <div className="inline-block px-3 py-1 bg-white/60 backdrop-blur-sm rounded-full text-[9px] sm:text-[10px] font-black tracking-wider uppercase mb-2 shadow-sm border border-white/50 text-gray-700">
                                            {result.score !== null ? 'Evaluated' : 'Pending Review'}
                                        </div>
                                        <h3 className="text-xl sm:text-2xl font-black text-gray-800 leading-tight mb-1">{result.title}</h3>
                                        <p className="text-[10px] sm:text-xs text-gray-500 font-medium flex items-center gap-1.5">
                                            <Clock size={12} /> {new Date(result.startTime).toLocaleDateString()} @ {new Date(result.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {result.durationMinutes}m
                                        </p>
                                    </div>
                                </div>

                                {result.score !== null ? (
                                    <div className="flex items-center gap-4 sm:gap-8 bg-white/30 p-4 sm:p-5 rounded-3xl border border-white/50 w-full md:w-auto overflow-x-auto shrink-0">
                                        <div className="text-center shrink-0">
                                            <p className="text-[9px] sm:text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Final Score</p>
                                            <p className="text-2xl sm:text-3xl font-black text-indigo-900 tracking-tighter shadow-sm px-4 bg-white/60 rounded-xl py-1 border border-white">
                                                {result.score} <span className="text-sm text-gray-500">/ {result.totalQuestions}</span>
                                            </p>
                                        </div>
                                        <div className="w-[1px] h-10 bg-gray-300/50"></div>
                                        <div className="text-center shrink-0 hidden sm:block">
                                            <p className="text-[9px] sm:text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Accuracy</p>
                                            <p className="text-xl sm:text-2xl font-black text-gray-800 tracking-tighter px-4 py-1.5">
                                                {Math.round((result.score / result.totalQuestions) * 100)}%
                                            </p>
                                        </div>
                                        <div className="w-[1px] h-10 bg-gray-300/50 hidden sm:block"></div>
                                        <div className="text-center shrink-0 flex flex-col items-center">
                                            <p className="text-[9px] sm:text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2 flex items-center justify-center gap-1"><CheckCircle size={10} className="text-green-600"/> Audit Ready</p>
                                            <button 
                                                onClick={() => handleViewBreakdown(result._id)}
                                                disabled={isFetchingBreakdown}
                                                className="px-4 py-2 bg-gray-800 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl hover:-translate-y-0.5 transition-all text-center flex items-center justify-center whitespace-nowrap"
                                            >
                                                {isFetchingBreakdown ? 'Loading...' : 'View Detail \u2192'}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center bg-white/30 p-4 sm:p-5 rounded-3xl border border-white/50 border-dashed w-full md:w-auto h-[76px] sm:h-[88px]">
                                        <div className="flex items-center gap-2 text-gray-500 font-bold text-xs sm:text-sm">
                                            <AlertCircle size={16} className="animate-pulse" /> Awaiting Educator Verification
                                        </div>
                                    </div>
                                )}

                                {/* Mobile View Button */}
                                {result.score !== null && (
                                    <button 
                                        onClick={() => handleViewBreakdown(result._id)}
                                        disabled={isFetchingBreakdown}
                                        className="sm:hidden w-full py-3 bg-gray-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-900 shadow-lg text-center"
                                    >
                                        {isFetchingBreakdown ? 'Loading Audit...' : 'View Detail \u2192'}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}

                    {results.length === 0 && (
                        <div className="bg-[#EBEBEF] rounded-[2.5rem] p-12 text-center border border-white/40 shadow-[inset_0_2px_10px_rgba(255,255,255,0.9),0_10px_30px_rgba(0,0,0,0.05)]">
                            <div className="w-24 h-24 rounded-full bg-white/40 mx-auto flex flex-col items-center justify-center mb-6 shadow-[inset_0_2px_5px_rgba(0,0,0,0.05)] border border-white/60">
                                <FileText className="text-gray-400 w-10 h-10" />
                            </div>
                            <h2 className="text-2xl font-black text-gray-800 mb-2">No Past Results Found</h2>
                            <p className="text-sm font-medium text-gray-500 max-w-sm mx-auto">Once you cleanly submit an exam and the educator finishes assessing it, your score logs will be displayed here.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Performance modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={<span className="text-2xl font-black text-gray-800 tracking-tight">Performance Audit Log</span>}>
                {breakdownData && (
                    <div className="space-y-4 max-h-[65vh] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-300">
                        {breakdownData.answers.map((ans, idx) => {
                            const isCorrect = ans.selectedOption === ans.question?.correctAnswer;
                            return (
                                <div key={idx} className={`p-6 rounded-3xl transition-all border shadow-[inset_0_2px_5px_rgba(255,255,255,0.8)] relative overflow-hidden ${isCorrect ? 'bg-[#E8F5E9] border-[#C8E6C9]' : 'bg-[#FFEBEE] border-[#FFCDD2]'}`}>
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/40 rounded-full blur-xl -translate-y-16 translate-x-16 pointer-events-none"></div>

                                    <div className="flex justify-between items-start gap-4 mb-3 relative z-10">
                                        <span className="text-xs font-black text-gray-500 uppercase tracking-widest bg-white/50 px-3 py-1 rounded-full border border-white/60 shadow-sm">Question {idx + 1}</span>
                                        <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border border-white/50 ${isCorrect ? 'bg-green-100/80 text-green-800' : 'bg-red-100/80 text-red-800'}`}>
                                            {isCorrect ? '✔ CORRECT' : '✖ INCORRECT'}
                                        </span>
                                    </div>
                                    <p className="text-base sm:text-lg font-bold text-gray-900 mb-5 relative z-10 leading-tight">{ans.question?.text || "[Data Redacted by Server]"}</p>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                                        <div className={`p-4 rounded-2xl border text-sm font-medium shadow-[inset_0_2px_4px_rgba(255,255,255,0.6)] ${isCorrect ? 'bg-white/60 border-green-200 text-green-900' : 'bg-white/60 border-red-200 text-red-900'}`}>
                                            <p className="text-[9px] font-black uppercase opacity-60 mb-1.5 tracking-wider">Your Selection</p>
                                            {ans.selectedOption !== undefined && ans.question?.options && ans.selectedOption >= 0 ? ans.question.options[ans.selectedOption] : <span className="italic text-gray-400">Blank Submission</span>}
                                        </div>
                                        {!isCorrect && (
                                            <div className="p-4 rounded-2xl border border-gray-200 text-gray-700 text-sm font-medium bg-white/80 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8)]">
                                                <p className="text-[9px] font-black uppercase opacity-60 mb-1.5 tracking-wider">Verified Answer</p>
                                                {ans.question?.options ? ans.question.options[ans.question.correctAnswer] : "N/A"}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default StudentResults;
