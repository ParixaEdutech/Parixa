import React, { useState, useEffect } from 'react';
import { Search, Download, CheckCircle, Clock, Eye, AlertTriangle, User, Lock, FileText, Award } from 'lucide-react';
import api from '../../services/api';

const Results = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [classFilter, setClassFilter] = useState('all');
    const [exams, setExams] = useState([]);
    const [selectedExamId, setSelectedExamId] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [activeModalTab, setActiveModalTab] = useState('integrity');

    useEffect(() => {
        const loadExams = async () => {
            try {
                const res = await api.get('/exams/my-exams');
                setExams(res.data);
                if (res.data && res.data.length > 0) {
                    handleSelectExam(res.data[0]._id);
                }
            } catch (err) {
                console.error("Failed to load exams", err);
            } finally {
                setLoading(false);
            }
        };
        loadExams();
    }, []);

    const handleSelectExam = async (examId) => {
        setSelectedExamId(examId);
        try {
            const res = await api.get(`/exams/${examId}/submissions`);
            setSubmissions(res.data);
        } catch (err) {
            console.error("Failed to load submissions", err);
        }
    };

    const handlePublish = async (examId) => {
        try {
            await api.post(`/exams/${examId}/publish-results`);
            alert("Results published to all students!");
            setExams(prev => prev.map(e => e._id === examId ? { ...e, showResults: true } : e));
        } catch (err) {
            alert("Failed to publish results.");
        }
    };

    const handleExportCSV = () => {
        if (submissions.length === 0) return alert("No submissions to export!");
        
        const currentEx = exams.find(e => e._id === selectedExamId);
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Student Name,Email,Score,Total Questions,Percentage,AI Integrity Logs\n";
        
        submissions.forEach(sub => {
            const logs = sub.proctoringLogs?.map(log => log.violation).join(" | ") || "CLEAN";
            csvContent += `"${sub.student?.name}","${sub.student?.email}",${sub.score},${sub.totalQuestions},${((sub.score/sub.totalQuestions)*100).toFixed(2)}%,"${logs}"\n`;
        });
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Results_${currentEx?.title.split(' ').join('_')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return (
        <div className="flex justify-center items-center flex-col h-64 py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 flex-shrink-0"></div>
        </div>
    );

    const currentExam = exams.find(e => e._id === selectedExamId);
    const availableClasses = [...new Set(submissions.map(s => s.student?.assignedClass || 'Unassigned'))].sort();

    return (
        <div className="pb-12">
            <div className="p-4 sm:p-8 space-y-8 flex-1">
                {/* Header Page Title */}
                <div className="flex flex-col gap-2 px-2 sm:px-4">
                    <h1 className="text-3xl sm:text-4xl font-black text-gray-800 tracking-tight">Intelligence Hub</h1>
                    <p className="text-sm font-medium text-gray-500">Review scores, verify integrity logs, and distribute graded results.</p>
                </div>

                {/* Left side nav inside a grid - Recreating the "Assigned Exams" UI look */}
                <div>
                    <div className="flex items-center justify-between mb-6 px-2 sm:px-4">
                        <h3 className="text-base sm:text-lg font-black text-gray-800 uppercase tracking-wide">EXAM RECORDS</h3>
                        <span className="bg-[#DDE2EA] text-gray-600 text-[9px] sm:text-[10px] font-black px-3 py-1 rounded-md shadow-[inset_0_1px_3px_rgba(255,255,255,0.9)] border border-white/50">{exams.length} AVAILABLE</span>
                    </div>

                    <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
                        {exams.map((exam) => (
                            <div 
                                key={exam._id} 
                                onClick={() => handleSelectExam(exam._id)}
                                className={`snap-center shrink-0 w-64 md:w-80 cursor-pointer rounded-[2rem] p-6 shadow-[inset_0_2px_10px_rgba(255,255,255,0.9),0_10px_30px_rgba(0,0,0,0.05)] relative overflow-hidden group transition-all border ${
                                    selectedExamId === exam._id 
                                    ? 'bg-[#E7ECF5] border-white' 
                                    : 'bg-[#DDE2EA] border-transparent hover:bg-[#E7ECF5]'
                                }`}
                            >
                                <div className="absolute -left-10 -top-10 w-32 h-32 bg-white/40 rounded-full filter blur-xl transition-all"></div>
                                
                                <div className="relative z-10 flex justify-between items-start mb-4">
                                    <div className={`w-12 h-12 rounded-xl shadow-[inset_0_2px_5px_rgba(255,255,255,0.9)] border flex items-center justify-center shrink-0 ${selectedExamId === exam._id ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-white/70 backdrop-blur-md text-gray-600 border-white'}`}>
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div className={`px-2 py-1 bg-white/60 backdrop-blur-sm rounded-full text-[8px] font-black tracking-wider uppercase shadow-sm border border-white/50 ${exam.showResults ? 'text-green-600' : 'text-amber-600'}`}>
                                        {exam.showResults ? 'Published' : 'Hidden'}
                                    </div>
                                </div>
                                
                                <div className="relative z-10">
                                    <h2 className="text-lg font-black text-gray-800 leading-tight mb-2 line-clamp-2">{exam.title}</h2>
                                    <p className="text-[10px] text-gray-500 font-medium flex items-center gap-2">
                                        <Clock size={12} className="text-gray-400" /> {new Date(exam.startTime).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Submissions Section */}
                {selectedExamId && (
                    <div className="bg-[#EBEBEF] rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-[inset_0_2px_10px_rgba(255,255,255,0.9),0_10px_30px_rgba(0,0,0,0.05)] border border-white/40 flex flex-col">
                        
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 px-2 gap-4">
                            <div className="flex items-center gap-3">
                                <h3 className="text-base sm:text-lg font-black text-gray-800 uppercase tracking-wide">SUBMISSIONS LOG</h3>
                                <span className="bg-[#D1F16D] text-[#55670D] text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-md shadow-sm">{submissions.length} Total</span>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                                <div className="flex items-center text-gray-400 text-sm pl-4 w-full sm:w-48 bg-white/40 rounded-full py-2 shadow-sm border border-white">
                                    <Search size={14} className="mr-2 shrink-0" />
                                    <input 
                                        type="text" 
                                        placeholder="Search..." 
                                        className="bg-transparent outline-none placeholder-gray-400 text-gray-700 w-full font-medium text-xs" 
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                
                                <select 
                                    value={classFilter} 
                                    onChange={(e) => setClassFilter(e.target.value)}
                                    className="px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full text-[10px] font-black tracking-wider uppercase shadow-sm border border-white/50 text-gray-700 outline-none appearance-none hover:bg-white transition-colors"
                                >
                                    <option value="all">All Classes</option>
                                    {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>

                                <button 
                                    onClick={handleExportCSV}
                                    className="px-4 py-2 bg-white/80 hover:bg-white text-[9px] sm:text-[10px] font-black text-gray-600 uppercase tracking-wider shadow-sm transition-all hover:-translate-y-0.5 border border-white flex items-center gap-1"
                                >
                                    <Download size={12} /> Export CSV
                                </button>
                                
                                <button 
                                    onClick={() => handlePublish(selectedExamId)}
                                    disabled={currentExam?.showResults}
                                    className={`px-4 py-2 rounded-full font-black tracking-widest text-[9px] sm:text-[10px] uppercase shadow-lg transition-all flex items-center gap-1 ${currentExam?.showResults ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none' : 'text-white hover:-translate-y-0.5 active:translate-y-0 bg-gradient-to-r from-[#2ecc71] to-[#27ae60] hover:shadow-[0_8px_20px_rgba(46,204,113,0.3)]'}`}
                                >
                                    <Eye size={12} /> {currentExam?.showResults ? 'Auto-Published' : 'Publish to Students'}
                                </button>
                            </div>
                        </div>
                        
                        <div className="bg-white/30 p-2 sm:p-4 rounded-3xl border border-white/50 backdrop-blur-sm overflow-x-auto min-h-[400px]">
                            {submissions.length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-20 text-gray-400">
                                    <Clock size={48} className="mb-4 opacity-20" />
                                    <p className="font-bold uppercase tracking-widest text-xs">Awaiting Activity</p>
                                    <p className="text-xs pt-2 font-medium">No one has successfully submitted responses for this assessment.</p>
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse min-w-[700px]">
                                    <thead>
                                        <tr>
                                            <th className="px-6 py-4 text-[10px] sm:text-[11px] font-black uppercase text-gray-500 tracking-widest border-b border-white/40">Student Detail</th>
                                            <th className="px-6 py-4 text-[10px] sm:text-[11px] font-black uppercase text-gray-500 tracking-widest border-b border-white/40">Performance Rating</th>
                                            <th className="px-6 py-4 text-[10px] sm:text-[11px] font-black uppercase text-gray-500 tracking-widest border-b border-white/40">AI Vision Proctorship</th>
                                            <th className="px-6 py-4 text-[10px] sm:text-[11px] font-black uppercase text-gray-500 tracking-widest border-b border-white/40 text-right">Audit</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {submissions
                                            .filter(s => {
                                                const matchSearch = s.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? true;
                                                const matchClass = classFilter === 'all' ? true : (s.student?.assignedClass || 'Unassigned') === classFilter;
                                                return matchSearch && matchClass;
                                            })
                                            .map((sub) => {
                                                return (
                                                <tr key={sub._id} className="hover:bg-white/40 transition-colors border-b border-white/20 last:border-0 rounded-2xl overflow-hidden group">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 shadow-inner flex items-center justify-center text-gray-600 font-bold border border-white/60 shrink-0">
                                                                <User size={18} />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <p className="text-sm font-black text-gray-800 tracking-tight">{sub.student?.name}</p>
                                                                    <span className="text-[9px] font-black uppercase text-gray-600 bg-white shadow-sm px-2 py-0.5 rounded-md tracking-wider border border-white">
                                                                        {sub.student?.assignedClass || 'Unassigned'}
                                                                    </span>
                                                                </div>
                                                                <p className="text-[10px] sm:text-xs font-medium text-gray-500">{sub.student?.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col justify-center">
                                                            <div className="text-base sm:text-lg font-black text-gray-800 leading-none">
                                                                {sub.score} <span className="text-xs text-gray-400 font-medium">/ {sub.totalQuestions}</span>
                                                            </div>
                                                            <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">
                                                                {((sub.score / sub.totalQuestions) * 100).toFixed(0)}% Match
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {sub.proctoringLogs && sub.proctoringLogs.length > 0 ? (
                                                            <div className="flex flex-col gap-1.5 focus:outline-none focus:ring-2">
                                                                <div className="flex items-center gap-1.5 p-1.5 bg-[#FFEBEE] border border-[#FFCDD2] text-[#C62828] rounded-lg inline-flex self-start shadow-[inset_0_2px_4px_rgba(255,255,255,0.6)]">
                                                                    <AlertTriangle size={12} className="animate-pulse" />
                                                                    <span className="text-[9px] font-black uppercase tracking-widest">{sub.proctoringLogs.length} Security Flags</span>
                                                                </div>
                                                                <div className="text-[8px] text-gray-500 font-bold uppercase tracking-wider pl-1">
                                                                    {[...new Set(sub.proctoringLogs.map(log => log.violation))].join(' • ')}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-[9px] font-black text-[#2E7D32] uppercase tracking-widest flex items-center gap-1 bg-[#E8F5E9] border border-[#C8E6C9] py-1.5 px-3 rounded-lg shadow-[inset_0_2px_4px_rgba(255,255,255,0.6)] self-start w-max">
                                                                <CheckCircle size={12} /> Verified Clean
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button 
                                                            onClick={() => {
                                                                setSelectedSubmission(sub);
                                                                setActiveModalTab('integrity');
                                                            }}
                                                            className="px-4 py-2 bg-gray-800 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl hover:-translate-y-0.5 transition-all outline-none"
                                                        >
                                                            Audit Log &rarr;
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Wrapper adjusted slightly but kept mostly functional logic */}
            {selectedSubmission && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-[#DDE2EA] w-full max-w-3xl rounded-[2.5rem] shadow-[inset_0_2px_10px_rgba(255,255,255,0.9),0_20px_40px_rgba(0,0,0,0.2)] overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="px-8 py-6 flex justify-between items-center relative z-10">
                            <div>
                                <h3 className="text-2xl font-black text-gray-800 tracking-tight">Intelligence Audit</h3>
                                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1">Report for {selectedSubmission.student?.name}</p>
                            </div>
                            <button 
                                onClick={() => setSelectedSubmission(null)}
                                className="w-10 h-10 rounded-full bg-white/60 shadow-sm border border-white/50 flex items-center justify-center text-gray-400 hover:text-gray-800 hover:bg-white transition-all"
                            >
                                <Lock size={16} />
                            </button>
                        </div>

                        {/* Modal Tabs */}
                        <div className="px-8 flex gap-4 relative z-10">
                            <button 
                                onClick={() => setActiveModalTab('integrity')}
                                className={`px-4 py-2 rounded-t-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeModalTab === 'integrity' ? 'bg-white/40 text-gray-800 border-x border-t border-white/60 shadow-[inset_0_2px_5px_rgba(255,255,255,1)]' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                Security Matrix
                            </button>
                            <button 
                                onClick={() => setActiveModalTab('performance')}
                                className={`px-4 py-2 rounded-t-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeModalTab === 'performance' ? 'bg-white/40 text-gray-800 border-x border-t border-white/60 shadow-[inset_0_2px_5px_rgba(255,255,255,1)]' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                Academic Breakdown
                            </button>
                        </div>
                        
                        {/* Modal Body */}
                        <div className="p-8 overflow-y-auto bg-white/30 backdrop-blur-sm border-t border-white/50 flex-1">
                            {activeModalTab === 'integrity' ? (
                                <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="p-6 bg-white/60 rounded-3xl border border-white shadow-[inset_0_2px_5px_rgba(255,255,255,0.8)]">
                                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Final Result</p>
                                            <p className="text-3xl font-black text-gray-800 leading-none">{selectedSubmission.score} <span className="text-lg text-gray-500">/ {selectedSubmission.totalQuestions}</span></p>
                                        </div>
                                        <div className={`p-6 rounded-3xl border shadow-[inset_0_2px_5px_rgba(255,255,255,0.8)] ${selectedSubmission.proctoringLogs?.length > 0 ? 'bg-[#FFEBEE]/80 border-[#FFCDD2] text-[#C62828]' : 'bg-[#E8F5E9]/80 border-[#C8E6C9] text-[#2E7D32]'}`}>
                                            <p className="text-[9px] font-black opacity-60 uppercase tracking-widest mb-1">AI Audit</p>
                                            <p className="text-3xl font-black leading-none">{selectedSubmission.proctoringLogs?.length || 0} <span className="text-lg opacity-80">Flags</span></p>
                                        </div>
                                    </div>

                                    <div className="bg-[#EBEBEF] rounded-3xl p-6 shadow-inner border border-white/40">
                                        <h4 className="text-[11px] font-black text-gray-800 uppercase tracking-widest mb-4">Chronological AI Log</h4>
                                        {(!selectedSubmission.proctoringLogs || selectedSubmission.proctoringLogs.length === 0) ? (
                                            <div className="bg-white/50 border border-white p-6 rounded-2xl text-center text-xs font-bold text-gray-500 shadow-sm">
                                                Zero anomalies detected during exam session.
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {selectedSubmission.proctoringLogs.map((log, idx) => (
                                                    <div key={idx} className="flex items-center gap-4 p-4 bg-white/60 border border-white rounded-2xl group shadow-sm transition-all hover:bg-white text-left">
                                                        <div className="bg-[#FFEBEE] p-2 rounded-lg text-[#C62828]">
                                                            <AlertTriangle size={16} />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-xs font-bold text-gray-800 uppercase tracking-wider">{log.violation}</p>
                                                            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Logged at {new Date(log.timestamp).toLocaleTimeString()}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                                    {selectedSubmission.answers.map((ans, idx) => {
                                        const isCorrect = ans.selectedOption === ans.question?.correctAnswer;
                                        return (
                                            <div key={idx} className={`p-6 rounded-3xl transition-all border shadow-[inset_0_2px_5px_rgba(255,255,255,0.8)] relative overflow-hidden ${isCorrect ? 'bg-[#E8F5E9]/60 border-[#C8E6C9]' : 'bg-[#FFEBEE]/60 border-[#FFCDD2]'}`}>
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/40 rounded-full blur-xl -translate-y-16 translate-x-16 pointer-events-none"></div>

                                                <div className="flex justify-between items-start gap-4 mb-3 relative z-10">
                                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest bg-white/50 px-3 py-1 rounded-full border border-white/60 shadow-sm">Question {idx + 1}</span>
                                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm border border-white/50 ${isCorrect ? 'bg-green-100/80 text-green-800' : 'bg-red-100/80 text-red-800'}`}>
                                                        {isCorrect ? '✔ CORRECT' : '✖ INCORRECT'}
                                                    </span>
                                                </div>
                                                <p className="text-sm font-bold text-gray-900 mb-5 relative z-10 leading-tight">{ans.question?.text || "[Data Redacted by Server]"}</p>
                                                
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                                                    <div className={`p-4 rounded-2xl border text-[11px] font-medium shadow-[inset_0_2px_4px_rgba(255,255,255,0.6)] ${isCorrect ? 'bg-white/60 border-green-200 text-green-900' : 'bg-white/60 border-red-200 text-red-900'}`}>
                                                        <p className="text-[8px] font-black uppercase opacity-60 mb-1 tracking-wider">Student's Selection</p>
                                                        {ans.selectedOption !== undefined && ans.question?.options ? ans.question.options[ans.selectedOption] : <span className="italic text-gray-400">Blank Submission</span>}
                                                    </div>
                                                    {!isCorrect && (
                                                        <div className="p-4 rounded-2xl border border-gray-200 text-gray-700 text-[11px] font-medium bg-white/80 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8)]">
                                                            <p className="text-[8px] font-black uppercase opacity-60 mb-1 tracking-wider">Ground Truth Verified</p>
                                                            {ans.question?.options ? ans.question.options[ans.question.correctAnswer] : "N/A"}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 bg-white/40 border-t border-white/50 relative z-10">
                            <button 
                                onClick={() => setSelectedSubmission(null)} 
                                className="w-full h-14 rounded-2xl font-black tracking-widest text-[10px] sm:text-xs text-white shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0 bg-gradient-to-r from-[#FF8E75] to-[#FF5E8E] hover:shadow-[0_8px_20px_rgba(255,94,142,0.3)] uppercase flex items-center justify-center gap-2"
                            >
                                <Lock size={16} /> Seal Audit File
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Results;
