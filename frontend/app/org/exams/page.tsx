"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function ExamsPage() {
    const { token } = useAuth();
    const [exams, setExams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchExams = async () => {
            if (!token) return;
            setLoading(true);
            try {
                const response = await axios.get(`${API_URL}/exams/org`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setExams(response.data);
            } catch (error) {
                console.error("Failed to fetch exams:", error);
                toast.error("Failed to load exams");
            } finally {
                setLoading(false);
            }
        };
        fetchExams();
    }, [token]);

    const activeExams = exams.filter(e => e.status === 'Active').length;

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Exams Governance</h1>
                    <p className="text-slate-500 mt-1">
                        Monitor and manage exams across your organization.
                    </p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-blue-50 border-blue-100">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-blue-700">Active Exams</CardTitle>
                        <FileText className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-900">{activeExams}</div>
                    </CardContent>
                </Card>
                <Card className="bg-green-50 border-green-100">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-green-700">Avg. Pass Rate</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-900">--%</div>
                    </CardContent>
                </Card>
                <Card className="bg-orange-50 border-orange-100">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-orange-700">Pending Grading</CardTitle>
                        <Clock className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-900">0</div>
                        <div className="text-xs text-orange-600 mt-1">Requires teacher attention</div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="all" className="space-y-6">
                <TabsList className="bg-slate-100">
                    <TabsTrigger value="all">All Exams</TabsTrigger>
                    <TabsTrigger value="active">Active</TabsTrigger>
                    <TabsTrigger value="scheduled" disabled>Scheduled</TabsTrigger>
                    <TabsTrigger value="completed" disabled>Completed</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4">
                    {exams.length === 0 ? (
                        <div className="text-center py-10 text-slate-500">No exams found.</div>
                    ) : (
                        exams.map((exam) => (
                            <div key={exam.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-md transition-shadow">
                                <div className="flex items-start gap-4 flex-1">
                                    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                                        <FileText className="h-6 w-6 text-slate-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-lg text-slate-900">{exam.title}</h3>
                                            <Badge variant="outline" className="font-normal text-xs">{exam.type}</Badge>
                                            <Badge className={
                                                exam.status === "Active" ? "bg-green-100 text-green-700 hover:bg-green-200 shadow-none" :
                                                    "bg-slate-100 text-slate-600 shadow-none"
                                            }>
                                                {exam.status}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-slate-500">{exam.course}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8 self-end md:self-center w-full md:w-auto justify-between md:justify-end">
                                    <div className="text-center">
                                        <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Attempts</p>
                                        <p className="font-semibold text-slate-900">{exam.attempts}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Avg Score</p>
                                        <p className={`font-semibold ${exam.avg_score === '-' ? 'text-slate-400' : 'text-slate-900'}`}>{exam.avg_score}</p>
                                    </div>
                                    <Button variant="outline" size="sm">View Report</Button>
                                </div>
                            </div>
                        ))
                    )}
                </TabsContent>

                <TabsContent value="active">
                    {exams.filter(e => e.status === 'Active').map((exam) => (
                        <div key={exam.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-md transition-shadow mb-4">
                            {/* ... same card ... */}
                            <div className="flex items-start gap-4 flex-1">
                                <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                                    <FileText className="h-6 w-6 text-slate-500" />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-lg text-slate-900">{exam.title}</h3>
                                        <Badge variant="outline" className="font-normal text-xs">{exam.type}</Badge>
                                    </div>
                                    <p className="text-sm text-slate-500">{exam.course}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </TabsContent>
            </Tabs>
        </div>
    );
}
