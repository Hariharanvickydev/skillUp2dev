"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Users, Activity, Target } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function AnalyticsPage() {
    const { token } = useAuth();
    const [performanceData, setPerformanceData] = useState<any[]>([]);
    const [engagementData, setEngagementData] = useState<any[]>([]);
    const [progressData, setProgressData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!token) return;
            setLoading(true);
            try {
                // In a real app, these endpoints might be different or consolidated
                // For now we use the ones we defined in backend/app/routers/org.py
                const [perfRes, engRes, progRes] = await Promise.all([
                    axios.get(`${API_URL}/org/analytics/performance`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${API_URL}/org/analytics/engagement`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${API_URL}/org/analytics/progress`, { headers: { Authorization: `Bearer ${token}` } })
                ]);

                setPerformanceData(perfRes.data);
                setEngagementData(engRes.data);
                setProgressData(progRes.data);
            } catch (error) {
                console.error("Failed to fetch analytics:", error);
                toast.error("Failed to load analytics data");
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [token]);

    const StatCard = ({ title, value, icon, description, trend }: { title: string, value: string, icon: React.ReactNode, description: string, trend?: string }) => (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-slate-900">{value}</div>
                <p className="text-xs text-slate-500 mt-1">
                    {description}
                    {trend && <span className="text-green-600 ml-1 font-medium">{trend}</span>}
                </p>
            </CardContent>
        </Card>
    );

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Analytics</h1>
                    <p className="text-slate-500 mt-1">
                        Deep dive into learning trends, performance, and engagement.
                    </p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Active Learners"
                    value={loading ? "--" : "128"}
                    icon={<Users className="h-4 w-4 text-indigo-500" />}
                    description="Students active this week"
                    trend="+12%"
                />
                <StatCard
                    title="Avg. Course Progress"
                    value={loading ? "--" : "42%"}
                    icon={<Activity className="h-4 w-4 text-green-500" />}
                    description="Across all courses"
                    trend="+5%"
                />
                <StatCard
                    title="Avg. Exam Score"
                    value={loading ? "--" : "76%"}
                    icon={<Target className="h-4 w-4 text-blue-500" />}
                    description="Performance metric"
                    trend="+2%"
                />
                <StatCard
                    title="Completion Rate"
                    value={loading ? "--" : "85%"}
                    icon={<TrendingUp className="h-4 w-4 text-orange-500" />}
                    description="Module completion"
                />
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="bg-slate-100">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="students" disabled>Student Performance</TabsTrigger>
                    <TabsTrigger value="courses" disabled>Course Insights</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Exam Performance</CardTitle>
                                <CardDescription>Average scores across recent exams</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={performanceData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip />
                                        <Bar dataKey="score" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Student Engagement</CardTitle>
                                <CardDescription>Daily active users over last 7 days</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={engagementData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="active" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Learning Progress by Module</CardTitle>
                            <CardDescription>Completion rates for top active modules</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={progressData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis dataKey="name" type="category" width={100} fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip />
                                    <Bar dataKey="completed" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
