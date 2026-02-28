import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export function GET(_req: NextRequest) {
    return new ImageResponse(
        (
            <div
                style={{
                    width: 192,
                    height: 192,
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
                        background: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 4px, transparent 4px, transparent 14px)',
                    }}
                />
                <div
                    style={{
                        fontSize: 128,
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
                        width: 116,
                        height: 4,
                        background: 'rgba(255,255,255,0.5)',
                        transform: 'rotate(-30deg)',
                        borderRadius: 2,
                        zIndex: 2,
                    }}
                />
            </div>
        ),
        { width: 192, height: 192 }
    )
}
