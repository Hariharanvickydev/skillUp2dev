"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getOrganizations } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card"

import { ArrowLeft, Plus, Building2, Search, Globe, Users, ShieldCheck, MoreVertical } from "lucide-react"

import { toast } from "sonner"

export default function OrganizationsPage() {
    const router = useRouter()
    const [organizations, setOrganizations] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    // Create Modal State removed
    // const [isCreateOpen, setIsCreateOpen] = useState(false)


    useEffect(() => {
        fetchOrganizations()
    }, [])

    const fetchOrganizations = async () => {
        try {
            const data = await getOrganizations()
            setOrganizations(data)
        } catch (e) {
            console.error(e)
            toast.error("Failed to load organizations")
        } finally {
            setLoading(false)
        }
    }

    // Modal create handler removed


    const filteredOrgs = organizations.filter(org =>
        org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (org.domain && org.domain.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
                    <p className="text-slate-500 font-medium animate-pulse">Loading Organizations...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto p-8 lg:p-12 space-y-10 pb-20">
            {/* Header Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 p-8 text-white shadow-2xl shadow-indigo-900/20">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-80 w-80 rounded-full bg-purple-500/20 blur-3xl"></div>

                <div className="relative z-10 space-y-8">
                    {/* Top Row */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-200 mb-2">
                                Organizations
                            </h1>
                            <p className="text-indigo-200 text-lg max-w-2xl">
                                Manage educational institutions and monitor usage.
                            </p>
                        </div>
                        <Button
                            onClick={() => router.push('/admin/organizations/create')}
                            className="bg-white text-indigo-900 hover:bg-indigo-50 font-semibold px-6 h-12 rounded-xl shadow-lg shadow-black/10 transition-all hover:scale-105"
                        >
                            <Plus className="mr-2 h-5 w-5" />
                            New Organization
                        </Button>
                    </div>

                    {/* Integrated Search Bar */}
                    <div className="max-w-2xl">
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300 group-focus-within:text-white transition-colors">
                                <Search className="h-5 w-5" />
                            </div>
                            <Input
                                placeholder="Search by name or domain..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-12 h-14 bg-white/10 hover:bg-white/15 focus:bg-white/20 border-white/10 focus:border-white/30 text-white placeholder:text-indigo-200/60 rounded-2xl backdrop-blur-md transition-all duration-300 focus-visible:ring-offset-0 focus-visible:ring-0 shadow-lg shadow-indigo-900/10"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="relative z-20">
                {/* Content */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-40">
                        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mb-4"></div>
                        <p className="text-slate-500 font-medium">Loading Organizations...</p>
                    </div>
                ) : (
                    <>
                        {/* Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredOrgs.map((org) => (
                                <div
                                    key={org.id}
                                    onClick={() => router.push(`/admin/organizations/${org.id}`)}
                                    className="group relative bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
                                >
                                    {/* Card Decoration */}
                                    <div className="absolute top-0 right-0 -mr-8 -mt-8 h-24 w-24 rounded-full bg-gradient-to-br from-indigo-50 to-purple-50 group-hover:from-indigo-100 group-hover:to-purple-100 transition-colors"></div>

                                    <div className="relative z-10">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/50 border border-slate-100 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
                                                <Building2 className="h-7 w-7 text-indigo-600" />
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-xs font-bold border ${org.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                                                {org.is_active ? 'Active' : 'Inactive'}
                                            </div>
                                        </div>

                                        <h3 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-indigo-700 transition-colors">{org.name}</h3>
                                        {org.domain ? (
                                            <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-6">
                                                <Globe className="h-3.5 w-3.5 text-indigo-400" />
                                                <span>{org.domain}</span>
                                            </div>
                                        ) : (
                                            <div className="h-5 mb-6 text-sm text-slate-400 italic">No domain configured</div>
                                        )}

                                        <div className="flex items-center gap-4 pt-4 border-t border-slate-50">
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <Users className="h-4 w-4 text-slate-400" />
                                                <span className="font-semibold">{org.users?.length || 0}</span> Users
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <ShieldCheck className="h-4 w-4 text-slate-400" />
                                                <span className="font-semibold">Standard</span> Plan
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {filteredOrgs.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                                <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                    <Building2 className="h-10 w-10 text-slate-300" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">No organizations found</h3>
                                <p className="text-slate-500 max-w-sm text-center mb-6">We couldn't find any organizations matching your search criteria.</p>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setSearchQuery("")
                                        // Optionally set focus to search ?
                                    }}
                                    className="border-slate-200"
                                >
                                    Clear Search
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>


        </div>
    )
}
