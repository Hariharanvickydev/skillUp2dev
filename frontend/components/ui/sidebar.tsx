"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/components/ui/button"
import { LayoutDashboard, Library, Settings, BookOpen } from "lucide-react"

const sidebarItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "My Library", href: "/library", icon: Library }, // Placeholder
    { name: "Settings", href: "/settings", icon: Settings }, // Placeholder
]

export function Sidebar({ className }: { className?: string }) {
    const pathname = usePathname()

    return (
        <div className={cn("h-full flex flex-col bg-white", className)}>
            <div className="flex h-14 items-center border-b px-6">
                <Link className="flex items-center gap-2 font-semibold" href="/">
                    <BookOpen className="h-6 w-6 text-indigo-600" />
                    <span className="whitespace-nowrap text-lg">SkillUp2Dev</span>
                </Link>
            </div>
            <div className="flex-1 overflow-auto py-4">
                <nav className="grid items-start px-4 text-sm font-medium gap-2">
                    {sidebarItems.map((item, index) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={index}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all hover:text-indigo-600",
                                    isActive ? "bg-indigo-50 text-indigo-600 font-semibold shadow-sm" : "text-slate-500 hover:bg-slate-50"
                                )}
                            >
                                <item.icon className="h-4 w-4 flex-shrink-0" />
                                <span>{item.name}</span>
                            </Link>
                        )
                    })}
                </nav>
            </div>
            <div className="border-t p-4">
                {/* Footer area if needed */}
                <p className="text-xs text-center text-slate-400">© 2025 SkillUp2Dev</p>
            </div>
        </div>
    )
}
