"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2 } from 'lucide-react';
import {
    FileText,
    Search,
    MoreHorizontal,
    TrendingUp,
    Users,
    CheckCircle,
    Activity,
    Brain,
    Filter,
    Download,
    Eye,
    Ban,
    Archive,
    Plus,
    Edit,
    Star,
    Calendar,
    Clock,
    Copy
} from "lucide-react";
import { CreateExamModal } from "@/components/CreateExamModal";
import { ExamUploadDialog } from "@/components/ExamUploadDialog";
import { AICreationDialog } from "@/components/AICreationDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ExamStats {
    total_exams: number;
    total_attempts: number;
    overall_avg_score: string;
    overall_pass_rate: string;
    active_exams: number;
    draft_exams: number;
}

interface Exam {
    id: string;
    title: string;
    course: string;
    course_title?: string; // For display
    type: string;
    scope?: string; // For PRACTICE exams: TOPIC, MODULE, COURSE
    status: string;
    owner_type: string;
    difficulty: string;
    num_attempts: number;
    avg_score: string;
    pass_rate: string;
    created_at: string;
    // New fields
    num_questions?: number;
    duration_minutes?: number;
    passing_score?: number;
    quality_score?: number;
    is_popular?: boolean;
    is_high_quality?: boolean;
    created_by?: string;
    is_mine?: boolean;
}

