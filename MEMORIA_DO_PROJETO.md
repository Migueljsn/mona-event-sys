# Memoria do Projeto

## Objetivo

Construir um sistema web com duas frentes:

- painel admin para gestao das experiencias/cards
- vitrine publica para o cliente final

O sistema nao tera checkout nem pagamento integrado. O objetivo comercial e gerar leads qualificadas para atendimento via WhatsApp, com os itens de interesse e quantidades selecionadas pelo usuario.

## Contexto do Produto

O sistema foi pensado para exibir experiencias em formato de cards, inspirado na referencia visual enviada pelo cliente. Cada experiencia pode ter imagem, titulo, descricao, preco exibido, quantidade selecionavel e detalhes adicionais.

O usuario final deve conseguir:

- visualizar as experiencias disponiveis
- abrir um modal de detalhes ao clicar em "Saiba mais"
- selecionar quantidade dentro das regras da experiencia
- adicionar uma ou mais experiencias ao carrinho
- clicar em "Consultar reservas"
- ser redirecionado ao WhatsApp com mensagem pronta contendo os itens do carrinho

O administrador deve conseguir:

- criar experiencias
- editar experiencias
- remover experiencias
- ativar/desativar experiencias
- configurar limites de quantidade por experiencia
- subir imagens
- definir textos e mensagem-base do WhatsApp

## Escopo Atual do MVP

### Incluido

- vitrine publica com cards
- modal de detalhes por experiencia
- carrinho de consulta
- geracao de mensagem consolidada para WhatsApp
- painel admin com CRUD de experiencias
- upload de imagens
- configuracao de numero de WhatsApp
- ordenacao e ativacao/desativacao de cards

### Fora do escopo neste momento

- pagamento online
- checkout
- reserva automatica
- controle real de estoque
- baixa automatica de disponibilidade
- multiusuario complexo
- painel do cliente final

## Conceito Central

Este sistema nao e um e-commerce. Ele deve ser tratado como uma vitrine administravel com carrinho de consulta. O carrinho existe apenas para organizar a intencao de compra antes do contato no WhatsApp.

Consequencias dessa decisao:

- nao precisamos de pedido formal no MVP
- nao precisamos persistir carrinho no backend
- nao precisamos de integracao com meios de pagamento
- nao precisamos de logica de estoque transacional

## Arquitetura Recomendada

### Stack

- Next.js
- TypeScript
- Supabase Auth
- Supabase Postgres
- Supabase Storage
- Vercel
- shadcn/ui

### Justificativa

- um unico projeto atende admin e vitrine publica
- Supabase resolve autenticacao, banco e storage sem backend separado
- Vercel simplifica deploy
- a stack e suficiente para o MVP e escalavel para futuras iteracoes

## Frentes do Sistema

### 1. Admin

Uso interno. Nao sera acessado pelo usuario final.

Pode ficar:

- em URL da Vercel
- ou em subdominio separado

Responsabilidades:

- login
- CRUD dos cards/experiencias
- upload e validacao de imagem
- configuracao de quantidade minima/maxima/passo
- configuracao de textos exibidos
- definicao da ordem de exibicao
- configuracoes globais do sistema

### 2. Pagina Publica

Uso do cliente final.

Responsabilidades:

- exibir cards ativos
- abrir modal com detalhes
- permitir escolha de quantidade
- adicionar/remover itens do carrinho
- abrir WhatsApp com mensagem pronta

## Fluxo Principal do Usuario

1. Usuario acessa a vitrine publica.
2. Visualiza os cards disponiveis.
3. Clica em "Saiba mais".
4. O sistema abre um modal com detalhes da experiencia.
5. Usuario escolhe a quantidade permitida.
6. Usuario adiciona o item ao carrinho.
7. Usuario pode repetir o processo em outras experiencias.
8. Usuario clica em "Consultar reservas".
9. O sistema abre o WhatsApp com uma mensagem consolidada.

## Fluxo do Admin

1. Admin faz login.
2. Acessa a listagem de experiencias.
3. Cria ou edita uma experiencia.
4. Faz upload da imagem.
5. Define quantidade minima, maxima, passo e unidade.
6. Salva a experiencia.
7. A experiencia passa a aparecer na vitrine publica se estiver ativa.

## Regras de Negocio ja Definidas

- toda finalizacao comercial acontece via WhatsApp
- nao havera controle automatico de estoque
- o limite de quantidade por experiencia e apenas uma regra de selecao no frontend
- o admin define a capacidade maxima por experiencia
- o usuario pode adicionar mais de uma experiencia ao carrinho
- o botao "Saiba mais" abre um modal de detalhes
- a mensagem do WhatsApp deve listar todas as experiencias escolhidas e suas quantidades

## Modelo Conceitual Inicial

### Entidade: cards

Campos previstos:

