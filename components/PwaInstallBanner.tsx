'use client'

import { useEffect, useState } from 'react'
import { Download, X, Smartphone } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PwaInstallBanner() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
    const [showBanner, setShowBanner] = useState(false)
    const [isIos, setIsIos] = useState(false)
    const [isInstalled, setIsInstalled] = useState(false)

    useEffect(() => {
        // Registra o service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js', { scope: '/' })
                .catch((err) => console.warn('SW registration failed:', err))
        }

        // Detecta se já está instalado (standalone mode)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches
            || (navigator as any).standalone === true
        if (isStandalone) { setIsInstalled(true); return }

        // Detecta iOS
        const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream
        setIsIos(ios)

        // Banner de instalação (Android/Desktop Chrome)
        const handler = (e: Event) => {
            e.preventDefault()
            setDeferredPrompt(e as BeforeInstallPromptEvent)
            // Só mostra o banner se ainda não foi dispensado antes
            const dismissed = sessionStorage.getItem('pwa-banner-dismissed')
            if (!dismissed) setShowBanner(true)
        }
        window.addEventListener('beforeinstallprompt', handler)

        // iOS: mostra instrução manual se não está instalado
        if (ios) {
            const dismissed = sessionStorage.getItem('pwa-banner-dismissed')
            if (!dismissed) setShowBanner(true)
        }

        return () => window.removeEventListener('beforeinstallprompt', handler)
    }, [])

    async function handleInstall() {
        if (deferredPrompt) {
            await deferredPrompt.prompt()
            const choice = await deferredPrompt.userChoice
            if (choice.outcome === 'accepted') setIsInstalled(true)
            setDeferredPrompt(null)
        }
        setShowBanner(false)
    }

    function handleDismiss() {
        sessionStorage.setItem('pwa-banner-dismissed', '1')
        setShowBanner(false)
    }

    if (isInstalled || !showBanner) return null

    return (
        <div style={{
            position: 'fixed', bottom: 80, left: 12, right: 12, zIndex: 9999,
            background: 'linear-gradient(135deg, #1C2B1A, #2d4a2d)',
            border: '1px solid rgba(82,168,123,0.4)',
            borderRadius: 18, padding: '14px 16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'flex-start', gap: 12,
            animation: 'slideUp 0.3s ease',
        }}>
            <style>{`@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>

            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(82,168,123,0.15)', border: '1px solid rgba(82,168,123,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Smartphone size={20} style={{ color: '#52A87B' }} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 3 }}>
                    Instalar SAGA Engenharia
                </div>
                {isIos ? (
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
                        Toque em <strong style={{ color: '#52A87B' }}>Compartilhar</strong> ({' '}
                        <span style={{ fontSize: 14 }}>⎙</span>{' '}) e depois{' '}
                        <strong style={{ color: '#52A87B' }}>"Tela de Início"</strong>
                    </div>
                ) : (
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
                        Instale o app para acesso rápido direto da tela inicial
                    </div>
                )}

                {!isIos && (
                    <button
                        onClick={handleInstall}
                        style={{
                            marginTop: 10, display: 'flex', alignItems: 'center', gap: 6,
                            padding: '7px 14px', borderRadius: 10,
                            background: 'linear-gradient(135deg, #52A87B, #3d8460)',
                            border: 'none', color: '#fff', fontSize: 12, fontWeight: 700,
                            cursor: 'pointer', boxShadow: '0 3px 10px rgba(82,168,123,0.35)',
                        }}
                    >
                        <Download size={13} /> Instalar agora
                    </button>
                )}
            </div>

            <button
                onClick={handleDismiss}
                style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', flexShrink: 0 }}
            >
                <X size={14} />
            </button>
        </div>
    )
}
