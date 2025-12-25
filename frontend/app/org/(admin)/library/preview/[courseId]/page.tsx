"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { getCourse, getContent } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, BookOpen, Layers, Star, Download, Loader2, Lock, Clock, ChevronRight, Eye, Tag, Check, AlertCircle } from "lucide-react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
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
                const modules = data.topics.filter((t: any) => !t.parent_topic_id).sort((a: any, b: any) => a.order - b.order)
                const subtopics = data.topics.filter((t: any) => t.parent_topic_id)
                const sorted: any[] = []
                modules.forEach((mod: any) => {
                    sorted.push(mod)
                    const children = subtopics.filter((t: any) => t.parent_topic_id === mod.id).sort((a: any, b: any) => a.order - b.order)
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
            router.push('/org/library')
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
            const { importLibraryCourse } = await import("@/lib/api")
            const result = await importLibraryCourse(course.id, user.organization_id)
            toast.success("Course imported successfully")
            setIsImportConfirmOpen(false)
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
                        <Button onClick={() => router.push(`/org/courses/${course.existing_clone_id}`)} className="bg-white text-indigo-700 hover:bg-slate-50 border border-indigo-200 shadow-sm">
                            <Layers className="h-4 w-4 mr-2" /> Manage Course
                        </Button>
                    ) : (
                        <Button onClick={handleImport} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200">
                            <Download className="h-4 w-4 mr-2" /> Import Course
                        </Button>
                    )}
                </div>
            </header>

            {/* Tabs - Full Width */}
            <Tabs defaultValue="content" className="flex-1 flex flex-col overflow-hidden">
                <div className="bg-white border-b border-slate-200">
                    <TabsList className="w-full grid grid-cols-4 rounded-none bg-transparent h-14">
                        <TabsTrigger value="content" className="data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none">Full Content</TabsTrigger>
                        <TabsTrigger value="overview" className="data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none">Overview</TabsTrigger>
                        <TabsTrigger value="syllabus" className="data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none">Syllabus</TabsTrigger>
                        <TabsTrigger value="exams" className="data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none">Exams</TabsTrigger>
                    </TabsList>
                </div>

                {/* Full Content Tab */}
                <TabsContent value="content" className="flex-1 flex overflow-hidden m-0">
                    <div className="flex-1 flex overflow-hidden">
                        {/* Sidebar */}
                        <div className="w-80 border-r border-slate-200 bg-slate-50 flex flex-col">
                            <div className="p-4 border-b bg-white/50 backdrop-blur-sm">
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
                                                const children = subtopics.filter((t: any) => t.parent_topic_id === mod.id).sort((a: any, b: any) => a.order - b.order)
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
                                                    <div key={topic.id} className="w-full text-left px-3 py-2 rounded-lg text-sm flex items-start gap-3 font-semibold text-slate-800 mt-4 first:mt-0 select-none">
                                                        <span className="mt-0.5 text-xs font-mono opacity-50 flex-shrink-0 w-6">{topic.order}</span>
                                                        <span className="line-clamp-2">{topic.title}</span>
                                                    </div>
                                                )
                                            }
                                            return (
                                                <button key={topic.id} onClick={() => handleSelectTopic(topic)} className={cn("w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-start gap-3 pl-8", isSelected ? "bg-indigo-100 text-indigo-900 font-medium" : "hover:bg-slate-100 text-slate-600")}>
                                                    <span className="mt-0.5 text-xs font-mono opacity-50 flex-shrink-0 w-6">{topic.order}</span>
                                                    <span className="line-clamp-2">{topic.title}</span>
                                                </button>
                                            )
                                        })
                                    })()}
                                </div>
                            </ScrollArea>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-8 lg:p-12 bg-white">
                            {contentLoading ? (
                                <div className="flex h-full items-center justify-center opacity-50">
                                    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                                </div>
                            ) : (
                                <div className="max-w-4xl mx-auto">
                                    <div className="mb-8 pb-4 border-b">
                                        <h2 className="text-3xl font-bold text-slate-900 mb-2">{selectedTopic?.title}</h2>
                                        <p className="text-slate-500">{selectedTopic?.description}</p>
                                    </div>
                                    <article className="prose prose-slate prose-lg max-w-none">
                                        <Markdown remarkPlugins={[remarkGfm, remarkBreaks]} components={{
                                            h1: ({ ...props }) => <h1 className="text-3xl font-bold text-slate-900 mt-0 mb-4 pb-2 border-b" {...props} />,
                                            h2: ({ ...props }) => <h2 className="text-2xl font-bold text-slate-800 mt-8 mb-4" {...props} />,
                                            ul: ({ ...props }) => <ul className="list-disc pl-5 space-y-2 mb-4 text-slate-700" {...props} />,
                                            ol: ({ ...props }) => <ol className="list-decimal pl-5 space-y-2 mb-4 text-slate-700" {...props} />,
                                            li: ({ ...props }) => <li className="pl-1" {...props} />,
                                            blockquote: ({ ...props }) => <blockquote className="border-l-4 border-indigo-500 bg-indigo-50 pl-4 py-3 my-4 italic text-slate-700 rounded-r" {...props} />,
                                            table: ({ ...props }) => (<div className="my-6 overflow-x-auto rounded-xl border border-slate-200 shadow-sm"><table className="min-w-full divide-y divide-slate-200 border-collapse" {...props} /></div>),
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
                                                        <SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div" customStyle={{ margin: 0, borderRadius: 0 }}>
                                                            {String(children).replace(/\n$/, '')}
                                                        </SyntaxHighlighter>
                                                    </div>
                                                ) : (
                                                    <code className="bg-slate-100 text-indigo-600 px-1.5 py-0.5 rounded font-mono text-sm font-semibold" {...props}>{children}</code>
                                                )
                                            }
                                        }}>
                                            {content.replace(/\n{3,}/g, (match) => '\n\n' + '&nbsp;\n'.repeat(match.length - 2))}
                                        </Markdown>
                                    </article>
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>

                {/* Overview Tab */}
                <TabsContent value="overview" className="flex-1 overflow-y-auto p-8 m-0 bg-slate-50">
                    <div className="max-w-5xl mx-auto space-y-6">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
                                <Layers className="h-6 w-6 text-indigo-500" />
                                <div className="text-center">
                                    <span className="font-bold block text-2xl text-slate-900">{course?.topics?.length || 0}</span>
                                    <span className="text-xs text-slate-500">Modules</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
                                <Star className="h-6 w-6 text-orange-500" />
                                <div className="text-center">
                                    <span className="font-bold block text-2xl text-slate-900">{course?.difficulty || 'N/A'}</span>
                                    <span className="text-xs text-slate-500">Level</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
                                <Clock className="h-6 w-6 text-emerald-500" />
                                <div className="text-center">
                                    <span className="font-bold block text-2xl text-slate-900">~{Math.ceil((course?.topics?.length || 0) * 2)}h</span>
                                    <span className="text-xs text-slate-500">Duration</span>
                                </div>
                            </div>
                        </div>
                        {course?.outcomes?.length > 0 && (
                            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
                                <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                    <Tag className="h-4 w-4 text-emerald-600" /> What Students Will Learn
                                </h4>
                                <ul className="space-y-2">
                                    {course.outcomes.map((outcome: string, idx: number) => (
                                        <li key={idx} className="flex gap-2 text-sm text-slate-600">
                                            <Check className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                            <span>{outcome}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* Syllabus Tab */}
                <TabsContent value="syllabus" className="flex-1 overflow-y-auto p-8 m-0 bg-slate-50">
                    <div className="max-w-5xl mx-auto space-y-2">
                        <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-indigo-600" /> Full Course Syllabus
                        </h4>
                        {(() => {
                            const getSortedTopics = (topics: any[]) => {
                                if (!topics) return []
                                const modules = topics.filter((t: any) => !t.parent_topic_id).sort((a: any, b: any) => a.order - b.order)
                                const subtopics = topics.filter((t: any) => t.parent_topic_id)
                                const sorted: any[] = []
                                modules.forEach((mod: any) => {
                                    sorted.push({ ...mod, children: subtopics.filter((t: any) => t.parent_topic_id === mod.id).sort((a: any, b: any) => a.order - b.order) })
                                })
                                return sorted
                            }
                            const sortedModules = getSortedTopics(course?.topics)
                            return sortedModules.map((module: any, idx: number) => (
                                <Collapsible key={module.id}>
                                    <CollapsibleTrigger className="w-full">
                                        <div className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg border border-slate-100 transition-colors bg-white">
                                            <ChevronRight className="h-4 w-4 text-slate-400" />
                                            <div className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 flex-shrink-0">{idx + 1}</div>
                                            <div className="flex-1 text-left">
                                                <h5 className="font-medium text-slate-900">{module.title}</h5>
                                                <p className="text-xs text-slate-500 line-clamp-1">{module.description}</p>
                                            </div>
                                            {module.children?.length > 0 && (<Badge variant="outline" className="text-xs">{module.children.length} topics</Badge>)}
                                        </div>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <div className="pl-12 pr-3 py-2 space-y-1">
                                            {module.children?.map((topic: any, tIdx: number) => (
                                                <div key={topic.id} className="p-2 text-sm text-slate-600 hover:bg-slate-50 rounded">{idx + 1}.{tIdx + 1} {topic.title}</div>
                                            ))}
                                        </div>
                                    </CollapsibleContent>
                                </Collapsible>
                            ))
                        })()}
                        {(!course?.topics || course.topics.length === 0) && (<div className="text-center py-12 text-slate-400">No syllabus available</div>)}
                    </div>
                </TabsContent>

                {/* Exams Tab */}
                <TabsContent value="exams" className="flex-1 overflow-y-auto p-8 m-0 bg-slate-50">
                    <div className="max-w-5xl mx-auto space-y-4">
                        {course?.exams?.length > 0 ? (
                            course.exams.map((exam: any) => (
                                <div key={exam.id} className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Badge className="bg-indigo-100 text-indigo-700">{exam.type || 'Exam'}</Badge>
                                        <h5 className="font-semibold text-slate-900">{exam.title}</h5>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                                        <div className="flex items-center gap-2"><span className="text-slate-500">Questions:</span><span className="font-medium">{exam.questions?.length || 0}</span></div>
                                        <div className="flex items-center gap-2"><span className="text-slate-500">Duration:</span><span className="font-medium">{exam.duration_minutes || 'N/A'}min</span></div>
                                        <div className="flex items-center gap-2"><span className="text-slate-500">Difficulty:</span><span className="font-medium">{exam.difficulty || 'N/A'}</span></div>
                                        <div className="flex items-center gap-2"><span className="text-slate-500">Passing Score:</span><span className="font-medium">{exam.passing_score || 'N/A'}%</span></div>
                                    </div>
                                    {exam.questions?.[0] && (
                                        <div className="mt-4 p-3 bg-slate-50 rounded border border-slate-100">
                                            <p className="text-xs font-semibold text-slate-500 mb-2">SAMPLE QUESTION:</p>
                                            <p className="text-sm text-slate-700">{exam.questions[0].question}</p>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-20 text-slate-400">
                                <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                <p>No exams included in this course</p>
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>

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
                        <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={confirmImport} disabled={importLoading}>
                            {importLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                            {importLoading ? "Cloning..." : "Confirm & Import"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
