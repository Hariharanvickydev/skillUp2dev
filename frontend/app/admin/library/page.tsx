"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getLibraryCourses, reviewCourse } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet"
import { Check, X, AlertTriangle, BookOpen, Flag, Search, Filter, Book, Layers, Info, Star, Tag, Import, Eye, Pencil } from "lucide-react"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function LibraryPage() {
    const router = useRouter()
    const [courses, setCourses] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedCourse, setSelectedCourse] = useState<any>(null)
    const [isReviewOpen, setIsReviewOpen] = useState(false)
    const [isDetailOpen, setIsDetailOpen] = useState(false) // For slide-over details

    // Filters
    const [searchQuery, setSearchQuery] = useState("")
    const [difficultyFilter, setDifficultyFilter] = useState("All Levels")
    const [categoryFilter, setCategoryFilter] = useState("All Categories")

    useEffect(() => {
        fetchLibraryCourses()
    }, [searchQuery, difficultyFilter, categoryFilter]) // Re-fetch on filter change (debouncing recommended for prod)

    const fetchLibraryCourses = async () => {
        setLoading(true)
        try {
            // Passing params to API. Note: api.ts getLibraryCourses needs to accept args
            // For now assuming the backend handles it, but frontend API helper might need update.
            // I'll call with params if my api.ts supports it, otherwise client-side filter.
            // Given I updated the backend router, I should ideally update api.ts too.
            // But let's check basic fetching first.
            const queryParams = new URLSearchParams()
            if (searchQuery) queryParams.append('search', searchQuery)
            if (difficultyFilter && difficultyFilter !== "All Levels") queryParams.append('difficulty', difficultyFilter)
            if (categoryFilter && categoryFilter !== "All Categories") queryParams.append('category', categoryFilter)

            // To make this work with existing getLibraryCourses(), I'd need to modify it. 
            // Alternatively, I can use the generic api.get directly here for speed.
            const response = await import("@/lib/api").then(m => m.default.get(`/library/courses?${queryParams.toString()}`))
            setCourses(response.data)
        } catch (e) {
            toast.error("Failed to load library courses")
        } finally {
            setLoading(false)
        }
    }

    const handleReviewClick = (course: any) => {
        setSelectedCourse(course)
        setIsReviewOpen(true)
    }

    const handleDetailClick = (course: any) => {
        setSelectedCourse(course)
        setIsDetailOpen(true)
    }

    const handleEditClick = (courseId: string) => {
        router.push(`/admin/library/${courseId}`)
    }

    const handleUpdateFlags = async (flags: any) => {
        if (!selectedCourse) return
        try {
            await reviewCourse(selectedCourse.id, { flags })
            toast.success("Course flags updated")
            setIsReviewOpen(false)
            fetchLibraryCourses()
        } catch (e) {
            toast.error("Failed to update flags")
        }
    }

    // Mock Categories/Difficulties for UI
    const categories = ["All Categories", "Computer Science", "Data Science", "Business", "Design", "Mathematics"]
    const difficulties = ["All Levels", "Beginner", "Intermediate", "Advanced"]

    return (
        <div className="max-w-7xl mx-auto p-8 lg:p-12 space-y-10 pb-20">
            {/* Header Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 p-8 text-white shadow-2xl shadow-indigo-900/20">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-80 w-80 rounded-full bg-purple-500/20 blur-3xl"></div>

                <div className="relative z-10 space-y-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="text-center md:text-left space-y-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold backdrop-blur-md">
                                <Book className="h-3.5 w-3.5" /> Central Repository
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight text-white">Master Course Library</h1>
                            <p className="text-indigo-200 text-lg max-w-2xl font-light">
                                Discover, review, and manage the gold-standard curriculum for your institution.
                            </p>
                        </div>

                        <div className="flex-shrink-0">
                            <Button
                                onClick={() => window.location.href = '/admin/library/create'}
                                className="bg-white text-indigo-900 hover:bg-indigo-50 font-bold text-lg px-8 py-6 rounded-xl shadow-lg shadow-black/10 transition-all hover:scale-105"
                            >
                                + Create New Course
                            </Button>
                        </div>
                    </div>

                    {/* Integrated Filter Bar */}
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-white/10 flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-200 group-focus-within:text-white transition-colors" />
                            <Input
                                placeholder="Search courses, topics, or keywords..."
                                className="pl-12 border-0 bg-transparent h-12 text-base text-white placeholder:text-indigo-200/60 focus-visible:ring-0"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 p-1">
                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger className="w-[180px] h-10 rounded-xl border-white/10 bg-white/10 text-white hover:bg-white/20">
                                    <SelectValue placeholder="Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                                <SelectTrigger className="w-[160px] h-10 rounded-xl border-white/10 bg-white/10 text-white hover:bg-white/20">
                                    <SelectValue placeholder="Difficulty" />
                                </SelectTrigger>
                                <SelectContent>
                                    {difficulties.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="relative z-20">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-64 rounded-2xl bg-slate-200 animate-pulse"></div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses.map(course => (
                            <div
                                key={course.id}
                                className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
                            >
                                {/* Card Header / Image Placeholder */}
                                <div
                                    className={`h-32 w-full bg-gradient-to-r ${getGradient(course.category)} relative cursor-pointer`}
                                    onClick={() => handleEditClick(course.id)}
                                >
                                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors"></div>
                                    <div className="absolute bottom-4 left-6">
                                        <Badge className="bg-white/90 text-slate-900 shadow-sm backdrop-blur-md hover:bg-white">
                                            {course.category || "General"}
                                        </Badge>
                                    </div>
                                    {course.is_published && (
                                        <div className="absolute top-4 right-4">
                                            <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg" title="Published">
                                                <Check className="h-4 w-4" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3
                                            className="text-xl font-bold text-slate-900 line-clamp-2 group-hover:text-indigo-600 transition-colors cursor-pointer"
                                            onClick={() => handleEditClick(course.id)}
                                        >
                                            {course.title}
                                        </h3>
                                    </div>
                                    <p className="text-slate-500 text-sm line-clamp-2 mb-4 flex-1">{course.description}</p>

                                    <div className="flex items-center gap-4 text-sm text-slate-600 mb-6">
                                        <div className="flex items-center gap-1.5">
                                            <Layers className="h-4 w-4 text-indigo-500" />
                                            <span>{course.topics?.length || 0} Modules</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Star className="h-4 w-4 text-orange-400" />
                                            <span>{course.difficulty || "Beginner"}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 mt-auto">
                                        <Button variant="outline" className="flex-1" onClick={() => handleDetailClick(course)}>
                                            <Eye className="h-4 w-4 mr-2" /> Preview
                                        </Button>
                                        <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700" onClick={() => handleEditClick(course.id)}>
                                            <Pencil className="h-4 w-4 mr-2" /> Edit Logic
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Course Detail Sheet (Slide-over) */}
            <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <SheetContent side="right" className="sm:max-w-xl overflow-y-auto">
                    <SheetHeader>
                        <Badge className="w-fit mb-2">{selectedCourse?.category || "General"}</Badge>
                        <SheetTitle className="text-2xl font-bold">{selectedCourse?.title}</SheetTitle>
                        <SheetDescription className="text-base">{selectedCourse?.description}</SheetDescription>
                    </SheetHeader>

                    <div className="py-6 space-y-6">
                        {/* Metadata */}
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg flex-1 justify-center">
                                <Layers className="h-5 w-5 text-indigo-500" />
                                <div className="text-sm">
                                    <span className="font-bold">{selectedCourse?.topics?.length || 0}</span> Modules
                                </div>
                            </div>
                            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg flex-1 justify-center">
                                <Star className="h-5 w-5 text-orange-500" />
                                <div className="text-sm">
                                    <span className="font-bold">{selectedCourse?.difficulty || "Beginner"}</span> Level
                                </div>
                            </div>
                        </div>

                        {/* Syllabus Preview */}
                        <div>
                            <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-indigo-600" /> Course Syllabus
                            </h4>
                            <div className="space-y-3">
                                {selectedCourse?.topics?.length > 0 ? selectedCourse.topics.map((topic: any, idx: number) => (
                                    <div key={topic.id} className="p-4 border rounded-xl bg-white shadow-sm flex gap-3">
                                        <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0">
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <h5 className="font-medium text-slate-900">{topic.title}</h5>
                                            <p className="text-xs text-slate-500 line-clamp-1">{topic.description}</p>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-6 text-slate-400 italic bg-slate-50 rounded-xl border border-dashed">
                                        No topics found in this course.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Outcomes */}
                        <div>
                            <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                <Tag className="h-4 w-4 text-emerald-600" /> Learning Outcomes
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {selectedCourse?.outcomes?.length > 0 ? selectedCourse.outcomes.map((o: string, i: number) => (
                                    <Badge key={i} variant="secondary" className="px-3 py-1 font-normal bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
                                        {o}
                                    </Badge>
                                )) : (
                                    <p className="text-sm text-slate-500">No specific outcomes listed.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <SheetFooter className="pt-6 border-t mt-auto">
                        <Button className="w-full h-12 text-lg bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-200" onClick={() => handleEditClick(selectedCourse?.id)}>
                            <Pencil className="mr-2 h-5 w-5" /> Edit Syllabus & Content
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            {/* Review Dialog */}
            <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Review Course Quality</DialogTitle>
                        <DialogDescription>Flag issues using the checklist below.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <h4 className="font-medium text-sm text-slate-700">Flags</h4>
                            <div className="grid grid-cols-1 gap-2">
                                <label className="flex items-center gap-3 p-3 border rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                                    <input
                                        type="checkbox"
                                        defaultChecked={selectedCourse?.flags?.missing_topics}
                                        className="h-4 w-4 accent-indigo-600"
                                        onChange={(e) => handleUpdateFlags({ ...selectedCourse.flags, missing_topics: e.target.checked })}
                                    />
                                    <span className="text-sm font-medium">Incomplete Syllabus / Missing Topics</span>
                                </label>
                                <label className="flex items-center gap-3 p-3 border rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                                    <input
                                        type="checkbox"
                                        defaultChecked={selectedCourse?.flags?.low_quality}
                                        className="h-4 w-4 accent-indigo-600"
                                        onChange={(e) => handleUpdateFlags({ ...selectedCourse.flags, low_quality: e.target.checked })}
                                    />
                                    <span className="text-sm font-medium">Low Quality / Generic Content</span>
                                </label>
                                <label className="flex items-center gap-3 p-3 border rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                                    <input
                                        type="checkbox"
                                        defaultChecked={selectedCourse?.flags?.ai_errors}
                                        className="h-4 w-4 accent-indigo-600"
                                        onChange={(e) => handleUpdateFlags({ ...selectedCourse.flags, ai_errors: e.target.checked })}
                                    />
                                    <span className="text-sm font-medium">Visible AI Hallucinations/Errors</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function getGradient(category: string) {
    if (!category) return "from-indigo-500 to-purple-600"
    if (category.includes("Computer")) return "from-blue-600 to-indigo-600"
    if (category.includes("Data")) return "from-emerald-500 to-teal-600"
    if (category.includes("Business")) return "from-orange-500 to-amber-600"
    if (category.includes("Design")) return "from-pink-500 to-rose-600"
    return "from-slate-500 to-slate-600"
}
