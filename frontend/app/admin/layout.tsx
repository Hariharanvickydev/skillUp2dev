"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Building2, BookOpen, LogOut, Settings, Shield, Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const { logout, user } = useAuth();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    const navigation = [
        { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Organizations', href: '/admin/organizations', icon: Building2 },
        { name: 'Course Library', href: '/admin/library', icon: BookOpen },
    ];

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-slate-900 text-white relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-20%] w-[80%] h-[40%] bg-indigo-600/20 blur-[100px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-20%] w-[80%] h-[40%] bg-purple-600/20 blur-[100px] rounded-full"></div>
            </div>

            {/* Header */}
            <div className="p-6 relative z-10 border-b border-slate-800/50">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <span className="font-bold text-lg">S</span>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-white">SkillUp2Dev</h1>
                        <p className="text-xs text-slate-400 font-medium tracking-wide">SUPER ADMIN</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2 relative z-10 overflow-y-auto">
                <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-2">Menu</p>
                {navigation.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-900/20"
                                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-slate-500 group-hover:text-white transition-colors")} />
                            {item.name}
                        </Link>
                    );
                })}

                <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-6">Settings</p>
                <Link
                    href="/settings"
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all duration-200"
                >
                    <Settings className="h-5 w-5 text-slate-500" />
                    Settings
                </Link>
            </nav>

            {/* User Profile / Logout */}
            <div className="p-4 border-t border-slate-800/50 relative z-10">
                <div className="bg-slate-800/50 rounded-2xl p-4 backdrop-blur-sm border border-slate-700/50">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold shadow-md">
                            {user?.full_name?.[0] || 'A'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium text-white truncate">{user?.full_name || 'Admin User'}</p>
                            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white text-xs font-semibold transition-all duration-200"
                    >
                        <LogOut className="h-3.5 w-3.5" />
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-slate-50">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-72 h-full shadow-2xl z-20">
                <SidebarContent />
            </aside>

            {/* Mobile Sheet */}
            <Sheet>
                <SheetTrigger asChild className="lg:hidden absolute top-4 left-4 z-50">
                    <Button variant="outline" size="icon" className="bg-white/80 backdrop-blur-md">
                        <Menu className="h-5 w-5" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 border-r-0 w-72">
                    <SidebarContent />
                </SheetContent>
            </Sheet>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto relative w-full">
                {/* Header Decoration */}
                {/* <div className="absolute top-0 left-0 w-full h-64 bg-slate-900/5 -z-10 pointer-events-none"></div> */}

                <div className="h-full w-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
