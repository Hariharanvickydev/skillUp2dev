"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    ChevronDown,
    ChevronRight,
    TrendingUp,
    TrendingDown,
    Minus,
    ArrowRight,
    UserCheck,
    UserMinus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Attempt {
    id: string;
    attempt_number: number;
    score: number;
    passed: boolean;
    submitted_at: string | null;
}

interface StudentGroup {
    student_id: string;
    student_name: string;
    attempts: Attempt[];
    improvement_indicator: string;
    first_score: number;
    latest_score: number;
    total_attempts: number;
}

interface GroupedParticipantsViewProps {
    groups: StudentGroup[];
    examId: string;
}

export default function GroupedParticipantsView({ groups, examId }: GroupedParticipantsViewProps) {
    const router = useRouter();
    const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());

    const toggleStudent = (studentId: string) => {
        const newExpanded = new Set(expandedStudents);
        if (newExpanded.has(studentId)) {
            newExpanded.delete(studentId);
        } else {
            newExpanded.add(studentId);
        }
        setExpandedStudents(newExpanded);
    };

    const getTrendIcon = (indicator: string) => {
        if (indicator === "improving") return <TrendingUp className="h-4 w-4 text-emerald-500" />;
        if (indicator === "declining") return <TrendingDown className="h-4 w-4 text-red-500" />;
        return <Minus className="h-4 w-4 text-slate-400" />;
    };

    const getTrendBadge = (indicator: string) => {
        const styles = {
            improving: "bg-emerald-50 text-emerald-700 border-emerald-100",
            declining: "bg-red-50 text-red-700 border-red-100",
            stable: "bg-slate-50 text-slate-600 border-slate-100"
        };

        return (
            <div className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border",
                styles[indicator as keyof typeof styles] || styles.stable
            )}>
                {getTrendIcon(indicator)}
                {indicator.charAt(0).toUpperCase() + indicator.slice(1)}
            </div>
        );
    };

    return (
        <div className="space-y-2">
            {groups.map((group) => {
                const isExpanded = expandedStudents.has(group.student_id);

                return (
                    <div key={group.student_id} className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                        {/* Student Summary Row */}
                        <div
                            className="p-6 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                            onClick={() => toggleStudent(group.student_id)}
                        >
                            <div className="flex items-center gap-4 flex-1">
                                <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-white to-slate-50 border border-slate-200 flex items-center justify-center font-black text-slate-700">
                                    {group.student_name?.[0]}
                                </div>
                                <div>
                                    <div className="font-black text-slate-800">{group.student_name}</div>
                                    <div className="text-xs text-slate-500 font-medium">
                                        {group.total_attempts} attempt{group.total_attempts > 1 ? 's' : ''}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                {getTrendBadge(group.improvement_indicator)}

                                <div className="text-center">
                                    <div className="text-xs text-slate-500 font-medium mb-1">Progress</div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-slate-600">{group.first_score}%</span>
                                        <span className="text-slate-400">→</span>
                                        <span className={cn(
                                            "text-lg font-black",
                                            group.latest_score >= group.first_score ? "text-emerald-600" : "text-red-500"
                                        )}>
                                            {group.latest_score}%
                                        </span>
                                    </div>
                                </div>

                                <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                    {isExpanded ? (
                                        <ChevronDown className="h-5 w-5 text-slate-600" />
                                    ) : (
                                        <ChevronRight className="h-5 w-5 text-slate-600" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Expanded Attempts List */}
                        {isExpanded && (
                            <div className="border-t border-slate-100 bg-slate-50/50">
                                <div className="p-4 space-y-2">
                                    {group.attempts.map((attempt) => (
                                        <div
                                            key={attempt.id}
                                            className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 hover:border-indigo-200 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600">
                                                    #{attempt.attempt_number}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-slate-700">
                                                        Attempt {attempt.attempt_number}
                                                    </div>
                                                    {attempt.submitted_at && (
                                                        <div className="text-xs text-slate-500">
                                                            {new Date(attempt.submitted_at + 'Z').toLocaleString()}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold",
                                                    attempt.passed
                                                        ? "bg-emerald-50 text-emerald-700"
                                                        : "bg-red-50 text-red-700"
                                                )}>
                                                    {attempt.passed ? <UserCheck className="h-3.5 w-3.5" /> : <UserMinus className="h-3.5 w-3.5" />}
                                                    {attempt.score}%
                                                </div>

                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="rounded-lg text-xs font-bold text-indigo-600 hover:bg-indigo-50"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        router.push(`/manage/exams/${examId}/attempts/${attempt.id}`);
                                                    }}
                                                >
                                                    View
                                                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
