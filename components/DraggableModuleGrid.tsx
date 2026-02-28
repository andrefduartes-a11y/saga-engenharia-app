'use client'

import { useState, useEffect, ComponentType } from 'react'
import Link from 'next/link'
import { GripVertical, Settings, RotateCcw } from 'lucide-react'

const STORAGE_KEY = 'saga-dashboard-module-order-v1'

export interface DashModule {
    href: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon: ComponentType<any>
    label: string
    desc: string
    color: string
}

interface Props {
    modules: DashModule[]
    compact?: boolean   // use tighter padding (engenheiro view)
}

export default function DraggableModuleGrid({ modules, compact = false }: Props) {
    const [dragMode, setDragMode] = useState(false)
    const [order, setOrder] = useState<string[]>([])
    const [draggedHref, setDraggedHref] = useState<string | null>(null)
    const [overHref, setOverHref] = useState<string | null>(null)

    // Load order from localStorage (run once on mount)
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY)
            if (saved) {
                const parsed: string[] = JSON.parse(saved)
                const valid = parsed.filter(h => modules.some(m => m.href === h))
                const missing = modules.filter(m => !valid.includes(m.href)).map(m => m.href)
                setOrder([...valid, ...missing])
                return
            }
        } catch { /* ignore */ }
        setOrder(modules.map(m => m.href))
    }, [])  // eslint-disable-line react-hooks/exhaustive-deps

    const ordered = order
        .map(href => modules.find(m => m.href === href))
        .filter(Boolean) as DashModule[]

    function saveOrder(o: string[]) {
        setOrder(o)
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(o)) } catch { /* ignore */ }
    }

    function onDragStart(href: string) { setDraggedHref(href) }
    function onDragOver(e: React.DragEvent, href: string) {
        e.preventDefault()
        if (href !== draggedHref) setOverHref(href)
    }
    function onDrop(targetHref: string) {
        if (!draggedHref || draggedHref === targetHref) { setDraggedHref(null); setOverHref(null); return }
        const next = [...order]
        const from = next.indexOf(draggedHref)
        const to = next.indexOf(targetHref)
        next.splice(from, 1)
        next.splice(to, 0, draggedHref)
        saveOrder(next)
        setDraggedHref(null)
        setOverHref(null)
    }
    function reset() {
        const def = modules.map(m => m.href)
        setOrder(def)
        try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
    }

    const pad = compact ? '11px 12px' : '12px 14px'
    const iconSize = compact ? 30 : 32
    const iconIconSize = compact ? 14 : 15
    const minH = compact ? 62 : 68

    return (
        <div>
            {/* Toolbar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <h2 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                    MÓDULOS DO SISTEMA
                </h2>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {dragMode && (
                        <button onClick={reset} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#EF4444', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                            <RotateCcw size={10} /> Resetar
                        </button>
                    )}
                    <button onClick={() => setDragMode(v => !v)}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 8, border: `1px solid ${dragMode ? 'rgba(212,168,67,0.4)' : 'var(--border-subtle)'}`, background: dragMode ? 'rgba(212,168,67,0.12)' : 'rgba(255,255,255,0.04)', color: dragMode ? '#D4A843' : 'var(--text-muted)', fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}>
                        <Settings size={11} />
                        {dragMode ? 'Concluir' : 'Personalizar'}
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 7 }}>
                {ordered.map(mod => {
                    const Icon = mod.icon
                    const isDragging = draggedHref === mod.href
                    const isOver = overHref === mod.href

                    const inner = (
                        <div
                            draggable={dragMode}
                            onDragStart={() => dragMode && onDragStart(mod.href)}
                            onDragOver={e => dragMode && onDragOver(e, mod.href)}
                            onDrop={() => dragMode && onDrop(mod.href)}
                            onDragEnd={() => { setDraggedHref(null); setOverHref(null) }}
                            className="card"
                            style={{
                                padding: pad,
                                borderRadius: 12,
                                cursor: dragMode ? 'grab' : 'pointer',
                                border: `1px solid ${isOver ? mod.color + '60' : dragMode ? 'rgba(212,168,67,0.18)' : 'var(--border-subtle)'}`,
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 8,
                                transition: 'all 0.12s',
                                minHeight: minH,
                                height: '100%',
                                boxSizing: 'border-box',
                                opacity: isDragging ? 0.3 : 1,
                                background: isOver ? mod.color + '14' : dragMode ? 'rgba(212,168,67,0.03)' : undefined,
                                transform: isOver ? 'scale(1.02)' : undefined,
                                userSelect: 'none',
                            }}
                        >
                            {dragMode && (
                                <GripVertical size={13} style={{ color: '#D4A843', flexShrink: 0, marginTop: 2, opacity: 0.7 }} />
                            )}
                            <div style={{ width: iconSize, height: iconSize, borderRadius: 8, background: mod.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Icon size={iconIconSize} style={{ color: mod.color }} />
                            </div>
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{mod.label}</div>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{mod.desc}</div>
                            </div>
                        </div>
                    )

                    return dragMode ? (
                        // In drag mode: not a Link (prevents nav while dragging)
                        <div key={mod.href} style={{ height: '100%' }}>
                            {inner}
                        </div>
                    ) : (
                        // Normal mode: full link with hover effect
                        <Link key={mod.href} href={mod.href} style={{ textDecoration: 'none', display: 'block', height: '100%' }}
                            onMouseEnter={e => {
                                const el = e.currentTarget.firstElementChild as HTMLElement
                                if (el) { el.style.borderColor = mod.color + '55'; el.style.background = mod.color + '0a' }
                            }}
                            onMouseLeave={e => {
                                const el = e.currentTarget.firstElementChild as HTMLElement
                                if (el) { el.style.borderColor = 'var(--border-subtle)'; el.style.background = '' }
                            }}
                        >
                            {inner}
                        </Link>
                    )
                })}
            </div>

            {/* Hint */}
            {dragMode && (
                <p style={{ fontSize: 10, color: '#D4A843', marginTop: 10, textAlign: 'center', opacity: 0.7 }}>
                    ✋ Arraste os cards para reorganizar — o layout é salvo automaticamente
                </p>
            )}
        </div>
    )
}
