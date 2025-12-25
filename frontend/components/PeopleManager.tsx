"use client"

import { useState, useEffect } from "react"
import {
    getOrganizationUsers,
    createOrganizationUser,
    updateOrganizationUser,
    deleteOrganizationUser,
    resetUserPassword,
    getUsers,
    createUser,
    deleteUser,
    updateUser,
    userResetPassword
} from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
    Search,
    Plus,
    Loader2,
    Shield,
    User,
    GraduationCap,
    Trash2,
    UserX,
    UserCheck,
    Filter,
    Briefcase,
    Copy,
    Eye,
    EyeOff,
    Check,
    AlertCircle,
    Key,
    Lock,
    Unlock,
    Upload,
    Clock,
    Download,
    X
} from "lucide-react"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { OrgGroupSelector } from "@/components/OrgGroupSelector"
import { BulkUploadDialog } from "@/components/BulkUploadDialog"

interface PeopleManagerProps {
    orgId: string
    orgType?: string
    apiMode: 'ADMIN' | 'ORG' // ADMIN = Super Admin (all permissions), ORG = Org Admin (limited)
}

export function PeopleManager({ orgId, orgType = 'COLLEGE', apiMode }: PeopleManagerProps) {
    const [activeTab, setActiveTab] = useState("TEACHER")

    const level1Label = orgType === 'SCHOOL' ? 'Standard' : 'Department';
    const level2Label = orgType === 'SCHOOL' ? 'Section' : 'Year / Batch';

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-800">
                    <User className="h-6 w-6 text-indigo-600" />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">User Management</span>
                </h2>
            </div>

            <Tabs defaultValue="TEACHER" onValueChange={setActiveTab} className="w-full block space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                    <TabsList className="w-full h-auto bg-white p-1.5 rounded-2xl border border-slate-200/60 shadow-lg shadow-slate-100/50 flex">
                        <TabsTrigger value="TEACHER" className="flex-1 rounded-xl px-6 py-3 text-sm font-semibold gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-500 hover:text-indigo-600 transition-all duration-300">
                            <User className="h-4 w-4" /> Teachers
                        </TabsTrigger>
                        <TabsTrigger value="STUDENT" className="flex-1 rounded-xl px-6 py-3 text-sm font-semibold gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-500 hover:text-purple-600 transition-all duration-300">
                            <GraduationCap className="h-4 w-4" /> Students
                        </TabsTrigger>
                        <TabsTrigger value="DEPT_HEAD" className="flex-1 rounded-xl px-6 py-3 text-sm font-semibold gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-600 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-500 hover:text-pink-600 transition-all duration-300">
                            <Briefcase className="h-4 w-4" /> Heads
                        </TabsTrigger>
                        {apiMode === 'ADMIN' && (
                            <TabsTrigger value="ORG_ADMIN" className="flex-1 rounded-xl px-6 py-3 text-sm font-semibold gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-700 data-[state=active]:to-slate-600 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-500 hover:text-slate-800 transition-all duration-300">
                                <Shield className="h-4 w-4" /> Admins
                            </TabsTrigger>
                        )}
                    </TabsList>

                    <div className="flex gap-2">
                        {activeTab === "STUDENT" && (
                            <BulkUploadButton role="STUDENT" orgId={orgId} onSuccess={() => window.dispatchEvent(new CustomEvent('refresh-users'))} />
                        )}
                        {activeTab === "TEACHER" && (
                            <BulkUploadButton role="TEACHER" orgId={orgId} onSuccess={() => window.dispatchEvent(new CustomEvent('refresh-users'))} />
                        )}
                        {activeTab === "DEPT_HEAD" && (
                            <BulkUploadButton role="DEPT_HEAD" orgId={orgId} onSuccess={() => window.dispatchEvent(new CustomEvent('refresh-users'))} />
                        )}
                        <AddUserButton
                            role={activeTab}
                            orgId={orgId}
                            orgType={orgType}
                            apiMode={apiMode}
                            onUserAdded={() => window.dispatchEvent(new CustomEvent('refresh-users'))}
                        />
                    </div>
                </div>

                <TabsContent value="TEACHER" className="mt-0">
                    <UserList orgId={orgId} role="TEACHER" level1Label={level1Label} level2Label={level2Label} apiMode={apiMode} />
                </TabsContent>
                <TabsContent value="STUDENT" className="mt-0">
                    <UserList orgId={orgId} role="STUDENT" level1Label={level1Label} level2Label={level2Label} apiMode={apiMode} />
                </TabsContent>
                <TabsContent value="DEPT_HEAD" className="mt-0">
                    <UserList orgId={orgId} role="DEPT_HEAD" level1Label={level1Label} level2Label={level2Label} apiMode={apiMode} />
                </TabsContent>
                {apiMode === 'ADMIN' && (
                    <TabsContent value="ORG_ADMIN" className="mt-0">
                        <UserList orgId={orgId} role="ORG_ADMIN" level1Label={level1Label} level2Label={level2Label} apiMode={apiMode} />
                    </TabsContent>
                )}
            </Tabs>
        </div>
    )
}

