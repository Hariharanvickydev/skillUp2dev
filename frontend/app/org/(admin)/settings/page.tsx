"use client";
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Save, Building2, Shield, Lock, CreditCard, Layers } from "lucide-react";
import { Badge } from '@/components/ui/badge';
import { OrgStructureManager } from "@/components/OrgStructureManager";
import { getProfile, getAdminOrganizationDashboard, updateOrgProfile, uploadOrgLogo } from "@/lib/api";

export default function SettingsPage() {
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState(searchParams?.get("tab") || "general");

    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [org, setOrg] = useState<any>(null);
    const [limits, setLimits] = useState<any>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        code: "",
        contact_email: "",
        contact_phone: "",
        address: ""
    })

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        const tab = searchParams?.get("tab");
        if (tab) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    const loadData = async () => {
        try {
            const user = await getProfile();
            setProfile(user);
            if (user.organization_id) {
                const orgData = await getAdminOrganizationDashboard(user.organization_id);
                // Handle response which contains summary and limits
                const orgDetails = orgData.summary || orgData.organization || orgData;
                setOrg(orgDetails);

                if (orgData.limits) {
                    setLimits(orgData.limits);
                }

                // Populate Form
                setFormData({
                    name: orgDetails.name || "",
                    code: orgDetails.code || "",
                    contact_email: orgDetails.contact_email || user.email || "",
                    contact_phone: orgDetails.contact_phone || "",
                    address: orgDetails.address || ""
                })
            }
        } catch (e) {
            console.error("Failed to load settings data", e);
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleSave = async () => {
        setLoading(true);
        try {
            await updateOrgProfile({
                contact_phone: formData.contact_phone,
                address: formData.address
            });
            // Re-fetch to confirm
            await loadData();
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleLogoClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            try {
                await uploadOrgLogo(file);
                loadData();
            } catch (err) {
                console.error("Upload failed", err);
            }
        }
    };

    return (
        <div className="p-8 space-y-8 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h1>
                    <p className="text-slate-500 mt-1">
                        Manage your organization profile, preferences, and security policies.
                    </p>
                </div>
                <Button onClick={handleSave} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[120px]">
                    {loading ? "Saving..." : <><Save className="h-4 w-4 mr-2" /> Save Changes</>}
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-slate-100 p-1 rounded-xl">
                    <TabsTrigger value="general" className="rounded-lg gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"><Building2 className="h-4 w-4" /> General</TabsTrigger>
                    <TabsTrigger value="structure" className="rounded-lg gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"><Layers className="h-4 w-4" /> Structure</TabsTrigger>
                    <TabsTrigger value="limits" className="rounded-lg gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"><CreditCard className="h-4 w-4" /> Limits & Billing</TabsTrigger>
                    <TabsTrigger value="access" className="rounded-lg gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"><Shield className="h-4 w-4" /> Access Rules</TabsTrigger>
                    <TabsTrigger value="security" className="rounded-lg gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"><Lock className="h-4 w-4" /> Security</TabsTrigger>
                </TabsList>

                {/* General Settings */}
                <TabsContent value="general" className="space-y-6">
                    <Card className="border-slate-200">
                        <CardHeader>
                            <CardTitle>Organization Profile</CardTitle>
                            <CardDescription>Update your organization's public information.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center gap-6">
                                <div
                                    onClick={handleLogoClick}
                                    className="h-24 w-24 bg-slate-100 rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 cursor-pointer transition-colors overflow-hidden relative"
                                >
                                    {org?.logo_url ? (
                                        <img src={org.logo_url} alt="Logo" className="w-full h-full object-cover" />
                                    ) : (
                                        <>
                                            <Upload className="h-6 w-6 mb-2" />
                                            <span className="text-xs font-medium">Upload Logo</span>
                                        </>
                                    )}
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-medium text-slate-900">Organization Logo</h4>
                                    <p className="text-sm text-slate-500">Recommended size: 512x512px. Max file size: 2MB.</p>
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Organization Name</Label>
                                    <Input
                                        value={formData.name}
                                        disabled
                                        className="bg-slate-50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Organization Code</Label>
                                    <Input
                                        value={formData.code}
                                        disabled
                                        className="bg-slate-50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Contact Email</Label>
                                    <Input
                                        value={formData.contact_email}
                                        disabled
                                        className="bg-slate-50"
                                        type="email"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Contact Phone</Label>
                                    <Input
                                        value={formData.contact_phone}
                                        onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                                    />
                                </div>
                            </div>


                            <div className="space-y-2">
                                <Label>Address</Label>
                                <Input
                                    value={formData.address}
                                    onChange={(e) => handleInputChange('address', e.target.value)}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Structure Settings */}
                <TabsContent value="structure" className="space-y-6">
                    <OrgStructureManager orgId={profile?.organization_id} orgType={org?.type} />
                </TabsContent>

                {/* Limits */}
                <TabsContent value="limits" className="space-y-6">
                    <Card className="border-slate-200">
                        <CardHeader>
                            <CardTitle className="flex justify-between items-center">
                                <span>Current Plan & Limits</span>
                                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 uppercase">{org?.plan || "Standard Plan"}</Badge>
                            </CardTitle>
                            <CardDescription>Contact super admin to upgrade your plan.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                {/* Students Limit */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm font-medium">
                                        <span>Students</span>
                                        <span className="text-slate-500">{limits?.current_students || 0} / {limits?.max_students || "∞"}</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                                            style={{ width: `${Math.min(((limits?.current_students || 0) / (limits?.max_students || 1)) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                                {/* Teachers Limit */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm font-medium">
                                        <span>Teachers</span>
                                        <span className="text-slate-500">{limits?.current_teachers || 0} / {limits?.max_teachers || "∞"}</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-purple-600 rounded-full transition-all duration-500"
                                            style={{ width: `${Math.min(((limits?.current_teachers || 0) / (limits?.max_teachers || 1)) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                                {/* Courses Limit */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm font-medium">
                                        <span>Courses</span>
                                        <span className="text-slate-500">{limits?.current_courses || 0} / {limits?.max_courses || "∞"}</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-orange-600 rounded-full transition-all duration-500"
                                            style={{ width: `${Math.min(((limits?.current_courses || 0) / (limits?.max_courses || 1)) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                                {/* AI Credits Limit */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm font-medium">
                                        <span>AI Credits</span>
                                        <span className="text-slate-500">{limits?.ai_usage_percent || 0}% Used</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-pink-600 rounded-full transition-all duration-500"
                                            style={{ width: `${limits?.ai_usage_percent || 0}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-slate-50/50 border-t border-slate-100">
                            <p className="text-xs text-slate-500">Plan renews on Jan 1, 2026.</p>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* Access Rules */}
                <TabsContent value="access" className="space-y-6">
                    <Card className="border-slate-200">
                        <CardHeader>
                            <CardTitle>Content & Permissions</CardTitle>
                            <CardDescription>Control what your teachers and students can do.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Allow Teacher Publishing</Label>
                                    <p className="text-sm text-slate-500">Teachers can publish courses without admin approval.</p>
                                </div>
                                <Switch />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Enable Community Content</Label>
                                    <p className="text-sm text-slate-500">Allow users to view public community courses.</p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Strict Exam Mode</Label>
                                    <p className="text-sm text-slate-500">Block browser tab switching during exams.</p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Security */}
                <TabsContent value="security" className="space-y-6">
                    <Card className="border-slate-200">
                        <CardHeader>
                            <CardTitle>Security Policies</CardTitle>
                            <CardDescription>Configure session and password settings.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Session Timeout (Minutes)</Label>
                                    <Input type="number" defaultValue="30" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Password Rotation (Days)</Label>
                                    <Input type="number" defaultValue="90" />
                                </div>
                            </div>
                            <div className="flex items-center justify-between pt-4">
                                <div className="space-y-0.5">
                                    <Label className="text-base text-red-600">Force Password Reset</Label>
                                    <p className="text-sm text-slate-500">Compel all users to reset password on next login.</p>
                                </div>
                                <Button variant="destructive" size="sm">Reset All Passwords</Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
