import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Users, ChevronDown, CheckCircle, Search, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const ScheduleExam = () => {
    const navigate = useNavigate();
    
    const [exams, setExams] = useState([]);
    const [students, setStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isScheduling, setIsScheduling] = useState(false);
    
    const [showResults, setShowResults] = useState(false);
    const [examPassword, setExamPassword] = useState('');
    
    const [selectedExamId, setSelectedExamId] = useState('');
    const [studentSearch, setStudentSearch] = useState('');
    const [classFilter, setClassFilter] = useState('all');
    const [selectedStudents, setSelectedStudents] = useState([]);
    
    const [scheduleData, setScheduleData] = useState({
        date: '',
        startTime: '',
        durationMinutes: 60,
        windowMinutes: 60,
    });

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [examsRes, studentsRes] = await Promise.all([
                    api.get('/exams/my-exams'),
                    api.get('/exams/students')
                ]);
                setExams(examsRes.data);
                setStudents(studentsRes.data);
            } catch (err) {
                console.error("Failed to load scheduling data", err);
            } finally {
                setIsLoading(false);
            }
        };
        loadInitialData();
    }, []);

    const selectedExam = exams.find(e => e._id === selectedExamId);
    const availableClasses = [...new Set(students.map(s => s.assignedClass || 'Unassigned'))].sort();

    const filteredStudents = students.filter(s => {
        const matchText = s.name.toLowerCase().includes(studentSearch.toLowerCase()) || s.email.toLowerCase().includes(studentSearch.toLowerCase());
        const matchClass = classFilter === 'all' ? true : (s.assignedClass || 'Unassigned') === classFilter;
        return matchText && matchClass;
    });

    const toggleStudent = (sid) => {
        setSelectedStudents(prev => 
            prev.includes(sid) ? prev.filter(id => id !== sid) : [...prev, sid]
        );
    };

    const handleSelectAll = (checked) => {
        const filteredIds = filteredStudents.map(s => s._id);
        if (checked) {
            setSelectedStudents([...new Set([...selectedStudents, ...filteredIds])]);
        } else {
            setSelectedStudents(selectedStudents.filter(id => !filteredIds.includes(id)));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedExamId) return alert('Select an exam first.');
        if (selectedStudents.length === 0) return alert('At least 1 student must be assigned.');

        setIsScheduling(true);
        try {
            await api.post(`/exams/${selectedExamId}/schedule`, {
                date: scheduleData.date,
                startTime: scheduleData.startTime,
                durationMinutes: scheduleData.durationMinutes,
                entryWindowMinutes: scheduleData.windowMinutes,
                studentIds: selectedStudents,
                showResults,
                examPassword
            });
            alert('Exam Successfully Scheduled and Question Sets Distributed!');
            navigate('/teacher/dashboard');
        } catch (error) {
            console.error('Scheduling error:', error);
            alert('Failed to schedule exam. Ensure all fields are valid.');
        } finally {
            setIsScheduling(false);
        }
    };

    if (isLoading) return (
        <div className="flex justify-center items-center flex-col h-64 py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 flex-shrink-0"></div>
        </div>
    );

    return (
        <div className="pb-12">
            <div className="p-4 sm:p-8 space-y-8 flex-1 max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-2 sm:px-4">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl sm:text-4xl font-black text-gray-800 tracking-tight">Deployment Phase</h1>
                        <p className="text-sm font-medium text-gray-500">Configure scheduling parameters and distribute assigned sets.</p>
                    </div>
                    <div className="flex items-center gap-2 bg-white/80 px-4 py-2 rounded-full border border-white shadow-sm backdrop-blur-sm">
                        <Users size={16} className="text-indigo-600" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-900">{selectedStudents.length} Assigned Candidates</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    
                    {/* Left Panel: Shell & Audience */}
                    <div className="lg:col-span-3 space-y-6">
                        <div className="bg-[#EBEBEF] rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-[inset_0_2px_10px_rgba(255,255,255,0.9),0_10px_30px_rgba(0,0,0,0.05)] border border-white/40 flex flex-col h-full gap-8">
                            
                            <section>
                                <div className="flex items-center justify-between mb-4 px-2">
                                    <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Select Source Shell</h3>
                                </div>
                                <div className="relative group">
                                    <select 
                                        value={selectedExamId}
                                        onChange={(e) => setSelectedExamId(e.target.value)}
                                        className="w-full pl-6 pr-10 py-4 bg-white/60 backdrop-blur-sm border border-white/60 rounded-2xl text-sm font-bold text-gray-800 focus:ring-2 focus:ring-indigo-500 transition-all outline-none shadow-[inset_0_2px_4px_rgba(255,255,255,0.8)] appearance-none cursor-pointer hover:bg-white"
                                    >
                                        <option value="">Select a saved architecture...</option>
                                        {exams.map(ex => (
                                            <option key={ex._id} value={ex._id}>{ex.title} (Domain: {ex.subject})</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-6 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-indigo-500 pointer-events-none transition-colors" size={20} />
                                </div>
                                
                                {selectedExam && (
                                    <div className="mt-4 p-4 bg-green-50/60 backdrop-blur-sm rounded-2xl border border-green-100 flex items-center gap-4 animate-in slide-in-from-top-2 shadow-sm">
                                        <div className="bg-green-100 p-2.5 rounded-xl"><CheckCircle className="text-green-700" size={18} /></div>
                                        <div>
                                            <p className="text-xs font-black text-green-900 uppercase tracking-wider">Blueprint Loaded</p>
                                            <p className="text-[10px] text-green-700 font-bold mt-0.5">Questions detected inside this shell.</p>
                                        </div>
                                    </div>
                                )}
                            </section>

                            <section className="flex-1 flex flex-col">
                                <div className="flex justify-between items-center mb-4 px-2">
                                    <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Identify Target Audience</h3>
                                    <button 
                                        onClick={() => {
                                            const filteredIds = filteredStudents.map(s => s._id);
                                            const allFilteredSelected = filteredIds.length > 0 && filteredIds.every(id => selectedStudents.includes(id));
                                            handleSelectAll(!allFilteredSelected);
                                        }}
                                        className="text-[9px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest transition-colors px-3 py-1 bg-white rounded-full shadow-sm border border-white/50"
                                    >
                                        {filteredStudents.length > 0 && filteredStudents.every(s => selectedStudents.includes(s._id)) 
                                            ? 'Unlink All Shown' : 'Link All Shown'}
                                    </button>
                                </div>
                                
                                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                                        <input 
                                            type="text"
                                            placeholder="Identity search..."
                                            value={studentSearch}
                                            onChange={(e) => setStudentSearch(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-white/60 border border-white/60 rounded-2xl text-xs font-bold text-gray-800 focus:ring-2 focus:ring-indigo-500 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8)] outline-none"
                                        />
                                    </div>
                                    <select 
                                        value={classFilter} 
                                        onChange={(e) => setClassFilter(e.target.value)}
                                        className="px-4 py-3 bg-white/60 border border-white/60 rounded-2xl text-xs font-bold text-gray-800 focus:ring-2 focus:ring-indigo-500 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8)] outline-none sm:w-40 appearance-none hover:bg-white cursor-pointer"
                                    >
                                        <option value="all">All Divisions</option>
                                        {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>

                                <div className="bg-white/30 rounded-3xl border border-white/50 backdrop-blur-sm overflow-hidden flex-1 flex flex-col max-h-[400px]">
                                    <div className="overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-200">
                                        {filteredStudents.map(student => (
                                            <div 
                                                key={student._id}
                                                onClick={() => toggleStudent(student._id)}
                                                className={`flex items-center justify-between p-4 mb-2 last:mb-0 rounded-2xl cursor-pointer transition-all border ${
                                                    selectedStudents.includes(student._id) 
                                                    ? 'bg-white shadow-sm border-white' 
                                                    : 'bg-transparent border-transparent hover:bg-white/50'
                                                }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl shadow-inner flex items-center justify-center font-bold border border-white/60 shrink-0 transition-colors ${
                                                        selectedStudents.includes(student._id) ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200/50 text-gray-500'
                                                    }`}>
                                                        {student.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-black text-gray-800 tracking-tight">{student.name}</p>
                                                            <span className="text-[9px] font-black uppercase text-gray-600 bg-white shadow-sm px-2 py-0.5 rounded-md tracking-wider border border-white">
                                                                {student.assignedClass || 'Unassigned'}
                                                            </span>
                                                        </div>
                                                        <p className={`text-[10px] font-medium ${selectedStudents.includes(student._id) ? 'text-indigo-900/60' : 'text-gray-500'}`}>{student.email}</p>
                                                    </div>
                                                </div>
                                                
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                                                    selectedStudents.includes(student._id) ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-200 text-transparent'
                                                }`}>
                                                    <CheckCircle size={14} className={selectedStudents.includes(student._id) ? 'opacity-100' : 'opacity-0'} />
                                                </div>
                                            </div>
                                        ))}
                                        {filteredStudents.length === 0 && (
                                            <div className="text-center p-8 text-xs font-bold text-gray-400 uppercase tracking-widest">
                                                No identities matched.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>

                    {/* Right Panel: Timing Config */}
                    <div className="lg:col-span-2">
                        <div className="bg-[#DDE2EA] rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-[inset_0_2px_10px_rgba(255,255,255,0.9),0_10px_30px_rgba(0,0,0,0.05)] relative overflow-hidden group h-full flex flex-col">
                            <div className="absolute -left-10 -top-10 w-48 h-48 bg-white/30 rounded-full filter blur-xl group-hover:bg-white/50 transition-all"></div>
                            
                            <form onSubmit={handleSubmit} className="relative z-10 flex flex-col h-full space-y-6">
                                <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-2 px-1">Execute Protocol</h3>
                                
                                <div className="space-y-4">
                                    {/* Date */}
                                    <div>
                                        <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1.5 pl-1 flex items-center gap-1"><CalendarIcon size={12}/> Execution Date</label>
                                        <input
                                            type="date"
                                            required
                                            value={scheduleData.date}
                                            onChange={(e) => setScheduleData({ ...scheduleData, date: e.target.value })}
                                            className="w-full px-4 py-3.5 bg-white/60 backdrop-blur-sm border border-white/60 rounded-2xl text-xs font-bold text-gray-800 focus:ring-2 focus:ring-indigo-500 transition-all outline-none shadow-[inset_0_2px_4px_rgba(255,255,255,0.8)]"
                                        />
                                    </div>

                                    {/* Time */}
                                    <div>
                                        <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1.5 pl-1 flex items-center gap-1"><Clock size={12}/> Start Time</label>
                                        <input
                                            type="time"
                                            required
                                            value={scheduleData.startTime}
                                            onChange={(e) => setScheduleData({ ...scheduleData, startTime: e.target.value })}
                                            className="w-full px-4 py-3.5 bg-white/60 backdrop-blur-sm border border-white/60 rounded-2xl text-xs font-bold text-gray-800 focus:ring-2 focus:ring-indigo-500 transition-all outline-none shadow-[inset_0_2px_4px_rgba(255,255,255,0.8)]"
                                        />
                                    </div>

                                    {/* Durations */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1.5 pl-1">Duration (Min)</label>
                                            <input
                                                type="number" min="1" required
                                                value={scheduleData.durationMinutes}
                                                onChange={(e) => setScheduleData({ ...scheduleData, durationMinutes: e.target.value })}
                                                className="w-full px-4 py-3.5 bg-white/60 backdrop-blur-sm border border-white/60 rounded-2xl text-xs font-bold text-gray-800 focus:ring-2 focus:ring-indigo-500 transition-all outline-none shadow-[inset_0_2px_4px_rgba(255,255,255,0.8)]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1.5 pl-1">Entry Window</label>
                                            <input
                                                type="number" min="1" required
                                                value={scheduleData.windowMinutes || 60}
                                                onChange={(e) => setScheduleData({ ...scheduleData, windowMinutes: e.target.value })}
                                                className="w-full px-4 py-3.5 bg-white/60 backdrop-blur-sm border border-white/60 rounded-2xl text-xs font-bold text-gray-800 focus:ring-2 focus:ring-indigo-500 transition-all outline-none shadow-[inset_0_2px_4px_rgba(255,255,255,0.8)]"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider pl-1 leading-relaxed border-l-2 border-indigo-200 ml-2 py-1">Window determines how late they can join. Duration remains fixed.</p>
                                </div>

                                <hr className="border-white/50" />

                                {/* Preferences Panel */}
                                <div className="space-y-4 flex-1">
                                    <div className="flex items-center justify-between p-4 bg-white/40 rounded-2xl border border-white/60 shadow-[inset_0_1px_3px_rgba(255,255,255,0.8)]">
                                        <div>
                                            <p className="text-xs font-black text-gray-800 uppercase tracking-wider">Instant Disclosure</p>
                                            <p className="text-[9px] text-gray-500 font-bold tracking-widest uppercase mt-0.5">Reveal Score After Submit</p>
                                        </div>
                                        <button 
                                            type="button"
                                            onClick={() => setShowResults(!showResults)}
                                            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer shadow-inner border border-white/40 ${showResults ? 'bg-green-500' : 'bg-gray-300'}`}
                                        >
                                            <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-md ${showResults ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>

                                    <div>
                                        <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1.5 pl-1 flex items-center gap-1"><ShieldCheck size={12}/> Access PIN (Optional)</label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. PARIXA2026"
                                            value={examPassword}
                                            onChange={(e) => setExamPassword(e.target.value)}
                                            className="w-full px-4 py-3.5 bg-white/60 backdrop-blur-sm border border-white/60 rounded-2xl text-xs font-black text-indigo-900 focus:ring-2 focus:ring-indigo-500 transition-all outline-none shadow-[inset_0_2px_4px_rgba(255,255,255,0.8)] placeholder:text-gray-400 placeholder:font-medium tracking-widest"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 mt-auto w-full">
                                    <button 
                                        type="submit" 
                                        disabled={!selectedExamId || selectedStudents.length === 0 || isScheduling}
                                        className={`w-full h-14 rounded-full font-black tracking-widest text-[10px] sm:text-xs uppercase shadow-lg transition-all flex items-center justify-center gap-2 ${
                                            (!selectedExamId || selectedStudents.length === 0) 
                                            ? 'bg-white/50 text-gray-400 shadow-none border border-white/60 cursor-not-allowed' 
                                            : 'text-white hover:-translate-y-0.5 active:translate-y-0 bg-gradient-to-r from-[#FF8E75] to-[#FF5E8E] hover:shadow-[0_8px_20px_rgba(255,94,142,0.3)]'
                                        }`}
                                    >
                                        {isScheduling ? 'Initializing Links...' : 'Confirm & Dispatch'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScheduleExam;
