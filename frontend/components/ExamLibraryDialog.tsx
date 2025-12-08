'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Brain, Plus, Users, Calendar, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Exam {
    id: string
    difficulty: string
    num_questions: number
    duration_minutes: number
    num_attempts: number
    created_by: string
    created_at: string
    is_mine: boolean
}

interface ExamLibraryDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    topicId: string
    courseId: string
}

export function ExamLibraryDialog({ open, onOpenChange, topicId, courseId }: ExamLibraryDialogProps) {
    const router = useRouter()
    const [exams, setExams] = useState<Exam[]>([])
    const [loading, setLoading] = useState(false)
    const [filter, setFilter] = useState<string>('all')
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [creating, setCreating] = useState(false)
    const [selectedDifficulty, setSelectedDifficulty] = useState('medium')
    const [selectedNumQuestions, setSelectedNumQuestions] = useState(10)

    useEffect(() => {
        if (open) {
            fetchExams()
        }
    }, [open, filter])

    const fetchExams = async () => {
        setLoading(true)
        try {
            const url = filter === 'all'
                ? `http://localhost:8000/exams/topics/${topicId}/exams`
                : `http://localhost:8000/exams/topics/${topicId}/exams?difficulty=${filter}`

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

            if (!response.ok) throw new Error('Failed to create exam')

            const exam = await response.json()
            setShowCreateDialog(false)
            onOpenChange(false)
            router.push(`/learn/courses/${courseId}/topics/${topicId}/exam/${exam.id}`)
        } catch (error) {
            console.error('Error creating exam:', error)
            alert('Failed to create exam')
        } finally {
            setCreating(false)
        }
    }

    const handleTakeExam = (examId: string) => {
        onOpenChange(false)
        router.push(`/learn/courses/${courseId}/topics/${topicId}/exam/${examId}`)
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

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Brain className="h-5 w-5" />
                            Practice Exam Library
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto">
                        {/* Create Button */}
                        <Button
                            onClick={() => setShowCreateDialog(true)}
                            className="w-full mb-4 bg-indigo-600 hover:bg-indigo-700"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Create New Exam
                        </Button>

                        {/* Filters */}
                        <div className="flex gap-2 mb-4">
                            <Button
                                variant={filter === 'all' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilter('all')}
                            >
                                All
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
                        </div>

                        {/* Exam List */}
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                            </div>
                        ) : exams.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p>No exams available yet</p>
                                <p className="text-sm">Be the first to create one!</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {exams.map((exam) => (
                                    <div
                                        key={exam.id}
                                        className="border rounded-lg p-4 hover:border-indigo-300 transition-colors"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <Badge className={getDifficultyColor(exam.difficulty)}>
                                                    {exam.difficulty}
                                                </Badge>
                                                <span className="text-sm font-medium">
                                                    {exam.num_questions} questions
                                                </span>
                                                {exam.is_mine && (
                                                    <Badge variant="outline" className="text-xs">
                                                        Your exam
                                                    </Badge>
                                                )}
                                            </div>
                                            <Button
                                                size="sm"
                                                onClick={() => handleTakeExam(exam.id)}
                                                className="bg-indigo-600 hover:bg-indigo-700"
                                            >
                                                Take Exam
                                            </Button>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-slate-600">
                                            <span className="flex items-center gap-1">
                                                <Users className="h-4 w-4" />
                                                {exam.created_by}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Brain className="h-4 w-4" />
                                                {exam.num_attempts} attempts
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-4 w-4" />
                                                {formatDate(exam.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

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
        </>
    )
}
