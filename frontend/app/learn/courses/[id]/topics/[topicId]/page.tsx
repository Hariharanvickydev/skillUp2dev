'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, Loader2, Brain, CheckCircle2, Circle } from 'lucide-react'
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { toast } from "sonner"

export default function TopicContentPage() {
    const params = useParams()
    const router = useRouter()
    const courseId = params.id as string
    const topicId = params.topicId as string

    const [topic, setTopic] = useState<any>(null)
    const [course, setCourse] = useState<any>(null)
    const [content, setContent] = useState<string>('')
    const [loading, setLoading] = useState(true)
    const [isCompleted, setIsCompleted] = useState(false)
    const [completionLoading, setCompletionLoading] = useState(false)

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

            // Fetch content
            const contentRes = await fetch(`http://localhost:8000/topics/${topicId}/content`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            })
            const contentData = await contentRes.json()
            setContent(contentData.content || '')

            // Fetch completion status
            const progressRes = await fetch(`http://localhost:8000/progress/courses/${courseId}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            })
            const progressData = await progressRes.json()
            const topicProgress = progressData.find((p: any) => p.topic_id === topicId)
            setIsCompleted(topicProgress?.completed || false)
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleToggleComplete = async () => {
        setCompletionLoading(true)
        try {
            if (isCompleted) {
                // Unmark as complete
                await fetch(`http://localhost:8000/progress/topics/${topicId}/complete`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                })
                setIsCompleted(false)
            } else {
                // Mark as complete
                await fetch(`http://localhost:8000/progress/topics/${topicId}/complete`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                })
                setIsCompleted(true)
            }
        } catch (error) {
            console.error('Error toggling completion:', error)
            toast.error('Failed to update completion status')
        } finally {
            setCompletionLoading(false)
        }
    }

    const handleExportPDF = async () => {
        if (!topic || !content) return

        try {
            const element = document.querySelector('.prose')
            if (!element) {
                toast.error('Content not found')
                return
            }

            const styles = Array.from(document.styleSheets)
                .map(styleSheet => {
                    try {
                        return Array.from(styleSheet.cssRules)
                            .map(rule => rule.cssText)
                            .join('\n')
                    } catch (e) {
                        return ''
                    }
                })
                .join('\n')

            const htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>${topic.title} - SkillUp2Dev</title>
                    <style>
                        ${styles}
                        body {
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            line-height: 1.6;
                            color: #1e293b;
                            max-width: 800px;
                            margin: 0 auto;
                            padding: 40px 20px;
                        }
                        .header {
                            margin-bottom: 40px;
                            padding-bottom: 20px;
                            border-bottom: 2px solid #e2e8f0;
                        }
                        .header h1 {
                            margin: 0 0 10px 0;
                            color: #0f172a;
                            font-size: 32px;
                        }
                        .meta {
                            color: #64748b;
                            font-size: 14px;
                            margin: 5px 0;
                        }
                        .footer {
                            margin-top: 60px;
                            padding-top: 20px;
                            border-top: 1px solid #e2e8f0;
                            text-align: center;
                            color: #64748b;
                            font-size: 12px;
                        }
                        @media print {
                            body { 
                                margin: 20mm;
                                padding: 0;
                            }
                            @page { 
                                size: A4;
                                margin: 0;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>${topic.title}</h1>
                        <div class="meta"><strong>Course:</strong> ${course.title}</div>
                        <div class="meta"><strong>Author:</strong> SkillUp2Dev</div>
                        <div class="meta"><strong>Generated:</strong> ${new Date().toLocaleDateString()}</div>
                    </div>
                    <div class="content">
                        ${element.innerHTML}
                    </div>
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} SkillUp2Dev - All Rights Reserved</p>
                    </div>
                </body>
                </html>
            `

            const blob = new Blob([htmlContent], { type: 'text/html' })
            const url = URL.createObjectURL(blob)
            const printWindow = window.open(url, '_blank')

            if (!printWindow) {
                toast.error('Please allow popups to export PDF')
                URL.revokeObjectURL(url)
                return
            }

            printWindow.onload = () => {
                setTimeout(() => {
                    printWindow.print()
                }, 500)
            }
        } catch (error) {
            console.error('Error exporting PDF:', error)
            toast.error('Failed to export PDF')
        }
    }

    if (loading) return <div className="p-4 sm:p-8 md:p-12">Loading...</div>
    if (!topic || !course) return <div className="p-4 sm:p-8 md:p-12">Topic not found</div>

    return (
        <main className="flex min-h-screen flex-col bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-start gap-2 sm:gap-3 mb-3 sm:mb-0">
                        <Button variant="ghost" size="icon" onClick={() => router.push(`/learn/courses/${courseId}`)} className="flex-shrink-0 mt-1">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 break-words leading-tight">{topic.title}</h1>
                            <p className="text-xs sm:text-sm text-slate-500 truncate">{course.title}</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3 sm:mt-0 sm:absolute sm:right-4 sm:top-3">
                        <Button
                            size="sm"
                            onClick={handleToggleComplete}
                            disabled={completionLoading}
                            className="bg-green-600 hover:bg-green-700 text-white whitespace-nowrap flex-1 sm:flex-none min-h-[44px]"
                        >
                            {completionLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Loading...
                                </>
                            ) : (
                                <span>
                                    {isCompleted ? 'Completed' : 'Mark as Complete'}
                                </span>
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/learn/courses/${courseId}/topics/${topicId}/exams`)}
                            disabled={!content}
                            className="flex-1 sm:flex-none min-h-[44px]"
                        >
                            <Brain className="mr-2 h-4 w-4" />
                            <span className="hidden sm:inline">Practice Exams</span>
                            <span className="sm:hidden">Exams</span>
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleExportPDF} className="flex-1 sm:flex-none min-h-[44px]">
                            <Download className="mr-2 h-4 w-4" />
                            <span className="hidden sm:inline">Export PDF</span>
                            <span className="sm:hidden">PDF</span>
                        </Button>
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8">
                {content ? (
                    <article className="prose prose-slate prose-sm sm:prose-lg max-w-none bg-white rounded-lg shadow-sm p-6 sm:p-8">
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
                            {content}
                        </Markdown>
                    </article>
                ) : (
                    <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                        <p className="text-slate-500">No content available for this topic</p>
                    </div>
                )}
            </div>
        </main>
    )
}
