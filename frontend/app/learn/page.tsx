"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Search, Play, Layers, Star, CheckCircle2 } from "lucide-react"
import { getCourses } from "@/lib/api"

export default function LearnPage() {
    const router = useRouter()
    const { user, loading: authLoading } = useAuth()
    const [courses, setCourses] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        // Redirect to login if not authenticated
        if (!authLoading && !user) {
            router.push('/login')
            return
        }

        // Redirect admins
        if (user && user.role !== 'STUDENT' && user.role !== 'CONSUMER') {
            if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
                router.push('/')
                return
            }
        }

        if (user) {
            fetchCourses()
        }
    }, [user, authLoading])

    const fetchCourses = async () => {
        try {
            const data = await getCourses({ published_only: true })
            setCourses(data)
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

    if (authLoading || loading) return (
        <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    )

    if (!user) return null

    return (
        <div className="p-6 lg:p-10 space-y-8 pb-20 max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 p-8 text-white shadow-xl shadow-indigo-900/20">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-80 w-80 rounded-full bg-purple-500/20 blur-3xl"></div>

                <div className="relative z-10">
                    <div className="space-y-4 max-w-2xl">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight mb-2">My Learning</h1>
                            <p className="text-indigo-200 text-lg">
                                Explore your courses, track progress, and master new skills.
                            </p>
                        </div>

                        {/* Search Bar - Glassmorphism */}
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-white/10 flex items-center gap-2 max-w-xl">
                            <Search className="ml-3 h-5 w-5 text-indigo-300" />
                            <Input
                                type="text"
                                placeholder="Search courses..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="border-0 bg-transparent h-10 text-white placeholder:text-indigo-200/60 focus-visible:ring-0 focus-visible:ring-offset-0"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Course Grid */}
            <div>
                {filteredCourses.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-200 shadow-sm">
                        <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-900">No courses found</h3>
                        <p className="text-slate-500 max-w-sm mx-auto mt-2">
                            {searchQuery ? "Try adjusting your search terms." : "There are no courses active in your organization yet."}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
                        {filteredCourses.map((course) => {
                            const gradient = getGradient(course.category)
                            return (
                                <div
                                    key={course.id}
                                    className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col cursor-pointer"
                                    onClick={() => router.push(`/learn/courses/${course.id}`)}
                                >
                                    <div className={`h-40 w-full bg-gradient-to-r ${gradient} relative`}>
                                        <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors"></div>
                                        <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-white uppercase tracking-wider border border-white/20">
                                            {course.code || "COURSE"}
                                        </div>

                                        <div className="absolute bottom-4 left-6">
                                            {course.status === 'PUBLISHED' && (
                                                <Badge className="bg-emerald-500 hover:bg-emerald-600 border-0 shadow-sm backdrop-blur-md">
                                                    Live Course
                                                </Badge>
                                            )}
                                            {course.status === 'PARTIALLY_PUBLISHED' && (
                                                <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-0 shadow-sm">
                                                    In Progress
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-6 flex-1 flex flex-col">
                                        <div className="mb-4">
                                            <h3 className="text-xl font-bold text-slate-900 line-clamp-2 mb-2 group-hover:text-indigo-600 transition-colors">
                                                {course.title}
                                            </h3>
                                            <p className="text-slate-500 text-sm line-clamp-2 mb-4 h-10 leading-relaxed">
                                                {course.description || "Master this subject with our comprehensive curriculum."}
                                            </p>

                                            {/* Author Information */}
                                            <div className="text-xs text-slate-500 mb-3">
                                                {(() => {
                                                    // Determine what to display based on course state
                                                    const hasModifications = course.last_modified_by;
                                                    const hasApproval = course.approved_by;
                                                    const originalCreator = course.original_creator || course.creator;

                                                    if (!hasModifications && originalCreator) {
                                                        // Just cloned, no changes
                                                        return (
                                                            <div className="flex items-center gap-1.5">
                                                                <span>By {originalCreator.full_name || originalCreator.email}</span>
                                                            </div>
                                                        );
                                                    }

                                                    if (hasModifications) {
                                                        const parts = [];

                                                        // Original creator
                                                        if (originalCreator && course.parent_course_id) {
                                                            parts.push(`Created by ${originalCreator.full_name || originalCreator.email}`);
                                                        }

                                                        // Modified by
                                                        parts.push(`Modified by ${course.last_modified_by.full_name || course.last_modified_by.email}`);

                                                        // Approved by (only if different from modifier)
                                                        if (hasApproval && course.approved_by.id !== course.last_modified_by.id) {
                                                            parts.push(`Approved by ${course.approved_by.full_name || course.approved_by.email}`);
                                                        }

                                                        return (
                                                            <div className="flex items-center gap-1.5">
                                                                <span>{parts.join(' • ')}</span>
                                                            </div>
                                                        );
                                                    }

                                                    return null;
                                                })()}
                                            </div>
                                        </div>

                                        <div className="mt-auto">
                                            <div className="flex items-center justify-between text-sm text-slate-500 mb-6">
                                                <div className="flex items-center gap-1.5">
                                                    <Layers className="h-4 w-4 text-indigo-500" />
                                                    <span>{course.topics?.filter((t: any) => !t.parent_topic_id).length || 0} Modules</span>
                                                </div>
                                                {course.difficulty && (
                                                    <div className="flex items-center gap-1.5">
                                                        <Star className="h-4 w-4 text-orange-400" />
                                                        <span>{course.difficulty}</span>
                                                    </div>
                                                )}
                                            </div>


                                            <Button className="w-full bg-slate-900 group-hover:bg-indigo-600 transition-all duration-300 shadow-md group-hover:shadow-indigo-500/30 font-semibold h-11 rounded-xl">
                                                <Play className="mr-2 h-4 w-4 fill-current" />
                                                Start Learning
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}

function getGradient(category: string) {
    if (!category) return "from-indigo-500 to-purple-600";
    if (category.includes("Computer")) return "from-blue-600 to-indigo-600";
    if (category.includes("Data")) return "from-emerald-500 to-teal-600";
    if (category.includes("Business")) return "from-orange-500 to-amber-600";
    if (category.includes("Design")) return "from-pink-500 to-rose-600";
    return "from-slate-500 to-slate-600";
}
