"use client";
import React, { useEffect, useState } from 'react';
import { getGlobalMetrics, getOrganizationMetrics, getLearningMetrics } from '@/lib/api';
import { Users, GraduationCap, Building2, TrendingUp, Activity, AlertCircle, BookOpen, Clock, Zap } from 'lucide-react';

export default function SuperAdminDashboard() {
    const [global, setGlobal] = useState<any>(null);
    const [orgs, setOrgs] = useState<any>(null);
    const [learning, setLearning] = useState<any>(null);

    useEffect(() => {
        getGlobalMetrics().then(setGlobal);
        getOrganizationMetrics().then(setOrgs);
        getLearningMetrics().then(setLearning);
    }, []);

    if (!global || !orgs || !learning) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
                    <p className="text-slate-500 font-medium animate-pulse">Loading Analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-8 lg:p-12 space-y-10 pb-10">

            {/* Header Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 p-8 text-white shadow-2xl shadow-indigo-900/20">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-80 w-80 rounded-full bg-purple-500/20 blur-3xl"></div>

                <div className="relative z-10">
                    <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-200">
                        Platform Overview
                    </h1>
                    <p className="mt-2 text-indigo-200 max-w-2xl">
                        Real-time insights into user growth, organizational health, and learning engagement across the ecosystem.
                    </p>
                </div>
            </div>

            {/* 1. Global User Metrics */}
            <section>
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Users className="h-5 w-5 text-indigo-600" /> User Growth
                    </h2>
                    <span className="text-xs font-semibold px-3 py-1 bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" /> +12% this week
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <PremiumStatCard
                        title="Total Users"
                        value={global.total_users}
                        icon={<Users className="h-6 w-6 text-white" />}
                        gradient="from-blue-600 to-blue-400"
                        subtext="Across all orgs"
                    />
                    <PremiumStatCard
                        title="Students"
                        value={global.total_students}
                        icon={<GraduationCap className="h-6 w-6 text-white" />}
                        gradient="from-emerald-600 to-emerald-400"
                        subtext="Active learners"
                    />
                    <PremiumStatCard
                        title="Teachers"
                        value={global.total_teachers}
                        icon={<BookOpen className="h-6 w-6 text-white" />}
                        gradient="from-violet-600 to-violet-400"
                        subtext="Content creators"
                    />
                    <PremiumStatCard
                        title="Org Admins"
                        value={global.total_org_admins}
                        icon={<Building2 className="h-6 w-6 text-white" />}
                        gradient="from-orange-600 to-orange-400"
                        subtext="Managing metrics"
                    />
                </div>

                {/* Active Users Glass Panel */}
                <div className="mt-6 bg-white border border-slate-100 rounded-2xl p-6 shadow-xl shadow-slate-200/50">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-6">Engagement Trends</h3>
                    <div className="grid grid-cols-3 divide-x divide-slate-100">
                        <div className="px-4 text-center group cursor-default">
                            <div className="text-3xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{global.active_users.daily}</div>
                            <div className="text-sm font-medium text-slate-500 mt-1">Daily Active</div>
                        </div>
                        <div className="px-4 text-center group cursor-default">
                            <div className="text-3xl font-bold text-slate-900 group-hover:text-purple-600 transition-colors">{global.active_users.weekly}</div>
                            <div className="text-sm font-medium text-slate-500 mt-1">Weekly Active</div>
                        </div>
                        <div className="px-4 text-center group cursor-default">
                            <div className="text-3xl font-bold text-slate-900 group-hover:text-orange-600 transition-colors">{global.active_users.monthly}</div>
                            <div className="text-sm font-medium text-slate-500 mt-1">Monthly Active</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. Organization Health */}
            <section>
                <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-purple-600" /> Organization Health
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Activation Card */}
                    <div className="col-span-2 bg-gradient-to-r from-indigo-600 to-purple-700 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg group">
                        <div className="absolute top-0 right-0 -m-4 h-32 w-32 rounded-full bg-white/10 group-hover:scale-150 transition-transform duration-700"></div>
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <p className="text-indigo-200 font-medium mb-1">Total Activation Rate</p>
                                <div className="text-6xl font-bold tracking-tight">{orgs.activation_rate}%</div>
                                <p className="mt-2 text-indigo-100 text-sm">Organizations with active course content</p>
                            </div>
                            <div className="h-24 w-24 rounded-full border-4 border-white/20 flex items-center justify-center backdrop-blur-sm">
                                <Zap className="h-10 w-10 text-yellow-300" />
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-rows-2 gap-6">
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/50 flex items-center justify-between hover:scale-[1.02] transition-transform">
                            <div>
                                <p className="text-sm text-slate-500 font-medium">New Orgs (This Month)</p>
                                <p className="text-2xl font-bold text-slate-900 mt-1">{orgs.new_this_month}</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                <TrendingUp className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-lg shadow-red-100/50 flex items-center justify-between hover:scale-[1.02] transition-transform">
                            <div>
                                <p className="text-sm text-red-500 font-medium">At Risk Orgs</p>
                                <p className="text-2xl font-bold text-red-700 mt-1">{orgs.at_risk_count}</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 animate-pulse">
                                <AlertCircle className="h-5 w-5" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. Learning Activity */}
            <section>
                <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-orange-600" /> Learning Activity
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="col-span-1 md:col-span-2 bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden">
                        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-orange-50 to-transparent"></div>
                        <div className="relative z-10 flex justify-between items-end">
                            <div>
                                <p className="text-sm font-semibold text-orange-600 mb-2 uppercase tracking-wide">Global Engagement</p>
                                <h3 className="text-4xl font-bold text-slate-900 mb-1">{learning.time_spent_per_day}</h3>
                                <p className="text-slate-500">Est. Total Learning Time</p>
                            </div>
                            <Clock className="h-16 w-16 text-orange-500/20" />
                        </div>
                    </div>

                    <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl shadow-slate-900/20 flex flex-col justify-center">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-slate-400 text-sm font-medium">Total Exams</span>
                            <span className="bg-slate-800 p-2 rounded-lg"><Activity className="h-4 w-4 text-emerald-400" /></span>
                        </div>
                        <div className="text-4xl font-bold mb-2">{learning.total_module_exams_completed}</div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: '70%' }}></div>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">Completion rate across modules</p>
                    </div>
                </div>
            </section>
        </div>
    );
}

function PremiumStatCard({ title, value, icon, gradient, subtext }: { title: string, value: string | number, icon: any, gradient: string, subtext: string }) {
    return (
        <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-6 text-white shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}>
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/20 blur-2xl"></div>
            <div className="relative z-10 flex items-start justify-between">
                <div>
                    <h3 className="font-medium text-white/90">{title}</h3>
                    <div className="mt-2 text-3xl font-bold tracking-tight">{value}</div>
                    <p className="mt-1 text-xs text-white/70 font-medium">{subtext}</p>
                </div>
                <div className="rounded-xl bg-white/20 p-2 backdrop-blur-sm border border-white/10">
                    {icon}
                </div>
            </div>
        </div>
    );
}
