"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { BookOpen, Edit3, CheckCircle, Zap, GraduationCap, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function TeacherDashboardPage() {
    const { token, user } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (!token) return;
            try {
                const response = await axios.get(`${API_URL}/org/teacher/stats`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStats(response.data);
            } catch (error) {
                console.error("Failed to fetch teacher stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [token]);

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
                    <p className="text-slate-500 font-medium animate-pulse">Loading Your Dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-8 lg:p-12 space-y-10 pb-20">
            {/* Header Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 p-8 text-white shadow-2xl shadow-blue-900/20">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-blue-200 text-xs font-semibold backdrop-blur-md mb-3">
                            <GraduationCap className="h-3.5 w-3.5" /> Teacher Portal
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-200">
                            Welcome, {user?.full_name}
                        </h1>
                        <p className="mt-2 text-blue-200 max-w-2xl">
                            Create and manage your course content with ease.
                        </p>
                    </div>
                    <Button
                        onClick={() => router.push('/org/teacher/courses')}
                        className="bg-white text-blue-900 hover:bg-blue-50 hover:text-blue-950 font-semibold shadow-lg shadow-blue-900/50 border-0"
                        size="lg"
                    >
                        <BookOpen className="mr-2 h-5 w-5" /> My Courses
                    </Button>
                </div>
            </div>

            {/* Stats Section */}
            <section>
                <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" /> Your Statistics
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <PremiumStatCard
                        title="Assigned Courses"
                        value={stats?.total_courses || 0}
                        icon={<BookOpen className="h-6 w-6 text-white" />}
                        gradient="from-blue-600 to-blue-400"
                        subtext={`${stats?.published_courses || 0} Published`}
                    />
                    <PremiumStatCard
                        title="Draft Topics"
                        value={stats?.draft_topics || 0}
                        icon={<Edit3 className="h-6 w-6 text-white" />}
                        gradient="from-orange-600 to-orange-400"
                        subtext="In progress"
                    />
                    <PremiumStatCard
                        title="Pending Approval"
                        value={stats?.pending_approval || 0}
                        icon={<CheckCircle className="h-6 w-6 text-white" />}
                        gradient={stats?.pending_approval > 0 ? "from-amber-600 to-amber-400" : "from-slate-500 to-slate-400"}
                        subtext="Awaiting HOD review"
                    />
                    <PremiumStatCard
                        title="AI Credits"
                        value={stats?.ai_usage?.limit - stats?.ai_usage?.used || 0}
                        icon={<Zap className="h-6 w-6 text-white" />}
                        gradient="from-yellow-600 to-yellow-400"
                        subtext={`of ${stats?.ai_usage?.limit || 0} available`}
                    />
                </div>
            </section>

            {/* Action Section for Pending Items */}
            {stats?.draft_topics > 0 || stats?.pending_approval > 0 ? (
                <section className="mt-10">
                    <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Edit3 className="h-5 w-5 text-orange-600" /> Action Required
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {stats?.draft_topics > 0 && (
                            <div className="bg-orange-50 border border-orange-100 rounded-3xl p-8 flex flex-col shadow-sm">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                        <Edit3 className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-orange-900">
                                            {stats.draft_topics} Draft Topics
                                        </h3>
                                        <p className="text-orange-700 text-sm">Complete and submit for review</p>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => router.push('/org/teacher/courses')}
                                    className="mt-auto bg-orange-600 hover:bg-orange-700 text-white border-0"
                                >
                                    Continue Editing
                                </Button>
                            </div>
                        )}

                        {stats?.pending_approval > 0 && (
                            <div className="bg-amber-50 border border-amber-100 rounded-3xl p-8 flex flex-col shadow-sm">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                                        <CheckCircle className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-amber-900">
                                            {stats.pending_approval} Topics Under Review
                                        </h3>
                                        <p className="text-amber-700 text-sm">Awaiting HOD approval</p>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => router.push('/org/teacher/courses')}
                                    className="mt-auto bg-amber-600 hover:bg-amber-700 text-white border-0"
                                >
                                    View Submissions
                                </Button>
                            </div>
                        )}
                    </div>
                </section>
            ) : (
                <section className="mt-10">
                    <div className="bg-white border border-slate-100 rounded-3xl p-10 flex flex-col items-center justify-center text-center shadow-lg shadow-slate-200/50">
                        <div className="h-16 w-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="h-8 w-8 text-emerald-500" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">All caught up!</h3>
                        <p className="text-slate-500 max-w-sm">
                            You have no pending draft topics. Great job staying on top of your content!
                        </p>
                        <Button
                            onClick={() => router.push('/org/teacher/courses')}
                            className="mt-6 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <BookOpen className="mr-2 h-4 w-4" /> View My Courses
                        </Button>
                    </div>
                </section>
            )}
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
