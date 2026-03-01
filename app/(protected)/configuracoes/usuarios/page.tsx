'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft, Plus, X, UserCheck, UserX,
    ChevronDown, ChevronUp, Save, Shield, Trash2
} from 'lucide-react'

// ─── Permissões agrupadas por módulo ───────────────────────────────────────────
const PERMISSION_GROUPS = [
    {
        label: '🏗️ Engenharia Operacional',
        items: [
            { key: 'verConcretagem', editKey: 'editarConcretagem', label: 'Concretagem' },
            { key: 'verTerraplanagem', editKey: 'editarTerraplanagem', label: 'Terraplanagem' },
            { key: 'verEquipamentos', editKey: 'editarEquipamentos', label: 'Equipamentos' },
            { key: 'verCaminhoes', editKey: 'editarCaminhoes', label: 'Caminhões' },
        ],
    },
    {
        label: '📊 Controle e Qualidade',
        items: [
            { key: 'verRDO', editKey: 'editarRDO', label: 'RDO — Diário de Obras' },
            { key: 'verInspecoes', editKey: 'editarInspecoes', label: 'FVS — Inspeções' },
            { key: 'verIT', editKey: null, label: 'IT — Instruções Técnicas' },
        ],
    },
    {
        label: '📁 Documentação',
        items: [
            { key: 'verProjetos', editKey: 'editarProjetos', label: 'Projetos' },
            { key: 'verDocumentos', editKey: 'editarDocumentos', label: 'Documentos' },
        ],
    },
    {
        label: '⚙️ Gestão e Suporte',
        items: [
            { key: 'verSuprimentos', editKey: 'editarSuprimentos', label: 'Suprimentos' },
            { key: 'verAssistente', editKey: null, label: 'Assistente IA' },
            { key: 'verEAD', editKey: null, label: 'EAD / Treinamentos' },
            { key: 'verFAQ', editKey: null, label: 'FAQ / DRH' },
        ],
    },
    {
        label: '🔐 Administração',
        items: [
            { key: 'verConfiguracoes', editKey: 'editarConfiguracoes', label: 'Configurações' },
        ],
    },
]

const ALL_PERM_KEYS = PERMISSION_GROUPS.flatMap(g => g.items.flatMap(i => i.editKey ? [i.key, i.editKey] : [i.key]))

// Permissões padrão por role
const DIRETOR_FULL = Object.fromEntries(ALL_PERM_KEYS.map(k => [k, true]))
const DEFAULT_PERMS: Record<string, Record<string, boolean>> = {
    diretor: DIRETOR_FULL,
    admin: DIRETOR_FULL,
    engenheiro: Object.fromEntries(ALL_PERM_KEYS.map(k => [k, [
        'verConcretagem', 'verTerraplanagem', 'verEquipamentos', 'verCaminhoes',
        'verRDO', 'verInspecoes', 'verIT', 'verProjetos', 'verDocumentos',
        'verSuprimentos', 'verAssistente',
    ].includes(k)])),
}

interface Perfil {
    id: string
    email: string
    nome: string
    role: string
    active: boolean
    permissions: Record<string, boolean> | null
    obras_ids: string[]
    created_at: string
}

const ROLES = [
    { value: 'admin', label: 'Admin', desc: 'Acesso total incluindo Configurações' },
    { value: 'diretor', label: 'Diretor', desc: 'Acesso total — vê todas as obras, sem Configurações' },
    { value: 'engenheiro', label: 'Engenheiro', desc: 'Acesso operacional por obras vinculadas' },
]

const parsePerms = (raw: Record<string, boolean> | null, role: string): Record<string, boolean> => {
    if (raw && Object.keys(raw).length > 0) return raw
    return { ...(DEFAULT_PERMS[role] || DEFAULT_PERMS.engenheiro) }
}

