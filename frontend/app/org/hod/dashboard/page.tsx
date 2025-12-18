"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, BookOpen, Users, CheckCircle, Clock, AlertCircle, TrendingUp, Filter } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function HODDashboardPage() {
    const { token, user } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [approvals, setApprovals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (!token) return;
            try {
                // Fetch stats (now accessible to DEPT_HEAD)
                const response = await axios.get(`${API_URL}/org/dashboard/stats`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStats(response.data);

                // Fetch approvals list
                const approvalsResponse = await axios.get(`${API_URL}/org/dashboard/approvals`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setApprovals(approvalsResponse.data);
            } catch (error) {
                console.error("Failed to fetch dashboard stats:", error);
                // toast.error("Failed to load dashboard statistics");
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [token]);

    const handleAssignClick = () => {
        router.push('/org/hod/courses');
    }

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
                    <p className="text-slate-500 font-medium animate-pulse">Loading Department Data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-8 lg:p-12 space-y-10 pb-20">
            {/* Header Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-violet-900 to-slate-900 p-8 text-white shadow-2xl shadow-indigo-900/20">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-80 w-80 rounded-full bg-purple-500/20 blur-3xl"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-indigo-200 text-xs font-semibold backdrop-blur-md mb-3">
                            <Users className="h-3.5 w-3.5" /> Department Head Portal
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-200">
                            Department Overview
                        </h1>
                        <p className="mt-2 text-indigo-200 max-w-2xl">
                            Manage curriculum, review content, and track department performance.
                        </p>
                    </div>
                    <Button
                        onClick={handleAssignClick}
                        className="bg-white text-indigo-900 hover:bg-indigo-50 hover:text-indigo-950 font-semibold shadow-lg shadow-indigo-900/50 border-0"
                        size="lg"
                    >
                        <BookOpen className="mr-2 h-5 w-5" /> Manage Courses
                    </Button>
                </div>
            </div>

            {/* Main Stats Grid */}
            <section>
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Activity className="h-5 w-5 text-indigo-600" /> Key Metrics
                    </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <PremiumStatCard
                        title="Total Courses"
                        value={stats?.total_courses || 0}
                        icon={<BookOpen className="h-6 w-6 text-white" />}
                        gradient="from-blue-600 to-blue-400"
                        subtext={`${stats?.published_courses || 0} Published`}
                    />
                    <div onClick={() => router.push('/org/hod/students')} className="cursor-pointer">
                        <PremiumStatCard
                            title="Dept. Students"
                            value={stats?.total_students || 0}
                            icon={<Users className="h-6 w-6 text-white" />}
                            gradient="from-emerald-600 to-emerald-400"
                            subtext="In your department"
                        />
                    </div>
                    <PremiumStatCard
                        title="Pending Approvals"
                        value={stats?.pending_approvals || 0}
                        icon={<AlertCircle className="h-6 w-6 text-white" />}
                        gradient={stats?.pending_approvals > 0 ? "from-orange-500 to-amber-500" : "from-slate-500 to-slate-400"}
                        subtext="Requires Action"
                    />
                    <div onClick={() => router.push('/org/hod/teachers')} className="cursor-pointer">
                        <PremiumStatCard
                            title="Teachers"
                            value={stats?.total_teachers || 0}
                            icon={<Users className="h-6 w-6 text-white" />}
                            gradient="from-violet-600 to-violet-400"
                            subtext="In your department"
                        />
                    </div>
                </div>
            </section>

            {/* Action Section: Pending Approvals */}
            <section className="mt-10">
                <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-orange-600" /> Approval Queue
                </h2>


                {stats?.pending_approvals > 0 ? (
                    <div className="bg-orange-50 border border-orange-100 rounded-3xl p-8 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                <AlertCircle className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-orange-900">You have {stats.pending_approvals} items pending review</h3>
                                <p className="text-orange-700">Review and approve content in the dedicated approval queue.</p>
                            </div>
                        </div>
                        <Button
                            onClick={() => router.push('/org/approvals')}
                            className="bg-orange-600 hover:bg-orange-700 text-white border-0"
                        >
                            Go to Approval Queue
                        </Button>
                    </div>
                ) : (
                    <div className="bg-white border border-slate-100 rounded-3xl p-10 flex flex-col items-center justify-center text-center shadow-lg shadow-slate-200/50">
                        <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="h-8 w-8 text-emerald-500" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">All caught up!</h3>
                        <p className="text-slate-500 max-w-sm">There are no pending approvals at the moment. Great job keeping the curriculum moving.</p>
                    </div>
                )}
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
