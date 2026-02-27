'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Building2, Save, CheckSquare, Square } from 'lucide-react'

interface Perfil {
    id: string
    email: string
    nome: string
    role: string
    active: boolean
    obras_ids: string[]
}

interface Obra {
    id: string
    nome: string
    endereco?: string
}

export default function AcessoPage() {
    const router = useRouter()
    const [perfis, setPerfis] = useState<Perfil[]>([])
    const [obras, setObras] = useState<Obra[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState<string | null>(null)
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')
    const [obraEdits, setObraEdits] = useState<Record<string, string[]>>({})

    const showSuccess = (msg: string) => {
        setSuccess(msg)
        setTimeout(() => setSuccess(''), 3000)
    }

    useEffect(() => {
        const load = async () => {
            setLoading(true)
            // Buscar perfis
            const pRes = await fetch('/api/usuarios')
            if (pRes.ok) {
                const data: Perfil[] = await pRes.json()
                // Filtrar apenas engenheiros e visualizadores (não admins)
                const filtered = data.filter(p => p.role !== 'admin' && p.active)
                setPerfis(filtered)
                const init: Record<string, string[]> = {}
                filtered.forEach(p => { init[p.id] = p.obras_ids || [] })
                setObraEdits(init)
            } else if (pRes.status === 403) {
                router.push('/dashboard')
                return
            }

            // Buscar obras
            const oRes = await fetch('/api/obras')
            if (oRes.ok) {
                const oData: Obra[] = await oRes.json()
                setObras(oData)
            }

            setLoading(false)
        }
        load()
    }, [])

    const toggleObra = (userId: string, obraId: string) => {
        setObraEdits(prev => {
            const current = prev[userId] || []
            const updated = current.includes(obraId)
                ? current.filter(id => id !== obraId)
                : [...current, obraId]
            return { ...prev, [userId]: updated }
        })
    }

    const selectAll = (userId: string) => {
        setObraEdits(prev => ({ ...prev, [userId]: obras.map(o => o.id) }))
    }

    const clearAll = (userId: string) => {
        setObraEdits(prev => ({ ...prev, [userId]: [] }))
    }

    const saveAccess = async (userId: string) => {
        setSaving(userId)
        const res = await fetch('/api/usuarios', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: userId, obras_ids: obraEdits[userId] }),
        })
        if (res.ok) {
            showSuccess('Acesso salvo com sucesso!')
        } else {
            const d = await res.json()
            setError(d.error || 'Erro ao salvar.')
            setTimeout(() => setError(''), 3000)
        }
        setSaving(null)
    }

    const getRoleLabel = (role: string) => {
        if (role === 'engenheiro') return 'Engenheiro'
        if (role === 'visualizador') return 'Visualizador'
        return role
    }

    const roleColor: Record<string, string> = {
        engenheiro: '#7FA653',
        visualizador: '#5B9BD5',
    }

    return (
        <div style={{ maxWidth: 760, paddingBottom: 80 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <button
                    onClick={() => router.back()}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
                >
                    <ArrowLeft size={20} />
                </button>
                <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Raleway', sans-serif" }}>
                        Controle de Acesso por Obra
                    </h1>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                        Defina quais obras cada usuário pode visualizar no app
                    </p>
                </div>
            </div>

            {/* Info box */}
            <div style={{
                marginBottom: 20, padding: '12px 16px', borderRadius: 8,
                background: 'rgba(91,155,213,0.08)', border: '1px solid rgba(91,155,213,0.2)',
                fontSize: 12, color: 'var(--text-secondary)',
                display: 'flex', gap: 10, alignItems: 'flex-start',
            }}>
                <Building2 size={14} style={{ color: '#5B9BD5', marginTop: 1, flexShrink: 0 }} />
                <span>
                    Engenheiros e Visualizadores só verão as obras atribuídas aqui. Administradores sempre enxergam <strong>todas</strong> as obras.
                </span>
            </div>

            {/* Alertas */}
            {success && (
                <div style={{
                    marginBottom: 16, padding: '10px 14px', borderRadius: 8,
                    background: 'rgba(127,166,83,0.12)', border: '1px solid rgba(127,166,83,0.3)',
                    color: '#7FA653', fontSize: 13, fontWeight: 600,
                }}>
                    ✓ {success}
                </div>
            )}
            {error && (
                <div style={{
                    marginBottom: 16, padding: '10px 14px', borderRadius: 8,
                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                    color: '#EF4444', fontSize: 13, fontWeight: 600,
                }}>
                    ✕ {error}
                </div>
            )}

            {loading ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    Carregando...
                </div>
            ) : perfis.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    Nenhum engenheiro cadastrado. Crie usuários em <strong>Usuários & Permissões</strong>.
                </div>
            ) : obras.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    Nenhuma obra cadastrada no sistema ainda.
                </div>
            ) : (
                <div style={{ display: 'grid', gap: 14 }}>
                    {perfis.map(p => {
                        const assigned = obraEdits[p.id] || []
                        const color = roleColor[p.role] || '#7FA653'
                        return (
                            <div key={p.id} className="card" style={{ padding: '18px 20px' }}>
                                {/* User header */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                    <div style={{
                                        width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                                        background: `${color}18`, border: `2px solid ${color}40`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 14, fontWeight: 800, color,
                                    }}>
                                        {(p.nome || p.email).charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                                            {p.nome || '—'}
                                        </div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.email}</div>
                                    </div>
                                    <span style={{
                                        padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                                        background: `${color}18`, color, border: `1px solid ${color}30`,
                                    }}>
                                        {getRoleLabel(p.role)}
                                    </span>
                                </div>

                                {/* Quick controls */}
                                <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: 11, color: 'var(--text-muted)', alignSelf: 'center' }}>
                                        {assigned.length} de {obras.length} obras
                                    </span>
                                    <button
                                        onClick={() => selectAll(p.id)}
                                        style={{ padding: '3px 9px', fontSize: 10, fontWeight: 600, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 4, color: '#10B981', cursor: 'pointer' }}
                                    >
                                        Todas
                                    </button>
                                    <button
                                        onClick={() => clearAll(p.id)}
                                        style={{ padding: '3px 9px', fontSize: 10, fontWeight: 600, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 4, color: '#EF4444', cursor: 'pointer' }}
                                    >
                                        Nenhuma
                                    </button>
                                </div>

                                {/* Obras checkboxes */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8, marginBottom: 16 }}>
                                    {obras.map(o => {
                                        const checked = assigned.includes(o.id)
                                        return (
                                            <label key={o.id} style={{
                                                display: 'flex', alignItems: 'center', gap: 10,
                                                padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                                                background: checked ? 'rgba(127,166,83,0.08)' : 'rgba(255,255,255,0.03)',
                                                border: `1px solid ${checked ? 'rgba(127,166,83,0.25)' : 'var(--border-subtle)'}`,
                                                transition: 'all 0.15s',
                                            }}>
                                                {checked
                                                    ? <CheckSquare size={15} style={{ color: 'var(--green-primary)', flexShrink: 0 }} />
                                                    : <Square size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                                }
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={() => toggleObra(p.id, o.id)}
                                                    style={{ display: 'none' }}
                                                />
                                                <div style={{ minWidth: 0 }}>
                                                    <div style={{ fontSize: 12, fontWeight: checked ? 700 : 500, color: checked ? 'var(--text-primary)' : 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {o.nome}
                                                    </div>
                                                    {o.endereco && (
                                                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                                                            {o.endereco}
                                                        </div>
                                                    )}
                                                </div>
                                            </label>
                                        )
                                    })}
                                </div>

                                <button
                                    onClick={() => saveAccess(p.id)}
                                    disabled={saving === p.id}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 6,
                                        padding: '9px 18px', borderRadius: 6,
                                        background: 'var(--green-primary)', border: 'none',
                                        color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                    }}
                                >
                                    <Save size={13} />
                                    {saving === p.id ? 'Salvando...' : 'Salvar Acesso'}
                                </button>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