export default function OrgExamsPage() {
    const { token, user } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<ExamStats | null>(null);
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("all");

    // Comprehensive Filters
    const [filterCategory, setFilterCategory] = useState("all"); // all, practice, formal
    const [filterCourse, setFilterCourse] = useState("all"); // all, or course_id
    const [filterScope, setFilterScope] = useState("all"); // all, topic, module, course
    const [filterStatus, setFilterStatus] = useState("all"); // all, draft, active, disabled

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [examToDelete, setExamToDelete] = useState<string | null>(null);

    // Get unique courses from exams
    const uniqueCourses = Array.from(new Set(exams.map(e => e.course_title).filter(Boolean)));
    // Modal States
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [aiModalOpen, setAiModalOpen] = useState(false);
    const [uploadModalOpen, setUploadModalOpen] = useState(false);

    const isTeacher = user?.role === 'TEACHER';




    useEffect(() => {
        fetchData();
    }, [token]);

    const fetchData = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const [statsRes, examsRes] = await Promise.all([
                axios.get(`${API_URL}/exams/org/stats`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${API_URL}/exams/org`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);
            setStats(statsRes.data);
            setExams(examsRes.data);
        } catch (error) {
            console.error("Failed to fetch exam data", error);
            toast.error("Failed to load exam data");
        } finally {
            setLoading(false);
        }
    };

    // Helper function to get exam type badge
    const getExamTypeBadge = (exam: Exam) => {
        if (exam.type === "PRACTICE") {
            const scopeLabel = exam.scope === "TOPIC" ? "Topic" :
                exam.scope === "MODULE" ? "Module" :
                    exam.scope === "COURSE" ? "Course" : "Practice";
            return (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Practice - {scopeLabel}
                </Badge>
            );
        } else if (exam.type === "TOPIC_TEST") {
            return (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    Topic Test
                </Badge>
            );
        } else if (exam.type === "MODULE") {
            return (
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                    Module Exam
                </Badge>
            );
        } else if (exam.type === "FINAL") {
            return (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    Final Exam
                </Badge>
            );
        }
        return <Badge variant="outline">{exam.type}</Badge>;
    };

    // Count active filters
    const activeFiltersCount = [
        filterCategory !== "all",
        filterCourse !== "all",
        filterScope !== "all"
    ].filter(Boolean).length;

    const filteredExams = exams.filter((exam) => {
        // Search filter
        const matchesSearch = exam.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            exam.course?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            exam.course_title?.toLowerCase().includes(searchQuery.toLowerCase());

        // Category filter (Practice vs Formal)
        const matchesCategory = filterCategory === "all" ||
            (filterCategory === "practice" && exam.type === "PRACTICE") ||
            (filterCategory === "formal" && exam.type !== "PRACTICE");

        // Course filter
        const matchesCourse = filterCourse === "all" ||
            exam.course_title === filterCourse ||
            exam.course === filterCourse;

        // Scope filter (for practice exams by scope, for formal by type)
        let matchesScope = filterScope === "all";
        if (!matchesScope) {
            if (exam.type === "PRACTICE") {
                // For practice exams, filter by scope field
                matchesScope = exam.scope?.toLowerCase() === filterScope.toLowerCase();
            } else {
                // For formal exams, filter by type field
                if (filterScope === "topic") matchesScope = exam.type === "TOPIC_TEST";
                else if (filterScope === "module") matchesScope = exam.type === "MODULE";
                else if (filterScope === "course") matchesScope = exam.type === "FINAL";
            }
        }

        // Status filter
        const matchesStatus = filterStatus === "all" ||
            exam.status?.toUpperCase() === filterStatus.toUpperCase();

        // Tab filter
        let matchesTab = true;
        if (activeTab === "active") matchesTab = exam.status === "ACTIVE" || exam.status === "Active";
        else if (activeTab === "draft") matchesTab = exam.status === "DRAFT" || exam.status === "Draft";
        else if (activeTab === "disabled") matchesTab = exam.status === "DISABLED";

        return matchesSearch && matchesCategory && matchesCourse && matchesScope && matchesStatus && matchesTab;
    });

    const formatDate = (dateString: string) => {
        if (!dateString) return 'Unknown date';
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return date.toLocaleDateString();
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty?.toLowerCase()) {
            case 'easy': return 'bg-green-100 text-green-700 border-green-200';
            case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'hard': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'bg-green-100 text-green-700 border-green-200';
            case 'DRAFT': return 'bg-gray-100 text-gray-700 border-gray-200';
            case 'DISABLED': return 'bg-red-100 text-red-700 border-red-200';
            case 'ARCHIVED': return 'bg-slate-100 text-slate-700 border-slate-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getOwnerTypeIcon = (ownerType: string) => {
        switch (ownerType) {
            case 'TEACHER': return '👨‍🏫';
            case 'STUDENT': return '👨‍🎓';
            case 'SYSTEM': return '🤖';
            default: return '❓';
        }
    };

    const handleCreateSelect = (method: 'manual' | 'ai' | 'upload') => {
        setCreateModalOpen(false);
        if (method === 'manual') router.push('/manage/exams/create');
        if (method === 'ai') setAiModalOpen(true);
        if (method === 'upload') setUploadModalOpen(true);
    };

    const handleUpdateStatus = async (examId: string, newStatus: string) => {
        try {
            await axios.put(`${API_URL}/exams/${examId}/status`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(`Exam ${newStatus.toLowerCase()} successfully`);
            fetchData(); // Refresh list
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.detail || "Failed to update status");
        }
    };

    const handleCloneExam = async (examId: string) => {
        router.push(`/manage/exams/create?from=${examId}`);
    };

    const handleDeleteExam = async () => {
        if (!examToDelete) return;

        try {
            const examId = examToDelete;
            await axios.delete(`${API_URL}/exams/${examId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Exam deleted successfully");
            setDeleteDialogOpen(false);
            setExamToDelete(null);
            fetchData(); // Refresh list
        } catch (error: any) {
            console.error(error);
            // If backend rejects due to attempts, suggest deactivation
            if (error.response?.status === 400 && error.response?.data?.detail?.includes("attempts")) {
                toast.error(error.response.data.detail, {
                    action: {
                        label: "Deactivate Instead",
                        onClick: () => handleUpdateStatus(examToDelete!, "DISABLED")
                    }
                });
            } else {
                toast.error(error.response?.data?.detail || "Failed to delete exam");
            }
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-6 lg:p-10 space-y-8 pb-20">
            {/* Refined Header Section */}
            <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-10 shadow-sm">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-indigo-50/20 blur-[100px]" />
                <div className="relative z-10">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold uppercase tracking-widest">
                                {user?.role === 'TEACHER' ? "Teacher Repository" : "Management Dashboard"}
                            </div>
                            <div className="space-y-1">
                                <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                                    {user?.role === 'TEACHER' ? "Question Bank" : "Institutional Hub"}
                                </h1>
                                <p className="text-slate-500 font-medium text-base lg:max-w-2xl">
                                    {user?.role === 'TEACHER'
                                        ? "Create, manage, and monitor assessments for your student cohorts."
                                        : "Strategic command center for organizational assessment performance."
                                    }
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={() => setCreateModalOpen(true)}
                            className="h-14 px-8 rounded-xl bg-slate-900 hover:bg-indigo-600 font-bold text-base shadow-lg transition-all active:scale-95"
                        >
                            <Plus className="mr-2 h-5 w-5" />
                            Create New Exam
                        </Button>
                    </div>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <StatCard
                    title={isTeacher ? "My Exams" : "Total Exams"}
                    value={stats?.total_exams || 0}
                    icon={<FileText className="h-6 w-6 text-white" />}
                    gradient="from-blue-600 to-blue-400"
                    subtext={`${stats?.active_exams || 0} active`}
                />
                <StatCard
                    title="Total Attempts"
                    value={stats?.total_attempts || 0}
                    icon={<Users className="h-6 w-6 text-white" />}
                    gradient="from-violet-600 to-violet-400"
                    subtext="Student submissions"
                />
                <StatCard
                    title="Average Score"
                    value={stats?.overall_avg_score || "N/A"}
                    icon={<TrendingUp className="h-6 w-6 text-white" />}
                    gradient="from-emerald-600 to-emerald-400"
                    subtext="Overall performance"
                />
                <StatCard
                    title="Pass Rate"
                    value={stats?.overall_pass_rate || "N/A"}
                    icon={<CheckCircle className="h-6 w-6 text-white" />}
                    gradient="from-orange-600 to-orange-400"
                    subtext="Students passing"
                />
            </div>

            {/* Filters and Search */}
            <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search exams by title or course..."
                                className="pl-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="all">All</TabsTrigger>
                                <TabsTrigger value="active">Active</TabsTrigger>
                                <TabsTrigger value="draft">Draft</TabsTrigger>
                                <TabsTrigger value="disabled">Disabled</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    {/* Comprehensive Filters */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
                        {/* Category Filter */}
                        <Select value={filterCategory} onValueChange={setFilterCategory}>
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                <SelectItem value="practice">Practice Exams</SelectItem>
                                <SelectItem value="formal">Formal Assessments</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Course Filter (if multiple courses) */}
                        {uniqueCourses.length > 1 && (
                            <Select value={filterCourse} onValueChange={setFilterCourse}>
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Course" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Courses</SelectItem>
                                    {uniqueCourses.map(course => course && (
                                        <SelectItem key={course} value={course}>{course}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        {/* Scope Filter - for both Practice and Formal */}
                        <Select value={filterScope} onValueChange={setFilterScope}>
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder="Scope" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Scopes</SelectItem>
                                {filterCategory === "practice" ? (
                                    <>
                                        <SelectItem value="topic">Topic Level</SelectItem>
                                        <SelectItem value="module">Module Level</SelectItem>
                                        <SelectItem value="course">Course Level</SelectItem>
                                    </>
                                ) : (
                                    <>
                                        <SelectItem value="topic">Topic Tests</SelectItem>
                                        <SelectItem value="module">Module Exams</SelectItem>
                                        <SelectItem value="course">Final Exams</SelectItem>
                                    </>
                                )}
                            </SelectContent>
                        </Select>

                        {/* Clear Filters Button */}
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9"
                            onClick={() => {
                                setFilterCategory("all");
                                setFilterCourse("all");
                                setFilterScope("all");
                            }}
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            Clear {activeFiltersCount > 0 && `(${activeFiltersCount})`}
                        </Button>
                    </div>

                    {/* Active Filters Indicator */}
                    {activeFiltersCount > 0 && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                            <Badge variant="secondary" className="text-xs">
                                {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} active
                            </Badge>
                            <span className="text-xs">• {filteredExams.length} exam{filteredExams.length !== 1 ? 's' : ''} found</span>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Exam List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-12">
                        <Activity className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
                        <p className="text-slate-500">Loading exams...</p>
                    </div>
                ) : filteredExams.length === 0 ? (
                    <Card className="text-center py-12">
                        <Brain className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">No exams found</h3>
                        <p className="text-slate-500">
                            {searchQuery ? "Try adjusting your search" : "No exams have been created yet"}
                        </p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredExams.map((exam) => (
                            <Card key={exam.id} className="group relative bg-white rounded-2xl border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-300 overflow-hidden">
                                <CardContent className="p-7">
                                    <div className="flex justify-between items-start mb-5">
                                        <div className="flex flex-wrap gap-2">
                                            {getExamTypeBadge(exam)}
                                            <Badge className={cn("rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border shadow-none", getDifficultyColor(exam.difficulty))}>
                                                {exam.difficulty}
                                            </Badge>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg transition-colors">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="rounded-xl p-1.5 border-slate-200 shadow-xl">
                                                <DropdownMenuItem onClick={() => router.push(`/manage/exams/${exam.id}`)} className="rounded-lg py-2 font-bold text-xs">
                                                    <Eye className="mr-2 h-4 w-4 text-slate-400" />
                                                    View Intelligence
                                                </DropdownMenuItem>
                                                <div className="h-px bg-slate-100 my-1" />
                                                {(exam.status === 'ACTIVE' || exam.status === 'Active') ? (
                                                    <DropdownMenuItem onClick={() => handleUpdateStatus(exam.id, 'DISABLED')} className="rounded-lg py-2 font-bold text-xs text-amber-600">
                                                        <Ban className="mr-2 h-4 w-4" />
                                                        Deactivate
                                                    </DropdownMenuItem>
                                                ) : (
                                                    <DropdownMenuItem onClick={() => handleUpdateStatus(exam.id, 'ACTIVE')} className="rounded-lg py-2 font-bold text-xs text-green-600">
                                                        <CheckCircle className="mr-2 h-4 w-4" />
                                                        Activate
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setExamToDelete(exam.id);
                                                        setDeleteDialogOpen(true);
                                                    }}
                                                    className="rounded-lg py-2 font-bold text-xs text-red-600 focus:text-red-700 focus:bg-red-50"
                                                >
                                                    <Archive className="mr-2 h-4 w-4" />
                                                    Archive Exam
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    <div className="mb-6 space-y-3">
                                        <h3 className="text-xl font-black text-slate-900 line-clamp-2 leading-tight group-hover:text-indigo-700 transition-colors">
                                            {exam.title}
                                        </h3>
                                        <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest bg-slate-50 w-fit px-2 py-1 rounded">
                                            {exam.course_title || exam.course}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 py-5 border-y border-slate-50 mb-6">
                                        <div className="space-y-0.5">
                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Success Rate</div>
                                            <div className="font-black text-slate-900 text-base tabular-nums">
                                                {exam.pass_rate || "0%"}
                                            </div>
                                        </div>
                                        <div className="space-y-0.5">
                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Duration</div>
                                            <div className="font-black text-slate-900 text-base tabular-nums flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5 text-slate-300" />
                                                {exam.duration_minutes || "30"}m
                                            </div>
                                        </div>
                                        <div className="space-y-0.5">
                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Attempts</div>
                                            <div className="font-black text-slate-900 text-base tabular-nums text-slate-600">
                                                {exam.num_attempts}
                                            </div>
                                        </div>
                                        <div className="space-y-0.5">
                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Accuracy</div>
                                            <div className="font-black text-indigo-600 text-base tabular-nums flex items-center gap-1.5">
                                                <TrendingUp className="w-3.5 h-3.5" />
                                                {exam.avg_score}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest mb-6">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {formatDate(exam.created_at)}
                                        </div>
                                        <Badge variant="outline" className={cn("rounded-md px-2 py-0.5 shadow-none text-[10px]", getStatusColor(exam.status))}>
                                            {exam.status}
                                        </Badge>
                                    </div>

                                    <div className="flex gap-2.5">
                                        <Button
                                            variant="outline"
                                            className="flex-1 h-10 rounded-xl border-slate-200 hover:bg-slate-50 font-bold text-xs"
                                            onClick={() => router.push(`/manage/exams/${exam.id}/preview`)}
                                        >
                                            Preview
                                        </Button>
                                        {exam.num_attempts === 0 ? (
                                            <Button
                                                className="flex-1 h-10 rounded-xl bg-slate-900 hover:bg-indigo-600 font-bold text-xs transition-all shadow-md"
                                                onClick={() => router.push(`/manage/exams/${exam.id}/edit`)}
                                            >
                                                Edit
                                            </Button>
                                        ) : (
                                            <Button
                                                className="flex-1 h-10 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 font-bold text-xs"
                                                onClick={() => handleCloneExam(exam.id)}
                                            >
                                                Clone
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Dialogs */}
            <CreateExamModal
                open={createModalOpen}
                onOpenChange={setCreateModalOpen}
                onSelect={handleCreateSelect}
            />
            <AICreationDialog
                open={aiModalOpen}
                onOpenChange={setAiModalOpen}
            />
            <ExamUploadDialog
                open={uploadModalOpen}
                onOpenChange={setUploadModalOpen}
            />

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete Exam"
                description="Are you sure you want to delete this exam? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={handleDeleteExam}
                variant="destructive"
            />
        </div>
    );
}

function StatCard({ title, value, icon, gradient, subtext }: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    gradient: string;
    subtext: string;
}) {
    return (
        <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-7 text-white shadow-sm transition-all duration-300`}>
            <div className="relative z-10 flex flex-col justify-between h-full gap-6">
                <div className="flex items-start justify-between">
                    <div className="rounded-xl bg-white/10 p-3 backdrop-blur-md border border-white/20">
                        {icon}
                    </div>
                </div>
                <div>
                    <h3 className="font-bold text-white/80 text-[10px] uppercase tracking-widest mb-1">{title}</h3>
                    <div className="text-3xl font-black tracking-tight tabular-nums">{value}</div>
                    <p className="text-[10px] font-medium text-white/60 mt-1 uppercase tracking-widest">{subtext}</p>
                </div>
            </div>
        </div>
    );
}
