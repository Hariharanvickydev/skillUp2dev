"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { getCourse, addTopic, updateTopic, deleteTopic, generateTopics, approveTopic, getContent, generateContent } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { ArrowLeft, Plus, RefreshCw, Pencil, Trash2, Play, CheckCircle, Loader2, FileText } from "lucide-react"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

export default function CourseDetailPage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string

    const [course, setCourse] = useState<any>(null)
    const [topics, setTopics] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)

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
    const [isDeleteCourseDialogOpen, setIsDeleteCourseDialogOpen] = useState(false)
    const [topicToDelete, setTopicToDelete] = useState<any>(null)
    const [newTopicData, setNewTopicData] = useState({ title: "", description: "", order: topics.length + 1 })
    const [parentTopicForSubtopic, setParentTopicForSubtopic] = useState<any>(null)
    const [isRegenerateFeedbackOpen, setIsRegenerateFeedbackOpen] = useState(false)
    const [regenerateFeedback, setRegenerateFeedback] = useState("")

    const fetchCourse = async () => {
        try {
            const data = await getCourse(id)
            setCourse(data)
            if (data.topics) setTopics(data.topics)
        } catch (e) {
            console.error(e)
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
        } catch (error) {
            console.error('Error generating content:', error)
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
        } catch (e) {
            console.error(e)
            alert("Failed to approve")
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
        } catch (e) {
            console.error(e)
            alert("Failed to update topic")
        }
    }

    const handleDeleteTopic = async () => {
        if (!topicToDelete) return
        try {
            await deleteTopic(topicToDelete.id)
            setIsDeleteDialogOpen(false)
            setTopicToDelete(null)
            fetchCourse()
        } catch (e) {
            console.error(e)
            alert("Failed to delete topic")
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
        } catch (e) {
            console.error(e)
            alert("Failed to add topic")
        }
    }

    const handleRegenerateTopics = async () => {
        setGenerating(true)
        try {
            await generateTopics(id)
            setIsRegenerateDialogOpen(false)
            fetchCourse()
        } catch (e) {
            console.error(e)
            alert("Failed to generate topics")
        } finally {
            setGenerating(false)
        }
    }

    const handlePublishCourse = async () => {
        try {
            const response = await fetch(`http://localhost:8000/courses/${id}/publish`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })

            if (!response.ok) {
                const error = await response.json()
                alert(error.detail || 'Failed to publish course')
                return
            }

            alert('Course published successfully!')
            fetchCourse()
        } catch (e) {
            console.error(e)
            alert('Failed to publish course')
        }
    }

    const handleDeleteCourse = async () => {
        try {
            await fetch(`http://localhost:8000/courses/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })
            router.push('/')
        } catch (e) {
            console.error(e)
            alert("Failed to delete course")
        }
    }

    if (loading) return <div className="p-24">Loading...</div>
    if (!course) return <div className="p-24">Course not found</div>

    return (
        <main className="flex min-h-screen flex-col p-24 bg-slate-50">
            <div className="max-w-6xl mx-auto w-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.push('/learn')}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-slate-900">{course.title}</h1>
                            {course.status === 'PUBLISHED' && (
                                <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full flex items-center gap-1">
                                    <CheckCircle className="h-4 w-4" />
                                    Published
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Topics List */}
                {topics.length > 0 && (
                    <div className="grid gap-4">
                        <h2 className="text-xl font-semibold">Course Outline</h2>
                        {topics
                            .filter((topic: any) => !topic.parent_topic_id)
                            .map((parentTopic: any) => {
                                const subTopics = topics.filter((t: any) => t.parent_topic_id === parentTopic.id)

                                return (
                                    <div key={parentTopic.id} className="border rounded-lg overflow-hidden">
                                        <div className="bg-slate-100 border-b p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                                        {parentTopic.order}. {parentTopic.title}
                                                    </h3>
                                                    <p className="text-sm text-slate-600 mt-1">{parentTopic.description}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {subTopics.length > 0 && (
                                            <div className="p-4 space-y-2">
                                                {subTopics.map((topic: any) => (
                                                    <div key={topic.id} className="flex items-center justify-between p-3 bg-white rounded border hover:shadow-sm transition-shadow">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-medium">• {topic.title}</span>
                                                                {topic.status === 'APPROVED' && (
                                                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-slate-500 mt-1">{topic.description}</p>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button variant="outline" size="sm" onClick={() => handleViewContent(topic)}>
                                                                <FileText className="mr-2 h-4 w-4" />
                                                                View Content
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                    </div>
                )}

                {/* Content Dialog */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0">
                        <DialogHeader className="px-8 pt-8 pb-4 border-b bg-gradient-to-r from-indigo-50 to-purple-50">
                            <DialogTitle className="text-2xl font-bold text-slate-900">{selectedTopic?.title}</DialogTitle>
                        </DialogHeader>

                        <div className="flex-1 overflow-y-auto">
                            {contentLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                                </div>
                            ) : activeContent ? (
                                <div className="px-8 py-8">
                                    <article className="prose prose-slate prose-lg max-w-none">
                                        <Markdown
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                h1: ({ node, ...props }: any) => <h1 className="text-3xl font-bold text-slate-900 mt-8 mb-4 pb-2 border-b-2 border-indigo-200" {...props} />,
                                                h2: ({ node, ...props }: any) => <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4" {...props} />,
                                                h3: ({ node, ...props }: any) => <h3 className="text-xl font-semibold text-slate-700 mt-6 mb-3" {...props} />,
                                                p: ({ node, ...props }: any) => <p className="text-base text-slate-700 leading-relaxed mb-4" {...props} />,
                                                ul: ({ node, ...props }: any) => <ul className="list-disc list-inside space-y-2 mb-4 ml-4" {...props} />,
                                                ol: ({ node, ...props }: any) => <ol className="list-decimal list-inside space-y-2 mb-4 ml-4" {...props} />,
                                                li: ({ node, ...props }: any) => <li className="text-slate-700 leading-relaxed" {...props} />,
                                                blockquote: ({ node, ...props }: any) => (
                                                    <blockquote className="border-l-4 border-indigo-400 bg-indigo-50 pl-4 py-2 my-4 italic text-slate-700" {...props} />
                                                ),
                                                a: ({ node, ...props }: any) => <a className="text-indigo-600 hover:text-indigo-800 underline" {...props} />,
                                                strong: ({ node, ...props }: any) => <strong className="font-semibold text-slate-900" {...props} />,
                                                em: ({ node, ...props }: any) => <em className="italic text-slate-700" {...props} />,
                                                code({ node, inline, className, children, ...props }: any) {
                                                    const match = /language-(\w+)/.exec(className || '')
                                                    return !inline && match ? (
                                                        <div className="my-6 rounded-lg overflow-hidden shadow-md border border-slate-200">
                                                            <div className="bg-slate-800 text-slate-100 px-4 py-2 text-sm font-mono flex items-center justify-between">
                                                                <span>{match[1]}</span>
                                                                <span className="text-[10px] opacity-70">Copy</span>
                                                            </div>
                                                            <SyntaxHighlighter
                                                                style={vscDarkPlus}
                                                                language={match[1]}
                                                                PreTag="div"
                                                                customStyle={{
                                                                    margin: 0,
                                                                    borderRadius: 0,
                                                                    padding: '1.5rem',
                                                                    fontSize: '0.9rem',
                                                                    lineHeight: '1.6'
                                                                }}
                                                            >
                                                                {String(children).replace(/\n$/, '')}
                                                            </SyntaxHighlighter>
                                                        </div>
                                                    ) : (
                                                        <code className="bg-slate-100 text-indigo-700 px-1.5 py-0.5 rounded font-mono text-sm" {...props}>
                                                            {children}
                                                        </code>
                                                    )
                                                },
                                                table: ({ node, ...props }: any) => (
                                                    <div className="my-6 overflow-x-auto">
                                                        <table className="min-w-full divide-y divide-slate-300 border border-slate-300" {...props} />
                                                    </div>
                                                ),
                                                thead: ({ node, ...props }: any) => (
                                                    <thead className="bg-slate-100" {...props} />
                                                ),
                                                tbody: ({ node, ...props }: any) => (
                                                    <tbody className="divide-y divide-slate-200 bg-white" {...props} />
                                                ),
                                                tr: ({ node, ...props }: any) => (
                                                    <tr className="hover:bg-slate-50" {...props} />
                                                ),
                                                th: ({ node, ...props }: any) => (
                                                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900 border-r border-slate-300 last:border-r-0" {...props} />
                                                ),
                                                td: ({ node, ...props }: any) => (
                                                    <td className="px-4 py-3 text-sm text-slate-700 border-r border-slate-200 last:border-r-0" {...props} />
                                                )
                                            }}
                                        >
                                            {activeContent}
                                        </Markdown>
                                    </article>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full px-8 text-center">
                                    <FileText className="h-16 w-16 text-slate-300 mb-4" />
                                    <p className="text-slate-500 mb-6">No content available yet</p>
                                    <Button onClick={() => handleGenerateContent()} disabled={generating}>
                                        {generating ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <Play className="mr-2 h-4 w-4" />
                                                Generate Content
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>

                        {activeContent && selectedTopic?.status === 'APPROVED' && (
                            <div className="border-t px-8 py-4 bg-slate-50 flex justify-center items-center">
                                <span className="flex items-center gap-2 text-green-600 text-sm">
                                    <CheckCircle className="h-4 w-4" />
                                    Content Approved
                                </span>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Remove all admin dialogs - Edit, Add, Delete, Regenerate, etc */}
            </div>
        </main>
    )
}
