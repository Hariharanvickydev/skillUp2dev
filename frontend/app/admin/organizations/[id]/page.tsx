"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { getAdminOrganizationDashboard, updateOrganizationStatus, updateOrganizationLimits } from "@/lib/api"
import { StatCard, ActivityChart, RecentActivityFeed, CourseSummaryTable } from "./DashboardComponents"
import { PeopleTab } from "./PeopleTab"
import { OrgStructureManager } from "@/components/OrgStructureManager"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card"
import { ArrowLeft, Building, User, Users, Shield, BookOpen, Activity, Ban, CheckCircle, Save, FileText, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function OrganizationDetailPage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string

    // Dashboard State
    const [dashboardData, setDashboardData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [org, setOrg] = useState<any>(null)
    const [limits, setLimits] = useState({
        max_students: 0,
        max_teachers: 0,
        max_courses: 0,
        ai_credits_limit: 0
    })

    useEffect(() => {
        fetchDashboard()
    }, [id])

    const fetchDashboard = async () => {
        try {
            setLoading(true)
            const data = await getAdminOrganizationDashboard(id)
            setDashboardData(data)
            setOrg(data.summary) // Keep org state for header compatibility
            setLimits(data.limits) // Initialize limits
        } catch (e) {
            console.error(e)
            toast.error("Failed to fetch dashboard")
        } finally {
            setLoading(false)
        }
    }

    const handleStatusChange = async (newStatus: boolean) => {
        try {
            await updateOrganizationStatus(id, newStatus)
            setOrg({ ...org, is_active: newStatus })
            // Also update dashboard summary if it exists
            if (dashboardData) {
                setDashboardData({
                    ...dashboardData,
                    summary: { ...dashboardData.summary, status: newStatus ? 'ACTIVE' : 'SUSPENDED' }
                })
            }
            toast.success(newStatus ? "Organization Validated" : "Organization Suspended")
        } catch (e) {
            toast.error("Failed to update status")
        }
    }

    const handleLimitUpdate = async () => {
        try {
            await updateOrganizationLimits(id, limits)
            toast.success("Limits updated successfully")
        } catch (e) {
            toast.error("Failed to update limits")
        }
    }

    if (loading) return (
        <div className="flex h-[50vh] items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
                <p className="text-slate-500 font-medium animate-pulse">Loading Dashboard...</p>
            </div>
        </div>
    )

    if (!dashboardData) return <div>Organization not found</div>

    // Destructure for easier access
    const { summary, metrics, charts, course_summary, activity_feed, limits: orgLimits } = dashboardData

    return (
        <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-8 animate-in fade-in duration-500">
            {/* Hero Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 shadow-xl shadow-slate-200">
                {/* ... Header Content Same as Before ... */}
                {/* Background Effects */}
                <div className="absolute top-0 right-0 -mt-20 -mr-20 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl"></div>

                <div className="relative z-10">
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/admin/organizations')}
                        className="text-indigo-200 hover:text-white hover:bg-white/10 mb-6 -ml-2 px-2 h-auto py-1"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Organizations
                    </Button>

                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-900/50 ring-4 ring-white/10">
                                <Building className="h-10 w-10 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-white tracking-tight">{summary.name}</h1>
                                <div className="flex items-center gap-3 mt-2 text-indigo-200">
                                    {summary.code && <span className="text-indigo-300 font-mono bg-white/5 px-2 py-0.5 rounded text-xs">{summary.code}</span>}
                                    {summary.type && <span className="text-indigo-300 text-sm border-l border-white/20 pl-3">{summary.type}</span>}

                                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm backdrop-blur-sm ${summary.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30' : 'bg-red-500/20 text-red-200 border border-red-500/30'}`}>
                                        {summary.status === 'ACTIVE' ? <CheckCircle className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                                        {summary.status}
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Actions from before... */}
                        <div className="flex gap-3">
                            {summary.status === 'ACTIVE' ? (
                                <Button variant="destructive" onClick={() => handleStatusChange(false)} className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20 shadow-none border">Suspend</Button>
                            ) : (
                                <Button onClick={() => handleStatusChange(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white">Reactivate</Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-8">
                <Tabs defaultValue="overview" className="space-y-8 w-full">
                    <TabsList className="bg-white/80 backdrop-blur-xl p-1 h-14 rounded-2xl shadow-xl shadow-indigo-900/5 border border-white/50 w-full grid grid-cols-5">
                        <TabsTrigger value="overview" className="h-12 rounded-xl px-6 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Overview</TabsTrigger>
                        <TabsTrigger value="structure" className="h-12 rounded-xl px-6 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Structure</TabsTrigger>
                        <TabsTrigger value="people" className="h-12 rounded-xl px-6 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">People</TabsTrigger>
                        <TabsTrigger value="courses" className="h-12 rounded-xl px-6 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Courses</TabsTrigger>
                        <TabsTrigger value="settings" className="h-12 rounded-xl px-6 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Settings</TabsTrigger>
                    </TabsList>

                    {/* OVERVIEW TAB - DASHBOARD */}
                    <TabsContent value="overview" className="space-y-8 animate-in slide-in-from-bottom-5 duration-500">
                        {/* 1. Key Metrics Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard title="Total Students" value={metrics.total_students} subtext={`${metrics.active_students_7d} active this week`} icon={<Users className="h-6 w-6" />} trend={12} />
                            <StatCard title="Total Teachers" value={metrics.total_teachers} subtext="Across all depts" icon={<User className="h-6 w-6" />} />
                            <StatCard title="Total Courses" value={metrics.total_courses} subtext={`${metrics.published_courses} published`} icon={<BookOpen className="h-6 w-6" />} />
                            <StatCard title="Exams Conducted" value={metrics.total_exams} subtext="This month" icon={<FileText className="h-6 w-6" />} trend={5} />
                        </div>

                        {/* 2. Main Dashboard Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                            {/* Left Column (2/3) */}
                            <div className="lg:col-span-2 space-y-8">
                                {/* Activity Chart */}
                                <Card className="rounded-3xl shadow-sm border-slate-100 p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <CardTitle className="text-lg font-bold text-slate-800">Weekly Active Users</CardTitle>
                                        <Select defaultValue="7d">
                                            <SelectTrigger className="w-32 h-9 rounded-lg"><SelectValue placeholder="Period" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="7d">Last 7 Days</SelectItem>
                                                <SelectItem value="30d">Last 30 Days</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <ActivityChart data={charts.weekly_activity} />
                                </Card>

                                {/* Course Summary */}
                                <Card className="rounded-3xl shadow-sm border-slate-100 overflow-hidden">
                                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                                        <CardTitle className="text-lg font-bold text-slate-800">Recent Courses</CardTitle>
                                        <Button variant="ghost" className="text-indigo-600 text-sm h-auto p-0 hover:bg-transparent">View All</Button>
                                    </div>
                                    <CourseSummaryTable courses={course_summary} />
                                </Card>
                            </div>

                            {/* Right Column (1/3) */}
                            <div className="space-y-8">
                                {/* Org Health / Limits */}
                                <Card className="rounded-3xl shadow-sm border-slate-100 bg-slate-900 text-white overflow-hidden relative">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Activity className="h-5 w-5 text-emerald-400" /> Org Health
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6 relative z-10">
                                        <div>
                                            <div className="flex justify-between text-sm mb-2 text-slate-300">
                                                <span>Student Limit</span>
                                                <span>{orgLimits.current_students} / {orgLimits.max_students}</span>
                                            </div>
                                            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(orgLimits.current_students / orgLimits.max_students) * 100}%` }}></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-sm mb-2 text-slate-300">
                                                <span>AI Credits</span>
                                                <span>{metrics.ai_credits_used} used</span>
                                            </div>
                                            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                                <div className="h-full bg-purple-500 rounded-full" style={{ width: `${orgLimits.ai_usage_percent}%` }}></div>
                                            </div>
                                            {orgLimits.ai_usage_percent > 80 && <p className="text-xs text-amber-400 mt-2 flex items-center"><AlertCircle className="h-3 w-3 mr-1" /> High usage detected</p>}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Activity Feed */}
                                <Card className="rounded-3xl shadow-sm border-slate-100">
                                    <CardHeader>
                                        <CardTitle className="text-lg font-bold text-slate-800">Recent Activity</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <RecentActivityFeed activities={activity_feed} />
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    {/* STRUCTURE TAB */}
                    <TabsContent value="structure" className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                        <OrgStructureManager orgId={id} orgType={summary.type} />
                    </TabsContent>

                    {/* PEOPLE TAB */}
                    <TabsContent value="people" className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                        <PeopleTab orgId={id} orgType={summary.type} />
                    </TabsContent>

                    {/* COURSES TAB */}
                    <TabsContent value="courses" className="animate-in slide-in-from-bottom-5 duration-500">
                        <Card className="rounded-2xl border-dashed border-2 border-slate-200 shadow-none bg-slate-50/50">
                            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4">
                                    <BookOpen className="h-8 w-8 text-slate-300" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900">No Courses Yet</h3>
                                <p className="text-slate-500 max-w-sm mt-2">This organization hasn't imported any courses from the library yet.</p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* SETTINGS TAB */}
                    <TabsContent value="settings" className="animate-in slide-in-from-bottom-5 duration-500">
                        <Card className="rounded-2xl shadow-lg shadow-slate-200/50 border-slate-100">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-100 rounded-lg">
                                        <Shield className="h-6 w-6 text-slate-600" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl">Resource Limits</CardTitle>
                                        <CardDescription>Configure the maximum capacity for this organization.</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">Max Students</label>
                                            <Input
                                                type="number"
                                                value={limits.max_students}
                                                onChange={(e) => setLimits({ ...limits, max_students: parseInt(e.target.value) })}
                                                className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">Max Teachers</label>
                                            <Input
                                                type="number"
                                                value={limits.max_teachers}
                                                onChange={(e) => setLimits({ ...limits, max_teachers: parseInt(e.target.value) })}
                                                className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">Max Courses</label>
                                            <Input
                                                type="number"
                                                value={limits.max_courses}
                                                onChange={(e) => setLimits({ ...limits, max_courses: parseInt(e.target.value) })}
                                                className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">AI Credits Limit</label>
                                            <Input
                                                type="number"
                                                value={limits.ai_credits_limit}
                                                onChange={(e) => setLimits({ ...limits, ai_credits_limit: parseInt(e.target.value) })}
                                                className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="bg-slate-50/50 border-t border-slate-100 rounded-b-2xl p-6">
                                <Button onClick={handleLimitUpdate} className="ml-auto bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-12 px-8 shadow-lg shadow-indigo-500/20">
                                    <Save className="h-4 w-4 mr-2" /> Save Changes
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
