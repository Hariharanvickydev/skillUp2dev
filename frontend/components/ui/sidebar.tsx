"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import { LayoutDashboard, Library, Settings, BookOpen, Building2, Globe } from "lucide-react"

const getSidebarItems = (role?: string) => {
    const items = [
        { name: "Dashboard", href: "/", icon: LayoutDashboard },
        // { name: "My Library", href: "/library", icon: Library }, // Replaced logic below
    ]

    if (role === 'SUPER_ADMIN') {
        items.push({ name: "Organizations", href: "/admin/organizations", icon: Building2 })
        items.push({ name: "Central Library", href: "/library?view=central", icon: Globe })
    }

    // Everyone has personal library/courses, maybe call it differently?
    items.push({ name: "My Courses", href: "/library", icon: BookOpen })

    items.push({ name: "Settings", href: "/settings", icon: Settings })

    return items
}

export function Sidebar({ className }: { className?: string }) {
    const pathname = usePathname()
    const { user } = useAuth()
    const sidebarItems = getSidebarItems(user?.role)

    return (
        <div className={cn("h-full flex flex-col bg-white border-r border-slate-200", className)}>
            <div className="flex h-16 items-center border-b border-slate-200 px-6">
                <Link className="flex items-center gap-2 font-semibold" href="/">
                    {/* Placeholder Logo Icon */}
                    <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                        SD
                    </div>
                    <span className="text-xl font-bold tracking-tight text-slate-900">
                        SkillUp2Dev
                    </span>
                </Link>
            </div>
            <div className="flex-1 overflow-auto py-6">
                <nav className="grid items-start px-4 text-sm font-medium gap-2">
                    {sidebarItems.map((item, index) => {
                        const isActive = pathname === item.href || (item.name === "Central Library" && pathname === "/library" && typeof window !== 'undefined' && window.location.search.includes("view=central"))
                        return (
                            <Link
                                key={index}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200",
                                    isActive
                                        ? "bg-indigo-50 text-indigo-600 font-semibold shadow-sm border border-indigo-100"
                                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                                )}
                            >
                                <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive ? "text-indigo-600" : "text-slate-400")} />
                                <span>{item.name}</span>
                            </Link>
                        )
                    })}
                </nav>
            </div>
            <div className="border-t border-slate-200 p-4">
                <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-xs font-semibold text-slate-900 mb-1">Need Help?</p>
                    <p className="text-xs text-slate-500 mb-3">Check our documentation or contact support.</p>
                    <button className="text-xs font-semibold text-indigo-600 hover:underline">Documentation &rarr;</button>
                </div>
                <p className="text-xs text-center text-slate-400 mt-4">© 2025 SkillUp2Dev v2.0</p>
            </div>
        </div>
    )
}
