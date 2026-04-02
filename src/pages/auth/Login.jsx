import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import BackgroundCanvas from '../../components/auth/BackgroundCanvas';

const Login = () => {
    // Exact same state logic
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    // Exact same handlers
    const handleChange = (e) => {
        const { name, value } = e.target;
        setCredentials(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!credentials.email || !credentials.password) {
            setError('Please enter both email and password.');
            return;
        }

        setLoading(true);
        try {
            const userResult = await login(credentials);
            const targetUrl = userResult.role === 'admin'
                ? '/admin/dashboard'
                : userResult.role === 'teacher'
                    ? '/teacher/dashboard'
                    : '/student/dashboard';
            navigate(targetUrl);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative bg-transparent overflow-hidden selection:bg-teal-500/30 selection:text-white pb-10">
            {/* The WebGL Interactive Shader Background */}
            <BackgroundCanvas />

            <div className="relative z-10 w-full max-w-[420px] px-4 sm:px-0 flex flex-col items-center">

                {/* Glassmorphism Centered Card */}
                <div className="w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] p-8 sm:p-10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

                    <div className="relative z-10">
                        {/* Logo Area moved inside card */}
                        <div className="flex justify-center mb-6 transform transition-transform duration-500 hover:scale-105">
                            <img src="/logo_white_new.png" alt="Parixa Logo" className="h-[75px] w-auto object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]" />
                        </div>

                        <div className="text-center mb-10">
                            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2 drop-shadow-md">Welcome Back</h2>
                            <p className="text-sm font-medium text-gray-200 drop-shadow-md">Sign in to access your secure workspace</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <div className="p-4 text-sm font-medium text-red-100 bg-red-900/60 border border-red-400/50 rounded-xl backdrop-blur-md shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-1.5 focus-within:text-teal-300 text-gray-300 transition-colors duration-300">
                                <label className="block text-[10px] font-bold tracking-widest uppercase pl-1 drop-shadow-md">Email Address</label>
                                <div className="relative group/input">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-300 z-10">
                                        <Mail className="w-5 h-5 group-focus-within/input:text-teal-400 text-gray-400" />
                                    </div>
                                    <input
                                        type="email"
                                        name="email"
                                        value={credentials.email}
                                        onChange={handleChange}
                                        required
                                        placeholder="admin@parixa.com"
                                        className="w-full pl-12 pr-4 py-3.5 bg-black/30 backdrop-blur-md border border-white/20 text-white placeholder:text-gray-400 rounded-xl focus:bg-white/10 focus:border-teal-400/60 focus:ring-1 focus:ring-teal-400/60 transition-all outline-none text-sm shadow-inner"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5 focus-within:text-teal-300 text-gray-300 transition-colors duration-300 pt-1">
                                <label className="block text-[10px] font-bold tracking-widest uppercase pl-1 drop-shadow-md">Password</label>
                                <div className="relative group/input">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-300 z-10">
                                        <Lock className="w-5 h-5 group-focus-within/input:text-teal-400 text-gray-400" />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={credentials.password}
                                        onChange={handleChange}
                                        required
                                        placeholder="••••••••"
                                        className="w-full pl-12 pr-12 py-3.5 bg-black/30 backdrop-blur-md border border-white/20 text-white placeholder:text-gray-400 rounded-xl focus:bg-white/10 focus:border-teal-400/60 focus:ring-1 focus:ring-teal-400/60 transition-all outline-none text-sm shadow-inner"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-white transition-colors outline-none rounded-lg focus:ring-2 focus:ring-white/30 z-10"
                                    >
                                        {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <label className="flex items-center gap-2 cursor-pointer group/check">
                                    <div className="relative flex items-center justify-center w-[18px] h-[18px] rounded md border border-white/30 bg-black/30 group-hover/check:border-teal-400/60 transition-colors backdrop-blur-sm">
                                        <input type="checkbox" className="absolute w-full h-full opacity-0 cursor-pointer peer" />
                                        <div className="w-2.5 h-2.5 bg-teal-400 rounded-sm opacity-0 peer-checked:opacity-100 transition-opacity drop-shadow-[0_0_5px_rgba(45,212,191,0.5)]"></div>
                                    </div>
                                    <span className="text-xs font-semibold text-gray-200 group-hover/check:text-white transition-colors drop-shadow-md">Remember me</span>
                                </label>
                                <Link to="#" className="text-xs font-semibold text-teal-300 hover:text-white transition-colors drop-shadow-md">
                                    Recover Password
                                </Link>
                            </div>

                            <div className="pt-6">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-12 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white rounded-xl text-sm font-bold tracking-wide transition-all duration-300 shadow-[0_0_20px_rgba(20,184,166,0.4)] hover:shadow-[0_0_30px_rgba(20,184,166,0.6)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center group/btn relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover/btn:[animation:shimmer_1.5s_infinite] pointer-events-none"></div>
                                    <style>{`@keyframes shimmer { 100% { transform: translateX(100%); } }`}</style>

                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <span className="flex items-center gap-2 relative z-10">
                                            Sign In
                                            <ArrowRight className="w-[18px] h-[18px] group-hover/btn:translate-x-1.5 transition-transform duration-300" />
                                        </span>
                                    )}
                                </button>
                            </div>
                        </form>

                        <div className="mt-8 text-center border-t border-white/20 pt-6">
                            <p className="text-xs font-medium text-gray-300 drop-shadow-sm">
                                Secure gateway restricted to authorized personnel.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-center text-[10px] font-bold tracking-widest text-white/50 uppercase drop-shadow-md">

                </div>
            </div>
        </div>
    );
};

export default Login;
