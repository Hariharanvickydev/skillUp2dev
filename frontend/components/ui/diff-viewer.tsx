import React from 'react';
import * as Diff from 'diff';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface DiffViewerProps {
    oldText: string;
    newText: string;
    oldTitle?: string;
    newTitle?: string;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
    oldText,
    newText,
    oldTitle = "Original Version",
    newTitle = "New Version"
}) => {
    const diff = Diff.diffLines(oldText || "", newText || "");

    return (
        <div className="flex flex-col h-full bg-white border rounded-lg shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-4 py-2 border-b bg-slate-50 flex justify-between items-center shrink-0">
                <div className="flex gap-8 text-xs font-bold text-slate-500 uppercase tracking-wider w-full">
                    <span className="flex-1 text-center">{oldTitle}</span>
                    <span className="w-12 text-center"></span>
                    <span className="flex-1 text-center">{newTitle}</span>
                </div>
            </div>

            {/* Diff Area */}
            <div className="flex-1 overflow-y-auto bg-slate-50 relative">
                {diff.map((part, index) => {
                    if (!part.added && !part.removed) {
                        return (
                            <div key={index} className="flex border-b border-slate-100 last:border-0 hover:bg-slate-100 transition-colors">
                                <div className="flex-1 p-2 font-mono text-xs text-slate-500 whitespace-pre-wrap break-all opacity-70">
                                    {part.value.replace(/\n$/, '')}
                                </div>
                                <div className="w-12 border-x border-slate-200 bg-slate-100"></div>
                                <div className="flex-1 p-2 font-mono text-xs text-slate-500 whitespace-pre-wrap break-all opacity-70">
                                    {part.value.replace(/\n$/, '')}
                                </div>
                            </div>
                        )
                    }

                    if (part.removed) {
                        return (
                            <div key={index} className="flex border-b border-slate-100 bg-red-50/50 group">
                                <div className="flex-1 p-2 font-mono text-xs whitespace-pre-wrap break-all text-red-700 bg-red-100">
                                    {part.value.replace(/\n$/, '')}
                                </div>
                                <div className="w-12 border-x border-slate-200 bg-slate-100 flex flex-col items-center justify-center gap-1 py-2 z-10">
                                    <span className="text-[10px] text-red-400 font-bold">DEL</span>
                                </div>
                                <div className="flex-1 p-2 bg-slate-50/50"></div>
                            </div>
                        )
                    }

                    if (part.added) {
                        return (
                            <div key={index} className="flex border-b border-slate-100 bg-emerald-50/50 group">
                                <div className="flex-1 p-2 bg-slate-50/50"></div>
                                <div className="w-12 border-x border-slate-200 bg-slate-100 flex flex-col items-center justify-center gap-1 py-2 z-10">
                                    <span className="text-[10px] text-emerald-500 font-bold">ADD</span>
                                </div>
                                <div className="flex-1 p-2 font-mono text-xs text-emerald-900 bg-emerald-100 whitespace-pre-wrap break-all">
                                    {part.value.replace(/\n$/, '')}
                                </div>
                            </div>
                        )
                    }

                    return null
                })}
            </div>
        </div>
    )
}
