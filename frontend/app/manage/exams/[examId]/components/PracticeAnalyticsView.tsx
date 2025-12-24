"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Target,
    TrendingUp,
    Users,
    BarChart3,
    ArrowUp,
    ArrowDown,
    Minus
} from "lucide-react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

interface PracticeAnalytics {
    total_attempts: number;
    unique_students: number;
    avg_attempts_per_student: number;
    improvement_rate: number;
    learning_curve: Array<{
        attempt_number: number;
        average_score: number;
        attempt_count: number;
    }>;
    mastery_stats: Array<{
        question_index: number;
        question_text: string;
        initial_success_rate: number;
        final_success_rate: number;
        improvement: number;
    }>;
    score_distribution: Record<string, number>;
}

interface PracticeAnalyticsViewProps {
    examId: string;
}

export default function PracticeAnalyticsView({ examId }: PracticeAnalyticsViewProps) {
    const [analytics, setAnalytics] = useState<PracticeAnalytics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, [examId]);

    const fetchAnalytics = async () => {
        try {
            const res = await api.get(`/exams/${examId}/practice-analytics`);
            setAnalytics(res.data);
        } catch (error) {
            console.error("Failed to fetch practice analytics:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="text-center py-12 text-slate-500">Loading analytics...</div>;
    }

    if (!analytics) {
        return <div className="text-center py-12 text-slate-500">No analytics data available</div>;
    }

    const getTrendIcon = (rate: number) => {
        if (rate > 5) return <ArrowUp className="h-4 w-4 text-emerald-500" />;
        if (rate < -5) return <ArrowDown className="h-4 w-4 text-red-500" />;
        return <Minus className="h-4 w-4 text-slate-400" />;
    };

    const getTrendColor = (rate: number) => {
        if (rate > 5) return "text-emerald-600";
        if (rate < -5) return "text-red-600";
        return "text-slate-600";
    };

    return (
        <div className="space-y-8">
            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Attempts */}
                <Card className="rounded-2xl border-slate-200 shadow-sm bg-white overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
                                <BarChart3 className="h-5 w-5" />
                            </div>
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Total</span>
                        </div>
                        <div className="text-3xl font-black text-slate-900 tabular-nums">{analytics.total_attempts}</div>
                        <p className="text-[10px] font-bold text-slate-400 mt-2">PRACTICE ATTEMPTS</p>
                    </CardContent>
                </Card>

                {/* Unique Students */}
                <Card className="rounded-2xl border-slate-200 shadow-sm bg-white overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600">
                                <Users className="h-5 w-5" />
                            </div>
                            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Students</span>
                        </div>
                        <div className="text-3xl font-black text-slate-900 tabular-nums">{analytics.unique_students}</div>
                        <p className="text-[10px] font-bold text-slate-400 mt-2">PRACTICING STUDENTS</p>
                    </CardContent>
                </Card>

                {/* Average Attempts */}
                <Card className="rounded-2xl border-slate-200 shadow-sm bg-white overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
                                <Target className="h-5 w-5" />
                            </div>
                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Average</span>
                        </div>
                        <div className="text-3xl font-black text-slate-900 tabular-nums">{analytics.avg_attempts_per_student}</div>
                        <p className="text-[10px] font-bold text-slate-400 mt-2">ATTEMPTS PER STUDENT</p>
                    </CardContent>
                </Card>

                {/* Improvement Rate */}
                <Card className="rounded-2xl border-slate-200 shadow-sm bg-white overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className={cn(
                                "p-2.5 rounded-xl",
                                analytics.improvement_rate > 5 ? "bg-emerald-50 text-emerald-600" :
                                    analytics.improvement_rate < -5 ? "bg-red-50 text-red-600" :
                                        "bg-slate-50 text-slate-600"
                            )}>
                                <TrendingUp className="h-5 w-5" />
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progress</span>
                        </div>
                        <div className={cn("text-3xl font-black tabular-nums flex items-center gap-2", getTrendColor(analytics.improvement_rate))}>
                            {getTrendIcon(analytics.improvement_rate)}
                            {analytics.improvement_rate > 0 ? '+' : ''}{analytics.improvement_rate}%
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 mt-2">IMPROVEMENT RATE</p>
                    </CardContent>
                </Card>
            </div>

            {/* Score Distribution */}
            <Card className="rounded-2xl border-slate-200 shadow-sm bg-white">
                <CardHeader>
                    <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-3">
                        <BarChart3 className="h-5 w-5 text-indigo-600" />
                        Attempt Distribution
                    </CardTitle>
                    <p className="text-sm text-slate-500 font-medium">All practice attempts across score ranges</p>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {Object.entries(analytics.score_distribution).map(([range, count]) => {
                            const percentage = analytics.total_attempts > 0
                                ? Math.round((count / analytics.total_attempts) * 100)
                                : 0;

                            return (
                                <div key={range} className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-bold text-slate-700">{range}</span>
                                        <span className="text-slate-500 font-medium">{count} attempts ({percentage}%)</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-500 rounded-full transition-all"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Learning Curve Chart */}
            {analytics.learning_curve.length > 0 && (
                <Card className="rounded-2xl border-slate-200 shadow-sm bg-white">
                    <CardHeader>
                        <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-3">
                            <TrendingUp className="h-5 w-5 text-emerald-600" />
                            Learning Curve
                        </CardTitle>
                        <p className="text-sm text-slate-500 font-medium">Average score progression by attempt number</p>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={analytics.learning_curve}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis
                                        dataKey="attempt_number"
                                        label={{ value: 'Attempt Number', position: 'insideBottom', offset: -5 }}
                                        stroke="#64748b"
                                    />
                                    <YAxis
                                        label={{ value: 'Average Score (%)', angle: -90, position: 'insideLeft' }}
                                        stroke="#64748b"
                                        domain={[0, 100]}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#fff',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '8px',
                                            padding: '8px'
                                        }}
                                        formatter={(value: any, name: string) => {
                                            if (name === 'average_score') return [`${value}%`, 'Avg Score'];
                                            if (name === 'attempt_count') return [value, 'Students'];
                                            return [value, name];
                                        }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="average_score"
                                        stroke="#10b981"
                                        strokeWidth={3}
                                        dot={{ fill: '#10b981', r: 5 }}
                                        activeDot={{ r: 7 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-4 text-xs text-slate-500 text-center">
                            Showing progression across {analytics.learning_curve.length} attempt position(s)
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
