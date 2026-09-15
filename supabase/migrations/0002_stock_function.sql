-- Baixa de estoque atômica, chamada quando um pedido é confirmado como
-- pago (webhook do PagSeguro ou o admin marcando manualmente um pedido
-- fechado pelo WhatsApp). security definer para poder rodar a partir da
-- Edge Function/Netlify Function (que já valida a origem antes de chamar).
create or replace function decrement_stock(
  p_variant_id uuid,
  p_qty int,
  p_order_id uuid,
  p_reason text
) returns void as $$
begin
  update product_variants
    set stock_qty = greatest(stock_qty - p_qty, 0)
    where id = p_variant_id;

  insert into stock_movements (product_variant_id, change_qty, reason, order_id)
    values (p_variant_id, -p_qty, p_reason, p_order_id);
end;
$$ language plpgsql security definer;
