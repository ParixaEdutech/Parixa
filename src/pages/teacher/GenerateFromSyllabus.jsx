import React, { useState } from 'react';
import { Sparkles, Save, LayoutGrid, CheckCircle2, RotateCcw, Award } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api'; 
import { aiServiceFrontend } from '../../services/aiServiceFrontend';

const GenerateFromSyllabus = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const examId = searchParams.get('examId');

    const [syllabus, setSyllabus] = useState('');
    const [topic, setTopic] = useState('Syllabus Material');
    
    const [numSets, setNumSets] = useState(3);
    const [easyCount, setEasyCount] = useState(3);
    const [mediumCount, setMediumCount] = useState(4);
    const [hardCount, setHardCount] = useState(3);
    
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [generatedQuestions, setGeneratedQuestions] = useState([]);
    const [activeSetTab, setActiveSetTab] = useState(1);

    const totalPerSet = parseInt(easyCount || 0) + parseInt(mediumCount || 0) + parseInt(hardCount || 0);
    const totalQuestions = totalPerSet * (numSets || 0);

    const handleGenerate = async () => {
        if (!syllabus || !topic) return;
        setIsGenerating(true);
        try {
            const data = await aiServiceFrontend.generateFromText({
                text: syllabus, topic: topic, numSets: parseInt(numSets),
                easyCount: parseInt(easyCount), mediumCount: parseInt(mediumCount), hardCount: parseInt(hardCount)
            });
            setGeneratedQuestions(data);
            setActiveSetTab(1);
        } catch (error) {
            console.error("AI Generation Failed:", error);
            alert(error.response?.data?.message || "Failed to generate AI questions. Are you rate limited?");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSwapQuestion = (questionToSwap) => {
        const reserveIndex = generatedQuestions.findIndex(q => 
            q.isReserve && q.setNumber === questionToSwap.setNumber && q.difficulty === questionToSwap.difficulty
        );
        if (reserveIndex === -1) return alert('No more reserve questions available for this difficulty level in this Set!');

        const newQuestions = [...generatedQuestions];
        const activeIndex = newQuestions.findIndex(q => q.id === questionToSwap.id);
        
        newQuestions[activeIndex].isReserve = true;
        newQuestions[reserveIndex].isReserve = false;
        setGeneratedQuestions(newQuestions);
    };

    const handleSaveExam = async () => {
        if (!examId) {
            alert('Missing Exam ID Context. Please start from the Create Exam page.');
            navigate('/teacher/exam/create');
            return;
        }
        setIsSaving(true);
        try {
            const activeQuestionsToSave = generatedQuestions.filter(q => !q.isReserve);
            await api.post(`/exams/${examId}/questions`, { questions: activeQuestionsToSave });
            alert('Successfully built Exam and safely saved all Question Sets to Database!');
            navigate('/teacher/dashboard');
        } catch (error) {
            console.error('Failed to save exam:', error);
            alert('Failed to save the exam generated questions to database.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="pb-12">
            <div className="p-4 sm:p-8 space-y-8 flex-1 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col gap-2 px-2 sm:px-4">
                    <h1 className="text-3xl sm:text-4xl font-black text-gray-800 tracking-tight flex items-center gap-3">
                        <Sparkles className="text-purple-600" size={32} /> ParixaAI <span className="text-gray-400 font-medium text-2xl">/ Syllabus Gen</span>
                    </h1>
                    <p className="text-sm font-medium text-gray-500">Inject raw curriculum text to auto-generate balanced evaluation sets.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left: Content Input */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-[#DDE2EA] rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-[inset_0_2px_10px_rgba(255,255,255,0.9),0_10px_30px_rgba(0,0,0,0.05)] relative overflow-hidden group">
                            <div className="absolute -left-10 -top-10 w-48 h-48 bg-white/30 rounded-full filter blur-xl group-hover:bg-white/50 transition-all"></div>
                            
                            <div className="relative z-10 flex flex-col h-full space-y-4">
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Syllabus / Notes Payload</label>
                                <textarea
                                    value={syllabus}
                                    onChange={(e) => setSyllabus(e.target.value)}
                                    rows={14}
                                    placeholder="Paste the syllabus sections, textbook excerpts, or lecture notes here (minimum 20 characters)..."
                                    className="w-full px-5 py-4 bg-white/60 backdrop-blur-sm border border-white/60 rounded-3xl text-sm font-medium text-gray-800 focus:ring-2 focus:ring-purple-500 transition-all outline-none placeholder:text-gray-400 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8)] resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right: Settings panel */}
                    <div className="lg:col-span-1">
                        <div className="bg-[#EBEBEF] rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-[inset_0_2px_10px_rgba(255,255,255,0.9),0_10px_30px_rgba(0,0,0,0.05)] border border-white/40 flex flex-col h-full">
                            <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-6 px-1 flex items-center gap-2"><LayoutGrid size={16}/> Build Parameters</h3>
                            
                            <div className="space-y-6 flex-1">
                                <div>
                                    <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1.5 pl-1">Number of Sets</label>
                                    <input
                                        type="number" min="1" max="10"
                                        value={numSets}
                                        onChange={(e) => setNumSets(e.target.value)}
                                        className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border border-white/60 rounded-2xl text-xs font-bold text-gray-800 focus:ring-2 focus:ring-purple-500 transition-all outline-none shadow-[inset_0_2px_4px_rgba(255,255,255,0.8)] text-center"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 pl-1">Questions Per Set</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <span className="block text-[8px] text-green-600 font-black uppercase tracking-wider text-center mb-1">Easy</span>
                                            <input type="number" min="0" value={easyCount} onChange={(e) => setEasyCount(e.target.value)}
                                                className="w-full px-2 py-3 bg-green-50/50 backdrop-blur-sm border border-green-200 rounded-xl text-xs font-bold text-green-900 focus:ring-2 focus:ring-green-400 transition-all outline-none shadow-inner text-center" />
                                        </div>
                                        <div>
                                            <span className="block text-[8px] text-yellow-600 font-black uppercase tracking-wider text-center mb-1">Med</span>
                                            <input type="number" min="0" value={mediumCount} onChange={(e) => setMediumCount(e.target.value)}
                                                className="w-full px-2 py-3 bg-yellow-50/50 backdrop-blur-sm border border-yellow-200 rounded-xl text-xs font-bold text-yellow-900 focus:ring-2 focus:ring-yellow-400 transition-all outline-none shadow-inner text-center" />
                                        </div>
                                        <div>
                                            <span className="block text-[8px] text-red-600 font-black uppercase tracking-wider text-center mb-1">Hard</span>
                                            <input type="number" min="0" value={hardCount} onChange={(e) => setHardCount(e.target.value)}
                                                className="w-full px-2 py-3 bg-red-50/50 backdrop-blur-sm border border-red-200 rounded-xl text-xs font-bold text-red-900 focus:ring-2 focus:ring-red-400 transition-all outline-none shadow-inner text-center" />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white/40 p-4 rounded-2xl border border-white shadow-sm flex justify-between items-center">
                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Total Yield</span>
                                    <span className="text-sm font-black text-indigo-700">{totalQuestions} Qs</span>
                                </div>
                            </div>
                            
                            <div className="pt-6 mt-auto">
                                <button 
                                    onClick={handleGenerate}
                                    disabled={!syllabus || syllabus.length < 20 || isGenerating}
                                    className={`w-full h-14 rounded-full font-black tracking-widest text-[10px] sm:text-[11px] uppercase shadow-lg transition-all flex items-center justify-center gap-2 ${
                                        (!syllabus || syllabus.length < 20) 
                                        ? 'bg-white/50 text-gray-400 shadow-none border border-white/60 cursor-not-allowed' 
                                        : 'text-white hover:-translate-y-0.5 active:translate-y-0 bg-gradient-to-r from-purple-500 to-indigo-600 hover:shadow-[0_8px_20px_rgba(124,58,237,0.3)]'
                                    }`}
                                >
                                    {isGenerating ? <><Sparkles className="animate-spin" size={16}/> Extracting...</> : <><Sparkles size={16}/> Run AI Engine</>}
                                </button>
                                {syllabus && syllabus.length < 20 && syllabus.length > 0 &&(
                                    <p className="mt-2 text-[9px] text-red-500 font-bold uppercase tracking-wider text-center">Payload too short</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Generated Results Panel */}
                {generatedQuestions.length > 0 && (
                    <div className="bg-[#EBEBEF] rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-[inset_0_2px_10px_rgba(255,255,255,0.9),0_10px_30px_rgba(0,0,0,0.05)] border border-white/40 mt-8 animate-in slide-in-from-bottom-8 duration-500">
                        
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/50 pb-6 mb-8 gap-4">
                            <h2 className="text-xl font-black text-gray-800 flex items-center gap-3">
                                <Award className="text-indigo-500" size={24} />
                                Intelligence Extracted
                            </h2>
                            
                            <div className="flex flex-wrap gap-2 bg-white/40 p-2 rounded-2xl border border-white/60 shadow-[inset_0_1px_3px_rgba(255,255,255,0.5)]">
                                {[...Array(parseInt(numSets))].map((_, i) => (
                                    <button 
                                        key={i} 
                                        onClick={() => setActiveSetTab(i + 1)}
                                        className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                                            activeSetTab === i + 1 
                                            ? 'bg-indigo-600 text-white shadow-md' 
                                            : 'bg-transparent text-gray-500 hover:text-gray-800 hover:bg-white/60'
                                        }`}
                                    >
                                        Set {i + 1}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-6">
                            {generatedQuestions.filter(q => q.setNumber === activeSetTab && !q.isReserve).map((q, localIndex) => {
                                const hasReserve = generatedQuestions.some(resQ => resQ.isReserve && resQ.setNumber === activeSetTab && resQ.difficulty === q.difficulty);
                                return (
                                    <div key={q.id} className="p-6 rounded-3xl bg-white/60 border border-white shadow-sm hover:bg-white transition-colors relative group">
                                        
                                        <div className="flex flex-col sm:flex-row justify-between mb-4 gap-4 items-start pb-4 border-b border-gray-100">
                                            <div className="font-bold text-gray-900 text-base sm:text-lg leading-tight flex-1">
                                                <span className="text-indigo-400 font-black mr-2">{localIndex + 1}.</span> {q.text}
                                            </div>
                                            
                                            <div className="flex items-center gap-3 shrink-0">
                                                <span className={`px-3 py-1 text-[9px] font-black rounded-lg uppercase tracking-widest shadow-sm border ${
                                                    q.difficulty === 'hard' ? 'bg-red-50 text-red-700 border-red-200' :
                                                    q.difficulty === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                    'bg-green-50 text-green-700 border-green-200'
                                                }`}>
                                                    {q.difficulty}
                                                </span>
                                                <button 
                                                    onClick={() => handleSwapQuestion(q)}
                                                    disabled={!hasReserve}
                                                    className={`text-[9px] px-3 py-1 font-black rounded-lg uppercase tracking-widest border transition-colors flex items-center gap-1.5 shadow-sm ${
                                                        hasReserve 
                                                        ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:shadow-md' 
                                                        : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed hidden'
                                                    }`}
                                                >
                                                    <RotateCcw size={12}/> Swap Res
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-0 sm:pl-8">
                                            {q.options.map((opt, i) => {
                                                const isCorrect = i === q.correctAnswer;
                                                return(
                                                    <div key={i} className={`p-4 rounded-xl border text-sm font-medium transition-all ${
                                                        isCorrect 
                                                        ? 'bg-green-50/80 border-green-300 text-green-900 shadow-[inset_0_2px_4px_rgba(255,255,255,0.6)]' 
                                                        : 'bg-white border-gray-100 text-gray-600 shadow-sm opacity-80'
                                                    }`}>
                                                        <span className={`font-black mr-2 ${isCorrect ? 'text-green-600' : 'text-gray-300'}`}>{String.fromCharCode(65 + i)}.</span> {opt}
                                                        {isCorrect && <CheckCircle2 size={14} className="inline-block ml-2 text-green-500 mb-0.5" />}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
                            <button 
                                onClick={() => setGeneratedQuestions([])} 
                                disabled={isSaving}
                                className="px-8 py-4 rounded-full bg-white/80 hover:bg-white text-[10px] font-black text-gray-600 uppercase tracking-widest transition-all shadow-sm border border-gray-200"
                            >
                                Discard Cache
                            </button>
                            <button 
                                onClick={handleSaveExam} 
                                disabled={isSaving}
                                className="px-8 py-4 rounded-full font-black tracking-widest text-[10px] text-white shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0 bg-gradient-to-r from-[#FF8E75] to-[#FF5E8E] hover:shadow-[0_8px_20px_rgba(255,94,142,0.3)] uppercase flex items-center justify-center gap-2"
                            >
                                {isSaving ? 'Committing...' : <><Save size={16}/> Commit All To Database</>}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GenerateFromSyllabus;
