"use client"

import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { useEffect, ReactNode } from "react"
import { Loader2 } from "lucide-react"

interface RoleGuardProps {
    children: ReactNode
    allowedRoles: string[]
    redirectTo?: string
}

export function RoleGuard({ children, allowedRoles, redirectTo }: RoleGuardProps) {
    const { user, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/login')
                return
            }

            if (!allowedRoles.includes(user.role)) {
                // Determine sensible fallback if no redirectTo provided
                if (redirectTo) {
                    router.push(redirectTo)
                } else {
                    // Role-based default fallback
                    const role = user.role
                    if (role === 'SUPER_ADMIN') {
                        router.push('/admin/dashboard')
                    } else if (role === 'ORG_ADMIN') {
                        router.push('/org/dashboard')
                    } else if (role === 'DEPT_HEAD') {
                        router.push('/org/hod/dashboard')
                    } else if (role === 'TEACHER') {
                        router.push('/org/teacher/dashboard')
                    } else {
                        router.push('/learn')
                    }
                }
            }
        }
    }, [user, loading, allowedRoles, router, redirectTo])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                    <p className="text-slate-500 font-medium tracking-wide">Verifying access...</p>
                </div>
            </div>
        )
    }

    if (!user || !allowedRoles.includes(user.role)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                    <p className="text-slate-500 font-medium tracking-wide">Redirecting...</p>
                </div>
            </div>
        )
    }

    return <>{children}</>
}
