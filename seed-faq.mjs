// seed-faq.mjs — insere FAQs iniciais na tabela faq do Supabase
// Execute: node seed-faq.mjs

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Ler .env.local manualmente
const envContent = readFileSync('.env.local', 'utf-8')
const env = {}
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (match) env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '')
})

const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL']
const SERVICE_KEY = env['SUPABASE_SERVICE_ROLE_KEY']

if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontrados no .env.local')
    process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

const faqs = [
    // ─── Uso do Aplicativo ────────────────────────────────────────────────────────
    {
        categoria: 'Uso do Aplicativo',
        pergunta: 'Como faço para selecionar minha obra no aplicativo?',
        resposta: 'Ao entrar no aplicativo, acesse o menu lateral e toque em "Selecionar Obra". Escolha a obra na qual você está alocado. Após selecionar, todas as funcionalidades do sistema — RDO, Concretagem, FVS etc. — serão vinculadas automaticamente àquela obra.',
    },
    {
        categoria: 'Uso do Aplicativo',
        pergunta: 'Posso usar o aplicativo sem conexão com a internet?',
        resposta: 'Atualmente o aplicativo requer conexão com a internet para salvar e consultar dados. Recomendamos abri-lo em uma área com sinal antes de iniciar o preenchimento de formulários críticos, como RDO e concretagem.',
    },
    {
        categoria: 'Uso do Aplicativo',
        pergunta: 'Como instalo o aplicativo no meu celular?',
        resposta: 'O SAGA Engenharia é um PWA (Aplicativo Web Progressivo). Para instalar:\n• Android/Chrome: abra o site no Chrome, toque nos 3 pontos no canto superior direito e selecione "Adicionar à tela inicial".\n• iPhone/Safari: abra o site no Safari, toque no ícone de compartilhar (□↑) e selecione "Adicionar à Tela de Início".',
    },
    {
        categoria: 'Uso do Aplicativo',
        pergunta: 'Esqueci minha senha. Como redefinir?',
        resposta: 'Entre em contato com o administrador do sistema para redefinição de senha. O administrador pode criar uma nova senha temporária pelo painel de Configurações > Usuários.',
    },
    // ─── RDO ─────────────────────────────────────────────────────────────────────
    {
        categoria: 'RDO — Relatório Diário de Obra',
        pergunta: 'Como preencho o RDO do dia?',
        resposta: 'Acesse o módulo "RDO" pelo menu principal ou dashboard. Toque em "Novo RDO", preencha a data, condições climáticas, efetivo em campo, atividades realizadas e observações. Ao finalizar, toque em "Salvar". O RDO é vinculado automaticamente à sua obra selecionada.',
    },
    {
        categoria: 'RDO — Relatório Diário de Obra',
        pergunta: 'Posso editar um RDO já salvo?',
        resposta: 'Sim. Acesse o módulo RDO, localize o registro desejado na lista e toque para abri-lo. Será exibida a opção de edição. Lembre-se: alterações em RDOs já enviados deixam registro de modificação e devem ser justificadas.',
    },
    {
        categoria: 'RDO — Relatório Diário de Obra',
        pergunta: 'Quem pode visualizar os RDOs?',
        resposta: 'Engenheiros visualizam os RDOs da obra à qual estão vinculados. Diretores têm acesso a todas as obras. O controle de acesso é configurado pelo administrador em Configurações > Usuários.',
    },
    // ─── Concretagem ─────────────────────────────────────────────────────────────
    {
        categoria: 'Concretagem',
        pergunta: 'Como registro uma concretagem no sistema?',
        resposta: 'Acesse o módulo "Concretagem" e toque em "Nova Concretagem". Preencha o elemento estrutural (ex: laje, pilar), FCK, volume concretado, data e hora, fornecedor e responsável. Salve ao finalizar. Os dados ficam disponíveis para consulta e geração de relatórios.',
    },
    {
        categoria: 'Concretagem',
        pergunta: 'Como agendo uma concretagem futura?',
        resposta: 'Na tela de "Nova Concretagem", preencha a data prevista no campo "Agendamento". Concretagens agendadas aparecem no Dashboard do Diretor e do Engenheiro com contagem regressiva, facilitando o acompanhamento e o planejamento de equipe.',
    },
    // ─── FVS / Inspeções ──────────────────────────────────────────────────────────
    {
        categoria: 'FVS — Fichas de Verificação',
        pergunta: 'O que é o módulo FVS?',
        resposta: 'FVS (Ficha de Verificação de Serviço) é o módulo de controle de qualidade da obra. Nele você registra inspeções de serviços executados — como lajes, alvenaria, instalações — com base em checklists padronizados, garantindo conformidade com os padrões da construtora e normas ABNT.',
    },
    {
        categoria: 'FVS — Fichas de Verificação',
        pergunta: 'Como crio uma nova inspeção FVS?',
        resposta: 'Acesse o módulo "FVS" no menu e toque em "Nova Inspeção". Selecione o tipo de serviço, preencha os itens do checklist marcando "Conforme", "Não Conforme" ou "N/A" e adicione fotos e observações quando necessário. Ao finalizar, toque em "Salvar".',
    },
    // ─── Suprimentos ─────────────────────────────────────────────────────────────
    {
        categoria: 'Suprimentos',
        pergunta: 'Como faço uma solicitação de materiais?',
        resposta: 'Acesse o módulo "Suprimentos" e use o assistente de voz ou o formulário para descrever o material necessário, quantidade e urgência. A solicitação é registrada e encaminhada para aprovação da diretoria.',
    },
    // ─── Acesso e Permissões ─────────────────────────────────────────────────────
    {
        categoria: 'Acesso e Permissões',
        pergunta: 'Quais são os perfis de acesso disponíveis?',
        resposta: 'O sistema possui dois perfis principais:\n• Engenheiro: acesso operacional vinculado a obra(s) específica(s). Pode registrar RDO, concretagem, FVS, suprimentos e acessar documentação.\n• Diretor: acesso total a todas as obras, dashboards gerenciais, configurações e gestão de usuários.',
    },
    {
        categoria: 'Acesso e Permissões',
        pergunta: 'Como o administrador adiciona um novo usuário?',
        resposta: 'Acesse Configurações > Usuários e toque em "Novo Usuário". Preencha o nome, e-mail, senha inicial e selecione o perfil (Engenheiro ou Diretor). Após criar, vincule o usuário às obras correspondentes e ajuste as permissões individuais conforme necessário.',
    },
]

async function seed() {
    console.log(`🌱 Inserindo ${faqs.length} FAQs...`)

    // Verificar se já existem FAQs
    const { count } = await supabase.from('faq').select('*', { count: 'exact', head: true })
    if (count && count > 0) {
        console.log(`⚠️  Tabela faq já possui ${count} registros. Pulando seed para evitar duplicatas.`)
        console.log('   Se quiser reinserir, apague os registros existentes primeiro.')
        process.exit(0)
    }

    const { data, error } = await supabase.from('faq').insert(faqs).select()
    if (error) {
        console.error('❌ Erro ao inserir FAQs:', error.message)
        process.exit(1)
    }
    console.log(`✅ ${data.length} FAQs inseridas com sucesso!`)
}

seed()
