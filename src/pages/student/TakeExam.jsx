import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, CheckCircle2, AlertCircle, Save, ArrowRight, ArrowLeft, Flag } from 'lucide-react';
import Button from '../../components/common/Button';
import api from '../../services/api';

const TakeExam = () => {
    const { examId } = useParams();
    const navigate = useNavigate();
    
    // States
    const [exam, setExam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [answers, setAnswers] = useState({}); // { questionId: selectedOptionIndex }
    const [timeLeft, setTimeLeft] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [scoreResult, setScoreResult] = useState(null);
    
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [isStarted, setIsStarted] = useState(false);
    const [inputPassword, setInputPassword] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [flagged, setFlagged] = useState({});

    const toggleFlag = (id) => {
        setFlagged(prev => ({ ...prev, [id]: !prev[id] }));
    };
    
    // Anti-cheat: Track tab switches
    const tabSwitchCount = useRef(0);

    const requestFullScreenAndCamera = async () => {
        if (exam?.isPasswordProtected && !isVerified) {
            alert("Examination PIN is required to unlock this assessment.");
            return;
        }

        try {
            // Request Full Screen first while the click's "user activation" is active
            const doc = document.documentElement;
            if (doc.requestFullscreen) {
                await doc.requestFullscreen();
            }
            
            // Request Camera access second
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            
            setIsStarted(true);
        } catch (err) {
            // Exit fullscreen if camera access is denied
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(e => console.log(e));
            }
            alert("Camera access is MANDATORY for secure proctoring. Please enable it to proceed.");
            console.error(err);
        }
    };

    const captureProctorFrame = async () => {
        if (!videoRef.current || !canvasRef.current || !isStarted) return;
        
        try {
            const canvas = canvasRef.current;
            const video = videoRef.current;
            canvas.width = 640;
            canvas.height = 480;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            const base64 = canvas.toDataURL('image/jpeg', 0.6); // Lower quality for speed
            await api.post(`/exams/${examId}/proctor/scan`, { imageBase64: base64 });
            console.log("[AI Proctor] Snapshot analyzed successfully.");
        } catch (err) {
            console.warn("[AI Proctor] Frame analysis skipped:", err.message);
        }
    };

    const handleVerifyPIN = async () => {
        if (!inputPassword) return;
        setIsVerifying(true);
        try {
            await api.post(`/exams/${examId}/verify-password`, { password: inputPassword });
            setIsVerified(true);
        } catch (err) {
            alert(err.response?.data?.message || "Invalid Examination PIN.");
        } finally {
            setIsVerifying(false);
        }
    };

    useEffect(() => {
        const fetchExamData = async () => {
            try {
                const res = await api.get(`/exams/${examId}/questions/student`);
                setExam(res.data);
                
                // Student gets the FULL duration once they enter 
                // as long as they entered within the valid window (checked by backend)
                setTimeLeft(res.data.duration * 60);
                
                // Initialize answers state if needed
                const initialAnswers = {};
                res.data.questions.forEach(q => initialAnswers[q._id] = null);
                setAnswers(initialAnswers);
            } catch (err) {
                console.error("Failed to load exam", err);
                alert("Exam is not currently available for you.");
                navigate('/student/dashboard');
            } finally {
                setLoading(false);
            }
        };
        fetchExamData();

        // Anti-cheat detector
        const handleVisibilityChange = () => {
            if (document.hidden && isStarted) {
                console.warn("Fatal Tab switch detected!");
                alert("🛑 ZERO-TOLERANCE SECURITY VIOLATION: Switching tabs or exiting fullscreen is completely prohibited. Your exam has been voided and automatically submitted.");
                handleSubmit();
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        
        // Proctoring Timer: Scan every 2 minutes
        const proctorInterval = setInterval(() => {
            if (isStarted) captureProctorFrame();
        }, 120000); 

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            clearInterval(proctorInterval);
            // Stop camera stream
            if (videoRef.current && videoRef.current.srcObject) {
                const tracks = videoRef.current.srcObject.getTracks();
                tracks.forEach(t => t.stop());
            }
        };
    }, [examId, navigate, isStarted]);

    // Timer logic
    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0 || !!scoreResult || !isStarted) return;
        
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit(); // Auto-submit when time is up
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, scoreResult, isStarted]);

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + ':' : ''}${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
    };

    const handleSelectOption = (qId, optIdx) => {
        setAnswers({ ...answers, [qId]: optIdx });
    };

    const handleSubmit = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        
        try {
            // Prepare answers payload
            const resultData = Object.entries(answers).map(([qId, ans]) => ({
                questionId: qId,
                selectedOption: ans
            }));

            const res = await api.post(`/exams/${examId}/submit`, { answers: resultData });
            setScoreResult(res.data);
            
            // Exit fullscreen on completion
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(err => console.log(err));
            }

            // Stop camera stream
            if (videoRef.current && videoRef.current.srcObject) {
                const tracks = videoRef.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            }
        } catch (err) {
            console.error("Submission failure", err);
            alert("Submission failed. We will attempt auto-recovery.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600"></div></div>;

    if (!isStarted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-indigo-900 p-6 font-sans">
                <div className="max-w-xl w-full bg-white rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] p-12 text-center space-y-8 animate-in zoom-in duration-500">
                    <div className="bg-indigo-50 w-28 h-28 rounded-3xl flex items-center justify-center mx-auto shadow-inner rotate-3">
                        <Save className="text-indigo-600 -rotate-3" size={48} />
                    </div>
                    
                    <div className="space-y-2">
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-tight">{exam.title}</h1>
                        <p className="text-indigo-500 font-bold uppercase tracking-[0.2em] text-[10px]">Security Initialization Protocol</p>
                    </div>

                    {/* PIN Entry Area */}
                    {exam.isPasswordProtected && !isVerified && (
                        <div className="p-8 bg-gray-50 rounded-[32px] border border-gray-100 space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center justify-center gap-2 text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-2">
                                <AlertCircle size={14} /> Enter Examination PIN to Unlock
                            </div>
                            <div className="flex gap-3">
                                <input 
                                    type="password"
                                    placeholder="Enter Access PIN"
                                    value={inputPassword}
                                    onChange={(e) => setInputPassword(e.target.value)}
                                    className="flex-1 px-6 py-4 bg-white border-2 border-transparent focus:border-indigo-600 rounded-2xl text-center font-black tracking-[0.5em] text-xl shadow-sm transition-all outline-none placeholder:tracking-normal placeholder:text-gray-300 placeholder:font-bold placeholder:text-sm"
                                />
                                <Button 
                                    onClick={handleVerifyPIN} 
                                    isLoading={isVerifying}
                                    className="bg-indigo-600 h-16 w-16 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-100"
                                >
                                    <ArrowRight size={24} />
                                </Button>
                            </div>
                        </div>
                    )}

                    {isVerified && (
                        <div className="p-4 bg-green-50 text-green-700 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 animate-in fade-in duration-300">
                            <CheckCircle2 size={16} /> Identity Verified & Access Unlocked
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-left">
                        <div className="p-4 bg-red-50 rounded-2xl border border-red-50">
                            <p className="text-red-700 font-black text-[10px] uppercase tracking-wider mb-2">Proctoring</p>
                            <p className="text-xs text-red-600 font-bold leading-relaxed">Webcam enabled AI-Scan active throughout session.</p>
                        </div>
                        <div className="p-4 bg-orange-50 rounded-2xl border border-orange-50">
                            <p className="text-orange-700 font-black text-[10px] uppercase tracking-wider mb-2">Environment</p>
                            <p className="text-xs text-orange-600 font-bold leading-relaxed">Full Screen mandatory. Tab switching restricted.</p>
                        </div>
                    </div>

                    <Button 
                        fullWidth 
                        size="lg" 
                        onClick={requestFullScreenAndCamera} 
                        disabled={exam.isPasswordProtected && !isVerified}
                        className={`h-20 text-xl font-black rounded-3xl transition-all ${
                            (exam.isPasswordProtected && !isVerified) 
                            ? 'bg-gray-100 text-gray-300 cursor-not-allowed' 
                            : 'bg-indigo-600 text-white shadow-[0_20px_40px_-10px_rgba(79,70,229,0.3)] hover:scale-[1.02] active:scale-[0.98]'
                        }`}
                    >
                        START SECURE SESSION
                    </Button>
                </div>
            </div>
        );
    }

    if (scoreResult) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 text-center space-y-6 border border-gray-100 animate-in zoom-in duration-300">
                    <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="text-green-600" size={48} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Exam Complete!</h1>
                        <p className="text-gray-500 font-medium">Your answers have been securely recorded.</p>
                    </div>
                    
                    {scoreResult.showResults ? (
                        <div className="py-6 px-4 bg-indigo-50 rounded-2xl animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <p className="text-sm text-indigo-700 font-bold uppercase tracking-widest mb-1">Your Score</p>
                            <div className="text-5xl font-black text-indigo-900">
                                {scoreResult.score} <span className="text-2xl text-indigo-400 font-medium">/ {scoreResult.totalQuestions}</span>
                            </div>
                            <p className="mt-2 text-indigo-600 font-bold">{scoreResult.percentage}% Accuracy</p>
                        </div>
                    ) : (
                        <div className="py-8 px-6 bg-gray-50 rounded-2xl border border-gray-100 italic text-gray-500 text-sm">
                            Results are hidden by the educator. You will be notified once they are published.
                        </div>
                    )}

                    <Button fullWidth size="lg" onClick={() => navigate('/student/dashboard')} className="bg-indigo-600 shadow-xl shadow-indigo-100">Return to Dashboard</Button>
                </div>
            </div>
        );
    }

    const currentQ = exam.questions[currentQuestionIdx];
    const progress = ((currentQuestionIdx + 1) / exam.questions.length) * 100;

    return (
        <div 
            className="min-h-screen bg-gray-50 flex flex-col select-none" 
            onContextMenu={(e) => e.preventDefault()}
        >
            {/* Background Proctoring Elements */}
            <video ref={videoRef} autoPlay playsInline muted className="hidden" />
            <canvas ref={canvasRef} className="hidden" />

            {/* Exam Header */}
            <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="bg-indigo-100 p-2 rounded-lg text-indigo-700 font-bold shadow-inner">ParixaAI</div>
                    <div className="hidden md:block text-left">
                        <h1 className="text-lg font-bold text-gray-900 leading-none">{exam.title}</h1>
                        <span className="text-[10px] text-red-500 font-bold tracking-widest uppercase">Secure AI Monitoring Active</span>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {/* Tiny Webcam Monitor */}
                    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Live Feed</span>
                    </div>

                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-mono font-bold text-lg shadow-inner ${timeLeft < 300 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-700'}`}>
                        <Clock size={20} />
                        {formatTime(timeLeft)}
                    </div>

                    <Button onClick={handleSubmit} isLoading={isSubmitting} variant="primary" className="bg-indigo-600 px-6">
                        Finish
                    </Button>
                </div>
            </header>

            {/* Progress Bar */}
            <div className="h-1.5 bg-gray-200 w-full overflow-hidden">
                <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>

            <main className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Navigation Sidebar */}
                <aside className="lg:col-span-1 hidden lg:block">
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 sticky top-24 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Question Map</h3>
                        <div className="grid grid-cols-4 gap-2">
                            {exam.questions.map((q, idx) => (
                                <button
                                    key={q._id}
                                    onClick={() => setCurrentQuestionIdx(idx)}
                                    className={`relative w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all border-2 ${
                                        currentQuestionIdx === idx ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' : 
                                        answers[q._id] !== null ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 
                                        flagged[q._id] ? 'bg-amber-50 text-amber-700 border-amber-300' :
                                        'bg-white text-gray-400 border-gray-100 hover:border-indigo-300'
                                    }`}
                                >
                                    {idx + 1}
                                    {flagged[q._id] && <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-white" />}
                                </button>
                            ))}
                        </div>

                        {tabSwitchCount.current > 0 && (
                            <div className="mt-6 p-4 bg-red-50 rounded-xl border border-red-100">
                                <p className="text-[10px] font-bold text-red-700 uppercase mb-1">Security Health</p>
                                <p className="text-xs font-bold text-red-900">Violations: {tabSwitchCount.current}/3</p>
                                <p className="text-[9px] text-red-500 mt-1 leading-tight">Strict monitoring active. Do not minimize.</p>
                            </div>
                        )}
                    </div>
                </aside>

                {/* Question Area */}
                <section className="lg:col-span-3 space-y-6">
                    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8 md:p-12 min-h-[400px] flex flex-col justify-center animate-in slide-in-from-right-4 duration-300">
                        <div className="mb-8 text-left">
                            <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold mb-4 uppercase tracking-tighter">QUESTION {currentQuestionIdx + 1} OF {exam.questions.length}</span>
                            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-snug">{currentQ.text}</h2>
                        </div>

                        <div className="space-y-4">
                            {currentQ.options.map((option, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSelectOption(currentQ._id, idx)}
                                    className={`w-full p-5 text-left rounded-2xl border-2 transition-all flex items-center justify-between group ${
                                        answers[currentQ._id] === idx ? 'bg-indigo-50 border-indigo-600' : 'bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm ${
                                            answers[currentQ._id] === idx ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-400 border-gray-200 group-hover:text-indigo-500'
                                        }`}>
                                            {String.fromCharCode(65 + idx)}
                                        </div>
                                        <span className={`font-semibold ${answers[currentQ._id] === idx ? 'text-indigo-900' : 'text-gray-600'}`}>{option}</span>
                                    </div>
                                    {answers[currentQ._id] === idx && (
                                        <div className="bg-indigo-600 rounded-full p-1"><CheckCircle2 className="text-white" size={16} /></div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between gap-4">
                        <Button
                            variant="secondary"
                            disabled={currentQuestionIdx === 0}
                            onClick={() => setCurrentQuestionIdx(prev => prev - 1)}
                            className="bg-white border-gray-200 shadow-sm rounded-2xl px-6"
                        >
                            <ArrowLeft className="mr-2" size={18} /> Previous
                        </Button>

                        <button 
                            onClick={() => toggleFlag(currentQ._id)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${
                                flagged[currentQ._id] 
                                ? 'bg-amber-100 text-amber-700 border-2 border-amber-300 shadow-inner' 
                                : 'bg-gray-100 text-gray-500 border-2 border-transparent hover:bg-gray-200'
                            }`}
                        >
                            <Flag size={18} fill={flagged[currentQ._id] ? "currentColor" : "none"} /> 
                            {flagged[currentQ._id] ? 'Flagged' : 'Flag for Review'}
                        </button>
                        
                        {currentQuestionIdx === exam.questions.length - 1 ? (
                            <Button onClick={handleSubmit} isLoading={isSubmitting} className="bg-green-600 hover:bg-green-700 shadow-xl shadow-green-100 px-8 rounded-2xl">
                                Submit Exam <Save className="ml-2" size={18} />
                            </Button>
                        ) : (
                            <Button
                                onClick={() => setCurrentQuestionIdx(prev => prev + 1)}
                                className="bg-indigo-600 shadow-xl shadow-indigo-100 px-8 rounded-2xl"
                            >
                                Next <ArrowRight className="ml-2" size={18} />
                            </Button>
                        )}
                    </div>
                </section>
            </main>

            {/* Mobile Footer Map Toggle */}
            <div className="lg:hidden p-4 bg-white border-t border-gray-100 flex justify-center">
                <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Parixa Secure AI Session</span>
            </div>
        </div>
    );
};

export default TakeExam;
