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
    GraduationCap
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function TeacherCoursesPage() {
    const { token, user } = useAuth();
    const router = useRouter();
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchCourses = async () => {
        if (!token) return;
        setLoading(true);
        try {
            // Returns assigned courses for Teacher
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

    const filteredCourses = courses.filter((course: any) =>
        course.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto p-6 lg:p-10 space-y-8 pb-20">
            {/* Header Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 p-8 text-white shadow-xl shadow-indigo-900/20">
                {/* Decorative Blobs */}
                <div className="absolute top-0 right-0 -mt-20 -mr-20 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl"></div>

                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold backdrop-blur-md">
                                <GraduationCap className="h-3.5 w-3.5" /> Content Creation
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight">My Courses</h1>
                            <p className="text-blue-200 text-lg max-w-2xl">
                                Create and update your assigned course content.
                            </p>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="mt-8 bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-white/10 flex flex-col md:flex-row gap-4 max-w-2xl">
                        <div className="flex-1 relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-200 group-focus-within:text-white transition-colors" />
                            <Input
                                placeholder="Search courses..."
                                className="pl-12 border-0 bg-transparent h-12 text-base text-white placeholder:text-blue-200/60 focus-visible:ring-0"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {loading ? <CoursesLoadingGrid /> : (
                filteredCourses.length === 0 ? (
                    <EmptyState
                        title="No courses found"
                        description="You haven't been assigned any courses yet."
                    />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredCourses.map((course) => <CourseCard key={course.id} course={course} router={router} />)}
                    </div>
                )
            )}
        </div>
    );
}

function CourseCard({ course, router }: { course: any, router: any }) {
    const gradient = getGradient(course.category);

    return (
        <div className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
            <div className={`h-36 w-full bg-gradient-to-r ${gradient} relative`}>
                <div className="absolute bottom-4 left-6">
                    <Badge variant={course.status === 'PUBLISHED' ? 'default' : 'secondary'} className={`shadow-sm backdrop-blur-md ${course.status === 'PUBLISHED' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-white/90 text-slate-800 hover:bg-white'}`}>
                        {course.status === 'PUBLISHED' ? 'Live' : course.status === 'PENDING_APPROVAL' ? 'Pending Review' : 'Draft'}
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

                <div className="pt-4 border-t border-slate-100">
                    <Button
                        className="w-full bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 font-medium"
                        onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/org/courses/${course.id}`);
                        }}
                    >
                        <BookOpen className="h-4 w-4 mr-2" /> Open Editor
                    </Button>
                </div>
            </div>
        </div>
    );
}

function EmptyState({ title, description }: any) {
    return (
        <div className="w-full flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200 text-center">
            <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                <Book className="h-8 w-8 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
            <p className="text-slate-500 max-w-md">{description}</p>
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
    if (!category) return "from-blue-500 to-indigo-600";
    if (category.includes("Computer")) return "from-blue-600 to-indigo-600";
    if (category.includes("Data")) return "from-emerald-500 to-teal-600";
    return "from-slate-500 to-slate-600";
}
