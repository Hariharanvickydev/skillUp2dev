'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Brain, Plus, Users, Calendar, Loader2, Star, TrendingUp } from 'lucide-react'
import { toast } from "sonner"

interface Exam {
    id: string
    difficulty: string
    num_questions: number
    duration_minutes: number
    num_attempts: number
    pass_rate: number
    avg_score: number
    quality_score: number
    is_popular: boolean
    is_high_quality: boolean
    created_by: string
    owner_type: string
    created_at: string
    is_mine: boolean
}

export default function ExamLibraryPage() {
    const params = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()
    const courseId = params.id as string
    const topicId = params.topicId as string
    const returnTo = searchParams.get('returnTo')

    const [exams, setExams] = useState<Exam[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<string>('all')
    const [sortBy, setSortBy] = useState<string>('recent')
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [creating, setCreating] = useState(false)
    const [selectedDifficulty, setSelectedDifficulty] = useState('medium')
    const [selectedNumQuestions, setSelectedNumQuestions] = useState(10)

    useEffect(() => {
        fetchExams()
    }, [filter, sortBy])

    const fetchExams = async () => {
        setLoading(true)
        try {
            let url = `http://localhost:8000/exams/topics/${topicId}/exams?sort_by=${sortBy}`
            if (filter !== 'all') {
                url += `&difficulty=${filter}`
            }

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            })
            const data = await response.json()
            setExams(data)
        } catch (error) {
            console.error('Error fetching exams:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateExam = async () => {
        setCreating(true)
        try {
            const response = await fetch(`http://localhost:8000/exams/topics/${topicId}/generate-practice-exam`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    difficulty: selectedDifficulty,
                    num_questions: selectedNumQuestions
                })
            })

            console.log('Exam creation response status:', response.status)
            const responseText = await response.text()
            console.log('Exam creation response:', responseText)

            if (!response.ok) {
                throw new Error(`Failed to create exam: ${response.status} - ${responseText}`)
            }

            const exam = JSON.parse(responseText)
            setShowCreateDialog(false)

            // Construct return URL that preserves the current context
            const currentReturnTo = searchParams.get('returnTo')
            const baseReturn = `/learn/courses/${courseId}/topics/${topicId}/exams`
            const fullReturn = currentReturnTo ? `${baseReturn}?returnTo=${encodeURIComponent(currentReturnTo)}` : baseReturn

            router.push(`/learn/courses/${courseId}/topics/${topicId}/exam/${exam.id}?returnTo=${encodeURIComponent(fullReturn)}`)
        } catch (error) {
            console.error('Error creating exam:', error)
            toast.error(`Failed to create exam: ${error instanceof Error ? error.message : 'Unknown error'}`)
        } finally {
            setCreating(false)
        }
    }

    const handleTakeExam = (examId: string) => {
        const currentReturnTo = searchParams.get('returnTo')
        const baseReturn = `/learn/courses/${courseId}/topics/${topicId}/exams`
        const fullReturn = currentReturnTo ? `${baseReturn}?returnTo=${encodeURIComponent(currentReturnTo)}` : baseReturn

        router.push(`/learn/courses/${courseId}/topics/${topicId}/exam/${examId}?returnTo=${encodeURIComponent(fullReturn)}`)
    }

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty.toLowerCase()) {
            case 'easy': return 'bg-green-100 text-green-700'
            case 'medium': return 'bg-yellow-100 text-yellow-700'
            case 'hard': return 'bg-red-100 text-red-700'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

        if (diffDays === 0) return 'Today'
        if (diffDays === 1) return 'Yesterday'
        if (diffDays < 7) return `${diffDays} days ago`
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
        return date.toLocaleDateString()
    }

    const handleBack = () => {
        if (returnTo) {
            router.push(returnTo)
        } else {
            router.push(`/learn/courses/${courseId}/topics/${topicId}`)
        }
    }

    return (
        <main className="flex min-h-screen flex-col bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="icon" onClick={handleBack}>
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div>
                                <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    <Brain className="h-6 w-6 text-indigo-600" />
                                    Practice Exam Library
                                </h1>
                                <p className="text-sm text-slate-500">Choose an exam or create a new one</p>
                            </div>
                        </div>
                        <Button
                            onClick={() => setShowCreateDialog(true)}
                            className="bg-indigo-600 hover:bg-indigo-700"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Create New Exam
                        </Button>
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
                {/* Filters */}
                <div className="flex flex-wrap gap-2 mb-6 items-center">
                    <Button
                        variant={filter === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter('all')}
                    >
                        All Exams
                    </Button>
                    <Button
                        variant={filter === 'easy' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter('easy')}
                    >
                        Easy
                    </Button>
                    <Button
                        variant={filter === 'medium' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter('medium')}
                    >
                        Medium
                    </Button>
                    <Button
                        variant={filter === 'hard' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter('hard')}
                    >
                        Hard
                    </Button>

                    <div className="ml-auto">
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="recent">Most Recent</SelectItem>
                                <SelectItem value="popular">Most Popular</SelectItem>
                                <SelectItem value="quality">Highest Quality</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Exam Grid */}
                {loading ? (
                    <div className="flex justify-center py-24">
                        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
                    </div>
                ) : exams.length === 0 ? (
                    <Card className="text-center py-24">
                        <Brain className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">No exams available yet</h3>
                        <p className="text-slate-500 mb-6">Be the first to create a practice exam!</p>
                        <Button onClick={() => setShowCreateDialog(true)} className="bg-indigo-600 hover:bg-indigo-700">
                            <Plus className="mr-2 h-4 w-4" />
                            Create First Exam
                        </Button>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {exams.map((exam) => (
                            <Card key={exam.id} className="p-6 hover:shadow-lg transition-shadow">
                                <div className="flex flex-wrap gap-2 mb-4">
                                    <Badge className={getDifficultyColor(exam.difficulty)}>
                                        {exam.difficulty}
                                    </Badge>

                                    {/* Owner Type Badge */}
                                    {exam.owner_type === 'TEACHER' && (
                                        <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200">
                                            👨‍🏫 Teacher
                                        </Badge>
                                    )}
                                    {exam.owner_type === 'STUDENT' && (
                                        <Badge className="bg-green-100 text-green-700 border-green-200">
                                            👨‍🎓 Student
                                        </Badge>
                                    )}
                                    {exam.owner_type === 'SYSTEM' && (
                                        <Badge className="bg-slate-100 text-slate-700 border-slate-200">
                                            🤖 AI
                                        </Badge>
                                    )}

                                    {/* Quality Badges */}
                                    {exam.is_popular && (
                                        <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                                            🔥 Popular
                                        </Badge>
                                    )}
                                    {exam.is_high_quality && (
                                        <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                                            ⭐ High Quality
                                        </Badge>
                                    )}

                                    {exam.is_mine && (
                                        <Badge variant="outline" className="text-xs">
                                            Your exam
                                        </Badge>
                                    )}
                                </div>

                                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                    {exam.num_questions} Questions
                                </h3>

                                <div className="space-y-2 text-sm text-slate-600 mb-4">
                                    <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4" />
                                        <span>{exam.created_by}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Brain className="h-4 w-4" />
                                        <span>{exam.num_attempts} attempts</span>
                                    </div>
                                    {exam.num_attempts > 0 && (
                                        <>
                                            <div className="flex items-center gap-2">
                                                <TrendingUp className="h-4 w-4" />
                                                <span>Avg: {exam.avg_score}%</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Star className="h-4 w-4" />
                                                <span>Pass: {exam.pass_rate}%</span>
                                            </div>
                                        </>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        <span>{formatDate(exam.created_at)}</span>
                                    </div>
                                </div>

                                <Button
                                    onClick={() => handleTakeExam(exam.id)}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                                >
                                    Take Exam
                                </Button>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Exam Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Practice Exam</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div>
                            <label className="text-sm font-medium mb-3 block">Difficulty</label>
                            <div className="flex gap-2">
                                {['easy', 'medium', 'hard'].map((diff) => (
                                    <Button
                                        key={diff}
                                        variant={selectedDifficulty === diff ? 'default' : 'outline'}
                                        onClick={() => setSelectedDifficulty(diff)}
                                        className="flex-1 capitalize"
                                    >
                                        {diff}
                                    </Button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-3 block">Number of Questions</label>
                            <div className="flex gap-2">
                                {[5, 10, 15].map((num) => (
                                    <Button
                                        key={num}
                                        variant={selectedNumQuestions === num ? 'default' : 'outline'}
                                        onClick={() => setSelectedNumQuestions(num)}
                                        className="flex-1"
                                    >
                                        {num}
                                    </Button>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreateExam}
                                disabled={creating}
                                className="bg-indigo-600 hover:bg-indigo-700"
                            >
                                {creating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Brain className="mr-2 h-4 w-4" />
                                        Generate Exam
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </main>
    )
}
