'use client'

import { getExamAttempts } from "@/lib/api"

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
    const examId = params.examId as string

    const [exam, setExam] = useState<any>(null)
    const [answers, setAnswers] = useState<number[]>([])
    const [submitted, setSubmitted] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (examId) {
            fetchExam()
        }
    }, [examId])

    useEffect(() => {
        if (submitted && result) {
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }, [submitted, result])

    const fetchExam = async () => {
        try {
            // Parallel fetch: Get Exam Data AND Check for Existing Attempts
            const [examResponseData, attemptsData] = await Promise.all([
                fetch(`http://localhost:8000/exams/${examId}/student`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                }).then(res => {
                    if (!res.ok) throw new Error('Failed to fetch exam')
                    return res.json()
                }),
                getExamAttempts(examId).catch(() => []) // Catch error if attempts fetch fails
            ])

            setExam(examResponseData)

            // Check if there is a previous passing attempt or any attempt for assessment
            const sortedAttempts = attemptsData.sort((a: any, b: any) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )

            if (sortedAttempts.length > 0) {
                const bestAttempt = sortedAttempts.find((a: any) => a.passed) || sortedAttempts[0]

                // If passed or simply viewing results
                if (bestAttempt) {
                    setResult({
                        score: bestAttempt.score,
                        passed: bestAttempt.passed,
                        correct_answers: bestAttempt.answers || [], // Assuming backend returns this, otherwise we might need a richer attempt endpoint
                        explanations: new Array(examResponseData.questions.length).fill("Check detailed review"), // Placeholder if not in attempt
                        attempt_id: bestAttempt.id
                    })
                    setAnswers(bestAttempt.answers || new Array(examResponseData.questions.length).fill(-1))
                    setSubmitted(true)
                }
            } else {
                setAnswers(new Array(examResponseData.questions.length).fill(-1))
            }

        } catch (error: any) {
            console.error('Error fetching exam:', error)
            toast.error(error.message || "Failed to load exam")
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
        if (exam.type === 'PRACTICE') {
            router.push(`/learn/practice`)
            return
        }
        if (returnTo) {
            router.push(returnTo)
        } else {
            router.push(`/learn/assessments`)
        }
    }

    const handleTryAgain = () => {
        // Reload page to start fresh attempt logic (backend allows multiple if practice)
        // Or redirect to practice library to start new
        if (exam.type === 'PRACTICE') {
            // Reload to same exam ID for retry (assuming backend supports it)
            // OR: router.push('/learn/practice') 
            // "Try Again" usually implies retaking SAME content.
            window.location.reload()
        }
    }

    if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
    if (!exam) return <div className="p-8 text-center text-slate-500">Exam not found</div>

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
                            <h1 className="text-lg sm:text-xl font-bold text-slate-900">
                                {exam.title || (exam.scope === 'COURSE' ? 'Full Course Exam' : exam.scope === 'MODULE' ? 'Module Exam' : 'Assessment')}
                            </h1>
                            <p className="text-sm text-slate-500">
                                {exam.difficulty} • {exam.questions.length} questions
                            </p>
                        </div>
                    </div>
                    {!submitted && (
                        <div className="text-sm text-slate-600 font-medium bg-slate-100 px-3 py-1 rounded-full">
                            {answers.filter(a => a !== -1).length} / {exam.questions.length} Answered
                        </div>
                    )}
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8">
                {!submitted ? (
                    <div className="space-y-6">
                        {exam.questions.map((q: any, qIndex: number) => (
                            <Card key={qIndex} className="p-6 border-slate-200 shadow-sm">
                                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-start gap-3">
                                    <span className="bg-indigo-100 text-indigo-700 w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 mt-0.5">
                                        {qIndex + 1}
                                    </span>
                                    <span>{q.question}</span>
                                </h3>

                                <div className="space-y-3 pl-11">
                                    {q.options.map((option: string, oIndex: number) => (
                                        <button
                                            key={oIndex}
                                            onClick={() => handleAnswerSelect(qIndex, oIndex)}
                                            className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${answers[qIndex] === oIndex
                                                ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-sm'
                                                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${answers[qIndex] === oIndex ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'
                                                    }`}>
                                                    {answers[qIndex] === oIndex && <div className="w-2 h-2 rounded-full bg-white" />}
                                                </div>
                                                {option}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </Card>
                        ))}

                        <div className="flex justify-end gap-3 pt-6 border-t">
                            <Button variant="outline" size="lg" onClick={handleBack}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={submitting || answers.includes(-1)}
                                className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                                size="lg"
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
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Results Summary */}
                        <Card className="p-10 text-center border-none shadow-xl bg-gradient-to-b from-white to-slate-50">
                            <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-6 shadow-inner ${result.passed ? 'bg-green-100' : 'bg-red-100'
                                }`}>
                                {result.passed ? (
                                    <CheckCircle className="h-12 w-12 text-green-600" />
                                ) : (
                                    <XCircle className="h-12 w-12 text-red-600" />
                                )}
                            </div>
                            <h2 className="text-5xl font-bold text-slate-900 mb-2 tracking-tight">
                                {result.score}%
                            </h2>
                            <p className={`text-lg font-medium mb-8 ${result.passed ? 'text-green-600' : 'text-red-500'}`}>
                                {result.passed ? 'Excellent Work! Assessment Passed.' : 'Not quite there yet. Keep practicing!'}
                            </p>

                            <div className="flex gap-4 justify-center">
                                <Button variant="outline" size="lg" className="min-w-[140px]" onClick={handleBack}>
                                    {exam.type === 'PRACTICE' ? 'Back to Library' : 'Back to List'}
                                </Button>
                                {exam.type === 'PRACTICE' && (
                                    <Button size="lg" className="min-w-[140px] bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200" onClick={handleTryAgain}>
                                        Practice Again
                                    </Button>
                                )}
                            </div>
                        </Card>

                        {/* Detailed Results */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between pb-2 border-b">
                                <h3 className="text-xl font-bold text-slate-900">Detailed Review</h3>
                                <span className="text-sm text-slate-500">Review your answers and explanations</span>
                            </div>

                            {exam.questions.map((q: any, qIndex: number) => {
                                const userAnswer = answers[qIndex]
                                const correctAnswer = result.correct_answers[qIndex]
                                const isCorrect = userAnswer === correctAnswer

                                return (
                                    <Card key={qIndex} className={`p-6 border-l-4 ${isCorrect ? 'border-l-green-500' : 'border-l-red-500'}`}>
                                        <div className="flex items-start gap-4 mb-5">
                                            {isCorrect ? (
                                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                                </div>
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                                    <XCircle className="h-5 w-5 text-red-600" />
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-slate-900 mb-2 text-lg">
                                                    Question {qIndex + 1}
                                                </h4>
                                                <p className="text-slate-700 leading-relaxed">{q.question}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-3 mb-5 pl-12">
                                            {q.options.map((option: string, oIndex: number) => {
                                                const isUserAnswer = userAnswer === oIndex
                                                const isCorrectOption = correctAnswer === oIndex

                                                let itemClass = "p-4 rounded-xl border transition-all flex justify-between items-center"
                                                if (isCorrectOption) itemClass += " bg-green-50 border-green-200 text-green-900"
                                                else if (isUserAnswer) itemClass += " bg-red-50 border-red-200 text-red-900"
                                                else itemClass += " border-slate-100 text-slate-600"

                                                return (
                                                    <div key={oIndex} className={itemClass}>
                                                        <span className="font-medium">{option}</span>
                                                        {isCorrectOption && <span className="text-green-600 text-xs font-bold uppercase tracking-wider bg-white/50 px-2 py-1 rounded">Correct Answer</span>}
                                                        {isUserAnswer && !isCorrectOption && <span className="text-red-600 text-xs font-bold uppercase tracking-wider bg-white/50 px-2 py-1 rounded">Your Answer</span>}
                                                    </div>
                                                )
                                            })}
                                        </div>

                                        <div className="ml-12 bg-blue-50/50 border border-blue-100 rounded-xl p-5">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                                                <p className="text-sm font-bold text-blue-900 uppercase tracking-wide">Explanation</p>
                                            </div>
                                            <p className="text-slate-700 text-sm leading-relaxed">{result.explanations[qIndex]}</p>
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
