"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { getCourse, getContent, generateContent, updateTopicContent, approveTopic } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save, Loader2, Sparkles, CheckCircle, Clock, Eye, EyeOff, LayoutTemplate } from "lucide-react"
import { cn } from "@/lib/utils"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkBreaks from "remark-breaks"
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

export default function TopicEditorPage() {
    const params = useParams()
    const router = useRouter()
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
    const [isPreviewMode, setIsPreviewMode] = useState(false)

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

                    // Smart View Logic:
                    // If content exists -> Default to Full Preview
                    // If empty -> Default to Split View (Edit Mode)
                    if (contentData.content && contentData.content.trim().length > 0) {
                        setIsPreviewMode(true)
                    } else {
                        setIsPreviewMode(false)
                    }

                } catch (e) {
                    // Content might not exist yet
                    console.log("No content found")
                    setIsPreviewMode(false) // Default to edit mode if no content
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
            setIsPreviewMode(true) // meaningful: Auto-switch to preview on save
        } catch (e) {
            toast.error("Failed to save")
        } finally {
            setGenerating(false)
        }
    }

    const handleApprove = async () => {
        try {
            await approveTopic(topicId)
            setTopic({ ...topic, status: 'APPROVED' })
            toast.success("Topic Approved!")
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
            } else {
                // Fallback if API hasn't updated yet (though it has)
                const contentData = await getContent(topicId)
                setContent(contentData.content)
                setOriginalContent(contentData.content)
            }

            toast.success("Content generated!")
            setIsPreviewMode(true) // Auto-switch to preview
        } catch (e: any) {
            // Handle 429 specifically if needed
            toast.error(e.response?.data?.detail?.message || "Generation failed")
        } finally {
            setGenerating(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-4" />
                <p className="text-slate-500">Loading Editor...</p>
            </div>
        )
    }

    const hasUnsavedChanges = content !== originalContent

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
                            ) : (
                                <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-0">Draft</Badge>
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

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsPreviewMode(!isPreviewMode)}
                        className="mr-2"
                        title={isPreviewMode ? "Switch to Split View" : "Switch to Full Preview"}
                    >
                        {isPreviewMode ? <LayoutTemplate className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                        {isPreviewMode ? "Split View" : "Full Preview"}
                    </Button>

                    <Button variant="outline" onClick={handleGenerate} disabled={generating}>
                        <Sparkles className="h-4 w-4 mr-2" />
                        AI Assistance
                    </Button>

                    <Button onClick={handleSave} disabled={generating || !hasUnsavedChanges} className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[100px]">
                        {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                            <>
                                <Save className="h-4 w-4 mr-2" /> Save
                            </>
                        )}
                    </Button>

                    {topic?.status !== 'APPROVED' && (
                        <Button
                            variant="outline"
                            className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                            onClick={handleApprove}
                        >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                        </Button>
                    )}
                </div>
            </header>

            {/* Main Editor Area - Split View */}
            <div className="flex-1 flex overflow-hidden">
                {/* Editor Pane (Left) */}
                <div className={cn("flex-1 border-r border-slate-200 flex flex-col bg-slate-50 transition-all duration-300", isPreviewMode && "hidden")}>
                    <div className="px-4 py-2 border-b bg-white text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Editor (Markdown)
                    </div>
                    <Textarea
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
                        <article className="prose prose-slate prose-lg max-w-none">
                            <Markdown
                                remarkPlugins={[remarkGfm, remarkBreaks]}
                                components={{
                                    h1: ({ ...props }) => <h1 className="text-3xl font-bold text-slate-900 mt-0 mb-4 border-b-2 border-indigo-100 pb-2" {...props} />,
                                    h2: ({ ...props }) => <h2 className="text-2xl font-bold text-slate-800 mt-8 mb-4" {...props} />,
                                    // Lists - Using list-outside with padding for proper nesting and alignment
                                    ul: ({ ...props }) => <ul className="list-disc pl-5 space-y-2 mb-4 text-slate-700" {...props} />,
                                    ol: ({ ...props }) => <ol className="list-decimal pl-5 space-y-2 mb-4 text-slate-700" {...props} />,
                                    li: ({ ...props }) => <li className="pl-1" {...props} />,

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
                                {content.replace(/\n{3,}/g, (match) => {
                                    // Preserve multiple empty lines by injecting non-breaking spaces
                                    // 3 newlines = 1 visual empty line in editor (besides standard break)
                                    // We replace n > 2 newlines with n-2 lines of &nbsp;
                                    return '\n\n' + '&nbsp;\n'.repeat(match.length - 2)
                                }) || "*Preview will appear here...*"}
                            </Markdown>
                        </article>
                    </div>
                </div>
            </div>
        </div>
    )
}
