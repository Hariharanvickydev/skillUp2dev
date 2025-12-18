"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { getCourse, getContent } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, BookOpen, Layers, Star, Download, Loader2, Lock } from "lucide-react"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkBreaks from "remark-breaks"
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export default function LibraryPreviewPage() {
    const params = useParams()
    const router = useRouter()
    const courseId = params.courseId as string

    const [course, setCourse] = useState<any>(null)
    const [selectedTopic, setSelectedTopic] = useState<any>(null)
    const [content, setContent] = useState("")
    const [loading, setLoading] = useState(true)
    const [contentLoading, setContentLoading] = useState(false)

    useEffect(() => {
        loadCourse()
    }, [courseId])

    const loadCourse = async () => {
        try {
            const data = await getCourse(courseId)
            setCourse(data)

            // Select first topic by default if available
            if (data.topics && data.topics.length > 0) {
                // Sort topics to find the true "first" topic
                const modules = data.topics.filter((t: any) => !t.parent_topic_id).sort((a: any, b: any) => a.order - b.order)
                const subtopics = data.topics.filter((t: any) => t.parent_topic_id)

                // Construct ordered list (Module 1, 1.1, 1.2... Module 2...)
                const sorted: any[] = []
                modules.forEach((mod: any) => {
                    sorted.push(mod)
                    const children = subtopics
                        .filter((t: any) => t.parent_topic_id === mod.id)
                        .sort((a: any, b: any) => a.order - b.order)
                    sorted.push(...children)
                })

                // Pick the first one. 
                // PREFERENCE: Select the first *Subtopic* (content) rather than the Module Header (container)
                // because Module Headers often have no content.
                if (sorted.length > 0) {
                    const firstModule = sorted[0];
                    const firstSubtopic = sorted.find((t: any) => t.parent_topic_id === firstModule.id);

                    if (firstSubtopic) {
                        handleSelectTopic(firstSubtopic);
                    } else {
                        handleSelectTopic(firstModule);
                    }
                }
            }
        } catch (e) {
            toast.error("Failed to load course preview")
            router.push('/org/library')
        } finally {
            setLoading(false)
        }
    }

    const handleSelectTopic = async (topic: any) => {
        setSelectedTopic(topic)
        // If it's a parent topic with no parent_id, it might be a module header.
        // We can still try to fetch content, but usually headers don't have content.

        setContentLoading(true)
        try {
            const data = await getContent(topic.id)
            setContent(data.content || "")
        } catch (e) {
            setContent("*No content available or this is a module header.*")
        } finally {
            setContentLoading(false)
        }
    }

    const { user } = useAuth()
    const [isImportConfirmOpen, setIsImportConfirmOpen] = useState(false)
    const [importLoading, setImportLoading] = useState(false)

    const handleImport = () => {
        setIsImportConfirmOpen(true)
    }

    const confirmImport = async () => {
        if (!user?.organization_id || !course) return

        setImportLoading(true)
        try {
            const { importLibraryCourse } = await import("@/lib/api") // Dynamic import to avoid circular dep if any, or just standard import
            const result = await importLibraryCourse(course.id, user.organization_id)
            toast.success("Course imported successfully")
            setIsImportConfirmOpen(false)

            // Redirect to the new course (Draft)
            if (result.new_course_id) {
                router.push(`/org/courses/${result.new_course_id}`)
            } else {
                router.push('/org/courses')
            }
        } catch (e: any) {
            console.error(e)
            toast.error(e.response?.data?.detail || "Failed to import course")
        } finally {
            setImportLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen bg-white">
            {/* Header */}
            <header className="h-16 border-b flex items-center justify-between px-6 bg-white shrink-0 z-10 sticky top-0">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/org/library')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-bold text-slate-900 line-clamp-1">{course?.title}</h1>
                            <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50 border-0">
                                Library Preview
                            </Badge>
                        </div>
                        <p className="text-xs text-slate-500">
                            Read-Only View • {course?.topics?.length} Modules
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {course?.existing_clone_id ? (
                        <Button
                            onClick={() => router.push(`/org/courses/${course.existing_clone_id}`)}
                            className="bg-white text-indigo-700 hover:bg-slate-50 border border-indigo-200 shadow-sm"
                        >
                            <Layers className="h-4 w-4 mr-2" /> Manage Course
                        </Button>
                    ) : (
                        <Button onClick={handleImport} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200">
                            <Download className="h-4 w-4 mr-2" /> Import Course
                        </Button>
                    )}
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar - Topic List */}
                <div className="w-80 border-r border-slate-200 bg-slate-50 flex flex-col">
                    <div className="p-4 border-b bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Course Modules</h2>
                    </div>
                    <ScrollArea className="flex-1">
                        <div className="p-4 space-y-1">
                            {(() => {
                                // Hierarchical Sorting Helper
                                const getSortedTopics = (topics: any[]) => {
                                    if (!topics) return []
                                    const modules = topics.filter((t: any) => !t.parent_topic_id).sort((a: any, b: any) => a.order - b.order)
                                    const subtopics = topics.filter((t: any) => t.parent_topic_id)

                                    const sorted: any[] = []
                                    modules.forEach((mod: any) => {
                                        sorted.push(mod)
                                        // Find children for this module
                                        const children = subtopics
                                            .filter((t: any) => t.parent_topic_id === mod.id)
                                            .sort((a: any, b: any) => a.order - b.order)
                                        sorted.push(...children)
                                    })
                                    return sorted
                                }

                                const sortedTopics = getSortedTopics(course?.topics)

                                return sortedTopics.map((topic: any) => {
                                    const isSelected = selectedTopic?.id === topic.id
                                    const isParent = !topic.parent_topic_id

                                    if (isParent) {
                                        return (
                                            <div
                                                key={topic.id}
                                                className="w-full text-left px-3 py-2 rounded-lg text-sm flex items-start gap-3 font-semibold text-slate-800 mt-4 first:mt-0 select-none"
                                            >
                                                <span className="mt-0.5 text-xs font-mono opacity-50 flex-shrink-0 w-6">
                                                    {topic.order}
                                                </span>
                                                <span className="line-clamp-2">{topic.title}</span>
                                            </div>
                                        )
                                    }

                                    return (
                                        <button
                                            key={topic.id}
                                            onClick={() => handleSelectTopic(topic)}
                                            className={cn(
                                                "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-start gap-3 pl-8",
                                                isSelected ? "bg-indigo-100 text-indigo-900 font-medium" : "hover:bg-slate-100 text-slate-600"
                                            )}
                                        >
                                            <span className="mt-0.5 text-xs font-mono opacity-50 flex-shrink-0 w-6">
                                                {topic.order}
                                            </span>
                                            <span className="line-clamp-2">{topic.title}</span>
                                        </button>
                                    )
                                })
                            })()}
                        </div>
                    </ScrollArea>
                </div>

                {/* Main Content - Preview */}
                <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
                    {/* Watermark/Banner */}
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 z-20" />

                    <div className="flex-1 overflow-y-auto p-8 lg:p-12">
                        {contentLoading ? (
                            <div className="flex h-full items-center justify-center opacity-50">
                                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                            </div>
                        ) : (
                            <div className="max-w-3xl mx-auto">
                                <div className="mb-8 pb-4 border-b">
                                    <h2 className="text-3xl font-bold text-slate-900 mb-2">{selectedTopic?.title}</h2>
                                    <p className="text-slate-500">{selectedTopic?.description}</p>
                                </div>
                                <article className="prose prose-slate prose-lg max-w-none">
                                    <Markdown
                                        remarkPlugins={[remarkGfm, remarkBreaks]}
                                        components={{
                                            h1: ({ ...props }) => <h1 className="text-3xl font-bold text-slate-900 mt-0 mb-4 pb-2 border-b" {...props} />,
                                            h2: ({ ...props }) => <h2 className="text-2xl font-bold text-slate-800 mt-8 mb-4" {...props} />,
                                            // Using same list styling as Editor for consistency
                                            ul: ({ ...props }) => <ul className="list-disc pl-5 space-y-2 mb-4 text-slate-700" {...props} />,
                                            ol: ({ ...props }) => <ol className="list-decimal pl-5 space-y-2 mb-4 text-slate-700" {...props} />,
                                            li: ({ ...props }) => <li className="pl-1" {...props} />,
                                            blockquote: ({ ...props }) => <blockquote className="border-l-4 border-indigo-500 bg-indigo-50 pl-4 py-3 my-4 italic text-slate-700 rounded-r" {...props} />,

                                            // Premium Tables (Synced with Editor)
                                            table: ({ ...props }) => (
                                                <div className="my-6 overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
                                                    <table className="min-w-full divide-y divide-slate-200 border-collapse" {...props} />
                                                </div>
                                            ),
                                            thead: ({ ...props }) => <thead className="bg-slate-50/80" {...props} />,
                                            th: ({ ...props }) => <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-widest border-b border-slate-200" {...props} />,
                                            td: ({ ...props }) => <td className="px-6 py-4 text-sm text-slate-600 border-b border-slate-100 last:border-b-0" {...props} />,
                                            tr: ({ ...props }) => <tr className="hover:bg-slate-50/50 transition-colors even:bg-slate-50/30" {...props} />,

                                            code({ inline, className, children, ...props }: any) {
                                                const match = /language-(\w+)/.exec(className || '')
                                                return !inline && match ? (
                                                    <div className="rounded-lg overflow-hidden my-6 border border-slate-200 shadow-sm">
                                                        <div className="bg-slate-800 text-slate-300 px-4 py-2 text-xs font-mono uppercase tracking-wider border-b border-slate-700 flex justify-between">
                                                            <span>{match[1]}</span>
                                                            <Lock className="h-3 w-3 opacity-50" />
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
                                            return '\n\n' + '&nbsp;\n'.repeat(match.length - 2)
                                        })}
                                    </Markdown>
                                </article>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* Confirmation Dialog */}
            <Dialog open={isImportConfirmOpen} onOpenChange={setIsImportConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Import Course?</DialogTitle>
                        <DialogDescription>
                            This will clone <strong>{course?.title}</strong> into your organization.
                            You will be able to edit the content independently.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3 items-start">
                        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-amber-800">
                            <strong>Note:</strong> Exams and Important Questions marked as "Draft" will also be copied. You can publish them later.
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsImportConfirmOpen(false)}>Cancel</Button>
                        <Button
                            className="bg-indigo-600 hover:bg-indigo-700"
                            onClick={confirmImport}
                            disabled={importLoading}
                        >
                            {importLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                            {importLoading ? "Cloning..." : "Confirm & Import"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
