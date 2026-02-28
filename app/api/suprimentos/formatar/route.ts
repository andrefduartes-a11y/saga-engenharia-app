import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    try {
        const apiKey = process.env.OPENAI_API_KEY
        if (!apiKey) return NextResponse.json({ erro: 'OpenAI não configurada' }, { status: 500 })

        const { texto, obra, data, solicitante } = await req.json()
        if (!texto) return NextResponse.json({ erro: 'Texto vazio' }, { status: 400 })

        const prompt = `Você é um assistente de engenharia civil. O engenheiro falou o seguinte pedido de materiais/suprimentos por voz:

"${texto}"

Extraia e organize em uma lista de pedido clara e profissional no seguinte formato EXATO (use exatamente esses emojis e estrutura):

🏗️ *PEDIDO DE SUPRIMENTOS*
📍 *Obra:* ${obra || '[obra]'}
📅 *Data:* ${data || new Date().toLocaleDateString('pt-BR')}
👷 *Solicitante:* ${solicitante || 'Engenheiro responsável'}

📋 *ITENS SOLICITADOS:*
• [item 1 com quantidade e unidade]
• [item 2 com quantidade e unidade]
• [continue para todos os itens mencionados]

⚠️ *Observações:* [coloque aqui urgências, especificações técnicas ou observações importantes. Se não houver, escreva "Nenhuma"]

Regras:
- Identifique cada material/serviço mencionado
- Estime quantidade quando não especificada com base no contexto
- Use unidades padrão: un, m, m², m³, kg, saco, caixa, rolo
- Seja objetivo e técnico
- Se o texto estiver confuso, interprete da melhor forma possível`

        const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.3,
                max_tokens: 800,
            }),
        })

        if (!res.ok) {
            const err = await res.text()
            return NextResponse.json({ erro: err }, { status: res.status })
        }

        const data2 = await res.json()
        const textoPedido = data2.choices?.[0]?.message?.content || ''
        return NextResponse.json({ pedido: textoPedido })
    } catch (err: any) {
        return NextResponse.json({ erro: err.message }, { status: 500 })
    }
}
