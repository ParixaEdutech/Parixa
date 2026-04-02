import React, { useState, useRef } from 'react';
import { Upload, File, AlertCircle, Sparkles, Save, LayoutGrid, RotateCcw, Award, CheckCircle2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { aiServiceFrontend } from '../../services/aiServiceFrontend';

const UploadPDF = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const examId = searchParams.get('examId');

    const [file, setFile] = useState(null);
    const [topic, setTopic] = useState('PDF Question Bank');
    const fileInputRef = useRef(null);
    const [error, setError] = useState('');

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

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        setError('');
        if (selectedFile) {
            if (selectedFile.type !== 'application/pdf') {
                setError('Please upload a valid PDF file.');
                setFile(null); return;
            }
            if (selectedFile.size > 5 * 1024 * 1024) {
                setError('File size exceeds 5MB limit.');
                setFile(null); return;
            }
            setFile(selectedFile);
        }
    };

    const handleGenerate = async () => {
        if (!file) return alert("Upload a PDF file first!");
        setIsGenerating(true);
        try {
            const formData = new FormData();
            formData.append('document', file);
            formData.append('topic', topic);
            formData.append('numSets', numSets);
            formData.append('easyCount', easyCount);
            formData.append('mediumCount', mediumCount);
            formData.append('hardCount', hardCount);

            const data = await aiServiceFrontend.generateFromPDF(formData);
            setGeneratedQuestions(data);
            setActiveSetTab(1);
        } catch (error) {
            console.error("AI Generation Failed:", error);
            alert(error.response?.data?.message || "Failed to extract AI questions. Are you rate limited?");
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
            alert('Successfully built Exam and safely saved extracted Question Sets to Database!');
            navigate('/teacher/dashboard');
        } catch (error) {
            console.error('Failed to save exam:', error);
            alert('Failed to save the extracted questions to database.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="pb-12">
            <div className="p-4 sm:p-8 space-y-8 flex-1 max-w-7xl mx-auto">
                <div className="flex flex-col gap-2 px-2 sm:px-4">
                    <h1 className="text-3xl sm:text-4xl font-black text-gray-800 tracking-tight flex items-center gap-3">
                        <Sparkles className="text-blue-500" size={32} /> ParixaAI <span className="text-gray-400 font-medium text-2xl">/ Document OCR</span>
                    </h1>
                    <p className="text-sm font-medium text-gray-500">Upload PDF documents and ParixaAI will extract, translate, and solve questions to build your matrix.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left: Upload Area */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-[#DDE2EA] rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-[inset_0_2px_10px_rgba(255,255,255,0.9),0_10px_30px_rgba(0,0,0,0.05)] relative overflow-hidden group h-full flex flex-col">
                            <div className="absolute -left-10 -top-10 w-48 h-48 bg-white/30 rounded-full filter blur-xl transition-all"></div>
                            
                            <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-4 px-1 flex items-center gap-2 relative z-10">Data Source</h3>
                            
                            <div className="flex-1 flex flex-col items-center justify-center relative z-10 w-full min-h-[300px]">
                                <div
                                    className={`w-full h-full flex flex-col items-center justify-center border-4 border-dashed rounded-[2rem] p-10 text-center transition-all cursor-pointer ${
                                        error ? 'border-red-300 bg-red-50/50' 
                                        : file ? 'border-blue-400 bg-blue-50/50 shadow-[inset_0_0_20px_rgba(59,130,246,0.1)]' 
                                        : 'border-white/80 bg-white/30 hover:bg-white/50 hover:border-blue-300'
                                    }`}
                                    onClick={() => !file && fileInputRef.current?.click()}
                                >
                                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf" />

                                    {file ? (
                                        <div className="flex flex-col items-center animate-in zoom-in-95 duration-300">
                                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 shadow-inner flex items-center justify-center border border-white mb-4">
                                                <File className="h-10 w-10 text-blue-600" />
                                            </div>
                                            <p className="text-xl font-black text-gray-800 tracking-tight">{file.name}</p>
                                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>

                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setFile(null); setGeneratedQuestions([]); }} 
                                                className="mt-6 px-4 py-2 bg-white/80 rounded-full text-[9px] font-black text-gray-500 uppercase tracking-widest hover:text-red-500 hover:bg-white shadow-sm transition-all"
                                            >
                                                Discard File
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center opacity-70 group-hover:opacity-100 transition-opacity">
                                            <div className="w-20 h-20 rounded-2xl bg-white/60 shadow-inner flex items-center justify-center border border-white mb-4">
                                                <Upload className="h-10 w-10 text-gray-400" />
                                            </div>
                                            <p className="text-base font-black text-gray-700 tracking-tight">Click to inject PDF Blob</p>
                                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Requires standard PDF encoding (Max 5MB)</p>
                                        </div>
                                    )}
                                </div>
                                {error && (
                                    <div className="w-full mt-4 flex items-center justify-center text-red-600 text-[10px] font-black uppercase tracking-widest bg-red-50 p-3 rounded-xl border border-red-200 animate-pulse">
                                        <AlertCircle size={14} className="mr-2" /> {error}
                                    </div>
                                )}
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
                                    <input type="number" min="1" max="10" value={numSets} onChange={(e) => setNumSets(e.target.value)} className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border border-white/60 rounded-2xl text-xs font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 transition-all outline-none shadow-[inset_0_2px_4px_rgba(255,255,255,0.8)] text-center" />
                                </div>

                                <div>
                                    <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 pl-1">Target Extractions Per Set</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <span className="block text-[8px] text-green-600 font-black uppercase tracking-wider text-center mb-1">Easy</span>
                                            <input type="number" min="0" value={easyCount} onChange={e => setEasyCount(e.target.value)} className="w-full px-2 py-3 bg-green-50/50 backdrop-blur-sm border border-green-200 rounded-xl text-xs font-bold text-green-900 focus:ring-2 focus:ring-green-400 transition-all outline-none shadow-inner text-center" />
                                        </div>
                                        <div>
                                            <span className="block text-[8px] text-yellow-600 font-black uppercase tracking-wider text-center mb-1">Med</span>
                                            <input type="number" min="0" value={mediumCount} onChange={e => setMediumCount(e.target.value)} className="w-full px-2 py-3 bg-yellow-50/50 backdrop-blur-sm border border-yellow-200 rounded-xl text-xs font-bold text-yellow-900 focus:ring-2 focus:ring-yellow-400 transition-all outline-none shadow-inner text-center" />
                                        </div>
                                        <div>
                                            <span className="block text-[8px] text-red-600 font-black uppercase tracking-wider text-center mb-1">Hard</span>
                                            <input type="number" min="0" value={hardCount} onChange={e => setHardCount(e.target.value)} className="w-full px-2 py-3 bg-red-50/50 backdrop-blur-sm border border-red-200 rounded-xl text-xs font-bold text-red-900 focus:ring-2 focus:ring-red-400 transition-all outline-none shadow-inner text-center" />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white/40 p-4 rounded-2xl border border-white shadow-sm flex justify-between items-center">
                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Target OCR Yield</span>
                                    <span className="text-sm font-black text-blue-700">{totalQuestions} Qs</span>
                                </div>
                            </div>
                            
                            <div className="pt-6 mt-auto">
                                <button onClick={handleGenerate} disabled={!file || isGenerating} className={`w-full h-14 rounded-full font-black tracking-widest text-[10px] sm:text-[11px] uppercase shadow-lg transition-all flex items-center justify-center gap-2 ${ (!file) ? 'bg-white/50 text-gray-400 shadow-none border border-white/60 cursor-not-allowed' : 'text-white hover:-translate-y-0.5 active:translate-y-0 bg-gradient-to-r from-blue-500 to-indigo-600 hover:shadow-[0_8px_20px_rgba(59,130,246,0.3)]' }`}>
                                    {isGenerating ? <><Sparkles className="animate-spin" size={16}/> Scraping...</> : <><Sparkles size={16}/> Extract & Solve</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Generated Results Panel */}
                {generatedQuestions.length > 0 && (
                    <div className="bg-[#EBEBEF] rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-[inset_0_2px_10px_rgba(255,255,255,0.9),0_10px_30px_rgba(0,0,0,0.05)] border border-white/40 mt-8 animate-in slide-in-from-bottom-8 duration-500">
                        
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/50 pb-6 mb-8 gap-4">
                            <h2 className="text-xl font-black text-gray-800 flex items-center gap-3">
                                <Award className="text-blue-500" size={24} /> Document Extracted
                            </h2>
                            <div className="flex flex-wrap gap-2 bg-white/40 p-2 rounded-2xl border border-white/60 shadow-[inset_0_1px_3px_rgba(255,255,255,0.5)]">
                                {[...Array(parseInt(numSets))].map((_, i) => (
                                    <button key={i} onClick={() => setActiveSetTab(i + 1)} className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${ activeSetTab === i + 1 ? 'bg-blue-600 text-white shadow-md' : 'bg-transparent text-gray-500 hover:text-gray-800 hover:bg-white/60' }`}>
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
                                                <span className="text-blue-400 font-black mr-2">{localIndex + 1}.</span> {q.text}
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0">
                                                <span className={`px-3 py-1 text-[9px] font-black rounded-lg uppercase tracking-widest shadow-sm border ${ q.difficulty === 'hard' ? 'bg-red-50 text-red-700 border-red-200' : q.difficulty === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-green-50 text-green-700 border-green-200' }`}>{q.difficulty}</span>
                                                <button onClick={() => handleSwapQuestion(q)} disabled={!hasReserve} className={`text-[9px] px-3 py-1 font-black rounded-lg uppercase tracking-widest border transition-colors flex items-center gap-1.5 shadow-sm ${ hasReserve ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:shadow-md' : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed hidden' }`}><RotateCcw size={12}/> Swap Res</button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-0 sm:pl-8">
                                            {q.options.map((opt, i) => {
                                                const isCorrect = i === q.correctAnswer;
                                                return(
                                                    <div key={i} className={`p-4 rounded-xl border text-sm font-medium transition-all ${ isCorrect ? 'bg-green-50/80 border-green-300 text-green-900 shadow-[inset_0_2px_4px_rgba(255,255,255,0.6)]' : 'bg-white border-gray-100 text-gray-600 shadow-sm opacity-80' }`}>
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
                            <button onClick={() => setGeneratedQuestions([])} disabled={isSaving} className="px-8 py-4 rounded-full bg-white/80 hover:bg-white text-[10px] font-black text-gray-600 uppercase tracking-widest transition-all shadow-sm border border-gray-200">Discard OCR Cache</button>
                            <button onClick={handleSaveExam} disabled={isSaving} className="px-8 py-4 rounded-full font-black tracking-widest text-[10px] text-white shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0 bg-gradient-to-r from-[#FF8E75] to-[#FF5E8E] hover:shadow-[0_8px_20px_rgba(255,94,142,0.3)] uppercase flex items-center justify-center gap-2">
                                {isSaving ? 'Committing...' : <><Save size={16}/> Commit To Database</>}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UploadPDF;
