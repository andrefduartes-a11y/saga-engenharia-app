'use client'

import { useState, useEffect, useRef, ComponentType } from 'react'
import Link from 'next/link'
import { Settings, RotateCcw, GripVertical } from 'lucide-react'

const STORAGE_KEY_ORDER = 'saga-dashboard-module-order-v1'
const STORAGE_KEY_POS = 'saga-dashboard-module-positions-v2'

export interface DashModule {
    href: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon: ComponentType<any>
    label: string
    desc: string
    color: string
}

interface Position { x: number; y: number }

interface Props {
    modules: DashModule[]
    compact?: boolean
}

// ── Grid mode (mobile / default) ──────────────────────────────────────────────
function GridMode({ modules, compact }: { modules: DashModule[]; compact: boolean }) {
    const [order, setOrder] = useState<string[]>([])
    const [draggedHref, setDraggedHref] = useState<string | null>(null)
    const [overHref, setOverHref] = useState<string | null>(null)
    const [dragMode, setDragMode] = useState(false)

    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY_ORDER)
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

    const ordered = order.map(href => modules.find(m => m.href === href)).filter(Boolean) as DashModule[]

    function saveOrder(o: string[]) {
        setOrder(o)
        try { localStorage.setItem(STORAGE_KEY_ORDER, JSON.stringify(o)) } catch { /* ignore */ }
    }

    function onDrop(targetHref: string) {
        if (!draggedHref || draggedHref === targetHref) { setDraggedHref(null); setOverHref(null); return }
        const next = [...order]
        const from = next.indexOf(draggedHref)
        const to = next.indexOf(targetHref)
        next.splice(from, 1)
        next.splice(to, 0, draggedHref)
        saveOrder(next)
        setDraggedHref(null); setOverHref(null)
    }

    const pad = compact ? '11px 12px' : '12px 14px'
    const iconSize = compact ? 30 : 32
    const iconIconSize = compact ? 14 : 15
    const minH = compact ? 62 : 68

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <h2 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                    MÓDULOS DO SISTEMA
                </h2>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {dragMode && (
                        <button onClick={() => { setOrder(modules.map(m => m.href)); try { localStorage.removeItem(STORAGE_KEY_ORDER) } catch { /* ignore */ } }}
                            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#EF4444', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                            <RotateCcw size={10} /> Resetar
                        </button>
                    )}
                    <button onClick={() => setDragMode(v => !v)}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 8, border: `1px solid ${dragMode ? 'rgba(212,168,67,0.4)' : 'var(--border-subtle)'}`, background: dragMode ? 'rgba(212,168,67,0.12)' : 'rgba(255,255,255,0.04)', color: dragMode ? '#D4A843' : 'var(--text-muted)', fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}>
                        <Settings size={11} /> {dragMode ? 'Concluir' : 'Personalizar'}
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 7 }}>
                {ordered.map(mod => {
                    const Icon = mod.icon
                    const isDragging = draggedHref === mod.href
                    const isOver = overHref === mod.href

                    const inner = (
                        <div
                            draggable={dragMode}
                            onDragStart={() => dragMode && setDraggedHref(mod.href)}
                            onDragOver={e => { e.preventDefault(); if (dragMode && mod.href !== draggedHref) setOverHref(mod.href) }}
                            onDrop={() => dragMode && onDrop(mod.href)}
                            onDragEnd={() => { setDraggedHref(null); setOverHref(null) }}
                            className="card"
                            style={{
                                padding: pad, borderRadius: 12,
                                cursor: dragMode ? 'grab' : 'pointer',
                                border: `1px solid ${isOver ? mod.color + '60' : dragMode ? 'rgba(212,168,67,0.18)' : 'var(--border-subtle)'}`,
                                display: 'flex', alignItems: 'flex-start', gap: 8,
                                transition: 'all 0.12s', minHeight: minH, height: '100%',
                                boxSizing: 'border-box', opacity: isDragging ? 0.3 : 1,
                                background: isOver ? mod.color + '14' : dragMode ? 'rgba(212,168,67,0.03)' : undefined,
                                transform: isOver ? 'scale(1.02)' : undefined, userSelect: 'none',
                            }}>
                            {dragMode && <GripVertical size={13} style={{ color: '#D4A843', flexShrink: 0, marginTop: 2, opacity: 0.7 }} />}
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
                        <div key={mod.href} style={{ height: '100%' }}>{inner}</div>
                    ) : (
                        <Link key={mod.href} href={mod.href} style={{ textDecoration: 'none', display: 'block', height: '100%' }}
                            onMouseEnter={e => { const el = e.currentTarget.firstElementChild as HTMLElement; if (el) { el.style.borderColor = mod.color + '55'; el.style.background = mod.color + '0a' } }}
                            onMouseLeave={e => { const el = e.currentTarget.firstElementChild as HTMLElement; if (el) { el.style.borderColor = 'var(--border-subtle)'; el.style.background = '' } }}>
                            {inner}
                        </Link>
                    )
                })}
            </div>

            {dragMode && (
                <p style={{ fontSize: 10, color: '#D4A843', marginTop: 10, textAlign: 'center', opacity: 0.7 }}>
                    ✋ Arraste os cards para reorganizar — o layout é salvo automaticamente
                </p>
            )}
        </div>
    )
}

