-- Permite que o cliente consulte os próprios pedidos pelo telefone,
-- sem precisar de login. RLS normal bloquearia leitura de `orders` para
-- visitantes (só admin lê), então isso é uma função security definer
-- que só devolve pedidos cujo telefone bate com o informado — não dá
-- pra listar pedidos de outra pessoa sem saber o telefone dela, o que
-- segue o mesmo nível de exposição que o checkout via WhatsApp já tem.
create or replace function get_orders_by_phone(p_phone text)
returns jsonb
language sql
security definer
stable
as $$
  select coalesce(jsonb_agg(order_json), '[]'::jsonb)
  from (
    select jsonb_build_object(
      'id', o.id,
      'status', o.status,
      'payment_method', o.payment_method,
      'subtotal_cents', o.subtotal_cents,
      'shipping_cost_cents', o.shipping_cost_cents,
      'total_cents', o.total_cents,
      'created_at', o.created_at,
      'items', (
        select coalesce(jsonb_agg(jsonb_build_object(
          'product_name', p.name,
          'size', pv.size,
          'color', pv.color,
          'quantity', oi.quantity,
          'unit_price_cents', oi.unit_price_cents
        )), '[]'::jsonb)
        from order_items oi
        join product_variants pv on pv.id = oi.product_variant_id
        join products p on p.id = pv.product_id
        where oi.order_id = o.id
      )
    ) as order_json
    from orders o
    where regexp_replace(o.customer_phone, '\D', '', 'g') = regexp_replace(p_phone, '\D', '', 'g')
    order by o.created_at desc
  ) sub;
$$;

grant execute on function get_orders_by_phone(text) to anon;
