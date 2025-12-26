"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { RoleGuard } from '@/components/RoleGuard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, Filter, Search, BookOpen, AlertCircle, HelpCircle } from 'lucide-react';
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function HODApprovalsPage() {
    const { token, user } = useAuth();
    const router = useRouter();
    const [approvals, setApprovals] = useState<any[]>([]);
    const [filteredApprovals, setFilteredApprovals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [deptFilter, setDeptFilter] = useState("ALL");
    const [groupTree, setGroupTree] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            if (!token) return;
            try {
                // Parallel fetch
                const [approvalsRes, groupsRes] = await Promise.all([
                    axios.get(`${API_URL}/org/dashboard/approvals`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    axios.get(`${API_URL}/org/groups/tree`, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                ]);

                setApprovals(approvalsRes.data);
                setFilteredApprovals(approvalsRes.data);
                setGroupTree(groupsRes.data);

            } catch (error) {
                console.error("Failed to fetch data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [token]);

    // Handle Filtering
    useEffect(() => {
        let result = approvals;

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(item =>
                item.title.toLowerCase().includes(query) ||
                item.course_title.toLowerCase().includes(query) ||
                item.teacher_name.toLowerCase().includes(query)
            );
        }

        if (deptFilter !== "ALL") {
            // Recursive check: does the item's department_id belong to the selected group OR its children?
            // First, find the selected group node in the tree
            const findNodeAndChildren = (nodes: any[], targetId: string): string[] => {
                let foundIds: string[] = [];
                for (const node of nodes) {
                    if (node.id === targetId) {
                        // Found it! Collect all descendant IDs
                        const collectIds = (n: any) => {
                            foundIds.push(n.id);
                            if (n.children) n.children.forEach(collectIds);
                        };
                        collectIds(node);
                        return foundIds;
                    }
                    if (node.children) {
                        const childResult = findNodeAndChildren(node.children, targetId);
                        if (childResult.length > 0) return childResult;
                    }
                }
                return [];
            };

            const relevantIds = findNodeAndChildren(groupTree, deptFilter);
            if (relevantIds.length > 0) {
                result = result.filter(item => {
                    if (!item.department_id) return false;
                    return relevantIds.includes(String(item.department_id));
                });
            } else {
                // Fallback (exact match if tree find fails)
                result = result.filter(item => String(item.department_id) === deptFilter);
            }
        }

        setFilteredApprovals(result);
    }, [searchQuery, deptFilter, approvals, groupTree]);

    // Helper to render tree options (Top Level Only)
    const renderGroupOptions = (groups: any[]): React.ReactNode[] => {
        return groups.map(group => (
            <SelectItem key={group.id} value={group.id} className="cursor-pointer">
                <span className="truncate block max-w-[180px]" title={group.name}>
                    {group.name}
                </span>
            </SelectItem>
        ));
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
                    <p className="text-slate-500 font-medium animate-pulse">Loading Approval Queue...</p>
                </div>
            </div>
        );
    }

    return (
        <RoleGuard allowedRoles={['ORG_ADMIN', 'DEPT_HEAD', 'SUPER_ADMIN']}>
            <div className="min-h-screen bg-slate-50 p-8 lg:p-12">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.push(user?.role === 'ORG_ADMIN' ? '/org/dashboard' : '/org/hod/dashboard')}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">Approval Queue</h1>
                            <p className="text-slate-500">Review pending questions and topics from your department.</p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search topics, teachers, or courses..."
                                className="pl-10 bg-slate-50 border-slate-200"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <Filter className="h-4 w-4 text-slate-500" />
                            {user?.role === 'ORG_ADMIN' && (
                                <Select value={deptFilter} onValueChange={setDeptFilter}>
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue placeholder="Filter by Department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">All Departments</SelectItem>
                                        {renderGroupOptions(groupTree)}
                                    </SelectContent>
                                </Select>
                            )}
                            {/* If HOD, just show a label or nothing? Maybe nothing as per request. */}
                        </div>
                    </div>

                    {/* List */}
                    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                        {filteredApprovals.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 font-medium uppercase text-xs">
                                        <tr>
                                            <th className="px-6 py-4">Item Details</th>
                                            <th className="px-6 py-4">Context</th>
                                            <th className="px-6 py-4">Submitted By</th>
                                            <th className="px-6 py-4 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredApprovals.map((item: any) => (
                                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${item.type === 'QUESTION' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                                            {item.type === 'QUESTION' ? <HelpCircle className="h-5 w-5" /> : <BookOpen className="h-5 w-5" />}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-slate-900">{item.title}</p>
                                                            <p className="text-xs text-slate-500">
                                                                {item.type === 'QUESTION' ? 'Question' : 'Topic'} • Submitted {new Date(item.created_at).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="font-medium text-slate-700">{item.course_title}</p>
                                                    <p className="text-xs text-slate-500">ID: {item.course_id.slice(0, 8)}...</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-6 w-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold">
                                                            {item.teacher_name?.[0] || 'U'}
                                                        </div>
                                                        <div>
                                                            <p className="text-slate-900 font-medium">{item.teacher_name}</p>
                                                            <p className="text-xs text-slate-500">{item.department_name}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Button
                                                        size="sm"
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            if (!item.course_id) return;
                                                            if (item.type === 'QUESTION') {
                                                                router.push(`/org/courses/${item.course_id}?tab=questions`)
                                                            } else {
                                                                router.push(`/org/courses/${item.course_id}/topic/${item.id}`)
                                                            }
                                                        }}
                                                        className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                                                    >
                                                        Review
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-12 flex flex-col items-center justify-center text-center">
                                <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                    <CheckCircle className="h-8 w-8 text-slate-300" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">No pending approvals found</h3>
                                <p className="text-slate-500 max-w-sm mt-2">
                                    {searchQuery || deptFilter !== "ALL" ? "Try adjusting your filters." : "You're all caught up!"}
                                </p>
                                {(searchQuery || deptFilter !== "ALL") && (
                                    <Button
                                        variant="ghost"
                                        onClick={() => { setSearchQuery(""); setDeptFilter("ALL") }}
                                        className="mt-2 text-indigo-600 hover:bg-indigo-50"
                                    >
                                        Clear Filters
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </RoleGuard>
    )
}
