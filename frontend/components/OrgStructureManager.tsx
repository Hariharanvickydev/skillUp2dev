"use client"

import { useState, useEffect } from "react"
import { getOrgGroupTree, createOrgGroup, deleteOrgGroup } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Trash2, ChevronRight, ChevronDown, Folder, FolderOpen, Layers } from "lucide-react"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface OrgGroup {
    id: string
    name: string
    type: string
    children?: OrgGroup[]
}

interface OrgStructureManagerProps {
    orgId?: string
    orgType?: string // 'COLLEGE' | 'SCHOOL'
}

export function OrgStructureManager({ orgId, orgType = 'COLLEGE' }: OrgStructureManagerProps) {
    const [tree, setTree] = useState<OrgGroup[]>([])
    const [loading, setLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)

    // Create State
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [createParentId, setCreateParentId] = useState<string | null>(null)
    const [newGroupName, setNewGroupName] = useState("")
    const [newGroupType, setNewGroupType] = useState("GROUP") // Default
    const [creating, setCreating] = useState(false)

    useEffect(() => {
        loadTree()
    }, [orgId])

    const loadTree = async () => {
        setLoading(true)
        setErrorMsg(null)
        try {
            console.log("Fetching tree for org:", orgId)
            const data = await getOrgGroupTree(orgId)
            console.log("Tree data received:", data)
            setTree(data)
        } catch (error: any) {
            console.error(error)
            setErrorMsg(error.message || "Unknown error")
            toast.error("Failed to load structure")
        } finally {
            setLoading(false)
        }
    }

    const openCreate = (parentId: string | null, suggestedType: string) => {
        setCreateParentId(parentId)
        setNewGroupType(suggestedType)
        setNewGroupName("")
        setIsCreateOpen(true)
    }

    const handleCreate = async () => {
        if (!newGroupName) return
        setCreating(true)
        try {
            await createOrgGroup({
                name: newGroupName,
                type: newGroupType,
                parent_id: createParentId
            }, orgId)

            toast.success("Group created")
            setIsCreateOpen(false)
            loadTree()
        } catch (e) {
            toast.error("Failed to create group")
        } finally {
            setCreating(false)
        }
    }

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"? All sub-groups will also be deleted.`)) return
        try {
            await deleteOrgGroup(id)
            toast.success("Group deleted")
            loadTree()
        } catch (e) {
            toast.error("Failed to delete group")
        }
    }

    // Heuristics for next level type
    const getNextType = (currentType: string) => {
        if (orgType === 'SCHOOL') {
            if (currentType === 'DEPARTMENT') return 'STANDARD' // School usually -> Standard
            if (currentType === 'STANDARD') return 'SECTION'
            return 'GROUP'
        } else {
            // College
            if (currentType === 'DEPARTMENT') return 'YEAR' // Dept -> Year/Batch
            if (currentType === 'YEAR') return 'SECTION'
            return 'GROUP'
        }
    }

    const getRootType = () => {
        return orgType === 'SCHOOL' ? 'STANDARD' : 'DEPARTMENT'
    }

    // if (loading && tree.length === 0) return <div className="p-8 text-center text-slate-500">Loading structure...</div>

    if (errorMsg) return (
        <div className="p-8 text-center text-red-500 bg-red-50 rounded-xl border border-red-200">
            <p className="font-bold">Error loading structure:</p>
            <p className="text-sm font-mono mt-2">{errorMsg}</p>
            <Button variant="outline" onClick={loadTree} className="mt-4">Retry</Button>
        </div>
    )

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                    <h3 className="text-lg font-semibold text-slate-800">Organization Structure</h3>
                    <p className="text-sm text-slate-500">Define your hierarchy (Departments, Batches, Sections) here.</p>
                </div>
                <Button onClick={() => openCreate(null, getRootType())} className="bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 shadow-sm">
                    <Plus className="h-4 w-4 mr-2" /> Add {getRootType().toLowerCase().replace(/^\w/, c => c.toUpperCase())}
                </Button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 min-h-[400px]">
                {tree.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-20 text-slate-400">
                        <Layers className="h-12 w-12 mb-4 opacity-50" />
                        <p>No structure defined yet.</p>
                        <Button variant="ghost" onClick={() => openCreate(null, getRootType())} className="text-indigo-600 hover:bg-indigo-50">
                            Create your first {getRootType().toLowerCase()}
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {tree.map(node => (
                            <TreeNode
                                key={node.id}
                                node={node}
                                onAddChild={(id, type) => openCreate(id, getNextType(type))}
                                onDelete={(id, name) => handleDelete(id, name)}
                            />
                        ))}
                    </div>
                )}
            </div>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add {createParentId ? 'Sub-Group' : 'Root Group'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input
                                placeholder={newGroupType === 'SECTION' ? 'e.g. A, B, C' : newGroupType === 'YEAR' ? 'e.g. 1st Year, 2024' : 'e.g. Science, Computer Science'}
                                value={newGroupName}
                                onChange={e => setNewGroupName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Type</Label>
                            <Select value={newGroupType} onValueChange={setNewGroupType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="DEPARTMENT">Department</SelectItem>
                                    <SelectItem value="STANDARD">Standard</SelectItem>
                                    <SelectItem value="YEAR">Year/Batch</SelectItem>
                                    <SelectItem value="SECTION">Section</SelectItem>
                                    <SelectItem value="GROUP">Group (Generic)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={creating || !newGroupName} className="bg-indigo-600 text-white">
                            {creating ? 'Creating...' : 'Create'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function TreeNode({ node, onAddChild, onDelete }: { node: OrgGroup, onAddChild: (id: string, type: string) => void, onDelete: (id: string, name: string) => void }) {
    const [expanded, setExpanded] = useState(true)
    const hasChildren = node.children && node.children.length > 0

    return (
        <div className="flex flex-col">
            <div className="flex items-center group py-2 px-2 hover:bg-slate-50 rounded-lg transition-colors">
                <button
                    onClick={() => setExpanded(!expanded)}
                    className={`p-1 rounded text-slate-400 hover:text-indigo-600 transition-colors ${hasChildren ? 'visible' : 'invisible'}`}
                >
                    {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>

                <div className="mr-3 text-indigo-500">
                    {hasChildren ? (expanded ? <FolderOpen className="h-5 w-5" /> : <Folder className="h-5 w-5" />) : <Folder className="h-5 w-5 text-slate-300" />}
                </div>

                <div className="flex-1 flex items-center gap-3">
                    <span className="font-medium text-slate-700">{node.name}</span>
                    <span className="text-[10px] font-bold tracking-wider text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase">{node.type}</span>
                </div>

                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-2 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={() => onAddChild(node.id, node.type)} className="h-7 w-7 text-emerald-600 hover:bg-emerald-50" title="Add Child">
                        <Plus className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(node.id, node.name)} className="h-7 w-7 text-red-400 hover:bg-red-50 hover:text-red-600" title="Delete">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {hasChildren && expanded && (
                <div className="pl-6 border-l border-slate-100 ml-4">
                    {node.children!.map(child => (
                        <TreeNode key={child.id} node={child} onAddChild={onAddChild} onDelete={onDelete} />
                    ))}
                </div>
            )}
        </div>
    )
}
