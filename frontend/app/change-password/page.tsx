"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { changePassword } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Check, Lock, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"

export default function ChangePasswordPage() {
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const { logout } = useAuth() // In case they want to cancel

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (password !== confirmPassword) {
            toast.error("Passwords do not match")
            return
        }
        if (password.length < 8) {
            toast.error("Password must be at least 8 characters")
            return
        }

        setLoading(true)
        try {
            await changePassword(password)
            toast.success("Password changed successfully")
            // Redirect to home/dashboard - AuthContext should handle role-based redirect if we refresh or push
            // But since we are likely already logged in (just forced to reset), we can just go to root
            router.push("/")
        } catch (e: any) {
            toast.error(e.response?.data?.detail || "Failed to change password")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl shadow-indigo-100 border border-slate-100 space-y-8 animate-in zoom-in-95 duration-500">
                <div className="space-y-4 text-center">
                    <div className="h-16 w-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldCheck className="h-8 w-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Change Password</h1>
                    <p className="text-slate-500">
                        For security reasons, you must update your password to continue.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">New Password</label>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Min. 8 characters"
                                className="h-12 bg-slate-50 border-slate-200"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Confirm Password</label>
                            <Input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm your new password"
                                className="h-12 bg-slate-50 border-slate-200"
                                required
                            />
                        </div>
                    </div>

                    <Button type="submit" disabled={loading} className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white text-lg rounded-xl">
                        {loading ? <Loader2 className="animate-spin" /> : "Update Password"}
                    </Button>
                </form>

                <div className="text-center">
                    <button onClick={logout} className="text-sm text-slate-400 hover:text-slate-600">
                        Sign out
                    </button>
                </div>
            </div>
        </div>
    )
}
