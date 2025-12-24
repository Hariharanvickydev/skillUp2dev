"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import ExamPreview from '@/components/ExamPreview';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, AlertCircle, Copy } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function ExamPreviewPage() {
    const { token } = useAuth();
    const router = useRouter();
    const params = useParams();
    const examId = params.examId as string;
    const [exam, setExam] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!token || !examId) return;
        const fetchExam = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`${API_URL}/exams/${examId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setExam(res.data);
            } catch (error) {
                console.error("Failed to load exam", error);
                setError("Failed to load exam details.");
                toast.error("Failed to load exam details");
            } finally {
                setLoading(false);
            }
        };
        fetchExam();
    }, [token, examId]);

    const handleClone = async () => {
        router.push(`/manage/exams/create?from=${examId}`);
    };

    if (loading) return (
        <div className="flex justify-center items-center min-h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
    );

    if (error) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <p className="text-lg font-medium text-slate-700">{error}</p>
            <Button variant="outline" onClick={() => router.push('/manage/exams')}>
                Back to Dashboard
            </Button>
        </div>
    );

    if (!exam) return null;

    return (
        <div className="max-w-5xl mx-auto p-6 lg:p-10 space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <Button variant="ghost" className="pl-0 hover:pl-2 transition-all" onClick={() => router.push('/manage/exams')}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                </Button>
                <div className="flex gap-2">
                    {exam.num_attempts === 0 ? (
                        <Button variant="outline" onClick={() => router.push(`/manage/exams/${examId}/edit`)}>
                            Edit Exam
                        </Button>
                    ) : (
                        <Button variant="outline" onClick={handleClone} className="bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100">
                            <Copy className="mr-2 h-4 w-4" />
                            Clone to Edit
                        </Button>
                    )}
                </div>
            </div>

            <ExamPreview
                title={exam.title || "Untitled Exam"}
                questions={exam.questions || []}
                duration={exam.duration_minutes || 30}
                difficulty={exam.difficulty || 'medium'}
                showAnswersDefault={false}
            />
        </div>
    );
}