- id
- title
- slug
- short_description
- long_description
- additional_info
- image_url
- price_text
- price_prefix
- button_label
- unit_label
- min_quantity
- max_quantity
- quantity_step
- is_active
- display_order
- valid_until
- created_at
- updated_at

### Entidade: settings

Campos previstos:

- id
- business_whatsapp_number
- catalog_title
- catalog_subtitle
- reservation_button_label
- whatsapp_message_intro
- created_at
- updated_at

## Carrinho

### Proposta do MVP

Persistencia local no navegador usando localStorage.

### Motivo

- reduz complexidade
- atende bem o fluxo do produto
- nao existe pedido formal no backend
- nao depende de login do usuario final

### Estrutura conceitual do item do carrinho

- card_id
- title
- quantity
- unit_label
- price_text
- image_url

## Modal de Detalhes

Cada card deve abrir um modal com:

- imagem principal
- titulo
- descricao detalhada
- seletor de quantidade
- preco exibido
- botao "Adicionar ao carrinho"
- secao opcional de informacoes adicionais

## Upload de Imagens

Direcao atual:

- aceitar JPG, PNG e WebP
- orientar formato horizontal
- trabalhar com proporcao consistente entre cards
- limitar resolucao maxima
- limitar tamanho maximo do arquivo

Observacao:

Ainda vamos fechar os numeros exatos de resolucao e limite de arquivo na fase de implementacao.

## Mensagem do WhatsApp

Formato esperado:

```text
Ola! Tenho interesse nas seguintes experiencias:

- Buffet Feijoada 8 estrelas - Quantidade: 2 unidades
- Day Spa - Quantidade: 1 unidade

Gostaria de verificar disponibilidade e condicoes de reserva.
```

Observacoes:

- a mensagem deve ser montada automaticamente com base no carrinho
- o numero do WhatsApp deve ser configuravel no admin/settings
- a abertura do WhatsApp sera feita com URL encoded

## Rotas Previstas

### Publicas

- /

### Admin

- /admin/login
- /admin/cards
- /admin/cards/new
- /admin/cards/[id]
- /admin/settings

## Ordem Recomendada de Implementacao

1. Definir blueprint tecnico final
2. Criar o projeto base em Next.js
3. Configurar Supabase
4. Implementar autenticacao do admin
5. Criar schema de banco e storage
6. Implementar admin de cards
7. Implementar vitrine publica
8. Implementar modal de detalhes
9. Implementar carrinho com localStorage
10. Implementar geracao da mensagem para WhatsApp
11. Refinar interface e publicar

## Premissas para Reuso Futuro

Este documento deve servir como referencia para replicar o sistema em outros clientes com pequenas adaptacoes. Para isso, a implementacao deve buscar:

- separacao entre configuracao global e conteudo dos cards
- modelagem generica o suficiente para outros catalogos de experiencias
- independencia entre visual da vitrine e logica de administracao
- possibilidade de trocar identidade visual sem alterar a estrutura do produto

## Decisoes em Aberto

Itens que ainda precisam ser fechados:

- resolucao e peso maximo das imagens
- visual exato do carrinho na pagina publica
- se o card tera botao extra de adicionar rapido fora do modal
- textos padrao definitivos do WhatsApp
- identidade visual do projeto

## Historico de Decisoes

### Fase inicial

- sistema definido como vitrine com painel admin
- finalizacao comercial centralizada no WhatsApp
- controle de estoque decidido como manual
- quantidade por experiencia configurada no admin
- carrinho introduzido para suportar multiplas experiencias
- modal de detalhes introduzido como fluxo principal de interacao

## Como usar este documento

Atualizar este arquivo sempre que houver:

- nova decisao de produto
- alteracao de arquitetura
- mudanca de regra de negocio
- definicao de campos, rotas ou fluxos
- decisoes importantes de implementacao

Este arquivo deve ser tratado como a memoria viva do projeto.

## Diretriz Operacional

- a memoria do projeto deve ser atualizada continuamente durante todo o desenvolvimento
- o documento esta autorizado a registrar conteudos sensiveis do sistema quando isso for util para operacao, replicacao futura, manutencao ou deploy
- credenciais, configuracoes, dependencias externas, variaveis de ambiente, ids de projeto, regras de acesso e instrucoes de setup podem ser documentadas neste arquivo ou em arquivos auxiliares do projeto conforme a necessidade

## Credenciais e Integracoes

### Supabase

- project_url: https://fvkhgrljimpcsvpezuud.supabase.co
- anon_public_key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2a2hncmxqaW1wY3N2cGV6dXVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMjgxNTcsImV4cCI6MjA5MTcwNDE1N30.mnQ7TJddwGya31Yi8C7r4IbhMGhm7ORWvRzvvtDiXXQ
- service_role_key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2a2hncmxqaW1wY3N2cGV6dXVkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjEyODE1NywiZXhwIjoyMDkxNzA0MTU3fQ.ijlQ632rCMqa5zOjYaICRzosZcxXbJFfGOjWOKIIWQk