// Helper function to format relative time
function formatRelativeTime(dateString: string | null | undefined): string {
    if (!dateString) return "Never";

    const date = new Date(dateString + (dateString.endsWith('Z') ? '' : 'Z'));
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    // For older dates, show formatted date in local timezone
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Helper function to get department path as string
function getDepartmentPath(user: any): string {
    if (user.group) {
        const parts = [];
        let current = user.group;
        while (current) {
            parts.unshift(current.name);
            current = current.parent;
        }
        return parts.join(' / ');
    }
    return user.department_name || 'General';
}

// Helper function to export users to CSV
function exportToCSV(users: any[], role: string) {
    // CSV headers
    const headers = ['Name', 'Email', 'Phone', 'Department', 'Roll Number', 'Year', 'Status', 'Last Login'];

    // Convert users to CSV rows
    const rows = users.map(user => [
        user.full_name || '',
        user.email || '',
        user.phone || '',
        getDepartmentPath(user),
        user.roll_number || '',
        user.year || '',
        user.is_active ? 'Active' : 'Inactive',
        formatRelativeTime(user.last_login_at)
    ]);

    // Create CSV content with proper escaping
    const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const roleLabel = role.toLowerCase().replace('_', '-');
    link.download = `${roleLabel}s_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${users.length} ${roleLabel}(s) to CSV`);
}

