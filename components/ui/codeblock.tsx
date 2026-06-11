import * as React from "react"
import { Check, Copy } from "lucide-react"
import { cn } from "@/lib/utils"
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter'
import css from 'react-syntax-highlighter/dist/cjs/languages/prism/css'
import javascript from 'react-syntax-highlighter/dist/cjs/languages/prism/javascript'
import typescript from 'react-syntax-highlighter/dist/cjs/languages/prism/typescript'
import jsx from 'react-syntax-highlighter/dist/cjs/languages/prism/jsx'
import tsx from 'react-syntax-highlighter/dist/cjs/languages/prism/tsx'
import bash from 'react-syntax-highlighter/dist/cjs/languages/prism/bash'
import json from 'react-syntax-highlighter/dist/cjs/languages/prism/json'

SyntaxHighlighter.registerLanguage('css', css)
SyntaxHighlighter.registerLanguage('javascript', javascript)
SyntaxHighlighter.registerLanguage('js', javascript)
SyntaxHighlighter.registerLanguage('typescript', typescript)
SyntaxHighlighter.registerLanguage('ts', typescript)
SyntaxHighlighter.registerLanguage('jsx', jsx)
SyntaxHighlighter.registerLanguage('tsx', tsx)
SyntaxHighlighter.registerLanguage('bash', bash)
SyntaxHighlighter.registerLanguage('json', json)

const BASE_STYLES = {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSize: '13px',
    lineHeight: '1.6',
    background: 'transparent',
    whiteSpace: 'pre' as const,
}

const lightTheme = {
    'code[class*="language-"]': { ...BASE_STYLES, color: '#0e1720' },
    'pre[class*="language-"]': { background: 'transparent', margin: 0, padding: 0 },
    comment:            { color: '#7f97ad', fontStyle: 'italic' },
    prolog:             { color: '#7f97ad' },
    doctype:            { color: '#7f97ad' },
    cdata:              { color: '#7f97ad' },
    punctuation:        { color: '#7f97ad' },
    keyword:            { color: '#2563eb' },
    'control-flow':     { color: '#2563eb' },
    builtin:            { color: '#2563eb' },
    boolean:            { color: '#dc2626' },
    important:          { color: '#dc2626', fontWeight: 'bold' },
    number:             { color: '#059669' },
    'attr-name':        { color: '#059669' },
    string:             { color: '#b45309' },
    'attr-value':       { color: '#b45309' },
    'template-string':  { color: '#b45309' },
    regex:              { color: '#b45309' },
    constant:           { color: '#b45309' },
    operator:           { color: '#be185d' },
    unit:               { color: '#be185d' },
    function:           { color: '#7c3aed' },
    'function-variable':{ color: '#7c3aed' },
    atrule:             { color: '#7c3aed' },
    'class-name':       { color: '#0369a1' },
    'maybe-class-name': { color: '#0369a1' },
    property:           { color: '#0369a1' },
    selector:           { color: '#0f766e' },
    tag:                { color: '#2563eb' },
    variable:           { color: '#0e1720' },
}

const darkTheme = {
    'code[class*="language-"]': { ...BASE_STYLES, color: '#d5dde6' },
    'pre[class*="language-"]': { background: 'transparent', margin: 0, padding: 0 },
    comment:            { color: '#56748e', fontStyle: 'italic' },
    prolog:             { color: '#56748e' },
    doctype:            { color: '#56748e' },
    cdata:              { color: '#56748e' },
    punctuation:        { color: '#7f97ad' },
    keyword:            { color: '#60a5fa' },
    'control-flow':     { color: '#60a5fa' },
    builtin:            { color: '#60a5fa' },
    boolean:            { color: '#f87171' },
    important:          { color: '#f87171', fontWeight: 'bold' },
    number:             { color: '#34d399' },
    'attr-name':        { color: '#34d399' },
    string:             { color: '#fbbf24' },
    'attr-value':       { color: '#fbbf24' },
    'template-string':  { color: '#fbbf24' },
    regex:              { color: '#fbbf24' },
    constant:           { color: '#fbbf24' },
    operator:           { color: '#fb7185' },
    unit:               { color: '#fb7185' },
    function:           { color: '#c084fc' },
    'function-variable':{ color: '#c084fc' },
    atrule:             { color: '#c084fc' },
    'class-name':       { color: '#38bdf8' },
    'maybe-class-name': { color: '#38bdf8' },
    property:           { color: '#38bdf8' },
    selector:           { color: '#2dd4bf' },
    tag:                { color: '#60a5fa' },
    variable:           { color: '#d5dde6' },
}