### Estado atual

- projeto iniciado do zero
- sem codigo previo
- sem configuracao previa de Vercel
- stack confirmada: Next.js + TypeScript + Supabase + Tailwind + shadcn/ui
- variaveis de ambiente locais configuradas em .env.local
- arquivo .env.example criado para replicacao futura

## Implementacao Realizada

### Base do projeto

- projeto Next.js criado com App Router
- TypeScript, Tailwind e ESLint configurados
- projeto inicializado localmente em `/Users/miguelneto/Library/Mobile Documents/com~apple~CloudDocs/dev/mona-event-sys`
- package name definido como `mona-event-sys`

### Dependencias adicionadas

- @supabase/supabase-js
- @supabase/ssr
- clsx
- tailwind-merge
- lucide-react

### Estrutura inicial criada

- home publica customizada substituindo o template padrao do Next.js
- rota `/admin`
- rota `/admin/login`
- configuracao central de site
- cliente browser do Supabase
- cliente server do Supabase
- cliente admin do Supabase via service role
- validacao centralizada das variaveis de ambiente

### Estado do frontend

- interface inicial ja alinhada ao produto, removendo o boilerplate do Next.js
- identidade visual provisoria aplicada
- area admin marcada como placeholder funcional para a proxima etapa

### Proxima etapa de implementacao

- definir schema do banco no Supabase
- configurar autenticacao do admin
- implementar CRUD real de experiencias

### Schema inicial criado localmente

Arquivo:

- `supabase/migrations/001_initial_schema.sql`

Conteudo atual:

- tabela `public.cards`
- tabela `public.settings`
- trigger generica de `updated_at`
- politicas iniciais de RLS
- seed inicial de `settings`

Observacao:

- as politicas atuais assumem que usuarios autenticados sao usuarios administrativos
- quando a autenticacao do admin estiver pronta, vamos revisar se mantemos esse modelo ou se adicionamos uma camada de roles/perfis

### Execucao da migration

- a migration `001_initial_schema.sql` foi executada com sucesso no Supabase
- retorno informado: `Success. No rows returned`
- isso confirma que o schema base e as policies iniciais ja estao aplicados no projeto remoto

### Nova etapa em andamento

- implementar autenticacao do admin
- conectar leitura real de `cards` e `settings`
- preparar a area admin protegida para evoluir ao CRUD

### Implementacao em andamento: auth e leitura real

- rota `/admin/login` convertida para fluxo real com Supabase Auth
- area `/admin` reorganizada como rota protegida
- proxy do Next 16 adicionado para manter sessao do Supabase nas rotas admin
- leitura real de `public.cards` e `public.settings` adicionada na aplicacao
- home publica alterada para consumir dados do banco em vez de texto fixo

### Estado validado

- `npm run lint` executado com sucesso
- `npm run build` executado com sucesso
- home publica ja consome configuracoes reais do banco
- dashboard admin ja depende de sessao autenticada
- ainda nao existe usuario admin criado no Supabase Auth

### Proxima necessidade operacional

- criar o primeiro usuario admin no Supabase Auth para testar o login real

### Usuario admin de teste criado

- email: admin.teste@mona-event-sys.local
- senha: MonaAdmin#2026
- provider: email
- email_confirmed: true
- user_id: 7356b067-c88e-4a2b-8008-18b7966965cd
- criado em: 2026-04-14T12:54:40Z

### CRUD admin implementado

- rota `/admin/cards/new` criada
- rota `/admin/cards/[id]` criada
- rota `/admin/settings` criada
- numero de WhatsApp passou a ser editavel no painel admin
- CRUD server-side de `cards` implementado com create, update, delete e toggle de status
- atualizacao de `settings` implementada com revalidacao da home publica
- `image_url` esta operacional via campo manual nesta etapa
- campo `price_text` no admin foi alterado para usar mascara de moeda em reais
- ajuda contextual por campo adicionada no admin com icone `?`, funcionando por hover no desktop e clique/foco no mobile
- `valid_until` passou a ter efeito real: cards vencidos deixam de aparecer na vitrine publica e sao exibidos como `Expirado` no admin

### Proxima etapa de produto

- upload real de imagem em Supabase Storage
- modal de detalhes na vitrine
- carrinho com `localStorage`
- geracao consolidada do link de WhatsApp

## Backup e Versionamento

### Estado atual

- repositorio local git ativo
- branch atual: `main`
- backup remoto decidido para GitHub
- remoto informado pelo usuario: `git@github.com:Migueljsn/mona-event-sys.git`

### Observacoes operacionais

- `.env.local` permanece fora do versionamento
- `.env.example` entra no repositorio para replicacao
- migrations e memoria do projeto entram no repositorio como parte do backup tecnico
