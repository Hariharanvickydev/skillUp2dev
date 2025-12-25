"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { getCourse, addTopic, updateTopic, deleteTopic, generateTopics, approveTopic, requestTopicApproval, rejectTopic, republishModule, getSyncStatus, syncCourse, submitCourse, approveCourseReq, rejectCourse, createImportantQuestion, getImportantQuestions, deleteImportantQuestion, updateImportantQuestion, bulkImportImportantQuestions, publishImportantQuestion, requestImportantQuestionApproval, approveImportantQuestion, rejectImportantQuestion } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, RefreshCw, Pencil, Trash2, CheckCircle, Loader2, FileText, Sparkles, Layers, Wand2, Clock, GitCompare, ExternalLink, Copy, Save, Eye, Edit3, ChevronDown, ListCheck, HelpCircle, Edit, BookOpen, Upload, Download, Share2, XCircle, Send, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"

export default function OrgCourseEditorPage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string
    const { user } = useAuth()

    const [course, setCourse] = useState<any>(null)
    const [topics, setTopics] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)
    const [isPublishing, setIsPublishing] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)

    // Approval Workflow Handlers
    const handleSubmit = async () => {
        setActionLoading(true)
        try {
            await submitCourse(id)
            toast.success("Course submitted for approval!")
            fetchCourse()
        } catch (e) {
            toast.error("Failed to submit course")
        } finally {
            setActionLoading(false)
        }
    }

    const handleApproveCourse = async () => {
        setActionLoading(true)
        try {
            await approveCourseReq(id)
            toast.success("Course approved and published!")
            fetchCourse()
        } catch (e) {
            toast.error("Failed to approve course")
        } finally {
            setActionLoading(false)
        }
    }

    const handleRejectCourse = async () => {
        // ideally open a dialog for reason, for now just simple reject
        const reason = prompt("Enter reason for rejection:")
        if (!reason) return

        setActionLoading(true)
        try {
            await rejectCourse(id, reason)
            toast.success("Changes requested")
            fetchCourse()
        } catch (e) {
            toast.error("Failed to reject course")
        } finally {
            setActionLoading(false)
        }
    }

    const handleRequestTopicApproval = async (topicId: string, topicTitle: string) => {
        setActionLoading(true)
        try {
            await requestTopicApproval(topicId)
            toast.success(`"${topicTitle}" sent for HOD review`)
            fetchCourse() // Refresh to update status
        } catch (e: any) {
            toast.error(e.response?.data?.detail || "Failed to request approval")
        } finally {
            setActionLoading(false)
        }
    }

    // Topic Management State
    const [editingTopic, setEditingTopic] = useState<any>(null)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isRegenerateDialogOpen, setIsRegenerateDialogOpen] = useState(false)
    const [topicToDelete, setTopicToDelete] = useState<any>(null)
    const [newTopicData, setNewTopicData] = useState({ title: "", description: "", order: topics.length + 1 })
    const [parentTopicForSubtopic, setParentTopicForSubtopic] = useState<any>(null)

    // Sync State
    const [syncStatus, setSyncStatus] = useState<any>(null)
    const [isSyncDialogOpen, setIsSyncDialogOpen] = useState(false)
    const [syncLoading, setSyncLoading] = useState(false)
    const [selectedUpdate, setSelectedUpdate] = useState<any>(null)

    // Important Questions State
    const [importantQuestions, setImportantQuestions] = useState<any[]>([])
    const [qLoading, setQLoading] = useState(false)
    const [showPreviewAnswers, setShowPreviewAnswers] = useState(false)
    const [editingQuestion, setEditingQuestion] = useState<any>(null)
    const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false)
    const [isDeleteQuestionDialogOpen, setIsDeleteQuestionDialogOpen] = useState(false)
    const [questionToDelete, setQuestionToDelete] = useState<any>(null)
    const [newQuestionData, setNewQuestionData] = useState({
        title: "",
        content: {
            type: "MCQ",
            question: "",
            options: ["", "", "", ""],
            answer: "",
            explanation: "",
            marks: 2
        }
    })
    const [isBulkImportDialogOpen, setIsBulkImportDialogOpen] = useState(false)
    const [bulkImportFile, setBulkImportFile] = useState<File | null>(null)

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

    const fetchQuestions = async () => {
        setQLoading(true)
        try {
            const data = await getImportantQuestions(id)
            setImportantQuestions(data)
        } catch (e) {
            console.error(e)
            // toast.error("Failed to load questions") // Fail silently if not found or empty
        } finally {
            setQLoading(false)
        }
    }

    useEffect(() => {
        fetchCourse()
        fetchQuestions()
    }, [id])

    const handleViewContent = (topic: any) => {
        router.push(`/ org / courses / ${id} / topic / ${topic.id} `)
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

    const handleRepublishModule = async (moduleId: string, moduleTitle: string) => {
        setIsPublishing(true)
        try {
            await republishModule(moduleId)
            toast.success(`Module "${moduleTitle}" re-published successfully!`)
            fetchCourse() // Refresh to update status
        } catch (e: any) {
            toast.error(e.response?.data?.detail || 'Failed to re-publish module')
        } finally {
            setIsPublishing(false)
        }
    }

    const handleCheckSync = (type: 'TOPIC' | 'QUESTION' = 'TOPIC') => {
        router.push(`/org/courses/${id}/sync?type=${type}`)
    }

    const handleSyncItem = async (itemId: string, action: string, type: 'TOPIC' | 'QUESTION' = 'TOPIC') => {
        try {
            const payload = type === 'TOPIC'
                ? { library_topic_id: itemId, action }
                : { library_question_id: itemId, action, library_topic_id: undefined }

            // Note: helper might default to single item in array or spread?
            // Assuming syncCourse accepts Partial<SyncRequest['items'][0]>[]
            // But strict typing might need explicit structure. 
            // The backend defaults nicely.

            await syncCourse(id, [payload])
            toast.success(action === "OVERWRITE" ? `${type === 'TOPIC' ? 'Topic' : 'Question'} updated successfully` : `${type === 'TOPIC' ? 'Topic' : 'Question'} created successfully`)
            // Refresh status
            const status = await getSyncStatus(id)
            setSyncStatus(status)
            // Refresh course data
            fetchCourse()
            // Also refresh questions
            fetchQuestions()
        } catch (e) {
            console.error(e)
            toast.error("Failed to sync item")
        }
    }

    const handleRequestApproval = async (q: any) => {
        try {
            await requestImportantQuestionApproval(params.id as string, q.id)
            toast.success("Approval requested successfully")
            fetchQuestions()
        } catch (e) {
            toast.error("Failed to request approval")
        }
    }

    const handleApprove = async (q: any) => {
        try {
            await approveImportantQuestion(params.id as string, q.id)
            toast.success("Question approved and published")
            fetchQuestions()
        } catch (e) {
            toast.error("Failed to approve question")
        }
    }

    const handleReject = async (q: any) => {
        try {
            await rejectImportantQuestion(params.id as string, q.id)
            toast.success("Question returned for changes")
            fetchQuestions()
        } catch (e) {
            toast.error("Failed to reject question")
        }
    }

    const handlePublishToggle = async (q: any) => {
        // Legacy or direct publish for Super Admins
        try {
            await publishImportantQuestion(params.id as string, q.id, !q.is_public)
            toast.success(q.is_public ? "Question unpublished" : "Question published")
            fetchQuestions()
        } catch (e) {
            toast.error("Failed to update status")
        }
    }

    const handleCreateQuestion = async () => {
        if (!newQuestionData.title || !newQuestionData.content.question) {
            toast.error("Please fill in title and question")
            return
        }
        try {
            await createImportantQuestion(params.id as string, {
                title: newQuestionData.title,
                content: newQuestionData.content,
                is_public: false,
                module_id: null
            })
            toast.success("Question created successfully")
            setIsQuestionDialogOpen(false)
            setNewQuestionData({
                title: "",
                content: {
                    type: "MCQ",
                    question: "",
                    options: ["", "", "", ""],
                    answer: "",
                    explanation: "",
                    marks: 2
                }
            })
            fetchQuestions()
        } catch (e) {
            toast.error("Failed to create question")
        }
    }

    const handleEditQuestion = async () => {
        if (!editingQuestion) return
        try {
            await updateImportantQuestion(params.id as string, editingQuestion.id, {
                title: editingQuestion.title,
                content: editingQuestion.content,
                is_public: editingQuestion.is_public,
                module_id: editingQuestion.module_id
            })
            toast.success("Question updated successfully")
            setIsQuestionDialogOpen(false)
            setEditingQuestion(null)
            fetchQuestions()
        } catch (e) {
            toast.error("Failed to update question")
        }
    }

    const handleDeleteQuestion = async () => {
        if (!questionToDelete) return
        try {
            await deleteImportantQuestion(params.id as string, questionToDelete.id)
            toast.success("Question deleted successfully")
            setIsDeleteQuestionDialogOpen(false)
            setQuestionToDelete(null)
            fetchQuestions()
        } catch (e) {
            toast.error("Failed to delete question")
        }
    }

    const handleBulkImport = async () => {
        if (!bulkImportFile) {
            toast.error("Please select a file")
            return
        }

        try {
            const fileContent = await bulkImportFile.text()
            const questions = JSON.parse(fileContent)

            if (!Array.isArray(questions)) {
                toast.error("Invalid file format. Expected an array of questions.")
                return
            }

            await bulkImportImportantQuestions(params.id as string, questions)
            toast.success(`Successfully imported ${questions.length} questions`)
            setIsBulkImportDialogOpen(false)
            setBulkImportFile(null)
            fetchQuestions()
        } catch (e: any) {
            console.error(e)
            toast.error(e.message || "Failed to import questions")
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'DRAFT': return <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200">Draft</Badge>
            case 'PENDING_APPROVAL': return <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 animate-pulse">Pending Approval</Badge>
            case 'CHANGES_REQUESTED': return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">Changes Requested</Badge>
            case 'PUBLISHED': return <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">Published</Badge>
            default: return <Badge variant="outline" className="bg-slate-100 text-slate-600">Draft</Badge>
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
                        <Button
                            variant="ghost"
                            className="text-indigo-200 hover:text-white p-0 h-auto hover:bg-transparent"
                            onClick={() => {
                                // Navigate to role-specific courses page
                                const backUrl = user?.role === 'DEPT_HEAD' ? '/org/hod/courses'
                                    : user?.role === 'TEACHER' ? '/org/teacher/courses'
                                        : '/org/courses';
                                router.push(backUrl);
                            }}
                        >
                            <ArrowLeft className="h-4 w-4 mr-1" /> Back to My Courses
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
                                {course.status === 'PENDING_APPROVAL' && (
                                    <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/30 text-amber-200 text-xs font-semibold rounded-full flex items-center gap-1">
                                        <Clock className="h-3 w-3" /> Pending Review
                                    </span>
                                )}
                                {course.status === 'CHANGES_REQUESTED' && (
                                    <span className="px-2 py-0.5 bg-red-500/20 border border-red-500/30 text-red-200 text-xs font-semibold rounded-full flex items-center gap-1">
                                        <FileText className="h-3 w-3" /> Changes Requested
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
                            {/* Publishing/Approval Workflow Actions */}

                            {/* Teacher Submit Action */}
                            {course.assigned_teacher_id === user?.id && ['DRAFT', 'CHANGES_REQUESTED'].includes(course.status) && (
                                <Button
                                    onClick={handleSubmit}
                                    disabled={actionLoading}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-400/30 shadow-lg shadow-indigo-900/50"
                                >
                                    {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                                    Submit for Approval
                                </Button>
                            )}

                            {/* HOD/Admin Approve Action - Show if pending approval */}
                            {course.status === 'PENDING_APPROVAL' && ['ORG_ADMIN', 'DEPT_HEAD', 'SUPER_ADMIN'].includes(user?.role || '') && (
                                <>
                                    <Button
                                        onClick={handleRejectCourse}
                                        disabled={actionLoading}
                                        variant="destructive"
                                        className="bg-red-500/80 hover:bg-red-600"
                                    >
                                        Reject
                                    </Button>
                                    <Button
                                        onClick={handleApproveCourse}
                                        disabled={actionLoading}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
                                    >
                                        {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                                        Approve & Publish
                                    </Button>
                                </>
                            )}

                            {/* Also allow HOD/Admin to directly approve/publish even if not pending? Maybe just publish button for them?  
                                Existing code had module publishing. 
                                Let's keep the course-level approval distinct.
                            */}

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
                                    onClick={() => handleCheckSync('TOPIC')}
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

            <Tabs defaultValue="syllabus" className="w-full space-y-8">
                <TabsList className="flex w-full bg-slate-100 p-1 rounded-xl">
                    <TabsTrigger value="syllabus" className="flex-1 rounded-lg px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm">
                        <Layers className="h-4 w-4 mr-2" /> Syllabus & Content
                    </TabsTrigger>
                    <TabsTrigger value="questions" className="flex-1 rounded-lg px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm">
                        <ListCheck className="h-4 w-4 mr-2" /> Important Questions
                        <span className="ml-2 bg-indigo-100 text-indigo-700 py-0.5 px-2 rounded-full text-xs font-bold">
                            {importantQuestions.length}
                        </span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="syllabus" className="space-y-10">
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
                                                                    {/* Pending Updates Badge */}
                                                                    {!parentTopic.is_published && course?.has_pending_updates && (
                                                                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full flex items-center gap-1">
                                                                            <Clock className="h-3 w-3" /> Pending Updates
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
                                                            {/* Only HODs and Admins can publish modules */}
                                                            {!parentTopic.is_published && subTopics.length > 0 && subTopics.every((t: any) => t.status === 'APPROVED') && user?.role !== 'TEACHER' && (
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => course?.has_pending_updates
                                                                        ? handleRepublishModule(parentTopic.id, parentTopic.title)
                                                                        : handlePublishModule(parentTopic.id, parentTopic.title)
                                                                    }
                                                                    className={course?.has_pending_updates
                                                                        ? "bg-orange-600 hover:bg-orange-700 text-white h-9"
                                                                        : "bg-emerald-600 hover:bg-emerald-700 text-white h-9"
                                                                    }
                                                                    disabled={isPublishing}
                                                                >
                                                                    {isPublishing ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <CheckCircle className="h-3 w-3 mr-2" />}
                                                                    {course?.has_pending_updates ? "Review & Re-Publish" : "Publish Module"}
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
                                                                                {topic.status !== 'APPROVED' && <div className="h-2 w-2 rounded-full bg-amber-400"></div>}

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
                                                                            {topic.status === 'APPROVED' ? " Edit / Review" : "Manage Content"}
                                                                        </Button>

                                                                        {/* Request Approval Button for Teachers (when DRAFT and has content) */}
                                                                        {user?.role === 'TEACHER' && topic.status === 'DRAFT' && topic.has_content && (
                                                                            <Button
                                                                                size="sm"
                                                                                onClick={() => handleRequestTopicApproval(topic.id, topic.title)}
                                                                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                                                                disabled={actionLoading}
                                                                            >
                                                                                {actionLoading ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <CheckCircle className="h-3 w-3 mr-2" />}
                                                                                Request Approval
                                                                            </Button>
                                                                        )}
                                                                        {/* Topic status badges */}
                                                                        {topic.status === 'PENDING_APPROVAL' && (
                                                                            <span className="px-2 py-1 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-md">
                                                                                Pending Review
                                                                            </span>
                                                                        )}
                                                                        {topic.status === 'REJECTED' && (
                                                                            <span className="px-2 py-1 text-xs font-semibold bg-red-50 text-red-700 border border-red-200 rounded-md">
                                                                                Rejected
                                                                            </span>
                                                                        )}

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
                    <div className="space-y-6">
                        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                            <div>
                                <h1 className="text-xl font-bold text-slate-900">Important Questions</h1>
                                <p className="text-slate-500 text-sm">Key questions for students to focus on.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 mr-4">
                                    <span className="text-sm font-medium text-slate-600">Preview Answers</span>
                                    <Button
                                        variant={showPreviewAnswers ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setShowPreviewAnswers(!showPreviewAnswers)}
                                        className={showPreviewAnswers ? "bg-indigo-600 text-white" : ""}
                                    >
                                        {showPreviewAnswers ? <Eye className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2 text-slate-400" />}
                                        {showPreviewAnswers ? "Visible" : "Hidden"}
                                    </Button>
                                </div>
                                {(user?.role === 'TEACHER' || user?.role === 'ORG_ADMIN' || user?.role === 'SUPER_ADMIN') && (
                                    <Button
                                        onClick={() => {
                                            setEditingQuestion(null)
                                            setIsQuestionDialogOpen(true)
                                        }}
                                        size="sm"
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Question
                                    </Button>
                                )}
                                {(user?.role === 'TEACHER' || user?.role === 'ORG_ADMIN' || user?.role === 'SUPER_ADMIN') && (
                                    <Button
                                        onClick={() => setIsBulkImportDialogOpen(true)}
                                        variant="outline"
                                        size="sm"
                                        className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                                    >
                                        <Upload className="h-4 w-4 mr-2" />
                                        Bulk Import
                                    </Button>
                                )}
                                {course.parent_course_id && (
                                    <Button
                                        onClick={() => handleCheckSync('QUESTION')}
                                        variant="outline"
                                        size="sm"
                                        className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                                    >
                                        <GitCompare className="h-4 w-4 mr-2" />
                                        Sync Questions
                                    </Button>
                                )}
                            </div>
                        </div>

                        {qLoading ? (
                            <div className="text-center py-20 text-slate-500">Loading questions...</div>
                        ) : importantQuestions.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-200">
                                <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-slate-900">No Important Questions Yet</h3>
                                <p className="text-slate-500 max-w-sm mx-auto mt-2">
                                    Questions will appear here when synced from the Central Library or added.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {['MCQ', 'TRUE_FALSE', 'SHORT_ANSWER', 'LONG_ANSWER'].map((type) => {
                                    const typeQuestions = importantQuestions.filter((q: any) => q.content?.type === type);
                                    if (typeQuestions.length === 0) return null;

                                    return (
                                        <Collapsible key={type} defaultOpen className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                            <CollapsibleTrigger className="w-full flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                                        {type === 'MCQ' && <ListCheck className="h-4 w-4" />}
                                                        {type === 'TRUE_FALSE' && <CheckCircle className="h-4 w-4" />}
                                                        {type === 'SHORT_ANSWER' && <FileText className="h-4 w-4" />}
                                                        {type === 'LONG_ANSWER' && <FileText className="h-4 w-4" />}
                                                    </div>
                                                    <div className="text-left">
                                                        <h3 className="font-semibold text-slate-900">{type.replace('_', ' ')}</h3>
                                                        <p className="text-xs text-slate-500">{typeQuestions.length} Questions</p>
                                                    </div>
                                                </div>
                                                <ChevronDown className="h-4 w-4 text-slate-400 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                                            </CollapsibleTrigger>
                                            <CollapsibleContent>
                                                <div className="divide-y divide-slate-100">
                                                    {typeQuestions.map((q: any, i: number) => (
                                                        <div key={q.id} className="p-6 hover:bg-slate-50/50 transition-colors">
                                                            <div className="flex gap-4">
                                                                <span className="flex-none text-xs font-mono text-slate-400 pt-1">
                                                                    {(i + 1).toString().padStart(2, '0')}
                                                                </span>
                                                                <div className="flex-1 space-y-3">
                                                                    <div className="flex justify-between items-start">
                                                                        <div className="flex items-center gap-2">
                                                                            {getStatusBadge(q.status || 'DRAFT')}
                                                                            <h4 className="font-medium text-slate-900">{q.title}</h4>
                                                                        </div>
                                                                        <div className="flex gap-2 items-center">
                                                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 uppercase">
                                                                                {q.content?.marks} Marks
                                                                            </span>
                                                                            {q.source_question_id && (
                                                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 flex items-center gap-1">
                                                                                    <RefreshCw className="h-3 w-3" /> Synced
                                                                                </span>
                                                                            )}

                                                                            {/* Action Buttons */}
                                                                            <div className="flex items-center gap-1 ml-2">
                                                                                {/* Teacher Actions: Draft/ChangesRequested -> Request Approval */}
                                                                                {(user?.role === 'TEACHER' || user?.role === 'ORG_ADMIN' || user?.role === 'SUPER_ADMIN') &&
                                                                                    (q.status === 'DRAFT' || q.status === 'CHANGES_REQUESTED' || !q.status) && (
                                                                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-indigo-600" onClick={() => handleRequestApproval(q)} title="Request Approval">
                                                                                            <Send className="h-3.5 w-3.5" />
                                                                                        </Button>
                                                                                    )}

                                                                                {/* Admin Actions: Pending -> Approve/Reject */}
                                                                                {(user?.role === 'ORG_ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'DEPT_HEAD') &&
                                                                                    q.status === 'PENDING_APPROVAL' && (
                                                                                        <>
                                                                                            <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-600" onClick={() => handleApprove(q)} title="Approve">
                                                                                                <CheckCircle className="h-3.5 w-3.5" />
                                                                                            </Button>
                                                                                            <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600" onClick={() => handleReject(q)} title="Reject">
                                                                                                <XCircle className="h-3.5 w-3.5" />
                                                                                            </Button>
                                                                                        </>
                                                                                    )}

                                                                                {/* Publish Toggle (Legacy/Admin) */}
                                                                                {(user?.role === 'ORG_ADMIN' || user?.role === 'SUPER_ADMIN') && q.status === 'PUBLISHED' && (
                                                                                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handlePublishToggle(q)} title={q.is_public ? "Unpublish" : "Publish"}>
                                                                                        {q.is_public ? <EyeOff className="h-3.5 w-3.5 text-slate-400" /> : <Eye className="h-3.5 w-3.5 text-emerald-600" />}
                                                                                    </Button>
                                                                                )}

                                                                                {/* Edit Button */}
                                                                                {(user?.role === 'TEACHER' || user?.role === 'ORG_ADMIN' || user?.role === 'SUPER_ADMIN') && (
                                                                                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => {
                                                                                        setEditingQuestion(q)
                                                                                        setIsQuestionDialogOpen(true)
                                                                                    }} title="Edit Question">
                                                                                        <Edit className="h-3.5 w-3.5 text-slate-600" />
                                                                                    </Button>
                                                                                )}

                                                                                {/* Delete Button */}
                                                                                {(user?.role === 'TEACHER' || user?.role === 'ORG_ADMIN' || user?.role === 'SUPER_ADMIN') && (
                                                                                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => {
                                                                                        setQuestionToDelete(q)
                                                                                        setIsDeleteQuestionDialogOpen(true)
                                                                                    }} title="Delete Question">
                                                                                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                                                                    </Button>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                                        {q.content?.question}
                                                                    </p>

                                                                    {/* Options for MCQ */}
                                                                    {
                                                                        q.content?.type === 'MCQ' && q.content?.options && (
                                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                                                                                {q.content.options.map((opt: string, idx: number) => (
                                                                                    <div key={idx} className={`text-sm px-3 py-2 rounded border ${showPreviewAnswers && opt === q.content?.answer ? "bg-emerald-50 border-emerald-200 text-emerald-700 font-medium" : "bg-white border-slate-200 text-slate-600"}`}>
                                                                                        <span className="mr-2 text-slate-400">{String.fromCharCode(65 + idx)}.</span>
                                                                                        {opt}
                                                                                        {showPreviewAnswers && opt === q.content?.answer && <CheckCircle className="h-3 w-3 inline ml-2" />}
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        )
                                                                    }

                                                                    {/* Answer Section */}
                                                                    {showPreviewAnswers && (
                                                                        <div className="mt-4 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
                                                                            <div className="flex gap-4">
                                                                                <div className="flex-1">
                                                                                    <p className="text-xs font-bold text-emerald-600 uppercase mb-1">Correct Answer</p>
                                                                                    <p className="text-sm font-medium text-slate-800">{q.content?.answer || "True"}</p>
                                                                                </div>
                                                                                {q.content?.explanation && (
                                                                                    <div className="flex-[2] border-l border-slate-100 pl-4">
                                                                                        <p className="text-xs font-bold text-indigo-600 uppercase mb-1">Explanation</p>
                                                                                        <p className="text-sm text-slate-600 italic">"{q.content.explanation}"</p>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CollapsibleContent>
                                        </Collapsible>
                                    );
                                })}
                            </div>
                        )}
                    </div >
                </TabsContent >
            </Tabs >

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
                                {syncStatus?.updates.map((update: any, index: number) => {
                                    const isQuestion = !!update.library_question;
                                    const title = isQuestion ? update.library_question.title : update.library_topic?.title;
                                    const id = isQuestion ? update.library_question.id : update.library_topic?.id;
                                    const typeLabel = isQuestion ? 'QUESTION' : 'TOPIC';

                                    return (
                                        <div key={index} className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${update.type === 'NEW' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                                                            {update.type}
                                                        </span>
                                                        {isQuestion && <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">QUESTION</span>}
                                                        <h4 className="font-semibold text-slate-900">{title}</h4>
                                                    </div>
                                                    <p className="text-sm text-slate-500 mt-1">{update.message}</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    {update.type === 'NEW' ? (
                                                        <Button size="sm" onClick={() => handleSyncItem(id, 'CREATE', isQuestion ? 'QUESTION' : 'TOPIC')} disabled={syncLoading}>
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
                                                        <Button size="sm" onClick={() => handleSyncItem(id, 'OVERWRITE', isQuestion ? 'QUESTION' : 'TOPIC')} disabled={syncLoading}>
                                                            {syncLoading ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-2 h-3 w-3" />} Overwrite Mine
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>


            {/* Edit Topic Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Topic</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Input
                            placeholder="Topic Title"
                            value={editingTopic?.title || ""}
                            onChange={(e) => setEditingTopic({ ...editingTopic, title: e.target.value })}
                        />
                        <Textarea
                            placeholder="Description"
                            value={editingTopic?.description || ""}
                            onChange={(e) => setEditingTopic({ ...editingTopic, description: e.target.value })}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleEditTopic}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Topic Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{parentTopicForSubtopic ? `Add Topic to "${parentTopicForSubtopic.title}"` : "Add New Module"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Input
                            placeholder="Title"
                            value={newTopicData.title}
                            onChange={(e) => setNewTopicData({ ...newTopicData, title: e.target.value })}
                        />
                        <Textarea
                            placeholder="Description"
                            value={newTopicData.description}
                            onChange={(e) => setNewTopicData({ ...newTopicData, description: e.target.value })}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddTopic}>Create</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will delete "{topicToDelete?.title}" and all its content. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteTopic} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Regenerate Topics Confirmation */}
            <AlertDialog open={isRegenerateDialogOpen} onOpenChange={setIsRegenerateDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Regenerate Syllabus?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will <span className="font-bold text-red-600">DELETE ALL EXISTING TOPICS</span> and generate a new syllabus based on the course description.
                            <br /><br />
                            Are you sure you want to proceed?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRegenerateTopics} className="bg-red-600 hover:bg-red-700">Yes, Regenerate</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Question Create/Edit Dialog */}
            <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingQuestion ? "Edit Question" : "Create New Question"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Title</label>
                            <Input
                                value={editingQuestion ? editingQuestion.title : newQuestionData.title}
                                onChange={(e) => editingQuestion
                                    ? setEditingQuestion({ ...editingQuestion, title: e.target.value })
                                    : setNewQuestionData({ ...newQuestionData, title: e.target.value })
                                }
                                placeholder="Question title"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium">Question Type</label>
                            <select
                                className="w-full p-2 border rounded"
                                value={editingQuestion ? editingQuestion.content.type : newQuestionData.content.type}
                                onChange={(e) => editingQuestion
                                    ? setEditingQuestion({ ...editingQuestion, content: { ...editingQuestion.content, type: e.target.value } })
                                    : setNewQuestionData({ ...newQuestionData, content: { ...newQuestionData.content, type: e.target.value } })
                                }
                            >
                                <option value="MCQ">Multiple Choice</option>
                                <option value="TRUE_FALSE">True/False</option>
                                <option value="SHORT_ANSWER">Short Answer</option>
                                <option value="LONG_ANSWER">Long Answer</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Question</label>
                            <Textarea
                                value={editingQuestion ? editingQuestion.content.question : newQuestionData.content.question}
                                onChange={(e) => editingQuestion
                                    ? setEditingQuestion({ ...editingQuestion, content: { ...editingQuestion.content, question: e.target.value } })
                                    : setNewQuestionData({ ...newQuestionData, content: { ...newQuestionData.content, question: e.target.value } })
                                }
                                placeholder="Enter the question"
                                rows={3}
                            />
                        </div>

                        {((editingQuestion && editingQuestion.content.type === 'MCQ') || (!editingQuestion && newQuestionData.content.type === 'MCQ')) && (
                            <div>
                                <label className="text-sm font-medium">Options</label>
                                {[0, 1, 2, 3].map((idx) => (
                                    <Input
                                        key={idx}
                                        value={editingQuestion ? editingQuestion.content.options[idx] : newQuestionData.content.options[idx]}
                                        onChange={(e) => {
                                            const newOptions = editingQuestion ? [...editingQuestion.content.options] : [...newQuestionData.content.options]
                                            newOptions[idx] = e.target.value
                                            editingQuestion
                                                ? setEditingQuestion({ ...editingQuestion, content: { ...editingQuestion.content, options: newOptions } })
                                                : setNewQuestionData({ ...newQuestionData, content: { ...newQuestionData.content, options: newOptions } })
                                        }}
                                        placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                                        className="mt-2"
                                    />
                                ))}
                            </div>
                        )}

                        <div>
                            <label className="text-sm font-medium">Answer</label>
                            <Input
                                value={editingQuestion ? editingQuestion.content.answer : newQuestionData.content.answer}
                                onChange={(e) => editingQuestion
                                    ? setEditingQuestion({ ...editingQuestion, content: { ...editingQuestion.content, answer: e.target.value } })
                                    : setNewQuestionData({ ...newQuestionData, content: { ...newQuestionData.content, answer: e.target.value } })
                                }
                                placeholder="Correct answer"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium">Explanation (Optional)</label>
                            <Textarea
                                value={editingQuestion ? editingQuestion.content.explanation : newQuestionData.content.explanation}
                                onChange={(e) => editingQuestion
                                    ? setEditingQuestion({ ...editingQuestion, content: { ...editingQuestion.content, explanation: e.target.value } })
                                    : setNewQuestionData({ ...newQuestionData, content: { ...newQuestionData.content, explanation: e.target.value } })
                                }
                                placeholder="Explanation for the answer"
                                rows={2}
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium">Marks</label>
                            <Input
                                type="number"
                                value={editingQuestion ? editingQuestion.content.marks : newQuestionData.content.marks}
                                onChange={(e) => editingQuestion
                                    ? setEditingQuestion({ ...editingQuestion, content: { ...editingQuestion.content, marks: parseInt(e.target.value) } })
                                    : setNewQuestionData({ ...newQuestionData, content: { ...newQuestionData.content, marks: parseInt(e.target.value) } })
                                }
                                min={1}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setIsQuestionDialogOpen(false)
                            setEditingQuestion(null)
                        }}>Cancel</Button>
                        <Button onClick={editingQuestion ? handleEditQuestion : handleCreateQuestion}>
                            {editingQuestion ? "Update" : "Create"} Question
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bulk Import Dialog */}
            <Dialog open={isBulkImportDialogOpen} onOpenChange={setIsBulkImportDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Bulk Import Questions</DialogTitle>
                        <DialogDescription>
                            Upload a JSON file containing multiple questions. All imported questions will start as DRAFT.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Select JSON File</label>
                            <Input
                                type="file"
                                accept=".json"
                                onChange={(e) => setBulkImportFile(e.target.files?.[0] || null)}
                                className="mt-2"
                            />
                        </div>

                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <h4 className="font-medium text-sm mb-2">Expected JSON Format:</h4>
                            <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
                                {`[
  {
    "title": "Question Title",
    "content": {
      "type": "MCQ",
      "question": "What is...?",
      "options": ["A", "B", "C", "D"],
      "answer": "A",
      "explanation": "Because...",
      "marks": 2
    },
    "is_public": false,
    "module_id": null
  }
]`}
                            </pre>
                            <p className="text-xs text-slate-500 mt-2">
                                Types: MCQ, TRUE_FALSE, SHORT_ANSWER, LONG_ANSWER
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setIsBulkImportDialogOpen(false)
                            setBulkImportFile(null)
                        }}>Cancel</Button>
                        <Button onClick={handleBulkImport} disabled={!bulkImportFile}>
                            <Upload className="h-4 w-4 mr-2" />
                            Import Questions
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Question Confirmation */}
            <AlertDialog open={isDeleteQuestionDialogOpen} onOpenChange={setIsDeleteQuestionDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Question?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{questionToDelete?.title}"? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteQuestion} className="bg-red-600 hover:bg-red-700">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div >
    )
}
