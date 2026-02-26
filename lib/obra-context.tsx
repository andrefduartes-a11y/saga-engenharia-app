'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface Obra {
    id: string
    nome: string
    endereco?: string
    status: string
}

interface ObraContextType {
    obra: Obra | null
    setObra: (obra: Obra) => void
    clearObra: () => void
}

const ObraContext = createContext<ObraContextType>({
    obra: null,
    setObra: () => { },
    clearObra: () => { },
})

export function ObraProvider({ children }: { children: ReactNode }) {
    const [obra, setObraState] = useState<Obra | null>(null)

    useEffect(() => {
        // Carregar obra salva do localStorage ao iniciar
        const saved = localStorage.getItem('saga_obra_selecionada')
        if (saved) {
            try {
                setObraState(JSON.parse(saved))
            } catch {
                localStorage.removeItem('saga_obra_selecionada')
            }
        }
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
        <ObraContext.Provider value={{ obra, setObra, clearObra }}>
            {children}
        </ObraContext.Provider>
    )
}

export function useObra() {
    return useContext(ObraContext)
}
