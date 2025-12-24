"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ClipboardCheck, Trophy, Clock, Target, CheckCircle2, XCircle, AlertCircle, Lock, Loader2, Brain, FileCheck, ArrowLeft, BookOpen, Layers, Star, Play } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { getEnrolledCourses, getCourseExams, getExamAttempts } from "@/lib/api"

interface ExamAttempt {
    score: number
    passed: boolean
    created_at: string
}

interface Assessment {
    id: string
    title: string
    type: "FINAL" | "MODULE" | "TOPIC_TEST" | "PRACTICE"
    scope?: string
    course_id: string
    course_title: string
    module_title?: string
    topic_id?: string
    duration_minutes: number
    num_questions: number
    passing_score: number
    best_score: number | null
    attempts_count: number
    max_attempts?: number
    status: "NOT_STARTED" | "IN_PROGRESS" | "PASSED" | "FAILED"
}

interface CourseAssessments {
    course_id: string
    course_title: string
    category?: string
    code?: string
    status?: string
    description?: string
    difficulty?: string
    topicsCount?: number
    examCount: number
    practiceCount: number
    final_exam?: Assessment
    course_practice?: Assessment
    modules: {
        module_title: string
        module_exam?: Assessment
        module_practice?: Assessment
        topic_tests: Assessment[]
    }[]
}