export default function UsuariosPage() {
    const router = useRouter()
    const [perfis, setPerfis] = useState<Perfil[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [form, setForm] = useState({ email: '', nome: '', password: '', role: 'engenheiro' })
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [permEdits, setPermEdits] = useState<Record<string, Record<string, boolean>>>({})
    const [permSaving, setPermSaving] = useState<string | null>(null)
    const [deletando, setDeletando] = useState<string | null>(null)
    const [roleChanging, setRoleChanging] = useState<string | null>(null)

    const load = async () => {
        setLoading(true)
        const res = await fetch('/api/usuarios')
        if (res.ok) {
            const data: Perfil[] = await res.json()
            setPerfis(data)
            const init: Record<string, Record<string, boolean>> = {}
            data.forEach(p => { init[p.id] = parsePerms(p.permissions, p.role) })
            setPermEdits(init)
        } else if (res.status === 403) {
            router.push('/dashboard')
        }
        setLoading(false)
    }

    useEffect(() => { load() }, [])

    const showSuccess = (msg: string) => {
        setSuccess(msg)
        setTimeout(() => setSuccess(''), 3000)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true); setError(''); setSuccess('')
        const res = await fetch('/api/usuarios', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
        })
        if (res.ok) {
            showSuccess('Usuário criado com sucesso!')
            setShowForm(false)
            setForm({ email: '', nome: '', password: '', role: 'engenheiro' })
            load()
        } else {
            const d = await res.json()
            setError(d.error || 'Erro ao criar usuário.')
        }
        setSaving(false)
    }

    const toggleActive = async (id: string, active: boolean) => {
        await fetch('/api/usuarios', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, active: !active }),
        })
        load()
    }

    const savePermissions = async (userId: string) => {
        setPermSaving(userId)
        const res = await fetch('/api/usuarios', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: userId, permissions: permEdits[userId] }),
        })
        if (res.ok) showSuccess('Permissões salvas!')
        setPermSaving(null)
    }

    const changeRole = async (userId: string, newRole: string) => {
        setRoleChanging(userId)
        const res = await fetch('/api/usuarios', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: userId, role: newRole }),
        })
        if (res.ok) {
            showSuccess(`Role atualizado para ${ROLES.find(r => r.value === newRole)?.label}!`)
            load()
        } else {
            const d = await res.json()
            setError(d.error || 'Erro ao atualizar role.')
        }
        setRoleChanging(null)
    }

    const deleteUser = async (id: string, nome: string) => {
        if (!confirm(`Apagar o usuário "${nome}" permanentemente? Esta ação não pode ser desfeita.`)) return
        setDeletando(id)
        const res = await fetch('/api/usuarios', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        })
        if (res.ok) {
            showSuccess('Usuário apagado com sucesso.')
            load()
        } else {
            const d = await res.json()
            setError(d.error || 'Erro ao apagar usuário.')
        }
        setDeletando(null)
    }

    const togglePerm = (userId: string, key: string) => {
        setPermEdits(prev => ({
            ...prev,
            [userId]: { ...(prev[userId] || {}), [key]: !(prev[userId]?.[key]) },
        }))
    }

    const setAllPerms = (userId: string, value: boolean) => {
        setPermEdits(prev => ({
            ...prev,
            [userId]: Object.fromEntries(ALL_PERM_KEYS.map(k => [k, value])),
        }))
    }

    const resetToRole = (userId: string, role: string) => {
        setPermEdits(prev => ({ ...prev, [userId]: { ...DEFAULT_PERMS[role] } }))
    }

    const getRoleBadge = (role: string) => ROLES.find(r => r.value === role)?.label || role

    const roleColor: Record<string, string> = {
        diretor: '#7FA653',
        admin: '#D4A843',
        engenheiro: '#5B9BD5',
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
                        Usuários & Permissões
                    </h1>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                        Controle granular de acesso por usuário
                    </p>
                </div>
                <button
                    onClick={() => { setShowForm(!showForm); setError('') }}
                    className="btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 13 }}
                >
                    {showForm ? <X size={14} /> : <Plus size={14} />}
                    {showForm ? 'Cancelar' : 'Novo Usuário'}
                </button>
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

            {/* Formulário de criação */}
            {showForm && (
                <form onSubmit={handleSubmit} className="card" style={{ marginBottom: 20, padding: '20px' }}>
                    <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>
                        Novo Usuário
                    </h2>
                    <div style={{ display: 'grid', gap: 14 }}>
                        <div>
                            <label className="label">Nome Completo *</label>
                            <input
                                className="input" required
                                value={form.nome}
                                onChange={e => setForm(p => ({ ...p, nome: e.target.value }))}
                                placeholder="Ex: João Silva"
                            />
                        </div>
                        <div>
                            <label className="label">E-mail *</label>
                            <input
                                className="input" type="email" required
                                value={form.email}
                                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                                placeholder="joao@sagaconstrutora.com.br"
                            />
                        </div>
                        <div>
                            <label className="label">Senha Inicial *</label>
                            <input
                                className="input" type="password" required minLength={6}
                                value={form.password}
                                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                                placeholder="Mínimo 6 caracteres"
                            />
                        </div>
                        <div>
                            <label className="label">Perfil base *</label>
                            <div style={{ display: 'grid', gap: 8, marginTop: 6 }}>
                                {ROLES.map(r => (
                                    <label key={r.value} style={{
                                        display: 'flex', alignItems: 'center', gap: 12,
                                        padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                                        background: form.role === r.value ? `${roleColor[r.value]}12` : 'rgba(255,255,255,0.03)',
                                        border: `1px solid ${form.role === r.value ? `${roleColor[r.value]}40` : 'var(--border-subtle)'}`,
                                        transition: 'all 0.15s',
                                    }}>
                                        <input
                                            type="radio" name="role" value={r.value}
                                            checked={form.role === r.value}
                                            onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                                            style={{ accentColor: roleColor[r.value] }}
                                        />
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{r.label}</div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.desc}</div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <button type="submit" className="btn-primary" disabled={saving} style={{ marginTop: 4 }}>
                            {saving ? 'Criando...' : 'Criar Usuário'}
                        </button>
                    </div>
                </form>
            )}

            {/* Lista de usuários */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    Carregando usuários...
                </div>
            ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                    {perfis.map(p => {
                        const isExpanded = expandedId === p.id
                        const perms = permEdits[p.id] || parsePerms(p.permissions, p.role)
                        const activeCount = ALL_PERM_KEYS.filter(k => perms[k]).length
                        const color = roleColor[p.role] || '#7FA653'

                        return (
                            <div key={p.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                {/* Linha do usuário */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px' }}>
                                    {/* Avatar */}
                                    <div style={{
                                        width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                                        background: p.active ? `${color}18` : 'rgba(255,255,255,0.05)',
                                        border: `2px solid ${p.active ? `${color}40` : 'rgba(255,255,255,0.1)'}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 15, fontWeight: 800,
                                        color: p.active ? color : 'var(--text-muted)',
                                    }}>
                                        {(p.nome || p.email).charAt(0).toUpperCase()}
                                    </div>

                                    {/* Info */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: p.active ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                            {p.nome || '—'}
                                        </div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{p.email}</div>
                                    </div>

                                    {/* Ações */}
                                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>

                                        {/* Seletor de Role */}
                                        <select
                                            value={p.role}
                                            disabled={roleChanging === p.id}
                                            onChange={e => changeRole(p.id, e.target.value)}
                                            style={{
                                                padding: '3px 6px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                                                background: `${roleColor[p.role] || '#7FA653'}18`,
                                                color: roleColor[p.role] || '#7FA653',
                                                border: `1px solid ${roleColor[p.role] || '#7FA653'}33`,
                                                cursor: 'pointer', appearance: 'none', paddingRight: 20,
                                            }}
                                        >
                                            {ROLES.map(r => (
                                                <option key={r.value} value={r.value} style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                                                    {r.label}
                                                </option>
                                            ))}
                                        </select>

                                        {/* Permission count */}
                                        <span style={{
                                            display: 'flex', alignItems: 'center', gap: 3,
                                            padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                                            background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)',
                                            border: '1px solid var(--border-subtle)',
                                        }}>
                                            <Shield size={10} /> {activeCount}/{ALL_PERM_KEYS.length}
                                        </span>

                                        {/* Toggle active */}
                                        <button
                                            onClick={() => toggleActive(p.id, p.active)}
                                            title={p.active ? 'Desativar usuário' : 'Ativar usuário'}
                                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: p.active ? '#10B981' : 'var(--text-muted)', padding: 4 }}
                                        >
                                            {p.active ? <UserCheck size={18} /> : <UserX size={18} />}
                                        </button>

                                        {/* Apagar */}
                                        <button
                                            onClick={() => deleteUser(p.id, p.nome || p.email)}
                                            disabled={deletando === p.id}
                                            title="Apagar usuário"
                                            style={{ background: 'transparent', border: 'none', cursor: deletando === p.id ? 'wait' : 'pointer', color: '#EF4444', padding: 4, opacity: deletando === p.id ? 0.5 : 1 }}
                                        >
                                            <Trash2 size={15} />
                                        </button>

                                        {/* Expand */}
                                        <button
                                            onClick={() => setExpandedId(isExpanded ? null : p.id)}
                                            title="Editar permissões"
                                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
                                        >
                                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Painel de permissões */}
                                {isExpanded && (
                                    <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '16px 18px', background: 'rgba(255,255,255,0.015)' }}>
                                        {/* Controles */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
                                                🔐 Permissões — {p.nome?.split(' ')[0] || p.email}
                                            </div>
                                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                <button onClick={() => resetToRole(p.id, p.role)} style={{ padding: '4px 10px', fontSize: 10, fontWeight: 600, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--text-muted)', cursor: 'pointer' }}>
                                                    Reset ({getRoleBadge(p.role)})
                                                </button>
                                                <button onClick={() => setAllPerms(p.id, true)} style={{ padding: '4px 10px', fontSize: 10, fontWeight: 600, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 4, color: '#10B981', cursor: 'pointer' }}>
                                                    Marcar todos
                                                </button>
                                                <button onClick={() => setAllPerms(p.id, false)} style={{ padding: '4px 10px', fontSize: 10, fontWeight: 600, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 4, color: '#EF4444', cursor: 'pointer' }}>
                                                    Desmarcar todos
                                                </button>
                                            </div>
                                        </div>

                                        {/* Checkboxes com ver + editar */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 16 }}>
                                            {PERMISSION_GROUPS.map(group => (
                                                <div key={group.label}>
                                                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.3px' }}>
                                                        {group.label}
                                                    </div>
                                                    <div style={{ display: 'grid', gap: 5 }}>
                                                        {group.items.map(item => {
                                                            const canView = perms[item.key] ?? false
                                                            const canEdit = item.editKey ? (perms[item.editKey] ?? false) : null
                                                            return (
                                                                <div key={item.key} style={{
                                                                    padding: '7px 10px', borderRadius: 6,
                                                                    background: canView ? 'rgba(127,166,83,0.06)' : 'rgba(255,255,255,0.03)',
                                                                    border: `1px solid ${canView ? 'rgba(127,166,83,0.2)' : 'var(--border-subtle)'}`,
                                                                }}>
                                                                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>{item.label}</div>
                                                                    <div style={{ display: 'flex', gap: 8 }}>
                                                                        {/* Ver */}
                                                                        <label style={{
                                                                            display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', flex: 1,
                                                                            padding: '4px 8px', borderRadius: 4,
                                                                            background: canView ? 'rgba(52,152,219,0.12)' : 'rgba(255,255,255,0.04)',
                                                                            border: `1px solid ${canView ? 'rgba(52,152,219,0.3)' : 'var(--border-subtle)'}`,
                                                                        }}>
                                                                            <input type="checkbox" checked={canView}
                                                                                onChange={() => togglePerm(p.id, item.key)}
                                                                                style={{ accentColor: '#3498DB', width: 12, height: 12, cursor: 'pointer' }} />
                                                                            <span style={{ fontSize: 11, color: canView ? '#3498DB' : 'var(--text-muted)', fontWeight: canView ? 700 : 400 }}>Visualizar</span>
                                                                        </label>
                                                                        {/* Editar */}
                                                                        {item.editKey && (
                                                                            <label style={{
                                                                                display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', flex: 1,
                                                                                padding: '4px 8px', borderRadius: 4,
                                                                                background: canEdit ? 'rgba(230,126,34,0.12)' : 'rgba(255,255,255,0.04)',
                                                                                border: `1px solid ${canEdit ? 'rgba(230,126,34,0.3)' : 'var(--border-subtle)'}`,
                                                                                opacity: canView ? 1 : 0.4,
                                                                                pointerEvents: canView ? 'auto' : 'none',
                                                                            }}>
                                                                                <input type="checkbox" checked={canEdit ?? false}
                                                                                    onChange={() => item.editKey && togglePerm(p.id, item.editKey)}
                                                                                    style={{ accentColor: '#E67E22', width: 12, height: 12, cursor: 'pointer' }} />
                                                                                <span style={{ fontSize: 11, color: canEdit ? '#E67E22' : 'var(--text-muted)', fontWeight: canEdit ? 700 : 400 }}>Editar</span>
                                                                            </label>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <button
                                            onClick={() => savePermissions(p.id)}
                                            disabled={permSaving === p.id}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 6,
                                                padding: '9px 18px', borderRadius: 6,
                                                background: 'var(--green-primary)', border: 'none',
                                                color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                            }}
                                        >
                                            <Save size={13} />
                                            {permSaving === p.id ? 'Salvando...' : 'Salvar Permissões'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )
                    })}

                    {perfis.length === 0 && (
                        <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                            Nenhum usuário cadastrado ainda.
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
