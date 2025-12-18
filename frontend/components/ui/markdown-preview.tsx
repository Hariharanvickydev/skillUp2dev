
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkBreaks from "remark-breaks"
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Lock } from "lucide-react"

interface MarkdownPreviewProps {
    content: string
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
    return (
        <article className="prose prose-slate prose-lg max-w-none">
            <Markdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                components={{
                    h1: ({ ...props }) => <h1 className="text-3xl font-bold text-slate-900 mt-0 mb-4 border-b-2 border-indigo-100 pb-2" {...props} />,
                    h2: ({ ...props }) => <h2 className="text-2xl font-bold text-slate-800 mt-8 mb-4" {...props} />,
                    // Lists
                    ul: ({ ...props }) => <ul className="list-disc pl-5 space-y-2 mb-4 text-slate-700" {...props} />,
                    ol: ({ ...props }) => <ol className="list-decimal pl-5 space-y-2 mb-4 text-slate-700" {...props} />,
                    li: ({ ...props }) => <li className="pl-1" {...props} />,

                    blockquote: ({ ...props }) => <blockquote className="border-l-4 border-indigo-500 bg-indigo-50 pl-4 py-3 my-4 italic text-slate-700 rounded-r" {...props} />,

                    // Premium Tables
                    table: ({ ...props }) => (
                        <div className="my-8 overflow-x-auto rounded-xl border border-slate-200/60 shadow-sm bg-white">
                            <table className="min-w-full divide-y divide-slate-100" {...props} />
                        </div>
                    ),
                    thead: ({ ...props }) => <thead className="bg-slate-50/80" {...props} />,
                    th: ({ ...props }) => <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest" {...props} />,
                    td: ({ ...props }) => <td className="px-6 py-4 text-sm text-slate-600 leading-relaxed max-w-xs break-words" {...props} />,
                    tr: ({ ...props }) => <tr className="hover:bg-slate-50/60 transition-colors border-b border-slate-50 last:border-0 even:bg-slate-50/30" {...props} />,

                    code({ inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '')
                        return !inline && match ? (
                            <div className="rounded-lg overflow-hidden my-6 border border-slate-200 shadow-sm">
                                <div className="bg-slate-800 text-slate-300 px-4 py-2 text-xs font-mono uppercase tracking-wider border-b border-slate-700 flex justify-between">
                                    <span>{match[1]}</span>
                                    {match[1] === 'solution' && <Lock className="h-3 w-3 opacity-50" />}
                                </div>
                                <SyntaxHighlighter
                                    style={vscDarkPlus}
                                    language={match[1]}
                                    PreTag="div"
                                    customStyle={{ margin: 0, borderRadius: 0 }}
                                >
                                    {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                            </div>
                        ) : (
                            <code className="bg-slate-100 text-indigo-600 px-1.5 py-0.5 rounded font-mono text-sm font-semibold" {...props}>
                                {children}
                            </code>
                        )
                    }
                }}
            >
                {/* Preserve spacing logic */}
                {content.replace(/\n{3,}/g, (match) => {
                    return '\n\n' + '&nbsp;\n'.repeat(match.length - 2)
                }) || "*Preview will appear here...*"}
            </Markdown>
        </article>
    )
}
