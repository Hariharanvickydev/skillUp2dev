"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CheckCircle2, ChevronRight, Menu, Brain, PanelLeftClose, PanelLeftOpen, Flag, Bookmark } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
// Use the shared MarkdownPreview component for consistent styling with Admin
import { MarkdownPreview } from "@/components/ui/markdown-preview"

export default function TopicContentPage() {
    const params = useParams()
    const router = useRouter()
    const courseId = params.id as string
    const topicId = params.topicId as string

    const [topic, setTopic] = useState<any>(null)
    const [course, setCourse] = useState<any>(null)
    const [content, setContent] = useState<string>('')
    const [loading, setLoading] = useState(true)
    const [completedTopicIds, setCompletedTopicIds] = useState<Set<string>>(new Set())
    const [bookmarkedTopicIds, setBookmarkedTopicIds] = useState<Set<string>>(new Set())
    const [completionLoading, setCompletionLoading] = useState(false)
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    // Derived state for navigation
    const [prevTopic, setPrevTopic] = useState<any>(null)
    const [nextTopic, setNextTopic] = useState<any>(null)

    useEffect(() => {
        fetchData()
    }, [courseId, topicId])

    const fetchData = async () => {
        try {
            // Fetch course
            const courseRes = await fetch(`http://localhost:8000/courses/${courseId}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            })
            const courseData = await courseRes.json()
            setCourse(courseData)

            // Find topic
            const foundTopic = courseData.topics?.find((t: any) => t.id === topicId)
            setTopic(foundTopic)

            // Identify all navigable topics (Published & Approved & Nested)
            const allTopics = courseData.topics
                .filter((t: any) => !t.parent_topic_id && t.is_published)
                .sort((a: any, b: any) => a.order - b.order)
                .flatMap((parent: any) =>
                    courseData.topics
                        .filter((t: any) => t.parent_topic_id === parent.id && t.status === 'APPROVED')
                        .sort((a: any, b: any) => a.order - b.order)
                )

            const currentIndex = allTopics.findIndex((t: any) => t.id === topicId)
            setPrevTopic(currentIndex > 0 ? allTopics[currentIndex - 1] : null)
            setNextTopic(currentIndex < allTopics.length - 1 ? allTopics[currentIndex + 1] : null)

            // Fetch content
            const contentRes = await fetch(`http://localhost:8000/topics/${topicId}/content`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            })
            const contentData = await contentRes.json()
            setContent(contentData.content || '')

            // Fetch progress
            const progressRes = await fetch(`http://localhost:8000/progress/courses/${courseId}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            })
            const progressData = await progressRes.json()
            const completedIds = new Set<string>(
                progressData
                    .filter((p: any) => p.completed)
                    .map((p: any) => String(p.topic_id))
            )
            setCompletedTopicIds(completedIds)

            const bookmarkedIds = new Set<string>(
                progressData
                    .filter((p: any) => p.is_bookmarked)
                    .map((p: any) => String(p.topic_id))
            )
            setBookmarkedTopicIds(bookmarkedIds)

        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleToggleComplete = async (shouldNavigate = false) => {
        setCompletionLoading(true)
        const isCompleted = completedTopicIds.has(topicId)
        try {
            if (isCompleted) {
                await fetch(`http://localhost:8000/progress/topics/${topicId}/complete`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                })
                completedTopicIds.delete(topicId)
                setCompletedTopicIds(new Set(completedTopicIds))
            } else {
                await fetch(`http://localhost:8000/progress/topics/${topicId}/complete`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                })
                setCompletedTopicIds(new Set(completedTopicIds.add(topicId)))

                if (shouldNavigate && nextTopic) {
                    router.push(`/learn/courses/${courseId}/topics/${nextTopic.id}`)
                }
            }
        } catch (error) {
            console.error('Error toggling completion:', error)
            toast.error('Failed to update status')
        } finally {
            setCompletionLoading(false)
        }
    }

    const handleToggleBookmark = async (e: React.MouseEvent, targetTopicId: string) => {
        e.preventDefault() // Prevent navigation if coming from link
        e.stopPropagation()

        const isBookmarked = bookmarkedTopicIds.has(targetTopicId)
        try {
            if (isBookmarked) {
                await fetch(`http://localhost:8000/progress/topics/${targetTopicId}/bookmark`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                })
                bookmarkedTopicIds.delete(targetTopicId)
                toast.success("Removed from bookmarks")
            } else {
                await fetch(`http://localhost:8000/progress/topics/${targetTopicId}/bookmark`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                })
                bookmarkedTopicIds.add(targetTopicId)
                toast.success("Marked for revisit")
            }
            setBookmarkedTopicIds(new Set(bookmarkedTopicIds))
        } catch (error) {
            console.error('Error toggling bookmark:', error)
        }
    }

    const handlePrevious = () => {
        if (prevTopic) {
            router.push(`/learn/courses/${courseId}/topics/${prevTopic.id}`)
        } else {
            router.push(`/learn/courses/${courseId}`)
        }
    }

    const handleNext = () => {
        if (nextTopic) {
            router.push(`/learn/courses/${courseId}/topics/${nextTopic.id}`)
        } else {
            router.push(`/learn/courses/${courseId}`)
        }
    }

    const TopicList = () => {
        const publishedTopics = course?.topics?.filter((t: any) => !t.parent_topic_id && t.is_published)
            .flatMap((p: any) => course?.topics?.filter((t: any) => t.parent_topic_id === p.id && t.status === 'APPROVED')) || []
        const completedCount = publishedTopics.filter((t: any) => completedTopicIds.has(t.id)).length
        const progressPercentage = publishedTopics.length > 0 ? Math.round((completedCount / publishedTopics.length) * 100) : 0

        return (
            <div className="py-6">
                {/* Course Progress Section */}
                <div className="px-6 mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-semibold text-slate-700">Course Progress</h4>
                        <span className="text-lg font-bold text-slate-900">{progressPercentage}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                        <div
                            className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                            style={{ width: `${progressPercentage}%` }}
                        ></div>
                    </div>
                    <p className="text-xs text-slate-500">Completed {completedCount}/{publishedTopics.length} published topics</p>
                </div>

                {/* Course Title */}
                <div className="px-6 mb-6">
                    <h3 className="font-bold text-slate-900">{course?.title}</h3>
                </div>

                <div className="px-6 space-y-8">
                    {course?.topics
                        .filter((t: any) => !t.parent_topic_id && t.is_published)
                        .sort((a: any, b: any) => a.order - b.order)
                        .map((parent: any) => {
                            const subs = course.topics
                                .filter((t: any) => t.parent_topic_id === parent.id && t.status === 'APPROVED')
                                .sort((a: any, b: any) => a.order - b.order)
                            if (!subs.length) return null

                            return (
                                <div key={parent.id}>
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 pl-2">
                                        Module {parent.order}: {parent.title}
                                    </div>
                                    <div className="space-y-0 relative border-l-2 border-slate-100 ml-2.5 pl-4 pb-4 last:pb-0">
                                        {subs.map((sub: any, idx: number) => {
                                            const isActive = sub.id === topicId
                                            const isCompleted = completedTopicIds.has(sub.id)
                                            const isBookmarked = bookmarkedTopicIds.has(sub.id)

                                            return (
                                                <div
                                                    key={sub.id}
                                                    onClick={() => router.push(`/learn/courses/${courseId}/topics/${sub.id}`)}
                                                    onContextMenu={(e) => handleToggleBookmark(e, sub.id)}
                                                    className="relative py-2 group cursor-pointer flex justify-between items-center pr-2"
                                                    title="Right click to mark for revisit"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {/* Timeline Dot */}
                                                        <div
                                                            className={cn(
                                                                "absolute left-[-21px] top-3.5 w-3 h-3 rounded-full border-2 bg-white transition-colors z-10",
                                                                isActive ? "border-indigo-600 bg-indigo-600 ring-2 ring-indigo-100" :
                                                                    isCompleted ? "border-green-500 bg-green-500" :
                                                                        "border-slate-300 group-hover:border-indigo-400"
                                                            )}
                                                        />

                                                        <div className={cn(
                                                            "text-sm transition-colors duration-200",
                                                            isActive ? "font-semibold text-indigo-700" :
                                                                isCompleted ? "text-slate-600 font-medium" :
                                                                    "text-slate-500 group-hover:text-slate-900"
                                                        )}>
                                                            <span className="line-clamp-1">{sub.title}</span>
                                                        </div>
                                                    </div>

                                                    {isBookmarked && (
                                                        <Flag className="h-3 w-3 text-orange-500 fill-orange-500" />
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )
                        })}
                </div>
            </div>
        )
    }

    if (loading) return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
    if (!topic || !course) return <div className="p-12 text-center text-slate-500">Topic not found</div>

    const isCompleted = completedTopicIds.has(topicId)

    return (
        <div className="flex h-[calc(100vh-theme(spacing.0))] bg-white">
            {/* Desktop Sidebar */}
            <div className={cn(
                "hidden lg:block border-r border-slate-200 h-full overflow-y-auto shrink-0 bg-white transition-all duration-300 ease-in-out",
                isSidebarOpen ? "w-80" : "w-0 border-r-0"
            )}>
                <div className="p-4 border-b border-slate-100 min-w-80 sticky top-0 bg-white z-10">
                    <Button variant="ghost" size="sm" onClick={() => router.push(`/learn/courses/${courseId}`)} className="-ml-2 text-slate-500 hover:text-slate-900">
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Outline
                    </Button>
                </div>
                <div className="min-w-80 pb-10">
                    <TopicList />
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden w-full bg-slate-50">
                {/* Top Bar relative to content */}
                <header className="h-16 border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 bg-white/80 backdrop-blur-sm z-10 shrink-0 sticky top-0">
                    <div className="flex items-center gap-3">
                        {/* Toggle Sidebar Button (Desktop) */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="hidden lg:flex text-slate-500 hover:text-indigo-600 mr-2"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            title={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
                        >
                            {isSidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
                        </Button>

                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="lg:hidden">
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="p-0 w-80">
                                <TopicList />
                            </SheetContent>
                        </Sheet>
                        <div>
                            <h1 className="text-sm font-bold text-slate-900 sm:text-lg line-clamp-1">{topic.title}</h1>
                            <p className="text-xs text-slate-500 hidden sm:block">Module: {course.topics.find((t: any) => t.id === topic.parent_topic_id)?.title}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center text-xs font-medium">
                            {isCompleted ? <span className="flex items-center text-green-600"><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Completed</span> : <span className="text-slate-400">In Progress</span>}
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => handleToggleBookmark(e, topicId)}
                            className={cn(
                                "gap-2 transition-colors",
                                bookmarkedTopicIds.has(topicId)
                                    ? "border-orange-300 text-orange-600 hover:bg-orange-50"
                                    : "border-slate-200 text-slate-500 hover:text-orange-600 hover:border-orange-300"
                            )}
                        >
                            <Flag className={cn("h-4 w-4", bookmarkedTopicIds.has(topicId) && "fill-orange-500")} />
                            {bookmarkedTopicIds.has(topicId) ? "Bookmarked" : "Bookmark"}
                        </Button>
                    </div>
                </header>

                {/* Content Scroll Area */}
                <div className="flex-1 overflow-y-auto">
                    <div className={cn("mx-auto px-4 sm:px-8 py-12 transition-all duration-300", isSidebarOpen ? "max-w-4xl" : "max-w-6xl")}>
                        {content ? (
                            <div className="bg-white p-8 sm:p-12 rounded-2xl shadow-sm border border-slate-200/60 min-h-[500px]">
                                <MarkdownPreview content={content} />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-slate-300 text-slate-500">
                                <Brain className="h-12 w-12 mb-4 text-slate-300" />
                                <p>Content is being updated by your instructor.</p>
                            </div>
                        )}

                        {/* Bottom Navigation */}
                        <div className="mt-12 flex justify-between items-center pt-8 border-t border-slate-200/60">
                            <div className="flex items-center gap-3">
                                <Button variant="outline" onClick={handlePrevious} className="bg-white hover:bg-slate-50">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    {prevTopic ? "Previous" : "Back"}
                                </Button>

                                <Button
                                    variant="outline"
                                    onClick={() => router.push(`/learn/courses/${courseId}/topics/${topicId}/exams`)}
                                    className="bg-white hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition-colors"
                                >
                                    <Brain className="h-4 w-4 mr-2" />
                                    Practice Exam
                                </Button>
                            </div>

                            <div className="flex items-center gap-3">
                                {/* Only show Mark & Next if not completed yet */}
                                {!isCompleted && nextTopic && (
                                    <Button
                                        onClick={() => handleToggleComplete(true)} // True = Navigate after complete
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                                    >
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                        Mark Complete & Next
                                    </Button>
                                )}

                                <Button variant="outline" onClick={handleNext} className="bg-white hover:bg-slate-50">
                                    {nextTopic ? "Next Topic" : "Finish Course"}
                                    <ChevronRight className="h-4 w-4 ml-2" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
