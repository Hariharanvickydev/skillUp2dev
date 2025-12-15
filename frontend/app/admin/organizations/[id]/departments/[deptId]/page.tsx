"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { getOrganization, getDepartments, getUsers, createUser } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ArrowLeft, Plus, User, Trash2, Crown, Users } from "lucide-react"
import { toast } from "sonner"
import api from "@/lib/api" // helper for specific call if needed

export default function DepartmentDetailPage() {
    const params = useParams()
    const router = useRouter()
    const orgId = params.id as string
    const deptId = params.deptId as string

    const [dept, setDept] = useState<any>(null)
    const [faculty, setFaculty] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Faculty Modal
    const [isFacultyModalOpen, setIsFacultyModalOpen] = useState(false)
    const [newFaculty, setNewFaculty] = useState({ full_name: "", email: "", password: "" })

    useEffect(() => {
        fetchData()
    }, [orgId, deptId])

    const fetchData = async () => {
        try {
            // Get Dept info (from list of depts in org for now, simpler than dedicated getDept endpoint if lazy)
            // But we ideally use the getDepartment endpoint if we exposed it directly or use the list
            // Let's use the list for now or fetch list and find
            const depts = await getDepartments(orgId)
            const currentDept = depts.find((d: any) => d.id === deptId)
            setDept(currentDept)

            // Get Faculty (Teachers in this Dept)
            const facultyData = await getUsers(orgId, deptId, 'TEACHER')
            setFaculty(facultyData)
        } catch (e) {
            console.error(e)
            toast.error("Failed to fetch department details")
        } finally {
            setLoading(false)
        }
    }

    const handleAddFaculty = async () => {
        if (!newFaculty.email || !newFaculty.password) return
        try {
            await createUser({
                ...newFaculty,
                role: 'TEACHER',
                organization_id: orgId,
                department_id: deptId
            })
            toast.success("Faculty member added")
            setIsFacultyModalOpen(false)
            setNewFaculty({ full_name: "", email: "", password: "" })
            fetchData()
        } catch (e: any) {
            toast.error(e.response?.data?.detail || "Failed to add faculty")
        }
    }

    if (loading) return <div className="p-12 text-center">Loading...</div>
    if (!dept) return <div>Department not found</div>

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <Button variant="ghost" size="icon" onClick={() => router.push(`/admin/organizations/${orgId}`)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">{dept.name}</h1>
                        <p className="text-slate-500">Department Management</p>
                    </div>
                </div>

                <div className="grid gap-6">
                    {/* Head of Dept Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Crown className="h-5 w-5 text-amber-500" />
                                Head of Department
                            </CardTitle>
                            <CardDescription>The user responsible for this department.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-100 rounded-lg">
                                {dept.head_of_dept_user_id ? (
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-amber-200 flex items-center justify-center text-amber-700 font-bold">
                                            H
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-900">Assigned ID: {dept.head_of_dept_user_id.substring(0, 8)}...</p>
                                            <p className="text-xs text-slate-500">Full details fetching coming soon</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-slate-500 italic">No Head of Department assigned</div>
                                )}
                                <Button variant="outline" size="sm" disabled>Change (Soon)</Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Faculty Section */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-indigo-600" />
                                    Faculty & Staff
                                </CardTitle>
                                <CardDescription>Teachers assigned to this department.</CardDescription>
                            </div>
                            <Button onClick={() => setIsFacultyModalOpen(true)} size="sm">
                                <Plus className="mr-2 h-4 w-4" /> Add Faculty
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {faculty.length === 0 ? (
                                    <p className="text-sm text-slate-500">No faculty members yet.</p>
                                ) : (
                                    faculty.map(user => (
                                        <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                                                    {user.full_name?.[0] || user.email[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900">{user.full_name}</p>
                                                    <p className="text-sm text-slate-500">{user.email}</p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Add Faculty Modal */}
            <Dialog open={isFacultyModalOpen} onOpenChange={setIsFacultyModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Faculty Member</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <label className="text-sm font-medium mb-1 block">Full Name</label>
                            <Input
                                placeholder="Jane Doe"
                                value={newFaculty.full_name}
                                onChange={(e) => setNewFaculty({ ...newFaculty, full_name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">Email</label>
                            <Input
                                type="email"
                                placeholder="jane@example.com"
                                value={newFaculty.email}
                                onChange={(e) => setNewFaculty({ ...newFaculty, email: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">Password</label>
                            <Input
                                type="password"
                                placeholder="******"
                                value={newFaculty.password}
                                onChange={(e) => setNewFaculty({ ...newFaculty, password: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsFacultyModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddFaculty}>Add Faculty</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