function UserList({ orgId, role, level1Label, level2Label, apiMode }: { orgId: string, role: string, level1Label: string, level2Label: string, apiMode: string }) {
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")

    // Filters
    const [filters, setFilters] = useState({
        status: 'all',        // 'all' | 'active' | 'inactive'
        department: 'all',    // 'all' | department name
        lastLogin: 'all'      // 'all' | 'never' | '7days' | '30days' | '30plus'
    })

    // Pagination
    const [page, setPage] = useState(1)
    const limit = 10

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const skip = (page - 1) * limit
            let data;
            if (apiMode === 'ADMIN') {
                data = await getOrganizationUsers(orgId, role, search, skip, limit)
            } else {
                data = await getUsers(orgId, undefined, role, search, skip, limit)
            }
            setUsers(data)
        } catch (e) {
            console.error(e)
            toast.error("Failed to fetch users")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()

        const handleRefresh = () => fetchUsers()
        window.addEventListener('refresh-users', handleRefresh)
        return () => window.removeEventListener('refresh-users', handleRefresh)
    }, [orgId, role, page, search, apiMode])

    // De-bounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1) // Reset to page 1 on search
            fetchUsers()
        }, 500)
        return () => clearTimeout(timer)
    }, [search])

    const [resetPasswordOpen, setResetPasswordOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<any>(null)
    const [newPassword, setNewPassword] = useState("")
    const [resetLoading, setResetLoading] = useState(false)

    const [confirmOpen, setConfirmOpen] = useState(false)
    const [confirmConfig, setConfirmConfig] = useState<{
        title: string,
        description: string,
        action: (() => Promise<void>) | null,
        confirmText: string,
        variant: 'danger' | 'warning'
    }>({
        title: "",
        description: "",
        action: null,
        confirmText: "Confirm",
        variant: 'warning'
    })
    const [confirmLoading, setConfirmLoading] = useState(false)

    const handleAction = async (action: string, user: any, payload?: any) => {
        if (action === 'RESET_PASSWORD_INIT') {
            setSelectedUser(user)
            setResetPasswordOpen(true)
            setNewPassword("")
            return
        }

        if (action === 'DELETE') {
            setConfirmConfig({
                title: "Delete User?",
                description: `Are you sure you want to permanently delete ${user.full_name}? This action cannot be undone.`,
                confirmText: "Delete User",
                variant: 'danger',
                action: async () => {
                    if (apiMode === 'ADMIN') await deleteOrganizationUser(user.id)
                    else await deleteUser(user.id)
                    toast.success("User deleted")
                }
            })
            setConfirmOpen(true)
            return
        }

        if (action === 'TOGGLE_STATUS') {
            const isSuspending = user.is_active
            setConfirmConfig({
                title: isSuspending ? "Suspend User?" : "Activate User?",
                description: isSuspending
                    ? `Are you sure you want to suspend ${user.full_name}? They will no longer be able to log in.`
                    : `Are you sure you want to activate ${user.full_name}? They will regain access to the platform.`,
                confirmText: isSuspending ? "Suspend Access" : "Activate Access",
                variant: isSuspending ? 'warning' : 'warning',
                action: async () => {
                    const updateData = { is_active: !user.is_active }
                    if (apiMode === 'ADMIN') await updateOrganizationUser(user.id, updateData)
                    else await updateUser(user.id, updateData)
                    toast.success(`User ${!user.is_active ? 'activated' : 'deactivated'}`)
                }
            })
            setConfirmOpen(true)
            return
        }

        if (action === 'RESET_PASSWORD') {
            try {
                if (apiMode === 'ADMIN') await resetUserPassword(user.id, payload)
                else await userResetPassword(user.id, payload)
                toast.success("Password reset")
                fetchUsers()
            } catch (e: any) {
                toast.error(e.response?.data?.detail || "Action failed")
            }
        }
    }

    const handleResetSubmit = async () => {
        if (!newPassword || newPassword.length < 6) {
            toast.error("Password must be at least 6 characters")
            return
        }
        setResetLoading(true)
        // Direct call to avoid confirm for Reset Password (it has its own modal)
        try {
            if (apiMode === 'ADMIN') await resetUserPassword(selectedUser.id, newPassword)
            else await userResetPassword(selectedUser.id, newPassword)
            toast.success("Password reset")
            fetchUsers()
            setResetPasswordOpen(false)
        } catch (e: any) {
            toast.error(e.response?.data?.detail || "Reset failed")
        } finally {
            setResetLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex gap-2 items-center">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search by name, email, phone..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-11 h-12 rounded-2xl bg-white border-slate-200 focus:border-indigo-500 shadow-sm transition-all text-base"
                    />
                </div>
                <Button
                    onClick={() => exportToCSV(users, role)}
                    disabled={users.length === 0}
                    variant="outline"
                    className="h-12 px-4 rounded-2xl border-slate-200 hover:bg-slate-50 transition-all"
                >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                </Button>
            </div>

            {/* Filters */}
            <div className="flex gap-2 items-center flex-wrap">
                {/* Status Filter */}
                <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
                    <SelectTrigger className="w-[140px] h-10 rounded-xl border-slate-200">
                        <Filter className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                </Select>

                {/* Department Filter - Hierarchical */}
                <div className="relative">
                    <OrgGroupSelector
                        orgId={orgId}
                        value={filters.department}
                        onChange={(id, name) => setFilters({ ...filters, department: id || 'all' })}
                        labels={{ level1: level1Label, level2: level2Label }}
                        role={role}
                    />
                </div>
                {/* Last Login Filter */}
                <Select value={filters.lastLogin} onValueChange={(v) => setFilters({ ...filters, lastLogin: v })}>
                    <SelectTrigger className="w-[160px] h-10 rounded-xl border-slate-200">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Logins</SelectItem>
                        <SelectItem value="never">Never Logged In</SelectItem>
                        <SelectItem value="7days">Last 7 Days</SelectItem>
                        <SelectItem value="30days">Last 30 Days</SelectItem>
                        <SelectItem value="30plus">30+ Days Ago</SelectItem>
                    </SelectContent>
                </Select>

                {/* Clear Filters */}
                {(filters.status !== 'all' || filters.department !== 'all' || filters.lastLogin !== 'all') && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFilters({ status: 'all', department: 'all', lastLogin: 'all' })}
                        className="h-10 px-3 rounded-xl text-slate-600 hover:text-slate-900"
                    >
                        <X className="h-3.5 w-3.5 mr-1" /> Clear Filters
                    </Button>
                )}
            </div>

            {/* Table */}
            <div className="rounded-3xl border border-slate-200/60 bg-white overflow-hidden shadow-xl shadow-slate-200/40">
                <Table>
                    <TableHeader className="bg-slate-50/50 backdrop-blur-xl border-b border-slate-100">
                        <TableRow className="hover:bg-slate-50/50">
                            <TableHead className="px-8 py-5 font-bold text-xs uppercase tracking-wider text-slate-500">User Profile</TableHead>
                            <TableHead className="px-6 py-5 font-bold text-xs uppercase tracking-wider text-slate-500">Contact Info</TableHead>
                            <TableHead className="px-6 py-5 font-bold text-xs uppercase tracking-wider text-slate-500">{level1Label}</TableHead>
                            <TableHead className="px-6 py-5 font-bold text-xs uppercase tracking-wider text-slate-500">Status</TableHead>
                            <TableHead className="px-6 py-5 font-bold text-xs uppercase tracking-wider text-slate-500">Last Login</TableHead>
                            <TableHead className="px-8 py-5 text-right font-bold text-xs uppercase tracking-wider text-slate-500">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {(() => {
                            // Apply filters
                            const filteredUsers = users.filter(user => {
                                // Status filter
                                if (filters.status === 'active' && !user.is_active) return false;
                                if (filters.status === 'inactive' && user.is_active) return false;

                                // Department filter (hierarchical - matches selected group or any parent)
                                if (filters.department !== 'all') {
                                    // Check if user's group matches or is a descendant of selected group
                                    let currentGroup = user.group;
                                    let found = false;
                                    while (currentGroup) {
                                        if (currentGroup.id === filters.department) {
                                            found = true;
                                            break;
                                        }
                                        currentGroup = currentGroup.parent;
                                    }
                                    if (!found) return false;
                                }

                                // Last Login filter
                                if (filters.lastLogin !== 'all') {
                                    const daysSinceLogin = user.last_login_at
                                        ? Math.floor((Date.now() - new Date(user.last_login_at + (user.last_login_at.endsWith('Z') ? '' : 'Z')).getTime()) / 86400000)
                                        : null;

                                    if (filters.lastLogin === 'never' && daysSinceLogin !== null) return false;
                                    if (filters.lastLogin === '7days' && (daysSinceLogin === null || daysSinceLogin > 7)) return false;
                                    if (filters.lastLogin === '30days' && (daysSinceLogin === null || daysSinceLogin > 30)) return false;
                                    if (filters.lastLogin === '30plus' && (daysSinceLogin === null || daysSinceLogin <= 30)) return false;
                                }

                                return true;
                            });

                            if (loading) {
                                return (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-48 text-center">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                                                <p className="text-slate-400 text-sm font-medium">Loading users...</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            }

                            if (filteredUsers.length === 0) {
                                return (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-48 text-center text-slate-400">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                                                    <UserX className="h-6 w-6 text-slate-300" />
                                                </div>
                                                <p className="font-medium">No users found</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            }

                            return filteredUsers.map((user) => (
                                <TableRow key={user.id} className="cursor-default transition-all duration-200 hover:bg-slate-50/80 border-b border-slate-50 last:border-0 group relative hover:shadow-[inset_4px_0_0_0_#6366f1]">
                                    <TableCell className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className={`h-11 w-11 rounded-2xl flex items-center justify-center text-sm font-bold shadow-sm ${user.role === 'STUDENT' ? 'bg-gradient-to-br from-purple-100 to-purple-200 text-purple-700' :
                                                user.role === 'TEACHER' ? 'bg-gradient-to-br from-indigo-100 to-indigo-200 text-indigo-700' :
                                                    'bg-gradient-to-br from-pink-100 to-pink-200 text-pink-700'
                                                }`}>
                                                {user.full_name?.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-800 text-base">{user.full_name}</div>
                                                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mt-0.5">
                                                    {user.roll_number || user.role}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 py-5">
                                        <div className="space-y-1.5">
                                            <div className="text-sm font-medium text-slate-600 flex items-center gap-2">
                                                <div className="w-6 py-0.5 bg-slate-100 rounded text-[10px] text-center text-slate-500">MAIL</div>
                                                {user.email}
                                            </div>
                                            <div className="text-sm font-medium text-slate-600 flex items-center gap-2">
                                                <div className="w-6 py-0.5 bg-slate-100 rounded text-[10px] text-center text-slate-500">TEL</div>
                                                {user.phone || '-'}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 py-5">
                                        <div className="flex flex-col gap-1.5 items-start max-w-[200px]">
                                            {user.group ? (
                                                <div className="flex flex-wrap items-center gap-1 text-xs">
                                                    {(() => {
                                                        const parts = [];
                                                        let current = user.group;
                                                        while (current) {
                                                            parts.unshift(current);
                                                            current = current.parent;
                                                        }
                                                        return parts.map((part, i) => (
                                                            <div key={part.id} className="flex items-center gap-1">
                                                                {i > 0 && <span className="text-slate-300">/</span>}
                                                                <Badge
                                                                    variant="outline"
                                                                    className={`bg-white border-slate-200 shadow-sm font-medium py-0 px-1.5 text-[10px] ${i === parts.length - 1 ? 'text-slate-700 border-slate-300' : 'text-slate-500'
                                                                        }`}
                                                                >
                                                                    {part.name}
                                                                </Badge>
                                                            </div>
                                                        ))
                                                    })()}
                                                </div>
                                            ) : (
                                                <Badge variant="outline" className="bg-white border-slate-200 text-slate-700 shadow-sm font-medium py-0.5 px-2 text-xs">
                                                    {user.department_name || 'General'}
                                                </Badge>
                                            )}
                                            {user.year && (
                                                <div className="text-[10px] font-semibold text-slate-400 pl-0.5">
                                                    BATCH {user.year}
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 py-5">
                                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${user.is_active
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                            : "bg-amber-50 text-amber-700 border-amber-100"
                                            }`}>
                                            <div className={`w-2 h-2 rounded-full mr-2 ${user.is_active ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                                                }`}></div>
                                            {user.is_active ? 'ACTIVE' : 'INACTIVE'}
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-slate-400" />
                                            <span className={`text-sm font-medium ${user.last_login_at
                                                ? 'text-slate-600'
                                                : 'text-amber-600'
                                                }`}>
                                                {formatRelativeTime(user.last_login_at)}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-8 py-5 text-right">
                                        <div className="flex justify-end gap-1 transition-all duration-200">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => handleAction('RESET_PASSWORD_INIT', user)}
                                                title="Reset Password"
                                                className="h-9 w-9 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors"
                                            >
                                                <Key className="h-4.5 w-4.5" />
                                            </Button>

                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => handleAction('TOGGLE_STATUS', user)}
                                                title={user.is_active ? "Suspend User" : "Activate User"}
                                                className={`h-9 w-9 rounded-xl transition-colors ${user.is_active
                                                    ? "text-orange-600 bg-orange-50 hover:bg-orange-100"
                                                    : "text-emerald-600 bg-emerald-50 hover:bg-emerald-100"
                                                    }`}
                                            >
                                                {user.is_active ? <Lock className="h-4.5 w-4.5" /> : <Unlock className="h-4.5 w-4.5" />}
                                            </Button>

                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => handleAction('DELETE', user)}
                                                title="Delete User"
                                                className="h-9 w-9 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                                            >
                                                <Trash2 className="h-4.5 w-4.5" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        })()}
                    </TableBody>
                </Table>
            </div>
            {/* Pagination Controls */}
            <div className="flex justify-between items-center text-sm text-slate-500">
                <div>Showing page {page}</div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={users.length < limit}>Next</Button>
                </div>
            </div>

            {/* Reset Password Dialog */}
            <Dialog open={resetPasswordOpen} onOpenChange={setResetPasswordOpen}>
                <DialogContent className="sm:max-w-md rounded-3xl p-0 overflow-hidden border-0 shadow-2xl">
                    <div className="p-8 bg-white border-b border-slate-100">
                        <DialogTitle className="text-xl font-bold text-slate-900">Reset Password</DialogTitle>
                        <DialogDescription className="text-slate-500 mt-1">
                            Set a new password for <span className="font-semibold text-slate-700">{selectedUser?.full_name}</span>.
                        </DialogDescription>
                    </div>
                    <div className="p-8 space-y-4 bg-white">
                        <div className="space-y-2">
                            <Label className="text-slate-600 font-medium">New Password</Label>
                            <Input
                                type="text"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter strong password..."
                                className="h-12 rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 bg-slate-50/50"
                            />
                        </div>
                    </div>
                    <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100 items-center">
                        <Button variant="ghost" onClick={() => setResetPasswordOpen(false)} className="h-12 px-6 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200/50">Cancel</Button>
                        <Button onClick={handleResetSubmit} disabled={resetLoading} className="h-12 px-8 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl shadow-lg shadow-amber-500/20 border-0">
                            {resetLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Update Password"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* General Confirmation Dialog */}
            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent className="sm:max-w-md rounded-3xl p-0 overflow-hidden border-0 shadow-2xl">
                    <div className="p-8 bg-white border-b border-slate-100">
                        <DialogTitle className={`text-xl font-bold ${confirmConfig.variant === 'danger' ? 'text-red-600' : 'text-slate-900'}`}>
                            {confirmConfig.title}
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 mt-2 text-base leading-relaxed">
                            {confirmConfig.description}
                        </DialogDescription>
                    </div>
                    <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100 items-center gap-3">
                        <Button variant="ghost" onClick={() => setConfirmOpen(false)} className="h-12 px-6 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 font-medium">Cancel</Button>
                        <Button
                            onClick={async () => {
                                if (!confirmConfig.action) return
                                setConfirmLoading(true)
                                try {
                                    await confirmConfig.action()
                                    setConfirmOpen(false)
                                    fetchUsers()
                                } catch (e: any) {
                                    // Error is usually handled in the action itself with toast, but catch here just in case 
                                } finally {
                                    setConfirmLoading(false)
                                }
                            }}
                            disabled={confirmLoading}
                            className={`h-12 px-8 text-white rounded-xl shadow-lg border-0 font-semibold ${confirmConfig.variant === 'danger'
                                ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-red-500/20'
                                : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-orange-500/20'
                                }`}
                        >
                            {confirmLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : confirmConfig.confirmText}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

// Exported for reuse in Dashboard
export function AddUserModal({
    open,
    onOpenChange,
    role,
    orgId,
    orgType,
    apiMode,
    onUserAdded
}: {
    open: boolean,
    onOpenChange: (open: boolean) => void,
    role: string,
    orgId: string,
    orgType: string,
    apiMode: string,
    onUserAdded: () => void
}) {
    const [loading, setLoading] = useState(false)
    const [successData, setSuccessData] = useState<any>(null)
    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        phone: "",
        department_name: "",
        org_group_id: "",
        roll_number: "",
        year: ""
    })

    // Reset when modal opens/closes
    useEffect(() => {
        if (!open) {
            setSuccessData(null)
            setFormData({ full_name: "", email: "", phone: "", department_name: "", org_group_id: "", roll_number: "", year: "" })
        }
    }, [open])

    const handleSubmit = async () => {
        if (!formData.email || !formData.full_name) {
            toast.error("Required fields missing")
            return
        }
        setLoading(true)
        try {
            let data;
            const payload = { ...formData, role }

            if (apiMode === 'ADMIN') {
                data = await createOrganizationUser(orgId, payload)
            } else {
                data = await createUser(payload)
            }
            setSuccessData(data)
            onUserAdded()
        } catch (e: any) {
            toast.error(e.response?.data?.detail || "Failed to add user")
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        onOpenChange(false)
    }

    const roleLabel = role === 'TEACHER' ? 'Teacher' : role === 'STUDENT' ? 'Student' : role === 'DEPT_HEAD' ? 'Dept Head' : 'Admin'
    const level1Label = orgType === 'SCHOOL' ? 'Standard' : 'Department';
    const level2Label = orgType === 'SCHOOL' ? 'Section' : 'Year / Batch';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl rounded-3xl p-0 overflow-hidden gap-0 border-0 shadow-2xl">
                {successData ? (
                    <SuccessView user={successData} onClose={handleClose} />
                ) : (
                    <>
                        <div className="p-8 bg-white border-b border-slate-100">
                            <DialogTitle className="text-2xl font-bold text-slate-900">Add {roleLabel}</DialogTitle>
                            <DialogDescription className="text-slate-500 mt-1">
                                Enter the details to create a new {roleLabel.toLowerCase()} account.
                            </DialogDescription>
                        </div>
                        <div className="p-8 space-y-6 bg-white">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="col-span-2 space-y-2">
                                    <Label className="text-slate-600 font-medium">Full Name <span className="text-red-500">*</span></Label>
                                    <Input
                                        value={formData.full_name}
                                        onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                        placeholder="e.g. John Doe"
                                        className="h-12 rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 bg-slate-50/50"
                                    />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <Label className="text-slate-600 font-medium">Email Address <span className="text-red-500">*</span></Label>
                                    <Input
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="john@example.com"
                                        type="email"
                                        className="h-12 rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 bg-slate-50/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-600 font-medium">Phone Number</Label>
                                    <Input
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="+1 234..."
                                        className="h-12 rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 bg-slate-50/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-600 font-medium">{level1Label}</Label>
                                    <div className="h-12">
                                        <OrgGroupSelector
                                            orgId={orgId}
                                            value={formData.org_group_id}
                                            onChange={(id, name) => setFormData({
                                                ...formData,
                                                org_group_id: id,
                                                department_name: name || ""
                                            })}
                                            labels={{ level1: level1Label, level2: level2Label }}
                                            role={role}
                                        />
                                    </div>
                                </div>
                                {role === 'STUDENT' && (
                                    <>
                                        <div className="space-y-2">
                                            <Label className="text-slate-600 font-medium">Roll Number</Label>
                                            <Input
                                                value={formData.roll_number}
                                                onChange={e => setFormData({ ...formData, roll_number: e.target.value })}
                                                placeholder="101"
                                                className="h-12 rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 bg-slate-50/50"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-slate-600 font-medium">{level2Label}</Label>
                                            <Input
                                                value={formData.year}
                                                onChange={e => setFormData({ ...formData, year: e.target.value })}
                                                placeholder="2025"
                                                className="h-12 rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 bg-slate-50/50"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                        <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100 items-center">
                            <Button variant="ghost" onClick={handleClose} className="h-12 px-6 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200/50">Cancel</Button>
                            <Button onClick={handleSubmit} disabled={loading} className="h-12 px-8 bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white rounded-xl shadow-lg shadow-indigo-500/20 border-0">
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...
                                    </>
                                ) : "Create User"}
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}

function AddUserButton({ role, orgId, orgType, apiMode, onUserAdded }: { role: string, orgId: string, orgType: string, apiMode: string, onUserAdded: () => void }) {
    const [open, setOpen] = useState(false)
    const roleLabel = role === 'TEACHER' ? 'Teacher' : role === 'STUDENT' ? 'Student' : role === 'DEPT_HEAD' ? 'Dept Head' : 'Admin'

    return (
        <>
            <Button onClick={() => setOpen(true)} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl shadow-lg shadow-indigo-500/30 border-0 transition-all duration-300 hover:scale-[1.02]">
                <Plus className="h-4 w-4 mr-2" /> Add New {roleLabel}
            </Button>
            <AddUserModal
                open={open}
                onOpenChange={setOpen}
                role={role}
                orgId={orgId}
                orgType={orgType}
                apiMode={apiMode}
                onUserAdded={onUserAdded}
            />
        </>
    )
}



export function SuccessView({ user, onClose }: { user: any, onClose: () => void }) {
    const [showPassword, setShowPassword] = useState(false)
    const [copied, setCopied] = useState(false)

    const handleCopy = () => {
        if (user.temp_password) {
            navigator.clipboard.writeText(user.temp_password)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
            toast.success("Password copied to clipboard")
        }
    }

    return (
        <div className="p-8 space-y-6">
            <div className="text-center space-y-2">
                <div className="mx-auto w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                    <Check className="h-7 w-7 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">User Added Successfully</h3>
                <p className="text-slate-500">Share these credentials with the user securely.</p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 space-y-4 border border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 gap-x-2 text-sm items-center">
                    <div className="text-slate-500 font-medium">Name</div>
                    <div className="md:col-span-2 font-semibold text-slate-900 text-base">{user.full_name}</div>

                    <div className="text-slate-500 font-medium">Email</div>
                    <div className="md:col-span-2 font-semibold text-slate-900 text-base break-all">{user.email}</div>

                    <div className="text-slate-500 font-medium self-center">Password</div>
                    <div className="md:col-span-2 flex items-center gap-2">
                        <code className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 font-mono text-indigo-600 text-lg font-bold tracking-wider">
                            {showPassword ? user.temp_password : "••••••••"}
                        </code>
                        <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-200" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <EyeOff className="h-4 w-4 text-slate-500" /> : <Eye className="h-4 w-4 text-slate-500" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-200" onClick={() => handleCopy()}>
                                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-slate-500" />}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800 leading-relaxed">
                    <strong>Important:</strong> This temporary password will not be shown again. The user will be required to change it upon their first login.
                </div>
            </div>

            <div className="pt-2">
                <Button onClick={onClose} className="w-full h-11 text-base bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-lg shadow-slate-900/10">
                    Done
                </Button>
            </div>
        </div>
    )
}

function BulkUploadButton({ role, orgId, onSuccess }: { role: string; orgId: string; onSuccess: () => void }) {
    const [open, setOpen] = useState(false)

    return (
        <>
            <Button
                onClick={() => setOpen(true)}
                variant="outline"
                className="border-purple-200 hover:bg-purple-50 hover:border-purple-300 text-purple-700 rounded-xl shadow-sm"
            >
                <Upload className="h-4 w-4 mr-2" />
                Bulk Upload
            </Button>
            <BulkUploadDialog
                open={open}
                onOpenChange={setOpen}
                onSuccess={onSuccess}
                role={role}
                orgId={orgId}
            />
        </>
    )
}
