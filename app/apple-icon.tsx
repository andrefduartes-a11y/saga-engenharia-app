import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #1C2B1A 0%, #2d4a2d 100%)',
                    position: 'relative',
                }}
            >
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 6px, transparent 6px, transparent 20px)',
                }} />
                <div style={{
                    fontSize: 108,
                    fontWeight: 900,
                    color: 'white',
                    fontFamily: 'serif',
                    lineHeight: 1,
                    position: 'relative',
                    zIndex: 1,
                    textShadow: '0 4px 20px rgba(0,0,0,0.4)',
                }}>
                    S
                </div>
                <div style={{
                    position: 'absolute',
                    width: 108,
                    height: 3,
                    background: 'rgba(255,255,255,0.6)',
                    transform: 'rotate(-30deg)',
                    borderRadius: 2,
                    zIndex: 2,
                }} />
            </div>
        ),
        { width: 180, height: 180 }
    )
}
