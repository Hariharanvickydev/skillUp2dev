"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Book,
    Search,
    MoreHorizontal,
    Import,
    Layers,
    Clock,
    BarChart2,
    BookOpen,
    Star,
    Plus,
    Sparkles,
    GraduationCap,
    Users,
    UserPlus
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AssignTeacherDialog } from "@/components/dialogs/AssignTeacherDialog";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function CoursesPage() {
    const { token } = useAuth();
    const router = useRouter();
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("published");

    const [assignDialog, setAssignDialog] = useState<{ open: boolean, courseId: string, title: string, assignees: any[] }>({
        open: false,
        courseId: "",
        title: "",
        assignees: []
    })
    const fetchCourses = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/courses`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCourses(response.data);
        } catch (error) {
            console.error("Failed to fetch courses:", error);
            toast.error("Failed to load courses");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, [token]);

    const handleAssignClick = (course: any) => {
        setAssignDialog({
            open: true,
            courseId: course.id,
            title: course.title,
            assignees: course.assignees || (course.assigned_teacher ? [course.assigned_teacher] : [])
        })
    }

    const filteredCourses = courses.filter((course: any) =>
        course.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const publishedCourses = filteredCourses.filter((c: any) => c.status === 'PUBLISHED' || c.status === 'PARTIALLY_PUBLISHED');
    const draftCourses = filteredCourses.filter((c: any) => c.status !== 'PUBLISHED' && c.status !== 'PARTIALLY_PUBLISHED');

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
                                <GraduationCap className="h-3.5 w-3.5" /> Learning Management
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight">My Courses</h1>
                            <p className="text-indigo-200 text-lg max-w-2xl">
                                Manage and track the curriculum for your organization.
                            </p>
                        </div>
                        <Button
                            onClick={() => router.push('/org/library')}
                            className="bg-white text-indigo-900 hover:bg-indigo-50 hover:text-indigo-950 font-semibold shadow-lg shadow-indigo-900/50 border-0"
                            size="lg"
                        >
                            <Import className="mr-2 h-5 w-5" /> Import from Library
                        </Button>
                    </div>

                    {/* Search Bar - Glassmorphism */}
                    <div className="mt-8 bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-white/10 flex flex-col md:flex-row gap-4 max-w-2xl">
                        <div className="flex-1 relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-200 group-focus-within:text-white transition-colors" />
                            <Input
                                placeholder="Search your courses..."
                                className="pl-12 border-0 bg-transparent h-12 text-base text-white placeholder:text-indigo-200/60 focus-visible:ring-0"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Controlled Tabs for programmatic switching */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full block space-y-8">
                {/* Full Width Tabs List matching People Page style */}
                <TabsList className="w-full h-auto bg-white p-1.5 rounded-2xl border border-slate-200/60 shadow-lg shadow-slate-100/50 flex">
                    <TabsTrigger value="published" className="flex-1 rounded-xl px-6 py-3 text-sm font-semibold gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-500 hover:text-indigo-600 transition-all duration-300">
                        Published Courses <Badge className="bg-indigo-100/20 text-indigo-700 data-[state=active]:text-white data-[state=active]:bg-white/20 hover:bg-indigo-100/30 border-0 px-2.5 py-0.5 transition-colors">{publishedCourses.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="drafts" className="flex-1 rounded-xl px-6 py-3 text-sm font-semibold gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-600 data-[state=active]:to-slate-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-500 hover:text-slate-600 transition-all duration-300">
                        Drafts & Imported <Badge className="bg-slate-100 text-slate-700 data-[state=active]:text-white data-[state=active]:bg-white/20 hover:bg-slate-200 border-0 px-2.5 py-0.5 transition-colors">{draftCourses.length}</Badge>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="published" className="space-y-6">
                    {loading ? (
                        <CoursesLoadingGrid />
                    ) : publishedCourses.length === 0 ? (
                        <EmptyState
                            title="No published courses"
                            description="You haven't published any courses yet. Check your drafts to publish one."
                            actionLabel="View Drafts"
                            onAction={() => setActiveTab('drafts')}
                        />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {publishedCourses.map((course) => <CourseCard key={course.id} course={course} router={router} onAssign={() => handleAssignClick(course)} />)}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="drafts" className="space-y-6">
                    {loading ? (
                        <CoursesLoadingGrid />
                    ) : draftCourses.length === 0 ? (
                        <EmptyState
                            title="No drafts found"
                            description="Import a course from the library or create a new one to get started."
                            actionLabel="Browse Library"
                            icon={<Import className="h-6 w-6" />}
                            onAction={() => router.push('/org/library')}
                        />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {draftCourses.map((course) => <CourseCard key={course.id} course={course} router={router} onAssign={() => handleAssignClick(course)} />)}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            <AssignTeacherDialog
                open={assignDialog.open}
                onOpenChange={(open) => setAssignDialog(prev => ({ ...prev, open }))}
                courseId={assignDialog.courseId}
                courseTitle={assignDialog.title}
                currentAssignees={assignDialog.assignees}
                onSuccess={fetchCourses}
            />
        </div>
    );
}

function CourseCard({ course, router, onAssign }: { course: any, router: any, onAssign: () => void }) {
    const gradient = getGradient(course.category);

    return (
        <div
            className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
        >
            <div className={`h-36 w-full bg-gradient-to-r ${gradient} relative`}>


                <div className="absolute bottom-4 left-6">
                    <Badge variant={course.status === 'PUBLISHED' ? 'default' : 'secondary'} className={`shadow-sm backdrop-blur-md ${course.status === 'PUBLISHED' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-white/90 text-slate-800 hover:bg-white'}`}>
                        {course.status === 'PUBLISHED' ? 'Live Course' : course.status === 'PENDING_APPROVAL' ? 'Pending Review' : 'Draft'}
                    </Badge>
                </div>
            </div>

            <div className="p-6 flex-1 flex flex-col">
                <div className="mb-4">
                    <h3 className="text-xl font-bold text-slate-900 line-clamp-2 mb-2 group-hover:text-indigo-600 transition-colors">
                        {course.title}
                    </h3>
                    <p className="text-slate-500 text-sm line-clamp-2 mb-3">
                        {course.description || "No description provided."}
                    </p>

                    {/* Author Information */}
                    <div className="text-xs text-slate-500 mb-3">
                        {(() => {
                            const hasModifications = course.last_modified_by;
                            const hasApproval = course.approved_by;
                            const originalCreator = course.original_creator || course.creator;

                            if (!hasModifications && originalCreator) {
                                return (
                                    <div className="flex items-center gap-1.5">
                                        <span>By {originalCreator.full_name || originalCreator.email}</span>
                                    </div>
                                );
                            }

                            if (hasModifications) {
                                const parts = [];

                                if (originalCreator && course.parent_course_id) {
                                    parts.push(`Created by ${originalCreator.full_name || originalCreator.email}`);
                                }

                                parts.push(`Modified by ${course.last_modified_by.full_name || course.last_modified_by.email}`);

                                if (hasApproval && course.approved_by.id !== course.last_modified_by.id) {
                                    parts.push(`Approved by ${course.approved_by.full_name || course.approved_by.email}`);
                                }

                                return (
                                    <div className="flex items-center gap-1.5">
                                        <span>{parts.join(' • ')}</span>
                                    </div>
                                );
                            }

                            return null;
                        })()}
                    </div>
                </div>

                <div className="mt-auto flex items-center justify-between text-sm text-slate-500 mb-4">
                    <div className="flex items-center gap-1.5">
                        <Layers className="h-4 w-4 text-indigo-500" />
                        <span>Modules</span>
                    </div>
                    {course.difficulty && (
                        <div className="flex items-center gap-1.5">
                            <Star className="h-4 w-4 text-orange-400" />
                            <span>{course.difficulty}</span>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-100">
                    <Button
                        variant="outline"
                        className="w-full border-slate-200 hover:border-indigo-300 text-slate-600 hover:text-indigo-600"
                        onClick={(e) => {
                            e.stopPropagation();
                            onAssign();
                        }}
                    >
                        <Users className="h-4 w-4 mr-2" /> Assign
                    </Button>
                    <Button
                        className="w-full bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                        onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/org/courses/${course.id}`);
                        }}
                    >
                        <BookOpen className="h-4 w-4 mr-2" /> Edit
                    </Button>
                </div>
            </div>
        </div>
    );
}

function EmptyState({ title, description, actionLabel, icon, onAction }: any) {
    return (
        <div className="w-full flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200 text-center">
            <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                {icon || <Book className="h-8 w-8 text-slate-300" />}
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
            <p className="text-slate-500 max-w-md mb-8">{description}</p>
            {actionLabel && (
                <Button onClick={onAction} className="bg-white text-indigo-600 border border-slate-200 hover:bg-slate-50 hover:border-indigo-200">
                    {actionLabel}
                </Button>
            )}
        </div>
    )
}

function CoursesLoadingGrid() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
                <div key={i} className="h-[320px] bg-slate-100 rounded-2xl animate-pulse"></div>
            ))}
        </div>
    )
}

function getGradient(category: string) {
    if (!category) return "from-indigo-500 to-purple-600";
    if (category.includes("Computer")) return "from-blue-600 to-indigo-600";
    if (category.includes("Data")) return "from-emerald-500 to-teal-600";
    if (category.includes("Business")) return "from-orange-500 to-amber-600";
    if (category.includes("Design")) return "from-pink-500 to-rose-600";
    return "from-slate-500 to-slate-600";
}
