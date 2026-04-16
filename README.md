# Mona Event Sys

Sistema web para vitrine de experiencias com duas frentes:

- vitrine publica para o cliente final
- painel admin para gestao de cards e configuracoes

O fluxo comercial e finalizado via WhatsApp. Nao existe checkout nem pagamento online no MVP.

## Stack

- Next.js 16
- TypeScript
- Tailwind CSS 4
- Supabase Auth
- Supabase Postgres
- Supabase Storage

## Setup Local

1. Instale as dependencias:

```bash
npm install
```

2. Preencha o arquivo `.env.local` com as chaves reais do Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
```

3. Rode o projeto:

```bash
npm run dev
```

4. Para validar producao localmente:

```bash
npm run build
npm run start
```

## Variaveis de Ambiente

O projeto espera exatamente estas variaveis:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Arquivos:

- `.env.example`: modelo seguro para versionamento
- `.env.local`: valores reais locais, ignorados pelo Git

## Estado Atual

O projeto possui dois modos de operacao:

- modo bootstrap:
  quando o Supabase ainda nao foi configurado, a aplicacao usa dados de exemplo para manter a vitrine e o admin navegaveis
- modo conectado:
  quando as variaveis reais sao preenchidas em `.env.local`, a aplicacao passa a usar Auth, banco e configuracoes reais do Supabase

## Funcionalidades Implementadas

- vitrine publica com cards
- header fixo inspirado no site institucional do Mona
- header publico sem atalho visivel para o painel admin
- hero simplificado com badge "Experiencias Mona Hotel" e CTAs principais
- modal de detalhes por experiencia
- carrinho local com `localStorage`
- geracao de consulta consolidada para WhatsApp
- painel admin com dashboard
- CRUD de experiencias
- upload de imagem para Supabase Storage com validacao
- mini editor de imagem com crop `4:3`, zoom e reposicionamento
- configuracoes globais do catalogo
- middleware/proxy para area admin
- fallback seguro quando o Supabase nao esta configurado

## O Que Ainda Depende Das Chaves Reais

Depois de preencher `.env.local`, valide estes fluxos:

- login do admin com usuario existente no Supabase Auth
- leitura real de `cards` e `settings`
- criacao, edicao, ativacao e remocao de cards
- atualizacao das configuracoes globais

## Observacao de Produto

- a vitrine publica e voltada para leads/clientes finais
- o painel admin existe apenas para operacao interna
- por decisao de UX, o acesso ao admin nao deve aparecer exposto no header da vitrine

## Banco de Dados

A migration inicial do projeto esta em:

- `supabase/migrations/001_initial_schema.sql`

Ela inclui:

- tabela `public.cards`
- tabela `public.settings`
- trigger de `updated_at`
- policies iniciais de RLS
- seed inicial para `settings`

## Imagens dos Cards

- proporcao recomendada: `4:3`
- resolucao ideal: `1600 x 1200`
- resolucao minima recomendada: `1200 x 900`
- formato preferido: `WebP`
- formatos aceitos no upload: `JPG`, `PNG` e `WebP`
- limite maximo no upload: `400 KB`
- bucket usado pelo sistema: `card-images`

Observacao:

- o admin aceita upload de arquivo e tambem `image_url` manual como fallback
- se um arquivo for enviado, ele tem prioridade sobre a URL manual
- o editor do admin exporta a imagem final antes do upload

## Seguranca

- nunca versione chaves reais em `.env.example`
- mantenha os segredos apenas em `.env.local` e no provedor de deploy
- se uma `SUPABASE_SERVICE_ROLE_KEY` tiver sido exposta, rotacione a chave no Supabase

## Validacao Atual

- `npm run lint` passa
- `npm run build` passa
