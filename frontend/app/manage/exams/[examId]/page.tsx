"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
    PieChart, Pie
} from "recharts";
import {
    ChevronLeft, Users, Brain, Target, BarChart3, Clock,
    CheckCircle2, AlertCircle, HelpCircle, ArrowRight,
    Download, Share2, ClipboardList, PenLine, Save,
    Activity, Award, TrendingUp, Filter, Search,
    MessageSquare, UserCheck, UserMinus, RotateCcw, Calendar
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { toast } from "sonner";
import PracticeAnalyticsView from "./components/PracticeAnalyticsView";
import GroupedParticipantsView from "./components/GroupedParticipantsView";

// Simple Skeleton fallback
function Skeleton({ className }: { className?: string }) {
    return <div className={cn("animate-pulse rounded-md bg-slate-200", className)} />;
}

export default function ExamDetailAnalyticsPage() {
    const { examId } = useParams();
    const router = useRouter();
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [exam, setExam] = useState<any>(null);
    const [analytics, setAnalytics] = useState<any>(null);
    const [attempts, setAttempts] = useState<any[]>([]);
    const [remediationNotes, setRemediationNotes] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, [examId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const examRes = await api.get(`/exams/${examId}`);
            const isPractice = examRes.data.type === 'PRACTICE';

            const [analyticsRes, attemptsRes] = await Promise.all([
                api.get(`/exams/${examId}/analytics`),
                api.get(`/exams/${examId}/admin/attempts${isPractice ? '?practice_mode=true' : ''}`)
            ]);

            setExam(examRes.data);
            setAnalytics(analyticsRes.data);
            setAttempts(attemptsRes.data);
            setRemediationNotes(examRes.data.remediation_notes || "");
        } catch (error) {
            console.error("Error fetching exam data:", error);
            toast.error("Failed to load exam details");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveRemediation = async () => {
        setIsSaving(true);
        try {
            await api.post(`/exams/${examId}/remediation`, { notes: remediationNotes });
            toast.success("Remediation notes saved successfully");
        } catch (error) {
            toast.error("Failed to save remediation notes");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return <ExamDetailSkeleton />;
    }

    if (!exam) return null;

    // Chart Data Preparation
    const scoreDistData = Object.entries(analytics?.score_distribution || {}).map(([key, value]) => ({
        range: key,
        count: value
    }));

    return (
        <div className="min-h-screen bg-[#fafbff] pb-12">
            {/* Header / Hero Section */}
            <div className="bg-white border-b border-slate-200 relative overflow-hidden group">
                {/* Professional Background Elements */}
                <div className="absolute top-0 right-0 w-[600px] h-[400px] bg-slate-50 opacity-70 blur-[100px] -mr-40 -mt-20" />
                <div className="absolute top-0 right-0 w-[400px] h-[300px] bg-indigo-50/30 blur-[80px]" />

                <div className="max-w-[7xl] mx-auto px-8 py-10 relative z-10">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push('/manage/exams')}
                        className="mb-8 -ml-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 transition-all rounded-lg font-bold"
                    >
                        <ChevronLeft className="h-4 w-4 mr-1.5" />
                        Back to Exams
                    </Button>

                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-slate-900 rounded-xl shadow-lg ring-4 ring-slate-50 transition-transform hover:scale-105">
                                    <Brain className="h-5 w-5 text-white" />
                                </div>
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-slate-500 border-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest">
                                            {exam.type?.replace('_', ' ')}
                                        </Badge>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">/</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{exam.course_title || "Course Details"}</span>
                                    </div>
                                </div>
                            </div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
                                {exam.title}
                            </h1>
                            <div className="flex flex-wrap items-center gap-6 pt-1">
                                <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                                    <Calendar className="h-4 w-4 text-slate-400" />
                                    {new Date(exam.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </div>
                                <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                                    <Clock className="h-4 w-4 text-slate-400" />
                                    {exam.duration_minutes || 30} Minutes
                                </div>
                                <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                                    <ClipboardList className="h-4 w-4 text-slate-400" />
                                    {exam.questions?.length || 0} Questions
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button variant="outline" className="rounded-xl h-11 px-6 border-slate-200 bg-white hover:bg-slate-50 shadow-sm transition-all active:scale-95 font-bold text-slate-700 text-sm" onClick={() => toast.info("Exporting report...")}>
                                <Download className="h-4 w-4 mr-2 text-slate-400" />
                                Export
                            </Button>
                            <Button className="rounded-xl h-11 px-6 bg-slate-900 hover:bg-indigo-600 shadow-lg shadow-slate-100 transition-all active:scale-95 font-bold text-sm">
                                <Share2 className="h-4 w-4 mr-2" />
                                Share Results
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1440px] mx-auto px-8 mt-10">
                <Tabs defaultValue="overview" className="space-y-10">
                    <div className="flex justify-start">
                        <TabsList className="bg-slate-100/60 p-1 rounded-xl h-auto border border-slate-200/50 flex gap-1">
                            <TabsTrigger
                                value="overview"
                                className="rounded-lg px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:border-slate-200 border border-transparent transition-all duration-300 font-bold text-xs text-slate-500 hover:text-slate-700 flex items-center gap-2"
                            >
                                <Activity className="h-3.5 w-3.5" />
                                Overview
                            </TabsTrigger>
                            <TabsTrigger
                                value="diagnostics"
                                className="rounded-lg px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:border-slate-200 border border-transparent transition-all duration-300 font-bold text-xs text-slate-500 hover:text-slate-700 flex items-center gap-2"
                            >
                                <BarChart3 className="h-3.5 w-3.5" />
                                Diagnostics
                            </TabsTrigger>
                            <TabsTrigger
                                value="attempts"
                                className="rounded-lg px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:border-slate-200 border border-transparent transition-all duration-300 font-bold text-xs text-slate-500 hover:text-slate-700 flex items-center gap-2"
                            >
                                <Users className="h-3.5 w-3.5" />
                                Participants
                            </TabsTrigger>
                            <TabsTrigger
                                value="remediation"
                                className="rounded-lg px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:border-slate-200 border border-transparent transition-all duration-300 font-bold text-xs text-slate-500 hover:text-slate-700 flex items-center gap-2"
                            >
                                <MessageSquare className="h-3.5 w-3.5" />
                                Remediation
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {exam.type === 'PRACTICE' ? (
                            /* Practice Exam Analytics */
                            <PracticeAnalyticsView examId={examId} />
                        ) : (
                            /* Assessment Exam Analytics (existing view) */
                            <>
                                {/* KPI Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                    <MetricCard
                                        title="Average Accuracy"
                                        value={`${analytics?.average_score || 0}%`}
                                        icon={Target}
                                        color="indigo"
                                        description="Class-wide performance mean"
                                        trend={analytics?.average_score > 70 ? "up" : "down"}
                                    />
                                    <MetricCard
                                        title="Success Rate"
                                        value={`${analytics?.pass_rate || 0}%`}
                                        icon={CheckCircle2}
                                        color="emerald"
                                        description="Qualified attempt percentage"
                                        trend={analytics?.pass_rate > 60 ? "up" : "down"}
                                    />
                                    <MetricCard
                                        title="Participation"
                                        value={analytics?.unique_students || 0}
                                        icon={Users}
                                        color="amber"
                                        description="Unique students who attempted"
                                    />
                                    <MetricCard
                                        title="Complexity"
                                        value={exam.difficulty}
                                        icon={Brain}
                                        color="purple"
                                        description="Inherent problem level"
                                    />
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                    {/* Score Distribution Chart */}
                                    <Card className="lg:col-span-2 rounded-[2rem] border-slate-200/60 shadow-xl shadow-slate-200/30 overflow-hidden bg-white">
                                        <CardHeader className="p-8 border-b border-slate-50">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <CardTitle className="text-2xl font-black text-slate-800 flex items-center gap-3">
                                                        <div className="p-2 bg-indigo-50 rounded-lg">
                                                            <BarChart3 className="h-5 w-5 text-indigo-600" />
                                                        </div>
                                                        Score Spread
                                                    </CardTitle>
                                                    <CardDescription className="text-slate-400 font-medium">Class-wide performance distribution</CardDescription>
                                                </div>
                                                <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 hidden sm:block">
                                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-2">Peak Range:</span>
                                                    <span className="text-sm font-black text-indigo-600">
                                                        {[...scoreDistData].sort((a: any, b: any) => (b.count || 0) - (a.count || 0))[0]?.range || "N/A"}
                                                    </span>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-8 h-[400px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={scoreDistData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                    <XAxis
                                                        dataKey="range"
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                                                        dy={10}
                                                    />
                                                    <YAxis
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                                                    />
                                                    <Tooltip
                                                        cursor={{ fill: '#f8fafc' }}
                                                        content={({ active, payload }: any) => {
                                                            if (active && payload && payload.length) {
                                                                return (
                                                                    <div className="bg-slate-900 text-white p-3 rounded-xl shadow-2xl border-0">
                                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{payload[0].payload.range}</p>
                                                                        <p className="text-lg font-black">{payload[0].value} Students</p>
                                                                    </div>
                                                                );
                                                            }
                                                            return null;
                                                        }}
                                                    />
                                                    <Bar dataKey="count" radius={[12, 12, 0, 0]} barSize={40}>
                                                        {scoreDistData.map((entry, index) => (
                                                            <Cell
                                                                key={`cell-${index}`}
                                                                fill={index % 2 === 0 ? '#4f46e5' : '#6366f1'}
                                                                fillOpacity={0.8 + (index / scoreDistData.length) * 0.2}
                                                            />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </CardContent>
                                    </Card>

                                    {/* Performance Summary */}
                                    <Card className="rounded-[2rem] border-0 shadow-2xl shadow-indigo-900/10 bg-gradient-to-br from-indigo-700 to-indigo-900 text-white overflow-hidden relative">
                                        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 blur-[100px] rounded-full -mr-20 -mt-20 shrink-0" />
                                        <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/20 blur-[60px] rounded-full -ml-10 -mb-10" />

                                        <CardHeader className="relative z-10 p-8">
                                            <div className="h-14 w-14 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center mb-4">
                                                <Award className="h-7 w-7 text-indigo-100" />
                                            </div>
                                            <CardTitle className="text-2xl font-black">
                                                Performance<br />Insights
                                            </CardTitle>
                                            <CardDescription className="text-indigo-200">AI-driven summary</CardDescription>
                                        </CardHeader>
                                        <CardContent className="relative z-10 space-y-8 p-8 pt-0">
                                            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 ring-1 ring-white/5">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-[0.2em]">Peak Performer</span>
                                                    <TrendingUp className="h-3 w-3 text-indigo-300" />
                                                </div>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-5xl font-black">{analytics?.high_score || 0}</span>
                                                    <span className="text-xl font-bold text-indigo-300">%</span>
                                                </div>
                                            </div>

                                            <div className="space-y-5">
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between text-xs font-bold px-1">
                                                        <span className="text-indigo-200 uppercase tracking-widest">Base Score</span>
                                                        <span className="bg-white/10 px-2 py-0.5 rounded-lg text-white">{analytics?.low_score || 0}%</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                                        <div className="h-full bg-indigo-300/50 rounded-full" style={{ width: `${analytics?.low_score}%` }} />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between text-xs font-bold px-1">
                                                        <span className="text-indigo-200 uppercase tracking-widest">Pass Quota</span>
                                                        <span className="bg-white/10 px-2 py-0.5 rounded-lg text-white">{analytics?.pass_rate}%</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                                        <div className="h-full bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.5)] rounded-full" style={{ width: `${analytics?.pass_rate}%` }} />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-4">
                                                <Button variant="secondary" className="w-full h-14 rounded-2xl font-black text-indigo-900 bg-white hover:bg-indigo-50 transition-all border-0 shadow-xl">
                                                    Detailed Group Report
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </>
                        )}
                    </TabsContent>

                    {/* Diagnostics Tab */}
                    <TabsContent value="diagnostics" className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="space-y-8">
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Question Mastery</h2>
                                    <p className="text-slate-500 font-medium">Deep-dive into student performance patterns</p>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-black uppercase tracking-widest">
                                        <CheckCircle2 className="h-3 w-3" /> Mastery: &gt;80%
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-black uppercase tracking-widest">
                                        <AlertCircle className="h-3 w-3" /> Average: 50-80%
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-50 text-red-700 border border-red-100 text-[10px] font-black uppercase tracking-widest">
                                        <Target className="h-3 w-3" /> Critical: &lt;50%
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                {analytics?.question_stats.map((q: any, idx: number) => {
                                    const isLowAccuracy = q.success_rate < 40;
                                    return (
                                        <Card key={idx} className={cn(
                                            "rounded-3xl border shadow-sm transition-all duration-500 overflow-hidden group hover:shadow-xl hover:shadow-indigo-500/5",
                                            isLowAccuracy ? "border-red-200 bg-red-50/20" : "border-slate-100 bg-white hover:border-indigo-100"
                                        )}>
                                            <div className="flex flex-col md:flex-row">
                                                <div className="p-8 flex-1 flex flex-col gap-6">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <div className={cn(
                                                                "h-10 w-10 rounded-xl flex items-center justify-center font-black text-sm border shadow-sm",
                                                                isLowAccuracy ? "bg-red-100 text-red-700 border-red-200" : "bg-slate-50 text-slate-500 border-slate-100"
                                                            )}>
                                                                {idx + 1}
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Badge className={cn(
                                                                    "px-3 py-1 font-bold text-[10px] uppercase tracking-widest border shadow-none",
                                                                    q.difficulty_label === 'Easy' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                                                        q.difficulty_label === 'Medium' ? "bg-amber-50 text-amber-700 border-amber-100" :
                                                                            "bg-red-50 text-red-700 border-red-100"
                                                                )}>
                                                                    {q.difficulty_label}
                                                                </Badge>
                                                                {isLowAccuracy && (
                                                                    <div className="flex items-center gap-1.5 text-[10px] font-black text-red-500 uppercase tracking-widest mt-1">
                                                                        <AlertCircle className="h-3 w-3" />
                                                                        Flagged for Review
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1">Global Success</span>
                                                            <div className={cn("text-3xl font-black tabular-nums tracking-tighter",
                                                                q.success_rate > 70 ? "text-emerald-500" :
                                                                    q.success_rate > 40 ? "text-amber-500" :
                                                                        "text-red-500"
                                                            )}>{q.success_rate}%</div>
                                                        </div>
                                                    </div>

                                                    <p className="text-slate-800 font-bold text-xl leading-[1.4] tracking-tight">
                                                        {q.question_text}
                                                    </p>

                                                    <div className="space-y-2 mt-2">
                                                        <div className="flex justify-between items-center px-1">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mastery Meter</span>
                                                            <span className="text-[10px] font-bold text-slate-500">{q.success_rate}% Correct</span>
                                                        </div>
                                                        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
                                                            <div
                                                                className={cn(
                                                                    "h-full rounded-full transition-all duration-1000 shadow-sm",
                                                                    q.success_rate > 70 ? "bg-gradient-to-r from-emerald-400 to-emerald-500" :
                                                                        q.success_rate > 40 ? "bg-gradient-to-r from-amber-400 to-amber-500" :
                                                                            "bg-gradient-to-r from-red-400 to-red-500"
                                                                )}
                                                                style={{ width: `${q.success_rate}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="w-full md:w-[380px] bg-slate-50/50 p-8 border-t md:border-t-0 md:border-l border-slate-100 flex flex-col justify-center">
                                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                                        <Filter className="h-3 w-3" />
                                                        Choice Distribution
                                                    </h4>
                                                    <div className="space-y-4">
                                                        {Object.entries(q.option_distribution).map(([opt, count]: [string, any], oIdx) => {
                                                            const percentage = Math.round((count / (analytics.total_attempts || 1)) * 100);
                                                            return (
                                                                <div key={opt} className="space-y-1.5">
                                                                    <div className="flex items-center justify-between px-1">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-[10px] font-black text-slate-400">{opt}</span>
                                                                            {percentage > 50 && <Badge className="h-1.5 w-1.5 rounded-full bg-indigo-500 p-0" />}
                                                                        </div>
                                                                        <span className="text-[10px] font-black text-slate-500">{percentage}%</span>
                                                                    </div>
                                                                    <div className="h-2 w-full bg-white rounded-full relative overflow-hidden border border-slate-200/30">
                                                                        <div
                                                                            className={cn(
                                                                                "h-full rounded-full transition-all duration-1000",
                                                                                oIdx === 0 ? "bg-indigo-400" :
                                                                                    oIdx === 1 ? "bg-purple-400" :
                                                                                        oIdx === 2 ? "bg-blue-400" : "bg-slate-300"
                                                                            )}
                                                                            style={{ width: `${percentage}%` }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    </TabsContent>

                    {/* Student Results Tab */}
                    <TabsContent value="attempts" className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <Card className="rounded-[2.5rem] border-slate-200/60 shadow-2xl shadow-indigo-900/5 overflow-hidden bg-white">
                            <CardHeader className="p-10 border-b border-slate-50 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                                <div>
                                    <CardTitle className="text-3xl font-black flex items-center gap-4">
                                        <div className="p-3 bg-indigo-50 rounded-2xl ring-1 ring-indigo-100 shadow-sm">
                                            <ClipboardList className="h-6 w-6 text-indigo-600" />
                                        </div>
                                        Assessment Roster
                                    </CardTitle>
                                    <CardDescription className="font-bold text-slate-400 mt-2 text-sm">Comprehensive log of individual student performance</CardDescription>
                                </div>
                                <div className="flex items-center gap-4 w-full md:w-auto">
                                    <div className="relative flex-1 md:w-[320px]">
                                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                                        <input
                                            className="h-14 w-full pl-12 pr-6 rounded-[1.25rem] border border-slate-200 bg-slate-50/50 text-sm font-bold focus:outline-none focus:ring-8 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-200 transition-all shadow-inner"
                                            placeholder="Search students..."
                                        />
                                    </div>
                                    <Button variant="outline" size="icon" className="h-14 w-14 rounded-[1.25rem] border-slate-200 bg-white shadow-sm hover:bg-slate-50 text-slate-600 transition-all active:scale-95 border-2">
                                        <Filter className="h-5 w-5" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {exam.type === 'PRACTICE' ? (
                                    /* Practice Exam: Grouped View */
                                    <div className="p-8">
                                        <GroupedParticipantsView groups={attempts} examId={examId} />
                                    </div>
                                ) : (
                                    /* Assessment Exam: Table View */
                                    <Table>
                                        <TableHeader className="bg-slate-50/80">
                                            <TableRow className="border-slate-100 hover:bg-transparent">
                                                <TableHead className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-400 pl-12 py-6">Candidate</TableHead>
                                                <TableHead className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-400">Timestamp</TableHead>
                                                <TableHead className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-400 text-center">Status</TableHead>
                                                <TableHead className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-400 text-center">Score</TableHead>
                                                <TableHead className="text-right pr-12 font-black text-[10px] uppercase tracking-[0.3em] text-slate-400">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {attempts.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center py-32">
                                                        <div className="flex flex-col items-center gap-4">
                                                            <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center">
                                                                <Users className="h-8 w-8 text-slate-200" />
                                                            </div>
                                                            <p className="text-slate-400 font-bold italic tracking-wide">No attempts registered yet.</p>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ) : attempts.map((attempt) => (
                                                <TableRow key={attempt.id} className="group hover:bg-indigo-50/40 transition-all border-slate-50/80">
                                                    <TableCell className="pl-12 py-8">
                                                        <div className="flex items-center gap-5">
                                                            <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-white to-slate-50 border border-slate-200 flex items-center justify-center font-black text-slate-700 shadow-sm relative group-hover:border-indigo-200 transition-colors">
                                                                <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                                                                {attempt.student_name?.[0]}
                                                            </div>
                                                            <div className="flex flex-col gap-1">
                                                                <span className="font-black text-slate-800 tracking-tight text-base group-hover:text-indigo-700 transition-colors">{attempt.student_name}</span>
                                                                <span className="text-[10px] font-black text-indigo-400/80 uppercase tracking-[0.15em]">{attempt.student_roll || "S10293"}</span>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-slate-500 font-bold text-xs tracking-tight">
                                                        <div className="flex flex-col gap-1">
                                                            <span>{new Date(attempt.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                            <span className="text-slate-400 font-medium">{new Date(attempt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <div className={cn(
                                                            "inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] border ring-8 ring-transparent transition-all",
                                                            attempt.passed ? "bg-emerald-50 text-emerald-700 border-emerald-100/50 group-hover:ring-emerald-500/5" : "bg-red-50 text-red-700 border-red-100/50 group-hover:ring-red-500/5"
                                                        )}>
                                                            {attempt.passed ? <UserCheck className="h-3.5 w-3.5" /> : <UserMinus className="h-3.5 w-3.5" />}
                                                            {attempt.passed ? "Cleared" : "Requires Focus"}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="inline-flex flex-col items-center">
                                                            <span className={cn(
                                                                "text-2xl font-black tracking-tighter tabular-nums",
                                                                attempt.passed ? "text-emerald-600" : "text-red-500"
                                                            )}>
                                                                {attempt.score}%
                                                            </span>
                                                            <div className="h-1 w-8 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                                                <div className={cn("h-full rounded-full", attempt.passed ? "bg-emerald-400" : "bg-red-400")} style={{ width: `${attempt.score}%` }} />
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right pr-12">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="rounded-xl h-11 px-6 group-hover:bg-white border-2 border-transparent group-hover:border-slate-100 transition-all font-black text-[10px] uppercase tracking-widest text-indigo-600 hover:text-indigo-700 shadow-none group-hover:shadow-sm"
                                                            onClick={() => router.push(`/manage/exams/${examId}/attempts/${attempt.id}`)}
                                                        >
                                                            Analysis
                                                            <ArrowRight className="h-3.5 w-3.5 ml-2 transition-transform group-hover:translate-x-1" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="remediation" className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                            <Card className="rounded-[3rem] border-white/40 bg-white/60 backdrop-blur-xl shadow-[0_32px_64px_-16px_rgba(79,70,229,0.1)] overflow-hidden border-2">
                                <CardHeader className="p-12 pb-8">
                                    <div className="flex items-center gap-6 mb-8">
                                        <div className="h-20 w-20 rounded-3xl bg-slate-900 border-4 border-white shadow-2xl flex items-center justify-center rotate-[-4deg]">
                                            <PenLine className="h-10 w-10 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-4xl font-black text-slate-900 tracking-tight leading-[1.1]">Remediation<br />Bridge</CardTitle>
                                            <CardDescription className="text-indigo-500 font-black text-[10px] uppercase tracking-[0.3em] mt-2">Executive Guidance</CardDescription>
                                        </div>
                                    </div>
                                    <p className="text-slate-500 font-bold text-lg leading-relaxed italic border-l-4 border-indigo-100 pl-6">"Identify systemic gaps and prescribe tailored interventions to elevate class mastery."</p>
                                </CardHeader>
                                <CardContent className="p-12 pt-0 space-y-10">
                                    <div className="relative group/text">
                                        <div className="absolute inset-0 bg-indigo-500/5 blur-[80px] rounded-[3rem] opacity-0 group-focus-within/text:opacity-100 transition-all duration-1000" />
                                        <textarea
                                            className="w-full min-h-[400px] p-10 rounded-[2.5rem] border-2 border-slate-100 bg-white/50 text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-indigo-500/20 focus:bg-white focus:shadow-[0_20px_50px_rgba(79,70,229,0.05)] transition-all text-xl font-medium leading-[1.6] relative z-10 shadow-inner resize-none"
                                            placeholder="Synthesize insights here... e.g., 'Analysis of Distractor D in Q8 reveals a logical misunderstanding of Induction. We will address this in Friday's review...'"
                                            value={remediationNotes}
                                            onChange={(e) => setRemediationNotes(e.target.value)}
                                        />
                                    </div>

                                    <Button
                                        onClick={handleSaveRemediation}
                                        disabled={isSaving}
                                        className="w-full rounded-[1.5rem] h-20 bg-slate-900 hover:bg-indigo-600 font-black text-xl shadow-2xl shadow-slate-200 transition-all active:scale-[0.98] group/save"
                                    >
                                        {isSaving ? (
                                            <Activity className="h-8 w-8 animate-spin mr-4" />
                                        ) : (
                                            <Save className="h-6 w-6 mr-4 group-hover/save:scale-110 transition-transform" />
                                        )}
                                        Publish to Intelligence Hub
                                    </Button>
                                </CardContent>
                            </Card>

                            <div className="space-y-12 py-8">
                                <div className="space-y-4">
                                    <div className="h-1 w-20 bg-indigo-500 rounded-full" />
                                    <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">Intervention<br />Strategies</h3>
                                    <p className="text-slate-400 font-bold text-sm tracking-wide">DATA-DRIVEN PEDAGOGY FRAMEWORK</p>
                                </div>
                                <div className="grid grid-cols-1 gap-8">
                                    <InsightExample
                                        icon={TrendingUp}
                                        title="Systemic Gaps"
                                        text="If average accuracy drops below 50% across multiple questions in one module, trigger a whole-class review session focusing on foundational concepts."
                                    />
                                    <InsightExample
                                        icon={Target}
                                        title="Distractor Mapping"
                                        text="Map popular wrong answers to specific misconceptions. Use the 'Remediation Bridge' to explain WHY students are choosing these pitfalls."
                                    />
                                    <InsightExample
                                        icon={Award}
                                        title="Mastery Momentum"
                                        text="Acknowledge high-success areas to build confidence before transitioning to more complex downstream topics."
                                    />
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

function MetricCard({ title, value, icon: Icon, color, description, trend }: any) {
    const colors: any = {
        indigo: "text-indigo-600 bg-indigo-50 border-indigo-100",
        emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
        amber: "text-amber-600 bg-amber-50 border-amber-100",
        purple: "text-purple-600 bg-purple-50 border-purple-100"
    };

    return (
        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300">
            <CardContent className="p-8 flex flex-col h-full">
                <div className="flex items-start justify-between mb-6">
                    <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center border shadow-sm", colors[color])}>
                        <Icon className="h-6 w-6" />
                    </div>
                    {trend && (
                        <div className={cn(
                            "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 border",
                            trend === 'up' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"
                        )}>
                            {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingUp className="h-3 w-3 rotate-180" />}
                            {trend === 'up' ? "+2.4%" : "-1.2%"}
                        </div>
                    )}
                </div>
                <div className="mt-2">
                    <h3 className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-1.5">{title}</h3>
                    <div className="text-3xl font-black text-slate-900 tracking-tight">{value}</div>
                    <p className="text-slate-500 text-xs font-semibold leading-relaxed mt-2">{description}</p>
                </div>
            </CardContent>
        </Card>
    );
}

function InsightExample({ icon: Icon, title, text }: any) {
    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:border-indigo-100 transition-all flex gap-4">
            <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5 text-slate-400" />
            </div>
            <div>
                <h4 className="font-bold text-slate-800 mb-1">{title}</h4>
                <p className="text-sm text-slate-500 leading-relaxed">{text}</p>
            </div>
        </div>
    );
}

function ExamDetailSkeleton() {
    return (
        <div className="min-h-screen bg-slate-50">
            <div className="bg-white px-6 py-12 border-b">
                <div className="max-w-7xl mx-auto space-y-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-96" />
                    <Skeleton className="h-6 w-64" />
                </div>
            </div>
            <div className="max-w-7xl mx-auto px-6 mt-8">
                <Skeleton className="h-12 w-[600px] rounded-2xl mb-8" />
                <div className="grid grid-cols-4 gap-6 mb-8">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-3xl" />)}
                </div>
                <div className="grid grid-cols-3 gap-8">
                    <Skeleton className="col-span-2 h-[400px] rounded-3xl" />
                    <Skeleton className="h-[400px] rounded-3xl" />
                </div>
            </div>
        </div>
    );
}
