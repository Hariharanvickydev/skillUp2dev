"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { getCourse, addTopic, updateTopic, deleteTopic, generateTopics, approveTopic, getContent, generateContent, getSyncStatus, syncCourse } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { ArrowLeft, Plus, RefreshCw, Pencil, Trash2, Play, CheckCircle, Loader2, FileText, Sparkles, BookOpen, Layers, Target, Wand2, Clock, GitCompare, ExternalLink, Copy, Eye, Edit3, ChevronDown } from "lucide-react"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { toast } from "sonner"
import * as XLSX from 'xlsx'

export default function LibraryCourseEditorPage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string

    const [course, setCourse] = useState<any>(null)
    const [topics, setTopics] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)
    const [isPublishing, setIsPublishing] = useState(false)

    // Content Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedTopic, setSelectedTopic] = useState<any>(null)
    const [contentLoading, setContentLoading] = useState(false)
    const [activeContent, setActiveContent] = useState<string>("")

    // Topic Management State
    const [editingTopic, setEditingTopic] = useState<any>(null)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isRegenerateDialogOpen, setIsRegenerateDialogOpen] = useState(false)
    const [topicToDelete, setTopicToDelete] = useState<any>(null)
    const [newTopicData, setNewTopicData] = useState({ title: "", description: "", order: topics.length + 1 })
    const [parentTopicForSubtopic, setParentTopicForSubtopic] = useState<any>(null)

    const [isRegenerateFeedbackOpen, setIsRegenerateFeedbackOpen] = useState(false)
    const [regenerateFeedback, setRegenerateFeedback] = useState("")

    // Sync State
    const [syncStatus, setSyncStatus] = useState<any>(null)
    const [isSyncDialogOpen, setIsSyncDialogOpen] = useState(false)
    const [syncLoading, setSyncLoading] = useState(false)
    const [selectedUpdate, setSelectedUpdate] = useState<any>(null)

    // Important Questions State
    const [importantQuestions, setImportantQuestions] = useState<any[]>([])
    const [iqLoading, setIqLoading] = useState(false)
    const [selectedQuestion, setSelectedQuestion] = useState<any>(null)
    const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false)
    const [isQuestionViewerMode, setIsQuestionViewerMode] = useState(false)
    const [isQuestionDeleteDialogOpen, setIsQuestionDeleteDialogOpen] = useState(false)
    const [questionToDelete, setQuestionToDelete] = useState<any>(null)
    const [isBulkImportOpen, setIsBulkImportOpen] = useState(false)
    const [bulkImportText, setBulkImportText] = useState("[]")
    const [showPreviewAnswers, setShowPreviewAnswers] = useState(false)

    const [questionForm, setQuestionForm] = useState({
        title: "",
        module_id: "none",
        type: "MCQ",
        marks: 2,
        question: "",
        options: ["", "", "", ""],
        correct_answer: "",
        explanation: "",
        is_public: false
    })

    useEffect(() => {
        if (selectedQuestion) {
            setQuestionForm({
                title: selectedQuestion.title || "",
                module_id: selectedQuestion.module_id || "none",
                type: selectedQuestion.content?.type || "MCQ",
                marks: selectedQuestion.content?.marks || 2,
                question: selectedQuestion.content?.question || "",
                options: selectedQuestion.content?.options || ["", "", "", ""],
                correct_answer: selectedQuestion.content?.answer || "",
                explanation: selectedQuestion.content?.explanation || "",
                is_public: selectedQuestion.is_public || false
            })
        } else {
            setQuestionForm({
                title: "",
                module_id: "none",
                type: "MCQ",
                marks: 2,
                question: "",
                options: ["", "", "", ""],
                correct_answer: "",
                explanation: "",
                is_public: false
            })
        }
    }, [selectedQuestion, isQuestionDialogOpen])

    const fetchCourse = async () => {
        try {
            const data = await getCourse(id)
            setCourse(data)
            if (data.topics) setTopics(data.topics)
        } catch (e) {
            console.error(e)
            toast.error("Failed to load course details")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCourse()
        fetchQuestions()
    }, [id])

    const fetchQuestions = async () => {
        setIqLoading(true)
        try {
            const { getImportantQuestions } = await import("@/lib/api")
            const data = await getImportantQuestions(id)
            setImportantQuestions(data)
        } catch (e) {
            console.error(e)
            toast.error("Failed to load important questions")
        } finally {
            setIqLoading(false)
        }
    }

    const handleViewContent = async (topic: any) => {
        router.push(`/admin/library/${id}/topic/${topic.id}`)
    }

    const handleEditTopic = async () => {
        if (!editingTopic) return
        try {
            await updateTopic(editingTopic.id, {
                title: editingTopic.title,
                description: editingTopic.description,
                order: editingTopic.order
            })
            setIsEditDialogOpen(false)
            fetchCourse()
            toast.success('Topic updated successfully!')
        } catch (e) {
            console.error(e)
            toast.error('Failed to update topic')
        }
    }

    const handleDeleteTopic = async () => {
        if (!topicToDelete) return
        try {
            await deleteTopic(topicToDelete.id)
            setIsDeleteDialogOpen(false)
            setTopicToDelete(null)
            fetchCourse()
            toast.success('Topic deleted successfully!')
        } catch (e) {
            console.error(e)
            toast.error('Failed to delete topic')
        }
    }

    const handleAddTopic = async () => {
        if (!newTopicData.title) return
        try {
            const topicData = parentTopicForSubtopic
                ? {
                    ...newTopicData,
                    parent_topic_id: parentTopicForSubtopic.id,
                    order: topics.filter((t: any) => t.parent_topic_id === parentTopicForSubtopic.id).length + 1
                }
                : {
                    ...newTopicData,
                    order: topics.filter((t: any) => !t.parent_topic_id).length + 1
                }

            await addTopic(id, topicData)
            setIsAddDialogOpen(false)
            setParentTopicForSubtopic(null)
            setNewTopicData({ title: "", description: "", order: topics.length + 1 })
            fetchCourse()
            toast.success('Topic added successfully!')
        } catch (e) {
            console.error(e)
            toast.error('Failed to add topic')
        }
    }

    const handleRegenerateTopics = async () => {
        setGenerating(true)
        try {
            await generateTopics(id)
            setIsRegenerateDialogOpen(false)
            fetchCourse()
            toast.success('Topics regenerated successfully!')
        } catch (e) {
            console.error(e)
            toast.error('Failed to generate topics')
        } finally {
            setGenerating(false)
        }
    }

    const handlePublishModule = async (moduleId: string, moduleTitle: string) => {
        setIsPublishing(true)
        try {
            const response = await fetch(`http://localhost:8000/courses/${id}/modules/${moduleId}/publish`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })

            if (!response.ok) {
                const error = await response.json()
                toast.error(error.detail || 'Failed to publish module')
                setIsPublishing(false)
                return
            }

            // Re-fetch and directly update state
            const data = await getCourse(id)
            setCourse(data)
            if (data.topics) setTopics(data.topics)

            toast.success(`Module "${moduleTitle}" published successfully!`)
        } catch (e) {
            console.error(e)
            toast.error('Failed to publish module')
        } finally {
            setIsPublishing(false)
        }
    }

    const handleCheckSync = async () => {
        setSyncLoading(true)
        try {
            const status = await getSyncStatus(id)
            setSyncStatus(status)
            setIsSyncDialogOpen(true)
        } catch (e) {
            toast.error("Failed to check for updates")
        } finally {
            setSyncLoading(false)
        }
    }

    const handleSyncItem = async (libraryTopicId: string, action: string) => {
        try {
            await syncCourse(id, [{ library_topic_id: libraryTopicId, action }])
            toast.success(action === "OVERWRITE" ? "Topic updated successfully" : "Topic created successfully")
            // Refresh status
            handleCheckSync()
            // Refresh course data
            fetchCourse()
        } catch (e) {
            toast.error("Failed to sync topic")
        }
    }

    // Stats Calculation
    const allSubtopics = topics.filter(t => t.parent_topic_id)
    const totalSubtopics = allSubtopics.length
    const approvedSubtopics = allSubtopics.filter(t => t.status === 'APPROVED')
    const completionPercentage = totalSubtopics > 0 ? Math.round((approvedSubtopics.length / totalSubtopics) * 100) : 0

    const parentModules = topics.filter(t => !t.parent_topic_id)
    const publishedModulesCount = parentModules.filter(t => t.is_published).length
    const readyToPublishCount = parentModules.filter(t => {
        if (t.is_published) return false
        const children = topics.filter(child => child.parent_topic_id === t.id)
        return children.length > 0 && children.every(child => child.status === 'APPROVED')
    }).length

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mb-4"></div>
                <p className="text-slate-500 font-medium">Loading Editor...</p>
            </div>
        )
    }

    if (!course) return <div className="p-12 text-center text-slate-500">Course not found</div>

    return (
        <div className="max-w-7xl mx-auto p-8 lg:p-12 space-y-10 pb-20">
            {/* Header Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 p-8 text-white shadow-2xl shadow-indigo-900/20">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-80 w-80 rounded-full bg-purple-500/20 blur-3xl"></div>

                <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-2 text-indigo-200">
                        <Button variant="ghost" className="text-indigo-200 hover:text-white p-0 h-auto hover:bg-transparent" onClick={() => router.push('/admin/library')}>
                            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Library
                        </Button>
                    </div>

                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl font-bold tracking-tight text-white">
                                    {course.title}
                                </h1>
                                {course.status === 'PUBLISHED' && (
                                    <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 text-xs font-semibold rounded-full flex items-center gap-1">
                                        <CheckCircle className="h-3 w-3" /> Published
                                    </span>
                                )}
                                {course.category && (
                                    <span className="px-2 py-0.5 bg-white/10 border border-white/20 text-white/80 text-xs font-semibold rounded-full">
                                        {course.category}
                                    </span>
                                )}
                            </div>
                            <p className="text-indigo-200 text-lg max-w-2xl line-clamp-2">
                                {course.description || "No description provided."}
                            </p>
                        </div>

                        <div className="flex gap-3">
                            {topics.length > 0 && (
                                <Button
                                    onClick={() => setIsRegenerateDialogOpen(true)}
                                    className="bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-sm"
                                >
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Regenerate Syllabus
                                </Button>
                            )}
                            {course.parent_course_id && (
                                <Button
                                    onClick={handleCheckSync}
                                    className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-100 border border-indigo-500/20 backdrop-blur-sm"
                                >
                                    {syncLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GitCompare className="mr-2 h-4 w-4" />}
                                    Check for Updates
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="content" className="space-y-6 w-full">
                <TabsList className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 w-full flex h-auto">
                    <TabsTrigger value="content" className="flex-1 px-6 py-2.5 rounded-lg data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 data-[state=active]:font-semibold text-slate-600">Course Content</TabsTrigger>
                    <TabsTrigger value="questions" className="flex-1 px-6 py-2.5 rounded-lg data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 data-[state=active]:font-semibold text-slate-600">Important Questions</TabsTrigger>
                    <TabsTrigger value="preview" className="flex-1 px-6 py-2.5 rounded-lg data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 data-[state=active]:font-semibold text-slate-600">Student Preview</TabsTrigger>
                </TabsList>

                <TabsContent value="content" className="space-y-10">
                    {/* Progress Dashboard */}
                    {topics.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Content Progress */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Content Creation</p>
                                        <h3 className="text-3xl font-bold text-slate-900 mt-1">{approvedSubtopics.length} <span className="text-lg text-slate-400 font-normal">/ {totalSubtopics} Topics</span></h3>
                                    </div>
                                    <div className="h-10 w-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                                        <FileText className="h-5 w-5" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-medium text-slate-600">
                                        <span>{completionPercentage}% Complete</span>
                                        <span>{totalSubtopics - approvedSubtopics.length} Pending</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${completionPercentage}%` }}></div>
                                    </div>
                                </div>
                            </div>

                            {/* Modules Ready */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Ready to Publish</p>
                                        <h3 className="text-3xl font-bold text-slate-900 mt-1">{readyToPublishCount} <span className="text-lg text-slate-400 font-normal">Modules</span></h3>
                                    </div>
                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${readyToPublishCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'}`}>
                                        <Clock className="h-5 w-5" />
                                    </div>
                                </div>
                                <p className="text-sm text-slate-500">
                                    {readyToPublishCount > 0
                                        ? "Modules have all content approved and are awaiting publication."
                                        : "Approve all topics in a module to make it ready."}
                                </p>
                            </div>

                            {/* Published */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Live Content</p>
                                        <h3 className="text-3xl font-bold text-emerald-700 mt-1">{publishedModulesCount} <span className="text-lg text-slate-400 font-normal">Modules</span></h3>
                                    </div>
                                    <div className="h-10 w-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                                        <CheckCircle className="h-5 w-5" />
                                    </div>
                                </div>
                                <p className="text-sm text-slate-500">
                                    Content currently accessible to students on the LMS.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Main Content Area */}
                    <div className="relative z-20">
                        {/* Empty State / Initial Generation */}
                        {topics.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 shadow-sm">
                                <div className="h-24 w-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Sparkles className="h-12 w-12 text-indigo-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900 mb-3">Let's build your curriculum</h2>
                                <p className="text-slate-500 max-w-md mx-auto mb-8">
                                    Our AI can generate a complete syllabus with modules and topics based on your course details. Or you can start from scratch.
                                </p>
                                <div className="flex justify-center gap-4">
                                    <Button
                                        onClick={handleRegenerateTopics}
                                        disabled={generating}
                                        className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white h-12 px-8 rounded-xl font-semibold shadow-lg shadow-indigo-500/25 transition-all hover:scale-105"
                                    >
                                        {generating ? (
                                            <>
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                Generating Syllabus...
                                            </>
                                        ) : (
                                            <>
                                                <Wand2 className="mr-2 h-5 w-5" />
                                                Generate with AI
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="h-12 px-8 rounded-xl border-slate-200 text-slate-700"
                                        onClick={() => { setParentTopicForSubtopic(null); setIsAddDialogOpen(true); }}
                                    >
                                        <Plus className="mr-2 h-5 w-5" />
                                        Allow Manual Creation
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            /* Topics List */
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                        <Layers className="h-5 w-5 text-indigo-600" /> Course Modules
                                    </h2>
                                    <Button
                                        onClick={() => { setParentTopicForSubtopic(null); setIsAddDialogOpen(true); }}
                                        className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-200"
                                    >
                                        <Plus className="mr-2 h-4 w-4" /> Add Module
                                    </Button>
                                </div>

                                <div className="grid gap-6">
                                    {topics
                                        .filter((topic: any) => !topic.parent_topic_id)
                                        .sort((a: any, b: any) => a.order - b.order)
                                        .map((parentTopic: any) => {
                                            const subTopics = topics
                                                .filter((t: any) => t.parent_topic_id === parentTopic.id)
                                                .sort((a: any, b: any) => a.order - b.order)

                                            return (
                                                <div key={parentTopic.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
                                                    <div className="bg-slate-50/50 border-b border-slate-100 p-5 px-6">
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div>
                                                                <div className="flex items-center gap-3">
                                                                    <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-indigo-100/50 text-indigo-700 font-bold text-sm">
                                                                        {parentTopic.order}
                                                                    </span>
                                                                    <h3 className="text-lg font-bold text-slate-900">{parentTopic.title}</h3>
                                                                    {!parentTopic.is_published && (
                                                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs font-semibold rounded-full">Draft</span>
                                                                    )}
                                                                    {parentTopic.is_published && (
                                                                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full flex items-center gap-1">
                                                                            <CheckCircle className="h-3 w-3" /> Live
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-slate-500 text-sm mt-2 ml-11 max-w-3xl">{parentTopic.description}</p>
                                                            </div>
                                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Button variant="ghost" size="icon" onClick={() => { setEditingTopic(parentTopic); setIsEditDialogOpen(true); }}>
                                                                    <Pencil className="h-4 w-4 text-slate-400 hover:text-indigo-600" />
                                                                </Button>
                                                                <Button variant="ghost" size="icon" onClick={() => { setTopicToDelete(parentTopic); setIsDeleteDialogOpen(true); }}>
                                                                    <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-600" />
                                                                </Button>
                                                            </div>
                                                        </div>

                                                        <div className="mt-4 ml-11 flex gap-3">
                                                            {!parentTopic.is_published && subTopics.length > 0 && subTopics.every((t: any) => t.status === 'APPROVED') && (
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => handlePublishModule(parentTopic.id, parentTopic.title)}
                                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white h-9"
                                                                    disabled={isPublishing}
                                                                >
                                                                    {isPublishing ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <CheckCircle className="h-3 w-3 mr-2" />}
                                                                    Publish Module
                                                                </Button>
                                                            )}
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => {
                                                                    setParentTopicForSubtopic(parentTopic);
                                                                    setNewTopicData({ title: "", description: "", order: subTopics.length + 1 });
                                                                    setIsAddDialogOpen(true);
                                                                }}
                                                                className="h-9"
                                                            >
                                                                <Plus className="h-3 w-3 mr-2" />
                                                                Add Topic
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    {subTopics.length > 0 && (
                                                        <div className="divide-y divide-slate-50">
                                                            {subTopics.map((topic: any) => (
                                                                <div key={topic.id} className="p-4 pl-16 pr-6 flex items-center justify-between hover:bg-indigo-50/30 transition-colors group/topic">
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="h-1.5 w-1.5 rounded-full bg-slate-300 group-hover/topic:bg-indigo-400"></div>
                                                                        <div>
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="text-sm font-semibold text-slate-700">{topic.title}</span>
                                                                                {topic.status === 'APPROVED' && <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />}

                                                                                {/* Content Status Indicator */}
                                                                                {topic.has_content ? (
                                                                                    <span className="ml-2 px-1.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                                                                        <FileText className="h-3 w-3" /> Content
                                                                                    </span>
                                                                                ) : (
                                                                                    <span className="ml-2 px-1.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                                                                        <FileText className="h-3 w-3" /> Empty
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex items-center gap-2 max-w-md">
                                                                                <p className="text-xs text-slate-400 truncate">{topic.description}</p>
                                                                                {topic.description && (
                                                                                    <Popover>
                                                                                        <PopoverTrigger asChild>
                                                                                            <Button variant="ghost" size="icon" className="h-4 w-4 shrink-0 text-slate-400 hover:text-indigo-600">
                                                                                                <Eye className="h-3 w-3" />
                                                                                                <span className="sr-only">View Description</span>
                                                                                            </Button>
                                                                                        </PopoverTrigger>
                                                                                        <PopoverContent className="w-80 p-4" align="start">
                                                                                            <h4 className="font-semibold text-sm mb-2 text-slate-900">{topic.title}</h4>
                                                                                            <p className="text-sm text-slate-600 leading-relaxed">{topic.description}</p>
                                                                                        </PopoverContent>
                                                                                    </Popover>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-3">
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            className={topic.status === 'APPROVED' ? "border-emerald-200 text-emerald-700 bg-emerald-50" : "bg-white border-slate-200 hover:border-indigo-300 hover:text-indigo-600"}
                                                                            onClick={() => handleViewContent(topic)}
                                                                        >
                                                                            <Edit3 className="h-3 w-3 mr-2" />
                                                                            {topic.status === 'APPROVED' ? " Edit / Review" : "Generate / Edit"}
                                                                        </Button>
                                                                        <div className="flex gap-1 opacity-0 group-hover/topic:opacity-100 transition-opacity">
                                                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingTopic(topic); setIsEditDialogOpen(true); }}>
                                                                                <Pencil className="h-3.5 w-3.5 text-slate-400" />
                                                                            </Button>
                                                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setTopicToDelete(topic); setIsDeleteDialogOpen(true); }}>
                                                                                <Trash2 className="h-3.5 w-3.5 text-slate-400 hover:text-red-500" />
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                </div>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="questions">
                    {/* Important Questions UI */}
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Important Questions</h2>
                                <p className="text-slate-500 text-sm mt-1">Manage key questions for exam preparation</p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setIsBulkImportOpen(true)}>
                                    <FileText className="mr-2 h-4 w-4" /> Bulk Import
                                </Button>
                                <Button onClick={() => { setSelectedQuestion(null); setIsQuestionViewerMode(false); setIsQuestionDialogOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                    <Plus className="mr-2 h-4 w-4" /> Add Question
                                </Button>
                            </div>
                        </div>

                        <div className="p-8">
                            {iqLoading ? (
                                <div className="flex items-center justify-center py-20 text-slate-400">
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                </div>
                            ) : importantQuestions.length === 0 ? (
                                <div className="text-center py-20">
                                    <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Sparkles className="h-10 w-10 text-slate-300" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-900">No questions yet</h3>
                                    <p className="text-slate-500 mb-6 max-w-sm mx-auto">Start by adding questions that will help students prepare for their exams.</p>
                                    <Button variant="outline" onClick={() => setIsQuestionDialogOpen(true)}>Create First Question</Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {importantQuestions.map((q: any) => (
                                        <div key={q.id} className="p-4 border border-slate-200 rounded-xl hover:border-indigo-200 hover:shadow-sm transition-all bg-white group">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className={cn("px-2 py-0.5 text-xs font-bold rounded-full uppercase",
                                                            q.content?.type === 'MCQ' ? "bg-blue-100 text-blue-700" :
                                                                q.content?.type === 'TRUE_FALSE' ? "bg-emerald-100 text-emerald-700" :
                                                                    "bg-slate-100 text-slate-700"
                                                        )}>
                                                            {q.content?.type || 'Question'}
                                                        </span>
                                                        <div className="flex items-center gap-4 ml-auto">
                                                            {q.module_id && (
                                                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                                                    <Layers className="h-3 w-3" />
                                                                    {topics.find(t => t.id === q.module_id)?.title || 'Module'}
                                                                </span>
                                                            )}
                                                            <div className="flex items-center gap-2" title="Toggle Publish Status">
                                                                <Switch
                                                                    checked={q.is_public}
                                                                    onCheckedChange={async (checked) => {
                                                                        try {
                                                                            const { updateImportantQuestion } = await import("@/lib/api")
                                                                            // Optimistic UI update could be done here, but fetchQuestions ensures sync
                                                                            await updateImportantQuestion(id, q.id, { is_public: checked })
                                                                            toast.success(checked ? "Question published" : "Question unpublished")
                                                                            fetchQuestions()
                                                                        } catch (e) {
                                                                            console.error(e)
                                                                            toast.error("Failed to update status")
                                                                        }
                                                                    }}
                                                                />
                                                                <span className={cn("text-xs font-semibold w-16", q.is_public ? "text-emerald-600" : "text-slate-400")}>
                                                                    {q.is_public ? "Published" : "Draft"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <h4 className="font-semibold text-slate-900 text-lg mb-2">{q.title}</h4>
                                                    <p className="text-slate-600 line-clamp-2 text-sm">{q.content?.question || q.title}</p>
                                                </div>
                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="icon" onClick={() => { setSelectedQuestion(q); setIsQuestionViewerMode(true); setIsQuestionDialogOpen(true); }}>
                                                        <Eye className="h-4 w-4 text-slate-400 hover:text-indigo-600" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => { setSelectedQuestion(q); setIsQuestionViewerMode(false); setIsQuestionDialogOpen(true); }}>
                                                        <Pencil className="h-4 w-4 text-slate-400 hover:text-indigo-600" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => { setQuestionToDelete(q); setIsQuestionDeleteDialogOpen(true); }}>
                                                        <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-600" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="preview" className="space-y-6">
                    <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Student Exam Preview</h3>
                            <p className="text-sm text-slate-500">Preview how questions will appear to students, grouped by type.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Label htmlFor="show-answers" className="text-sm font-medium text-slate-700">Show Answers</Label>
                            <Switch
                                id="show-answers"
                                checked={showPreviewAnswers}
                                onCheckedChange={setShowPreviewAnswers}
                            />
                        </div>
                    </div>

                    <div className="space-y-6">
                        {importantQuestions.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200">
                                <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                                    <Eye className="h-6 w-6" />
                                </div>
                                <h3 className="text-lg font-medium text-slate-900">No Questions to Preview</h3>
                                <p className="text-slate-500 max-w-sm mx-auto mt-1">Add some important questions to the bank to see a preview of how they'll look to students.</p>
                            </div>
                        ) : (
                            ['MCQ', 'TRUE_FALSE', 'SHORT_ANSWER', 'LONG_ANSWER'].map((type) => {
                                const typeQuestions = importantQuestions.filter((q: any) => q.content?.type === type);
                                if (typeQuestions.length === 0) return null;

                                const typeLabels: Record<string, string> = {
                                    'MCQ': 'Multiple Choice Questions',
                                    'TRUE_FALSE': 'True / False',
                                    'SHORT_ANSWER': 'Short Answer Questions',
                                    'LONG_ANSWER': 'Long Answer Questions'
                                };

                                return (
                                    <Collapsible key={type} defaultOpen className="space-y-4">
                                        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors group">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                                    <Layers className="h-4 w-4" />
                                                </div>
                                                <div className="text-left">
                                                    <h4 className="font-semibold text-slate-900">{typeLabels[type]}</h4>
                                                    <p className="text-xs text-slate-500">{typeQuestions.length} Questions</p>
                                                </div>
                                            </div>
                                            <ChevronDown className="h-5 w-5 text-slate-400 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                                        </CollapsibleTrigger>
                                        <CollapsibleContent className="space-y-4">
                                            {typeQuestions.map((q: any, index: number) => (
                                                <div key={q.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                                    <div className="flex items-start gap-4">
                                                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm shrink-0">
                                                            {index + 1}
                                                        </div>
                                                        <div className="flex-1 space-y-4">
                                                            <div className="flex justify-between items-start">
                                                                <h4 className="text-lg font-medium text-slate-900 leading-relaxed">{q.content?.question}</h4>
                                                                <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded">
                                                                    {q.content?.marks} Marks
                                                                </span>
                                                            </div>

                                                            {/* MCQ Preview */}
                                                            {q.content?.type === 'MCQ' && (
                                                                <div className="space-y-3">
                                                                    {q.content?.options?.map((opt: string, i: number) => {
                                                                        const isCorrect = showPreviewAnswers && q.content?.answer === opt;
                                                                        return (
                                                                            <div key={i} className={cn(
                                                                                "p-3 rounded-lg border flex items-center gap-3 transition-colors",
                                                                                isCorrect ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-200"
                                                                            )}>
                                                                                <div className={cn(
                                                                                    "h-5 w-5 rounded-full border-2 flex items-center justify-center",
                                                                                    isCorrect ? "border-emerald-600" : "border-slate-300"
                                                                                )}>
                                                                                    {isCorrect && <div className="h-2.5 w-2.5 rounded-full bg-emerald-600" />}
                                                                                </div>
                                                                                <span className={cn(isCorrect ? "text-emerald-900 font-medium" : "text-slate-700")}>{opt}</span>
                                                                                {isCorrect && <span className="ml-auto text-xs font-bold text-emerald-600 uppercase">Correct Answer</span>}
                                                                            </div>
                                                                        )
                                                                    })}
                                                                </div>
                                                            )}

                                                            {/* True/False Preview */}
                                                            {q.content?.type === 'TRUE_FALSE' && (
                                                                <div className="flex gap-4">
                                                                    {['True', 'False'].map((val) => {
                                                                        const isCorrect = showPreviewAnswers && q.content?.answer === val;
                                                                        return (
                                                                            <div key={val} className={cn(
                                                                                "flex-1 p-4 rounded-lg border text-center font-medium transition-colors",
                                                                                isCorrect ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "bg-white border-slate-200 text-slate-700"
                                                                            )}>
                                                                                {val}
                                                                                {isCorrect && <div className="text-xs text-emerald-600 font-bold mt-1">Correct Answer</div>}
                                                                            </div>
                                                                        )
                                                                    })}
                                                                </div>
                                                            )}

                                                            {/* Short/Long Answer Preview */}
                                                            {(q.content?.type === 'SHORT_ANSWER' || q.content?.type === 'LONG_ANSWER') && (
                                                                <div className="space-y-3">
                                                                    <Textarea
                                                                        placeholder="Student would verify answer here..."
                                                                        className="min-h-[100px] resize-none"
                                                                        disabled
                                                                    />
                                                                    {showPreviewAnswers && (
                                                                        <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                                                                            <p className="text-xs font-bold text-emerald-700 uppercase mb-1">Model Answer / Key Points</p>
                                                                            <p className="text-sm text-emerald-900">{q.content?.answer || "No model answer provided."}</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </CollapsibleContent>
                                    </Collapsible>
                                );
                            })
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Questions Dialog */}
            <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{isQuestionViewerMode ? 'View Question' : selectedQuestion ? 'Edit Question' : 'Create Question'}</DialogTitle>
                        <DialogDescription>{isQuestionViewerMode ? 'Read-only view of the question details' : 'Add or modify questions for this course'}</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Question Title</Label>
                                <Input
                                    disabled={isQuestionViewerMode}
                                    placeholder="e.g. Fundamental React Concepts"
                                    value={questionForm.title}
                                    onChange={(e) => setQuestionForm({ ...questionForm, title: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Related Module</Label>
                                <Select disabled={isQuestionViewerMode} value={questionForm.module_id} onValueChange={(val) => setQuestionForm({ ...questionForm, module_id: val })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Module (Optional)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">-- No Specific Module --</SelectItem>
                                        {topics.filter(t => !t.parent_topic_id).map((t: any) => (
                                            <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Question Type</Label>
                                <Select disabled={isQuestionViewerMode} value={questionForm.type} onValueChange={(val) => setQuestionForm({ ...questionForm, type: val })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="MCQ">Multiple Choice</SelectItem>
                                        <SelectItem value="TRUE_FALSE">True / False</SelectItem>
                                        <SelectItem value="SHORT_ANSWER">Short Answer</SelectItem>
                                        <SelectItem value="LONG_ANSWER">Long Answer</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Marks</Label>
                                <Input
                                    disabled={isQuestionViewerMode}
                                    type="number"
                                    min="1"
                                    value={questionForm.marks}
                                    onChange={(e) => setQuestionForm({ ...questionForm, marks: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Question Text</Label>
                            <Textarea
                                disabled={isQuestionViewerMode}
                                placeholder="Enter the full question here..."
                                className="min-h-[100px]"
                                value={questionForm.question}
                                onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })}
                            />
                        </div>

                        {/* MCQ Options */}
                        {questionForm.type === 'MCQ' && (
                            <div className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-100">
                                <Label>Answer Options</Label>
                                {questionForm.options.map((opt, idx) => (
                                    <div key={idx} className="flex gap-2 items-center">
                                        <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0">
                                            {String.fromCharCode(65 + idx)}
                                        </div>
                                        <Input
                                            disabled={isQuestionViewerMode}
                                            value={opt}
                                            onChange={(e) => {
                                                const newOpts = [...questionForm.options]
                                                newOpts[idx] = e.target.value
                                                setQuestionForm({ ...questionForm, options: newOpts })
                                            }}
                                            placeholder={`Option ${idx + 1}`}
                                        />
                                        <input
                                            disabled={isQuestionViewerMode}
                                            type="radio"
                                            name="correct_answer"
                                            className="h-4 w-4 text-indigo-600 accent-indigo-600"
                                            checked={questionForm.correct_answer === opt && opt !== ""}
                                            onChange={() => setQuestionForm({ ...questionForm, correct_answer: opt })}
                                        />
                                    </div>
                                ))}
                                <p className="text-xs text-slate-500 text-right">Select the radio button for the correct answer</p>
                            </div>
                        )}

                        {/* True/False Options */}
                        {questionForm.type === 'TRUE_FALSE' && (
                            <div className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-100">
                                <Label>Correct Answer</Label>
                                <div className="flex gap-4">
                                    <div className={`flex-1 p-3 rounded-lg border cursor-pointer flex items-center gap-2 ${questionForm.correct_answer === 'True' ? 'bg-emerald-50 border-emerald-200 ring-1 ring-emerald-500' : 'bg-white border-slate-200'} ${isQuestionViewerMode ? 'pointer-events-none opacity-80' : ''}`} onClick={() => !isQuestionViewerMode && setQuestionForm({ ...questionForm, correct_answer: 'True' })}>
                                        <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${questionForm.correct_answer === 'True' ? 'border-emerald-500' : 'border-slate-300'}`}>
                                            {questionForm.correct_answer === 'True' && <div className="h-2 w-2 rounded-full bg-emerald-500" />}
                                        </div>
                                        <span className="font-medium">True</span>
                                    </div>
                                    <div className={`flex-1 p-3 rounded-lg border cursor-pointer flex items-center gap-2 ${questionForm.correct_answer === 'False' ? 'bg-red-50 border-red-200 ring-1 ring-red-500' : 'bg-white border-slate-200'} ${isQuestionViewerMode ? 'pointer-events-none opacity-80' : ''}`} onClick={() => !isQuestionViewerMode && setQuestionForm({ ...questionForm, correct_answer: 'False' })}>
                                        <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${questionForm.correct_answer === 'False' ? 'border-red-500' : 'border-slate-300'}`}>
                                            {questionForm.correct_answer === 'False' && <div className="h-2 w-2 rounded-full bg-red-500" />}
                                        </div>
                                        <span className="font-medium">False</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {(questionForm.type === 'SHORT_ANSWER' || questionForm.type === 'LONG_ANSWER') && (
                            <div className="space-y-2">
                                <Label>Model Answer / Key Points (Optional)</Label>
                                <Textarea
                                    disabled={isQuestionViewerMode}
                                    placeholder="Enter key points or a model answer for reference..."
                                    value={questionForm.correct_answer}
                                    onChange={(e) => setQuestionForm({ ...questionForm, correct_answer: e.target.value })}
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Explanation (Visible after answer)</Label>
                            <Textarea
                                disabled={isQuestionViewerMode}
                                placeholder="Explain why the answer is correct..."
                                value={questionForm.explanation}
                                onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                            />
                        </div>

                        {!isQuestionViewerMode && (
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                                <div>
                                    <h4 className="font-medium text-slate-900">Publish to Library</h4>
                                    <p className="text-xs text-slate-500">Mark as final. Cloned courses will receive this as a Draft.</p>
                                </div>
                                <Switch
                                    checked={questionForm.is_public}
                                    onCheckedChange={(checked) => setQuestionForm({ ...questionForm, is_public: checked })}
                                />
                            </div>
                        )}

                        {!isQuestionViewerMode && (
                            <Button className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={async () => {
                                if (!questionForm.title || !questionForm.question) {
                                    toast.error("Title and Question text are required")
                                    return
                                }

                                const payload = {
                                    title: questionForm.title,
                                    module_id: questionForm.module_id === "none" ? null : questionForm.module_id,
                                    is_public: questionForm.is_public,
                                    content: {
                                        type: questionForm.type,
                                        marks: questionForm.marks,
                                        question: questionForm.question,
                                        options: questionForm.type === 'MCQ' ? questionForm.options : [],
                                        answer: questionForm.correct_answer,
                                        explanation: questionForm.explanation
                                    }
                                }


                                try {
                                    const { createImportantQuestion, updateImportantQuestion } = await import("@/lib/api")
                                    if (selectedQuestion) {
                                        await updateImportantQuestion(id, selectedQuestion.id, payload)
                                        toast.success("Question updated")
                                    } else {
                                        await createImportantQuestion(id, payload)
                                        toast.success("Question created")
                                    }
                                    setIsQuestionDialogOpen(false)
                                    fetchQuestions()
                                } catch (e) {
                                    console.error(e)
                                    toast.error("Failed to save question")
                                }
                            }}>
                                {selectedQuestion ? 'Update Question' : 'Create Question'}
                            </Button>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isBulkImportOpen} onOpenChange={setIsBulkImportOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Bulk Import Questions (Excel)</DialogTitle>
                        <DialogDescription>
                            Download the template, add your questions in Excel, and upload to import.
                            <div className="mt-2 p-3 bg-blue-50 text-blue-800 rounded-md text-xs text-left space-y-1 border border-blue-100">
                                <p className="font-semibold">Formatting Guide:</p>
                                <ul className="list-disc pl-4 space-y-0.5">
                                    <li><strong>Type:</strong> Use <code>MCQ</code>, <code>TRUE_FALSE</code>, <code>SHORT_ANSWER</code>, or <code>LONG_ANSWER</code>.</li>
                                    <li><strong>MCQ Answer:</strong> Must match the <em>exact text</em> of one of the Options.</li>
                                    <li><strong>True/False Answer:</strong> Use <code>True</code> or <code>False</code>.</li>
                                    <li><strong>Columns:</strong> Do not change the header names (Title, Type, etc).</li>
                                </ul>
                            </div>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => {
                                const exportData = importantQuestions.length ? importantQuestions.map((q: any) => ({
                                    "Title": q.title,
                                    "Type": q.content?.type || "MCQ",
                                    "Question Text": q.content?.question,
                                    "Marks": q.content?.marks || 1,
                                    "Answer / Correct Option": q.content?.answer,
                                    "Option 1": q.content?.options?.[0] || "",
                                    "Option 2": q.content?.options?.[1] || "",
                                    "Option 3": q.content?.options?.[2] || "",
                                    "Option 4": q.content?.options?.[3] || "",
                                    "Explanation": q.content?.explanation || "",
                                    "Is Public": q.is_public ? "TRUE" : "FALSE"
                                })) : [{
                                    "Title": "Sample Question",
                                    "Type": "MCQ",
                                    "Question Text": "What is the capital of France?",
                                    "Marks": 1,
                                    "Answer / Correct Option": "Paris",
                                    "Option 1": "London",
                                    "Option 2": "Paris",
                                    "Option 3": "Berlin",
                                    "Option 4": "Rome",
                                    "Explanation": "Paris is the capital.",
                                    "Is Public": "FALSE"
                                }];

                                const ws = XLSX.utils.json_to_sheet(exportData);
                                const wb = XLSX.utils.book_new();
                                XLSX.utils.book_append_sheet(wb, ws, "Questions");
                                XLSX.writeFile(wb, "question_bank_template.xlsx");
                            }}>
                                <ArrowLeft className="h-4 w-4 mr-2 rotate-90" /> Download Excel List/Template
                            </Button>

                            <div className="relative">
                                <input
                                    type="file"
                                    accept=".xlsx, .xls"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        const reader = new FileReader();
                                        reader.onload = (e) => {
                                            try {
                                                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                                                const workbook = XLSX.read(data, { type: 'array' });
                                                const sheetName = workbook.SheetNames[0];
                                                const worksheet = workbook.Sheets[sheetName];
                                                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                                                // Transform Excel rows to App Schema
                                                const parsedQuestions = jsonData.map((row: any) => {
                                                    const options = [];
                                                    if (row["Option 1"]) options.push(row["Option 1"]);
                                                    if (row["Option 2"]) options.push(row["Option 2"]);
                                                    if (row["Option 3"]) options.push(row["Option 3"]);
                                                    if (row["Option 4"]) options.push(row["Option 4"]);

                                                    return {
                                                        title: row["Title"] || "Untitled Question",
                                                        module_id: null, // Default to no module
                                                        is_public: String(row["Is Public"]).toUpperCase() === "TRUE",
                                                        content: {
                                                            type: row["Type"] || "MCQ",
                                                            marks: Number(row["Marks"]) || 1,
                                                            question: row["Question Text"] || "",
                                                            options: options,
                                                            answer: row["Answer / Correct Option"] || "",
                                                            explanation: row["Explanation"] || ""
                                                        }
                                                    };
                                                });

                                                setBulkImportText(JSON.stringify(parsedQuestions, null, 2));
                                                toast.success(`Loaded ${parsedQuestions.length} questions from Excel`);
                                            } catch (err) {
                                                console.error(err);
                                                toast.error("Failed to parse Excel file");
                                            }
                                        };
                                        reader.readAsArrayBuffer(file);
                                    }}
                                />
                                <Button variant="secondary" size="sm">
                                    <ArrowLeft className="h-4 w-4 mr-2 -rotate-90" /> Upload Excel File
                                </Button>
                            </div>
                        </div>

                        {bulkImportText !== "[]" && (
                            <div className="mt-4 border border-slate-200 rounded-lg overflow-hidden">
                                <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
                                    <h4 className="text-xs font-semibold text-slate-700">Preview ({JSON.parse(bulkImportText).length} Questions)</h4>
                                </div>
                                <div className="max-h-[300px] overflow-y-auto bg-white p-2 space-y-2">
                                    {JSON.parse(bulkImportText).map((q: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded border border-transparent hover:border-slate-100 transition-colors">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <span className="text-xs font-mono text-slate-400 w-6">#{i + 1}</span>
                                                <div className="truncate">
                                                    <p className="text-sm font-medium text-slate-900 truncate">{q.title}</p>
                                                    <p className="text-xs text-slate-500 truncate max-w-[400px]">{q.content?.question}</p>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-full uppercase">
                                                {q.content?.type?.replace('_', ' ')}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsBulkImportOpen(false)}>Cancel</Button>
                        <Button onClick={async () => {
                            try {
                                const parsedQuestions = JSON.parse(bulkImportText)
                                if (!Array.isArray(parsedQuestions)) throw new Error("Must be an array")

                                // Smart De-duplication
                                const newQuestions = parsedQuestions.filter((newQ: any) => {
                                    // Check if this question already exists in importantQuestions
                                    // Match by Title AND Question Text to be safe
                                    const exists = importantQuestions.some((existingQ: any) =>
                                        existingQ.content?.question === newQ.content?.question &&
                                        existingQ.content?.type === newQ.content?.type
                                    );
                                    return !exists;
                                });

                                if (newQuestions.length === 0) {
                                    toast.info("No new questions found. All duplicates skipped.")
                                    return;
                                }

                                const { bulkImportImportantQuestions } = await import("@/lib/api")
                                await bulkImportImportantQuestions(id, newQuestions)

                                toast.success(`Imported ${newQuestions.length} questions` + (parsedQuestions.length > newQuestions.length ? ` (${parsedQuestions.length - newQuestions.length} duplicates skipped)` : ""))
                                setIsBulkImportOpen(false)
                                fetchQuestions()
                            } catch (e: any) {
                                toast.error("Invalid JSON format: " + e.message)
                            }
                        }}>
                            Import Questions
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={isQuestionDeleteDialogOpen} onOpenChange={setIsQuestionDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Question?</DialogTitle>
                        <DialogDescription>Are you sure you want to delete this question?</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsQuestionDeleteDialogOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={async () => {
                            if (!questionToDelete) return;
                            try {
                                const { deleteImportantQuestion } = await import("@/lib/api");
                                await deleteImportantQuestion(id, questionToDelete.id);
                                setImportantQuestions(importantQuestions.filter(q => q.id !== questionToDelete.id));
                                toast.success("Question deleted");
                                setIsQuestionDeleteDialogOpen(false);
                            } catch (e) {
                                toast.error("Failed to delete question");
                            }
                        }}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isSyncDialogOpen} onOpenChange={setIsSyncDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Course Updates (Smart Sync)</DialogTitle>
                    </DialogHeader>
                    {syncStatus?.status === 'UP_TO_DATE' ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                            <CheckCircle className="h-12 w-12 text-emerald-500 mb-4" />
                            <p className="text-lg font-medium">Your course is up to date!</p>
                            <p className="text-sm">No changes found in the central library.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <p className="text-slate-500">The following updates are available from the Central Library. Review and sync individually.</p>

                            <div className="grid gap-4">
                                {syncStatus?.updates.map((update: any, index: number) => (
                                    <div key={index} className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${update.type === 'NEW' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                                                        {update.type}
                                                    </span>
                                                    <h4 className="font-semibold text-slate-900">{update.library_topic.title}</h4>
                                                </div>
                                                <p className="text-sm text-slate-500 mt-1">{update.message}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                {update.type === 'NEW' ? (
                                                    <Button size="sm" onClick={() => handleSyncItem(update.library_topic.id, 'CREATE')} disabled={syncLoading}>
                                                        {syncLoading ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Plus className="mr-2 h-3 w-3" />} Add to Course
                                                    </Button>
                                                ) : (
                                                    <Button size="sm" variant="outline" onClick={() => setSelectedUpdate(selectedUpdate === update ? null : update)} disabled={syncLoading}>
                                                        {selectedUpdate === update ? 'Hide Diff' : 'Review Differences'}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Diff View */}
                                        {selectedUpdate === update && update.type === 'UPDATE_AVAILABLE' && (
                                            <div className="mt-4 bg-white rounded-lg border border-slate-200 overflow-hidden">
                                                <div className="grid grid-cols-2 text-xs font-semibold text-slate-500 border-b border-slate-200">
                                                    <div className="p-2 bg-slate-50 border-r border-slate-200">Library Version (New)</div>
                                                    <div className="p-2 bg-slate-50">Your Version (Current)</div>
                                                </div>
                                                <div className="grid grid-cols-2 text-sm">
                                                    <div className="p-4 border-r border-slate-200 bg-emerald-50/10 text-slate-800 whitespace-pre-wrap font-mono text-xs">
                                                        {update.library_content}
                                                    </div>
                                                    <div className="p-4 bg-amber-50/10 text-slate-800 whitespace-pre-wrap font-mono text-xs">
                                                        {update.local_content}
                                                    </div>
                                                </div>
                                                <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(update.library_content)
                                                            toast.success("Library content copied to clipboard")
                                                        }}
                                                        disabled={syncLoading}
                                                    >
                                                        <Copy className="mr-2 h-3 w-3" /> Copy New Content
                                                    </Button>
                                                    <Button size="sm" onClick={() => handleSyncItem(update.library_topic.id, 'OVERWRITE')} disabled={syncLoading}>
                                                        {syncLoading ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-2 h-3 w-3" />} Overwrite Mine
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Dialogs */}

            {/* Edit Topic */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Edit Topic</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <label className="text-sm font-medium">Title</label>
                            <Input value={editingTopic?.title || ""} onChange={(e) => setEditingTopic({ ...editingTopic, title: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Description</label>
                            <Textarea value={editingTopic?.description || ""} onChange={(e) => setEditingTopic({ ...editingTopic, description: e.target.value })} />
                        </div>
                        <Button onClick={handleEditTopic} className="w-full">Save Changes</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Add Topic */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{parentTopicForSubtopic ? 'Add Sub-Topic' : 'Add New Module'}</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <label className="text-sm font-medium">Title</label>
                            <Input value={newTopicData.title} onChange={(e) => setNewTopicData({ ...newTopicData, title: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Description</label>
                            <Textarea value={newTopicData.description} onChange={(e) => setNewTopicData({ ...newTopicData, description: e.target.value })} />
                        </div>
                        <Button onClick={handleAddTopic} className="w-full">Add {parentTopicForSubtopic ? 'Topic' : 'Module'}</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Topic?</AlertDialogTitle>
                        <AlertDialogDescription>Are you sure? This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteTopic} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Regenerate Confirmation */}
            <AlertDialog open={isRegenerateDialogOpen} onOpenChange={setIsRegenerateDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Regenerate Course Syllabus?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will use AI to completely rebuild the course structure. <span className="font-bold text-red-600">All existing topics and content will be deleted.</span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRegenerateTopics} className="bg-indigo-600 hover:bg-indigo-700">Yes, Regenerate</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Question Confirmation */}
            <AlertDialog open={isQuestionDeleteDialogOpen} onOpenChange={setIsQuestionDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Question?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this question? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={async () => {
                            if (!questionToDelete) return
                            try {
                                const { deleteImportantQuestion } = await import("@/lib/api")
                                await deleteImportantQuestion(id, questionToDelete.id)
                                toast.success("Question deleted")
                                setIsQuestionDeleteDialogOpen(false)
                                setQuestionToDelete(null)
                                fetchQuestions()
                            } catch (e) {
                                console.error(e)
                                toast.error("Failed to delete question")
                            }
                        }} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </div >
    )
}
