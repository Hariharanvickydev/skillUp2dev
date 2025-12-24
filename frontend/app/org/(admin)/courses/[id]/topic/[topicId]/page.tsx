"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { getCourse, getContent, generateContent, updateTopicContent, approveTopic, requestTopicApproval } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save, Loader2, Sparkles, CheckCircle, Clock, Eye, EyeOff, LayoutTemplate, GitCompare, GitPullRequest } from "lucide-react"
import { cn } from "@/lib/utils"
import { MarkdownPreview } from "@/components/ui/markdown-preview"
import { FormattingToolbar } from "@/components/ui/formatting-toolbar"
import { DiffViewer } from "@/components/ui/diff-viewer"
import { handleFormattingLogic, calculateNewSelection } from "@/lib/editor-utils"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/AuthContext"

export default function TopicEditorPage() {
    const params = useParams()
    const router = useRouter()
    const { user } = useAuth()
    // params.id corresponds to [id] (courseId)
    // params.topicId corresponds to [topicId]
    const { id: courseId, topicId } = params as { id: string, topicId: string }

    const [course, setCourse] = useState<any>(null)
    const [topic, setTopic] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [contentLoading, setContentLoading] = useState(false)
    const [generating, setGenerating] = useState(false)
    const [content, setContent] = useState("")
    const [originalContent, setOriginalContent] = useState("")
    const [approvedContent, setApprovedContent] = useState<string | null>(null)
    const [isPreviewMode, setIsPreviewMode] = useState(false)
    const [isDiffMode, setIsDiffMode] = useState(false)

    // Load Data
    useEffect(() => {
        const loadData = async () => {
            try {
                // 1. Fetch Course to get Topic Details (Title, Status)
                const courseData = await getCourse(courseId)
                setCourse(courseData)
                const foundTopic = courseData.topics.find((t: any) => t.id === topicId)
                if (foundTopic) {
                    setTopic(foundTopic)
                } else {
                    toast.error("Topic not found")
                    router.push(`/org/courses/${courseId}`)
                    return
                }

                // 2. Fetch Content
                setContentLoading(true)
                try {
                    const contentData = await getContent(topicId)
                    setContent(contentData.content || "")
                    setOriginalContent(contentData.content || "")
                    setApprovedContent(contentData.approved_content || null)

                    // Smart View Logic:
                    if (contentData.content && contentData.content.trim().length > 0) {
                        setIsPreviewMode(true)
                    } else {
                        setIsPreviewMode(false)
                    }

                } catch (e) {
                    // Content might not exist yet
                    console.log("No content found")
                    setIsPreviewMode(false)
                } finally {
                    setContentLoading(false)
                }
            } catch (e) {
                console.error(e)
                toast.error("Failed to load editor")
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [courseId, topicId])

    const handleSave = async () => {
        setGenerating(true)
        try {
            await updateTopicContent(topicId, content)
            setOriginalContent(content)
            toast.success("Changes saved")
            // Optionally update topic status to DRAFT locally if implemented in backend
            if (topic.status === 'APPROVED' || topic.status === 'REJECTED') {
                setTopic({ ...topic, status: 'DRAFT' }) // Assuming backend resets to DRAFT on edit
                toast.info("Status changed to Draft")
            }
            setIsPreviewMode(true)
        } catch (e) {
            toast.error("Failed to save")
        } finally {
            setGenerating(false)
        }
    }

    const handleRequestApproval = async () => {
        setGenerating(true)
        try {
            await requestTopicApproval(topicId)
            setTopic({ ...topic, status: 'PENDING_APPROVAL' })
            toast.success("Approval Request Sent!")
        } catch (e: any) {
            toast.error(e.response?.data?.detail || "Failed to request approval")
        } finally {
            setGenerating(false)
        }
    }

    const handleApprove = async () => {
        try {
            await approveTopic(topicId)
            setTopic({ ...topic, status: 'APPROVED' })
            setApprovedContent(content) // Update local approved content
            toast.success("Topic Approved!")
            setIsDiffMode(false) // Exit diff mode
        } catch (e: any) {
            toast.error("Failed to approve")
        }
    }

    const handleGenerate = async () => {
        setGenerating(true)
        try {
            // 2. Fetch Content
            // Updated: API now returns content directly
            const response = await generateContent(topicId)
            if (response.content) {
                setContent(response.content)
                setOriginalContent(response.content)
                pushToHistory(response.content)
            } else {
                // Fallback 
                const contentData = await getContent(topicId)
                setContent(contentData.content)
                setOriginalContent(contentData.content)
            }

            toast.success("Content generated!")
            setIsPreviewMode(true)
        } catch (e: any) {
            toast.error(e.response?.data?.detail?.message || "Generation failed")
        } finally {
            setGenerating(false)
        }
    }

    // History State
    const [history, setHistory] = useState<string[]>([])
    const [historyStep, setHistoryStep] = useState(0)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // History Helpers
    const pushToHistory = (newContent: string) => {
        const newHistory = history.slice(0, historyStep + 1)
        newHistory.push(newContent)
        setHistory(newHistory)
        setHistoryStep(newHistory.length - 1)

        if (newHistory.length > 50) {
            newHistory.shift()
            setHistoryStep(newHistory.length - 1)
        }
    }

    const handleUndo = () => {
        if (historyStep > 0) {
            const prevStep = historyStep - 1
            setHistoryStep(prevStep)
            setContent(history[prevStep])
            toast.success("Undo successful")
        }
    }

    const handleRedo = () => {
        if (historyStep < history.length - 1) {
            const nextStep = historyStep + 1
            setHistoryStep(nextStep)
            setContent(history[nextStep])
            toast.success("Redo successful")
        }
    }

    const applyFormatting = (type: string) => {
        const textarea = textareaRef.current
        if (!textarea) return

        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const selectedText = content.substring(start, end)
        const beforeText = content.substring(0, start)
        const afterText = content.substring(end)

        const newContent = handleFormattingLogic(type, beforeText, selectedText, afterText)

        setContent(newContent)
        pushToHistory(newContent)

        const newSelection = calculateNewSelection(type, start, end, newContent.length, content.length, !!selectedText)

        setTimeout(() => {
            textarea.focus()
            textarea.setSelectionRange(newSelection.start, newSelection.end)
        }, 0)
    }

    // Initialize history on load
    useEffect(() => {
        if (content && history.length === 0) {
            setHistory([content])
        }
    }, [content])

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-4" />
                <p className="text-slate-500">Loading Editor...</p>
            </div>
        )
    }

    const hasUnsavedChanges = content !== originalContent
    const isTeacher = user?.role === 'TEACHER'
    const canApprove = user?.role !== 'TEACHER' // HOD or ADMIN
    const isLive = topic?.status === 'APPROVED'

    return (
        <div className="flex flex-col h-screen bg-white">
            {/* Header */}
            <header className="h-16 border-b flex items-center justify-between px-6 bg-white shrink-0 z-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push(`/org/courses/${courseId}`)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-bold text-slate-900">{topic?.title}</h1>
                            {topic?.status === 'APPROVED' ? (
                                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-0">Live & Approved</Badge>
                            ) : topic?.status === 'PENDING_APPROVAL' ? (
                                <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-0">Pending Approval</Badge>
                            ) : (
                                <Badge variant="secondary" className="bg-slate-100 text-slate-800 hover:bg-slate-100 border-0">Draft</Badge>
                            )}
                        </div>
                        <p className="text-xs text-slate-500">
                            {course?.title} • {content.length} characters
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {hasUnsavedChanges && (
                        <span className="text-xs text-amber-600 font-medium mr-2">Unsaved Changes</span>
                    )}

                    {/* Diff View Toggle (Only for approvers if there's approved content to compare against) */}
                    {canApprove && approvedContent && (
                        <Button
                            variant={isDiffMode ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setIsDiffMode(!isDiffMode)}
                            className={cn("mr-2", isDiffMode && "bg-slate-100")}
                            title="Compare with Approved Version"
                        >
                            <GitCompare className="h-4 w-4 mr-2" />
                            {isDiffMode ? "Exit Diff" : "Review Changes"}
                        </Button>
                    )}

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsPreviewMode(!isPreviewMode)}
                        className="mr-2"
                        title={isPreviewMode ? "Switch to Split View" : "Switch to Full Preview"}
                        disabled={isDiffMode}
                    >
                        {isPreviewMode ? <LayoutTemplate className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                        {isPreviewMode ? "Split View" : "Full Preview"}
                    </Button>

                    <Button variant="outline" onClick={handleGenerate} disabled={generating || isDiffMode}>
                        <Sparkles className="h-4 w-4 mr-2" />
                        AI Assistance
                    </Button>

                    <Button onClick={handleSave} disabled={generating || !hasUnsavedChanges || isDiffMode} className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[100px]">
                        {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                            <>
                                <Save className="h-4 w-4 mr-2" /> Save
                            </>
                        )}
                    </Button>

                    {/* Teacher: Request Approval */}
                    {isTeacher && topic?.status === 'DRAFT' && !hasUnsavedChanges && (
                        <Button
                            onClick={handleRequestApproval}
                            disabled={generating}
                            className="bg-blue-600 hover:bg-blue-700 text-white ml-2"
                        >
                            <GitPullRequest className="h-4 w-4 mr-2" />
                            Request Approval
                        </Button>
                    )}

                    {/* Approver: Approve Button */}
                    {canApprove && topic?.status !== 'APPROVED' && (
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-700 text-white ml-2"
                            onClick={handleApprove}
                        >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                        </Button>
                    )}
                </div>
            </header>

            {/* Main Editor Area */}
            <div className="flex-1 flex overflow-hidden">
                {isDiffMode && approvedContent ? (
                    <div className="w-full flex-1 p-6 bg-slate-50">
                        <DiffViewer
                            oldText={approvedContent}
                            newText={content}
                            oldTitle="Live Version"
                            newTitle="Proposed Changes"
                        />
                    </div>
                ) : (
                    <>
                        {/* Editor Pane (Left) */}
                        <div className={cn("flex-1 border-r border-slate-200 flex flex-col bg-slate-50 transition-all duration-300", isPreviewMode && "hidden")}>

                            <FormattingToolbar
                                onAction={applyFormatting}
                                onUndo={handleUndo}
                                onRedo={handleRedo}
                                canUndo={historyStep > 0}
                                canRedo={historyStep < history.length - 1}
                            />

                            <div className="px-4 py-2 border-b bg-slate-50 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                Editor (Markdown)
                            </div>
                            <Textarea
                                ref={textareaRef}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="flex-1 resize-none border-0 p-6 focus-visible:ring-0 font-mono text-sm leading-relaxed bg-slate-50"
                                placeholder="# Start writing..."
                            />
                        </div>

                        {/* Preview Pane (Right) */}
                        <div className={cn("flex flex-col bg-white overflow-hidden transition-all duration-300", isPreviewMode ? "w-full" : "flex-1")}>
                            <div className="px-4 py-2 border-b bg-white text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Live Preview
                            </div>
                            <div className="flex-1 overflow-y-auto p-8 lg:p-12">
                                <MarkdownPreview content={content} />
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
