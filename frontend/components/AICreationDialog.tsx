"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sparkles, Loader2, Bot } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import axios from "axios"
import { useRouter } from "next/navigation"
import { getTopicWeight } from '@/lib/sortUtils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface AICreationDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

interface Course {
    id: string;
    title: string;
}

interface Topic {
    id: string;
    title: string;
}

export function AICreationDialog({ open, onOpenChange }: AICreationDialogProps) {
    const { token } = useAuth()
    const router = useRouter()
    const [generating, setGenerating] = useState(false)

    // Selection State
    const [courses, setCourses] = useState<Course[]>([])
    const [topics, setTopics] = useState<Topic[]>([])
    const [selectedCourseId, setSelectedCourseId] = useState("")
    const [selectedTopicId, setSelectedTopicId] = useState("")
    const [difficulty, setDifficulty] = useState("medium")
    const [numQuestions, setNumQuestions] = useState("10")
    const [examType, setExamType] = useState("PRACTICE")
    const [generationStep, setGenerationStep] = useState<string>("")

    // Effects
    useEffect(() => {
        if (open && token) {
            fetchCourses()
        }
    }, [open, token])

    useEffect(() => {
        if (selectedCourseId && token) {
            fetchTopics(selectedCourseId)
        } else {
            setTopics([])
            setSelectedTopicId("")
        }
    }, [selectedCourseId, token])

    // Clear topic when Exam Type changes to FINAL
    useEffect(() => {
        if (examType === 'FINAL') {
            setSelectedTopicId("");
        }
    }, [examType]);

    // Data Fetching
    const fetchCourses = async () => {
        try {
            const res = await axios.get(`${API_URL}/courses`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCourses(res.data.sort((a: Course, b: Course) => a.title.localeCompare(b.title)));
        } catch (error) {
            console.error("Failed to fetch courses", error);
        }
    };

    const fetchTopics = async (courseId: string) => {
        try {
            const res = await axios.get(`${API_URL}/courses/${courseId}/topics`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Sort topics hierarchically using custom weight logic
            // Use spread to create a new array copy for safe sorting
            let sortedTopics = [...res.data].sort((a: Topic, b: Topic) => {
                const wa = getTopicWeight(a.title);
                const wb = getTopicWeight(b.title);
                if (wa !== wb) return wa - wb;
                return a.title.localeCompare(b.title);
            });

            // Filter for Module Exams (Only show Units/Modules)
            if (examType === 'MODULE') {
                sortedTopics = sortedTopics.filter(t =>
                    t.title.toUpperCase().startsWith('UNIT') ||
                    t.title.toUpperCase().startsWith('MODULE')
                );
            }

            setTopics(sortedTopics);
        } catch (error) {
            console.error("Failed to fetch topics", error);
        }
    };

    // Re-fetch topics when exam type changes to update filtering
    useEffect(() => {
        if (selectedCourseId && token) {
            fetchTopics(selectedCourseId);
        }
    }, [examType]);

    const handleGenerate = async () => {
        if (examType !== 'FINAL' && !selectedTopicId) {
            toast.error("Please select a topic")
            return
        }

        const numQ = parseInt(numQuestions)
        if (isNaN(numQ) || numQ < 1 || numQ > 50) {
            toast.error("Please enter a valid number of questions (1-50)")
            return
        }

        setGenerating(true)
        setGenerationStep("Analyzing topic content...")

        try {
            // Wait a moment to show step
            await new Promise(r => setTimeout(r, 800))
            setGenerationStep("Generating questions with AI...")

            const response = await axios.post(`${API_URL}/exams/topics/${selectedTopicId}/generate-practice-exam`, {
                num_questions: numQ,
                difficulty: difficulty,
                exam_type: examType // Pass exam type if backend supports it
            }, {
                headers: { Authorization: `Bearer ${token}` }
            })

            setGenerationStep("Finalizing exam...")
            await new Promise(r => setTimeout(r, 500))

            toast.success("Exam generated successfully!")

            // Redirect to Edit Page
            router.push(`/manage/exams/${response.data.id}/edit`)
            onOpenChange(false)
        } catch (error: any) {
            console.error(error)
            toast.error(error.response?.data?.detail || "Failed to generate exam")
        } finally {
            setGenerating(false)
            setGenerationStep("")
        }
    }

    const handleClose = () => {
        setSelectedCourseId("")
        setSelectedTopicId("")
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl rounded-3xl p-0 overflow-hidden border-0 shadow-2xl">
                <div className="p-8 bg-gradient-to-br from-indigo-600 to-violet-600 border-b border-indigo-500/50">
                    <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-lg">
                            <Sparkles className="h-6 w-6 text-white" />
                        </div>
                        AI Exam Generator
                    </DialogTitle>
                    <DialogDescription className="text-indigo-100 mt-2 text-base">
                        Automatically generate practice questions from your topic content
                    </DialogDescription>
                </div>

                <div className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                                <Label>Course</Label>
                                <Select value={selectedCourseId} onValueChange={setSelectedCourseId} disabled={generating}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Course" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {courses.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Exam Type</Label>
                                    <Select value={examType} onValueChange={setExamType} disabled={generating}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PRACTICE">Practice</SelectItem>
                                            <SelectItem value="MODULE">Module</SelectItem>
                                            <SelectItem value="FINAL">Final</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Difficulty</Label>
                                    <Select value={difficulty} onValueChange={setDifficulty} disabled={generating}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Difficulty" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="easy">Easy</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="hard">Hard</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Topic</Label>
                                <Select
                                    value={selectedTopicId}
                                    onValueChange={setSelectedTopicId}
                                    disabled={!selectedCourseId || generating || examType === 'FINAL'}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={examType === 'FINAL' ? "N/A for Final Exam" : "Select Topic"} />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[300px]">
                                        {topics.map(t => (
                                            <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Number of Questions</Label>
                            <Input
                                type="number"
                                min="1"
                                max="50"
                                value={numQuestions}
                                onChange={(e) => setNumQuestions(e.target.value)}
                                disabled={generating}
                            />
                        </div>
                    </div>

                    {generating && (
                        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center gap-3 animate-pulse">
                            <Bot className="h-5 w-5 text-indigo-600 animate-bounce" />
                            <div className="text-sm font-medium text-indigo-700">
                                {generationStep}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="p-6 bg-slate-50 border-t border-slate-200">
                    <Button variant="ghost" onClick={handleClose} disabled={generating} className="rounded-xl">Cancel</Button>
                    <Button
                        onClick={handleGenerate}
                        disabled={!selectedTopicId || generating}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200"
                    >
                        {generating ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-4 w-4 mr-2" />
                                Generate Exam
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
