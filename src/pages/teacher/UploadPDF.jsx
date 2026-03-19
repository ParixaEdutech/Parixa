import React, { useState, useRef } from 'react';
import { Upload, File, CheckCircle2, AlertCircle, X, Sparkles, Save, AlignLeft } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import Button from '../../components/common/Button';
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

    const totalPerSet = parseInt(easyCount) + parseInt(mediumCount) + parseInt(hardCount);
    const totalQuestions = totalPerSet * numSets;

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        setError('');
        if (selectedFile) {
            if (selectedFile.type !== 'application/pdf') {
                setError('Please upload a valid PDF file.');
                setFile(null);
                return;
            }
            if (selectedFile.size > 5 * 1024 * 1024) {
                setError('File size exceeds 5MB limit.');
                setFile(null);
                return;
            }
            setFile(selectedFile);
        }
    };

    const handleGenerate = async () => {
        if (!file) {
            alert("Upload a PDF file first!");
            return;
        }

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
            q.isReserve && 
            q.setNumber === questionToSwap.setNumber && 
            q.difficulty === questionToSwap.difficulty
        );
        if (reserveIndex === -1) {
            alert('No more reserve questions available for this difficulty level in this Set!');
            return;
        }
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
            await api.post(`/exams/${examId}/questions`, {
                questions: activeQuestionsToSave
            });
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
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Extract with ParixaAI (PDF Bank)</h1>
                <p className="text-gray-600 mb-6">Upload a PDF question bank or exam paper. ParixaAI will extract, solve, and categorize the questions automatically into Sets.</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-4">
                        <div
                            className={`border-2 border-dashed rounded-lg p-10 text-center ${error ? 'border-red-300 bg-red-50' : file ? 'border-indigo-300 bg-indigo-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'} transition-colors cursor-pointer`}
                            onClick={() => !file && fileInputRef.current?.click()}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept=".pdf"
                            />

                            {file ? (
                                <div className="flex flex-col items-center">
                                    <File className="h-12 w-12 text-indigo-500 mb-3" />
                                    <p className="text-lg font-medium text-gray-900">{file.name}</p>
                                    <p className="text-sm text-gray-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>

                                    <div className="mt-4 flex space-x-3">
                                        <Button onClick={(e) => { e.stopPropagation(); setFile(null); setGeneratedQuestions([]); }} variant="secondary" size="sm">
                                            Remove
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <Upload className="h-12 w-12 text-gray-400 mb-3" />
                                    <p className="text-lg font-medium text-gray-900">Click to upload PDF Question Bank</p>
                                    <p className="text-sm text-gray-500 mt-1">PDF format up to 5MB</p>
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="flex items-center text-red-600 text-sm bg-red-50 p-3 rounded">
                                <AlertCircle size={16} className="mr-2" />
                                {error}
                            </div>
                        )}
                    </div>

                    <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                            <AlignLeft size={16} className="mr-2 text-indigo-500" /> Output Configuration
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Target Sets</label>
                                <input type="number" min="1" max="10" value={numSets} onChange={(e) => setNumSets(e.target.value)} className="w-full rounded border-gray-300 text-sm p-2" />
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="block text-xs font-medium text-green-700 mb-1">Easy</label>
                                    <input type="number" min="0" value={easyCount} onChange={e => setEasyCount(e.target.value)} className="w-full rounded border-green-300 text-sm p-1 bg-green-50" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-yellow-700 mb-1">Medium</label>
                                    <input type="number" min="0" value={mediumCount} onChange={e => setMediumCount(e.target.value)} className="w-full rounded border-yellow-300 text-sm p-1 bg-yellow-50" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-red-700 mb-1">Hard</label>
                                    <input type="number" min="0" value={hardCount} onChange={e => setHardCount(e.target.value)} className="w-full rounded border-red-300 text-sm p-1 bg-red-50" />
                                </div>
                            </div>
                            
                            <div className="pt-3 border-t">
                                <div className="flex justify-between text-sm mb-4">
                                    <span className="font-medium text-gray-600">Total Set Size:</span>
                                    <span className="font-bold">{totalPerSet} Qs</span>
                                </div>
                                <div className="flex justify-between text-sm mb-4">
                                    <span className="font-medium text-gray-600">Total Extraction Target:</span>
                                    <span className="font-bold">{totalQuestions} Qs</span>
                                </div>
                            </div>

                            <Button fullWidth onClick={handleGenerate} className="flex items-center justify-center font-bold" isLoading={isGenerating} disabled={!file}>
                                {!isGenerating && <Sparkles size={18} className="mr-2" />}
                                Extract & Solve (ParixaAI)
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {generatedQuestions.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-4 mb-6">
                        <h2 className="text-xl font-bold flex items-center mb-4 md:mb-0">
                            <Sparkles className="text-indigo-500 mr-2" size={24} />
                            Extracted Questions
                        </h2>
                        
                        <div className="flex flex-wrap gap-2">
                            {[...Array(parseInt(numSets))].map((_, i) => (
                                <button key={i} onClick={() => setActiveSetTab(i + 1)} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors shadow-sm ${ activeSetTab === i + 1 ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50' }`}>
                                    Set {i + 1}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-6">
                        {generatedQuestions.filter(q => q.setNumber === activeSetTab && !q.isReserve).map((q, localIndex) => {
                            const hasReserve = generatedQuestions.some(resQ => resQ.isReserve && resQ.setNumber === activeSetTab && resQ.difficulty === q.difficulty);
                            return (
                                <div key={q.id} className="p-5 rounded-lg border border-gray-200 hover:border-indigo-300 transition-shadow shadow-sm bg-white relative">
                                    <div className="flex justify-between mb-3 border-b border-gray-100 pb-3">
                                        <div className="font-medium text-gray-900 flex gap-2 items-center pr-16 text-lg">
                                            <span className="text-gray-500 font-bold">{localIndex + 1}.</span> {q.text}
                                        </div>
                                        <div className="flex items-start gap-2 flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded flex items-center h-fit uppercase tracking-wider ${q.difficulty === 'hard' ? 'bg-red-100 text-red-800' : q.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800' }`}>
                                                    {q.difficulty}
                                                </span>
                                            </div>
                                            <button onClick={() => handleSwapQuestion(q)} disabled={!hasReserve} className={`text-xs px-2 py-1 rounded border transition-colors flex items-center gap-1 ${ hasReserve ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' : 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed' }`}>
                                                ♻️ Swap {hasReserve ? '(Available)' : '(Empty)'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-6">
                                        {q.options.map((opt, i) => (
                                            <div key={i} className={`p-3 rounded border text-sm ${i === q.correctAnswer ? 'bg-green-50 border-green-300 text-green-900 font-medium' : 'bg-gray-50 border-gray-200 text-gray-700' }`}>
                                                <span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span> {opt}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-8 flex justify-center space-x-4">
                        <Button className="px-8" variant="secondary" onClick={() => setGeneratedQuestions([])} disabled={isSaving}>Discard All Sets</Button>
                        <Button className="px-8 flex items-center bg-indigo-600 hover:bg-indigo-700" onClick={handleSaveExam} isLoading={isSaving}>
                            <Save size={18} className="mr-2" /> Save All Sets to Database
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UploadPDF;
