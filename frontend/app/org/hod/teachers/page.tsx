"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Users,
    Search,
    Mail,
    Phone,
    BookOpen,
    ArrowLeft,
    Eye
} from 'lucide-react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function HODTeachersPage() {
    const { token } = useAuth();
    const router = useRouter();
    const [teachers, setTeachers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchTeachers = async () => {
            if (!token) return;
            try {
                // Backend automatically filters by HOD's org_group_id
                const response = await axios.get(`${API_URL}/users?role=TEACHER`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setTeachers(response.data);
            } catch (error) {
                console.error("Failed to fetch teachers", error);
            } finally {
                setLoading(false);
            }
        }
        fetchTeachers();
    }, [token]);

    const filteredTeachers = teachers.filter((t: any) =>
        t.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto p-8 lg:p-12 space-y-10 pb-20">
            {/* Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-900 via-indigo-900 to-slate-900 p-8 text-white shadow-2xl shadow-violet-900/20">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl"></div>
                <div className="relative z-10">
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/org/hod/dashboard')}
                        className="mb-6 text-violet-200 hover:text-white hover:bg-white/10 -ml-2 group"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Back to Dashboard
                    </Button>

                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-violet-200 text-xs font-semibold backdrop-blur-md mb-3">
                        <Users className="h-3.5 w-3.5" /> Department Staff
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">My Teachers</h1>
                    <p className="text-violet-200 max-w-2xl">
                        Manage and review the faculty members in your department.
                    </p>

                    {/* Search Bar */}
                    <div className="mt-8 bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-white/10 flex flex-col md:flex-row gap-4 max-w-xl">
                        <div className="flex-1 relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-violet-200 group-focus-within:text-white transition-colors" />
                            <Input
                                placeholder="Search by name or email..."
                                className="pl-12 border-0 bg-transparent h-12 text-base text-white placeholder:text-violet-200/60 focus-visible:ring-0"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Teacher Grid */}
            {loading ? <LoadingGrid /> : (
                filteredTeachers.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-slate-500">
                        <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                            <Users className="h-8 w-8 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">No teachers found</h3>
                        <p className="max-w-md mx-auto">No teachers match your search or have been assigned to your department yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTeachers.map((teacher) => (
                            <TeacherCard key={teacher.id} teacher={teacher} />
                        ))}
                    </div>
                )
            )}
        </div>
    );
}



// ... (existing imports)

// ... (existing imports)

function TeacherCard({ teacher }: { teacher: any }) {
    const assignedCourses = teacher.assigned_courses || [];
    // If backend hasn't populated it yet (e.g. old data or restart needed), fallback to count or empty
    // But we expect [{id, title}, ...]

    // Create display string
    const courseNames = assignedCourses.map((c: any) => c.title).join(", ");
    const isLong = courseNames.length > 35;
    const itemsToShow = 2;
    const displayString = isLong
        ? assignedCourses.slice(0, itemsToShow).map((c: any) => c.title).join(", ") + "..."
        : courseNames;

    return (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex items-start justify-between mb-4">
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-violet-500/20 group-hover:scale-110 transition-transform">
                    {teacher.full_name?.[0]?.toUpperCase() || 'T'}
                </div>
                <Badge variant="secondary" className="bg-violet-50 text-violet-700 border-violet-100">
                    Active
                </Badge>
            </div>

            <h3 className="font-bold text-xl text-slate-900 mb-1">{teacher.full_name}</h3>
            <p className="text-sm text-slate-500 mb-4 font-medium">{teacher.email}</p>

            <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center text-sm text-slate-600">
                    <Mail className="h-4 w-4 mr-3 text-slate-400" />
                    <span className="truncate">{teacher.email}</span>
                </div>
                {teacher.phone && (
                    <div className="flex items-center text-sm text-slate-600">
                        <Phone className="h-4 w-4 mr-3 text-slate-400" />
                        <span>{teacher.phone}</span>
                    </div>
                )}
                <div className="flex items-start text-sm text-slate-600">
                    <BookOpen className="h-4 w-4 mr-3 text-slate-400 mt-1 shrink-0" />
                    <div className="flex-1">
                        {assignedCourses.length > 0 ? (
                            <div className="flex items-center gap-2">
                                <span className="line-clamp-1 break-all" title={courseNames}>
                                    {displayString}
                                </span>
                                {isLong && (
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 text-slate-400 hover:text-violet-600">
                                                <Eye className="h-3.5 w-3.5" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-64 p-3 pointer-events-auto">
                                            <div className="space-y-2">
                                                <h4 className="font-medium text-xs text-slate-500 uppercase tracking-wider mb-2">Assigned Courses</h4>
                                                <ul className="space-y-1">
                                                    {assignedCourses.map((course: any) => (
                                                        <li key={course.id} className="text-sm text-slate-700 py-1 px-2 rounded hover:bg-slate-50 border-b border-transparent hover:border-slate-100">
                                                            {course.title}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                )}
                            </div>
                        ) : (
                            <span className="text-slate-400 italic">No courses assigned</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

function LoadingGrid() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-slate-100 rounded-2xl animate-pulse"></div>
            ))}
        </div>
    )
}
