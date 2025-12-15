"use client"

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown, ChevronRight, Plus, Folder, FolderOpen, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { getOrgGroupTree } from "@/lib/api"
import { Badge } from "@/components/ui/badge"

interface OrgGroup {
    id: string
    name: string
    type: string
    children?: OrgGroup[]
}

interface OrgGroupSelectorProps {
    orgId?: string
    value?: string
    onChange: (value: string, groupName?: string) => void
    labels?: {
        level1: string
        level2: string
    }
    role?: string // 'TEACHER' | 'STUDENT'
}

export function OrgGroupSelector({ orgId, value, onChange, labels, role }: OrgGroupSelectorProps) {
    const [open, setOpen] = useState(false)
    const [tree, setTree] = useState<OrgGroup[]>([])
    const [loading, setLoading] = useState(false)
    const [selectedGroup, setSelectedGroup] = useState<OrgGroup | null>(null)

    // Flat list for searching (kept for initial lookup but search hidden for now)
    const [flatGroups, setFlatGroups] = useState<{ id: string, group: OrgGroup }[]>([])

    useEffect(() => {
        loadTree()
    }, [orgId])

    useEffect(() => {
        if (value && flatGroups.length > 0) {
            const found = flatGroups.find(g => g.id === value)
            if (found) setSelectedGroup(found.group)
        }
    }, [value, flatGroups])

    const loadTree = async () => {
        setLoading(true)
        try {
            const data = await getOrgGroupTree(orgId)
            setTree(data)

            // Flatten for ID lookup
            const flattened: { id: string, group: OrgGroup }[] = []
            const traverse = (node: OrgGroup) => {
                flattened.push({ id: node.id, group: node })
                if (node.children) node.children.forEach(traverse)
            }
            data.forEach(traverse)
            setFlatGroups(flattened)

        } catch (error) {
            console.error("Failed to load org tree", error)
        } finally {
            setLoading(false)
        }
    }

    const getPlaceholder = () => {
        if (!labels) return "Select Organization Group..."
        if (role === 'TEACHER' || role === 'DEPT_HEAD') return `Select ${labels.level1}...` // e.g. Select Department
        if (role === 'STUDENT') return `Select ${labels.level2}...` // e.g. Select Section / Batch
        return `Select ${labels.level1} or ${labels.level2}...`
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between h-12 rounded-xl bg-white border-slate-200 hover:bg-slate-50 hover:border-indigo-200 transition-all group"
                >
                    {selectedGroup ? (
                        <div className="flex items-center gap-3 truncate">
                            <div className="h-8 w-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                                <FolderOpen className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col items-start truncate text-left">
                                <span className="font-semibold text-slate-700 text-sm leading-none">{selectedGroup.name}</span>
                                <span className="text-xs text-slate-400 mt-1 leading-none">{selectedGroup.type}</span>
                            </div>
                        </div>
                    ) : (
                        <span className="text-slate-500 pl-1 truncate">
                            {getPlaceholder()}
                        </span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 group-hover:text-indigo-500" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0 rounded-xl shadow-xl border-slate-200 overflow-hidden" align="start">
                <div className="bg-slate-50 p-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Organization Structure</span>
                </div>
                <div className="max-h-[300px] overflow-y-auto p-2 bg-white space-y-1">
                    {loading ? (
                        <div className="p-4 text-center text-xs text-slate-400 animate-pulse">Loading hierarchy...</div>
                    ) : tree.length === 0 ? (
                        <div className="p-4 text-center text-sm text-slate-500">No structure groups found.</div>
                    ) : (
                        tree.map(node => (
                            <SelectorNode
                                key={node.id}
                                node={node}
                                selectedId={value}
                                highlightType={role === 'STUDENT' ? 'SECTION' : (role === 'TEACHER' || role === 'DEPT_HEAD') ? 'DEPARTMENT' : undefined}
                                onSelect={(group) => {
                                    onChange(group.id, group.name)
                                    setSelectedGroup(group)
                                    setOpen(false)
                                }}
                            />
                        ))
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
}

function SelectorNode({ node, selectedId, onSelect, highlightType }: { node: OrgGroup, selectedId?: string, highlightType?: string, onSelect: (g: OrgGroup) => void }) {
    const [expanded, setExpanded] = useState(false)
    const hasChildren = node.children && node.children.length > 0
    const isSelected = selectedId === node.id
    const isRecommended = highlightType && node.type.toUpperCase() === highlightType.toUpperCase()

    return (
        <div className="select-none">
            <div
                className={cn(
                    "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors border border-transparent",
                    isSelected ? "bg-indigo-50 border-indigo-100" : "hover:bg-slate-50 border-transparent",
                    !isSelected && isRecommended && "bg-emerald-50/50 border-emerald-100/50" // Subtle hint
                )}
                onClick={() => onSelect(node)}
            >
                <div
                    className="p-1 rounded-md hover:bg-slate-200 text-slate-400 transition-colors z-10"
                    onClick={(e) => {
                        if (hasChildren) {
                            e.stopPropagation()
                            setExpanded(!expanded)
                        }
                    }}
                >
                    {hasChildren ? (
                        expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />
                    ) : <div className="w-3" />}
                </div>

                <div className={cn("h-6 w-6 flex items-center justify-center rounded-md shrink-0", isSelected ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-500")}>
                    {hasChildren ? (expanded ? <FolderOpen className="h-3.5 w-3.5" /> : <Folder className="h-3.5 w-3.5" />) : <div className="h-2 w-2 rounded-full bg-slate-300" />}
                </div>

                <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-medium truncate", isSelected ? "text-indigo-700" : "text-slate-700")}>{node.name}</p>
                    <p className="text-[10px] text-slate-400 capitalize">{node.type.toLowerCase()}</p>
                </div>

                {isRecommended && !isSelected && (
                    <span className="text-[9px] font-bold text-emerald-600 bg-white px-1.5 py-0.5 rounded shadow-sm border border-emerald-100 ml-auto">
                        Recommended
                    </span>
                )}

                {isSelected && <Check className="h-4 w-4 text-indigo-600 ml-auto" />}
            </div>

            {hasChildren && expanded && (
                <div className="pl-4 ml-3 border-l border-slate-100 mt-1 space-y-1">
                    {node.children!.map(child => (
                        <SelectorNode key={child.id} node={child} selectedId={selectedId} onSelect={onSelect} highlightType={highlightType} />
                    ))}
                </div>
            )}
        </div>
    )
}
