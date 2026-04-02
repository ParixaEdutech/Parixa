import React, { useState } from 'react';
import { Sparkles, Save, FileText, ArrowRight, BookOpen, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const CreateExam = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        subject: ''
    });
    const [isCreating, setIsCreating] = useState(false);

    const handleCreateAndNavigate = async (destinationPath) => {
        if (!formData.title || !formData.subject) {
            alert('Please fill out the Exam Title and Subject first.');
            return;
        }

        setIsCreating(true);
        try {
            const examRes = await api.post('/exams/create', {
                title: formData.title,
                description: formData.description,
                subject: formData.subject,
                startTime: new Date(Date.now() + 86400000), 
                durationMinutes: 60
            });
            
            const newExamId = examRes.data._id;
            navigate(`${destinationPath}?examId=${newExamId}`);
        } catch (error) {
            console.error('Failed to create exam shell:', error);
            alert('Failed to establish exam shell. Please try again.');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="pb-12">
            <div className="p-4 sm:p-8 space-y-8 flex-1 max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col gap-2 px-2 sm:px-4">
                    <h1 className="text-3xl sm:text-4xl font-black text-gray-800 tracking-tight">Create Blueprint</h1>
                    <p className="text-sm font-medium text-gray-500">Initialize a new assessment shell and select its intelligence source.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                    
                    {/* Left side form */}
                    <div className="bg-[#DDE2EA] rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-[inset_0_2px_10px_rgba(255,255,255,0.9),0_10px_30px_rgba(0,0,0,0.05)] relative overflow-hidden group">
                        <div className="absolute -left-10 -top-10 w-48 h-48 bg-white/30 rounded-full filter blur-xl group-hover:bg-white/50 transition-all"></div>
                        
                        <div className="relative z-10 flex flex-col h-full space-y-6">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-200 shadow-inner flex items-center justify-center text-indigo-700 font-bold border border-white/60 shrink-0">
                                    <BookOpen size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-gray-800 uppercase tracking-wide">Exam Metadata</h3>
                                </div>
                            </div>
                            
                            <div className="space-y-4 flex-1">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 pl-1">Assessment Title</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g., Final Year Programming Assessment"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border border-white/60 rounded-2xl text-sm font-bold text-gray-800 focus:ring-2 focus:ring-indigo-500 transition-all outline-none placeholder:text-gray-400 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8)]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 pl-1">Subject / Domain</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g., Computer Science"
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border border-white/60 rounded-2xl text-sm font-bold text-gray-800 focus:ring-2 focus:ring-indigo-500 transition-all outline-none placeholder:text-gray-400 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8)]"
                                    />
                                </div>
                                <div className="pt-2">
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 pl-1">Instructions (Optional)</label>
                                    <textarea 
                                        rows={4}
                                        placeholder="Any specific guidance for the candidates?"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border border-white/60 rounded-2xl text-sm font-bold text-gray-800 focus:ring-2 focus:ring-indigo-500 transition-all outline-none placeholder:text-gray-400 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8)] resize-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right side intelligence selector */}
                    <div className="bg-[#EBEBEF] rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-[inset_0_2px_10px_rgba(255,255,255,0.9),0_10px_30px_rgba(0,0,0,0.05)] border border-white/40 flex flex-col h-full justify-center space-y-8">
                        
                        <div className="text-center space-y-2">
                            <span className="bg-[#D1F16D] text-[#55670D] text-[10px] font-black px-3 py-1 rounded-md shadow-sm border border-white/50 tracking-widest uppercase">Select Engine</span>
                            <h3 className="text-xl sm:text-2xl font-black text-gray-800 tracking-tight">How will you build the payload?</h3>
                            <p className="text-xs text-gray-500 font-medium max-w-sm mx-auto">Choose an AI engine to automatically construct question matrices based on your source material.</p>
                        </div>
                        
                        <div className="space-y-4">
                            <button 
                                onClick={() => handleCreateAndNavigate('/teacher/upload-pdf')}
                                disabled={isCreating}
                                className="w-full flex items-center gap-4 sm:gap-6 p-4 rounded-[2rem] hover:bg-white/60 bg-white/40 transition-all border border-white shadow-[inset_0_2px_5px_rgba(255,255,255,0.8)] group text-left relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 shadow-inner flex items-center justify-center shrink-0 border border-white/60 group-hover:scale-105 transition-transform relative z-10">
                                    <FileText className="w-6 h-6 text-blue-700" />
                                </div>
                                <div className="flex-1 relative z-10">
                                    <h4 className="font-bold text-gray-800 mb-1 text-sm sm:text-base">ParixaAI (Upload PDF)</h4>
                                    <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium">Extract directly from textbooks, presentations, or documents.</p>
                                </div>
                                <div className="shrink-0 relative z-10 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center shadow-sm">
                                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transform group-hover:translate-x-0.5 transition-all" />
                                </div>
                            </button>

                            <button 
                                onClick={() => handleCreateAndNavigate('/teacher/generate-syllabus')}
                                disabled={isCreating}
                                className="w-full flex items-center gap-4 sm:gap-6 p-4 rounded-[2rem] hover:bg-white/60 bg-white/40 transition-all border border-white shadow-[inset_0_2px_5px_rgba(255,255,255,0.8)] group text-left relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-200 shadow-inner flex items-center justify-center shrink-0 border border-white/60 group-hover:scale-105 transition-transform relative z-10">
                                    <Sparkles className="w-6 h-6 text-purple-700" />
                                </div>
                                <div className="flex-1 relative z-10">
                                    <h4 className="font-bold text-gray-800 mb-1 text-sm sm:text-base">ParixaAI (Plain Text)</h4>
                                    <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium">Paste pure syllabus, curriculum goals, or web snippets.</p>
                                </div>
                                <div className="shrink-0 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center shadow-sm">
                                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transform group-hover:translate-x-0.5 transition-all" />
                                </div>
                            </button>
                        </div>
                        
                        {isCreating && (
                            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm rounded-[2.5rem] flex items-center justify-center z-20">
                                <div className="bg-white px-6 py-3 rounded-full shadow-lg border border-gray-100 flex items-center gap-3 font-bold text-sm text-indigo-900 animate-pulse">
                                    <Star className="animate-spin text-indigo-500" size={16} /> Initializing Matrix...
                                </div>
                            </div>
                        )}
                        
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateExam;
