"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Search, Mail, Phone, GraduationCap, ArrowLeft } from 'lucide-react';
import { Input } from "@/components/ui/input";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function HODStudentsPage() {
    const { token } = useAuth();
    const router = useRouter();
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchStudents = async () => {
            if (!token) return;
            try {
                // Backend automatically filters by HOD's org_group_id (with recursive subgroups)
                const response = await axios.get(`${API_URL}/users?role=STUDENT`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStudents(response.data);
            } catch (error) {
                console.error("Failed to fetch students", error);
            } finally {
                setLoading(false);
            }
        }
        fetchStudents();
    }, [token]);

    const filteredStudents = students.filter((s: any) =>
        s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.roll_number?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto p-8 lg:p-12 space-y-10 pb-20">
            {/* Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 p-8 text-white shadow-2xl shadow-emerald-900/20">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl"></div>
                <div className="relative z-10">
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/org/hod/dashboard')}
                        className="mb-6 text-emerald-200 hover:text-white hover:bg-white/10 -ml-2 group"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Back to Dashboard
                    </Button>

                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-emerald-200 text-xs font-semibold backdrop-blur-md mb-3">
                        <GraduationCap className="h-3.5 w-3.5" /> Department Students
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">My Students</h1>
                    <p className="text-emerald-200 max-w-2xl">
                        View and manage students in your department and all subgroups.
                    </p>

                    {/* Search Bar */}
                    <div className="mt-8 bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-white/10 flex flex-col md:flex-row gap-4 max-w-xl">
                        <div className="flex-1 relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-200 group-focus-within:text-white transition-colors" />
                            <Input
                                placeholder="Search by name, email, or roll number..."
                                className="pl-12 border-0 bg-transparent h-12 text-base text-white placeholder:text-emerald-200/60 focus-visible:ring-0"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Student Grid */}
            {loading ? <LoadingGrid /> : (
                filteredStudents.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-slate-500">
                        <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                            <GraduationCap className="h-8 w-8 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">No students found</h3>
                        <p className="max-w-md mx-auto">No students match your search or have been assigned to your department yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredStudents.map((student) => (
                            <StudentCard key={student.id} student={student} />
                        ))}
                    </div>
                )
            )}
        </div>
    );
}

function StudentCard({ student }: { student: any }) {
    // Display group hierarchy
    const groupName = student.group?.name || 'Unassigned';
    const parentGroup = student.group?.parent?.name;
    const departmentPath = parentGroup ? `${parentGroup} / ${groupName}` : groupName;

    return (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex items-start justify-between mb-4">
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                    {student.full_name?.[0]?.toUpperCase() || 'S'}
                </div>
                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100">
                    Active
                </Badge>
            </div>

            <h3 className="font-bold text-xl text-slate-900 mb-1">{student.full_name}</h3>
            <p className="text-sm text-slate-500 mb-4 font-medium">{departmentPath}</p>

            <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center text-sm text-slate-600">
                    <Mail className="h-4 w-4 mr-3 text-slate-400" />
                    <span className="truncate">{student.email}</span>
                </div>
                {student.phone && (
                    <div className="flex items-center text-sm text-slate-600">
                        <Phone className="h-4 w-4 mr-3 text-slate-400" />
                        <span>{student.phone}</span>
                    </div>
                )}
                {student.roll_number && (
                    <div className="flex items-center text-sm text-slate-600">
                        <GraduationCap className="h-4 w-4 mr-3 text-slate-400" />
                        <span>Roll: {student.roll_number}</span>
                    </div>
                )}
                {student.year && (
                    <div className="flex items-center text-sm text-slate-600">
                        <Users className="h-4 w-4 mr-3 text-slate-400" />
                        <span>Year: {student.year}</span>
                    </div>
                )}
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
