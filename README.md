# Usepy Moda Fitness — e-commerce

Stack: **React + Vite + TypeScript + Tailwind** no front, **Supabase**
(Postgres + Auth + Storage) no back, **Netlify** (hosting + Functions)
para deploy e as integrações que precisam de chave secreta (pagamento e
frete).

## Como rodar localmente

```bash
npm install
cp .env.example .env       # preencha com as chaves do seu projeto
npm run dev                # site
netlify dev                # site + Netlify Functions juntos (recomendado)
```

## Configurando o Supabase

1. Crie um projeto em supabase.com.
2. No SQL Editor, rode nessa ordem:
   - `supabase/migrations/0001_init.sql` (schema + RLS)
   - `supabase/migrations/0002_stock_function.sql` (baixa de estoque)
3. Em **Storage**, crie um bucket público chamado `product-images`.
4. Em **Authentication → Users**, crie o usuário que vai logar no painel
   admin (e-mail/senha). Copie o UUID dele.
5. No SQL Editor: `insert into admin_users (user_id) values ('UUID-do-usuário');`

## Painel administrativo

Fica em `VITE_ADMIN_PATH` (padrão `/backoffice-usepy`) — não aparece em
nenhum menu ou link do site público, e mesmo quem descobrir a URL não
entra sem estar logado E cadastrado em `admin_users` (checado no
front **e** reforçado por RLS no banco). Nele dá pra:

- cadastrar/editar produtos, variações (tamanho/cor) e fotos, e
  ativar/desativar ou excluir produtos;
- ver e gerenciar pedidos (marcar como pago — dá baixa automática no
  estoque —, marcar como enviado, cancelar);
- configurar o token do PagSeguro/PagBank direto pela tela
  `/pagamentos`, sem precisar mexer em código ou fazer novo deploy.

## Frete automático por CEP

Usa a **Melhor Envio**, que cota Correios + transportadoras parceiras
numa chamada só — mais simples que negociar contrato direto com os
Correios para uma loja nova. Configure `MELHOR_ENVIO_TOKEN` e
`STORE_CEP` no Netlify. Sem o token configurado, o checkout cai num
frete estimado fixo (fallback) só para não travar o fluxo em dev — troque
antes de ir ao ar.

## Pagamento online (PagSeguro/PagBank)

O admin cola o token da conta PagBank em `/pagamentos`; a Netlify
Function `criar-pagamento` lê essa credencial com a service role key
(nunca exposta no front) e gera a cobrança. **Antes de aceitar
pagamentos reais**, confira o payload contra a documentação atual em
developer.pagbank.com.br — APIs de pagamento mudam com frequência e o
scaffold foi escrito com o formato disponível no momento da geração.

## Checkout pelo WhatsApp

Sempre disponível como alternativa ao pagamento online: o pedido é
salvo no Supabase com status `pending_whatsapp` e o cliente é
redirecionado para o WhatsApp da loja (`VITE_STORE_WHATSAPP`) com o
resumo do pedido já preenchido.

## Deploy no Netlify

1. Conecte o repositório no Netlify (build command `npm run build`,
   publish `dist` — já configurado em `netlify.toml`).
2. Em **Site settings → Environment variables**, adicione todas as
   variáveis do `.env.example` (as com `VITE_` e as sem prefixo).
3. Pronto — `netlify.toml` já redireciona qualquer rota (incluindo a do
   admin) para o `index.html`, então o React Router cuida do resto.

## O que ainda vale evoluir

- Validação de assinatura no webhook da PagBank (`pagbank-webhook.js`).
- Diff mais fino ao salvar variações (hoje o form apaga e recria — funciona,
  mas perde o histórico de `stock_movements` vinculado ao `product_variant_id` antigo se o SKU mudar).
- Página de "Meus pedidos" para o cliente acompanhar status sem WhatsApp.
- Testes automatizados para o fluxo de checkout.
