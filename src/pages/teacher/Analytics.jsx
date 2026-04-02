import React from 'react';
import ScoreChart from '../../components/analytics/ScoreChart';
import DifficultyChart from '../../components/analytics/DifficultyChart';
import PerformanceChart from '../../components/analytics/PerformanceChart';
import { TrendingUp, Users, AlertTriangle, Target, Activity, Search } from 'lucide-react';

const Analytics = () => {
    // Mock Data
    const scoreData = [
        { name: 'Midterm', score: 85, average: 75 },
        { name: 'DS Quiz', score: 72, average: 68 },
        { name: 'Algos Final', score: 90, average: 78 },
    ];

    const difficultyPerformance = [
        { name: 'Easy Correct', value: 85, color: '#10B981' },
        { name: 'Medium Correct', value: 65, color: '#F59E0B' },
        { name: 'Hard Correct', value: 40, color: '#EF4444' }
    ];

    const classPerformanceTrend = [
        { date: 'Sep 1', score: 65 },
        { date: 'Sep 15', score: 68 },
        { date: 'Oct 1', score: 72 },
        { date: 'Oct 15', score: 75 },
        { date: 'Nov 1', score: 71 },
        { date: 'Nov 15', score: 82 },
    ];

    return (
        <div className="pb-12">
            <div className="p-4 sm:p-8 space-y-8 flex-1 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-2 sm:px-4">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl sm:text-4xl font-black text-gray-800 tracking-tight flex items-center gap-3">
                            <Activity className="text-blue-600" size={32} /> Analytics <span className="text-gray-400 font-medium text-2xl">/ Command Center</span>
                        </h1>
                        <p className="text-sm font-medium text-gray-500">Global insights into class performance, system flagged integrity issues, and test distribution metrics.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <select className="px-4 py-3 bg-white/60 backdrop-blur-sm border border-white/60 rounded-2xl text-[10px] font-black text-gray-800 focus:ring-2 focus:ring-blue-500 transition-all outline-none shadow-sm uppercase tracking-widest cursor-pointer appearance-none hover:bg-white text-center">
                            <option>All Divisions / Domains</option>
                            <option>Computer Science Year 3</option>
                            <option>Data Science Year 2</option>
                        </select>
                        <select className="px-4 py-3 bg-white/60 backdrop-blur-sm border border-white/60 rounded-2xl text-[10px] font-black text-gray-800 focus:ring-2 focus:ring-blue-500 transition-all outline-none shadow-sm uppercase tracking-widest cursor-pointer appearance-none hover:bg-white text-center">
                            <option>Global Temporal Trends</option>
                            <option>Midterm Exam Matrix</option>
                            <option>Final Exam Matrix</option>
                        </select>
                    </div>
                </div>

                {/* Top Metrics Grid */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                    <div className="bg-[#DDE2EA] rounded-[2rem] p-6 shadow-[inset_0_2px_10px_rgba(255,255,255,0.9),0_10px_30px_rgba(0,0,0,0.05)] border border-white/40 flex items-center gap-4 relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/40 rounded-full filter blur-xl group-hover:bg-white/60 transition-all"></div>
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-indigo-200 shadow-inner flex items-center justify-center border border-white">
                            <TrendingUp className="text-indigo-600 w-8 h-8" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Global Class Median</p>
                            <p className="text-3xl font-black text-gray-800 tracking-tight leading-none">76.4<span className="text-xl text-gray-400">%</span></p>
                            <p className="text-[9px] font-bold text-indigo-600 mt-2 tracking-wider flex items-center gap-1">+4.2% Temporal Shift</p>
                        </div>
                    </div>

                    <div className="bg-[#DDE2EA] rounded-[2rem] p-6 shadow-[inset_0_2px_10px_rgba(255,255,255,0.9),0_10px_30px_rgba(0,0,0,0.05)] border border-white/40 flex items-center gap-4 relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/40 rounded-full filter blur-xl group-hover:bg-white/60 transition-all"></div>
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-100 to-green-200 shadow-inner flex items-center justify-center border border-white">
                            <Target className="text-green-600 w-8 h-8" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Success Threshold</p>
                            <p className="text-3xl font-black text-gray-800 tracking-tight leading-none">89.2<span className="text-xl text-gray-400">%</span></p>
                            <p className="text-[9px] font-bold text-gray-500 mt-2 tracking-wider">102 / 115 Cleared Phase</p>
                        </div>
                    </div>

                    <div className="bg-red-50/80 backdrop-blur-sm rounded-[2rem] p-6 shadow-[inset_0_2px_10px_rgba(255,255,255,0.9),0_10px_30px_rgba(0,0,0,0.05)] border border-red-100 flex items-center gap-4 relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/40 rounded-full filter blur-xl group-hover:bg-white/60 transition-all"></div>
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-100 to-red-200 shadow-inner flex items-center justify-center border border-white">
                            <AlertTriangle className="text-red-600 w-8 h-8" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Integrity Breaches</p>
                            <p className="text-3xl font-black text-red-800 tracking-tight leading-none">3</p>
                            <p className="text-[9px] font-bold text-red-500 mt-2 tracking-wider">Requires Manual Arbitration</p>
                        </div>
                    </div>
                </div>

                {/* Main Charts Area */}
                <div className="bg-[#EBEBEF] rounded-[2.5rem] p-6 sm:p-8 shadow-[inset_0_2px_10px_rgba(255,255,255,0.9),0_10px_30px_rgba(0,0,0,0.05)] border border-white/40">
                    <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-6 px-2 flex items-center gap-2">Data Vizualization Engine</h3>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="lg:col-span-2 bg-white/60 rounded-[2rem] p-6 shadow-sm border border-white">
                            <PerformanceChart data={classPerformanceTrend} title="Class Performance Trend over Semester" />
                        </div>
                        <div className="bg-white/60 rounded-[2rem] p-6 shadow-sm border border-white flex justify-center">
                            <div className="w-full max-w-sm">
                                <ScoreChart data={scoreData} title="Recent Exam Averages vs Top" />
                            </div>
                        </div>
                        <div className="bg-white/60 rounded-[2rem] p-6 shadow-sm border border-white flex justify-center">
                            <div className="w-full max-w-sm">
                                <DifficultyChart data={difficultyPerformance} title="Success Rate by Question Difficulty" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* AI Insights Engine */}
                <div className="bg-[#DDE2EA] rounded-[2.5rem] p-6 sm:p-8 shadow-[inset_0_2px_10px_rgba(255,255,255,0.9),0_10px_30px_rgba(0,0,0,0.05)] border border-white/40 relative overflow-hidden">
                    <div className="absolute -left-10 top-0 w-64 h-64 bg-white/30 rounded-full filter blur-3xl pointer-events-none"></div>
                    
                    <div className="relative z-10">
                        <div className="mb-6">
                            <h3 className="text-lg font-black text-gray-800 tracking-tight flex items-center gap-2">
                                <Sparkles className="text-indigo-600" size={20} /> Matrix Vulnerabilities (AI Insight)
                            </h3>
                            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mt-1 pl-7">System localized topics with sub-optimal retention rates.</p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 bg-white/60 rounded-3xl border border-white shadow-[inset_0_2px_4px_rgba(255,255,255,0.6)] gap-4 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center border border-white shadow-inner shrink-0">
                                        <Search size={20} />
                                    </div>
                                    <div>
                                        <p className="font-black text-gray-800 tracking-tight">Dynamic Programming Algorithms</p>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-[10px] font-black uppercase text-red-500 bg-red-50 px-2 py-0.5 rounded-md">42% Mean Accuracy</span>
                                            <span className="text-[10px] font-black uppercase text-gray-400">Tested Across 2 Modules</span>
                                        </div>
                                    </div>
                                </div>
                                <button className="w-full sm:w-auto px-6 py-3 rounded-full font-black tracking-widest text-[9px] text-white shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0 bg-gradient-to-r from-orange-400 to-red-500 uppercase">
                                    Queue Auto Remediation Quiz
                                </button>
                            </div>

                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 bg-white/60 rounded-3xl border border-white shadow-[inset_0_2px_4px_rgba(255,255,255,0.6)] gap-4 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-yellow-100 text-yellow-600 flex items-center justify-center border border-white shadow-inner shrink-0">
                                        <Search size={20} />
                                    </div>
                                    <div>
                                        <p className="font-black text-gray-800 tracking-tight">Binary Tree Traversals</p>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-[10px] font-black uppercase text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-md">55% Mean Accuracy</span>
                                            <span className="text-[10px] font-black uppercase text-gray-400">Tested Across 3 Modules</span>
                                        </div>
                                    </div>
                                </div>
                                <button className="w-full sm:w-auto px-6 py-3 rounded-full font-black tracking-widest text-[9px] text-white shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0 bg-gradient-to-r from-orange-400 to-red-500 uppercase">
                                    Queue Auto Remediation Quiz
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Analytics;
