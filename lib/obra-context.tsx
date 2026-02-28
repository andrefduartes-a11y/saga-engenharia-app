'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Obra {
    id: string
    nome: string
    endereco?: string
    cidade?: string
    status: string
}

interface ObraContextType {
    obra: Obra | null
    role: string
    contextLoading: boolean
    setObra: (obra: Obra) => void
    clearObra: () => void
}

const ObraContext = createContext<ObraContextType>({
    obra: null,
    role: '',
    contextLoading: true,
    setObra: () => { },
    clearObra: () => { },
})

export function ObraProvider({ children }: { children: ReactNode }) {
    // Carrega imediatamente do localStorage (síncrono) para evitar flash de tela
    const [obra, setObraState] = useState<Obra | null>(() => {
        if (typeof window === 'undefined') return null
        const saved = localStorage.getItem('saga_obra_selecionada')
        if (saved) { try { return JSON.parse(saved) } catch { return null } }
        return null
    })
    const [role, setRole] = useState('')
    const [contextLoading, setContextLoading] = useState(true)

    useEffect(() => {
        // Fetch user role + assigned obras from API
        fetch('/api/me')
            .then(r => r.ok ? r.json() : null)
            .then(async (me) => {
                if (!me) return
                setRole(me.role)

                // Directors/admins don't need a pre-selected obra
                if (me.role === 'diretor' || me.role === 'admin') {
                    setObraState(null)
                    return
                }

                // Engineers: auto-load their first assigned obra from DB
                const assignedIds: string[] = me.obras_ids || []
                if (assignedIds.length > 0) {
                    const supabase = createClient()
                    const { data } = await supabase
                        .from('obras')
                        .select('id, nome, endereco, cidade, status')
                        .in('id', assignedIds)
                        .eq('status', 'ativa')
                        .order('nome')
                        .limit(1)
                        .single()
                    if (data) {
                        setObraState(data as Obra)
                        // Also persist to localStorage as cache
                        localStorage.setItem('saga_obra_selecionada', JSON.stringify(data))
                        setContextLoading(false)
                        return
                    }
                }

                // Fallback: try localStorage (backwards compat)
                const saved = localStorage.getItem('saga_obra_selecionada')
                if (saved) {
                    try { setObraState(JSON.parse(saved)) } catch {
                        localStorage.removeItem('saga_obra_selecionada')
                    }
                }
                setContextLoading(false)
            })
            .catch(() => {
                // Offline fallback
                const saved = localStorage.getItem('saga_obra_selecionada')
                if (saved) {
                    try { setObraState(JSON.parse(saved)) } catch { /* ignore */ }
                }
                setContextLoading(false)
            })
    }, [])

    const setObra = (obra: Obra) => {
        setObraState(obra)
        localStorage.setItem('saga_obra_selecionada', JSON.stringify(obra))
    }

    const clearObra = () => {
        setObraState(null)
        localStorage.removeItem('saga_obra_selecionada')
    }

    return (
        <ObraContext.Provider value={{ obra, role, contextLoading, setObra, clearObra }}>
            {children}
        </ObraContext.Provider>
    )
}

export function useObra() {
    return useContext(ObraContext)
}
