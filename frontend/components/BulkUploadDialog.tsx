"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog"
import { Upload, Download, FileSpreadsheet, Loader2, CheckCircle, AlertCircle, Users } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import axios from "axios"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface BulkUploadDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
    role: string  // STUDENT, TEACHER, DEPT_HEAD
    orgId: string
}

export function BulkUploadDialog({ open, onOpenChange, onSuccess, role, orgId }: BulkUploadDialogProps) {
    const { token } = useAuth()
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [downloading, setDownloading] = useState(false)
    const [result, setResult] = useState<any>(null)

    const handleDownloadTemplate = async () => {
        setDownloading(true)
        try {
            const response = await axios.get(`${API_URL}/bulk/users/template`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { role, organization_id: orgId },
                responseType: 'blob'
            })

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `bulk_${role.toLowerCase()}s_template.xlsx`)
            document.body.appendChild(link)
            link.click()
            link.remove()

            toast.success("Template downloaded successfully")
        } catch (error: any) {
            console.error(error)
            toast.error(error.response?.data?.detail || "Failed to download template")
        } finally {
            setDownloading(false)
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
            setResult(null)
        }
    }

    const handleUpload = async () => {
        if (!file) {
            toast.error("Please select a file")
            return
        }

        setUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)

            const response = await axios.post(`${API_URL}/bulk/users/upload`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                },
                params: { role, organization_id: orgId }
            })

            setResult(response.data)

            if (response.data.created_count > 0) {
                const roleName = role === "STUDENT" ? "students" : role === "TEACHER" ? "teachers" : "department heads"
                toast.success(`Successfully created ${response.data.created_count} ${roleName}!`)
                onSuccess()
            }

            if (response.data.error_count > 0) {
                toast.warning(`${response.data.error_count} errors occurred. Check the results below.`)
            }
        } catch (error: any) {
            console.error(error)
            toast.error(error.response?.data?.detail || "Failed to upload file")
        } finally {
            setUploading(false)
        }
    }

    const handleClose = () => {
        setFile(null)
        setResult(null)
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl rounded-3xl p-0 overflow-hidden border-0 shadow-2xl">
                <div className="p-8 bg-gradient-to-br from-indigo-50 to-purple-50 border-b border-slate-200">
                    <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <Users className="h-6 w-6 text-white" />
                        </div>
                        Bulk {role === "STUDENT" ? "Student" : role === "TEACHER" ? "Teacher" : "Department Head"} Upload
                    </DialogTitle>
                    <DialogDescription className="text-slate-600 mt-2 text-base">
                        Upload multiple {role === "STUDENT" ? "students" : role === "TEACHER" ? "teachers" : "department heads"} at once using an Excel template
                    </DialogDescription>
                </div>

                <div className="p-8 space-y-6">
                    {!result ? (
                        <>
                            {/* Step 1: Download Template */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold">1</div>
                                    <h3 className="font-semibold text-slate-900">Download Template</h3>
                                </div>
                                <p className="text-sm text-slate-600 pl-8">
                                    Download the Excel template with your organization's structure pre-filled
                                </p>
                                <div className="pl-8">
                                    <Button
                                        onClick={handleDownloadTemplate}
                                        disabled={downloading}
                                        variant="outline"
                                        className="border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300"
                                    >
                                        {downloading ? (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                            <Download className="h-4 w-4 mr-2" />
                                        )}
                                        Download Excel Template
                                    </Button>
                                </div>
                            </div>

                            {/* Step 2: Fill Template */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="h-6 w-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-bold">2</div>
                                    <h3 className="font-semibold text-slate-900">
                                        Fill in {role === "STUDENT" ? "Student" : role === "TEACHER" ? "Teacher" : "Department Head"} Details
                                    </h3>
                                </div>
                                <p className="text-sm text-slate-600 pl-8">
                                    Open the template, use the dropdowns to select departments, and fill in {role === "STUDENT" ? "student" : role === "TEACHER" ? "teacher" : "department head"} information
                                </p>
                            </div>

                            {/* Step 3: Upload */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="h-6 w-6 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-sm font-bold">3</div>
                                    <h3 className="font-semibold text-slate-900">Upload Completed File</h3>
                                </div>
                                <div className="pl-8 space-y-3">
                                    <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 hover:border-indigo-300 transition-colors">
                                        <input
                                            type="file"
                                            accept=".xlsx,.xls"
                                            onChange={handleFileChange}
                                            className="hidden"
                                            id="bulk-upload-file"
                                        />
                                        <label
                                            htmlFor="bulk-upload-file"
                                            className="cursor-pointer flex flex-col items-center gap-2"
                                        >
                                            <FileSpreadsheet className="h-12 w-12 text-slate-400" />
                                            <div className="text-center">
                                                <p className="text-sm font-medium text-slate-700">
                                                    {file ? file.name : "Click to select Excel file"}
                                                </p>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    Supports .xlsx and .xls files
                                                </p>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        /* Results View */
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                {result.created_count > 0 ? (
                                    <CheckCircle className="h-8 w-8 text-emerald-500" />
                                ) : (
                                    <AlertCircle className="h-8 w-8 text-amber-500" />
                                )}
                                <div>
                                    <h3 className="font-bold text-lg text-slate-900">{result.message}</h3>
                                    <p className="text-sm text-slate-600">
                                        {result.created_count} created • {result.error_count} errors
                                    </p>
                                </div>
                            </div>

                            {result.errors && result.errors.length > 0 && (
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 max-h-48 overflow-y-auto">
                                    <h4 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4" />
                                        Errors ({result.errors.length})
                                    </h4>
                                    <ul className="space-y-1 text-sm text-amber-800">
                                        {result.errors.map((error: string, idx: number) => (
                                            <li key={idx} className="flex items-start gap-2">
                                                <span className="text-amber-500">•</span>
                                                <span>{error}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {result.created_users && result.created_users.length > 0 && (
                                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                                    <h4 className="font-semibold text-emerald-900 mb-3">
                                        Successfully Created {role === "STUDENT" ? "Students" : role === "TEACHER" ? "Teachers" : "Department Heads"} ({result.created_users.length})
                                    </h4>
                                    <div className="text-xs text-emerald-800 space-y-2 max-h-48 overflow-y-auto">
                                        {result.created_users.slice(0, 5).map((user: any, idx: number) => (
                                            <div key={idx} className="bg-white rounded-lg p-2 border border-emerald-100">
                                                <div className="font-medium">{user.full_name}</div>
                                                <div className="text-emerald-600">{user.email}</div>
                                                <div className="text-emerald-700">Password: <code className="bg-emerald-100 px-1 rounded">{user.default_password}</code></div>
                                            </div>
                                        ))}
                                        {result.created_users.length > 5 && (
                                            <p className="text-center text-emerald-600 font-medium">
                                                + {result.created_users.length - 5} more {role === "STUDENT" ? "students" : role === "TEACHER" ? "teachers" : "department heads"}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="p-6 bg-slate-50 border-t border-slate-200">
                    {!result ? (
                        <>
                            <Button
                                variant="ghost"
                                onClick={handleClose}
                                className="rounded-xl"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleUpload}
                                disabled={!file || uploading}
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl shadow-lg"
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-4 w-4 mr-2" />
                                        Upload {role === "STUDENT" ? "Students" : role === "TEACHER" ? "Teachers" : "Department Heads"}
                                    </>
                                )}
                            </Button>
                        </>
                    ) : (
                        <Button
                            onClick={handleClose}
                            className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl w-full"
                        >
                            Done
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
