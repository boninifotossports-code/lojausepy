// Cria a cobrança no PagSeguro/PagBank para um pedido já gravado no
// Supabase, e devolve a URL de checkout para o front redirecionar o
// cliente. As credenciais nunca ficam no código nem no front: são lidas
// aqui, em runtime, direto da tabela `payment_settings` (que o admin
// preenche pelo painel, em /pagamentos), usando a service role key —
// que só existe nesta função, nunca no bundle do site.
//
// IMPORTANTE: a PagBank atualiza sua API de tempos em tempos. Antes de
// ir para produção, confira o payload exato (endpoint, campos
// obrigatórios de `items`/`customer`/`qr_codes`) na documentação atual
// em https://developer.pagbank.com.br — a estrutura abaixo segue o
// formato da API de Pedidos (Orders) documentado no momento em que este
// scaffold foi gerado, mas confirme antes de aceitar pagamentos reais.

const { createClient } = require("@supabase/supabase-js");

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const { orderId } = JSON.parse(event.body || "{}");
  if (!orderId) {
    return { statusCode: 400, body: JSON.stringify({ error: "orderId é obrigatório." }) };
  }

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .select("*, order_items(*, product_variants(sku, product_id, products(name)))")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    return { statusCode: 404, body: JSON.stringify({ error: "Pedido não encontrado." }) };
  }

  const { data: settings, error: settingsError } = await supabaseAdmin
    .from("payment_settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (settingsError || !settings?.credentials?.token) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "Pagamento online ainda não foi configurado no painel admin (/pagamentos).",
      }),
    };
  }

  const baseUrl = settings.is_sandbox
    ? "https://sandbox.api.pagseguro.com"
    : "https://api.pagseguro.com";

  const siteUrl = process.env.URL || "https://usepy.netlify.app";

  const payload = {
    reference_id: order.id,
    customer: {
      name: order.customer_name,
      email: order.customer_email || "cliente@usepy.com.br",
      tax_id: "00000000000", // TODO: coletar CPF no checkout se a PagBank exigir para o método escolhido
      phones: [
        {
          country: "55",
          area: order.customer_phone.replace(/\D/g, "").slice(0, 2),
          number: order.customer_phone.replace(/\D/g, "").slice(2),
        },
      ],
    },
    items: order.order_items.map((item) => ({
      reference_id: item.product_variant_id,
      name: item.product_variants?.products?.name || "Produto Usepy",
      quantity: item.quantity,
      unit_amount: item.unit_price_cents,
    })),
    shipping: {
      address: order.shipping_address || {},
    },
    notification_urls: [`${siteUrl}/.netlify/functions/pagbank-webhook`],
    checkout: {
      redirect_url: `${siteUrl}/pedido-confirmado?order=${order.id}`,
    },
  };

  try {
    const res = await fetch(`${baseUrl}/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${settings.credentials.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("Erro PagBank:", data);
      throw new Error(data.error_messages?.[0]?.description || "Erro ao criar cobrança.");
    }

    const checkoutUrl = data.links?.find((l) => l.rel === "PAY")?.href || data.links?.[0]?.href;
    if (!checkoutUrl) throw new Error("PagBank não retornou um link de pagamento.");

    await supabaseAdmin.from("orders").update({ payment_reference: data.id }).eq("id", order.id);

    return { statusCode: 200, body: JSON.stringify({ checkoutUrl }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 502, body: JSON.stringify({ error: err.message }) };
  }
};
