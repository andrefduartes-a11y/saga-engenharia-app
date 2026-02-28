import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export function GET(_req: NextRequest) {
    return new ImageResponse(
        (
            <div
                style={{
                    width: 512,
                    height: 512,
                    background: '#000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 8px, transparent 8px, transparent 30px)',
                    }}
                />
                <div
                    style={{
                        fontSize: 340,
                        fontWeight: 900,
                        color: 'white',
                        fontFamily: 'serif',
                        lineHeight: 1,
                        position: 'relative',
                        zIndex: 1,
                    }}
                >
                    S
                </div>
                <div
                    style={{
                        position: 'absolute',
                        width: 300,
                        height: 8,
                        background: 'rgba(255,255,255,0.45)',
                        transform: 'rotate(-30deg)',
                        borderRadius: 4,
                        zIndex: 2,
                    }}
                />
            </div>
        ),
        { width: 512, height: 512 }
    )
}
