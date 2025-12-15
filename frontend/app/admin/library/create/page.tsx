"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createCourse } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardFooter } from "@/components/ui/card"
import { Loader2, ArrowRight, BookOpen, Layers, Target, Wand2, Sparkles, Check } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function CreateLibraryCoursePage() {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [mounted, setMounted] = useState(false)

    // Form State
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        category: "",
        difficulty: "Beginner",
        outcomes: [] as string[]
    })

    // Quick outcomes input
    const [currentOutcome, setCurrentOutcome] = useState("")

    useEffect(() => {
        setMounted(true)
    }, [])

    const handleOutcomeAdd = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && currentOutcome.trim()) {
            e.preventDefault()
            setFormData(prev => ({ ...prev, outcomes: [...prev.outcomes, currentOutcome.trim()] }))
            setCurrentOutcome("")
        }
    }

    const removeOutcome = (index: number) => {
        setFormData(prev => ({ ...prev, outcomes: prev.outcomes.filter((_, i) => i !== index) }))
    }

    const handleSubmit = async () => {
        setLoading(true)
        try {
            const payload = {
                ...formData,
                is_library_course: true,
                settings: {},
                tags: []
            }

            // @ts-ignore
            const newCourse = await createCourse(payload)

            toast.success("Library Course Created Successfully!")
            router.push(`/admin/library/${newCourse.id}`)

        } catch (e) {
            console.error(e)
            toast.error("Failed to create course")
        } finally {
            setLoading(false)
        }
    }

    if (!mounted) return null

    return (
        <div className="max-w-7xl mx-auto p-8 lg:p-12 space-y-10 pb-20">
            {/* Header Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 p-8 text-white shadow-2xl shadow-indigo-900/20">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-80 w-80 rounded-full bg-purple-500/20 blur-3xl"></div>

                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold backdrop-blur-md">
                                <Sparkles className="h-3.5 w-3.5" /> AI-Powered Curriculum Designer
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight text-white">Create Master Course</h1>
                            <p className="text-indigo-200 text-lg max-w-2xl font-light">
                                Design a gold-standard curriculum for the central library.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Wizard Card in Boxed Layout */}
            <div className="max-w-3xl mx-auto relative z-20">
                <Card className="border border-slate-100 bg-white shadow-xl shadow-slate-200/50 overflow-hidden ring-1 ring-slate-900/5">
                    {/* Progress Bar */}
                    <div className="h-1.5 w-full bg-slate-100">
                        <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500 ease-out"
                            style={{ width: step === 1 ? '50%' : '100%' }}
                        />
                    </div>

                    <div className="p-8 md:p-10">
                        {step === 1 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                                <div className="space-y-3">
                                    <label className="text-sm font-semibold text-slate-700">Course Title</label>
                                    <Input
                                        placeholder="e.g. Advanced Data Structures & Algorithms"
                                        className="h-14 text-lg bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500/50 focus:ring-indigo-500/20 transition-all shadow-sm"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        autoFocus
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-sm font-semibold text-slate-700">Category</label>
                                        <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                                            <SelectTrigger className="h-14 bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:ring-indigo-500/20">
                                                <SelectValue placeholder="Select Category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {["Computer Science", "Data Science", "Artificial Intelligence", "Business", "Design", "Marketing"].map((c) => (
                                                    <SelectItem key={c} value={c} className="cursor-pointer">{c}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-sm font-semibold text-slate-700">Difficulty</label>
                                        <Select value={formData.difficulty} onValueChange={(v) => setFormData({ ...formData, difficulty: v })}>
                                            <SelectTrigger className="h-14 bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:ring-indigo-500/20">
                                                <SelectValue placeholder="Select Level" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {["Beginner", "Intermediate", "Advanced"].map((l) => (
                                                    <SelectItem key={l} value={l} className="cursor-pointer">{l}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-sm font-semibold text-slate-700">Description</label>
                                    <Textarea
                                        placeholder="Brief summary of what this course covers... (Optional)"
                                        className="min-h-[140px] resize-none bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500/50 focus:ring-indigo-500/20 transition-all shadow-sm leading-relaxed p-4"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                                <div className="space-y-3">
                                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                        <Target className="h-4 w-4 text-indigo-600" /> Learning Outcomes
                                    </label>
                                    <p className="text-xs text-slate-500">What will students achieve? Press Enter to add.</p>
                                    <Input
                                        placeholder="Type an outcome and press Enter..."
                                        value={currentOutcome}
                                        onChange={(e) => setCurrentOutcome(e.target.value)}
                                        onKeyDown={handleOutcomeAdd}
                                        className="h-14 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500/50 focus:ring-indigo-500/20"
                                        autoFocus
                                    />
                                    <div className="flex flex-wrap gap-2 mt-4 min-h-[100px] content-start">
                                        {formData.outcomes.map((o, i) => (
                                            <div key={i} className="group animate-in fade-in zoom-in duration-300 flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm">
                                                <Check className="h-3 w-3 text-indigo-500" />
                                                <span>{o}</span>
                                                <button onClick={() => removeOutcome(i)} className="hover:text-red-500 ml-1 opacity-50 group-hover:opacity-100 transition-opacity">×</button>
                                            </div>
                                        ))}
                                        {formData.outcomes.length === 0 && (
                                            <div className="w-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-6 text-slate-400">
                                                <Target className="h-8 w-8 mb-2 opacity-30" />
                                                <span className="text-sm italic">No outcomes added yet.</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-indigo-500/5 to-purple-500/5 p-5 rounded-xl border border-indigo-100 relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-xl"></div>
                                    <div className="relative z-10">
                                        <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                                            <Wand2 className="h-5 w-5 text-indigo-600" /> AI Syllabus Assistant Ready
                                        </h4>
                                        <p className="text-sm text-slate-500 leading-relaxed">
                                            Based on your inputs, our AI will automatically generate a structured syllabus with modules and topics in the next step.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <CardFooter className="bg-slate-50 p-8 flex justify-between border-t border-slate-100">
                        {step > 1 ? (
                            <Button
                                variant="ghost"
                                onClick={() => setStep(step - 1)}
                                className="text-slate-500 hover:text-slate-900 hover:bg-slate-200/50 transition-colors"
                            >
                                Back
                            </Button>
                        ) : (
                            <Button
                                variant="ghost"
                                onClick={() => router.push('/admin/library')}
                                className="text-slate-500 hover:text-slate-900 hover:bg-slate-200/50 transition-colors"
                            >
                                Cancel
                            </Button>
                        )}

                        {step < 2 ? (
                            <Button
                                onClick={() => setStep(step + 1)}
                                disabled={!formData.title}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-6 rounded-xl font-semibold shadow-lg shadow-indigo-200 text-base transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                            >
                                Continue <ArrowRight className="h-5 w-5 ml-2" />
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSubmit}
                                disabled={loading}
                                className={cn(
                                    "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-8 py-6 rounded-xl font-bold shadow-lg shadow-indigo-500/25 text-base transition-all hover:scale-105 active:scale-95",
                                    loading && "opacity-80 cursor-not-allowed"
                                )}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Creating Magic...
                                    </>
                                ) : (
                                    <>
                                        Create & Open Editor <BookOpen className="h-5 w-5 ml-2" />
                                    </>
                                )}
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
