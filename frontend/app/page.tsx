"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { getCourses } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Sidebar } from "@/components/ui/sidebar"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Plus, BookOpen, Menu, LogOut, User, FileText, TrendingUp, Clock } from "lucide-react"

export default function Home() {
  const router = useRouter()
  const { user, logout, loading: authLoading } = useAuth()
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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

  const recentCourses = courses.slice(0, 3)
  const totalTopics = courses.reduce((acc, c) => acc + (c.topics?.length || 0), 0)
  const completedCourses = courses.filter(c => c.status === 'COMPLETED').length

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
                <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
                <p className="text-sm text-slate-500">Welcome back, {user.full_name || 'Admin'}</p>
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
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Total Courses</p>
                      <h3 className="text-3xl font-bold mt-2">{courses.length}</h3>
                    </div>
                    <BookOpen className="h-12 w-12 text-indigo-600 opacity-20" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Total Topics</p>
                      <h3 className="text-3xl font-bold mt-2">{totalTopics}</h3>
                    </div>
                    <FileText className="h-12 w-12 text-green-600 opacity-20" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Completed</p>
                      <h3 className="text-3xl font-bold mt-2">{completedCourses}</h3>
                    </div>
                    <TrendingUp className="h-12 w-12 text-blue-600 opacity-20" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    className="h-20 bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => router.push('/library?new=true')}
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    Create New Course
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20"
                    onClick={() => router.push('/library')}
                  >
                    <BookOpen className="mr-2 h-5 w-5" />
                    View All Courses
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Courses */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Recent Courses</h2>
                <Button variant="ghost" onClick={() => router.push('/library')}>
                  View All →
                </Button>
              </div>
              {recentCourses.length === 0 ? (
                <Card className="p-12 text-center">
                  <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No courses yet</h3>
                  <p className="text-slate-500 mb-4">Create your first course to get started</p>
                  <Button onClick={() => router.push('/library')} className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Course
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {recentCourses.map((course) => (
                    <Card
                      key={course.id}
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => router.push(`/courses/${course.id}`)}
                    >
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-indigo-600" />
                          {course.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(course.updated_at).toLocaleDateString()}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
