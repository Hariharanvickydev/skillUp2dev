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
        setIsRegenerateDialogOpen(false)
        setGenerating(true)
        try {
            await generateTopics(id)
            fetchCourse()
        } catch (e) {
            console.error(e)
            alert("Failed to regenerate topics")
        } finally {
            setGenerating(false)
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
                        <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">{course.title}</h1>
                        </div>
                    </div>
                    <Button variant="destructive" onClick={() => setIsDeleteCourseDialogOpen(true)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Course
                    </Button>
                </div>

                {/* Generate Topics Button */}
                {topics.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-slate-500 mb-4">No topics yet</p>
                        <Button onClick={() => setIsRegenerateDialogOpen(true)} disabled={generating}>
                            {generating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Play className="mr-2 h-4 w-4" />
                                    Generate Topics with AI
                                </>
                            )}
                        </Button>
                    </div>
                )}

                {/* Topic Management Buttons */}
                {topics.length > 0 && (
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => { setParentTopicForSubtopic(null); setIsAddDialogOpen(true); }}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Module
                        </Button>
                        <Button variant="outline" onClick={() => setIsRegenerateDialogOpen(true)}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Regenerate All
                        </Button>
                    </div>
                )}

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
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setParentTopicForSubtopic(parentTopic);
                                                            setNewTopicData({ title: "", description: "", order: subTopics.length + 1 });
                                                            setIsAddDialogOpen(true);
                                                        }}
                                                    >
                                                        <Plus className="mr-1 h-4 w-4" />
                                                        Add Sub-Topic
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => { setEditingTopic(parentTopic); setIsEditDialogOpen(true); }}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => { setTopicToDelete(parentTopic); setIsDeleteDialogOpen(true); }}>
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
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
                                                            <Button variant="ghost" size="icon" onClick={() => { setEditingTopic(topic); setIsEditDialogOpen(true); }}>
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" onClick={() => { setTopicToDelete(topic); setIsDeleteDialogOpen(true); }}>
                                                                <Trash2 className="h-4 w-4 text-red-500" />
                                                            </Button>
                                                            <Button variant="outline" size="sm" onClick={() => handleViewContent(topic)}>
                                                                <FileText className="mr-2 h-4 w-4" />
                                                                {topic.status === 'APPROVED' ? "Review" : "Generate"}
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
                                                }
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
                                    <Button onClick={handleGenerateContent} disabled={generating}>
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

                        {activeContent && (
                            <div className="border-t px-8 py-4 bg-slate-50 flex justify-between items-center">
                                <div className="text-sm text-slate-600">
                                    {selectedTopic?.status === 'APPROVED' ? (
                                        <span className="flex items-center gap-2 text-green-600">
                                            <CheckCircle className="h-4 w-4" />
                                            Approved
                                        </span>
                                    ) : (
                                        <span className="text-amber-600">Pending Approval</span>
                                    )}
                                </div>
                                {selectedTopic?.status !== 'APPROVED' && (
                                    <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Approve Content
                                    </Button>
                                )}
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
                            <div>
                                <label className="text-sm font-medium">Title</label>
                                <Input
                                    value={editingTopic?.title || ""}
                                    onChange={(e) => setEditingTopic({ ...editingTopic, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Description</label>
                                <Textarea
                                    value={editingTopic?.description || ""}
                                    onChange={(e) => setEditingTopic({ ...editingTopic, description: e.target.value })}
                                />
                            </div>
                            <Button onClick={handleEditTopic} className="w-full">Save Changes</Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Add Topic Dialog */}
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {parentTopicForSubtopic
                                    ? `Add Sub-Topic to: ${parentTopicForSubtopic.title}`
                                    : "Add New Module"}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <label className="text-sm font-medium">Title</label>
                                <Input
                                    value={newTopicData.title}
                                    onChange={(e) => setNewTopicData({ ...newTopicData, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Description</label>
                                <Textarea
                                    value={newTopicData.description}
                                    onChange={(e) => setNewTopicData({ ...newTopicData, description: e.target.value })}
                                />
                            </div>
                            <Button onClick={handleAddTopic} className="w-full">Add Topic</Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Delete Topic Dialog */}
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Topic?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to delete "{topicToDelete?.title}"? This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteTopic} className="bg-red-600 hover:bg-red-700">
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Regenerate Topics Dialog */}
                <AlertDialog open={isRegenerateDialogOpen} onOpenChange={setIsRegenerateDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Regenerate All Topics?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will delete all existing topics and generate new ones using AI. This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleRegenerateTopics} className="bg-indigo-600 hover:bg-indigo-700">
                                Regenerate
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Delete Course Dialog */}
                <AlertDialog open={isDeleteCourseDialogOpen} onOpenChange={setIsDeleteCourseDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Course?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to delete this entire course? All topics and content will be permanently deleted. This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteCourse} className="bg-red-600 hover:bg-red-700">
                                Delete Course
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </main>
    )
}
