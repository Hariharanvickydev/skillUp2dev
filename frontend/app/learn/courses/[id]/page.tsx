"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { getCourse } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CheckCircle2, Play, FileText, Brain, Award } from "lucide-react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export default function CourseDetailPage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string

    const [course, setCourse] = useState<any>(null)
    const [topics, setTopics] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [completedTopicIds, setCompletedTopicIds] = useState<Set<string>>(new Set())

    const fetchCourse = async () => {
        try {
            const data = await getCourse(id)
            setCourse(data)
            if (data.topics) setTopics(data.topics)

            // Fetch user progress
            const progressRes = await fetch(`http://localhost:8000/progress/courses/${id}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            })
            const progressData = await progressRes.json()
            const completedIds = new Set<string>(
                progressData
                    .filter((p: any) => p.completed)
                    .map((p: any) => String(p.topic_id))
            )
            setCompletedTopicIds(completedIds)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCourse()
    }, [id])

    const calculateProgress = () => {
        if (!topics.length) return 0
        // Count ALL topics (including unpublished/coming soon)
        const allTopics = topics.filter((t: any) => !t.parent_topic_id)
            .flatMap((parent: any) => topics.filter((t: any) => t.parent_topic_id === parent.id))

        if (!allTopics.length) return 0

        const completedCount = allTopics.filter((t: any) => completedTopicIds.has(t.id)).length
        return Math.round((completedCount / allTopics.length) * 100)
    }

    const progress = calculateProgress()

    if (loading) return (
        <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
    )

    if (!course) return <div className="p-12 text-center text-slate-500">Course not found</div>

    const gradient = course.category?.includes("Computer") ? "from-blue-600 to-indigo-600" :
        course.category?.includes("Data") ? "from-emerald-500 to-teal-600" :
            "from-indigo-500 to-purple-600"

    return (
        <div className="p-6 lg:p-10 space-y-8 pb-20 max-w-7xl mx-auto">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 p-8 lg:p-12 text-white shadow-xl shadow-indigo-900/20">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-80 w-80 rounded-full bg-purple-500/20 blur-3xl"></div>

                <div className="relative z-10">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push('/learn')}
                        className="text-white/80 hover:text-white hover:bg-white/10 mb-6 -ml-2"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Courses
                    </Button>

                    <div className="flex flex-col md:flex-row gap-8 items-end justify-between">
                        <div className="flex-1 space-y-6">
                            <div>
                                <div className="inline-flex items-center text-xs font-bold px-2 py-1 rounded bg-white/20 backdrop-blur-md border border-white/20 mb-3">
                                    {course.code || "COURSE"}
                                </div>
                                <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight">{course.title}</h1>
                                <p className="text-lg text-white/90 max-w-2xl leading-relaxed mt-4">
                                    {course.description || "Master this subject with our comprehensive curriculum."}
                                </p>
                            </div>

                            {/* Progress Bar & Continue Button */}
                            <div className="flex flex-col sm:flex-row gap-6 items-end sm:items-center w-full max-w-4xl">
                                <div className="flex-1 w-full bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                                    <div className="flex justify-between items-center mb-2 text-sm font-medium">
                                        <span>Course Progress</span>
                                        <span>{progress}%</span>
                                    </div>
                                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-white transition-all duration-500 ease-out"
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                    <div className="mt-2 text-xs text-white/70">
                                        {(() => {
                                            const publishedTopics = topics.filter((t: any) => !t.parent_topic_id && t.is_published)
                                                .flatMap((parent: any) => topics.filter((t: any) => t.parent_topic_id === parent.id && t.status === 'APPROVED'))
                                            const completedCount = publishedTopics.filter((t: any) => completedTopicIds.has(t.id)).length
                                            return `Completed ${completedCount}/${publishedTopics.length} published topics`
                                        })()}
                                    </div>
                                </div>

                                <Button
                                    size="lg"
                                    className="bg-white text-indigo-900 hover:bg-indigo-50 font-bold shadow-lg shadow-black/10 whitespace-nowrap min-w-[200px]"
                                    onClick={() => {
                                        // Resume - find first incomplete
                                        const firstIncomplete = topics.flatMap((p: any) => topics.filter((t: any) => t.parent_topic_id === p.id && t.status === 'APPROVED'))
                                            .find((t: any) => !completedTopicIds.has(t.id))
                                        if (firstIncomplete) router.push(`${id}/topics/${firstIncomplete.id}`)
                                    }}
                                >
                                    <Play className="h-5 w-5 mr-2 fill-current" /> Continue Learning
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="max-w-5xl mx-auto">
                <div className="space-y-6">
                    {course.topics && course.topics.length > 0 ? (
                        course.topics
                            .filter((topic: any) => !topic.parent_topic_id)
                            .sort((a: any, b: any) => a.order - b.order)
                            .map((parentTopic: any) => {
                                const allSubTopics = topics
                                    .filter((t: any) => t.parent_topic_id === parentTopic.id)
                                    .sort((a: any, b: any) => a.order - b.order)
                                if (allSubTopics.length === 0) return null

                                return (
                                    <div key={parentTopic.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                                        <div className="bg-slate-50/50 p-6 flex justify-between items-center">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-800 flex items-baseline gap-3">
                                                    <span className="text-indigo-400 font-mono text-sm tracking-wider">MODULE {parentTopic.order}</span>
                                                    {parentTopic.title}
                                                </h3>
                                                {parentTopic.description && (
                                                    <p className="text-slate-500 text-sm mt-1 ml-24 max-w-2xl">{parentTopic.description}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="divide-y divide-slate-50">
                                            {allSubTopics.map((topic: any) => {
                                                const isCompleted = completedTopicIds.has(topic.id)
                                                const isPublished = topic.status === 'APPROVED' && parentTopic.is_published
                                                return (
                                                    <div
                                                        key={topic.id}
                                                        className={cn(
                                                            "group p-5 transition-all flex items-center justify-between",
                                                            isPublished ? "hover:bg-slate-50 cursor-pointer" : "opacity-60 cursor-not-allowed"
                                                        )}
                                                        onClick={() => isPublished && router.push(`/learn/courses/${id}/topics/${topic.id}`)}
                                                    >
                                                        <div className="flex items-center gap-5">
                                                            <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all ${!isPublished ? 'border-slate-200 text-slate-300' :
                                                                isCompleted ? 'bg-green-100 border-green-500 text-green-600 scale-100' :
                                                                    'border-slate-200 text-slate-300 group-hover:border-indigo-300 group-hover:text-indigo-400 scale-95 group-hover:scale-100'
                                                                }`}>
                                                                {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <div className="h-2 w-2 rounded-full bg-current" />}
                                                            </div>
                                                            <div>
                                                                <h4 className={`text-sm font-semibold ${!isPublished ? 'text-slate-400' :
                                                                    isCompleted ? 'text-slate-900' :
                                                                        'text-slate-700'
                                                                    } group-hover:text-indigo-700 transition-colors`}>
                                                                    {topic.title}
                                                                </h4>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-3">
                                                            {isPublished && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        router.push(`/learn/courses/${id}/topics/${topic.id}/exams`)
                                                                    }}
                                                                    className="text-xs font-semibold bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 text-indigo-700 hover:from-indigo-100 hover:to-purple-100 hover:border-indigo-300 hover:shadow-md transition-all duration-200"
                                                                >
                                                                    <Brain className="h-3.5 w-3.5 mr-1.5" />
                                                                    Practice Exam
                                                                </Button>
                                                            )}

                                                            <div className="hidden sm:flex items-center gap-2 text-xs font-medium min-w-[100px] justify-end">
                                                                {!isPublished ? (
                                                                    <span className="text-slate-400">Coming Soon</span>
                                                                ) : isCompleted ? (
                                                                    <span className="text-green-600">Completed</span>
                                                                ) : (
                                                                    <span className="flex items-center gap-1 text-slate-300 group-hover:text-indigo-600 transition-colors">
                                                                        Start <ArrowLeft className="h-3 w-3 rotate-180" />
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )
                            })
                    ) : (
                        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300">
                            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Brain className="h-8 w-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-900">No content available</h3>
                            <p className="text-slate-500">This course doesn't have any published modules yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
