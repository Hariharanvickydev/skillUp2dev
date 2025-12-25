"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, BookOpen, GraduationCap, Activity, AlertTriangle, FileText, Upload, Plus, TrendingUp } from "lucide-react";
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { getOrgGroupTree } from '@/lib/api';
import { AddUserModal } from '@/components/PeopleManager';

import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface DashboardStats {
    total_students: number;
    total_teachers: number;
    total_courses: number;
    published_courses: number;
    active_students_7d: number;
    exams_conducted: number;
    pending_approvals: number;
    daily_activity: { name: string; students: number }[];
    ai_usage: {
        used: number;
        limit: number;
    };
    storage_usage: {
        used: number;
        limit: number;
    };
    recent_exams: {
        id: string;
        title: string;
        type: string;
        exam_status: string;
        created_at: string;
    }[];
    popular_courses: {
        id: string;
        title: string;
        student_count: number;
    }[];
}

interface OrgInfo {
    name: string;
    code: string;
    subscription_plan: string;
    status: string;
    created_at: string;
    type: string;
}

export default function OrgDashboard() {
    const { token, user } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [orgInfo, setOrgInfo] = useState<OrgInfo | null>(null);
    const [loading, setLoading] = useState(true);

    const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
    const [isAddTeacherOpen, setIsAddTeacherOpen] = useState(false);
    const [hasStructure, setHasStructure] = useState(false);

    const fetchData = React.useCallback(async () => {
        if (!token) return;
        try {
            const [statsRes, infoRes, structureRes] = await Promise.all([
                axios.get(`${API_URL}/org/dashboard/stats`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${API_URL}/org/info`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                getOrgGroupTree()
            ]);
            setStats(statsRes.data);
            setOrgInfo(infoRes.data);
            setHasStructure(structureRes && structureRes.length > 0);
        } catch (error) {
            console.error("Failed to fetch dashboard data", error);
            toast.error("Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const activityData = stats?.daily_activity || [];
    const hasData = stats && (stats.total_students > 0 || stats.total_teachers > 0 || stats.total_courses > 0);

    const handleAddUserClick = (role: 'STUDENT' | 'TEACHER') => {
        if (!hasStructure) {
            toast.error("Organization structure required", {
                description: "You must add departments or classes before adding users.",
                action: {
                    label: "Add Structure",
                    onClick: () => router.push('/org/settings?tab=structure')
                }
            });
            return;
        }

        if (role === 'STUDENT') setIsAddStudentOpen(true);
        else setIsAddTeacherOpen(true);
    };

    // ... (rest of loading/empty state) ...

    // Navigation handlers
    const handleAddStudent = () => handleAddUserClick('STUDENT');
    const handleAddTeacher = () => handleAddUserClick('TEACHER');
    const handleImportCourse = () => router.push('/org/library?tab=not-imported');
    const handleViewExams = () => router.push('/manage/exams');

    return (
        <div className="p-8 space-y-10 max-w-7xl mx-auto pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-slate-900">Dashboard</h1>
                    <p className="text-lg text-slate-500 mt-2">
                        Welcome back, {user?.full_name}. Here's what's happening in <span className="font-semibold text-slate-700">{orgInfo?.name || 'your organization'}</span>.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold border border-blue-200 uppercase tracking-wide flex items-center gap-2 shadow-sm whitespace-nowrap">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        {orgInfo?.status || 'Active'}
                    </span>
                </div>
            </div>

            {/* Key Metrics - Premium Style */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 fill-mode-backwards">
                <PremiumStatCard
                    title="Total Students"
                    value={stats?.total_students || 0}
                    icon={<GraduationCap className="h-6 w-6 text-white" />}
                    gradient="from-blue-600 to-blue-400"
                    subtext="Enrolled learners"
                    delay="0"
                />
                <PremiumStatCard
                    title="Total Teachers"
                    value={stats?.total_teachers || 0}
                    icon={<Users className="h-6 w-6 text-white" />}
                    gradient="from-violet-600 to-violet-400"
                    subtext="Faculty members"
                    delay="100"
                />
                <PremiumStatCard
                    title="Active Students"
                    value={stats?.active_students_7d || 0}
                    icon={<Activity className="h-6 w-6 text-white" />}
                    gradient="from-emerald-600 to-emerald-400"
                    subtext="Active in last 7 days"
                    delay="200"
                />
                <PremiumStatCard
                    title="Courses Published"
                    value={`${stats?.published_courses || 0} / ${stats?.total_courses || 0}`}
                    icon={<BookOpen className="h-6 w-6 text-white" />}
                    gradient="from-orange-600 to-orange-400"
                    subtext="Content available"
                    delay="300"
                />
            </div>


            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 fill-mode-backwards">
                <QuickActionCard
                    icon={Plus}
                    label="Add Student"
                    color="text-indigo-600"
                    bg="bg-indigo-50"
                    border="hover:border-indigo-200"
                    onClick={handleAddStudent}
                />
                <QuickActionCard
                    icon={Plus}
                    label="Add Teacher"
                    color="text-purple-600"
                    bg="bg-purple-50"
                    border="hover:border-purple-200"
                    onClick={handleAddTeacher}
                />
                <QuickActionCard
                    icon={Upload}
                    label="Import Course"
                    color="text-orange-600"
                    bg="bg-orange-50"
                    border="hover:border-orange-200"
                    onClick={handleImportCourse}
                />
                <QuickActionCard
                    icon={FileText}
                    label="View Exams"
                    color="text-blue-600"
                    bg="bg-blue-50"
                    border="hover:border-blue-200"
                    onClick={handleViewExams}
                />
            </div>

            {/* Charts & Limits */}
            <div className="grid gap-8 md:grid-cols-7 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-backwards">
                {/* Activity Chart */}
                <Card className="col-span-7 border-slate-200 shadow-sm overflow-hidden">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-indigo-600" />
                            Weekly Activity
                        </CardTitle>
                        <CardDescription>Active students over the past 7 days</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="h-[300px] w-full">
                            {stats?.active_students_7d === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm">
                                    <div className="p-4 bg-slate-50 rounded-full mb-3">
                                        <Activity className="h-6 w-6 opacity-50" />
                                    </div>
                                    No activity recorded yet
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={activityData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                        <XAxis
                                            dataKey="name"
                                            stroke="#94A3B8"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            dy={10}
                                        />
                                        <YAxis
                                            stroke="#94A3B8"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) => `${value}`}
                                        />
                                        <RechartsTooltip
                                            cursor={{ fill: '#F8FAFC' }}
                                            contentStyle={{
                                                borderRadius: '12px',
                                                border: 'none',
                                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                                padding: '12px'
                                            }}
                                        />
                                        <Bar
                                            dataKey="students"
                                            fill="#4F46E5"
                                            radius={[6, 6, 0, 0]}
                                            barSize={40}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* AI Usage, Alerts, Storage, Exams & Courses */}
            <div className="grid gap-8 md:grid-cols-3 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-400 fill-mode-backwards">
                {/* AI Usage & Alerts */}
                <div className="col-span-1 space-y-8">
                    {/* Alerts */}
                    <Card className="border-slate-200 shadow-sm overflow-hidden h-fit">
                        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                            <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-orange-500" />
                                Alerts & Warnings
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 p-6">
                            {(() => {
                                if (!stats) return null;

                                const hasAnyAlert = (
                                    stats.total_students >= 45 ||
                                    (stats?.pending_approvals || 0) > 0 ||
                                    (stats.ai_usage.used / stats.ai_usage.limit) > 0.8 ||
                                    (stats?.total_courses || 0) === 0 ||
                                    !stats?.total_teachers
                                );

                                if (!hasAnyAlert) {
                                    return (
                                        <div className="flex items-center justify-center h-32 text-sm text-slate-500">
                                            <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-100">
                                                Everything looks good!
                                            </span>
                                        </div>
                                    );
                                }

                                return (
                                    <>
                                        {stats && stats.total_students >= 45 && (
                                            <div className="flex items-start gap-3 p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100 shadow-sm animate-in slide-in-from-right duration-500">
                                                <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
                                                <div>
                                                    <p className="font-semibold text-red-800">Student Limit Reached</p>
                                                    <p>You are nearing your plan limit (Current: {stats.total_students}, Max: 50)</p>
                                                </div>
                                            </div>
                                        )}
                                        {/* Pending Approvals Alert */}
                                        {(stats?.pending_approvals || 0) > 0 && (
                                            <div
                                                className="flex items-start gap-3 p-4 bg-indigo-50 text-indigo-700 rounded-xl text-sm border border-indigo-100 shadow-sm animate-in slide-in-from-right duration-500 cursor-pointer hover:bg-indigo-100 transition-colors"
                                                onClick={() => router.push('/org/approvals')}
                                            >
                                                <FileText className="h-5 w-5 shrink-0 text-indigo-600" />
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <p className="font-semibold text-indigo-800">Review Required</p>
                                                        <span className="bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded-full text-xs font-bold">
                                                            {stats?.pending_approvals}
                                                        </span>
                                                    </div>
                                                    <p className="mt-1">
                                                        There are {stats?.pending_approvals} topics waiting for approval.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        {stats && (stats.ai_usage.used / stats.ai_usage.limit) > 0.8 && (
                                            <div className="flex items-start gap-3 p-4 bg-orange-50 text-orange-700 rounded-xl text-sm border border-orange-100 shadow-sm animate-in slide-in-from-right duration-500 delay-100">
                                                <AlertTriangle className="h-5 w-5 shrink-0 text-orange-600" />
                                                <div>
                                                    <p className="font-semibold text-orange-800">High AI Usage</p>
                                                    <p>{stats.ai_usage.used} / {stats.ai_usage.limit} Credits used</p>
                                                </div>
                                            </div>
                                        )}
                                        {((stats?.total_courses || 0) === 0) && (
                                            <div className="flex items-start gap-3 p-4 bg-blue-50 text-blue-700 rounded-xl text-sm border border-blue-100 shadow-sm animate-in slide-in-from-right duration-500 delay-200">
                                                <BookOpen className="h-5 w-5 shrink-0 text-blue-600" />
                                                <div>
                                                    <p className="font-semibold text-blue-800">No Content Yet</p>
                                                    <p>Import or create your first course to get started.</p>
                                                </div>
                                            </div>
                                        )}
                                        {(!stats?.total_teachers) && (
                                            <div className="flex items-start gap-3 p-4 bg-yellow-50 text-yellow-700 rounded-xl text-sm border border-yellow-100 shadow-sm animate-in slide-in-from-right duration-500 delay-300">
                                                <Users className="h-5 w-5 shrink-0 text-yellow-600" />
                                                <div>
                                                    <p className="font-semibold text-yellow-800">Add Teachers</p>
                                                    <p>Invite faculty members to manage your courses.</p>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                        </CardContent>
                    </Card>

                    {/* AI Usage Progress */}
                    <Card className="border-slate-200 shadow-sm overflow-hidden">
                        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-slate-700">AI Credit Usage</CardTitle>
                                <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md border border-slate-200">
                                    {Math.round(((stats?.ai_usage.used || 0) / (stats?.ai_usage.limit || 1)) * 100)}%
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium text-slate-900">{stats?.ai_usage.used || 0} used</span>
                                    <span className="text-slate-500">{stats?.ai_usage.limit || 0} limit</span>
                                </div>
                                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                    <div
                                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 transition-all duration-1000 ease-out rounded-full"
                                        style={{ width: `${Math.min(100, ((stats?.ai_usage.used || 0) / (stats?.ai_usage.limit || 1)) * 100)}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Credits regenerate monthly. Upgrade your plan for higher limits.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Storage Usage */}
                    <Card className="border-slate-200 shadow-sm overflow-hidden">
                        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-slate-700">Storage Usage</CardTitle>
                                <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md border border-slate-200">
                                    {Math.round(((stats?.storage_usage.used || 0) / (stats?.storage_usage.limit || 1)) * 100)}%
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-slate-900">
                                            {(stats?.storage_usage.used || 0).toFixed(2)} GB used
                                        </span>
                                        {(() => {
                                            const usedGB = stats?.storage_usage.used || 0;
                                            if (usedGB < 1 && usedGB > 0) {
                                                if (usedGB < 0.001) {
                                                    const usedKB = usedGB * 1024 * 1024;
                                                    return (
                                                        <span className="text-xs text-slate-500 mt-0.5">
                                                            ({usedKB.toFixed(2)} KB)
                                                        </span>
                                                    );
                                                } else {
                                                    const usedMB = usedGB * 1024;
                                                    return (
                                                        <span className="text-xs text-slate-500 mt-0.5">
                                                            ({usedMB.toFixed(2)} MB)
                                                        </span>
                                                    );
                                                }
                                            }
                                            return null;
                                        })()}
                                    </div>
                                    <span className="text-slate-500">{stats?.storage_usage.limit || 0} GB limit</span>
                                </div>
                                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                    <div
                                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-1000 ease-out rounded-full"
                                        style={{ width: `${Math.min(100, ((stats?.storage_usage.used || 0) / (stats?.storage_usage.limit || 1)) * 100)}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    File storage for course materials and resources.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Exams */}
                <Card className="col-span-1 border-slate-200 shadow-sm overflow-hidden">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-green-600" />
                            Recent Exams
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        {(!stats?.recent_exams || stats.recent_exams.length === 0) ? (
                            <div className="flex flex-col items-center justify-center py-8 text-slate-400 text-sm">
                                <div className="p-4 bg-slate-50 rounded-full mb-3">
                                    <FileText className="h-6 w-6 opacity-50" />
                                </div>
                                No exams created yet
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {stats.recent_exams.map((exam) => (
                                    <div
                                        key={exam.id}
                                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                        onClick={() => router.push(`/manage/exams/${exam.id}`)}
                                    >
                                        <div className="flex-1">
                                            <p className="font-medium text-slate-900 text-sm">{exam.title}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                {exam.type} • {exam.exam_status}
                                            </p>
                                        </div>
                                        <span className="text-xs text-slate-400">
                                            {new Date(exam.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Popular Courses */}
                <Card className="col-span-1 border-slate-200 shadow-sm overflow-hidden">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-orange-600" />
                            Popular Courses
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        {(!stats?.popular_courses || stats.popular_courses.length === 0) ? (
                            <div className="flex flex-col items-center justify-center py-8 text-slate-400 text-sm">
                                <div className="p-4 bg-slate-50 rounded-full mb-3">
                                    <BookOpen className="h-6 w-6 opacity-50" />
                                </div>
                                No course engagement data yet
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {stats.popular_courses.map((course, index) => (
                                    <div
                                        key={course.id}
                                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                        onClick={() => router.push(`/org/courses/${course.id}`)}
                                    >
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-white text-sm font-bold">
                                                {index + 1}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-slate-900 text-sm">{course.title}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 text-slate-600">
                                            <Users className="h-4 w-4" />
                                            <span className="text-sm font-semibold">{course.student_count}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Modals */}
            <AddUserModal
                open={isAddStudentOpen}
                onOpenChange={setIsAddStudentOpen}
                role="STUDENT"
                orgId={user?.organization_id || ""}
                orgType={orgInfo?.type || 'COLLEGE'}
                apiMode="ORG"
                onUserAdded={() => {
                    toast.success("Student added successfully");
                    fetchData();
                    // Do not close modal here, let SuccessView handle it
                }}
            />
            <AddUserModal
                open={isAddTeacherOpen}
                onOpenChange={setIsAddTeacherOpen}
                role="TEACHER"
                orgId={user?.organization_id || ""}
                orgType={orgInfo?.type || 'COLLEGE'}
                apiMode="ORG"
                onUserAdded={() => {
                    toast.success("Teacher added successfully");
                    fetchData();
                    // Do not close modal here, let SuccessView handle it
                }}
            />
        </div>
    );
}

function QuickActionCard({ icon: Icon, label, color, bg, border, onClick }: any) {
    return (
        <Button
            variant="outline"
            className={`h-auto py-6 flex flex-col gap-3 bg-white border-slate-200 text-slate-700 shadow-sm hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] ${border}`}
            onClick={onClick}
        >
            <div className={`p-3 rounded-xl ${bg} ${color}`}>
                <Icon className="h-6 w-6" />
            </div>
            <span className="font-semibold">{label}</span>
        </Button>
    )
}

function PremiumStatCard({ title, value, icon, gradient, subtext, delay = "0" }: { title: string, value: string | number, icon: any, gradient: string, subtext: string, delay?: string }) {
    return (
        <div
            className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} p-6 text-white shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group`}
            style={{ animationDelay: `${delay}ms` }}
        >
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
