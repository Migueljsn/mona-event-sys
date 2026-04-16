# Memoria do Projeto

## Identidade do Projeto

- nome do projeto: `mona-event-sys`
- objetivo central: vitrine administravel de experiencias com painel admin e finalizacao comercial via WhatsApp
- natureza do produto: nao e e-commerce; nao possui checkout nem pagamento online
- publico:
- cliente final que navega na vitrine publica
- operador/admin que gerencia cards e configuracoes

## Resumo de Produto

O sistema foi desenhado para exibir experiencias em formato de cards. O usuario final navega pela vitrine, abre um modal de detalhes, escolhe quantidades dentro das regras da experiencia, adiciona itens ao carrinho local e envia uma consulta consolidada para o WhatsApp.

O admin faz login, gerencia cards e ajusta configuracoes globais como numero de WhatsApp, titulo do catalogo e texto-base da mensagem.

## Regra de Negocio Principal

- toda finalizacao comercial acontece via WhatsApp
- nao existe pedido formal no backend no MVP
- nao existe controle de estoque transacional
- o carrinho serve apenas para organizar a intencao de compra antes do contato
- limites de quantidade por experiencia sao regras de selecao, nao estoque real
- cards vencidos por `valid_until` deixam de aparecer na vitrine publica

## Escopo Implementado

### Publico

- vitrine em `/`
- cards de experiencias
- modal de detalhes
- seletor de quantidade no modal
- carrinho local em `localStorage`
- alteracao/remocao de itens no carrinho
- geracao de link do WhatsApp com mensagem consolidada

### Admin

- login em `/admin/login`
- area protegida em `/admin`
- dashboard com metricas simples
- CRUD de cards
- edicao de configuracoes globais
- ativacao/inativacao de cards
- exclusao de cards
- upload de imagem com validacao de formato e peso
- mini editor de imagem com crop fixo `4:3`, zoom e reposicionamento antes do upload

### Dados

- leitura publica de `cards` e `settings`
- leitura autenticada para area admin
- seed inicial de `settings`
- fallback local de bootstrap quando Supabase nao esta configurado ou a leitura falha

## Fora do Escopo Atual

- checkout
- pagamento online
- reserva automatica
- painel do cliente final
- controle de estoque
- multiusuario com perfis/roles finos

## Arquitetura Real do Projeto

### Stack

- Next.js 16 com App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase Auth
- Supabase Postgres
- Supabase SSR

### Observacao importante de build

- `npm run build` usa `next build --webpack`
- motivo: o projeto compila corretamente com Webpack; Turbopack apresentou instabilidade de ambiente no contexto atual

### Estrutura de alto nivel

- `src/app/page.tsx`: entrada da vitrine publica
- `src/components/public/catalog-shell.tsx`: UI e logica cliente da vitrine, modal e carrinho
- `src/app/admin/login/*`: login do admin
- `src/app/admin/(protected)/*`: area autenticada do painel
- `src/lib/data/cards.ts`: camada de leitura de `cards` e `settings`
- `src/lib/supabase/public.ts`: client publico sem cookies para leituras anonimas
- `src/lib/supabase/server.ts`: client SSR com cookies para rotas autenticadas
- `src/lib/supabase/admin.ts`: client com service role
- `src/proxy.ts`: proxy/middleware para manter sessao do Supabase nas rotas admin

## Rotas Reais

### Publicas

- `/`

### Admin

- `/admin`
- `/admin/login`
- `/admin/cards/new`
- `/admin/cards/[id]`
- `/admin/settings`

Observacao:

- nao existe rota `/admin/cards` separada; a listagem operacional esta no dashboard `/admin`

## Fluxo do Usuario Final

1. Acessa `/`
2. Visualiza cards ativos
3. Abre um card em modal
4. Escolhe quantidade permitida
5. Adiciona ao carrinho local
6. Pode ajustar/remover itens no bloco lateral do carrinho
7. Clica no CTA principal
8. O sistema gera um link `wa.me` com a mensagem consolidada

## Fluxo do Admin

1. Acessa `/admin/login`
2. Faz login com usuario do Supabase Auth
3. Entra na area protegida `/admin`
4. Visualiza cards e metricas
5. Cria, edita, ativa/inativa ou remove cards
6. Ajusta configuracoes globais em `/admin/settings`

## Modelo de Dados Atual

### Tabela `public.cards`

Campos usados pela aplicacao:

- `id`
- `title`
- `slug`
- `short_description`
- `long_description`
- `additional_info`
- `image_url`
- `price_text`
- `price_prefix`
- `button_label`
- `unit_label`
- `min_quantity`
- `max_quantity`
- `quantity_step`
- `is_active`
- `display_order`
- `valid_until`
- `created_at`
- `updated_at`

### Tabela `public.settings`

Campos usados pela aplicacao:

- `id`
- `business_whatsapp_number`
- `catalog_title`
- `catalog_subtitle`
- `reservation_button_label`
- `whatsapp_message_intro`
- `created_at`
- `updated_at`

### Carrinho local

Estrutura do item:

- `card_id`
- `title`
- `quantity`
- `unit_label`
- `price_text`
- `image_url`

Persistencia:

- navegador via `localStorage`
- chave usada: `mona-event-sys-cart`

## Estado de Integracao com Supabase

### Variaveis de ambiente exigidas

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Comportamento da aplicacao

- se `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` existirem:
- a vitrine publica le `cards` e `settings` reais
- o admin tenta usar sessao real com cookies

- se faltarem variaveis publicas:
- a aplicacao entra em modo bootstrap
- usa dados de exemplo definidos em `src/lib/bootstrap-data.ts`
- a UI continua navegavel

