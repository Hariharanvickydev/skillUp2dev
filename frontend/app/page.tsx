"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { getCourses, getOrganizations } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Sidebar } from "@/components/ui/sidebar"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Plus, BookOpen, Menu, LogOut, FileText, TrendingUp, Clock, Library, Shield, Building2 } from "lucide-react"

export default function Home() {
  const router = useRouter()
  const { user, logout, loading: authLoading } = useAuth()
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ orgs: 0 })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (user && user.role === 'STUDENT') {
      router.push('/learn')
      return
    }

    if (user && user.role === 'SUPER_ADMIN') {
      router.push('/admin/dashboard')
      return
    }

    if (user && user.role === 'ORG_ADMIN') {
      router.push('/org/dashboard')
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

      if (user?.role === 'SUPER_ADMIN') {
        try {
          const orgs = await getOrganizations()
          setStats(prev => ({ ...prev, orgs: orgs.length }))
        } catch (e) {
          console.error("Failed to fetch organizations", e)
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const recentCourses = courses.slice(0, 3)
  const totalTopics = courses.reduce((acc, c) => acc + (c.topics?.length || 0), 0)
  const completedCourses = courses.filter(c => c.status === 'COMPLETED').length

  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  const isOrgAdmin = ['SUPER_ADMIN', 'ORG_ADMIN'].includes(user?.role || '')
  // Teachers and Admins can create courses
  const canCreateCourse = ['SUPER_ADMIN', 'ORG_ADMIN', 'DEPT_HEAD', 'TEACHER'].includes(user?.role || '')

  if (authLoading || loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-12 w-12 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium">Loading Dashboard...</p>
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
                <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-orange-500">
                  Dashboard
                </h1>
                <p className="text-sm text-slate-500">
                  Welcome back, <span className="font-semibold text-slate-900">{user.full_name}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Role Badge */}
              <div className="hidden md:flex items-center px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-bold text-indigo-700">
                {user.role.replace('_', ' ')}
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs border border-orange-200">
                  {user.full_name?.substring(0, 2).toUpperCase()}
                </div>
                <Button variant="ghost" size="sm" onClick={logout} className="text-slate-500 hover:text-red-600 hover:bg-red-50">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="p-8 space-y-8 max-w-7xl mx-auto w-full">

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {isSuperAdmin ? (
              <>
                <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-500">Total Organizations</p>
                        <h3 className="text-3xl font-bold mt-2 text-slate-900">{stats.orgs}</h3>
                      </div>
                      <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                        <Shield className="h-6 w-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-500">Total Courses</p>
                        <h3 className="text-3xl font-bold mt-2 text-slate-900">{courses.length}</h3>
                      </div>
                      <div className="h-12 w-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                        <BookOpen className="h-6 w-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Total Courses</p>
                      <h3 className="text-3xl font-bold mt-2 text-slate-900">{courses.length}</h3>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                      <BookOpen className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}


            {!isSuperAdmin && (
              <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Total Topics</p>
                      <h3 className="text-3xl font-bold mt-2 text-slate-900">{totalTopics}</h3>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                      <FileText className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Completion Rate</p>
                    {/* Placeholder calculation */}
                    <h3 className="text-3xl font-bold mt-2 text-slate-900">
                      {courses.length > 0 ? Math.round((completedCourses / courses.length) * 100) : 0}%
                    </h3>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

              <button
                onClick={() => router.push('/admin/organizations')}
                className="flex flex-col items-start p-6 rounded-2xl bg-gradient-to-br from-indigo-900 to-indigo-700 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:scale-[1.02] transition-all duration-300 group text-left col-span-1 md:col-span-2"
              >
                <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center mb-4 backdrop-blur-sm">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-bold text-xl mb-1">Manage Organizations</h3>
                <p className="text-indigo-100/80 text-sm">Create orgs, departments, and admins</p>
              </button>

              {/* Create Course (Everyone with permission) */}
              {canCreateCourse && (
                <button
                  onClick={() => router.push('/library?new=true')}
                  className="flex flex-col items-start p-6 rounded-2xl bg-white border border-slate-200 hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/10 hover:scale-[1.02] transition-all duration-300 group text-left"
                >
                  <div className="h-12 w-12 rounded-xl bg-orange-50 flex items-center justify-center mb-4 group-hover:bg-orange-100 transition-colors">
                    <Plus className="h-6 w-6 text-orange-600" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 mb-1">Create Course</h3>
                  <p className="text-slate-500 text-sm">Generate new content with AI</p>
                </button>
              )}

              {/* Org Admin: Manage Faculty */}
              {isOrgAdmin && (
                <button
                  disabled
                  className="flex flex-col items-start p-6 rounded-2xl bg-white border border-slate-200 opacity-60 cursor-not-allowed text-left"
                >
                  <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center mb-4">
                    <Shield className="h-6 w-6 text-slate-400" />
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg text-slate-900">Manage Faculty</h3>
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">SOON</span>
                  </div>
                  <p className="text-slate-500 text-sm">Add teachers and assignments</p>
                </button>
              )}

              {/* Browse Library */}
              <button
                onClick={() => router.push('/library')}
                className="flex flex-col items-start p-6 rounded-2xl bg-white border border-slate-200 hover:border-indigo-500/50 hover:shadow-md transition-all duration-300 group text-left"
              >
                <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center mb-4 group-hover:bg-indigo-50 transition-colors">
                  <BookOpen className="h-6 w-6 text-slate-600 group-hover:text-indigo-600" />
                </div>
                <h3 className="font-bold text-lg text-slate-900 mb-1">My Courses</h3>
                <p className="text-slate-500 text-sm">View and edit your content</p>
              </button>

            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900">Recent Activity</h2>
              <Button variant="ghost" onClick={() => router.push('/library')} className="text-indigo-600 font-semibold">
                View All
              </Button>
            </div>

            {recentCourses.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-300">
                <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">No courses yet</h3>
                <p className="text-slate-500 mb-6 max-w-sm mx-auto">Get started by creating your first AI-generated course.</p>
                <Button onClick={() => router.push('/library?new=true')} className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl h-12 px-6">
                  Create Course
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {recentCourses.map((course) => (
                  <Card
                    key={course.id}
                    className="cursor-pointer hover:border-indigo-500/50 hover:shadow-lg transition-all duration-300 group border-slate-200 bg-white overflow-hidden"
                    onClick={() => router.push(`/courses/${course.id}`)}
                  >
                    <div className="h-2 bg-gradient-to-r from-indigo-500 to-orange-500"></div>
                    <CardHeader>
                      <CardTitle className="text-lg font-bold leading-tight line-clamp-2 group-hover:text-indigo-700 transition-colors text-slate-900">
                        {course.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(course.updated_at).toLocaleDateString()}</span>
                        </div>
                        {course.status === 'COMPLETED' && (
                          <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md font-medium">
                            <TrendingUp className="h-3 w-3" />
                            <span>Completed</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
