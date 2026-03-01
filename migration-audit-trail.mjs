// migration-audit-trail.mjs
// Adiciona colunas criado_por às tabelas de concretagem e rastreabilidade
// Execute: node migration-audit-trail.mjs

import { readFileSync } from 'fs'

const envContent = readFileSync('.env.local', 'utf-8')
const env = {}
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (match) env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '')
})

const PROJECT_REF = 'zoxeqfelcmupaptjueaa' // extraído da URL do Supabase
const SERVICE_KEY = env['SUPABASE_SERVICE_ROLE_KEY']

const sql = `
ALTER TABLE concretagens_agendadas ADD COLUMN IF NOT EXISTS criado_por_id uuid;
ALTER TABLE concretagens_agendadas ADD COLUMN IF NOT EXISTS criado_por_nome text;
ALTER TABLE rastreabilidade_concreto ADD COLUMN IF NOT EXISTS criado_por_id uuid;
ALTER TABLE rastreabilidade_concreto ADD COLUMN IF NOT EXISTS criado_por_nome text;
`

const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
})

const text = await res.text()
if (res.ok) {
    console.log('✅ Migration executada com sucesso!')
} else {
    console.error(`❌ Erro (${res.status}): ${text}`)
    console.log('\nExecute manualmente no Supabase SQL Editor:')
    console.log(sql)
}
