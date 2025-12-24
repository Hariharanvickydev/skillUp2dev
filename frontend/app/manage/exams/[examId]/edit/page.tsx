"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import {
    Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Brain,
    ChevronRight,
    Save,
    Plus,
    Trash2,
    CheckCircle2,
    AlertCircle,
    ArrowLeft,
    Eye,
    Upload
} from "lucide-react";
import { getTopicWeight } from '@/lib/sortUtils';
import ExamPreview from '@/components/ExamPreview';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Types
interface Course {
    id: string;
    title: string;
}

interface Topic {
    id: string;
    title: string;
}

interface Question {
    id: string;
    question: string;
    options: string[];
    correct_index: number;
    explanation: string;
    marks: number;
}

export default function EditExamPage() {
    const { token } = useAuth();
    const router = useRouter();
    const params = useParams();
    const examId = params.examId as string;

    // Steps: 0=Metadata, 1=Questions, 2=Preview
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Data
    const [courses, setCourses] = useState<Course[]>([]);
    const [topics, setTopics] = useState<Topic[]>([]);

    // Form State
    const [selectedCourseId, setSelectedCourseId] = useState("");
    const [selectedTopicId, setSelectedTopicId] = useState("");
    const [examCategory, setExamCategory] = useState("PRACTICE"); // PRACTICE or FORMAL
    const [examType, setExamType] = useState("PRACTICE");
    const [examScope, setExamScope] = useState("TOPIC"); // For PRACTICE: TOPIC, MODULE, COURSE
    const [difficulty, setDifficulty] = useState("medium");
    const [duration, setDuration] = useState("30");
    const [passingScore, setPassingScore] = useState("70");
    const [title, setTitle] = useState(""); // Display only for preview

    // Questions State
    const [questions, setQuestions] = useState<Question[]>([]);

    // Data Fetching Helpers
    const fetchCourses = async () => {
        try {
            const res = await axios.get(`${API_URL}/courses`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const sortedCourses = res.data.sort((a: Course, b: Course) =>
                a.title.localeCompare(b.title, undefined, { numeric: true })
            );
            setCourses(sortedCourses);
        } catch (error) {
            console.error("Failed to fetch courses", error);
        }
    };

    const fetchTopics = async (courseId: string) => {
        try {
            const res = await axios.get(`${API_URL}/courses/${courseId}/topics`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const sortedTopics = res.data.sort((a: Topic, b: Topic) => {
                const wa = getTopicWeight(a.title);
                const wb = getTopicWeight(b.title);
                if (wa !== wb) return wa - wb;
                return a.title.localeCompare(b.title);
            });
            setTopics(sortedTopics);
        } catch (error) {
            console.error("Failed to fetch topics", error);
        }
    };

    // Initialize Data
    useEffect(() => {
        const init = async () => {
            if (!token || !examId) return;

            setLoading(true);
            try {
                // 1. Fetch Exam Details
                const examRes = await axios.get(`${API_URL}/exams/${examId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const exam = examRes.data;

                if (exam.num_attempts > 0) {
                    toast.error("Exams with attempts cannot be edited.");
                    router.push('/manage/exams');
                    return;
                }

                // 2. Fetch Courses (Context)
                await fetchCourses();

                // 3. Populate State
                if (exam.course_id) {
                    setSelectedCourseId(exam.course_id);
                    // Fetch topics for this course immediately
                    await fetchTopics(exam.course_id);
                }

                setSelectedTopicId(exam.topic_id || (exam.type === 'PRACTICE' && !exam.topic_id ? 'all_topics' : ""));
                setExamType(exam.type || "PRACTICE");

                // Set category and scope based on exam type
                if (exam.type === 'PRACTICE') {
                    setExamCategory('PRACTICE');
                    setExamScope(exam.scope || 'TOPIC');
                } else {
                    setExamCategory('FORMAL');
                }

                setDifficulty(exam.difficulty);
                setDuration(exam.duration_minutes.toString());
                setPassingScore(exam.passing_score.toString());
                setTitle(exam.title || "Untitled Exam");

                // Populate questions with frontend IDs
                if (exam.questions && Array.isArray(exam.questions)) {
                    setQuestions(exam.questions.map((q: any, i: number) => ({
                        id: Date.now().toString() + i, // Unique ID
                        question: q.question,
                        options: q.options,
                        correct_index: q.correct_index,
                        explanation: q.explanation || "",
                        marks: q.marks || 1
                    })));
                } else {
                    setQuestions([{ id: '1', question: '', options: ['', '', '', ''], correct_index: 0, explanation: '', marks: 1 }]);
                }

            } catch (error) {
                console.error("Failed to load exam", error);
                toast.error("Failed to load exam details");
                router.push('/manage/exams');
            } finally {
                setLoading(false);
            }
        };

        init();
    }, [token, examId]);

    // Handle Course Change (Update Topics)
    const handleCourseChange = (id: string) => {
        setSelectedCourseId(id);
        fetchTopics(id);
        setSelectedTopicId(""); // Reset topic
    };

    // Validation
    const validateMetadata = () => {
        if (!selectedCourseId) { toast.error("Please select a course"); return false; }
        if (examType === 'MODULE' && !selectedTopicId) { toast.error("Select a module"); return false; }
        if (!duration || parseInt(duration) <= 0) { toast.error("Invalid duration"); return false; }
        if (!passingScore || parseInt(passingScore) <= 0 || parseInt(passingScore) > 100) { toast.error("Invalid passing score"); return false; }
        return true;
    };

    const validateQuestions = () => {
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if (!q.question.trim()) { toast.error(`Question ${i + 1} is empty`); return false; }
            if (q.options.some(o => !o.trim())) { toast.error(`Question ${i + 1} has empty options`); return false; }
        }
        return true;
    };

    // Question Management helpers (Same as Create)
    const addQuestion = () => {
        setQuestions([...questions, { id: Date.now().toString(), question: '', options: ['', '', '', ''], correct_index: 0, explanation: '', marks: 1 }]);
    };
    const removeQuestion = (idx: number) => {
        if (questions.length <= 1) return toast.error("Keep at least 1 question");
        const n = [...questions]; n.splice(idx, 1); setQuestions(n);
    };
    const updateQuestion = (idx: number, field: string, val: any) => {
        const n = [...questions]; n[idx] = { ...n[idx], [field]: val }; setQuestions(n);
    };
    const updateOption = (qIdx: number, oIdx: number, val: string) => {
        const n = [...questions]; const o = [...n[qIdx].options]; o[oIdx] = val; n[qIdx].options = o; setQuestions(n);
    };

    // Save / Publish
    const handlePublish = async (isDraft: boolean = false) => {
        if (!validateMetadata()) return;
        if (!isDraft && !validateQuestions()) return;

        setSubmitting(true);
        try {
            // 1. Update Metadata (PUT /manual/{id})
            const finalTopicId = (selectedTopicId === 'all_topics' || !selectedTopicId) ? null : selectedTopicId;

            await axios.put(`${API_URL}/exams/manual/${examId}`, {
                topic_id: finalTopicId,
                course_id: selectedCourseId,
                type: examType,
                scope: examType === 'PRACTICE' ? examScope : null,
                difficulty: difficulty,
                duration_minutes: parseInt(duration),
                passing_score: parseInt(passingScore),
                questions: [] // Explicitly ignored by backend endpoint
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // 2. Update Questions (PUT /{id}/questions)
            const questionsPayload = questions.map(({ id, ...rest }) => rest);
            await axios.put(`${API_URL}/exams/${examId}/questions`, questionsPayload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // 3. Publish (If not draft)
            if (!isDraft) {
                await axios.put(`${API_URL}/exams/${examId}/publish`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            toast.success(isDraft ? "Draft updated successfully!" : "Exam published successfully!");
            router.push('/manage/exams');

        } catch (error: any) {
            console.error("Save failed", error);
            // @ts-ignore
            toast.error(error.response?.data?.detail || "Failed to save exam");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading Exam...</div>;

    // Rich UI from Create Page
    return (
        <div className="max-w-7xl mx-auto p-6 lg:p-10 space-y-8 pb-32">
            {/* Header Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 p-8 text-white shadow-xl shadow-indigo-900/20">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-80 w-80 rounded-full bg-purple-500/20 blur-3xl"></div>

                <div className="relative z-10">
                    <Button variant="ghost" onClick={() => router.push('/manage/exams')} className="text-white bg-white/10 hover:bg-white/20 mb-6 backdrop-blur-sm">
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
                    </Button>
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold backdrop-blur-md">
                            <Brain className="h-3.5 w-3.5" /> Exam Editor
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight">Edit Assessment</h1>
                        <p className="text-indigo-200 lg:max-w-xl text-lg">
                            Update exam details, modify questions, and manage publication settings.
                        </p>
                    </div>
                </div>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center py-6">
                <div className="flex items-center w-full max-w-3xl relative">
                    <div className="absolute left-0 top-1/2 w-full h-1 bg-slate-100 -z-10 rounded-full"></div>
                    <div
                        className="absolute left-0 top-1/2 h-1 bg-indigo-600 -z-10 rounded-full transition-all duration-500"
                        style={{ width: step === 0 ? '0%' : step === 1 ? '50%' : '100%' }}
                    ></div>

                    {[0, 1, 2].map((s) => (
                        <div key={s} className="flex-1 flex justify-center">
                            <div className={`flex flex-col items-center gap-2 ${step >= s ? 'text-indigo-700' : 'text-slate-400'}`}>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 font-bold text-lg transition-all duration-300 bg-white ${step >= s ? 'border-indigo-600 text-indigo-700 scale-110 shadow-lg shadow-indigo-200' : 'border-slate-200 text-slate-400'}`}>
                                    {s + 1}
                                </div>
                                <span className="font-semibold text-sm">
                                    {s === 0 ? "Details" : s === 1 ? "Questions" : "Review"}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Content STEP 1: Metadata */}
            {step === 0 && (
                <Card className="border-0 shadow-2xl shadow-slate-300/50 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 ring-1 ring-slate-900/5">
                    <div className="bg-slate-50/80 p-6 border-b border-slate-200">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <div className="w-1.5 h-6 bg-indigo-600 rounded-full shadow-lg shadow-indigo-500/30"></div>
                            Exam Configuration
                        </h2>
                        <p className="text-slate-500 ml-4 font-medium">Update the core settings for this assessment</p>
                    </div>
                    <CardContent className="p-8 space-y-8 bg-white">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Column 1: Scope Configuration */}
                            <div className="space-y-4">
                                <Label className="text-base font-bold text-slate-800">Exam Scope</Label>
                                <div className="space-y-6 p-6 bg-indigo-50/60 rounded-2xl border border-indigo-100/80 shadow-inner h-full">

                                    {/* 1. Target Course */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-indigo-700 uppercase tracking-wide">Target Course</label>
                                        <Select value={selectedCourseId} onValueChange={handleCourseChange}>
                                            <SelectTrigger className="bg-white border-indigo-200 h-12 text-base shadow-sm focus:ring-2 focus:ring-indigo-500 hover:border-indigo-300 transition-colors">
                                                <SelectValue placeholder="Select a course..." />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-[300px] overflow-y-auto bg-white border border-indigo-100 shadow-xl z-50">
                                                {courses.map(c => (
                                                    <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* 2. Exam Category */}
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-indigo-700 uppercase tracking-wide">Exam Category</Label>
                                        <Select value={examCategory} onValueChange={(val) => {
                                            setExamCategory(val);
                                            if (val === 'PRACTICE') {
                                                setExamType('PRACTICE');
                                                setExamScope('TOPIC');
                                            } else {
                                                setExamType('TOPIC_TEST');
                                            }
                                        }}>
                                            <SelectTrigger className="bg-white h-12 shadow-sm border-indigo-200 hover:border-indigo-300 focus:ring-2 focus:ring-indigo-500 transition-all">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white border border-slate-100 shadow-xl z-50">
                                                <SelectItem value="PRACTICE" className="py-2.5 cursor-pointer">
                                                    <div>
                                                        <div className="font-semibold">Practice Exam</div>
                                                        <div className="text-xs text-slate-500">Ungraded, unlimited attempts</div>
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="FORMAL" className="py-2.5 cursor-pointer">
                                                    <div>
                                                        <div className="font-semibold">Formal Assessment</div>
                                                        <div className="text-xs text-slate-500">Graded, limited attempts</div>
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* 3. Practice Scope or Formal Type */}
                                    {examCategory === 'PRACTICE' ? (
                                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <Label className="text-xs font-bold text-indigo-700 uppercase tracking-wide">Practice Exam Scope</Label>
                                            <Select value={examScope} onValueChange={setExamScope}>
                                                <SelectTrigger className="bg-white h-12 shadow-sm border-indigo-200 hover:border-indigo-300 focus:ring-2 focus:ring-indigo-500 transition-all">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white border border-slate-100 shadow-xl z-50">
                                                    <SelectItem value="TOPIC" className="py-2.5">
                                                        <div>
                                                            <div className="font-semibold">Single Topic</div>
                                                            <div className="text-xs text-slate-500">Practice for one specific topic</div>
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="MODULE" className="py-2.5">
                                                        <div>
                                                            <div className="font-semibold">Entire Module</div>
                                                            <div className="text-xs text-slate-500">All topics in a module</div>
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="COURSE" className="py-2.5">
                                                        <div>
                                                            <div className="font-semibold">Full Course</div>
                                                            <div className="text-xs text-slate-500">All topics across all modules</div>
                                                        </div>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    ) : (
                                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <Label className="text-xs font-bold text-indigo-700 uppercase tracking-wide">Assessment Type</Label>
                                            <Select value={examType} onValueChange={setExamType}>
                                                <SelectTrigger className="bg-white h-12 shadow-sm border-indigo-200 hover:border-indigo-300 focus:ring-2 focus:ring-indigo-500 transition-all">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white border border-slate-100 shadow-xl z-50">
                                                    <SelectItem value="TOPIC_TEST" className="py-2.5">
                                                        <div>
                                                            <div className="font-semibold">Topic Test</div>
                                                            <div className="text-xs text-slate-500">Classroom quiz for specific topic</div>
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="MODULE" className="py-2.5">
                                                        <div>
                                                            <div className="font-semibold">Module Exam</div>
                                                            <div className="text-xs text-slate-500">Covers entire module</div>
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="FINAL" className="py-2.5">
                                                        <div>
                                                            <div className="font-semibold">Final Exam</div>
                                                            <div className="text-xs text-slate-500">Covers entire course</div>
                                                        </div>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    {/* 4. Topic/Module Selection (Conditional) */}
                                    {(examType !== 'FINAL' && !(examType === 'PRACTICE' && examScope === 'COURSE')) && (
                                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <label className="text-xs font-bold text-indigo-700 uppercase tracking-wide">
                                                {examType === 'MODULE' || examScope === 'MODULE' ? 'Select Module' :
                                                    examType === 'TOPIC_TEST' || examScope === 'TOPIC' ? 'Select Topic' : 'Target'}
                                            </label>
                                            <Select value={selectedTopicId} onValueChange={setSelectedTopicId} disabled={!selectedCourseId}>
                                                <SelectTrigger className="bg-white border-indigo-200 h-12 text-base shadow-sm focus:ring-2 focus:ring-indigo-500 hover:border-indigo-300 transition-colors">
                                                    <SelectValue placeholder={selectedCourseId ? "Select..." : "Choose course first"} />
                                                </SelectTrigger>
                                                <SelectContent className="max-h-[300px] overflow-y-auto bg-white border border-indigo-100 shadow-xl z-50">
                                                    {topics.filter(t => {
                                                        if (examType === 'MODULE' || examScope === 'MODULE') {
                                                            return t.title.toUpperCase().trim().startsWith('UNIT') || t.title.toUpperCase().trim().startsWith('MODULE');
                                                        }
                                                        return true;
                                                    }).map(t => (
                                                        <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {(examScope === 'MODULE' || examType === 'MODULE') && selectedTopicId && (
                                                <p className="text-xs text-slate-500 mt-1">
                                                    ℹ️ Questions will cover all topics within this module
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Column 2: Parameters */}
                            <div className="space-y-4">
                                <Label className="text-base font-bold text-slate-800">Parameters</Label>
                                <div className="space-y-5 p-6 bg-slate-50 rounded-2xl border border-slate-200/60 shadow-inner h-full flex flex-col justify-center">
                                    <div className="space-y-5">
                                        <div className="space-y-2">
                                            <Label>Difficulty</Label>
                                            <Select value={difficulty} onValueChange={setDifficulty}>
                                                <SelectTrigger className="bg-white h-12 shadow-sm border-slate-300 hover:border-indigo-400 focus:ring-2 focus:ring-indigo-500 transition-all">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white border border-slate-100 shadow-xl z-50">
                                                    <SelectItem value="easy">Easy</SelectItem>
                                                    <SelectItem value="medium">Medium</SelectItem>
                                                    <SelectItem value="hard">Hard</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Duration (mins)</Label>
                                            <Input type="number" className="bg-white h-12 shadow-sm border-slate-300 hover:border-indigo-400 focus:ring-2 focus:ring-indigo-500 transition-all text-lg font-medium pl-4" value={duration} onChange={e => setDuration(e.target.value)} min={1} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Pass Score (%)</Label>
                                            <Input type="number" className="bg-white h-12 shadow-sm border-slate-300 hover:border-indigo-400 focus:ring-2 focus:ring-indigo-500 transition-all text-lg font-medium pl-4" value={passingScore} onChange={e => setPassingScore(e.target.value)} min={1} max={100} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end p-8 bg-slate-50 border-t border-slate-200">
                        <Button
                            onClick={() => { if (validateMetadata()) setStep(1); }}
                            className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-xl shadow-indigo-300/40 px-10 py-6 text-lg rounded-xl h-auto font-bold transform transition-all hover:-translate-y-1 hover:shadow-2xl"
                        >
                            Next: Questions <ChevronRight className="ml-2 h-5 w-5" />
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {/* Content STEP 2: Questions */}
            {step === 1 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="flex justify-between items-center bg-white p-5 rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 sticky top-6 z-30 backdrop-blur-xl bg-white/95 ring-1 ring-slate-900/5">
                        <div className="flex items-center gap-2">
                            <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-200">
                                <Brain className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-slate-800">Question Builder</h3>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-100 px-2">{questions.length} questions</Badge>
                                    <span className="text-xs text-slate-400">Total Marks: {questions.length}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setStep(0)}>Back</Button>
                            <Button
                                onClick={() => { if (validateQuestions()) setStep(2); }}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 font-bold px-6"
                            >
                                Preview Exam <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {questions.map((q, qIndex) => (
                            <Card key={q.id} className="border-0 shadow-2xl shadow-slate-200/60 rounded-3xl overflow-hidden group hover:shadow-indigo-200/40 transition-all duration-300 ring-1 ring-slate-100">
                                <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-indigo-500 via-purple-500 to-indigo-600"></div>
                                <CardContent className="p-8 space-y-6">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-lg border border-indigo-100 shadow-sm">
                                                {qIndex + 1}
                                            </span>
                                            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Question Content</span>
                                        </div>
                                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors" onClick={() => removeQuestion(qIndex)}>
                                            <Trash2 className="h-5 w-5" />
                                        </Button>
                                    </div>

                                    <div className="space-y-2">
                                        <Textarea
                                            placeholder="Type the question question here..."
                                            value={q.question}
                                            onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                                            className="font-bold text-xl min-h-[120px] bg-white border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 rounded-2xl resize-none p-6 shadow-sm transition-all"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {q.options.map((opt, oIndex) => (
                                            <div key={oIndex}
                                                className={`relative flex items-center p-2 rounded-2xl border-2 transition-all duration-200 group/opt ${q.correct_index === oIndex
                                                    ? 'border-green-500 bg-green-50/30 shadow-md ring-2 ring-green-100'
                                                    : 'border-slate-100 hover:border-indigo-300 bg-white hover:shadow-md'
                                                    }`}
                                            >
                                                <div
                                                    onClick={() => updateQuestion(qIndex, 'correct_index', oIndex)}
                                                    className={`w-12 h-12 flex items-center justify-center cursor-pointer flex-shrink-0 border-r-2 transition-colors ${q.correct_index === oIndex ? 'border-green-100' : 'border-slate-50 group-hover/opt:border-indigo-50'}`}
                                                >
                                                    {q.correct_index === oIndex ? (
                                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                                    ) : (
                                                        <div className="w-5 h-5 rounded-full border-2 border-slate-300 group-hover/opt:border-indigo-400 transition-colors"></div>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <Input
                                                        value={opt}
                                                        onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                                        placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                                                        className="border-none bg-transparent shadow-none focus-visible:ring-0 px-5 h-14 font-medium text-lg text-slate-700 placeholder:text-slate-300"
                                                    />
                                                </div>
                                                <span className={`text-xs font-bold pr-4 transition-colors ${q.correct_index === oIndex ? 'text-green-600' : 'text-slate-300 group-hover/opt:text-indigo-300'}`}>{String.fromCharCode(65 + oIndex)}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pt-4 border-t border-slate-100">
                                        <Label className="text-xs font-bold text-slate-400 uppercase mb-3 block flex items-center gap-2">
                                            <span>Explanation (Optional)</span>
                                            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-medium normal-case">Displayed after checking answer</span>
                                        </Label>
                                        <Textarea
                                            placeholder="Explain why the correct answer is correct..."
                                            value={q.explanation}
                                            onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                                            className="text-base text-slate-600 bg-slate-50/50 border-slate-200 min-h-[100px] rounded-2xl focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all p-4"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        <Button
                            onClick={addQuestion}
                            variant="outline"
                            className="w-full py-10 border-2 border-dashed border-indigo-200/60 bg-indigo-50/10 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-400 hover:shadow-lg rounded-3xl flex flex-col items-center gap-3 h-auto transition-all duration-300 group"
                        >
                            <div className="p-2 bg-indigo-100 rounded-full">
                                <Plus className="h-6 w-6" />
                            </div>
                            <span className="font-semibold text-lg">Add New Question</span>
                        </Button>
                    </div>
                </div>
            )}

            {/* Content STEP 3: Preview */}
            {step === 2 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <Card className="border-0 bg-gradient-to-r from-indigo-50 to-purple-50 shadow-inner rounded-2xl">
                        <CardContent className="p-8">
                            <div className="flex flex-col md:flex-row gap-6 items-center">
                                <div className="p-4 bg-white rounded-full shadow-lg text-indigo-600">
                                    <AlertCircle className="h-8 w-8" />
                                </div>
                                <div className="space-y-2 text-center md:text-left flex-1">
                                    <h3 className="text-xl font-bold text-indigo-900">Review & Update</h3>
                                    <p className="text-indigo-700/80 max-w-2xl">
                                        Verify your changes below. Updating will apply changes immediately. Question contents will be updated for future attempts.
                                    </p>
                                </div>
                                <div className="flex gap-4">
                                    <Button
                                        onClick={() => handlePublish(true)}
                                        disabled={submitting}
                                        variant="outline"
                                        className="bg-white hover:bg-slate-50 text-indigo-700 border-indigo-200 shadow-sm px-8 py-6 rounded-xl text-lg font-bold min-w-[160px]"
                                    >
                                        {submitting ? "Saving..." : "Update Draft"}
                                    </Button>
                                    <Button
                                        onClick={() => handlePublish(false)}
                                        disabled={submitting}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-300 px-8 py-6 rounded-xl text-lg font-bold min-w-[200px]"
                                    >
                                        {submitting ? "Publishing..." : "Update & Publish"}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-6 rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 flex flex-col items-center gap-2 hover:-translate-y-1 transition-transform duration-300">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Questions</span>
                            <span className="text-3xl font-black text-slate-800">{questions.length}</span>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 flex flex-col items-center gap-2 hover:-translate-y-1 transition-transform duration-300">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Difficulty</span>
                            <span className="text-3xl font-black text-indigo-600 capitalize">{difficulty}</span>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 flex flex-col items-center gap-2 hover:-translate-y-1 transition-transform duration-300">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Duration</span>
                            <span className="text-3xl font-black text-slate-800">{duration}m</span>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 flex flex-col items-center gap-2 hover:-translate-y-1 transition-transform duration-300">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pass Score</span>
                            <span className="text-3xl font-black text-green-600">{passingScore}%</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                            <h3 className="text-xl font-bold text-slate-800">Student Preview</h3>
                            <Button variant="outline" size="sm" onClick={() => setStep(1)}>
                                Edit Questions
                            </Button>
                        </div>

                        <ExamPreview
                            title={title || "Exam Preview"}
                            questions={questions}
                            duration={duration}
                            difficulty={difficulty}
                            showAnswersDefault={true}
                        />
                    </div>

                    <div className="h-10"></div>
                </div>
            )}
        </div>
    );
}
