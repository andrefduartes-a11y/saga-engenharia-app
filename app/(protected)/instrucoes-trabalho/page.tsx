'use client'

import { useState, useEffect, useMemo } from 'react'
import { BookOpen, Search, X, ChevronRight, Shield, Wrench, Package, HardHat, ListChecks, Layers, CheckSquare } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────
interface Verificacao { item: string; descricao: string; tolerancia: string }
interface SecaoSequencia { secao: string; passos: string[] }
interface IT {
    codigo: string
    titulo: string
    revisao: string
    categoria: string
    subcategoria: string
    normas: string[]
    ferramentas: string[]
    materiais: string[]
    epis: string[]
    condicoes_inicio: string[]
    sequencia: SecaoSequencia[]
    verificacoes: Verificacao[]
}

// ── Colour map per category ────────────────────────────────────────────────────
const CAT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    'Infraestrutura': { bg: 'rgba(230,126,34,0.12)', text: '#E67E22', border: 'rgba(230,126,34,0.25)' },
    'Fundações': { bg: 'rgba(231,76,60,0.12)', text: '#E74C3C', border: 'rgba(231,76,60,0.25)' },
    'Estrutura': { bg: 'rgba(52,152,219,0.12)', text: '#3498DB', border: 'rgba(52,152,219,0.25)' },
    'Alvenaria': { bg: 'rgba(155,89,182,0.12)', text: '#9B59B6', border: 'rgba(155,89,182,0.25)' },
    'Cobertura': { bg: 'rgba(52,73,94,0.18)', text: '#95A5A6', border: 'rgba(149,165,166,0.25)' },
    'Instalações': { bg: 'rgba(26,188,156,0.12)', text: '#1ABC9C', border: 'rgba(26,188,156,0.25)' },
    'Revestimentos': { bg: 'rgba(241,196,15,0.12)', text: '#F1C40F', border: 'rgba(241,196,15,0.25)' },
    'Impermeabilização': { bg: 'rgba(52,152,219,0.12)', text: '#2980B9', border: 'rgba(52,152,219,0.25)' },
    'Esquadrias': { bg: 'rgba(127,166,83,0.12)', text: '#7FA653', border: 'rgba(127,166,83,0.25)' },
    'Pintura': { bg: 'rgba(243,156,18,0.12)', text: '#F39C12', border: 'rgba(243,156,18,0.25)' },
}
function catColor(cat: string) {
    return CAT_COLORS[cat] || { bg: 'rgba(212,168,67,0.12)', text: '#D4A843', border: 'rgba(212,168,67,0.25)' }
}

