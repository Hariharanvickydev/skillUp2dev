"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { PenTool, Sparkles, Upload, FileSpreadsheet, ArrowRight } from "lucide-react"

interface CreateExamModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSelect: (method: 'manual' | 'ai' | 'upload') => void
}

export function CreateExamModal({ open, onOpenChange, onSelect }: CreateExamModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl rounded-3xl p-0 overflow-hidden border-0 shadow-2xl bg-slate-50/50 backdrop-blur-xl">
                <div className="p-10 text-center space-y-4 bg-white/80 border-b border-white/20">
                    <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                        Create New Assessment
                    </DialogTitle>
                    <DialogDescription className="text-slate-500 text-lg max-w-xl mx-auto">
                        Choose how you would like to create your exam. You can edit the exam later regardless of the method chosen.
                    </DialogDescription>
                </div>

                <div className="p-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Option 1: Manual */}
                    <div
                        className="group relative bg-white rounded-3xl p-6 shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col"
                        onClick={() => onSelect('manual')}
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-t-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="h-14 w-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                            <PenTool className="h-7 w-7" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Manual Creation</h3>
                        <p className="text-slate-500 text-sm mb-6 flex-1">
                            Build your exam from scratch. Add questions one by one, set detailed options, and customize every aspect.
                        </p>
                        <Button variant="outline" className="w-full group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-200 transition-colors">
                            Start Manual <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>

                    {/* Option 2: AI Generator */}
                    <div
                        className="group relative bg-white rounded-3xl p-6 shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col"
                        onClick={() => onSelect('ai')}
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-t-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="h-14 w-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                            <Sparkles className="h-7 w-7" />
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-bold text-slate-800">AI Assist</h3>
                            <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Popular</span>
                        </div>
                        <p className="text-slate-500 text-sm mb-6 flex-1">
                            Generate a complete exam instantly from your topic content. Review and refine the AI-generated questions.
                        </p>
                        <Button variant="outline" className="w-full group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-200 transition-colors">
                            Use AI <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>

                    {/* Option 3: Bulk Upload */}
                    <div
                        className="group relative bg-white rounded-3xl p-6 shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col"
                        onClick={() => onSelect('upload')}
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-t-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="h-14 w-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                            <Upload className="h-7 w-7" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Bulk Upload</h3>
                        <p className="text-slate-500 text-sm mb-6 flex-1">
                            Import questions from an Excel spreadsheet. Perfect for migrating existing question banks.
                        </p>
                        <Button variant="outline" className="w-full group-hover:bg-emerald-50 group-hover:text-emerald-600 group-hover:border-emerald-200 transition-colors">
                            Upload File <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
