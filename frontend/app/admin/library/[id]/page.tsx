"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { getCourse, addTopic, updateTopic, deleteTopic, generateTopics, approveTopic, getContent, generateContent, getSyncStatus, syncCourse } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { ArrowLeft, Plus, RefreshCw, Pencil, Trash2, Play, CheckCircle, Loader2, FileText, Sparkles, BookOpen, Layers, Target, Wand2, Clock, GitCompare, ExternalLink, Copy } from "lucide-react"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { toast } from "sonner"

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
    }, [id])

    const handleViewContent = async (topic: any) => {
        setSelectedTopic(topic)
        setIsDialogOpen(true)
        setContentLoading(true)
        try {
            const response = await fetch(`http://localhost:8000/topics/${topic.id}/content`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })
            const data = await response.json()
            setActiveContent(data.content)
        } catch (error) {
            console.error('Error fetching content:', error)
            setActiveContent("")
        } finally {
            setContentLoading(false)
        }
    }

    const handleGenerateContent = async (feedback?: string) => {
        if (!selectedTopic) return
        setGenerating(true)
        setContentLoading(true)
        try {
            await fetch(`http://localhost:8000/topics/${selectedTopic.id}/generate-content`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ feedback: feedback || null })
            })
            const response = await fetch(`http://localhost:8000/topics/${selectedTopic.id}/content`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })
            const data = await response.json()
            setActiveContent(data.content)

            // Close feedback dialog and clear feedback
            setIsRegenerateFeedbackOpen(false)
            setRegenerateFeedback("")
            toast.success("Content generated successfully!")
        } catch (error) {
            console.error('Error generating content:', error)
            toast.error("Failed to generate content")
        } finally {
            setGenerating(false)
            setContentLoading(false)
        }
    }

    const handleApprove = async () => {
        if (!selectedTopic) return
        try {
            await approveTopic(selectedTopic.id)
            setIsDialogOpen(false)
            fetchCourse()
            toast.success('Content approved successfully!')
        } catch (e) {
            console.error(e)
            toast.error('Failed to approve content')
        }
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
                                                                    </div>
                                                                    <p className="text-xs text-slate-400 truncate max-w-md">{topic.description}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className={topic.status === 'APPROVED' ? "border-emerald-200 text-emerald-700 bg-emerald-50" : ""}
                                                                    onClick={() => handleViewContent(topic)}
                                                                >
                                                                    <FileText className="h-3 w-3 mr-2" />
                                                                    {topic.status === 'APPROVED' ? "Review Content" : "Generate / Edit"}
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

            {/* Content Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 overflow-hidden">
                    <DialogHeader className="px-8 py-6 border-b bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <span className="px-2 py-1 rounded bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider">Topic</span>
                            <DialogTitle className="text-xl font-bold text-slate-900">{selectedTopic?.title}</DialogTitle>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto bg-white p-8">
                        {contentLoading ? (
                            <div className="flex flex-col items-center justify-center h-full">
                                <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-4" />
                                <p className="text-slate-500">Loading content...</p>
                            </div>
                        ) : activeContent ? (
                            <div className="max-w-4xl mx-auto">
                                <article className="prose prose-slate prose-lg max-w-none">
                                    <Markdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            h1: ({ ...props }) => <h1 className="text-3xl font-bold text-slate-900 mt-8 mb-4 border-b-2 border-indigo-100 pb-2" {...props} />,
                                            h2: ({ ...props }) => <h2 className="text-2xl font-bold text-slate-800 mt-8 mb-4" {...props} />,
                                            ul: ({ ...props }) => <ul className="list-disc list-inside space-y-2 mb-4" {...props} />,
                                            blockquote: ({ ...props }) => <blockquote className="border-l-4 border-indigo-500 bg-indigo-50 pl-4 py-3 my-4 italic text-slate-700 rounded-r" {...props} />,
                                            code({ inline, className, children, ...props }: any) {
                                                const match = /language-(\w+)/.exec(className || '')
                                                return !inline && match ? (
                                                    <div className="rounded-lg overflow-hidden my-6 border border-slate-200 shadow-sm">
                                                        <div className="bg-slate-800 text-slate-300 px-4 py-2 text-xs font-mono uppercase tracking-wider border-b border-slate-700">
                                                            {match[1]}
                                                        </div>
                                                        <SyntaxHighlighter
                                                            style={vscDarkPlus}
                                                            language={match[1]}
                                                            PreTag="div"
                                                            customStyle={{ margin: 0, borderRadius: 0 }}
                                                        >
                                                            {String(children).replace(/\n$/, '')}
                                                        </SyntaxHighlighter>
                                                    </div>
                                                ) : (
                                                    <code className="bg-slate-100 text-indigo-600 px-1.5 py-0.5 rounded font-mono text-sm font-semibold" {...props}>
                                                        {children}
                                                    </code>
                                                )
                                            }
                                        }}
                                    >
                                        {activeContent}
                                    </Markdown>
                                </article>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/50">
                                <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                                    <FileText className="h-8 w-8 text-slate-300" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">No Content Yet</h3>
                                <p className="text-slate-500 mb-6 max-w-sm text-center">This topic is empty. Use our AI to generate high-quality educational content in seconds.</p>
                                <Button onClick={() => handleGenerateContent()} disabled={generating} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200">
                                    {generating ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Wand2 className="mr-2 h-4 w-4" /> Generate Content with AI
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>

                    {activeContent && (
                        <div className="p-4 border-t bg-slate-50 flex justify-between items-center px-8">
                            <div className="text-sm font-medium">
                                {selectedTopic?.status === 'APPROVED' ? (
                                    <span className="text-emerald-600 flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4" /> Approved & Ready
                                    </span>
                                ) : (
                                    <span className="text-amber-600 flex items-center gap-2">
                                        <Clock className="h-4 w-4" /> Draft - Needs Approval
                                    </span>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsRegenerateFeedbackOpen(true)}
                                    disabled={generating}
                                >
                                    <RefreshCw className="mr-2 h-4 w-4" /> Regenerate
                                </Button>
                                {selectedTopic?.status !== 'APPROVED' && (
                                    <Button onClick={handleApprove} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                        <CheckCircle className="mr-2 h-4 w-4" /> Approve Content
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Dialogs */}

            {/* Regenerate Feedback */}
            <Dialog open={isRegenerateFeedbackOpen} onOpenChange={setIsRegenerateFeedbackOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Regenerate Content</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <label className="text-sm font-medium text-slate-700">Improvement Instructions (Optional)</label>
                        <Textarea
                            placeholder="e.g. Include more code examples, simplify the explanation, or add a quiz section."
                            value={regenerateFeedback}
                            onChange={(e) => setRegenerateFeedback(e.target.value)}
                            className="min-h-[100px]"
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setIsRegenerateFeedbackOpen(false)}>Cancel</Button>
                            <Button onClick={() => handleGenerateContent(regenerateFeedback)} disabled={generating}>
                                {generating ? "Generating..." : "Regenerate"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

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

        </div>
    )
}
