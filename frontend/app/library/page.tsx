"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { createCourse, getCourses } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Sidebar } from "@/components/ui/sidebar"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Progress } from "@/components/ui/progress"
import { Plus, BookOpen, Menu, LogOut, User } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export default function LibraryPage() {
    const router = useRouter()
    const { user, logout, loading: authLoading } = useAuth()
    const [courses, setCourses] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isNewCourseOpen, setIsNewCourseOpen] = useState(false)
    const [topic, setTopic] = useState("")
    const [description, setDescription] = useState("")

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login')
            return
        }

        if (user && user.role === 'CONSUMER') {
            router.push('/learn')
            return
        }

        if (user) {
            fetchCourses()
        }
    }, [user, authLoading])

    // Check URL parameter to auto-open dialog
    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        if (params.get('new') === 'true') {
            setIsNewCourseOpen(true)
            // Clean up URL
            window.history.replaceState({}, '', '/library')
        }
    }, [])

    const fetchCourses = async () => {
        try {
            const data = await getCourses()
            setCourses(data)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const handleStart = async () => {
        if (!topic) return
        setLoading(true)
        try {
            const course = await createCourse(topic, description)
            router.push(`/courses/${course.id}`)
        } catch (e) {
            console.error(e)
            alert("Failed to create course")
        } finally {
            setLoading(false)
            setIsNewCourseOpen(false)
        }
    }

    const getProgress = (course: any) => {
        if (course.status === 'COMPLETED') return 100
        if (course.topics && course.topics.length > 0) {
            return 10
        }
        return 0
    }

    if (authLoading || loading) return <div className="p-24">Loading...</div>
    if (!user) return null

    return (
        <div className="flex min-h-screen bg-slate-50">
            {/* Sidebar */}
            <div className="hidden lg:block w-64 border-r border-slate-200 bg-white">
                <Sidebar />
            </div>

            {/* Main Content */}
            <div className="flex-1">
                {/* Header */}
                <header className="border-b border-slate-200 bg-white px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Sheet>
                                <SheetTrigger asChild className="lg:hidden">
                                    <Button variant="outline" size="icon">
                                        <Menu className="h-5 w-5" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="left" className="w-64 p-0">
                                    <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                                    <Sidebar />
                                </SheetContent>
                            </Sheet>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">My Library</h1>
                                <p className="text-sm text-slate-500">Manage your courses</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-sm">
                                <User className="h-4 w-4 text-slate-500" />
                                <span className="text-slate-700">{user.email}</span>
                            </div>
                            <Button variant="outline" size="sm" onClick={logout}>
                                <LogOut className="mr-2 h-4 w-4" />
                                Logout
                            </Button>
                        </div>
                    </div>
                </header>

                <main className="p-8">
                    <div className="max-w-6xl mx-auto space-y-8">
                        {/* New Course Button - Only show when courses exist */}
                        {courses.length > 0 && (
                            <div className="flex justify-end items-center">
                                <Button
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                    onClick={() => setIsNewCourseOpen(true)}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    New Course
                                </Button>
                            </div>
                        )}

                        {/* Course Grid */}
                        <div>
                            <h2 className="text-lg font-semibold mb-4">All Courses</h2>
                            {courses.length === 0 ? (
                                <Card className="p-12 text-center">
                                    <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-slate-900 mb-2">No courses yet</h3>
                                    <p className="text-slate-500 mb-4">Create your first course to get started</p>
                                    <Button onClick={() => setIsNewCourseOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Create Course
                                    </Button>
                                </Card>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {courses.map((course) => (
                                        <Card
                                            key={course.id}
                                            className="cursor-pointer hover:shadow-lg transition-shadow"
                                            onClick={() => router.push(`/courses/${course.id}`)}
                                        >
                                            <CardHeader>
                                                <CardTitle className="flex items-center justify-between">
                                                    <span>{course.title}</span>
                                                    <BookOpen className="h-5 w-5 text-indigo-600" />
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between text-xs text-slate-500">
                                                        <span>{course.status}</span>
                                                        <span>{getProgress(course)}%</span>
                                                    </div>
                                                    <Progress value={getProgress(course)} className="h-1.5" />
                                                    <p className="text-xs text-slate-400 mt-2">Last updated {new Date(course.updated_at).toLocaleDateString()}</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Create Course Dialog - Always rendered */}
                    <Dialog open={isNewCourseOpen} onOpenChange={setIsNewCourseOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Course</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div>
                                    <label className="text-sm font-medium">Course Topic</label>
                                    <Input
                                        placeholder="e.g., Introduction to React"
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Description (Optional)</label>
                                    <Textarea
                                        placeholder="Brief description of the course..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                                <Button onClick={handleStart} disabled={!topic || loading} className="w-full">
                                    {loading ? "Creating..." : "Create Course"}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </main>
            </div>
        </div>
    )
}
