"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createOrganization } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Loader2, ArrowLeft, Building2, Shield, Settings, CheckCircle, Globe, MapPin, Mail, Phone, Lock, Sparkles } from "lucide-react"

export default function CreateOrganizationPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        // Basic Info
        name: "",
        code: "",
        type: "College",
        domain: "",
        logo_url: "",
        status: "ACTIVE",
        address: "",
        city: "",
        state: "",
        country: "",
        contact_email: "",
        contact_phone: "",

        // Admin Info
        admin_name: "",
        admin_email: "",
        admin_phone: "",
        admin_password: "",

        // System Limits
        max_students: 50,
        max_teachers: 5,
        max_courses: 5,
        ai_credits_limit: 1000
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        // Handle number inputs
        if (["max_students", "max_teachers", "max_courses", "ai_credits_limit"].includes(name)) {
            setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }))
        } else {
            setFormData(prev => ({ ...prev, [name]: value }))
        }
    }

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // Basic validation
            if (!formData.name || !formData.code || !formData.admin_email || !formData.admin_password) {
                toast.error("Please fill in all required fields")
                setLoading(false)
                return
            }

            await createOrganization(formData)
            toast.success("Organization created successfully!")

            // Redirect to list
            router.push("/admin/organizations")
        } catch (error: any) {
            console.error(error)
            toast.error(error.response?.data?.detail || "Failed to create organization")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-7xl mx-auto p-8 lg:p-12 space-y-10 pb-20">
            {/* Header Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 p-8 text-white shadow-2xl shadow-indigo-900/20">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-80 w-80 rounded-full bg-purple-500/20 blur-3xl"></div>

                <div className="relative z-10">
                    <Button variant="ghost" onClick={() => router.back()} className="text-indigo-200 hover:text-white hover:bg-white/10 mb-6 -ml-4">
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Organizations
                    </Button>

                    <div className="flex items-center gap-6">
                        <div className="h-20 w-20 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-xl flex items-center justify-center shadow-2xl">
                            <Building2 className="h-10 w-10 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Create Organization</h1>
                            <p className="text-indigo-200 text-lg">Onboard a new educational institution to the platform.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="relative z-20 space-y-8">
                <form onSubmit={handleSubmit} className="space-y-8 animate-in slide-in-from-bottom-5 duration-500">

                    {/* Basic Info Card */}
                    <Card className="bg-white rounded-3xl shadow-xl shadow-indigo-900/5 border-slate-100 overflow-hidden">
                        <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                        <CardHeader className="bg-slate-50 border-b border-slate-100 pb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-indigo-50 rounded-xl">
                                    <Building2 className="h-6 w-6 text-indigo-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl">Institution Profile</CardTitle>
                                    <CardDescription>Essential details and contact information.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
                            <div className="col-span-1 md:col-span-2 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-slate-700 font-semibold">Organization Name <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="name" name="name"
                                            placeholder="e.g. SRM Institute of Science and Technology"
                                            value={formData.name} onChange={handleChange} required
                                            className="h-12 bg-slate-50 border-slate-200 focus:bg-white transition-colors rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="code" className="text-slate-700 font-semibold">Organization Code <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="code" name="code"
                                            placeholder="e.g. SRM (Unique)"
                                            value={formData.code} onChange={handleChange} required
                                            className="h-12 bg-slate-50 border-slate-200 focus:bg-white transition-colors rounded-xl font-mono uppercase"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="type" className="text-slate-700 font-semibold">Type</Label>
                                <Select name="type" defaultValue={formData.type} onValueChange={(v) => handleSelectChange("type", v)}>
                                    <SelectTrigger className="h-12 bg-slate-50 border-slate-200 focus:bg-white transition-colors rounded-xl">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="College">College</SelectItem>
                                        <SelectItem value="University">University</SelectItem>
                                        <SelectItem value="Training Center">Training Center</SelectItem>
                                        <SelectItem value="School">School</SelectItem>
                                        <SelectItem value="Corporate">Corporate</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="domain" className="text-slate-700 font-semibold">Domain (Optional)</Label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="domain" name="domain"
                                        placeholder="srm.edu.in"
                                        value={formData.domain} onChange={handleChange}
                                        className="h-12 pl-10 bg-slate-50 border-slate-200 focus:bg-white transition-colors rounded-xl"
                                    />
                                </div>
                            </div>

                            <Separator className="col-span-1 md:col-span-2 my-2 bg-slate-100" />

                            <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2 md:col-span-3">
                                    <Label htmlFor="address" className="text-slate-700 font-semibold">Address</Label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input id="address" name="address" placeholder="Street Address" value={formData.address} onChange={handleChange} className="h-12 pl-10 bg-slate-50 border-slate-200 focus:bg-white transition-colors rounded-xl" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="city" className="text-slate-700 font-semibold">City</Label>
                                    <Input id="city" name="city" placeholder="City" value={formData.city} onChange={handleChange} className="h-12 bg-slate-50 border-slate-200 focus:bg-white transition-colors rounded-xl" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="state" className="text-slate-700 font-semibold">State</Label>
                                    <Input id="state" name="state" placeholder="State" value={formData.state} onChange={handleChange} className="h-12 bg-slate-50 border-slate-200 focus:bg-white transition-colors rounded-xl" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="country" className="text-slate-700 font-semibold">Country</Label>
                                    <Input id="country" name="country" placeholder="Country" value={formData.country} onChange={handleChange} className="h-12 bg-slate-50 border-slate-200 focus:bg-white transition-colors rounded-xl" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="contact_email" className="text-slate-700 font-semibold">Public Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input id="contact_email" name="contact_email" type="email" placeholder="contact@srm.edu" value={formData.contact_email} onChange={handleChange} className="h-12 pl-10 bg-slate-50 border-slate-200 focus:bg-white transition-colors rounded-xl" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contact_phone" className="text-slate-700 font-semibold">Public Phone</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input id="contact_phone" name="contact_phone" placeholder="+91 98765 43210" value={formData.contact_phone} onChange={handleChange} className="h-12 pl-10 bg-slate-50 border-slate-200 focus:bg-white transition-colors rounded-xl" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Admin Info Card */}
                        <Card className="bg-white rounded-3xl shadow-xl shadow-indigo-900/5 border-slate-100 overflow-hidden h-full">
                            <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                            <CardHeader className="bg-slate-50 border-b border-slate-100 pb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-emerald-50 rounded-xl">
                                        <Shield className="h-6 w-6 text-emerald-600" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl">Admin Account</CardTitle>
                                        <CardDescription>First administrator credentials.</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="admin_name" className="text-slate-700 font-semibold">Admin Name <span className="text-red-500">*</span></Label>
                                    <Input id="admin_name" name="admin_name" placeholder="Full Name" value={formData.admin_name} onChange={handleChange} required className="h-12 bg-slate-50 border-slate-200 focus:bg-white transition-colors rounded-xl" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="admin_email" className="text-slate-700 font-semibold">Admin Email <span className="text-red-500">*</span></Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input id="admin_email" name="admin_email" type="email" placeholder="admin@srm.edu" value={formData.admin_email} onChange={handleChange} required className="h-12 pl-10 bg-slate-50 border-slate-200 focus:bg-white transition-colors rounded-xl" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="admin_phone" className="text-slate-700 font-semibold">Admin Phone</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input id="admin_phone" name="admin_phone" placeholder="Mobile Number" value={formData.admin_phone} onChange={handleChange} className="h-12 pl-10 bg-slate-50 border-slate-200 focus:bg-white transition-colors rounded-xl" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="admin_password" className="text-slate-700 font-semibold">Initial Password <span className="text-red-500">*</span></Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input id="admin_password" name="admin_password" type="text" placeholder="Set a strong password" value={formData.admin_password} onChange={handleChange} required className="h-12 pl-10 font-mono bg-slate-50 border-slate-200 focus:bg-white transition-colors rounded-xl" />
                                    </div>
                                    <p className="text-xs text-indigo-500 font-medium bg-indigo-50 inline-block px-2 py-1 rounded">⚠ Share this password securely with the admin.</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* System Settings Card */}
                        <Card className="bg-white rounded-3xl shadow-xl shadow-indigo-900/5 border-slate-100 overflow-hidden h-full">
                            <div className="h-2 bg-gradient-to-r from-slate-500 to-slate-700"></div>
                            <CardHeader className="bg-slate-50 border-b border-slate-100 pb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-slate-100 rounded-xl">
                                        <Settings className="h-6 w-6 text-slate-600" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl">System Limits</CardTitle>
                                        <CardDescription>Configure resource allocation.</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8 grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="max_students" className="text-slate-700 font-semibold">Max Students</Label>
                                    <Input id="max_students" name="max_students" type="number" min="1" value={formData.max_students} onChange={handleChange} className="h-12 bg-slate-50 border-slate-200 focus:bg-white transition-colors rounded-xl" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="max_teachers" className="text-slate-700 font-semibold">Max Teachers</Label>
                                    <Input id="max_teachers" name="max_teachers" type="number" min="1" value={formData.max_teachers} onChange={handleChange} className="h-12 bg-slate-50 border-slate-200 focus:bg-white transition-colors rounded-xl" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="max_courses" className="text-slate-700 font-semibold">Max Courses</Label>
                                    <Input id="max_courses" name="max_courses" type="number" min="1" value={formData.max_courses} onChange={handleChange} className="h-12 bg-slate-50 border-slate-200 focus:bg-white transition-colors rounded-xl" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="ai_credits_limit" className="text-slate-700 font-semibold">AI Credits</Label>
                                    <div className="relative">
                                        <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500" />
                                        <Input id="ai_credits_limit" name="ai_credits_limit" type="number" min="0" value={formData.ai_credits_limit} onChange={handleChange} className="h-12 pl-10 bg-slate-50 border-slate-200 focus:bg-white transition-colors rounded-xl" />
                                    </div>
                                </div>
                                <div className="space-y-2 col-span-2 pt-4">
                                    <Label htmlFor="status" className="text-slate-700 font-semibold">Initial Status</Label>
                                    <Select name="status" defaultValue={formData.status} onValueChange={(v) => handleSelectChange("status", v)}>
                                        <SelectTrigger className="h-12 bg-slate-50 border-slate-200 focus:bg-white transition-colors rounded-xl">
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ACTIVE">Active</SelectItem>
                                            <SelectItem value="TRIAL">Trial</SelectItem>
                                            <SelectItem value="SUSPENDED">Suspended</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex justify-end pt-8 pb-20">
                        <Button variant="ghost" type="button" onClick={() => router.back()} className="mr-4 h-12 px-8 rounded-xl hover:bg-slate-100 text-slate-600 font-semibold">Cancel</Button>
                        <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 h-12 px-8 rounded-xl shadow-lg shadow-indigo-600/25 text-lg font-semibold transition-transform hover:scale-105">
                            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle className="mr-2 h-5 w-5" />}
                            Create Organization
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