// ── Free canvas mode (desktop only) ──────────────────────────────────────────
function CanvasMode({ modules }: { modules: DashModule[] }) {
    const CARD_W = 170
    const CARD_H = 78
    const GAP = 12

    const [positions, setPositions] = useState<Record<string, Position>>({})
    const [editMode, setEditMode] = useState(false)
    const [dragging, setDragging] = useState<string | null>(null)
    const dragOffset = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 })
    const containerRef = useRef<HTMLDivElement>(null)

    // Default: auto-arrange in rows of 4
    function defaultPositions(): Record<string, Position> {
        const cols = 4
        return Object.fromEntries(modules.map((m, i) => [
            m.href,
            { x: (i % cols) * (CARD_W + GAP), y: Math.floor(i / cols) * (CARD_H + GAP) }
        ]))
    }

    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY_POS)
            if (saved) {
                const parsed = JSON.parse(saved)
                // Fill in any missing modules with default positions
                const def = defaultPositions()
                const merged = { ...def, ...parsed }
                setPositions(merged)
                return
            }
        } catch { /* ignore */ }
        setPositions(defaultPositions())
    }, [])  // eslint-disable-line react-hooks/exhaustive-deps

    function savePositions(pos: Record<string, Position>) {
        setPositions(pos)
        try { localStorage.setItem(STORAGE_KEY_POS, JSON.stringify(pos)) } catch { /* ignore */ }
    }

    function resetPositions() {
        const def = defaultPositions()
        savePositions(def)
    }

    // ── Mouse drag handlers ──
    function onMouseDown(e: React.MouseEvent, href: string) {
        if (!editMode) return
        e.preventDefault()
        const pos = positions[href] || { x: 0, y: 0 }
        dragOffset.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y }
        setDragging(href)
    }

    useEffect(() => {
        if (!dragging) return
        function onMove(e: MouseEvent) {
            if (!dragging) return
            const container = containerRef.current
            if (!container) return
            const rect = container.getBoundingClientRect()
            const x = Math.max(0, Math.min(e.clientX - dragOffset.current.dx, rect.width - CARD_W))
            const y = Math.max(0, e.clientY - dragOffset.current.dy)
            setPositions(prev => ({ ...prev, [dragging]: { x, y } }))
        }
        function onUp() {
            setPositions(prev => {
                savePositions(prev)
                return prev
            })
            setDragging(null)
        }
        window.addEventListener('mousemove', onMove)
        window.addEventListener('mouseup', onUp)
        return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    }, [dragging])  // eslint-disable-line react-hooks/exhaustive-deps

    // Canvas height: max Y + card height + padding
    const maxY = Object.values(positions).reduce((m, p) => Math.max(m, p.y), 0)
    const canvasHeight = maxY + CARD_H + 40

    return (
        <div>
            {/* Toolbar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <h2 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                    MÓDULOS DO SISTEMA
                </h2>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {editMode && (
                        <button onClick={resetPositions}
                            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#EF4444', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                            <RotateCcw size={10} /> Resetar
                        </button>
                    )}
                    <button onClick={() => setEditMode(v => !v)}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 8, border: `1px solid ${editMode ? 'rgba(212,168,67,0.4)' : 'var(--border-subtle)'}`, background: editMode ? 'rgba(212,168,67,0.12)' : 'rgba(255,255,255,0.04)', color: editMode ? '#D4A843' : 'var(--text-muted)', fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}>
                        <Settings size={11} /> {editMode ? 'Concluir' : 'Personalizar'}
                    </button>
                </div>
            </div>

            {/* Canvas */}
            <div
                ref={containerRef}
                style={{
                    position: 'relative',
                    height: canvasHeight,
                    width: '100%',
                    userSelect: editMode ? 'none' : 'auto',
                    borderRadius: 14,
                    border: editMode ? '1px dashed rgba(212,168,67,0.25)' : '1px solid transparent',
                    transition: 'border-color 0.2s',
                }}
            >
                {modules.map(mod => {
                    const Icon = mod.icon
                    const pos = positions[mod.href] || { x: 0, y: 0 }
                    const isDragging = dragging === mod.href

                    const card = (
                        <div
                            key={mod.href}
                            onMouseDown={e => onMouseDown(e, mod.href)}
                            className="card"
                            style={{
                                position: 'absolute',
                                left: pos.x, top: pos.y,
                                width: CARD_W,
                                padding: '11px 12px',
                                borderRadius: 12,
                                cursor: editMode ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
                                border: `1px solid ${editMode ? 'rgba(212,168,67,0.25)' : 'var(--border-subtle)'}`,
                                display: 'flex', alignItems: 'flex-start', gap: 8,
                                boxSizing: 'border-box',
                                opacity: isDragging ? 0.85 : 1,
                                zIndex: isDragging ? 100 : 1,
                                boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.35)' : undefined,
                                background: editMode ? 'rgba(212,168,67,0.03)' : undefined,
                                transition: isDragging ? 'none' : 'box-shadow 0.15s, border-color 0.15s',
                            }}
                        >
                            {editMode && <GripVertical size={12} style={{ color: '#D4A843', flexShrink: 0, marginTop: 2, opacity: 0.6 }} />}
                            <div style={{ width: 30, height: 30, borderRadius: 8, background: mod.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Icon size={14} style={{ color: mod.color }} />
                            </div>
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{mod.label}</div>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{mod.desc}</div>
                            </div>
                        </div>
                    )

                    if (editMode) return card

                    return (
                        <Link key={mod.href} href={mod.href} style={{ textDecoration: 'none' }}
                            onMouseEnter={e => { const el = e.currentTarget.firstElementChild as HTMLElement; if (el) { el.style.borderColor = mod.color + '55'; el.style.background = mod.color + '0a' } }}
                            onMouseLeave={e => { const el = e.currentTarget.firstElementChild as HTMLElement; if (el) { el.style.borderColor = 'var(--border-subtle)'; el.style.background = '' } }}>
                            {card}
                        </Link>
                    )
                })}
            </div>

            {editMode && (
                <p style={{ fontSize: 10, color: '#D4A843', marginTop: 8, textAlign: 'center', opacity: 0.7 }}>
                    ✋ Arraste os cards livremente — o layout é salvo automaticamente
                </p>
            )}
        </div>
    )
}

// ── Main export: grid on mobile, canvas on desktop ────────────────────────────
export default function DraggableModuleGrid({ modules, compact = false }: Props) {
    const [isDesktop, setIsDesktop] = useState(false)

    useEffect(() => {
        const mq = window.matchMedia('(min-width: 768px)')
        setIsDesktop(mq.matches)
        const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
        mq.addEventListener('change', handler)
        return () => mq.removeEventListener('change', handler)
    }, [])

    if (isDesktop) return <CanvasMode modules={modules} />
    return <GridMode modules={modules} compact={compact} />
}
