-- Usepy Moda Fitness — schema inicial
-- Rode isso no SQL editor do Supabase (ou via `supabase db push`).

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- ADMIN
-- Quem pode acessar o painel oculto. Um usuário do Supabase Auth
-- só é "admin" se tiver uma linha aqui.
-- ─────────────────────────────────────────────────────────────
create table admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- CATÁLOGO
-- ─────────────────────────────────────────────────────────────
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  parent_id uuid references categories(id),
  sort_order int not null default 0
);

create table products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id),
  name text not null,
  slug text not null unique,
  description text,
  price_cents int not null,          -- preço em centavos, evita erro de ponto flutuante
  is_active boolean not null default true,
  is_featured boolean not null default false,
  created_at timestamptz not null default now()
);

create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  storage_path text not null,        -- caminho no bucket `product-images`
  sort_order int not null default 0
);

-- Cada combinação de tamanho/cor é uma variação com estoque próprio
create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  size text,
  color text,
  sku text unique,
  stock_qty int not null default 0,
  price_cents_override int          -- opcional, só se essa variação tiver preço diferente
);

-- ─────────────────────────────────────────────────────────────
-- PEDIDOS
-- ─────────────────────────────────────────────────────────────
create type order_status as enum (
  'pending_payment',   -- aguardando pagamento online (PagSeguro)
  'pending_whatsapp',  -- cliente escolheu fechar pelo WhatsApp
  'paid',
  'shipped',
  'cancelled'
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  shipping_cep text,
  shipping_address jsonb,
  shipping_cost_cents int not null default 0,
  subtotal_cents int not null,
  total_cents int not null,
  status order_status not null default 'pending_payment',
  payment_method text,              -- 'pagseguro' | 'whatsapp'
  payment_reference text,           -- id da transação no PagSeguro
  created_at timestamptz not null default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_variant_id uuid not null references product_variants(id),
  quantity int not null check (quantity > 0),
  unit_price_cents int not null
);

-- Auditoria de estoque: toda entrada/saída fica registrada, nunca só
-- um UPDATE direto em stock_qty
create table stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_variant_id uuid not null references product_variants(id),
  change_qty int not null,          -- negativo = saída, positivo = entrada
  reason text not null,             -- 'sale' | 'manual_adjustment' | 'restock'
  order_id uuid references orders(id),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- PAGAMENTO — configurável pelo painel admin, sem precisar de deploy
-- As credenciais nunca são lidas pelo frontend: só por uma Edge
-- Function (service role) no momento de gerar o checkout do PagSeguro.
-- ─────────────────────────────────────────────────────────────
create table payment_settings (
  id int primary key default 1,     -- linha única (singleton)
  provider text not null default 'pagseguro',
  is_sandbox boolean not null default true,
  credentials jsonb not null default '{}'::jsonb,  -- { "token": "...", "email": "..." }
  updated_at timestamptz not null default now(),
  constraint single_row check (id = 1)
);
insert into payment_settings (id) values (1);

-- ─────────────────────────────────────────────────────────────
-- RLS
-- Loja pública: leitura livre de catálogo, escrita zero.
-- Pedidos: qualquer visitante pode criar (checkout), ninguém além do
-- admin pode ler/editar depois.
-- Tudo que é "admin only" checa a existência da linha em admin_users.
-- ─────────────────────────────────────────────────────────────
alter table categories enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table product_variants enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table stock_movements enable row level security;
alter table payment_settings enable row level security;
alter table admin_users enable row level security;

create policy "catálogo é público para leitura"
  on categories for select using (true);
create policy "produtos ativos são públicos para leitura"
  on products for select using (is_active = true);
create policy "imagens de produto são públicas para leitura"
  on product_images for select using (true);
create policy "variações são públicas para leitura"
  on product_variants for select using (true);

create policy "qualquer visitante pode criar um pedido"
  on orders for insert with check (true);
create policy "qualquer visitante pode adicionar itens ao pedido que acabou de criar"
  on order_items for insert with check (true);

create policy "admin gerencia tudo: categorias"
  on categories for all using (exists (select 1 from admin_users where user_id = auth.uid()));
create policy "admin gerencia tudo: produtos"
  on products for all using (exists (select 1 from admin_users where user_id = auth.uid()));
create policy "admin gerencia tudo: imagens"
  on product_images for all using (exists (select 1 from admin_users where user_id = auth.uid()));
create policy "admin gerencia tudo: variações"
  on product_variants for all using (exists (select 1 from admin_users where user_id = auth.uid()));
create policy "admin lê e atualiza pedidos"
  on orders for select using (exists (select 1 from admin_users where user_id = auth.uid()));
create policy "admin atualiza pedidos"
  on orders for update using (exists (select 1 from admin_users where user_id = auth.uid()));
create policy "admin lê itens de pedido"
  on order_items for select using (exists (select 1 from admin_users where user_id = auth.uid()));
create policy "admin gerencia estoque"
  on stock_movements for all using (exists (select 1 from admin_users where user_id = auth.uid()));
create policy "admin gerencia pagamento"
  on payment_settings for all using (exists (select 1 from admin_users where user_id = auth.uid()));
create policy "só admin enxerga a lista de admins"
  on admin_users for select using (exists (select 1 from admin_users a where a.user_id = auth.uid()));
