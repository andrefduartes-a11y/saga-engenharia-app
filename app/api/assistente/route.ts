import { NextRequest, NextResponse } from 'next/server'

const SYSTEM_PROMPT = `Você é o Assistente SAGA, um especialista em engenharia civil e gestão de canteiros de obra.

Responda sempre em português brasileiro de forma clara, objetiva e prática.
Foque em:
- Normas técnicas brasileiras (ABNT)
- Boas práticas de canteiro
- Concretagem, estruturas, fundações, terraplanagem
- Gestão de produtividade e recursos
- Segurança do trabalho (NRs)
- Controle de qualidade de serviços

Seja direto. Prefira respostas em tópicos quando cabível. Máximo de 300 palavras por resposta.`

export async function POST(req: NextRequest) {
    try {
        const apiKey = process.env.OPENAI_API_KEY
        if (!apiKey) return NextResponse.json({ erro: 'OpenAI não configurada' }, { status: 500 })

        const { mensagens } = await req.json()

        const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    ...mensagens,
                ],
                max_tokens: 600,
                temperature: 0.7,
            }),
        })

        if (!res.ok) {
            const err = await res.text()
            return NextResponse.json({ erro: err }, { status: res.status })
        }

        const data = await res.json()
        const resposta = data.choices?.[0]?.message?.content || ''
        return NextResponse.json({ resposta })
    } catch (err: any) {
        return NextResponse.json({ erro: err.message }, { status: 500 })
    }
}
