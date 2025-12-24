'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { toast } from "sonner"

export default function ExamPage() {
    const params = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()
    const returnTo = searchParams.get('returnTo')

    const courseId = params.id as string
    const topicId = params.topicId as string
    const examId = params.examId as string

    const [exam, setExam] = useState<any>(null)
    const [answers, setAnswers] = useState<number[]>([])
    const [submitted, setSubmitted] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        fetchExam()
    }, [examId])

    // Scroll to top when results are shown
    useEffect(() => {
        if (submitted && result) {
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }, [submitted, result])

    const fetchExam = async () => {
        try {
            const response = await fetch(`http://localhost:8000/exams/topics/${topicId}/exam`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            })
            const data = await response.json()
            setExam(data)
            setAnswers(new Array(data.questions.length).fill(-1))
        } catch (error) {
            console.error('Error fetching exam:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAnswerSelect = (questionIndex: number, optionIndex: number) => {
        const newAnswers = [...answers]
        newAnswers[questionIndex] = optionIndex
        setAnswers(newAnswers)
    }

    const handleSubmit = async () => {
        if (answers.includes(-1)) {
            toast.error('Please answer all questions before submitting')
            return
        }

        setSubmitting(true)
        try {
            const response = await fetch(`http://localhost:8000/exams/practice-exams/${examId}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ answers })
            })

            const data = await response.json()
            setResult(data)
            setSubmitted(true)
        } catch (error) {
            console.error('Error submitting exam:', error)
            toast.error('Failed to submit exam')
        } finally {
            setSubmitting(false)
        }
    }

    const handleBack = () => {
        if (returnTo) {
            router.push(returnTo)
        } else {
            router.push(`/learn/courses/${courseId}/topics/${topicId}/exams`)
        }
    }

    if (loading) return <div className="p-4 sm:p-8 md:p-12">Loading exam...</div>
    if (!exam) return <div className="p-4 sm:p-8 md:p-12">Exam not found</div>

    return (
        <main className="flex min-h-screen flex-col bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={handleBack}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-lg sm:text-xl font-bold text-slate-900">Practice Exam</h1>
                            <p className="text-sm text-slate-500">{exam.difficulty} • {exam.questions.length} questions</p>
                        </div>
                    </div>
                    {!submitted && (
                        <div className="text-sm text-slate-600">
                            {answers.filter(a => a !== -1).length} / {exam.questions.length} answered
                        </div>
                    )}
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8">
                {!submitted ? (
                    <div className="space-y-6">
                        {exam.questions.map((q: any, qIndex: number) => (
                            <Card key={qIndex} className="p-6">
                                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                                    Question {qIndex + 1}
                                </h3>
                                <p className="text-slate-700 mb-4">{q.question}</p>
                                <div className="space-y-2">
                                    {q.options.map((option: string, oIndex: number) => (
                                        <button
                                            key={oIndex}
                                            onClick={() => handleAnswerSelect(qIndex, oIndex)}
                                            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${answers[qIndex] === oIndex
                                                ? 'border-indigo-600 bg-indigo-50'
                                                : 'border-slate-200 hover:border-slate-300'
                                                }`}
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                            </Card>
                        ))}

                        <div className="flex justify-end gap-3 pt-4">
                            <Button variant="outline" onClick={handleBack}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={submitting || answers.includes(-1)}
                                className="bg-indigo-600 hover:bg-indigo-700"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    'Submit Exam'
                                )}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Results Summary */}
                        <Card className="p-8 text-center">
                            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${result.passed ? 'bg-green-100' : 'bg-red-100'
                                }`}>
                                {result.passed ? (
                                    <CheckCircle className="h-8 w-8 text-green-600" />
                                ) : (
                                    <XCircle className="h-8 w-8 text-red-600" />
                                )}
                            </div>
                            <h2 className="text-3xl font-bold text-slate-900 mb-2">
                                {result.score}%
                            </h2>
                            <p className="text-slate-600 mb-6">
                                {result.passed ? 'Congratulations! You passed!' : 'Keep practicing!'}
                            </p>
                            <div className="flex gap-3 justify-center">
                                <Button variant="outline" onClick={handleBack}>
                                    Back to Exam List
                                </Button>
                                <Button onClick={() => window.location.reload()} className="bg-indigo-600 hover:bg-indigo-700">
                                    Try Again
                                </Button>
                            </div>
                        </Card>

                        {/* Detailed Results */}
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-slate-900">Review Answers</h3>
                            {exam.questions.map((q: any, qIndex: number) => {
                                const userAnswer = answers[qIndex]
                                const correctAnswer = result.correct_answers[qIndex]
                                const isCorrect = userAnswer === correctAnswer

                                return (
                                    <Card key={qIndex} className="p-6">
                                        <div className="flex items-start gap-3 mb-4">
                                            {isCorrect ? (
                                                <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                                            ) : (
                                                <XCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
                                            )}
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-slate-900 mb-2">
                                                    Question {qIndex + 1}
                                                </h4>
                                                <p className="text-slate-700 mb-4">{q.question}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-2 mb-4">
                                            {q.options.map((option: string, oIndex: number) => {
                                                const isUserAnswer = userAnswer === oIndex
                                                const isCorrectOption = correctAnswer === oIndex

                                                return (
                                                    <div
                                                        key={oIndex}
                                                        className={`p-3 rounded-lg border-2 ${isCorrectOption
                                                            ? 'border-green-500 bg-green-50'
                                                            : isUserAnswer
                                                                ? 'border-red-500 bg-red-50'
                                                                : 'border-slate-200'
                                                            }`}
                                                    >
                                                        {option}
                                                        {isCorrectOption && <span className="ml-2 text-green-600 font-semibold">✓ Correct</span>}
                                                        {isUserAnswer && !isCorrectOption && <span className="ml-2 text-red-600 font-semibold">✗ Your answer</span>}
                                                    </div>
                                                )
                                            })}
                                        </div>

                                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                                            <p className="text-sm font-semibold text-blue-900 mb-1">Explanation:</p>
                                            <p className="text-sm text-blue-800">{result.explanations[qIndex]}</p>
                                        </div>
                                    </Card>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>
        </main>
    )
}
