import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import {
    CheckCircle,
    XCircle,
    Clock,
    AlertTriangle,
    Eye,
    EyeOff
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";

interface Question {
    id: string;
    question: string;
    options: string[];
    correct_index: number;
    explanation?: string;
}

interface ExamPreviewProps {
    title: string;
    questions: Question[];
    duration: number | string;
    difficulty: string;
    showAnswersDefault?: boolean;
}

export default function ExamPreview({
    title,
    questions,
    duration,
    difficulty,
    showAnswersDefault = false
}: ExamPreviewProps) {
    const [answers, setAnswers] = useState<number[]>(new Array(questions.length).fill(-1));
    const [showAnswers, setShowAnswers] = useState(showAnswersDefault);

    const handleAnswerSelect = (questionIndex: number, optionIndex: number) => {
        const newAnswers = [...answers];
        newAnswers[questionIndex] = optionIndex;
        setAnswers(newAnswers);
    };

    const getDifficultyColor = (d: string) => {
        switch (d.toLowerCase()) {
            case 'easy': return 'bg-green-100 text-green-700 border-green-200';
            case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'hard': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    const filledCount = answers.filter(a => a !== -1).length;

    return (
        <div className="space-y-6">
            {/* Simulation Header */}
            <div className="bg-white border rounded-xl p-4 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 sticky top-4 z-10">
                <div className="flex items-center gap-4">
                    <div className="bg-indigo-50 p-2 rounded-lg">
                        <Clock className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <div className="font-bold text-slate-900">{title || "Untitled Exam"}</div>
                        <div className="flex gap-2 text-xs mt-1">
                            <Badge variant="outline" className={getDifficultyColor(difficulty)}>{difficulty}</Badge>
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">{duration} mins</span>
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">{questions.length} Qs</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="flex-1 md:flex-none text-right mr-2">
                        <div className="text-sm font-semibold text-slate-700">Progress</div>
                        <div className="text-xs text-slate-500">{filledCount} of {questions.length} answered</div>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAnswers(!showAnswers)}
                        className={showAnswers ? "bg-indigo-50 border-indigo-200 text-indigo-700" : ""}
                    >
                        {showAnswers ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                        {showAnswers ? "Hide Answers" : "Show Answers"}
                    </Button>
                </div>
            </div>

            {/* Questions List */}
            <div className="space-y-6">
                {questions.map((q, qIndex) => {
                    const isAnswered = answers[qIndex] !== -1;

                    return (
                        <Card key={qIndex} className="p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow">
                            <h3 className="text-lg font-bold text-slate-900 mb-6 flex gap-3">
                                <span className="bg-slate-100 text-slate-500 w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0">
                                    {qIndex + 1}
                                </span>
                                {q.question}
                            </h3>

                            <div className="space-y-3">
                                {q.options.map((option, oIndex) => {
                                    const isSelected = answers[qIndex] === oIndex;
                                    const isCorrect = q.correct_index === oIndex;

                                    // Style logic:
                                    // 1. If Show Answers is ON: Highlight Correct (Green). If selected is wrong, highlight Wrong (Red).
                                    // 2. If Show Answers is OFF: Just highlight Selected (Blue/Indigo) like real exam.

                                    let containerClass = "border-slate-200 hover:border-indigo-300 hover:bg-slate-50";
                                    let icon = null;

                                    if (showAnswers) {
                                        if (isCorrect) {
                                            containerClass = "border-green-500 bg-green-50 ring-1 ring-green-500";
                                            icon = <CheckCircle className="w-5 h-5 text-green-600 ml-auto" />;
                                        } else if (isSelected) {
                                            containerClass = "border-red-300 bg-red-50";
                                            icon = <XCircle className="w-5 h-5 text-red-500 ml-auto" />;
                                        } else {
                                            containerClass = "border-slate-200 opacity-60";
                                        }
                                    } else {
                                        if (isSelected) {
                                            containerClass = "border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600";
                                        }
                                    }

                                    return (
                                        <div
                                            key={oIndex}
                                            onClick={() => handleAnswerSelect(qIndex, oIndex)}
                                            className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-3 ${containerClass}`}
                                        >
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${showAnswers
                                                    ? (isCorrect ? "border-green-600 bg-green-600 text-white" : isSelected ? "border-red-500 text-red-500" : "border-slate-300")
                                                    : (isSelected ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300")
                                                }`}>
                                                {(showAnswers && isCorrect) || (!showAnswers && isSelected) ? (
                                                    <div className="w-2 h-2 rounded-full bg-white" />
                                                ) : <span className="text-xs font-bold text-slate-400">{String.fromCharCode(65 + oIndex)}</span>}
                                            </div>

                                            <span className={`font-medium ${showAnswers && isCorrect ? "text-green-900" : "text-slate-700"
                                                }`}>
                                                {option}
                                            </span>

                                            {icon}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Explanation (Only if Show Answers is ON) */}
                            {showAnswers && q.explanation && (
                                <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-900 animate-in fade-in slide-in-from-top-2">
                                    <span className="font-bold block mb-1">Explanation:</span>
                                    {q.explanation}
                                </div>
                            )}
                        </Card>
                    );
                })}
            </div>

            {/* Bottom Disclaimer */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                    <span className="font-bold">Student View Preview:</span> This is exactly how the exam will appear to students.
                    Interactive elements are active for testing purposes, but no results will be saved.
                </div>
            </div>
        </div>
    );
}