// ── Detail Drawer ──────────────────────────────────────────────────────────────
function ITDrawer({ it, onClose }: { it: IT; onClose: () => void }) {
    const c = catColor(it.categoria)
    return (
        <>
            {/* Backdrop */}
            <div onClick={onClose} style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 200,
                backdropFilter: 'blur(3px)',
            }} />
            {/* Drawer */}
            <div style={{
                position: 'fixed', top: 0, right: 0, bottom: 0,
                width: 'min(600px, 100vw)',
                background: 'var(--bg-card, #1a1f24)',
                borderLeft: '1px solid var(--border-subtle)',
                zIndex: 201, overflowY: 'auto', padding: '0 0 80px',
                boxShadow: '-8px 0 40px rgba(0,0,0,0.4)',
            }}>
                {/* Header */}
                <div style={{
                    position: 'sticky', top: 0, zIndex: 1,
                    background: 'var(--bg-card, #1a1f24)',
                    borderBottom: '1px solid var(--border-subtle)',
                    padding: '16px 20px',
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>{it.codigo}</span>
                            <span style={{ fontSize: 10, color: 'var(--text-muted)', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 4 }}>Rev {it.revisao}</span>
                            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{it.subcategoria}</span>
                        </div>
                        <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3 }}>{it.titulo}</h2>
                        <div style={{ fontSize: 11, color: c.text, marginTop: 2, fontWeight: 600 }}>{it.categoria}</div>
                    </div>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: 'var(--text-muted)', borderRadius: 8, padding: 6, cursor: 'pointer', flexShrink: 0 }}>
                        <X size={16} />
                    </button>
                </div>

                <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>

                    {/* Normas */}
                    {it.normas.length > 0 && (
                        <Section icon={<Shield size={14} />} title="Normas Aplicáveis" color="#3498DB">
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {it.normas.map(n => <Chip key={n} label={n} color="#3498DB" />)}
                            </div>
                        </Section>
                    )}

                    {/* Condições de Início */}
                    {it.condicoes_inicio.length > 0 && (
                        <Section icon={<CheckSquare size={14} />} title="Condições para Início" color="#1ABC9C">
                            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {it.condicoes_inicio.map((c, i) => (
                                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                                        <span style={{ color: '#1ABC9C', fontWeight: 800, flexShrink: 0, marginTop: 1 }}>✓</span> {c}
                                    </li>
                                ))}
                            </ul>
                        </Section>
                    )}

                    {/* EPIs */}
                    {it.epis.length > 0 && (
                        <Section icon={<HardHat size={14} />} title="EPIs Necessários" color="#E74C3C">
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {it.epis.map(e => <Chip key={e} label={e} color="#E74C3C" />)}
                            </div>
                        </Section>
                    )}

                    {/* Ferramentas */}
                    {it.ferramentas.length > 0 && (
                        <Section icon={<Wrench size={14} />} title="Ferramentas" color="#E67E22">
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {it.ferramentas.map(f => <Chip key={f} label={f} color="#E67E22" />)}
                            </div>
                        </Section>
                    )}

                    {/* Materiais */}
                    {it.materiais.length > 0 && (
                        <Section icon={<Package size={14} />} title="Materiais" color="#9B59B6">
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {it.materiais.map(m => <Chip key={m} label={m} color="#9B59B6" />)}
                            </div>
                        </Section>
                    )}

                    {/* Sequência */}
                    {it.sequencia.length > 0 && (
                        <Section icon={<Layers size={14} />} title="Sequência de Execução" color="#D4A843">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                {it.sequencia.map((s, si) => (
                                    <div key={si}>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: '#D4A843', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.secao}</div>
                                        <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            {s.passos.map((p, pi) => (
                                                <li key={pi} style={{ display: 'flex', gap: 10, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                                    <span style={{ background: 'rgba(212,168,67,0.15)', color: '#D4A843', borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 800, flexShrink: 0, alignSelf: 'flex-start', marginTop: 2 }}>{pi + 1}</span>
                                                    {p}
                                                </li>
                                            ))}
                                        </ol>
                                    </div>
                                ))}
                            </div>
                        </Section>
                    )}

                    {/* Verificações */}
                    {it.verificacoes.length > 0 && (
                        <Section icon={<ListChecks size={14} />} title="Verificações de Qualidade" color="#7FA653">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {it.verificacoes.map((v) => (
                                    <div key={v.item} style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(127,166,83,0.05)', border: '1px solid rgba(127,166,83,0.15)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                                            <div style={{ flex: 1 }}>
                                                <span style={{ fontSize: 10, fontWeight: 800, color: '#7FA653', marginRight: 6 }}>{v.item}</span>
                                                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{v.descricao}</span>
                                            </div>
                                            <span style={{ fontSize: 10, color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 4, whiteSpace: 'nowrap', flexShrink: 0 }}>{v.tolerancia}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Section>
                    )}
                </div>
            </div>
        </>
    )
}

function Section({ icon, title, color, children }: { icon: React.ReactNode; title: string; color: string; children: React.ReactNode }) {
    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <div style={{ color, display: 'flex' }}>{icon}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.6px' }}>{title}</div>
            </div>
            {children}
        </div>
    )
}

function Chip({ label, color }: { label: string; color: string }) {
    return (
        <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 6, background: `${color}12`, color, border: `1px solid ${color}25`, fontWeight: 500 }}>
            {label}
        </span>
    )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ITsPage() {
    const [its, setITs] = useState<IT[]>([])
    const [loading, setLoading] = useState(true)
    const [busca, setBusca] = useState('')
    const [catFiltro, setCatFiltro] = useState<string | null>(null)
    const [subcatFiltro, setSubcatFiltro] = useState<string | null>(null)
    const [selected, setSelected] = useState<IT | null>(null)

    useEffect(() => {
        fetch('/its_construcao.json')
            .then(r => r.json())
            .then((data: IT[]) => { setITs(data); setLoading(false) })
            .catch(() => setLoading(false))
    }, [])

    const categorias = useMemo(() => Array.from(new Set(its.map(i => i.categoria))).sort(), [its])
    const subcategorias = useMemo(() => {
        const base = catFiltro ? its.filter(i => i.categoria === catFiltro) : its
        return Array.from(new Set(base.map(i => i.subcategoria))).sort()
    }, [its, catFiltro])

    const filtered = useMemo(() => {
        const q = busca.toLowerCase()
        return its.filter(it => {
            if (catFiltro && it.categoria !== catFiltro) return false
            if (subcatFiltro && it.subcategoria !== subcatFiltro) return false
            if (q) {
                return (
                    it.codigo.toLowerCase().includes(q) ||
                    it.titulo.toLowerCase().includes(q) ||
                    it.subcategoria.toLowerCase().includes(q) ||
                    it.normas.some(n => n.toLowerCase().includes(q))
                )
            }
            return true
        })
    }, [its, busca, catFiltro, subcatFiltro])

    // Group filtered ITs by categoria
    const grouped = useMemo(() => {
        const map = new Map<string, IT[]>()
        filtered.forEach(it => {
            if (!map.has(it.categoria)) map.set(it.categoria, [])
            map.get(it.categoria)!.push(it)
        })
        return map
    }, [filtered])

    return (
        <div style={{ padding: '16px', maxWidth: 900 }}>
            {/* Header */}
            <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(212,168,67,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <BookOpen size={18} style={{ color: '#D4A843' }} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Raleway', sans-serif" }}>
                            Terminal de ITs
                        </h1>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{its.length} Instruções Técnicas de Serviço disponíveis</p>
                    </div>
                </div>
            </div>

            {/* Search bar */}
            <div style={{ position: 'relative', marginBottom: 12 }}>
                <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input
                    value={busca}
                    onChange={e => setBusca(e.target.value)}
                    placeholder="Buscar por código, título, subcategoria ou norma..."
                    style={{
                        width: '100%', boxSizing: 'border-box',
                        padding: '10px 12px 10px 36px',
                        background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)',
                        borderRadius: 10, color: 'var(--text-primary)', fontSize: 13,
                        outline: 'none',
                    }}
                    onFocus={e => (e.target.style.borderColor = 'rgba(212,168,67,0.5)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border-subtle)')}
                />
                {busca && (
                    <button onClick={() => setBusca('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}>
                        <X size={14} />
                    </button>
                )}
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
                {/* Category pills */}
                <button onClick={() => { setCatFiltro(null); setSubcatFiltro(null) }}
                    style={{
                        padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: '1px solid', transition: 'all 0.15s',
                        background: catFiltro === null ? 'rgba(212,168,67,0.15)' : 'rgba(255,255,255,0.04)',
                        color: catFiltro === null ? '#D4A843' : 'var(--text-muted)',
                        borderColor: catFiltro === null ? 'rgba(212,168,67,0.4)' : 'var(--border-subtle)',
                    }}>
                    Todas
                </button>
                {categorias.map(cat => {
                    const c = catColor(cat)
                    const active = catFiltro === cat
                    return (
                        <button key={cat} onClick={() => { setCatFiltro(active ? null : cat); setSubcatFiltro(null) }}
                            style={{
                                padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: '1px solid', transition: 'all 0.15s',
                                background: active ? c.bg : 'rgba(255,255,255,0.04)',
                                color: active ? c.text : 'var(--text-muted)',
                                borderColor: active ? c.border : 'var(--border-subtle)',
                            }}>
                            {cat}
                        </button>
                    )
                })}
            </div>

            {/* Sub-category pills (only when a category is selected) */}
            {catFiltro && subcategorias.length > 1 && (
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 16 }}>
                    {subcategorias.map(sub => (
                        <button key={sub} onClick={() => setSubcatFiltro(subcatFiltro === sub ? null : sub)}
                            style={{
                                padding: '3px 9px', borderRadius: 4, fontSize: 10, fontWeight: 600, cursor: 'pointer', border: '1px solid', transition: 'all 0.15s',
                                background: subcatFiltro === sub ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)',
                                color: subcatFiltro === sub ? 'var(--text-primary)' : 'var(--text-muted)',
                                borderColor: subcatFiltro === sub ? 'rgba(255,255,255,0.2)' : 'var(--border-subtle)',
                            }}>
                            {sub}
                        </button>
                    ))}
                </div>
            )}

            {/* Results count */}
            {(busca || catFiltro) && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
                    {filtered.length} resultado{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
                </div>
            )}

            {/* IT List */}
            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[1, 2, 3, 4].map(i => <div key={i} style={{ height: 70, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)' }} />)}
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
                    <BookOpen size={36} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.4 }} />
                    <div style={{ fontSize: 14, fontWeight: 600 }}>Nenhuma IT encontrada</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>Tente ajustar os filtros ou a busca</div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {Array.from(grouped.entries()).map(([cat, items]) => {
                        const c = catColor(cat)
                        return (
                            <div key={cat}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: c.text, textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ width: 16, height: 2, background: c.text, borderRadius: 1, display: 'inline-block' }} />
                                    {cat} <span style={{ fontWeight: 400, color: 'var(--text-muted)', textTransform: 'none', letterSpacing: 0 }}>({items.length})</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {items.map(it => (
                                        <button key={it.codigo} onClick={() => setSelected(it)}
                                            style={{
                                                width: '100%', textAlign: 'left', cursor: 'pointer',
                                                padding: '12px 16px', borderRadius: 12,
                                                background: 'rgba(255,255,255,0.025)',
                                                border: '1px solid var(--border-subtle)',
                                                display: 'flex', alignItems: 'center', gap: 12,
                                                transition: 'all 0.15s',
                                            }}
                                            onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = c.border; el.style.background = c.bg }}
                                            onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = 'var(--border-subtle)'; el.style.background = 'rgba(255,255,255,0.025)' }}
                                        >
                                            {/* Code badge */}
                                            <div style={{ width: 56, height: 40, borderRadius: 8, background: c.bg, border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <span style={{ fontSize: 10, fontWeight: 800, color: c.text }}>{it.codigo}</span>
                                            </div>
                                            {/* Info */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.titulo}</div>
                                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{it.subcategoria} · Rev {it.revisao}</div>
                                            </div>
                                            {/* Normas count */}
                                            <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'right', flexShrink: 0 }}>
                                                <div style={{ color: '#3498DB', fontWeight: 600 }}>{it.normas.length} norma{it.normas.length !== 1 ? 's' : ''}</div>
                                                <div>{it.verificacoes.length} verif.</div>
                                            </div>
                                            <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Drawer */}
            {selected && <ITDrawer it={selected} onClose={() => setSelected(null)} />}
        </div>
    )
}
