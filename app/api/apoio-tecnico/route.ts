import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
})

const SYSTEM_PROMPT = `Você é um assistente técnico de obra experiente. Responda de forma objetiva e curta.
Foco em: normas ABNT, segurança do trabalho (NRs), execução de obras civis e estruturas.
Sem histórico longo. Resposta direta, máximo 300 palavras.
Ao citar normas, informe o número completo (ex: NBR 6118:2014).
Se não souber, diga claramente que não tem informação suficiente.`

export async function POST(request: NextRequest) {
    try {
        const { pergunta } = await request.json()

        if (!pergunta?.trim()) {
            return NextResponse.json({ error: 'Pergunta é obrigatória' }, { status: 400 })
        }

        if (!process.env.ANTHROPIC_API_KEY) {
            return NextResponse.json({ error: 'API key não configurada' }, { status: 500 })
        }

        const message = await anthropic.messages.create({
            model: 'claude-3-5-haiku-20241022',
            max_tokens: 600,
            system: SYSTEM_PROMPT,
            messages: [
                {
                    role: 'user',
                    content: pergunta,
                },
            ],
        })

        const resposta = message.content[0].type === 'text' ? message.content[0].text : 'Sem resposta'

        return NextResponse.json({ resposta })
    } catch (error: any) {
        console.error('Erro Anthropic:', error)
        return NextResponse.json(
            { error: 'Erro ao processar pergunta' },
            { status: 500 }
        )
    }
}
