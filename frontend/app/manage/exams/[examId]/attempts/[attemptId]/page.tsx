"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import {
    ChevronLeft,
    Target,
    CheckCircle2,
    XCircle,
    Clock,
    BarChart3,
    User,
    Lightbulb,
    Sparkles,
    BrainCircuit,
    ArrowRight,
    Search,
    MessageSquare,
    BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

interface QuestionResult {
    question: string;
    explanation: string;
    options: string[];
    correct_answer: string;
    student_answer: string;
    is_correct: boolean;
    topic: string;
}

interface AttemptDetails {
    id: string;
    student_name: string;
    exam_title: string;
    teacher_notes?: string;
    score: number;
    passed: boolean;
    started_at: string;
    submitted_at: string;
    results: QuestionResult[];
    analytics: {
        total_questions: number;
        correct_count: number;
        wrong_count: number;
        accuracy: number;
    };
}

export default function StudentAttemptPage({ params }: { params: Promise<{ examId: string; attemptId: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [attempt, setAttempt] = useState<AttemptDetails | null>(null);
    const [remediation, setRemediation] = useState<string>("");
    const [generating, setGenerating] = useState(false);
    const [filter, setFilter] = useState<'all' | 'correct' | 'wrong'>('all');

    useEffect(() => {
        fetchAttemptDetails();
    }, []);

    const fetchAttemptDetails = async () => {
        try {
            const res = await api.get(`/exams/attempts/${resolvedParams.attemptId}`);
            console.log("=== ATTEMPT DETAILS RESPONSE ===", res.data);
            console.log("Results array:", res.data.results);
            console.log("Analytics:", res.data.analytics);
            console.log("Timestamps:", {
                started_at: res.data.started_at,
                submitted_at: res.data.submitted_at
            });
            setAttempt(res.data);
        } catch (error) {
            console.error("Fetch Error:", error);
            toast.error("Could not load attempt data");
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateRemediation = async () => {
        setGenerating(true);
        try {
            const res = await api.post(`/exams/attempts/${resolvedParams.attemptId}/remediation`);
            setRemediation(res.data.remediation);
            toast.success("AI Remediation Generated");
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate AI guidance");
        } finally {
            setGenerating(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-500 font-bold animate-pulse">Analyzing Performance Data...</p>
                </div>
            </div>
        );
    }

    if (!attempt) return null;

    const filteredResults = attempt.results.filter(r => {
        if (filter === 'correct') return r.is_correct;
        if (filter === 'wrong') return !r.is_correct;
        return true;
    });

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Executive Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-xl hover:bg-slate-100"
                            onClick={() => router.push(`/manage/exams/${resolvedParams.examId}`)}
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <div className="h-8 w-px bg-slate-200" />
                        <div>
                            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                {attempt.student_name}
                                <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-100 font-bold px-2 py-0 h-5 text-[10px] uppercase">
                                    Attempt Details
                                </Badge>
                            </h1>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                {attempt.exam_title}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Analytics & Questions */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Performance Summary Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card className="rounded-2xl border-slate-200 shadow-sm bg-white overflow-hidden group">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
                                        <Target className="h-5 w-5" />
                                    </div>
                                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Accuracy</span>
                                </div>
                                <div className="text-3xl font-black text-slate-900 tabular-nums">{attempt.score}%</div>
                                <Progress value={attempt.score} className="h-1.5 mt-4" />
                            </CardContent>
                        </Card>

                        <Card className="rounded-2xl border-slate-200 shadow-sm bg-white overflow-hidden">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
                                        <CheckCircle2 className="h-5 w-5" />
                                    </div>
                                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Correct</span>
                                </div>
                                <div className="text-3xl font-black text-slate-900 tabular-nums">{attempt.analytics.correct_count}</div>
                                <p className="text-[10px] font-bold text-slate-400 mt-2">TOTAL CORRECT RESPONSES</p>
                            </CardContent>
                        </Card>

                        <Card className="rounded-2xl border-slate-200 shadow-sm bg-white overflow-hidden">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-2.5 bg-red-50 rounded-xl text-red-600">
                                        <XCircle className="h-5 w-5" />
                                    </div>
                                    <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Wrong</span>
                                </div>
                                <div className="text-3xl font-black text-slate-900 tabular-nums">{attempt.analytics.wrong_count}</div>
                                <p className="text-[10px] font-bold text-slate-400 mt-2">CONCEPTS REQUIRING REVIEW</p>
                            </CardContent>
                        </Card>

                        <Card className="rounded-2xl border-slate-200 shadow-sm bg-white overflow-hidden">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600">
                                        <Clock className="h-5 w-5" />
                                    </div>
                                    <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Submitted</span>
                                </div>
                                <div className="text-lg font-black text-slate-900 leading-tight">
                                    {attempt.submitted_at
                                        ? new Date(attempt.submitted_at + 'Z').toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            hour12: true
                                        })
                                        : "N/A"
                                    }
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase">
                                    {attempt.submitted_at
                                        ? new Date(attempt.submitted_at + 'Z').toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })
                                        : "Not submitted"
                                    }
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-black text-slate-900 flex items-center gap-3">
                                <BarChart3 className="h-5 w-5 text-indigo-600" />
                                Question-by-Question Diagnostics
                            </h2>
                            <div className="flex bg-slate-100 p-1 rounded-lg gap-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                        "rounded-md h-8 text-[10px] font-black uppercase px-4",
                                        filter === 'all'
                                            ? "bg-white shadow-sm text-slate-900"
                                            : "text-slate-500 hover:text-slate-700"
                                    )}
                                    onClick={() => setFilter('all')}
                                >
                                    All
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                        "rounded-md h-8 text-[10px] font-black uppercase px-4",
                                        filter === 'correct'
                                            ? "bg-white shadow-sm text-slate-900"
                                            : "text-slate-500 hover:text-slate-700"
                                    )}
                                    onClick={() => setFilter('correct')}
                                >
                                    Correct
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                        "rounded-md h-8 text-[10px] font-black uppercase px-4",
                                        filter === 'wrong'
                                            ? "bg-white shadow-sm text-slate-900"
                                            : "text-slate-500 hover:text-slate-700"
                                    )}
                                    onClick={() => setFilter('wrong')}
                                >
                                    Wrong
                                </Button>
                            </div>
                        </div>

                        {filteredResults.length === 0 ? (
                            <Card className="rounded-2xl border-slate-200 bg-slate-50/50 p-12">
                                <div className="text-center space-y-4">
                                    <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto">
                                        <Search className="h-8 w-8 text-slate-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-700 mb-2">
                                            {filter === 'correct' && "No Correct Answers"}
                                            {filter === 'wrong' && "No Wrong Answers"}
                                            {filter === 'all' && "No Questions"}
                                        </h3>
                                        <p className="text-sm text-slate-500 font-medium">
                                            {filter === 'correct' && "This student didn't answer any questions correctly."}
                                            {filter === 'wrong' && "Great job! All questions were answered correctly."}
                                            {filter === 'all' && "No question data available for this attempt."}
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {filteredResults.map((result, idx) => (
                                    <Card key={idx} className={cn(
                                        "rounded-2xl border shadow-sm transition-all overflow-hidden",
                                        result.is_correct ? "border-emerald-100 bg-white" : "border-red-100 bg-white/50"
                                    )}>
                                        <div className="p-6">
                                            <div className="flex items-start justify-between gap-6 mb-6">
                                                <div className="flex gap-4">
                                                    <div className={cn(
                                                        "h-8 w-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0",
                                                        result.is_correct ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                                                    )}>
                                                        #{idx + 1}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="font-bold text-slate-900 leading-relaxed">{result.question}</p>
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="outline" className="text-[9px] font-black uppercase rounded py-0 border-slate-200 text-slate-400">
                                                                {result.topic}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                                {result.is_correct ? (
                                                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                                                ) : (
                                                    <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                                                {result.options.map((opt, oIdx) => {
                                                    const char = String.fromCharCode(65 + oIdx);
                                                    const isCorrect = char === result.correct_answer;
                                                    const isChosen = char === result.student_answer;

                                                    return (
                                                        <div key={char} className={cn(
                                                            "p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-between",
                                                            isCorrect ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
                                                                isChosen && !isCorrect ? "bg-red-50 border-red-200 text-red-700" :
                                                                    "bg-white border-slate-100 text-slate-400"
                                                        )}>
                                                            <span>{char}. {opt}</span>
                                                            {isChosen && <div className="h-1.5 w-1.5 rounded-full bg-current" />}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {!result.is_correct && (
                                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                                        <Lightbulb className="h-3 w-3 text-amber-500" />
                                                        Explanation
                                                    </div>
                                                    <p className="text-xs text-slate-600 font-medium leading-relaxed">{result.explanation}</p>
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: AI Remediation */}
                <div className="lg:col-span-4 space-y-8">
                    <Card className="rounded-[2rem] border-slate-200 shadow-xl shadow-indigo-900/5 bg-slate-900 text-white overflow-hidden sticky top-28">
                        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10" />
                        <CardHeader className="relative z-10 p-8 border-b border-white/10">
                            <CardTitle className="text-2xl font-black flex items-center gap-3">
                                <Sparkles className="h-6 w-6 text-indigo-400" />
                                Personal Remediation
                            </CardTitle>
                            <CardDescription className="text-white/60 font-bold text-sm">AI-powered cognitive gap analysis and tailored growth plan.</CardDescription>
                        </CardHeader>
                        <CardContent className="relative z-10 p-8">
                            {!remediation && !generating ? (
                                <div className="space-y-6">
                                    {attempt.teacher_notes && (
                                        <div className="bg-white/10 rounded-2xl p-6 border border-white/10 mb-6">
                                            <h3 className="text-xs font-black text-indigo-300 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <User className="h-3 w-3" />
                                                Teacher's Takeaways
                                            </h3>
                                            <p className="text-sm text-slate-200 leading-relaxed font-medium">
                                                {attempt.teacher_notes}
                                            </p>
                                        </div>
                                    )}

                                    <div className="text-center py-6 space-y-6">
                                        <div className="h-16 w-16 bg-white/5 rounded-[1.5rem] border border-white/10 flex items-center justify-center mx-auto">
                                            <BrainCircuit className="h-8 w-8 text-indigo-400" />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="font-bold text-lg">AI Cognitive Analysis</p>
                                            <p className="text-sm text-white/50 leading-relaxed px-4">Generate a deep gap analysis and personalized study plan.</p>
                                        </div>
                                        <Button
                                            className="w-full h-12 rounded-xl bg-white text-slate-900 hover:bg-white/90 font-black text-sm shadow-xl"
                                            onClick={handleGenerateRemediation}
                                        >
                                            <Sparkles className="mr-2 h-4 w-4" />
                                            Generate Plan
                                        </Button>
                                    </div>
                                </div>
                            ) : generating ? (
                                <div className="text-center py-20 space-y-6">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full scale-150 animate-pulse" />
                                        <Sparkles className="h-12 w-12 text-indigo-400 mx-auto animate-bounce" />
                                    </div>
                                    <p className="font-black text-white/80 animate-pulse">Consulting Intelligence Engine...</p>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    <div className="prose prose-invert prose-sm max-w-none">
                                        <ReactMarkdown
                                            components={{
                                                h1: ({ node, ...props }) => <h1 className="text-lg font-black text-indigo-300 mt-6 mb-2 uppercase tracking-widest border-b border-white/10 pb-2" {...props} />,
                                                h2: ({ node, ...props }) => <h2 className="text-base font-black text-indigo-300 mt-4 mb-2 uppercase tracking-wide" {...props} />,
                                                p: ({ node, ...props }) => <p className="text-sm text-slate-300 leading-relaxed font-medium mb-4" {...props} />,
                                                li: ({ node, ...props }) => <li className="text-sm text-slate-300 font-medium mb-2 marker:text-indigo-400" {...props} />,
                                                ul: ({ node, ...props }) => <ul className="space-y-1 mb-4" {...props} />,
                                                strong: ({ node, ...props }) => <strong className="font-black text-white" {...props} />,
                                            }}
                                        >
                                            {remediation}
                                        </ReactMarkdown>
                                    </div>

                                    <div className="pt-6 border-t border-white/10">
                                        <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">Recommended Actions</h4>
                                        <div className="grid grid-cols-1 gap-2">
                                            <Button variant="outline" className="justify-start h-12 rounded-xl bg-white/5 border-white/10 hover:bg-white/10 text-xs font-bold">
                                                <BookOpen className="mr-3 h-4 w-4" />
                                                Review Topic Material
                                            </Button>
                                            <Button variant="outline" className="justify-start h-12 rounded-xl bg-white/5 border-white/10 hover:bg-white/10 text-xs font-bold">
                                                <MessageSquare className="mr-3 h-4 w-4" />
                                                Send Personal Note
                                            </Button>
                                        </div>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        className="w-full text-white/40 hover:text-white hover:bg-white/5 font-bold text-[10px] uppercase tracking-widest"
                                        onClick={handleGenerateRemediation}
                                    >
                                        Regenerate Analysis
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
