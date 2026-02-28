import { ImageResponse } from 'next/og'

// Favicon — fundo preto quadrado com S branco (conforme manual da marca)
export const runtime = 'edge'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
    return new ImageResponse(
        (
            <div style={{ width: 32, height: 32, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: 'white', fontFamily: 'serif', lineHeight: 1 }}>S</div>
            </div>
        ),
        { width: 32, height: 32 }
    )
}
