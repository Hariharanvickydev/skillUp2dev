"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, BookOpen, Clock, BarChart2, MoreHorizontal, Import } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

import { useRouter } from 'next/navigation';

export default function CoursesPage() {
    const { token } = useAuth();
    const router = useRouter();
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

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

    const filteredCourses = courses.filter((course: any) =>
        course.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const publishedCourses = filteredCourses.filter((c: any) => c.status === 'PUBLISHED' || c.status === 'PARTIALLY_PUBLISHED');
    const draftCourses = filteredCourses.filter((c: any) => c.status !== 'PUBLISHED' && c.status !== 'PARTIALLY_PUBLISHED');

    const CourseCard = ({ course }: { course: any }) => (
        <Card
            className="flex flex-col overflow-hidden hover:shadow-lg transition-all duration-200 border-slate-200 cursor-pointer group/card"
            onClick={() => router.push(`/org/courses/${course.id}`)}
        >
            <div className="h-32 bg-slate-100 relative group">
                <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                    <BookOpen className="h-12 w-12" />
                </div>
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover/card:opacity-100 transition-opacity" />

                <div className="absolute top-3 right-3 opacity-0 group-hover/card:opacity-100 transition-opacity z-10" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="secondary" size="icon" className="h-8 w-8 bg-white/90 backdrop-blur-sm">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/org/courses/${course.id}`)}>Edit Curriculum</DropdownMenuItem>
                            <DropdownMenuItem>Assign Teacher</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
            <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start gap-2">
                    <Badge variant={course.status === 'PUBLISHED' ? 'default' : 'secondary'} className="mb-2">
                        {course.status}
                    </Badge>
                </div>
                <CardTitle className="line-clamp-1 text-lg group-hover/card:text-indigo-600 transition-colors">{course.title}</CardTitle>
                <CardDescription className="line-clamp-2 text-xs mt-1">
                    {course.description || "No description available."}
                </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-2 flex-grow">
                <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                    <div className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        <span>Modules</span>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="p-4 pt-0 border-t border-slate-100 bg-slate-50/50 flex gap-2">
                <Button variant="ghost" size="sm" className="w-full text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                    <BarChart2 className="h-3 w-3 mr-2" /> View Analytics
                </Button>
            </CardFooter>
        </Card>
    );

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Courses</h1>
                    <p className="text-slate-500 mt-1">
                        Manage your course catalog and curriculum.
                    </p>
                </div>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => router.push('/org/library')}>
                    <Import className="h-4 w-4 mr-2" /> Import from Library
                </Button>
            </div>

            <Tabs defaultValue="published" className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <TabsList className="bg-slate-100 p-1 rounded-xl">
                        <TabsTrigger value="published" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Published Courses</TabsTrigger>
                        <TabsTrigger value="drafts" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Imported / Drafts</TabsTrigger>
                    </TabsList>

                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            type="search"
                            placeholder="Search courses..."
                            className="pl-9 bg-white"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <TabsContent value="published">
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {publishedCourses.length === 0 ? (
                            <div className="col-span-full py-12 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                <p>No published courses found.</p>
                            </div>
                        ) : (
                            publishedCourses.map((course) => <CourseCard key={course.id} course={course} />)
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="drafts">
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {draftCourses.length === 0 ? (
                            <div className="col-span-full py-12 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                <p>No courses imported yet.</p>
                                <Button variant="ghost" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50" onClick={() => router.push('/org/library')}>Browse Library</Button>
                            </div>
                        ) : (
                            draftCourses.map((course) => <CourseCard key={course.id} course={course} />)
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
