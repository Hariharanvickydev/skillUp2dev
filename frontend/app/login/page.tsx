"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Loader2, ArrowRight, Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const { login } = useAuth()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setLoading(true)

        try {
            await login(email, password)
        } catch (err: any) {
            setError(err.response?.data?.detail || "Login failed. Please check your credentials.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen w-full flex bg-slate-50">
            {/* Left Col: Brand Panel (Gradient) */}
            <div className="hidden lg:flex flex-col justify-between w-1/2 p-16 bg-gradient-to-br from-indigo-700 via-purple-700 to-orange-600 text-white relative overflow-hidden">
                {/* Texture/Pattern */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>

                <div className="z-10">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg backdrop-blur-md border border-white/20">
                            <div className="h-8 w-8 border-2 border-white rounded flex items-center justify-center font-bold text-lg">S</div>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">SkillUp2Dev</h1>
                    </div>
                </div>

                <div className="z-10 max-w-lg">
                    <h2 className="text-5xl font-bold mb-6 leading-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-orange-100">
                        Empowering <br /> Next-Gen Education.
                    </h2>
                    <p className="text-indigo-100 text-lg leading-relaxed shadow-black drop-shadow-sm">
                        The complete AI-powered learning platform for Colleges and Universities.
                        Transforming how students learn and institutions assess.
                    </p>
                </div>

                <div className="z-10 text-sm text-indigo-200 flex gap-6">
                    <span>© 2025 SkillUp2Dev</span>
                    <span className="opacity-50">|</span>
                    <span>Privacy Policy</span>
                </div>
            </div>

            {/* Right Col: Clean Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
                <div className="w-full max-w-sm space-y-8 animate-in slide-in-from-right-10 duration-500">

                    {/* Mobile Header */}
                    <div className="lg:hidden text-center mb-8">
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-orange-600">SkillUp2Dev</h1>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Welcome Back</h2>
                        <p className="text-base text-slate-500">Sign in to access your learning portal.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Email</label>
                                <Input
                                    type="email"
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="h-12 bg-white border-slate-200 focus:border-orange-500 focus:ring-orange-500/20 rounded-lg text-slate-900 placeholder:text-slate-400"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Password</label>
                                <div className="relative">
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="h-12 bg-white border-slate-200 focus:border-orange-500 focus:ring-orange-500/20 rounded-lg text-slate-900 pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    Sign In <ArrowRight className="h-4 w-4" />
                                </span>
                            )}
                        </Button>
                    </form>

                    <p className="text-center text-sm text-slate-500">
                        Contact your administrator for access.
                    </p>
                </div>
            </div>
        </div>
    )
}
