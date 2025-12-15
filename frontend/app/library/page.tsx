"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { createCourse, getCourses } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Sidebar } from "@/components/ui/sidebar"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Progress } from "@/components/ui/progress"
import { Plus, BookOpen, Menu, LogOut, User, Search, Globe, LayoutGrid, List as ListIcon, MoreVertical, TrendingUp, Clock, AlertCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

function LibraryPageContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { user, logout, loading: authLoading } = useAuth()

    // State
    const [courses, setCourses] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isNewCourseOpen, setIsNewCourseOpen] = useState(false)
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [searchQuery, setSearchQuery] = useState("")

    // Create Course Wizard State
    const [topic, setTopic] = useState("")
    const [description, setDescription] = useState("")
    const [wizardStep, setWizardStep] = useState(1)

    // Derived State
    const isCentralView = searchParams.get('view') === 'central'
    const pageTitle = isCentralView ? "Central Library" : "My Library"
    const pageDescription = isCentralView ? "Browse and import world-class curriculum." : "Manage your institution's courses."

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login')
            return
        }
        if (user && user.role === 'STUDENT') {
            router.push('/learn')
            return
        }
        if (user) {
            fetchCourses()
        }
    }, [user, authLoading])

    // Auto-open new course dialog if ?new=true
    useEffect(() => {
        if (searchParams.get('new') === 'true') {
            setIsNewCourseOpen(true)
        }
    }, [searchParams])

    const fetchCourses = async () => {
        try {
            const data = await getCourses()
            setCourses(data)
        } catch (e) {
            console.error(e)
            toast.error("Failed to load courses")
        } finally {
            setLoading(false)
        }
    }

    const handleCreateCourse = async () => {
        if (!topic) return
        setLoading(true)
        try {
            const course = await createCourse({ title: topic, description })
            toast.success("Course created successfully!")
            router.push(`/courses/${course.id}`)
        } catch (e) {
            console.error(e)
            toast.error('Failed to create course. Please try again.')
            setLoading(false)
        }
    }

    const filteredCourses = courses.filter(course =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (course.description && course.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    const getProgress = (course: any) => {
        if (course.status === 'COMPLETED') return 100
        if (course.topics && course.topics.length > 0) return 10
        return 0
    }

    if (authLoading || loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900">
            <div className="animate-pulse flex flex-col items-center">
                <div className="h-12 w-12 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin mb-4"></div>
                <p className="text-slate-500 font-medium">Loading...</p>
            </div>
        </div>
    )
    if (!user) return null

    return (
        <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
            {/* Sidebar */}
            <div className="hidden lg:block w-72 border-r border-slate-200 bg-white fixed h-full z-20">
                <Sidebar />
            </div>

            {/* Main Content */}
            <div className="flex-1 lg:ml-72 min-h-screen flex flex-col">
                {/* Header */}
                <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-8 py-4 bg-white/80 backdrop-blur-md">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Sheet>
                                <SheetTrigger asChild className="lg:hidden">
                                    <Button variant="outline" size="icon" className="border-slate-200">
                                        <Menu className="h-5 w-5 text-slate-600" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="left" className="w-72 p-0 border-r border-slate-200 bg-white">
                                    <SheetTitle className="sr-only">Menu</SheetTitle>
                                    <Sidebar />
                                </SheetContent>
                            </Sheet>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                                    {isCentralView && <Globe className="h-6 w-6 text-indigo-600" />}
                                    {pageTitle}
                                </h1>
                                <p className="text-sm text-slate-500">{pageDescription}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="hidden md:flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setViewMode('grid')}
                                    className={viewMode === 'grid' ? 'bg-slate-100 text-indigo-600' : 'text-slate-400'}
                                >
                                    <LayoutGrid className="h-5 w-5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setViewMode('list')}
                                    className={viewMode === 'list' ? 'bg-slate-100 text-indigo-600' : 'text-slate-400'}
                                >
                                    <ListIcon className="h-5 w-5" />
                                </Button>
                            </div>
                            {!isCentralView && (
                                <Button onClick={() => setIsNewCourseOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                    <Plus className="mr-2 h-4 w-4" /> New Course
                                </Button>
                            )}
                        </div>
                    </div>
                </header>

                <main className="p-8 max-w-7xl mx-auto w-full space-y-8">

                    {/* View Filters */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="w-full md:w-96 relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search courses..."
                                className="pl-10 bg-white border-slate-200 focus:border-indigo-500 rounded-xl"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Tabs defaultValue={isCentralView ? "central" : "mine"} className="w-full md:w-auto" onValueChange={(val: string) => {
                            if (val === 'central') router.push('/library?view=central')
                            else router.push('/library')
                        }}>
                            <TabsList className="bg-slate-100 p-1 rounded-xl">
                                <TabsTrigger value="mine" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm">My Courses</TabsTrigger>
                                <TabsTrigger value="central" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm">Central Library</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    {/* Course Grid */}
                    {filteredCourses.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <BookOpen className="h-8 w-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-900 mb-2">No courses found</h3>
                            <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                                {isCentralView ? "The Central Library is empty." : "Create your first course to get started with AI curriculum generation."}
                            </p>
                            {!isCentralView && (
                                <Button onClick={() => setIsNewCourseOpen(true)} variant="outline">
                                    <Plus className="mr-2 h-4 w-4" /> Create Course
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
                            {filteredCourses.map((course) => (
                                <Card
                                    key={course.id}
                                    className={`cursor-pointer hover:shadow-lg transition-all duration-300 group overflow-hidden border-slate-200 bg-white ${viewMode === 'list' ? 'flex flex-row items-center' : ''}`}
                                    onClick={() => router.push(`/courses/${course.id}`)}
                                >
                                    {/* Cover Image / Gradient */}
                                    <div className={`${viewMode === 'grid' ? 'h-32' : 'h-full w-24'} bg-gradient-to-br from-indigo-500 to-purple-600 relative group-hover:scale-105 transition-transform duration-500`}>
                                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                                        <div className="absolute bottom-3 left-3 bg-white/20 backdrop-blur-md px-2 py-1 rounded text-xs text-white font-medium border border-white/20">
                                            {course.topics?.length || 0} Topics
                                        </div>
                                    </div>

                                    <div className="flex-1">
                                        <CardHeader className={`${viewMode === 'list' ? 'pb-2' : ''}`}>
                                            <div className="flex justify-between items-start">
                                                <CardTitle className="text-lg font-bold text-slate-900 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">
                                                    {course.title}
                                                </CardTitle>
                                                {viewMode === 'list' && (
                                                    <div className="flex items-center gap-2">
                                                        {/* Action Buttons for List View */}
                                                    </div>
                                                )}
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-slate-500 line-clamp-2 mb-4 h-10">
                                                {course.description || "No description provided."}
                                            </p>

                                            <div className="space-y-2">
                                                <div className="flex justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                    <span>{course.status}</span>
                                                    <span>{getProgress(course)}%</span>
                                                </div>
                                                <Progress value={getProgress(course)} className="h-1.5 bg-slate-100" indicatorClassName={course.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-indigo-600'} />
                                            </div>
                                        </CardContent>
                                        <CardFooter className="pt-0 pb-4 text-xs text-slate-400 flex items-center gap-2">
                                            <Clock className="h-3 w-3" />
                                            Updated {new Date(course.updated_at).toLocaleDateString()}
                                        </CardFooter>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}

                </main>
            </div>

            {/* Create Course Wizard Dialog */}
            <Dialog open={isNewCourseOpen} onOpenChange={setIsNewCourseOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>AI Course Generator</DialogTitle>
                        <DialogDescription>
                            {wizardStep === 1 ? "What subject would you like to teach?" : "Tailor the curriculum for your students."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        {wizardStep === 1 ? (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Course Topic</label>
                                    <Input
                                        placeholder="e.g. Advanced Python for Data Science"
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        className="h-12 text-lg focus:ring-indigo-500"
                                        autoFocus
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Target Audience / Description</label>
                                    <Textarea
                                        placeholder="e.g. Undergraduate students with basic math knowledge. Focus on practical examples."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="min-h-[100px] focus:ring-indigo-500"
                                        autoFocus
                                    />
                                    <p className="text-xs text-slate-500">
                                        The AI will use this context to customize the difficulty and modules.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="flex justify-between sm:justify-between items-center w-full">
                        {wizardStep === 1 ? (
                            <>
                                <Button variant="ghost" onClick={() => setIsNewCourseOpen(false)}>Cancel</Button>
                                <Button onClick={() => setWizardStep(2)} disabled={!topic}>
                                    Next: Customize &rarr;
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button variant="ghost" onClick={() => setWizardStep(1)}>&larr; Back</Button>
                                <Button onClick={handleCreateCourse} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[140px]">
                                    {loading ? (
                                        <>Generating...</>
                                    ) : (
                                        <>
                                            <Globe className="mr-2 h-4 w-4" /> Generate Course
                                        </>
                                    )}
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    )
}

export default function LibraryPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-12 w-12 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin mb-4"></div>
                    <p className="text-slate-500 font-medium">Loading...</p>
                </div>
            </div>
        }>
            <LibraryPageContent />
        </Suspense>
    )
}
