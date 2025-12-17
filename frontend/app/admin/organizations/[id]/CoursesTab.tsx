"use client"

import { useState, useEffect } from "react"
import { getCourses } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, Loader2, BookOpen, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface CoursesTabProps {
    orgId: string
}

export function CoursesTab({ orgId }: CoursesTabProps) {
    const [courses, setCourses] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")

    useEffect(() => {
        loadCourses()
    }, [orgId])

    const loadCourses = async () => {
        setLoading(true)
        try {
            const data = await getCourses({ organization_id: orgId })
            setCourses(data)
        } catch (e) {
            console.error("Failed to load courses", e)
        } finally {
            setLoading(false)
        }
    }

    const filteredCourses = courses.filter(c =>
        c.title.toLowerCase().includes(search.toLowerCase())
    )

    if (loading) return (
        <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
    )

    if (courses.length === 0) return (
        <Card className="rounded-2xl border-dashed border-2 border-slate-200 shadow-none bg-slate-50/50">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4">
                    <BookOpen className="h-8 w-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">No Courses Yet</h3>
                <p className="text-slate-500 max-w-sm mt-2">This organization hasn't imported any courses from the library yet.</p>
            </CardContent>
        </Card>
    )

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800">Organization Courses</h3>
                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search courses..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 bg-white"
                    />
                </div>
            </div>

            <Card className="rounded-2xl shadow-sm border-slate-100 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                            <TableHead>Course Title</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Assigned Teacher</TableHead>
                            <TableHead>Topics</TableHead>
                            <TableHead className="text-right">Created</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredCourses.map((course) => (
                            <TableRow key={course.id} className="hover:bg-slate-50/50">
                                <TableCell className="font-medium text-slate-900">
                                    {course.title}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={
                                        course.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                            course.status === 'DRAFT' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                                                'bg-amber-50 text-amber-700 border-amber-200'
                                    }>
                                        {course.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {course.assigned_teacher ? (
                                        <div className="flex items-center gap-2">
                                            <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs text-indigo-700 font-bold">
                                                {course.assigned_teacher.full_name?.charAt(0) || "T"}
                                            </div>
                                            <span className="text-sm text-slate-600">{course.assigned_teacher.full_name}</span>
                                        </div>
                                    ) : (
                                        <span className="text-sm text-slate-400 italic">Unassigned</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1.5 text-slate-500">
                                        <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                                        {course.topics?.length || 0} Modules
                                    </div>
                                </TableCell>
                                <TableCell className="text-right text-slate-500">
                                    {new Date(course.created_at).toLocaleDateString()}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    )
}
