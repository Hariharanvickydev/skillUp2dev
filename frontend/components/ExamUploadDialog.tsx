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
import { Label } from "@/components/ui/label"
import { Upload, Download, FileSpreadsheet, Loader2, CheckCircle, AlertCircle, FileText } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import axios from "axios"
import { useRouter } from "next/navigation"
import { getTopicWeight } from '@/lib/sortUtils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface ExamUploadDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    orgId?: string
}

interface Course {
    id: string;
    title: string;
}

interface Topic {
    id: string;
    title: string;
}

export function ExamUploadDialog({ open, onOpenChange, orgId }: ExamUploadDialogProps) {
    const { token } = useAuth()
    const router = useRouter()
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [downloading, setDownloading] = useState(false)
    const [result, setResult] = useState<any>(null)

    // Selection State
    const [courses, setCourses] = useState<Course[]>([])
    const [topics, setTopics] = useState<Topic[]>([])
    const [selectedCourseId, setSelectedCourseId] = useState("")
    const [selectedTopicId, setSelectedTopicId] = useState("")
    const [difficulty, setDifficulty] = useState("medium")
    const [examType, setExamType] = useState("PRACTICE")

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

    const handleDownloadTemplate = async () => {
        setDownloading(true)
        try {
            const response = await axios.get(`${API_URL}/exams/upload/template`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            })

            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', 'exam_questions_template.xlsx')
            document.body.appendChild(link)
            link.click()
            link.remove()

            toast.success("Template downloaded successfully")
        } catch (error: any) {
            console.error(error)
            toast.error("Failed to download template")
        } finally {
            setDownloading(false)
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
            setResult(null)
        }
    }

    const handleUpload = async () => {
        if (!file) {
            toast.error("Please select a file")
            return
        }
        if (examType !== 'FINAL' && !selectedTopicId) {
            toast.error("Please select a topic")
            return
        }

        setUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)

            const response = await axios.post(`${API_URL}/exams/upload`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                },
                params: {
                    topic_id: selectedTopicId,
                    difficulty: difficulty,
                    exam_type: examType
                }
            })

            setResult(response.data)
            toast.success(`Exam created with ${response.data.question_count} questions!`)
        } catch (error: any) {
            console.error(error)
            toast.error(error.response?.data?.detail || "Failed to upload file")
        } finally {
            setUploading(false)
        }
    }

    const handleEditExam = () => {
        if (result?.exam_id) {
            router.push(`/manage/exams/${result.exam_id}/edit`)
        }
    }

    const handleClose = () => {
        setFile(null)
        setResult(null)
        setSelectedCourseId("")
        setSelectedTopicId("")
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-0 border-0 shadow-2xl">
                <div className="p-8 bg-gradient-to-br from-indigo-50 to-purple-50 border-b border-slate-200">
                    <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <FileText className="h-6 w-6 text-white" />
                        </div>
                        Upload Exam Questions
                    </DialogTitle>
                    <DialogDescription className="text-slate-600 mt-2 text-base">
                        Create a generic practice exam by uploading questions from Excel
                    </DialogDescription>
                </div>

                <div className="p-8 space-y-6">
                    {!result ? (
                        <>
                            {/* Step 1: Download Template */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold">1</div>
                                    <h3 className="font-semibold text-slate-900">Download Template</h3>
                                </div>
                                <div className="pl-8">
                                    <Button
                                        onClick={handleDownloadTemplate}
                                        disabled={downloading}
                                        variant="outline"
                                        className="border-indigo-200 hover:bg-indigo-50"
                                    >
                                        {downloading ? (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                            <Download className="h-4 w-4 mr-2" />
                                        )}
                                        Download Excel Template
                                    </Button>
                                </div>
                            </div>

                            {/* Step 2: Exam Details */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="h-6 w-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-bold">2</div>
                                    <h3 className="font-semibold text-slate-900">Exam Details</h3>
                                </div>
                                <div className="pl-8 grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Course</Label>
                                        <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
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
                                    <div className="space-y-2">
                                        <Label>Exam Type</Label>
                                        <Select value={examType} onValueChange={setExamType}>
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
                                        <Label>Topic</Label>
                                        <Select
                                            value={selectedTopicId}
                                            onValueChange={setSelectedTopicId}
                                            disabled={!selectedCourseId || examType === 'FINAL'}
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
                                    <div className="space-y-2">
                                        <Label>Difficulty</Label>
                                        <Select value={difficulty} onValueChange={setDifficulty}>
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
                            </div>

                            {/* Step 3: Upload */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="h-6 w-6 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-sm font-bold">3</div>
                                    <h3 className="font-semibold text-slate-900">Upload Completed File</h3>
                                </div>
                                <div className="pl-8">
                                    <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 hover:border-indigo-300 transition-colors">
                                        <input
                                            type="file"
                                            accept=".xlsx,.xls"
                                            onChange={handleFileChange}
                                            className="hidden"
                                            id="exam-upload-file"
                                        />
                                        <label
                                            htmlFor="exam-upload-file"
                                            className="cursor-pointer flex flex-col items-center gap-2"
                                        >
                                            <FileSpreadsheet className="h-12 w-12 text-slate-400" />
                                            <div className="text-center">
                                                <p className="text-sm font-medium text-slate-700">
                                                    {file ? file.name : "Click to select Excel file"}
                                                </p>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        /* Results View */
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                {result.question_count > 0 ? (
                                    <CheckCircle className="h-8 w-8 text-emerald-500" />
                                ) : (
                                    <AlertCircle className="h-8 w-8 text-amber-500" />
                                )}
                                <div>
                                    <h3 className="font-bold text-lg text-slate-900">{result.message}</h3>
                                    <p className="text-sm text-slate-600">
                                        {result.question_count} questions imported
                                    </p>
                                </div>
                            </div>

                            {result.errors && result.errors.length > 0 && (
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 max-h-48 overflow-y-auto">
                                    <h4 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4" />
                                        Warnings ({result.errors.length})
                                    </h4>
                                    <ul className="space-y-1 text-sm text-amber-800">
                                        {result.errors.map((error: string, idx: number) => (
                                            <li key={idx} className="flex items-start gap-2">
                                                <span className="text-amber-500">•</span>
                                                <span>{error}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="pt-4 flex justify-center">
                                <Button
                                    onClick={handleEditExam}
                                    className="bg-indigo-600 text-white px-8 py-2 rounded-xl shadow-lg hover:bg-indigo-700 hover:scale-105 transition-all"
                                >
                                    Review & Edit Exam
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="p-6 bg-slate-50 border-t border-slate-200">
                    {!result ? (
                        <>
                            <Button variant="ghost" onClick={handleClose} className="rounded-xl">Cancel</Button>
                            <Button
                                onClick={handleUpload}
                                disabled={!file || uploading || !selectedTopicId}
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-lg"
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Importing...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-4 w-4 mr-2" />
                                        Import Questions
                                    </>
                                )}
                            </Button>
                        </>
                    ) : null}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
