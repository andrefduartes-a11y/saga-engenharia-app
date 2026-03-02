'use client'

import { Wrench } from 'lucide-react'

export default function AssistenciaTecnicaPage() {
    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', minHeight: '70vh', gap: 20, padding: 24,
            textAlign: 'center',
        }}>
            {/* Ícone animado */}
            <div style={{
                width: 80, height: 80, borderRadius: 24,
                background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'pulse 2s infinite',
            }}>
                <Wrench size={36} style={{ color: '#F59E0B' }} />
            </div>

            <div>
                <h1 style={{
                    fontSize: 26, fontWeight: 900, color: 'var(--text-primary)',
                    fontFamily: "'Raleway', sans-serif", marginBottom: 8,
                }}>
                    Assistência Técnica
                </h1>
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '6px 18px', borderRadius: 99,
                    background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
                    fontSize: 13, fontWeight: 700, color: '#F59E0B',
                    marginBottom: 16,
                }}>
                    🚧 Em construção
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 320, lineHeight: 1.6 }}>
                    Este módulo está sendo desenvolvido e em breve estará disponível.
                </p>
            </div>
        </div>
    )
}
