"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { BookOpen, Search, LogOut, User, Play } from "lucide-react"
import axios from "axios"

export default function LearnPage() {
    const router = useRouter()
    const { user, logout, loading: authLoading } = useAuth()
    const [courses, setCourses] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        // Redirect to login if not authenticated
        if (!authLoading && !user) {
            router.push('/login')
            return
        }

        // Redirect admins to their dashboard
        if (user && user.role === 'ADMIN') {
            router.push('/')
            return
        }

        if (user) {
            fetchCourses()
        }
    }, [user, authLoading])

    const fetchCourses = async () => {
        try {
            const response = await axios.get('http://localhost:8000/courses/?published_only=true')
            setCourses(response.data)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const filteredCourses = courses.filter(course =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (authLoading || loading) return <div className="p-24">Loading...</div>
    if (!user) return null

    return (
        <main className="min-h-screen bg-gradient-to-br from-indigo-50 to-slate-100">
            {/* Header */}
            <header className="border-b border-slate-200 bg-white px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">SkillUp2Dev</h1>
                        <p className="text-sm text-slate-500">Learn at your own pace</p>
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

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-12">
                {/* Search Bar */}
                <div className="mb-8">
                    <div className="relative max-w-2xl">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <Input
                            type="text"
                            placeholder="Search courses..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 py-6 text-lg"
                        />
                    </div>
                </div>

                {/* Course Grid */}
                <div>
                    <h2 className="text-2xl font-bold mb-6">Available Courses</h2>
                    {filteredCourses.length === 0 ? (
                        <div className="text-center py-12">
                            <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500">
                                {searchQuery ? "No courses found matching your search" : "No courses available yet"}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredCourses.map((course) => (
                                <Card
                                    key={course.id}
                                    className="hover:shadow-lg transition-shadow cursor-pointer"
                                    onClick={() => router.push(`/learn/courses/${course.id}`)}
                                >
                                    <CardHeader>
                                        <CardTitle className="flex items-start justify-between">
                                            <span className="flex-1">{course.title}</span>
                                            <BookOpen className="h-5 w-5 text-indigo-600 flex-shrink-0 ml-2" />
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-slate-500 mb-4 line-clamp-2">
                                            {course.description || "No description available"}
                                        </p>
                                        <Button variant="outline" size="sm" className="w-full">
                                            <Play className="mr-2 h-4 w-4" />
                                            Start Learning
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </main>
    )
}
