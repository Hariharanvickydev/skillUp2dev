"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { getSyncStatus, syncCourse, getCourse } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, RefreshCw, CheckCircle, AlertCircle, ArrowRight, GitPullRequest, Eye, FileText, Loader2, Save } from "lucide-react"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkBreaks from "remark-breaks"
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { toast } from "sonner"
import { cn } from "@/lib/utils"

import * as Diff from 'diff'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { updateTopicContent } from "@/lib/api"
import { Textarea } from "@/components/ui/textarea"

export default function CourseSyncPage() {
    const params = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()
    const typeFilter = searchParams.get('type')
    const courseId = params.id as string

    const [course, setCourse] = useState<any>(null)
    const [updates, setUpdates] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [syncing, setSyncing] = useState(false)
    const [selectedUpdate, setSelectedUpdate] = useState<any>(null)
    const [statusMessage, setStatusMessage] = useState("")
    const [compareMode, setCompareMode] = useState<"visual" | "source" | "smart">("visual")

    // Manual Merge State
    const [isEditing, setIsEditing] = useState(false)
    const [manualContent, setManualContent] = useState("")

    useEffect(() => {
        loadData()
    }, [courseId, typeFilter])

    useEffect(() => {
        if (selectedUpdate) {
            setManualContent(selectedUpdate.local_content || "")
            setIsEditing(false)

            // Default View Logic:
            const isQuestion = !!selectedUpdate.library_question;

            if (isQuestion) {
                setCompareMode("visual")
            } else if (selectedUpdate.local_content && selectedUpdate.local_content.trim().length > 0) {
                setCompareMode("visual")
            } else {
                setCompareMode("source")
            }
        }
    }, [selectedUpdate])

    const loadData = async () => {
        try {
            const [courseData, syncData] = await Promise.all([
                getCourse(courseId),
                getSyncStatus(courseId)
            ])
            setCourse(courseData)
            // Filter updates based on type params
            let filteredUpdates = syncData.updates || []
            if (typeFilter === 'QUESTION') {
                filteredUpdates = filteredUpdates.filter((u: any) => !!u.library_question)
            } else if (typeFilter === 'TOPIC') {
                filteredUpdates = filteredUpdates.filter((u: any) => !!u.library_topic)
            }

            setUpdates(filteredUpdates)
            setStatusMessage(syncData.message)

            // Select first update if available
            if (filteredUpdates.length > 0) {
                // Determine initial selection if not already set
                if (!selectedUpdate) {
                    setSelectedUpdate(filteredUpdates[0])
                }
            }
        } catch (e) {
            toast.error("Failed to load sync status")
        } finally {
            setLoading(false)
        }
    }

    const handleSyncItem = async (update: any, action: 'OVERWRITE' | 'CREATE' | 'IGNORE') => {
        setSyncing(true)
        try {
            const isQuestion = !!update.library_question
            const payload = isQuestion
                ? { library_question_id: update.library_question.id, action, library_topic_id: null }
                : { library_topic_id: update.library_topic.id, action, library_question_id: null }

            await syncCourse(courseId, [payload])

            toast.success("Update applied successfully")

            // Remove from list locally for instant feedback
            // For questions, match by question id. For topics, match by topic id.
            const remaining = updates.filter(u => {
                if (isQuestion) return u.library_question?.id !== update.library_question.id
                return u.library_topic?.id !== update.library_topic.id
            })
            setUpdates(remaining)

            if (selectedUpdate) {
                const currentId = isQuestion ? selectedUpdate.library_question?.id : selectedUpdate.library_topic?.id;
                const updateId = isQuestion ? update.library_question.id : update.library_topic.id;

                if (currentId === updateId) {
                    setSelectedUpdate(remaining.length > 0 ? remaining[0] : null)
                }
            }

        } catch (e) {
            console.error(e)
            toast.error("Failed to sync item")
        } finally {
            setSyncing(false)
        }
    }

    const handleSaveManualMerge = async () => {
        if (!selectedUpdate?.local_topic?.id) return
        setSyncing(true)
        try {
            await updateTopicContent(selectedUpdate.local_topic.id, manualContent)
            toast.success("Manual changes saved")
            setIsEditing(false)
            // Reload to refresh diffs
            loadData()
            setCompareMode("visual") // Switch to full view after save
        } catch (e) {
            toast.error("Failed to save changes")
        } finally {
            setSyncing(false)
        }
    }

    const RenderPreview = ({ content, title }: { content: string, title: string }) => (
        <div className="flex-1 flex flex-col overflow-hidden bg-white border rounded-lg shadow-sm">
            <div className="px-4 py-2 border-b bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider flex justify-between items-center">
                <span>{title}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-6 relative">
                {/* Visual indicator for empty content */}
                {!content && (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm italic">
                        No Content
                    </div>
                )}
                <article className="prose prose-slate prose-sm max-w-none">
                    <Markdown
                        remarkPlugins={[remarkGfm, remarkBreaks]}
                        components={{
                            h1: ({ ...props }) => <h1 className="text-2xl font-bold text-slate-900 mt-0 mb-3 border-b pb-2" {...props} />,
                            h2: ({ ...props }) => <h2 className="text-xl font-bold text-slate-800 mt-6 mb-3" {...props} />,
                            ul: ({ ...props }) => <ul className="list-disc pl-5 space-y-1 mb-3 text-slate-700" {...props} />,
                            ol: ({ ...props }) => <ol className="list-decimal pl-5 space-y-1 mb-3 text-slate-700" {...props} />,
                            li: ({ ...props }) => <li className="pl-1" {...props} />,
                            blockquote: ({ ...props }) => <blockquote className="border-l-4 border-indigo-500 bg-indigo-50 pl-4 py-2 my-3 italic text-slate-700 rounded-r" {...props} />,
                            code({ inline, className, children, ...props }: any) {
                                const match = /language-(\w+)/.exec(className || '')
                                return !inline && match ? (
                                    <div className="rounded-md overflow-hidden my-4 border border-slate-200">
                                        <div className="bg-slate-800 text-slate-300 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider border-b border-slate-700">
                                            {match[1]}
                                        </div>
                                        <SyntaxHighlighter
                                            style={vscDarkPlus}
                                            language={match[1]}
                                            PreTag="div"
                                            customStyle={{ margin: 0, borderRadius: 0, fontSize: '12px' }}
                                        >
                                            {String(children).replace(/\n$/, '')}
                                        </SyntaxHighlighter>
                                    </div>
                                ) : (
                                    <code className="bg-slate-100 text-indigo-600 px-1 py-0.5 rounded font-mono text-xs font-semibold" {...props}>
                                        {children}
                                    </code>
                                )
                            }
                        }}
                    >
                        {content ? content.replace(/\n{3,}/g, (match) => '\n\n' + '&nbsp;\n'.repeat(match.length - 2)) : ""}
                    </Markdown>
                </article>
            </div>
        </div>
    )

    const RenderQuestionPreview = ({ questionData, title }: { questionData: any, title: string }) => {
        // Parse if string
        let q = questionData;
        if (typeof questionData === 'string') {
            try {
                q = JSON.parse(questionData)
            } catch (e) {
                // Fallback for raw strings (titles etc)
                q = { question: questionData }
            }
        }

        if (!q) return <RenderPreview content="No Content" title={title} />

        return (
            <div className="flex-1 flex flex-col overflow-hidden bg-white border rounded-lg shadow-sm">
                <div className="px-4 py-2 border-b bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider flex justify-between items-center">
                    <span>{title}</span>
                    <Badge variant="outline" className="text-[10px] h-5">{q.type || 'QUESTION'}</Badge>
                </div>
                <div className="flex-1 overflow-y-auto p-6 relative space-y-6">
                    <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Question</h4>
                        <div className="prose prose-sm max-w-none text-slate-900 font-medium">
                            {q.question || "No Question Text"}
                        </div>
                    </div>

                    {q.options && q.options.length > 0 && (
                        <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Options</h4>
                            <ul className="space-y-2">
                                {q.options.map((opt: string, i: number) => (
                                    <li key={i} className={cn("p-3 rounded-lg border text-sm flex items-start gap-3",
                                        opt === q.correct_answer ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200"
                                    )}>
                                        <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-white border text-[10px] font-bold text-slate-500">
                                            {String.fromCharCode(65 + i)}
                                        </span>
                                        <span className={cn(opt === q.correct_answer ? "text-emerald-900 font-medium" : "text-slate-700")}>
                                            {opt}
                                        </span>
                                        {opt === q.correct_answer && <CheckCircle className="h-4 w-4 text-emerald-600 ml-auto shrink-0" />}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {q.explanation && (
                        <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Explanation</h4>
                            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 text-sm text-indigo-900">
                                {q.explanation}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    const AndroidStudioDiffViewer = ({ oldText, newText }: { oldText: string, newText: string }) => {
        const diff = Diff.diffLines(oldText || "", newText || "")

        // State similar to before: track decisions per chunk
        // default: 'exclude' for additions (don't add), 'include' for deletions (don't delete)
        // ie. keep local state unchanged by default.
        const [decisions, setDecisions] = useState<Record<number, 'accepted' | 'rejected' | 'pending'>>(() => {
            const initial: Record<number, 'accepted' | 'rejected' | 'pending'> = {}
            diff.forEach((part, index) => {
                // For Additions (Green): Pending means "Not yet added". Accepted means "Added".
                // For Deletions (Red): Pending means "Not yet removed". Accepted means "Removed".
                // Let's simplify:
                // We track if the *change* is accepted.
                // Change = Addition -> Accept checks it.
                // Change = Deletion -> Accept checks it (removes it).
                // Default is Pending (No change applied).
                initial[index] = 'pending'
            })
            return initial
        })

        // Helper to get effective content.
        useEffect(() => {
            let content = ""
            diff.forEach((part, index) => {
                const status = decisions[index]
                if (!part.added && !part.removed) {
                    content += part.value
                } else if (part.added) {
                    // Only include if accepted
                    if (status === 'accepted') content += part.value
                } else if (part.removed) {
                    // Only include if NOT accepted (i.e. if rejected/pending, we keep it)
                    // "Accepting" a deletion means confirming the removal.
                    if (status !== 'accepted') content += part.value
                }
            })
            // We only update manualContent/preview internally? 
            // Ideally we sync this to a parent state or ref, but for now we just need the 'save' to calculate it.
        }, [decisions])

        const handleAccept = (index: number) => {
            setDecisions(prev => ({ ...prev, [index]: 'accepted' }))
        }

        const handleReject = (index: number) => {
            setDecisions(prev => ({ ...prev, [index]: 'rejected' })) // Rejected means "Ignored the change"
        }

        const handleUndo = (index: number) => {
            setDecisions(prev => ({ ...prev, [index]: 'pending' }))
        }

        const handleSave = async () => {
            // Calculate final
            let finalContent = ""
            diff.forEach((part, index) => {
                const status = decisions[index] || 'pending'
                if (!part.added && !part.removed) finalContent += part.value
                else if (part.added && status === 'accepted') finalContent += part.value
                else if (part.removed && status !== 'accepted') finalContent += part.value
            })

            if (!selectedUpdate?.local_topic?.id) return
            setSyncing(true)
            try {
                await updateTopicContent(selectedUpdate.local_topic.id, finalContent)
                toast.success("Changes merged successfully")
                loadData()
                setCompareMode("visual") // Switch to visual preview after save
            } catch (e) {
                toast.error("Failed to save changes")
            } finally {
                setSyncing(false)
            }
        }

        return (
            <div className="flex flex-col h-full bg-white border rounded-lg shadow-sm overflow-hidden">
                {/* Header */}
                <div className="px-4 py-2 border-b bg-slate-50 flex justify-between items-center shrink-0">
                    <div className="flex gap-8 text-xs font-bold text-slate-500 uppercase tracking-wider w-full">
                        <span className="flex-1 text-center">Your Result</span>
                        <span className="w-12 text-center"></span>
                        <span className="flex-1 text-center">Library Source</span>
                    </div>
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={handleSave}
                        disabled={syncing}
                        className="h-7 text-xs ml-4"
                    >
                        {syncing ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Save className="w-3 h-3 mr-2" />}
                        Apply Changes
                    </Button>
                </div>

                {/* Diff Area */}
                <div className="flex-1 overflow-y-auto bg-slate-50 relative">
                    {diff.map((part, index) => {
                        const status = decisions[index] || 'pending'

                        if (!part.added && !part.removed) {
                            return (
                                <div key={index} className="flex border-b border-slate-100 last:border-0 hover:bg-slate-100 transition-colors">
                                    <div className="flex-1 p-2 font-mono text-xs text-slate-500 whitespace-pre-wrap break-all opacity-70">
                                        {part.value.replace(/\n$/, '')}
                                    </div>
                                    <div className="w-12 border-x border-slate-200 bg-slate-100"></div>
                                    <div className="flex-1 p-2 font-mono text-xs text-slate-500 whitespace-pre-wrap break-all opacity-70">
                                        {part.value.replace(/\n$/, '')}
                                    </div>
                                </div>
                            )
                        }

                        // For changes:
                        // If it's a DELETION:
                        // Left side has content (RED). Right side is empty.
                        // Middle: 'X' button (to Accept Removal) or 'Ignore' (Keep it).

                        // If it's an ADDITION:
                        // Left side is empty. Right side has content (GREEN).
                        // Middle: '<<' button (to Accept Addition) or 'Ignore'.

                        if (part.removed) {
                            const isRemoved = status === 'accepted'
                            return (
                                <div key={index} className="flex border-b border-slate-100 bg-red-50/50 group">
                                    <div className={cn("flex-1 p-2 font-mono text-xs whitespace-pre-wrap break-all", isRemoved ? "text-slate-300 line-through decoration-slate-300" : "text-red-700 bg-red-100")}>
                                        {part.value.replace(/\n$/, '')}
                                    </div>
                                    <div className="w-12 border-x border-slate-200 bg-slate-100 flex flex-col items-center justify-center gap-1 py-2 z-10">
                                        {status === 'pending' && (
                                            <>
                                                <button onClick={() => handleAccept(index)} className="h-6 w-6 rounded flex items-center justify-center hover:bg-slate-200 text-slate-400 hover:text-red-600 transition-colors" title="Accept Deletion (Remove)">
                                                    <span className="font-bold text-lg leading-none">×</span>
                                                </button>
                                                <button onClick={() => handleReject(index)} className="h-6 w-6 rounded flex items-center justify-center hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors" title="Keep (Ignore Deletion)">
                                                    <ArrowLeft className="w-3 h-3" />
                                                </button>
                                            </>
                                        )}
                                        {status === 'accepted' && (
                                            <button onClick={() => handleUndo(index)} className="text-[10px] text-red-500 font-bold hover:underline">Undo</button>
                                        )}
                                        {status === 'rejected' && (
                                            <span className="text-[10px] text-slate-400">Kept</span>
                                        )}
                                    </div>
                                    <div className="flex-1 p-2 bg-slate-50/50"></div>
                                </div>
                            )
                        }

                        if (part.added) {
                            const isAdded = status === 'accepted'
                            return (
                                <div key={index} className="flex border-b border-slate-100 bg-emerald-50/50 group">
                                    <div className={cn("flex-1 p-2 font-mono text-xs whitespace-pre-wrap break-all", isAdded ? "bg-emerald-100 text-emerald-900" : "bg-slate-50/50")}>
                                        {isAdded && part.value.replace(/\n$/, '')}
                                    </div>
                                    <div className="w-12 border-x border-slate-200 bg-slate-100 flex flex-col items-center justify-center gap-1 py-2 z-10">
                                        {status === 'pending' && (
                                            <>
                                                <button onClick={() => handleAccept(index)} className="h-6 w-6 rounded flex items-center justify-center hover:bg-slate-200 text-slate-400 hover:text-emerald-600 transition-colors" title="Accept Addition">
                                                    <ArrowLeft className="w-3 h-3" />
                                                </button>
                                                <button onClick={() => handleReject(index)} className="h-6 w-6 rounded flex items-center justify-center hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors" title="Ignore Addition">
                                                    <span className="font-bold text-lg leading-none">×</span>
                                                </button>
                                            </>
                                        )}
                                        {status === 'accepted' && (
                                            <button onClick={() => handleUndo(index)} className="text-[10px] text-emerald-500 font-bold hover:underline">Undo</button>
                                        )}
                                        {status === 'rejected' && (
                                            <span className="text-[10px] text-slate-400">Ignored</span>
                                        )}
                                    </div>
                                    <div className="flex-1 p-2 font-mono text-xs text-emerald-700 bg-emerald-100 whitespace-pre-wrap break-all">
                                        {part.value.replace(/\n$/, '')}
                                    </div>
                                </div>
                            )
                        }

                        return null
                    })}
                </div>
            </div>
        )
    }

    const SourceDiffViewer = ({ oldText, newText }: { oldText: string, newText: string }) => {
        const diff = Diff.diffLines(oldText || "", newText || "")

        return (
            <div className="flex-1 flex gap-6 overflow-hidden">
                {/* Left: Local (Old) - Editable or Diff */}
                <div className="flex-1 overflow-hidden bg-white border rounded-lg shadow-sm flex flex-col">
                    <div className="px-4 py-2 border-b bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider flex justify-between items-center">
                        <span>{isEditing ? "Editing Your Version" : "Your Version (Deletions Highlighted)"}</span>
                        {isEditing && <span className="text-[10px] text-indigo-600 animate-pulse">● Editing Mode Active</span>}
                    </div>

                    {isEditing ? (
                        <Textarea
                            className="flex-1 resize-none border-0 p-4 font-mono text-xs leading-relaxed focus-visible:ring-0 rounded-none"
                            value={manualContent}
                            onChange={(e) => setManualContent(e.target.value)}
                            placeholder="Edit your content here..."
                        />
                    ) : (
                        <div className="flex-1 overflow-y-auto p-4 font-mono text-xs leading-relaxed whitespace-pre">
                            {diff.map((part, index) => {
                                if (part.added) return null;
                                const color = part.removed ? 'bg-red-100 text-red-900 block w-full' : 'text-slate-600 block w-full opacity-50';
                                return (
                                    <div key={index} className={color}>
                                        {part.value.replace(/\n$/, '')} {/* Remove trailing newline from diffLines output for cleaner block rendering */}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Right: Library (New) */}
                <div className="flex-1 overflow-hidden bg-white border rounded-lg shadow-sm flex flex-col">
                    <div className="px-4 py-2 border-b bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Library Version (Additions Highlighted)
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 font-mono text-xs leading-relaxed whitespace-pre">
                        {diff.map((part, index) => {
                            if (part.removed) return null;
                            const color = part.added ? 'bg-emerald-100 text-emerald-900 block w-full' : 'text-slate-600 block w-full opacity-50';
                            return (
                                <div key={index} className={color}>
                                    {part.value.replace(/\n$/, '')}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        )
    }

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>

    if (updates.length === 0) {
        return (
            <div className="flex h-screen flex-col bg-slate-50">
                <header className="h-16 bg-white border-b flex items-center px-6 sticky top-0">
                    <Button variant="ghost" onClick={() => router.push(`/org/courses/${courseId}`)}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Course
                    </Button>
                </header>
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-4">
                    <CheckCircle className="h-16 w-16 text-emerald-500" />
                    <h2 className="text-2xl font-bold text-slate-900">Up to Date!</h2>
                    <p>Your course is perfectly synced with the library.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
            <header className="h-16 bg-white border-b flex items-center justify-between px-6 shrink-0 z-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push(`/org/courses/${courseId}`)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-lg font-bold text-slate-900">Sync Updates</h1>
                        <p className="text-xs text-slate-500">{updates.length} updates available for {course?.title}</p>
                    </div>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* List of Updates */}
                <div className="w-80 border-r border-slate-200 bg-white flex flex-col z-10">
                    <div className="p-4 border-b bg-slate-50">
                        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Available Updates</h2>
                    </div>
                    <ScrollArea className="flex-1">
                        <div className="divide-y divide-slate-100">
                            {updates.map((update) => {
                                const isQuestion = !!update.library_question;
                                const title = isQuestion ? update.library_question.title : update.library_topic.title;
                                const id = isQuestion ? update.library_question.id : update.library_topic.id;

                                return (
                                    <button
                                        key={id}
                                        onClick={() => setSelectedUpdate(update)}
                                        className={cn(
                                            "w-full text-left p-4 hover:bg-slate-50 transition-colors relative flex flex-col gap-1",
                                            selectedUpdate === update ? "bg-indigo-50 hover:bg-indigo-50 ring-inset ring-2 ring-indigo-500" : ""
                                        )}
                                    >
                                        <div className="flex justify-between items-start w-full">
                                            <h4 className={cn("font-medium text-sm line-clamp-1", selectedUpdate === update ? "text-indigo-900" : "text-slate-900")}>
                                                {title}
                                            </h4>
                                            {update.type === 'NEW' ? (
                                                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-[10px] h-5 px-1.5 border-0">NEW</Badge>
                                            ) : (
                                                <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-[10px] h-5 px-1.5 border-0">UPDATE</Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            {isQuestion && <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-700 font-bold border border-blue-200">Q</span>}
                                            <p className="text-xs text-slate-500 line-clamp-1">{update.message}</p>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </ScrollArea>
                </div>

                {/* Comparison View */}
                <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
                    {selectedUpdate ? (
                        <>
                            {/* Comparison Header */}
                            <div className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm z-10">
                                <div className="flex items-center gap-4">
                                    <div>
                                        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                            <GitPullRequest className="h-4 w-4 text-indigo-500" />
                                            Reviewing: {selectedUpdate.library_question ? selectedUpdate.library_question.title : selectedUpdate.library_topic.title}
                                        </h2>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            comparing local vs. library version
                                        </p>
                                    </div>

                                    {selectedUpdate.library_question ? (
                                        <div className="bg-slate-100/50 px-3 py-1.5 rounded-md text-xs font-semibold text-slate-500 uppercase tracking-wider border border-slate-200">
                                            Visual Preview
                                        </div>
                                    ) : (
                                        <Tabs value={compareMode} onValueChange={(v: any) => setCompareMode(v)} className="w-[400px]">
                                            <TabsList className="grid w-full grid-cols-2">
                                                <TabsTrigger value="visual">Visual Preview</TabsTrigger>
                                                <TabsTrigger value="source">Source Comparison</TabsTrigger>
                                            </TabsList>
                                        </Tabs>
                                    )}
                                </div>


                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" onClick={() => handleSyncItem(selectedUpdate, 'IGNORE')}>
                                        Ignore
                                    </Button>
                                    <Button
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100"
                                        onClick={() => handleSyncItem(selectedUpdate, selectedUpdate.type === 'NEW' ? 'CREATE' : 'OVERWRITE')}
                                        disabled={syncing}
                                    >
                                        {syncing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                                        {selectedUpdate.type === 'NEW' ? (selectedUpdate.library_question ? "Add Question" : "Add Topic") : "Accept & Sync"}
                                    </Button>
                                </div>
                            </div>

                            {/* Diff Content */}
                            <div className="flex-1 p-6 flex gap-6 overflow-hidden">
                                {compareMode === 'visual' ? (
                                    <>
                                        {selectedUpdate.library_question ? (
                                            /* For Questions, show only the proposed library version (Single Card View) */
                                            <RenderQuestionPreview
                                                title="Question Content"
                                                questionData={selectedUpdate.library_content || selectedUpdate.library_question.content}
                                            />
                                        ) : (
                                            /* For Topics, show comparison */
                                            <>
                                                <RenderPreview
                                                    title="Current Local Version"
                                                    content={selectedUpdate.local_content || ""}
                                                />

                                                <div className="flex items-center justify-center flex-col gap-2 text-slate-300">
                                                    <div className="h-px w-px bg-current flex-1"></div>
                                                    <ArrowRight className="h-6 w-6" />
                                                    <div className="h-px w-px bg-current flex-1"></div>
                                                </div>

                                                <RenderPreview
                                                    title="Latest Library Version"
                                                    content={selectedUpdate.library_content || selectedUpdate.library_topic?.description || "No Content"}
                                                />
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <AndroidStudioDiffViewer
                                        oldText={selectedUpdate.local_content || ""}
                                        newText={
                                            selectedUpdate.library_content ||
                                            (selectedUpdate.library_question ? JSON.stringify(selectedUpdate.library_question.content, null, 2) : "") ||
                                            selectedUpdate.library_topic?.description ||
                                            ""
                                        }
                                    />
                                )}
                            </div>

                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-400">
                            Select an update to review
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