// Surface-subtle hex values must match --color-surface-subtle in each mode
const SURFACE = { light: '#edf1f5', dark: '#182330' }

interface CodeBlockProps {
    language?: string
    title?: string
    maxHeight?: number
    forceDark?: boolean
    children: string
    className?: string
}

const CodeBlock = ({ language, title, maxHeight, forceDark = false, children, className }: CodeBlockProps) => {
    const [copied, setCopied] = React.useState(false)
    const [mounted, setMounted] = React.useState(false)
    const [isDark, setIsDark] = React.useState(false)

    React.useEffect(() => {
        const getIsDark = () => {
            const forced = document.documentElement.getAttribute('data-color-scheme')
            if (forced === 'dark') return true
            if (forced === 'light') return false
            return window.matchMedia('(prefers-color-scheme: dark)').matches
        }

        setIsDark(getIsDark())
        setMounted(true)

        const mq = window.matchMedia('(prefers-color-scheme: dark)')
        const handleChange = () => setIsDark(getIsDark())
        mq.addEventListener('change', handleChange)

        const observer = new MutationObserver(handleChange)
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-color-scheme'],
        })

        return () => {
            mq.removeEventListener('change', handleChange)
            observer.disconnect()
        }
    }, [])

    const copy = () => {
        navigator.clipboard.writeText(children)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const dark = forceDark || isDark

    return (
        <div className={cn("overflow-hidden border border-border rounded-xs", className)}>
            <div
                className="flex items-center justify-between px-4 py-2 border-b"
                style={dark ? {
                    background: '#1C1C1C',
                    borderColor: '#2D2D2D',
                } : undefined}
            >
                <div className="flex items-center gap-2.5">
                    {title && (
                        <span
                            className="font-sans text-[13px] font-medium"
                            style={dark ? { color: '#F3F4F6' } : undefined}
                        >
                            {title}
                        </span>
                    )}
                    {language && (
                        <span
                            className="font-sans text-[11px] font-bold uppercase tracking-[0.12em]"
                            style={dark ? { color: '#9CA3AF' } : undefined}
                        >
                            {language}
                        </span>
                    )}
                    {!title && !language && <span />}
                </div>
                <button
                    onClick={copy}
                    className="flex items-center gap-1.5 font-sans text-[11px] font-bold uppercase tracking-[0.08em] transition-colors"
                    style={dark ? { color: '#9CA3AF' } : undefined}
                    aria-label="Copy code"
                >
                    {copied ? (
                        <><Check className="w-3 h-3" /> Copied</>
                    ) : (
                        <><Copy className="w-3 h-3" /> Copy</>
                    )}
                </button>
            </div>
            {mounted ? (
                <SyntaxHighlighter
                    language={language}
                    style={dark ? darkTheme : lightTheme}
                    customStyle={{
                        background: dark ? SURFACE.dark : SURFACE.light,
                        margin: 0,
                        padding: '20px',
                        overflowX: 'auto',
                        overflowY: maxHeight ? 'auto' : undefined,
                        maxHeight: maxHeight ?? undefined,
                        borderRadius: 0,
                    }}
                >
                    {children}
                </SyntaxHighlighter>
            ) : (
                <pre style={{ background: dark ? SURFACE.dark : SURFACE.light, margin: 0, padding: '20px', overflowX: 'auto', overflowY: maxHeight ? 'auto' : undefined, maxHeight: maxHeight ?? undefined }}>
                    <code style={{ ...BASE_STYLES, color: dark ? '#d5dde6' : '#0e1720' }}>{children}</code>
                </pre>
            )}
        </div>
    )
}

CodeBlock.displayName = "CodeBlock"

export { CodeBlock }
export type { CodeBlockProps }
