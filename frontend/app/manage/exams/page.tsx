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
            {/* Header Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 p-8 text-white shadow-xl shadow-indigo-900/20">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-80 w-80 rounded-full bg-purple-500/20 blur-3xl"></div>

                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold backdrop-blur-md">
                                <Brain className="h-3.5 w-3.5" />
                                {user?.role === 'TEACHER' ? "My Question Bank" :
                                    user?.role === 'DEPT_HEAD' ? "Departmental Assessments" :
                                        "Institution Assessments"}
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight">
                                {user?.role === 'TEACHER' ? "My Exams" :
                                    user?.role === 'DEPT_HEAD' ? "Department Overview" :
                                        "Exam Dashboard"}
                            </h1>
                            <p className="text-indigo-200 lg:max-w-xl">
                                {user?.role === 'TEACHER'
                                    ? "Create and manage the exams you have created for your topics"
                                    : user?.role === 'DEPT_HEAD'
                                        ? "Manage assessments and track student performance within your department"
                                        : "Monitor and manage all assessments across your entire organization"
                                }
                            </p>
                        </div>
                        <Button
                            onClick={() => setCreateModalOpen(true)}
                            className="bg-white text-indigo-900 hover:bg-indigo-50 font-semibold shadow-lg shadow-indigo-900/20"
                        >
                            <Plus className="mr-2 h-4 w-4" /> Create Exam
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
                            <Card key={exam.id} className="group relative bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-300">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex flex-wrap gap-2">
                                            <Badge className={getDifficultyColor(exam.difficulty)}>
                                                {exam.difficulty}
                                            </Badge>
                                            {exam.is_popular && (
                                                <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                                                    🔥 Popular
                                                </Badge>
                                            )}
                                            {exam.is_high_quality && (
                                                <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                                                    ⭐ Quality
                                                </Badge>
                                            )}
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="-mr-2 -mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => router.push(`/manage/exams/${exam.id}`)}>
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    View Details
                                                </DropdownMenuItem>

                                                <DropdownMenuItem onClick={() => handleCloneExam(exam.id)}>
                                                    <Copy className="mr-2 h-4 w-4" />
                                                    Clone Exam
                                                </DropdownMenuItem>

                                                {/* Status Actions */}
                                                {(exam.status === 'ACTIVE' || exam.status === 'Active') ? (
                                                    <DropdownMenuItem onClick={() => handleUpdateStatus(exam.id, 'DISABLED')} className="text-amber-600">
                                                        <Ban className="mr-2 h-4 w-4" />
                                                        Deactivate
                                                    </DropdownMenuItem>
                                                ) : (
                                                    <DropdownMenuItem onClick={() => handleUpdateStatus(exam.id, 'ACTIVE')} className="text-green-600">
                                                        <CheckCircle className="mr-2 h-4 w-4" />
                                                        Activate
                                                    </DropdownMenuItem>
                                                )}

                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setExamToDelete(exam.id);
                                                        setDeleteDialogOpen(true);
                                                    }}
                                                    className="text-red-600 focus:text-red-700 focus:bg-red-50"
                                                >
                                                    <Archive className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>

                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    <div className="mb-6 space-y-3">
                                        {/* Exam Type Badge */}
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {getExamTypeBadge(exam)}
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-800 line-clamp-2 leading-tight group-hover:text-indigo-700 transition-colors">
                                            {exam.title}
                                        </h3>
                                        <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
                                            <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">{exam.course}</span>
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50 mb-4">
                                        <div className="space-y-1">
                                            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Questions</div>
                                            <div className="font-semibold text-slate-700 flex items-center gap-2">
                                                <span>{exam.num_questions || "?"}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Duration</div>
                                            <div className="font-semibold text-slate-700 flex items-center gap-2">
                                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                <span>{exam.duration_minutes || "30"}m</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Attempts</div>
                                            <div className="font-semibold text-slate-700 flex items-center gap-2">
                                                <Users className="w-3.5 h-3.5 text-slate-400" />
                                                <span>{exam.num_attempts}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Avg Score</div>
                                            <div className="font-semibold text-slate-700 flex items-center gap-2">
                                                <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                                                <span>{exam.avg_score}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <Calendar className="w-4 h-4" />
                                            <span>{formatDate(exam.created_at)}</span>
                                        </div>
                                        <Badge variant="outline" className={`${getStatusColor(exam.status)}`}>
                                            {exam.status}
                                        </Badge>
                                    </div>

                                    {/* Quick Action Button */}
                                    <div className="mt-6 pt-4 border-t border-slate-50 flex gap-2">
                                        <Button
                                            variant="outline"
                                            className="flex-1 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                                            onClick={() => router.push(`/manage/exams/${exam.id}/preview`)}
                                        >
                                            Preview
                                        </Button>
                                        {exam.num_attempts === 0 ? (
                                            <Button
                                                className="flex-1 bg-slate-900 hover:bg-indigo-600 transition-colors"
                                                onClick={() => router.push(`/manage/exams/${exam.id}/edit`)}
                                            >
                                                Edit
                                            </Button>
                                        ) : (
                                            <Button
                                                className="flex-1 bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 transition-colors"
                                                onClick={() => handleCloneExam(exam.id)}
                                            >
                                                <Copy className="mr-2 h-4 w-4" />
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
        <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} p-6 text-white shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group`}>
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/20 blur-2xl group-hover:bg-white/30 transition-all duration-500"></div>
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-20 w-20 rounded-full bg-black/10 blur-xl"></div>

            <div className="relative z-10 flex items-start justify-between">
                <div>
                    <h3 className="font-medium text-white/90 text-sm tracking-wide">{title}</h3>
                    <div className="mt-3 text-4xl font-bold tracking-tight">{value}</div>
                    <p className="mt-2 text-xs text-white/80 font-medium bg-white/10 px-2 py-1 rounded-lg w-fit backdrop-blur-sm border border-white/5">
                        {subtext}
                    </p>
                </div>
                <div className="rounded-2xl bg-white/20 p-3 backdrop-blur-md border border-white/20 shadow-inner">
                    {icon}
                </div>
            </div>
        </div>
    );
}
