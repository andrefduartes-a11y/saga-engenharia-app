import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    try {
        const apiKey = process.env.OPENAI_API_KEY
        if (!apiKey) return NextResponse.json({ erro: 'OpenAI não configurada' }, { status: 500 })

        const formData = await req.formData()
        const audioFile = formData.get('audio') as File

        if (!audioFile) return NextResponse.json({ erro: 'Arquivo de áudio não encontrado' }, { status: 400 })

        const whisperForm = new FormData()
        whisperForm.append('file', audioFile, 'audio.webm')
        whisperForm.append('model', 'whisper-1')
        whisperForm.append('language', 'pt')

        const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: { Authorization: `Bearer ${apiKey}` },
            body: whisperForm,
        })

        if (!res.ok) {
            const err = await res.text()
            return NextResponse.json({ erro: err }, { status: res.status })
        }

        const { text } = await res.json()
        return NextResponse.json({ texto: text })
    } catch (err: any) {
        return NextResponse.json({ erro: err.message }, { status: 500 })
    }
}
