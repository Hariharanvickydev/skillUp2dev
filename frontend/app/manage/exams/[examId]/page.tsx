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
    MessageSquare, UserCheck, UserMinus, RotateCcw
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
            const [examRes, analyticsRes, attemptsRes] = await Promise.all([
                api.get(`/exams/${examId}`),
                api.get(`/exams/${examId}/analytics`),
                api.get(`/exams/${examId}/admin/attempts`)
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
        <div className="min-h-screen bg-slate-50/50 pb-12">
            {/* Header / Hero Section */}
            <div className="bg-white border-b border-slate-200">
                <div className="max-w-[1400px] mx-auto px-6 py-8">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.back()}
                        className="mb-4 -ml-2 text-slate-500 hover:text-indigo-600 transition-colors"
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Back to Exams
                    </Button>

                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                                    {exam.type?.replace('_', ' ')}
                                </Badge>
                                <div className="h-1 w-1 rounded-full bg-slate-300" />
                                <span className="text-sm font-medium text-slate-500">{exam.course_title || "Course Assessment"}</span>
                            </div>
                            <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
                                {exam.title}
                            </h1>
                            <p className="text-slate-500 max-w-2xl text-lg leading-relaxed">
                                Created on {new Date(exam.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button variant="outline" className="rounded-xl border-slate-200 shadow-sm" onClick={() => toast.info("Exporting...")}>
                                <Download className="h-4 w-4 mr-2" />
                                Export Data
                            </Button>
                            <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95">
                                <Share2 className="h-4 w-4 mr-2" />
                                Share Report
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto px-6 mt-8">
                <Tabs defaultValue="overview" className="space-y-8">
                    <TabsList className="bg-white p-1 rounded-2xl border border-slate-200 shadow-sm self-start">
                        <TabsTrigger value="overview" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 transition-all font-medium">
                            <Activity className="h-4 w-4 mr-2" />
                            Overview
                        </TabsTrigger>
                        <TabsTrigger value="diagnostics" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 transition-all font-medium">
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Question Diagnostics
                        </TabsTrigger>
                        <TabsTrigger value="attempts" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 transition-all font-medium">
                            <Users className="h-4 w-4 mr-2" />
                            Student Results
                        </TabsTrigger>
                        <TabsTrigger value="remediation" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 transition-all font-medium">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Remediation
                        </TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {/* KPI Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <MetricCard
                                title="Average Score"
                                value={`${analytics?.average_score || 0}%`}
                                icon={Target}
                                color="indigo"
                                description="Class-wide mean score"
                            />
                            <MetricCard
                                title="Pass Rate"
                                value={`${analytics?.pass_rate || 0}%`}
                                icon={CheckCircle2}
                                color="emerald"
                                description="Students who passed"
                            />
                            <MetricCard
                                title="Total Attempts"
                                value={analytics?.total_attempts || 0}
                                icon={RotateCcw}
                                color="amber"
                                description="Global attempt count"
                            />
                            <MetricCard
                                title="Difficulty"
                                value={exam.difficulty}
                                icon={TrendingUp}
                                color="purple"
                                description="Creation-time setting"
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Score Distribution Chart */}
                            <Card className="lg:col-span-2 rounded-3xl border-slate-200 shadow-sm overflow-hidden">
                                <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                                    <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                        <BarChart3 className="h-5 w-5 text-indigo-600" />
                                        Score Distribution
                                    </CardTitle>
                                    <CardDescription>Number of students across score ranges</CardDescription>
                                </CardHeader>
                                <CardContent className="pt-8 h-[400px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={scoreDistData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis
                                                dataKey="range"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#64748b', fontSize: 13 }}
                                                dy={10}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#64748b', fontSize: 13 }}
                                            />
                                            <Tooltip
                                                cursor={{ fill: '#f8fafc' }}
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={50}>
                                                {scoreDistData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={index > 3 ? '#4f46e5' : '#818cf8'} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* Performance Summary */}
                            <Card className="rounded-3xl border-slate-200 shadow-sm bg-indigo-600 text-white overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full -mr-20 -mt-20 shrink-0" />
                                <CardHeader className="relative z-10">
                                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                                        <Award className="h-6 w-6" />
                                        Performance Insights
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="relative z-10 space-y-6 pt-4">
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                                        <p className="text-indigo-100 text-sm font-medium mb-1 uppercase tracking-wider">Historical Best</p>
                                        <div className="text-4xl font-black">{analytics?.high_score || 0}%</div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-indigo-100">Lowest Score</span>
                                            <span className="font-bold">{analytics?.low_score || 0}%</span>
                                        </div>
                                        <Progress value={analytics?.low_score} className="h-2 bg-white/20" />

                                        <div className="flex items-center justify-between text-sm pt-2">
                                            <span className="text-indigo-100">Overall Success Rate</span>
                                            <span className="font-bold">{analytics?.pass_rate}%</span>
                                        </div>
                                        <Progress value={analytics?.pass_rate} className="h-2 bg-white/20" />
                                    </div>

                                    <div className="pt-6">
                                        <Button variant="secondary" className="w-full rounded-xl font-bold text-indigo-700 bg-white hover:bg-slate-50 transition-all border-0 shadow-md">
                                            Generate Group Report
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Diagnostics Tab */}
                    <TabsContent value="diagnostics" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900">Question-Level Mastery</h2>
                                    <p className="text-slate-500">Analyze success rates and distractor patterns</p>
                                </div>
                                <div className="flex gap-2">
                                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 px-3 py-1">Easy: &gt;80%</Badge>
                                    <Badge className="bg-amber-50 text-amber-700 border-amber-100 px-3 py-1">Medium: 50-80%</Badge>
                                    <Badge className="bg-red-50 text-red-700 border-red-100 px-3 py-1">Hard: &lt;50%</Badge>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {analytics?.question_stats.map((q: any, idx: number) => (
                                    <Card key={idx} className="rounded-2xl border-slate-200 shadow-sm hover:border-indigo-200 transition-all overflow-hidden group">
                                        <div className="flex flex-col md:flex-row">
                                            <div className="p-6 flex-1 flex flex-col gap-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <span className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-sm">
                                                            {idx + 1}
                                                        </span>
                                                        <Badge className={cn(
                                                            "px-3 py-0.5",
                                                            q.difficulty_label === 'Easy' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                                                q.difficulty_label === 'Medium' ? "bg-amber-50 text-amber-700 border-amber-100" :
                                                                    "bg-red-50 text-red-700 border-red-100"
                                                        )}>
                                                            {q.difficulty_label}
                                                        </Badge>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Success</span>
                                                        <span className={cn("text-2xl font-black",
                                                            q.success_rate > 70 ? "text-emerald-600" :
                                                                q.success_rate > 40 ? "text-amber-600" :
                                                                    "text-red-500"
                                                        )}>{q.success_rate}%</span>
                                                    </div>
                                                </div>

                                                <p className="text-slate-800 font-semibold text-lg leading-snug">
                                                    {q.question_text}
                                                </p>

                                                <div className="mt-2">
                                                    <Progress value={q.success_rate} className={cn(
                                                        "h-2.5 rounded-full overflow-hidden",
                                                        q.success_rate > 70 ? "[&>div]:bg-emerald-500" :
                                                            q.success_rate > 40 ? "[&>div]:bg-amber-500" :
                                                                "[&>div]:bg-red-500"
                                                    )} />
                                                </div>
                                            </div>

                                            <div className="w-full md:w-[350px] bg-slate-50/80 p-6 border-t md:border-t-0 md:border-l border-slate-100 flex flex-col justify-center">
                                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Choice Distribution</h4>
                                                <div className="space-y-3">
                                                    {Object.entries(q.option_distribution).map(([opt, count]: [string, any]) => (
                                                        <div key={opt} className="flex items-center gap-3">
                                                            <span className="w-4 text-sm font-bold text-slate-400">{opt}</span>
                                                            <div className="flex-1 h-3 bg-slate-200 rounded-full relative overflow-hidden">
                                                                <div
                                                                    className={cn(
                                                                        "h-full rounded-full transition-all duration-1000",
                                                                        idx % 2 === 0 ? "bg-indigo-400" : "bg-purple-400"
                                                                    )}
                                                                    style={{ width: `${(count / (analytics.total_attempts || 1)) * 100}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-xs font-medium text-slate-500 w-8">{count}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </TabsContent>

                    {/* Student Results Tab */}
                    <TabsContent value="attempts" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                                        <ClipboardList className="h-5 w-5 text-indigo-600" />
                                        Student Log
                                    </CardTitle>
                                    <CardDescription>Comprehensive list of all completions</CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <input
                                            className="h-10 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all w-[240px]"
                                            placeholder="Search student..."
                                        />
                                    </div>
                                    <Button variant="outline" size="icon" className="rounded-xl">
                                        <Filter className="h-4 w-4 text-slate-600" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader className="bg-slate-50">
                                        <TableRow className="border-slate-100 hover:bg-transparent">
                                            <TableHead className="font-bold text-slate-600 pl-8">Student Name</TableHead>
                                            <TableHead className="font-bold text-slate-600">Completion Date</TableHead>
                                            <TableHead className="font-bold text-slate-600">Score</TableHead>
                                            <TableHead className="font-bold text-slate-600">Status</TableHead>
                                            <TableHead className="text-right pr-8">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {attempts.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-12 text-slate-400 font-medium">
                                                    No student attempts yet.
                                                </TableCell>
                                            </TableRow>
                                        ) : attempts.map((attempt) => (
                                            <TableRow key={attempt.id} className="group hover:bg-slate-50 transition-colors border-slate-100">
                                                <TableCell className="pl-8 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-50 border border-indigo-200 flex items-center justify-center font-bold text-indigo-600">
                                                            {attempt.student_name?.[0]}
                                                        </div>
                                                        <span className="font-bold text-slate-800">{attempt.student_name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-slate-500 font-medium">
                                                    {new Date(attempt.created_at).toLocaleDateString()} at {new Date(attempt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </TableCell>
                                                <TableCell>
                                                    <span className={cn(
                                                        "text-lg font-black",
                                                        attempt.passed ? "text-emerald-600" : "text-red-500"
                                                    )}>
                                                        {attempt.score}%
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={cn(
                                                        "rounded-lg px-3 py-1",
                                                        attempt.passed ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"
                                                    )}>
                                                        {attempt.passed ? "Passed" : "Failed"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right pr-8">
                                                    <Button variant="ghost" size="sm" className="rounded-xl group-hover:bg-white border border-transparent group-hover:border-slate-200 transition-all font-bold text-indigo-600">
                                                        View Analysis
                                                        <ArrowRight className="h-3 w-3 ml-2" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Remediation Tab */}
                    <TabsContent value="remediation" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <Card className="rounded-3xl border-slate-200 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                                        <PenLine className="h-5 w-5 text-indigo-600" />
                                        Class-Wide Guidance
                                    </CardTitle>
                                    <CardDescription>Leave remediation notes that students will see in their reports.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <textarea
                                        className="w-full min-h-[300px] p-6 rounded-2xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-lg leading-relaxed placeholder:text-slate-400"
                                        placeholder="e.g., Many students are struggling with Big-O complexity in modules 2. Focus on analyzing the nested loops..."
                                        value={remediationNotes}
                                        onChange={(e) => setRemediationNotes(e.target.value)}
                                    />
                                    <div className="flex justify-end">
                                        <Button
                                            onClick={handleSaveRemediation}
                                            disabled={isSaving}
                                            className="rounded-2xl px-8 h-14 bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95"
                                        >
                                            {isSaving ? (
                                                <Activity className="h-4 w-4 animate-spin mr-2" />
                                            ) : (
                                                <Save className="h-4 w-4 mr-2" />
                                            )}
                                            Save Takeaways
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="space-y-6">
                                <h3 className="text-xl font-bold text-slate-800 px-2">Example Use Cases</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    <InsightExample
                                        icon={AlertCircle}
                                        title="For Poor Performance"
                                        text="Address common misconceptions identified in Diagnostics (Tab 2). Explain why the popular wrong answers were incorrect."
                                    />
                                    <InsightExample
                                        icon={TrendingUp}
                                        title="Congratulate & Challenge"
                                        text="If the pass rate is high, offer bonus resources or advanced challenges for the high achievers."
                                    />
                                    <InsightExample
                                        icon={HelpCircle}
                                        title="Outcome Guidance"
                                        text="Suggest specific learning modules students should revisit based on the lowest-scoring questions."
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

function MetricCard({ title, value, icon: Icon, color, description }: any) {
    const colors: any = {
        indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
        emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
        amber: "bg-amber-50 text-amber-600 border-amber-100",
        purple: "bg-purple-50 text-purple-600 border-purple-100"
    };

    return (
        <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden group hover:shadow-md transition-all">
            <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110", colors[color])}>
                        <Icon className="h-6 w-6" />
                    </div>
                </div>
                <div>
                    <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-1">{title}</h3>
                    <div className="text-3xl font-black text-slate-800">{value}</div>
                    <p className="text-slate-400 text-xs mt-2 font-medium">{description}</p>
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
