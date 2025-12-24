"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Brain, Loader2, Plus, Users, ArrowRight, Zap, ChevronDown, ChevronRight, BookOpen, Search, Sparkles } from "lucide-react"
import { getEnrolledCourses } from "@/lib/api"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface Course {
    id: string
    title: string
    code?: string
    topics?: any[]
    description?: string
}

export default function PracticeLibraryPage() {
    const router = useRouter()
    const [courses, setCourses] = useState<Course[]>([])
    const [selectedCourseId, setSelectedCourseId] = useState<string>("")
    const [loadingCourses, setLoadingCourses] = useState(true)

    // Expanded states
    const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({})

    // Create Modal State
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [practiceScope, setPracticeScope] = useState<'COURSE' | 'MODULE' | 'TOPIC'>('COURSE')
    const [selectedModuleId, setSelectedModuleId] = useState<string>("")
    const [selectedTopicId, setSelectedTopicId] = useState<string>("")
    const [config, setConfig] = useState({ difficulty: 'medium', num_questions: 10 })
    const [creating, setCreating] = useState(false)

    useEffect(() => {
        fetchCourses()
    }, [])

    const fetchCourses = async () => {
        try {
            const data = await getEnrolledCourses()
            const enrolled = Array.isArray(data) ? data : []
            setCourses(enrolled)
            if (enrolled.length > 0) {
                setSelectedCourseId(enrolled[0].id)
            }
        } catch (error) {
            toast.error("Failed to load courses")
        } finally {
            setLoadingCourses(false)
        }
    }

    const toggleModule = (moduleId: string) => {
        setExpandedModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }))
    }

    const handleCreateExam = async () => {
        if (!selectedCourseId) return
        setCreating(true)
        try {
            let url = 'http://localhost:8000/exams/'
            let body: any = {
                difficulty: config.difficulty,
                question_count: config.num_questions
            }

            if (practiceScope === 'COURSE') {
                body = {
                    course_id: selectedCourseId,
                    title: `Practice: ${selectedCourse?.title}`,
                    type: 'PRACTICE',
                    scope: 'COURSE',
                    difficulty: config.difficulty,
                    question_count: config.num_questions,
                }
            } else if (practiceScope === 'MODULE') {
                if (!selectedModuleId) { toast.error("Please select a module"); setCreating(false); return; }
                const mod = modules.find((m: any) => m.id === selectedModuleId)
                body = {
                    course_id: selectedCourseId,
                    title: `Practice: ${mod?.title}`,
                    type: 'PRACTICE',
                    scope: 'MODULE',
                    source_id: selectedModuleId,
                    difficulty: config.difficulty,
                    question_count: config.num_questions,
                }
            } else if (practiceScope === 'TOPIC') {
                if (!selectedTopicId) { toast.error("Please select a topic"); setCreating(false); return; }
                url = `http://localhost:8000/exams/topics/${selectedTopicId}/generate-practice-exam`
                body = {
                    difficulty: config.difficulty,
                    num_questions: config.num_questions
                }
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify(body)
            })

            if (!response.ok) throw new Error("Failed to create exam")
            const newExam = await response.json()

            setShowCreateModal(false)
            router.push(`/learn/courses/${selectedCourseId}/exam/${newExam.id}?returnTo=/learn/practice`)

        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setCreating(false)
        }
    }


    const selectedCourse = courses.find(c => c.id === selectedCourseId)
    // Organized Modules
    const modules = selectedCourse?.topics?.filter((t: any) => !t.parent_topic_id).sort((a: any, b: any) => a.order - b.order) || []

    // Helper to get topics
    const getTopics = (moduleId: string) =>
        selectedCourse?.topics?.filter((t: any) => t.parent_topic_id === moduleId).sort((a: any, b: any) => a.order - b.order) || []

    const availableTopics = selectedModuleId ? getTopics(selectedModuleId) : []


    if (loadingCourses) return <div className="flex justify-center h-screen items-center"><Loader2 className="animate-spin text-indigo-600" /></div>

    return (
        <div className="p-6 lg:p-10 space-y-8 pb-20 max-w-7xl mx-auto min-h-screen bg-slate-50 font-sans">

            {/* Header Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 p-8 lg:p-12 text-white shadow-xl shadow-indigo-900/20">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-80 w-80 rounded-full bg-purple-500/20 blur-3xl"></div>

                <div className="relative z-10">
                    <div className="space-y-4 max-w-2xl">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="bg-white/10 backdrop-blur-md p-2 rounded-lg">
                                    <Brain className="h-6 w-6 text-indigo-300" />
                                </div>
                                <h1 className="text-3xl font-bold tracking-tight">Practice Library</h1>
                            </div>
                            <p className="text-indigo-200 text-lg">
                                Master your subjects with unlimited AI-generated practice exams.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ACTION BAR: Create Button + Course Selector */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Card className="flex-1 w-full p-2 pl-4 flex items-center gap-4 border-none shadow-lg bg-white rounded-2xl">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap hidden sm:block">Active Course:</label>
                    <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                        <SelectTrigger className="w-full h-12 text-lg border-none bg-transparent shadow-none focus:ring-0 px-0">
                            <div className="flex items-center gap-3">
                                <BookOpen className="h-5 w-5 text-indigo-600" />
                                <SelectValue placeholder="Select a course..." />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            {courses.map(c => (
                                <SelectItem key={c.id} value={c.id} className="py-3 text-base">
                                    {c.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </Card>

                <Button
                    onClick={() => setShowCreateModal(true)}
                    className="w-full md:w-auto h-16 bg-white hover:bg-slate-50 text-indigo-600 border border-slate-200 hover:border-indigo-200 shadow-lg rounded-2xl px-8 text-lg font-bold transition-all hover:-translate-y-0.5 flex items-center gap-3"
                >
                    <div className="bg-indigo-100 p-2 rounded-lg">
                        <Plus className="h-6 w-6 text-indigo-600" />
                    </div>
                    Create New Practice
                </Button>
            </div>

            {/* CONTENT: Syllabus List (Reverted to Full Width) */}
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-700">
                {selectedCourse && modules.map((module: any) => (
                    <div key={module.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
                        {/* Module Header Row */}
                        <div className="p-5 flex items-center gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors" onClick={() => toggleModule(module.id)}>
                            <div className={cn("p-2 rounded-lg transition-colors", expandedModules[module.id] ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-500")}>
                                {expandedModules[module.id] ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                            </div>
                            <div className="flex-1">
                                <h3 className={cn("font-bold text-lg", expandedModules[module.id] ? "text-indigo-900" : "text-slate-700")}>{module.title}</h3>
                                <p className="text-sm text-slate-500 mt-0.5">{getTopics(module.id).length} Topics</p>
                            </div>
                        </div>

                        {/* Nested Topics List */}
                        {expandedModules[module.id] && (
                            <div className="border-t border-slate-100 bg-slate-50/30">
                                {getTopics(module.id).map((topic: any) => (
                                    <div key={topic.id} className="flex items-center justify-between p-4 pl-16 border-b border-slate-100 last:border-0 hover:bg-white transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className="h-2 w-2 rounded-full bg-indigo-400 group-hover:scale-125 transition-transform"></div>
                                            <span className="text-slate-700 font-medium group-hover:text-indigo-700 transition-colors">{topic.title}</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => router.push(`/learn/courses/${selectedCourseId}/topics/${topic.id}/exams?returnTo=/learn/practice`)}
                                            className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0"
                                        >
                                            View Exams <ArrowRight className="h-4 w-4 ml-1.5" />
                                        </Button>
                                    </div>
                                ))}
                                {getTopics(module.id).length === 0 && (
                                    <div className="p-4 pl-16 text-slate-400 text-sm italic">No topics found in this module.</div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* CREATE MODAL - Styled like Admin Create Modal */}
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                <DialogContent className="sm:max-w-2xl rounded-3xl p-0 overflow-hidden border-0 shadow-2xl bg-white">
                    <div className="p-8 text-center space-y-4 bg-white border-b border-slate-100">
                        <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center justify-center gap-3">
                            <Sparkles className="h-6 w-6 text-indigo-600" />
                            Generate Practice Exam
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 text-base max-w-md mx-auto">
                            Configure your AI-powered practice session. Select the scope and difficulty to get started instantly.
                        </DialogDescription>
                    </div>

                    <div className="p-8 space-y-6 bg-white">
                        {/* SCOPE SELECTION */}
                        <div className="space-y-3">
                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">1. Select Scope</Label>
                            <div className="grid grid-cols-3 gap-3">
                                <div
                                    onClick={() => setPracticeScope('COURSE')}
                                    className={cn("cursor-pointer border-2 rounded-xl p-4 text-center transition-all", practiceScope === 'COURSE' ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-indigo-200 bg-white")}
                                >
                                    <span className={cn("block font-bold text-sm", practiceScope === 'COURSE' ? "text-indigo-700" : "text-slate-600")}>Full Course</span>
                                </div>
                                <div
                                    onClick={() => setPracticeScope('MODULE')}
                                    className={cn("cursor-pointer border-2 rounded-xl p-4 text-center transition-all", practiceScope === 'MODULE' ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-indigo-200 bg-white")}
                                >
                                    <span className={cn("block font-bold text-sm", practiceScope === 'MODULE' ? "text-indigo-700" : "text-slate-600")}>Module</span>
                                </div>
                                <div
                                    onClick={() => setPracticeScope('TOPIC')}
                                    className={cn("cursor-pointer border-2 rounded-xl p-4 text-center transition-all", practiceScope === 'TOPIC' ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-indigo-200 bg-white")}
                                >
                                    <span className={cn("block font-bold text-sm", practiceScope === 'TOPIC' ? "text-indigo-700" : "text-slate-600")}>Topic</span>
                                </div>
                            </div>
                        </div>

                        {/* DYNAMIC DROPDOWNS */}
                        <div className="grid grid-cols-2 gap-4">
                            {(practiceScope === 'MODULE' || practiceScope === 'TOPIC') && (
                                <div className="space-y-2 col-span-2 sm:col-span-1">
                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Module</Label>
                                    <Select value={selectedModuleId} onValueChange={(v) => { setSelectedModuleId(v); setSelectedTopicId(""); }}>
                                        <SelectTrigger className="bg-white"><SelectValue placeholder="Select Module" /></SelectTrigger>
                                        <SelectContent>
                                            {modules.map((m: any) => <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            {practiceScope === 'TOPIC' && (
                                <div className="space-y-2 col-span-2 sm:col-span-1">
                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Topic</Label>
                                    <Select value={selectedTopicId} onValueChange={setSelectedTopicId} disabled={!selectedModuleId}>
                                        <SelectTrigger className="bg-white"><SelectValue placeholder="Select Topic" /></SelectTrigger>
                                        <SelectContent>
                                            {availableTopics.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>

                        {/* CONFIGURATION */}
                        <div className="space-y-3 pt-4 border-t border-slate-100">
                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">2. Configuration</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <Select value={config.difficulty} onValueChange={(v) => setConfig(prev => ({ ...prev, difficulty: v }))}>
                                    <SelectTrigger className="bg-white h-11"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="easy">Easy</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="hard">Hard</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={String(config.num_questions)} onValueChange={(v) => setConfig(prev => ({ ...prev, num_questions: parseInt(v) }))}>
                                    <SelectTrigger className="bg-white h-11"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="5">5 Questions</SelectItem>
                                        <SelectItem value="10">10 Questions</SelectItem>
                                        <SelectItem value="15">15 Questions</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <Button
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold h-14 rounded-2xl shadow-xl shadow-indigo-200 mt-4 transition-all hover:scale-[1.01]"
                            onClick={handleCreateExam}
                            disabled={creating || (practiceScope === 'MODULE' && !selectedModuleId) || (practiceScope === 'TOPIC' && !selectedTopicId)}
                        >
                            {creating ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2 h-5 w-5" />}
                            Generate Exam
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
