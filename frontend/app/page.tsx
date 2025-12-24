"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Loader2 } from "lucide-react"

export default function Home() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login')
        return
      }

      // Redirect based on role to modern dashboards
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
  }, [user, authLoading, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
        <p className="text-slate-500 font-medium tracking-wide">Redirecting to your dashboard...</p>
      </div>
    </div>
  )
}
