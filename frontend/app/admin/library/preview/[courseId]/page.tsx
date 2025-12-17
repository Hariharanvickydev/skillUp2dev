"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { getCourse, getContent } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowLeft, BookOpen, Layers, Star, Loader2, Lock, Pencil } from "lucide-react"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkBreaks from "remark-breaks"
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function AdminLibraryPreviewPage() {
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

            if (data.topics && data.topics.length > 0) {
                const modules = data.topics.filter((t: any) => !t.parent_topic_id).sort((a: any, b: any) => a.order - b.order)
                const subtopics = data.topics.filter((t: any) => t.parent_topic_id)

                const sorted: any[] = []
                modules.forEach((mod: any) => {
                    sorted.push(mod)
                    const children = subtopics
                        .filter((t: any) => t.parent_topic_id === mod.id)
                        .sort((a: any, b: any) => a.order - b.order)
                    sorted.push(...children)
                })

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
            router.push('/admin/library')
        } finally {
            setLoading(false)
        }
    }

    const handleSelectTopic = async (topic: any) => {
        setSelectedTopic(topic)
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
                    <Button variant="ghost" size="icon" onClick={() => router.push('/admin/library')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-bold text-slate-900 line-clamp-1">{course?.title}</h1>
                            <Badge variant="secondary" className="bg-amber-50 text-amber-700 hover:bg-amber-50 border-0">
                                Super Admin Preview
                            </Badge>
                        </div>
                        <p className="text-xs text-slate-500">
                            Central Library • {course?.topics?.length} Modules
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => router.push(`/admin/library/${course.id}`)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
                    >
                        <Pencil className="h-4 w-4 mr-2" /> Edit Source Course
                    </Button>
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
                                const getSortedTopics = (topics: any[]) => {
                                    if (!topics) return []
                                    const modules = topics.filter((t: any) => !t.parent_topic_id).sort((a: any, b: any) => a.order - b.order)
                                    const subtopics = topics.filter((t: any) => t.parent_topic_id)
                                    const sorted: any[] = []
                                    modules.forEach((mod: any) => {
                                        sorted.push(mod)
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
                                                <span className="mt-0.5 text-xs font-mono opacity-50 flex-shrink-0 w-6">{topic.order}</span>
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
                                            <span className="mt-0.5 text-xs font-mono opacity-50 flex-shrink-0 w-6">{topic.order}</span>
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
                                            ul: ({ ...props }) => <ul className="list-disc pl-5 space-y-2 mb-4 text-slate-700" {...props} />,
                                            ol: ({ ...props }) => <ol className="list-decimal pl-5 space-y-2 mb-4 text-slate-700" {...props} />,
                                            li: ({ ...props }) => <li className="pl-1" {...props} />,
                                            blockquote: ({ ...props }) => <blockquote className="border-l-4 border-indigo-500 bg-indigo-50 pl-4 py-3 my-4 italic text-slate-700 rounded-r" {...props} />,
                                            code({ inline, className, children, ...props }: any) {
                                                const match = /language-(\w+)/.exec(className || '')
                                                return !inline && match ? (
                                                    <div className="rounded-lg overflow-hidden my-6 border border-slate-200 shadow-sm">
                                                        <div className="bg-slate-800 text-slate-300 px-4 py-2 text-xs font-mono uppercase tracking-wider border-b border-slate-700 flex justify-between">
                                                            <span>{match[1]}</span>
                                                            <Lock className="h-3 w-3 opacity-50" />
                                                        </div>
                                                        <SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div" customStyle={{ margin: 0, borderRadius: 0 }}>
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
                                        {content.replace(/\n{3,}/g, (match) => '\n\n' + '&nbsp;\n'.repeat(match.length - 2))}
                                    </Markdown>
                                </article>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