- se o Supabase estiver configurado mas a rede falhar:
- a camada `src/lib/data/cards.ts` faz fallback para os dados bootstrap
- isso evita quebra total da home e do dashboard

### Clients Supabase

- `public.ts`: leitura publica sem cookies
- `server.ts`: SSR autenticado com cookies
- `admin.ts`: service role para operacoes administrativas internas

## Banco e RLS

Arquivo principal:

- `supabase/migrations/001_initial_schema.sql`

Esse arquivo cria:

- extensao `pgcrypto`
- tabela `public.cards`
- tabela `public.settings`
- trigger generico de `updated_at`
- policy publica para leitura de cards ativos
- policy publica para leitura de settings
- policy autenticada ampla para gerenciar cards
- policy autenticada ampla para gerenciar settings
- seed inicial de uma linha em `settings`

Observacao importante:

- a policy atual assume que qualquer usuario autenticado pode administrar `cards` e `settings`
- isso funciona para MVP e ambiente controlado
- se houver mais de um tipo de usuario no futuro, sera necessario introduzir perfis/roles

## UI e Comportamento Implementado

### Vitrine

- interface publica customizada
- header fixo inspirado na navegacao institucional do Mona Hotel
- header sem qualquer atalho visivel para o painel admin
- hero simplificado com badge "Experiencias Mona Hotel" e CTAs principais
- cards com imagem, preco, titulo e descricao curta
- modal com descricao detalhada e informacoes adicionais
- carrinho lateral sticky em desktop
- CTA principal para WhatsApp
- ajustes defensivos no header mobile para evitar glitches visuais ao navegar entre vitrine e admin

### Admin

- dashboard com metricas:
- total de experiencias
- experiencias ativas
- experiencias expiradas
- numero de WhatsApp atual

- formularios com ajuda contextual
- campo `price_text` com mascara em reais
- upload de imagem para Supabase Storage
- mini editor de imagem no formulario de cards
- fallback opcional por `image_url` manual
- configuracoes globais editaveis

## Bootstrap / Fallback

O projeto possui um modo de resiliencia deliberado para facilitar desenvolvimento e demonstracao:

- dados bootstrap ficam em `src/lib/bootstrap-data.ts`
- incluem cards de exemplo e settings de exemplo
- o modo bootstrap e usado quando:
- as variaveis publicas nao existem
- a leitura do Supabase falha

Isso e intencional e faz parte da arquitetura atual.

## Estado Atual Validado

- dependencias instaladas
- `npm run lint` passa
- `npm run build` passa
- build com `.env.local` foi validado
- a home publica le do Supabase quando a rede esta disponivel
- as rotas admin estao marcadas como dinamicas por dependerem de sessao/cookies
- o projeto sobe em `npm run dev`; eventual troca de porta e situacional e nao representa erro do codigo
- o header da vitrine foi estabilizado para evitar estado visual residual em retorno de navegacao

## Pendencias Reais

- validar manualmente o login com usuario admin real no navegador
- validar CRUD completo contra o banco real via interface
- revisar UX final do carrinho e detalhes visuais
- revisar comportamento visual do header em navegacao mobile e cache/back-forward no navegador real
- eventualmente endurecer modelo de permissao do admin

## Diretriz de Imagens

- proporcao recomendada para cards: `4:3`
- resolucao ideal: `1600 x 1200`
- resolucao minima recomendada: `1200 x 900`
- formato preferido: `WebP`
- formatos aceitos no upload: `JPG`, `PNG` e `WebP`
- limite maximo de arquivo no upload: `400 KB`
- arquivos acima desse limite devem ser recusados
- o editor do admin exporta a imagem final para `1600 x 1200` antes do upload

## Storage

- bucket esperado para imagens dos cards: `card-images`
- o upload usa URL publica do arquivo apos envio para o bucket

## Decisoes de Implementacao Importantes

- a home publica usa client publico do Supabase, nao client SSR com cookies
- o admin usa client server-side com cookies e proxy para sessao
- o carrinho permanece fora do backend
- o build usa Webpack por estabilidade operacional
- a vitrine nao deve expor o acesso administrativo para leads/usuarios finais
- segredos reais nao devem ser registrados aqui nem em `.env.example`

## Arquivos-Chave para Outra IA

Se outra IA precisar continuar o projeto, comece por estes arquivos:

- `MEMORIA_DO_PROJETO.md`
- `README.md`
- `package.json`
- `src/app/page.tsx`
- `src/components/public/catalog-shell.tsx`
- `src/app/admin/(protected)/page.tsx`
- `src/app/admin/(protected)/actions.ts`
- `src/lib/data/cards.ts`
- `src/lib/env.ts`
- `src/lib/bootstrap-data.ts`
- `src/lib/supabase/public.ts`
- `src/lib/supabase/server.ts`
- `src/proxy.ts`
- `supabase/migrations/001_initial_schema.sql`

## Regras para Atualizar Esta Memoria

Atualizar este arquivo sempre que houver:

- mudanca de rotas
- mudanca de schema
- mudanca de comportamento do carrinho
- mudanca na forma de autenticacao
- introducao de upload real de imagens
- mudanca no modelo de permissao do admin
- mudanca relevante de build ou deploy

## Seguranca

- nao registrar chaves reais, tokens ou credenciais neste arquivo
- `.env.example` deve conter placeholders
- valores reais ficam apenas em `.env.local` ou no provedor de deploy
- se alguma service role for exposta, rotacionar imediatamente no Supabase
