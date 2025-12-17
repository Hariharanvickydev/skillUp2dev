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
    BookOpen,
    Star,
    Layers,
    Users,
    UserPlus,
    GraduationCap
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AssignTeacherDialog } from "@/components/dialogs/AssignTeacherDialog";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function HODCoursesPage() {
    const { token, user } = useAuth();
    const router = useRouter();
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("all");

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
            // This now returns courses for the HOD's department (Org Group) + Assigned
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
                                <GraduationCap className="h-3.5 w-3.5" /> Department Management
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight">Department Courses</h1>
                            <p className="text-indigo-200 text-lg max-w-2xl">
                                Oversee and review curriculum across your department.
                            </p>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="mt-8 bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-white/10 flex flex-col md:flex-row gap-4 max-w-2xl">
                        <div className="flex-1 relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-200 group-focus-within:text-white transition-colors" />
                            <Input
                                placeholder="Search courses..."
                                className="pl-12 border-0 bg-transparent h-12 text-base text-white placeholder:text-indigo-200/60 focus-visible:ring-0"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full block space-y-8">
                <TabsList className="w-full h-auto bg-white p-1.5 rounded-2xl border border-slate-200/60 shadow-lg shadow-slate-100/50 flex">
                    <TabsTrigger value="all" className="flex-1 rounded-xl px-6 py-3 text-sm font-semibold gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-500 hover:text-indigo-600 transition-all duration-300">
                        All Courses <Badge className="bg-indigo-100/20 text-indigo-700 data-[state=active]:text-white data-[state=active]:bg-white/20 hover:bg-indigo-100/30 border-0 px-2.5 py-0.5 transition-colors">{filteredCourses.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="published" className="flex-1 rounded-xl px-6 py-3 text-sm font-semibold gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-500 hover:text-emerald-600 transition-all duration-300">
                        Published <Badge className="bg-emerald-100/20 text-emerald-700 data-[state=active]:text-white data-[state=active]:bg-white/20 hover:bg-emerald-100/30 border-0 px-2.5 py-0.5 transition-colors">{publishedCourses.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="drafts" className="flex-1 rounded-xl px-6 py-3 text-sm font-semibold gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-600 data-[state=active]:to-slate-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-500 hover:text-slate-600 transition-all duration-300">
                        Drafts & Review <Badge className="bg-slate-100 text-slate-700 data-[state=active]:text-white data-[state=active]:bg-white/20 hover:bg-slate-200 border-0 px-2.5 py-0.5 transition-colors">{draftCourses.length}</Badge>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-6">
                    {loading ? <CoursesLoadingGrid /> : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredCourses.map((course) => <CourseCard key={course.id} course={course} router={router} onAssign={() => handleAssignClick(course)} isHOD={true} />)}
                        </div>
                    )}
                </TabsContent>
                <TabsContent value="published" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {publishedCourses.map((course) => <CourseCard key={course.id} course={course} router={router} onAssign={() => handleAssignClick(course)} isHOD={true} />)}
                    </div>
                </TabsContent>
                <TabsContent value="drafts" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {draftCourses.map((course) => <CourseCard key={course.id} course={course} router={router} onAssign={() => handleAssignClick(course)} isHOD={true} />)}
                    </div>
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

function CourseCard({ course, router, onAssign, isHOD }: { course: any, router: any, onAssign: () => void, isHOD: boolean }) {
    const gradient = getGradient(course.category);

    return (
        <div className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
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

                    {/* Assignees Pill */}
                    {(course.assignees?.length > 0 || course.assigned_teacher) ? (
                        <div
                            className={`inline-flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-md border border-slate-100 ${isHOD ? 'cursor-pointer hover:bg-slate-100' : ''}`}
                            onClick={(e) => {
                                if (isHOD) {
                                    e.stopPropagation();
                                    onAssign();
                                }
                            }}
                        >
                            <Users className="h-3 w-3 text-indigo-500" />
                            <span className="text-xs text-slate-600 font-medium">
                                {course.assigned_teacher?.full_name || "Unassigned"}
                            </span>
                        </div>
                    ) : (
                        isHOD && (
                            <div className="inline-flex items-center gap-2 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100 cursor-pointer hover:bg-indigo-100 transition-colors"
                                onClick={(e) => { e.stopPropagation(); onAssign(); }}>
                                <UserPlus className="h-3 w-3 text-indigo-600" />
                                <span className="text-xs text-indigo-600 font-medium">Assign Teacher</span>
                            </div>
                        )
                    )}
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
                    {isHOD && (
                        <Button
                            variant="outline"
                            className="w-full border-slate-200 hover:border-indigo-300 text-slate-600 hover:text-indigo-600 font-medium"
                            onClick={(e) => { e.stopPropagation(); onAssign(); }}
                        >
                            <Users className="h-4 w-4 mr-2" /> Assign
                        </Button>
                    )}
                    <Button
                        className={`w-full ${isHOD ? '' : 'col-span-2'} bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 font-medium`}
                        onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/org/courses/${course.id}`); // Leads to Course Editor/Viewer
                        }}
                    >
                        <BookOpen className="h-4 w-4 mr-2" /> {isHOD ? "Review" : "Open"}
                    </Button>
                </div>
            </div>
        </div>
    );
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
