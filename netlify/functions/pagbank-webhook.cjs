// Recebe a notificação de pagamento da PagBank, marca o pedido como
// pago e dá baixa no estoque (uma única vez — protegido pelo check de
// status abaixo, pra não descontar em dobro se a PagBank reenviar a
// notificação, o que é comum acontecer).
//
// NOTE: valide a assinatura/autenticidade da notificação conforme a
// documentação atual da PagBank antes de ir para produção — este
// scaffold não implementa a verificação de assinatura ainda.

const { createClient } = require("@supabase/supabase-js");

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const body = JSON.parse(event.body || "{}");
  const orderReference = body.reference_id || body.data?.reference_id;
  const status = (body.charges?.[0]?.status || body.status || "").toUpperCase();

  if (!orderReference) {
    return { statusCode: 400, body: "Sem reference_id" };
  }

  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", orderReference)
    .single();

  if (!order) return { statusCode: 404, body: "Pedido não encontrado" };
  if (order.status === "paid") return { statusCode: 200, body: "ok (já processado)" };

  if (status === "PAID" || status === "AUTHORIZED") {
    await supabaseAdmin.from("orders").update({ status: "paid" }).eq("id", order.id);

    for (const item of order.order_items) {
      await supabaseAdmin.rpc("decrement_stock", {
        p_variant_id: item.product_variant_id,
        p_qty: item.quantity,
        p_order_id: order.id,
        p_reason: "sale",
      });
    }
  }

  return { statusCode: 200, body: "ok" };
};
