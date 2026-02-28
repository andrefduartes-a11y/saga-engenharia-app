'use client'

import { useEffect, useState } from 'react'
import { Download, X, Smartphone } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'pwa-banner-dismissed-until'
const DISMISS_DAYS = 3

export default function PwaInstallBanner() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
    const [showBanner, setShowBanner] = useState(false)
    const [isIos, setIsIos] = useState(false)
    const [installed, setInstalled] = useState(false)

    useEffect(() => {
        // Registra o service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js', { scope: '/' })
                .catch(err => console.warn('SW:', err))
        }

        // Já está instalado em modo standalone?
        const isStandalone =
            window.matchMedia('(display-mode: standalone)').matches ||
            (navigator as any).standalone === true
        if (isStandalone) { setInstalled(true); return }

        // Verificar se foi dispensado recentemente (localStorage com expiração)
        const until = localStorage.getItem(DISMISS_KEY)
        const isDismissed = until && Date.now() < parseInt(until)

        // iOS detection
        const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream
        setIsIos(ios)

        // iOS: mostra sempre (instruções manuais)
        if (ios && !isDismissed) {
            setShowBanner(true)
            return
        }

        // Android / Chrome: aguarda beforeinstallprompt
        const handler = (e: Event) => {
            e.preventDefault()
            setDeferredPrompt(e as BeforeInstallPromptEvent)
            if (!isDismissed) setShowBanner(true)
        }
        window.addEventListener('beforeinstallprompt', handler)

        // Detecta quando o app é instalado
        window.addEventListener('appinstalled', () => {
            setInstalled(true)
            setShowBanner(false)
        })

        return () => window.removeEventListener('beforeinstallprompt', handler)
    }, [])

    async function handleInstall() {
        if (deferredPrompt) {
            await deferredPrompt.prompt()
            const { outcome } = await deferredPrompt.userChoice
            if (outcome === 'accepted') setInstalled(true)
            setDeferredPrompt(null)
        }
        setShowBanner(false)
    }

    function handleDismiss() {
        const expiry = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000
        localStorage.setItem(DISMISS_KEY, String(expiry))
        setShowBanner(false)
    }

    if (installed || !showBanner) return null

    return (
        <div style={{
            position: 'fixed', bottom: 80, left: 12, right: 12, zIndex: 9999,
            background: 'linear-gradient(135deg, #1C2B1A, #2d4a2d)',
            border: '1px solid rgba(82,168,123,0.4)',
            borderRadius: 18, padding: '14px 16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.55)',
            display: 'flex', alignItems: 'flex-start', gap: 12,
            animation: 'slideUp 0.35s cubic-bezier(.34,1.56,.64,1)',
        }}>
            <style>{`@keyframes slideUp { from { transform: translateY(24px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }`}</style>

            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(82,168,123,0.18)', border: '1px solid rgba(82,168,123,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Smartphone size={20} style={{ color: '#52A87B' }} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 3 }}>
                    Instalar SAGA Engenharia
                </div>

                {isIos ? (
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.72)', lineHeight: 1.6 }}>
                        Toque em <strong style={{ color: '#52A87B' }}>Compartilhar</strong> <span style={{ fontSize: 15 }}>⎙</span> depois em <strong style={{ color: '#52A87B' }}>"Tela de Início"</strong>
                    </div>
                ) : (
                    <>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 10 }}>
                            Instale o app para acesso rápido na tela inicial
                        </div>
                        <button onClick={handleInstall} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, background: 'linear-gradient(135deg, #52A87B, #3d8460)', border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: '0 3px 10px rgba(82,168,123,0.35)' }}>
                            <Download size={13} /> Instalar agora
                        </button>
                    </>
                )}
            </div>

            <button onClick={handleDismiss} style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', flexShrink: 0 }}>
                <X size={14} />
            </button>
        </div>
    )
}
