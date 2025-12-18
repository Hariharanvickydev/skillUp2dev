"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, LogOut, Menu, BookOpen, GraduationCap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function StudentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const { logout, user } = useAuth();
    const router = useRouter();
    const [isCollapsed, setIsCollapsed] = React.useState(false);

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    const navigation = [
        { name: 'My Learning', href: '/learn', icon: BookOpen },
        // Add more later: Achievements, Profile, etc.
    ];

    const SidebarContent = ({ collapsed = false }: { collapsed?: boolean }) => (
        <div className="flex flex-col h-full bg-slate-900 text-white relative overflow-hidden transition-all duration-300">
            {/* Background Effects (Matching Org Admin) */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-20%] w-[80%] h-[40%] bg-indigo-600/20 blur-[100px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-20%] w-[80%] h-[40%] bg-purple-600/20 blur-[100px] rounded-full"></div>
            </div>

            {/* Header */}
            <div className={cn("relative z-10 border-b border-slate-800/50 flex flex-col justify-center", collapsed ? "p-4 items-center h-20" : "p-6 h-24")}>
                <div className="flex items-center gap-3 transition-all duration-300">
                    <div className={cn("bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 transition-all duration-300", collapsed ? "h-10 w-10 min-w-[2.5rem]" : "h-10 w-10")}>
                        <GraduationCap className="h-6 w-6 text-white" />
                    </div>
                    {!collapsed && (
                        <div className="transition-opacity duration-300 opacity-100 whitespace-nowrap overflow-hidden">
                            <h1 className="text-xl font-bold tracking-tight text-white">SkillUp2Dev</h1>
                            <p className="text-xs text-slate-400 font-medium tracking-wide">STUDENT PORTAL</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-2 relative z-10 overflow-y-auto overflow-x-hidden">
                {!collapsed && <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-2 transition-opacity duration-300">Menu</p>}
                {navigation.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/learn' && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            title={collapsed ? item.name : undefined}
                            className={cn(
                                "flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 group relative",
                                isActive
                                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-900/20"
                                    : "text-slate-400 hover:bg-white/5 hover:text-white",
                                collapsed && "justify-center"
                            )}
                        >
                            <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-white" : "text-slate-500 group-hover:text-white transition-colors")} />
                            {!collapsed && <span className="whitespace-nowrap overflow-hidden transition-all duration-300">{item.name}</span>}

                            {collapsed && (
                                <div className="absolute left-14 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap shadow-xl border border-slate-700">
                                    {item.name}
                                </div>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* User Profile / Logout */}
            <div className="p-3 border-t border-slate-800/50 relative z-10">
                <div className={cn("bg-slate-800/50 rounded-2xl p-3 backdrop-blur-sm border border-slate-700/50 transition-all duration-300", collapsed && "p-2 bg-transparent border-0")}>
                    <div className={cn("flex items-center gap-3 mb-3", collapsed && "justify-center mb-0")}>
                        <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold shadow-md">
                            {user?.full_name?.[0] || 'S'}
                        </div>
                        {!collapsed && (
                            <div className="overflow-hidden transition-all duration-300">
                                <p className="text-sm font-medium text-white truncate max-w-[140px]">{user?.full_name || 'Student'}</p>
                                <p className="text-xs text-slate-400 truncate max-w-[140px]">{user?.email}</p>
                            </div>
                        )}
                    </div>
                    {!collapsed ? (
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white text-xs font-semibold transition-all duration-200 whitespace-nowrap"
                        >
                            <LogOut className="h-3.5 w-3.5" />
                            Sign Out
                        </button>
                    ) : (
                        <button
                            onClick={handleLogout}
                            title="Sign Out"
                            className="w-full flex items-center justify-center py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-200 group relative"
                        >
                            <LogOut className="h-4 w-4" />
                            <div className="absolute left-14 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap shadow-xl border border-slate-700">
                                Sign Out
                            </div>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-slate-50">
            {/* Desktop Sidebar */}
            <aside
                className={cn(
                    "hidden lg:block h-full shadow-2xl z-20 transition-all duration-300 ease-in-out relative",
                    isCollapsed ? "w-20" : "w-72"
                )}
            >
                <SidebarContent collapsed={isCollapsed} />

                {/* Toggle Button */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-3 top-9 bg-white text-slate-600 hover:text-indigo-600 border border-slate-200 rounded-full p-1 shadow-md hover:shadow-lg transition-all z-50"
                    title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                >
                    {isCollapsed ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-right"><path d="m9 18 6-6-6-6" /></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-left"><path d="m15 18-6-6 6-6" /></svg>
                    )}
                </button>
            </aside>

            {/* Mobile Sheet */}
            <Sheet>
                <SheetTrigger asChild className="lg:hidden absolute top-4 left-4 z-50">
                    <Button variant="outline" size="icon" className="bg-white/80 backdrop-blur-md">
                        <Menu className="h-5 w-5" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 border-r-0 w-72">
                    <SidebarContent collapsed={false} />
                </SheetContent>
            </Sheet>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto relative w-full transition-all duration-300">
                <div className="h-full w-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