export default function AssessmentsPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [courseAssessments, setCourseAssessments] = useState<CourseAssessments[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(searchParams.get('courseId'))
    const [activeTab, setActiveTab] = useState("topics")
    const [filterType, setFilterType] = useState<"ALL" | "PRACTICE" | "ASSESSMENT">("ALL")

    const shouldShowExam = (exam: Assessment) => {
        // Strict filtering: Only show Assessments. 
        // We might want to keep the filter UI but it will only toggle between types of assessments (Final, Module, Topic) if needed.
        // For now, simply exclude PRACTICE.
        if (exam.type === 'PRACTICE') return false

        if (filterType === "ALL") return true
        // Remnant logic: if we ever want to filter *among* assessments
        if (filterType === "ASSESSMENT") return true
        return true
    }

    useEffect(() => {
        fetchAssessments()
    }, [])

    useEffect(() => {
        const courseId = searchParams.get('courseId')
        const tab = searchParams.get('tab')

        setSelectedCourseId(courseId)
        if (tab) setActiveTab(tab)
    }, [searchParams])

    const fetchAssessments = async () => {
        try {
            console.log("Fetching enrolled courses...")
            const coursesData = await getEnrolledCourses()
            // Ensure courses is an array
            const courses = Array.isArray(coursesData) ? coursesData : []

            const allCourseAssessments: CourseAssessments[] = []

            for (const course of courses) {
                const exams = await getCourseExams(course.id)

                // Get attempts for all exams
                const examsWithAttempts = await Promise.all(exams.map(async (exam: any) => {
                    if (!exam.id) return null

                    try {
                        const attempts: ExamAttempt[] = await getExamAttempts(exam.id)

                        const bestScore = attempts.length > 0 ? Math.max(...attempts.map(a => a.score)) : null
                        const passed = attempts.some(a => a.passed)
                        const status = attempts.length === 0 ? "NOT_STARTED" :
                            passed ? "PASSED" :
                                attempts.length >= (exam.max_attempts || 999) ? "FAILED" :
                                    "IN_PROGRESS"

                        return {
                            id: exam.id,
                            title: exam.title || `${exam.type} Exam`,
                            type: exam.type,
                            scope: exam.scope,
                            course_id: course.id,
                            course_title: course.title,
                            module_title: exam.module_title,
                            topic_id: exam.topic_id,
                            duration_minutes: exam.duration_minutes,
                            num_questions: exam.questions?.length || 0,
                            passing_score: exam.passing_score,
                            best_score: bestScore,
                            attempts_count: attempts.length,
                            max_attempts: exam.max_attempts,
                            status
                        }
                    } catch (err) {
                        return {
                            id: exam.id,
                            title: exam.title || `${exam.type} Exam`,
                            type: exam.type,
                            scope: exam.scope,
                            course_id: course.id,
                            course_title: course.title,
                            module_title: exam.module_title,
                            topic_id: exam.topic_id,
                            duration_minutes: exam.duration_minutes,
                            num_questions: exam.questions?.length || 0,
                            passing_score: exam.passing_score,
                            best_score: null,
                            attempts_count: 0,
                            max_attempts: exam.max_attempts,
                            status: "NOT_STARTED"
                        }
                    }
                }))

                // Filter out nulls
                const validExams = examsWithAttempts.filter(e => e !== null) as any[]

                // Calculate counts correctly based on validExams
                const practiceCount = validExams.filter(e => e.type === 'PRACTICE').length
                const examCount = validExams.filter(e => e.type !== 'PRACTICE').length

                // Organize exams by type and module
                const final_exam = validExams.find(e => e.type === 'FINAL')
                const course_practice = validExams.find(e => e.type === 'PRACTICE' && e.scope === 'COURSE')

                // Group by module
                const moduleMap = new Map<string, any>()

                validExams.forEach(exam => {
                    if (exam.type === 'FINAL' || (exam.type === 'PRACTICE' && exam.scope === 'COURSE')) {
                        return // Already handled above
                    }

                    const moduleName = exam.module_title || 'Other'
                    if (!moduleMap.has(moduleName)) {
                        moduleMap.set(moduleName, {
                            module_title: moduleName,
                            module_exam: undefined,
                            module_practice: undefined,
                            topic_tests: []
                        })
                    }

                    const module = moduleMap.get(moduleName)
                    if (exam.type === 'MODULE') {
                        module.module_exam = exam
                    } else if (exam.type === 'PRACTICE' && exam.scope === 'MODULE') {
                        module.module_practice = exam
                    } else if (exam.type === 'TOPIC_TEST' || (exam.type === 'PRACTICE' && exam.scope === 'TOPIC')) {
                        module.topic_tests.push(exam)
                    }
                })

                if (validExams.length > 0) {
                    allCourseAssessments.push({
                        course_id: course.id,
                        course_title: course.title,
                        category: course.category,
                        code: course.code,
                        status: course.status,
                        description: course.description,
                        difficulty: course.difficulty,
                        topicsCount: course.topics?.filter((t: any) => !t.parent_topic_id).length || 0,
                        examCount,
                        practiceCount,
                        final_exam,
                        course_practice,
                        modules: Array.from(moduleMap.values())
                    })
                }
            }

            setCourseAssessments(allCourseAssessments)
        } catch (error) {
            console.error('Error fetching assessments:', error)
        } finally {
            setLoading(false)
        }
    }

    const getStatusBadge = (status: Assessment['status']) => {
        switch (status) {
            case 'PASSED':
                return <Badge className="bg-green-100 text-green-700 border-green-200"><CheckCircle2 className="h-3 w-3 mr-1" />Passed</Badge>
            case 'FAILED':
                return <Badge className="bg-red-100 text-red-700 border-red-200"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>
            case 'IN_PROGRESS':
                return <Badge className="bg-blue-100 text-blue-700 border-blue-200"><AlertCircle className="h-3 w-3 mr-1" />In Progress</Badge>
            case 'NOT_STARTED':
                return <Badge className="bg-slate-100 text-slate-700 border-slate-200"><Target className="h-3 w-3 mr-1" />Not Started</Badge>
        }
    }

    const handleTakeExam = (assessment: Assessment) => {
        router.push(`/learn/courses/${assessment.course_id}/exam/${assessment.id}?returnTo=/learn/assessments?courseId=${assessment.course_id}%26tab=${activeTab}`)
    }

    const ExamCard = ({ exam, icon: Icon, variant = "default" }: { exam: Assessment, icon: any, variant?: string }) => (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
                <div className="flex items-start gap-3 mb-3">
                    <div className={cn(
                        "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
                        variant === "final" ? "bg-gradient-to-br from-amber-400 to-orange-500" :
                            variant === "practice" ? "bg-gradient-to-br from-green-400 to-emerald-500" :
                                "bg-gradient-to-br from-indigo-500 to-purple-600"
                    )}>
                        <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-slate-900 truncate">{exam.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                            {getStatusBadge(exam.status)}
                            {exam.best_score !== null && (
                                <span className="text-sm font-bold text-indigo-600">{exam.best_score}%</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 text-xs text-slate-600 mb-3">
                    <span>{exam.duration_minutes}m</span>
                    <span>•</span>
                    <span>{exam.num_questions} Qs</span>
                    <span>•</span>
                    <span>Pass: {exam.passing_score}%</span>
                </div>

                <Button
                    onClick={() => handleTakeExam(exam)}
                    size="sm"
                    className="w-full"
                    variant={exam.status === 'PASSED' ? 'outline' : 'default'}
                    disabled={exam.status === 'FAILED'}
                >
                    {exam.status === 'PASSED' ? 'View Results' :
                        exam.status === 'FAILED' ? <><Lock className="h-3 w-3 mr-2" />No Retakes</> :
                            exam.status === 'IN_PROGRESS' ? 'Continue' :
                                exam.type === 'PRACTICE' ? 'Practice Now' : 'Start Exam'}
                </Button>
            </CardContent>
        </Card>
    )

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        )
    }

    const selectedCourseData = courseAssessments.find(c => c.course_id === selectedCourseId)

    return (
        <div className="p-6 lg:p-10 space-y-8 pb-20 max-w-7xl mx-auto">
            {/* Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 p-8 lg:p-12 text-white shadow-xl">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-80 w-80 rounded-full bg-purple-500/20 blur-3xl"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        {selectedCourseId && (
                            <Button
                                variant="ghost"
                                className="text-white hover:bg-white/10 mr-2 p-0 h-10 w-10 rounded-full"
                                onClick={() => setSelectedCourseId(null)}
                            >
                                <ArrowLeft className="h-6 w-6" />
                            </Button>
                        )}
                        <div className="h-12 w-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center">
                            <ClipboardCheck className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold">
                                {selectedCourseId && selectedCourseData ? selectedCourseData.course_title : "My Assessments"}
                            </h1>
                            <p className="text-white/80 mt-1">
                                {selectedCourseId ? "Manage your exams and practice tests" : "Select a course to view assessments"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {!selectedCourseId ? (
                // COURSE LIST VIEW
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
                    {courseAssessments.map((course) => {
                        const gradient = getGradient(course.category || "");
                        return (
                            <div
                                key={course.course_id}
                                className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col cursor-pointer"
                                onClick={() => setSelectedCourseId(course.course_id)}
                            >
                                <div className={`h-40 w-full bg-gradient-to-r ${gradient} relative`}>
                                    <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors"></div>
                                    <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-white uppercase tracking-wider border border-white/20">
                                        {course.code || "COURSE"}
                                    </div>

                                    <div className="absolute bottom-4 left-6">
                                        {course.status === 'PUBLISHED' && (
                                            <Badge className="bg-emerald-500 hover:bg-emerald-600 border-0 shadow-sm backdrop-blur-md">
                                                Live Course
                                            </Badge>
                                        )}
                                        {course.status === 'PARTIALLY_PUBLISHED' && (
                                            <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-0 shadow-sm">
                                                In Progress
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="mb-4">
                                        <h3 className="text-xl font-bold text-slate-900 line-clamp-2 mb-2 group-hover:text-indigo-600 transition-colors">
                                            {course.course_title}
                                        </h3>
                                        <p className="text-slate-500 text-sm line-clamp-2 mb-4 h-10 leading-relaxed">
                                            {course.description || "View all assessments and practice tests for this course."}
                                        </p>
                                    </div>

                                    <div className="mt-auto">
                                        <div className="flex items-center justify-between text-sm text-slate-500 mb-6">
                                            <div className="flex items-center gap-1.5">
                                                <Layers className="h-4 w-4 text-indigo-500" />
                                                <span>{course.topicsCount || 0} Modules</span>
                                            </div>
                                            {course.difficulty && (
                                                <div className="flex items-center gap-1.5">
                                                    <Star className="h-4 w-4 text-orange-400" />
                                                    <span>{course.difficulty}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex justify-start items-center text-sm mb-2 px-1 font-medium">
                                            <span className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2 py-1 rounded-md">
                                                <Trophy className="h-3.5 w-3.5" />
                                                {course.examCount} Assessments
                                            </span>
                                        </div>

                                        <Button className="w-full bg-slate-900 group-hover:bg-indigo-600 transition-all duration-300 shadow-md group-hover:shadow-indigo-500/30 font-semibold h-11 rounded-xl">
                                            <Play className="mr-2 h-4 w-4 fill-current" />
                                            View Assessments
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}

                    {courseAssessments.length === 0 && (
                        <div className="col-span-full text-center py-12 text-slate-500">
                            No enrolled courses found.
                        </div>
                    )}
                </div>
            ) : (
                // COURSE DETAIL VIEW
                selectedCourseData && (
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                            <TabsList className="bg-white p-1 border border-slate-200 rounded-xl h-auto w-full sm:w-auto grid grid-cols-3 sm:flex">
                                <TabsTrigger value="topics" className="px-4 py-3 rounded-lg data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
                                    <BookOpen className="h-4 w-4 mr-2 hidden sm:inline" />
                                    Topic Tests
                                </TabsTrigger>
                                <TabsTrigger value="modules" className="px-4 py-3 rounded-lg data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
                                    <Brain className="h-4 w-4 mr-2 hidden sm:inline" />
                                    Module Exams
                                </TabsTrigger>
                                <TabsTrigger value="full" className="px-4 py-3 rounded-lg data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
                                    <Trophy className="h-4 w-4 mr-2 hidden sm:inline" />
                                    Full Course
                                </TabsTrigger>
                            </TabsList>

                            <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200">
                                <span className="text-xs font-medium text-slate-500 ml-3">Filter:</span>
                                <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
                                    <SelectTrigger className="w-[180px] border-0 focus:ring-0">
                                        <SelectValue placeholder="Filter by type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">All Types</SelectItem>
                                        <SelectItem value="PRACTICE">Practice Only</SelectItem>
                                        <SelectItem value="ASSESSMENT">Assessments Only</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* TOPIC TAB */}
                        <TabsContent value="topics" className="space-y-8">
                            {selectedCourseData.modules.map((module, idx) => {
                                const visibleTests = module.topic_tests.filter(shouldShowExam)
                                if (visibleTests.length === 0) return null

                                return (
                                    <div key={idx} className="space-y-4">
                                        <div className="flex items-center gap-2 text-slate-700 font-semibold border-b pb-2">
                                            <span className="bg-slate-100 px-2 py-1 rounded text-xs text-slate-500">Module</span>
                                            {module.module_title}
                                        </div>
                                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {visibleTests.map(test => (
                                                <ExamCard
                                                    key={test.id}
                                                    exam={test}
                                                    icon={test.type === 'PRACTICE' ? Brain : ClipboardCheck}
                                                    variant={test.type === 'PRACTICE' ? 'practice' : 'default'}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}

                            {!selectedCourseData.modules.some(m => m.topic_tests.some(shouldShowExam)) && (
                                <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-dashed">
                                    No topic-level assessments found matching your filter.
                                </div>
                            )}
                        </TabsContent>

                        {/* MODULE TAB */}
                        <TabsContent value="modules" className="space-y-8">
                            {selectedCourseData.modules.map((module, idx) => {
                                const showExam = module.module_exam && shouldShowExam(module.module_exam)
                                const showPractice = module.module_practice && shouldShowExam(module.module_practice)

                                if (!showExam && !showPractice) return null

                                return (
                                    <div key={idx} className="space-y-4">
                                        <div className="flex items-center gap-2 text-slate-700 font-semibold border-b pb-2">
                                            <span className="bg-slate-100 px-2 py-1 rounded text-xs text-slate-500">Module</span>
                                            {module.module_title}
                                        </div>
                                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {showExam && module.module_exam && (
                                                <ExamCard exam={module.module_exam} icon={FileCheck} />
                                            )}
                                            {showPractice && module.module_practice && (
                                                <ExamCard exam={module.module_practice} icon={Brain} variant="practice" />
                                            )}
                                        </div>
                                    </div>
                                )
                            })}

                            {!selectedCourseData.modules.some(m =>
                                (m.module_exam && shouldShowExam(m.module_exam)) ||
                                (m.module_practice && shouldShowExam(m.module_practice))
                            ) && (
                                    <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-dashed">
                                        No module-level assessments found matching your filter.
                                    </div>
                                )}
                        </TabsContent>

                        {/* FULL COURSE TAB */}
                        <TabsContent value="full" className="space-y-6">
                            {selectedCourseData.final_exam && shouldShowExam(selectedCourseData.final_exam) && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                                        <Trophy className="h-5 w-5 text-amber-500" />
                                        Final Exam
                                    </h3>
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <ExamCard exam={selectedCourseData.final_exam} icon={Trophy} variant="final" />
                                    </div>
                                </div>
                            )}

                            {selectedCourseData.course_practice && shouldShowExam(selectedCourseData.course_practice) && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                                        <BookOpen className="h-5 w-5 text-indigo-500" />
                                        Full Course Practice
                                    </h3>
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <ExamCard exam={selectedCourseData.course_practice} icon={Brain} variant="practice" />
                                    </div>
                                </div>
                            )}

                            {(!selectedCourseData.final_exam || !shouldShowExam(selectedCourseData.final_exam)) &&
                                (!selectedCourseData.course_practice || !shouldShowExam(selectedCourseData.course_practice)) && (
                                    <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-dashed">
                                        No full-course assessments found matching your filter.
                                    </div>
                                )}
                        </TabsContent>
                    </Tabs>
                )
            )}
        </div>
    )
}

function getGradient(category: string) {
    if (!category) return "from-indigo-500 to-purple-600";
    if (category.includes("Computer")) return "from-blue-600 to-indigo-600";
    if (category.includes("Data")) return "from-emerald-500 to-teal-600";
    if (category.includes("Business")) return "from-orange-500 to-amber-600";
    if (category.includes("Design")) return "from-pink-500 to-rose-600";
    return "from-slate-500 to-slate-600";
}
