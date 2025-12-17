import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, Loader2, Shield, Plus, Trash2, UserCheck } from "lucide-react"
import { getUsers, updateCourse, getOrgGroupTree } from "@/lib/api"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface UserBasic {
    id: string
    full_name: string
    email: string
    role: string
    department_name?: string
}

interface AssignTeacherDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    courseId: string
    courseTitle: string
    currentAssignees?: UserBasic[]
    onSuccess: () => void
}

export function AssignTeacherDialog({ open, onOpenChange, courseId, courseTitle, currentAssignees = [], onSuccess }: AssignTeacherDialogProps) {
    const [activeTab, setActiveTab] = useState("assigned")
    const [search, setSearch] = useState("")
    const [deptFilter, setDeptFilter] = useState<string>("ALL")
    const [users, setUsers] = useState<any[]>([])
    const [departments, setDepartments] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [processingId, setProcessingId] = useState<string | null>(null)

    // Internal state to handle immediate UI updates
    const [localAssignees, setLocalAssignees] = useState<UserBasic[]>([])

    // Selection for Multi-Add
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

    // Confirmation State
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [userToRemove, setUserToRemove] = useState<string | null>(null)

    const currentIds = new Set(localAssignees.map(u => u.id))

    // Sync props to local state when opening
    useEffect(() => {
        if (open) {
            setLocalAssignees(currentAssignees)
            setActiveTab("assigned")
            setSelectedIds(new Set())
            setSearch("")
        }
    }, [open, currentAssignees])

    // Load Departments
    useEffect(() => {
        const loadDepts = async () => {
            try {
                const tree = await getOrgGroupTree()
                // Flatten logic
                const flatten = (nodes: any[]): any[] => {
                    return nodes.reduce((acc, node) => {
                        acc.push(node)
                        if (node.children) {
                            acc.push(...flatten(node.children))
                        }
                        return acc
                    }, [])
                }
                setDepartments(flatten(tree))
            } catch (e) {
                console.error("Failed to load departments", e)
            }
        }
        if (open) loadDepts()
    }, [open])

    // Load Users (for Add Tab)
    useEffect(() => {
        if (activeTab !== "add") return

        const fetchUsers = async () => {
            setLoading(true)
            try {
                const orgGroupId = deptFilter !== "ALL" ? deptFilter : undefined

                const [teachers, hods] = await Promise.all([
                    getUsers(undefined, orgGroupId, "TEACHER", search),
                    getUsers(undefined, orgGroupId, "DEPT_HEAD", search)
                ])

                const allAssignable = [...teachers, ...hods]
                    .filter(u => !currentIds.has(u.id)) // Filter out already assigned

                allAssignable.sort((a, b) => (a.full_name || "").localeCompare(b.full_name || ""))

                setUsers(allAssignable)
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }

        const timeoutId = setTimeout(fetchUsers, 300) // Debounce
        return () => clearTimeout(timeoutId)
    }, [open, activeTab, search, deptFilter, localAssignees]) // Depend on localAssignees

    const handleToggle = (userId: string) => {
        const newSet = new Set(selectedIds)
        if (newSet.has(userId)) {
            newSet.delete(userId)
        } else {
            newSet.add(userId)
        }
        setSelectedIds(newSet)
    }

    const handleAddSelected = async () => {
        if (selectedIds.size === 0) return
        setProcessingId("BATCH")
        try {
            const newIds = [...Array.from(currentIds), ...Array.from(selectedIds)]
            const updatedCourse = await updateCourse(courseId, { assignee_ids: newIds })

            // UI Update: Use response from server to update local list
            if (updatedCourse.assignees) {
                setLocalAssignees(updatedCourse.assignees)
            }

            toast.success(`Added ${selectedIds.size} teachers`)
            onSuccess() // Refresh parent
            setSelectedIds(new Set())
            setActiveTab("assigned") // Switch back to see result
        } catch (e) {
            toast.error("Failed to add teachers")
        } finally {
            setProcessingId(null)
        }
    }

    const initiateRemove = (userId: string) => {
        setUserToRemove(userId)
        setConfirmOpen(true)
    }

    const confirmRemove = async () => {
        if (!userToRemove) return

        setConfirmOpen(false) // Close dialog first
        setProcessingId(userToRemove)

        try {
            const newIds = Array.from(currentIds).filter(id => id !== userToRemove)
            const updatedCourse = await updateCourse(courseId, { assignee_ids: newIds })

            if (updatedCourse.assignees) {
                setLocalAssignees(updatedCourse.assignees)
            } else {
                // Fallback if API hasn't returned assignees yet (though it should)
                setLocalAssignees(prev => prev.filter(u => u.id !== userToRemove))
            }

            toast.success("Teacher unassigned")
            onSuccess() // Refresh parent
        } catch (e) {
            toast.error("Failed to remove teacher")
        } finally {
            setProcessingId(null)
            setUserToRemove(null)
        }
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-md h-[550px] flex flex-col p-0 gap-0">
                    <DialogHeader className="p-6 pb-2">
                        <DialogTitle>Course Instructors</DialogTitle>
                        <DialogDescription>
                            Manage teachers assigned to <strong>{courseTitle}</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                        <div className="px-6 border-b">
                            <TabsList className="w-full">
                                <TabsTrigger value="assigned" className="flex-1">
                                    Assigned ({localAssignees.length})
                                </TabsTrigger>
                                <TabsTrigger value="add" className="flex-1">
                                    Add Teacher
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="assigned" className="flex-1 overflow-y-auto p-6 pt-4 space-y-3 m-0">
                            {localAssignees.length === 0 ? (
                                <div className="text-center py-10 text-slate-500">
                                    <UserCheck className="h-10 w-10 mx-auto mb-3 text-slate-200" />
                                    <p>No teachers assigned yet.</p>
                                    <Button variant="link" onClick={() => setActiveTab("add")}>
                                        Assign a teacher
                                    </Button>
                                </div>
                            ) : (
                                localAssignees.map(user => (
                                    <div key={user.id} className="flex items-center justify-between p-3 rounded-xl border bg-white shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10 border">
                                                <AvatarImage src={`https://ui-avatars.com/api/?name=${user.full_name}&background=random`} />
                                                <AvatarFallback>{user.full_name?.substring(0, 2)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-medium text-sm text-slate-900 flex items-center gap-2">
                                                    {user.full_name}
                                                    {user.role === "DEPT_HEAD" && <Shield className="h-3 w-3 text-indigo-500" />}
                                                </div>
                                                <div className="text-xs text-slate-500">{user.email}</div>
                                                {user.department_name && (
                                                    <Badge variant="secondary" className="mt-1 text-[10px] py-0 h-4">
                                                        {user.department_name}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                                            disabled={processingId === user.id}
                                            onClick={() => initiateRemove(user.id)}
                                        >
                                            {processingId === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                ))
                            )}
                        </TabsContent>

                        <TabsContent value="add" className="flex-1 flex flex-col overflow-hidden m-0">
                            <div className="p-4 border-b space-y-3 bg-slate-50/50">
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="Search by name..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-9 bg-white"
                                    />
                                </div>
                                <Select value={deptFilter} onValueChange={setDeptFilter}>
                                    <SelectTrigger className="w-full bg-white [&>span]:truncate">
                                        <SelectValue placeholder="Filter by Department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">All Departments</SelectItem>
                                        {departments.map(dept => (
                                            <SelectItem key={dept.id} value={dept.id}>
                                                {dept.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                {loading ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                                    </div>
                                ) : users.length === 0 ? (
                                    <div className="text-center py-8 text-slate-500 text-sm">
                                        No matching users found.
                                    </div>
                                ) : (
                                    users.map((user) => {
                                        const isSelected = selectedIds.has(user.id)
                                        return (
                                            <div
                                                key={user.id}
                                                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${isSelected ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200' : 'hover:bg-slate-50 border-transparent hover:border-slate-200 bg-white'}`}
                                                onClick={() => handleToggle(user.id)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Checkbox
                                                        checked={isSelected}
                                                        onCheckedChange={() => handleToggle(user.id)}
                                                        className="data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                                                    />
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={`https://ui-avatars.com/api/?name=${user.full_name}&background=random`} />
                                                        <AvatarFallback>{user.full_name?.substring(0, 2)}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-medium text-sm text-slate-900 flex items-center gap-2">
                                                            {user.full_name}
                                                            {user.role === "DEPT_HEAD" && <Shield className="h-3 w-3 text-indigo-500" />}
                                                        </div>
                                                        <div className="text-xs text-slate-500">{user.email}</div>
                                                    </div>
                                                </div>
                                                {user.department_name && (
                                                    <Badge variant="outline" className="text-[10px] h-5 bg-white">
                                                        {user.department_name}
                                                    </Badge>
                                                )}
                                            </div>
                                        )
                                    })
                                )}
                            </div>

                            <div className="p-4 border-t bg-white">
                                <Button
                                    onClick={handleAddSelected}
                                    disabled={selectedIds.size === 0 || processingId === "BATCH"}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                                >
                                    {processingId === "BATCH" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Add Selected Teachers ({selectedIds.size})
                                </Button>
                            </div>
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>

            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Unassign Teacher?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove the teacher from this course. They will no longer have access to manage it.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmRemove} className="bg-red-600 hover:bg-red-700">
                            Unassign
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
