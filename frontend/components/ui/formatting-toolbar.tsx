
import { Button } from "@/components/ui/button"
import {
    Bold, Italic, Heading1, Heading2, List, ListOrdered,
    Code as CodeIcon, Link2, TableProperties, Undo2, Redo2
} from "lucide-react"

interface FormattingToolbarProps {
    onAction: (type: string) => void
    onUndo?: () => void
    onRedo?: () => void
    canUndo?: boolean
    canRedo?: boolean
}

export function FormattingToolbar({
    onAction,
    onUndo,
    onRedo,
    canUndo = false,
    canRedo = false
}: FormattingToolbarProps) {
    return (
        <div className="px-3 py-1.5 border-b bg-white flex items-center gap-1 shrink-0 overflow-x-auto">
            {onUndo && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-600 mr-1"
                    onClick={onUndo}
                    disabled={!canUndo}
                    title="Undo (Ctrl+Z)"
                >
                    <Undo2 className="h-4 w-4" />
                </Button>
            )}
            {onRedo && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-600 mr-2"
                    onClick={onRedo}
                    disabled={!canRedo}
                    title="Redo (Ctrl+Y)"
                >
                    <Redo2 className="h-4 w-4" />
                </Button>
            )}

            {(onUndo || onRedo) && <div className="w-[1px] h-4 bg-slate-200 mx-1 mr-2" />}

            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600" onClick={() => onAction('bold')} title="Bold">
                <Bold className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600" onClick={() => onAction('italic')} title="Italic">
                <Italic className="h-4 w-4" />
            </Button>
            <div className="w-[1px] h-4 bg-slate-200 mx-1" />
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600" onClick={() => onAction('h1')} title="Heading 1">
                <Heading1 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600" onClick={() => onAction('h2')} title="Heading 2">
                <Heading2 className="h-4 w-4" />
            </Button>
            <div className="w-[1px] h-4 bg-slate-200 mx-1" />
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600" onClick={() => onAction('list')} title="Bullet List">
                <List className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600" onClick={() => onAction('ordered-list')} title="Numbered List">
                <ListOrdered className="h-4 w-4" />
            </Button>
            <div className="w-[1px] h-4 bg-slate-200 mx-1" />
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600" onClick={() => onAction('code')} title="Code Block">
                <CodeIcon className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600" onClick={() => onAction('link')} title="Insert Link">
                <Link2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600" onClick={() => onAction('table')} title="Insert Table">
                <TableProperties className="h-4 w-4" />
            </Button>
        </div>
    )
}
