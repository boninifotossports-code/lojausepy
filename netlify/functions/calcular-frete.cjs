// Calcula o frete a partir do CEP do cliente.
//
// Usa a API da Melhor Envio, que cota Correios + transportadoras
// parceiras numa única chamada — é a forma mais simples de ter "cálculo
// automático por CEP" numa loja nova, sem precisar de contrato direto
// com os Correios. Precisa de um token de aplicação da Melhor Envio
// (variável MELHOR_ENVIO_TOKEN no Netlify).
//
// Se o token não estiver configurado ainda, cai num fallback de tabela
// fixa por região só para o checkout continuar funcionável em
// desenvolvimento — troque MELHOR_ENVIO_TOKEN em produção.

const MELHOR_ENVIO_TOKEN = process.env.MELHOR_ENVIO_TOKEN;
const STORE_CEP = process.env.STORE_CEP || "74000000"; // CEP de origem da loja
const MELHOR_ENVIO_BASE =
  process.env.MELHOR_ENVIO_SANDBOX === "true"
    ? "https://sandbox.melhorenvio.com.br"
    : "https://melhorenvio.com.br";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const { cepDestino, pesoKg } = JSON.parse(event.body || "{}");
  if (!cepDestino || cepDestino.replace(/\D/g, "").length !== 8) {
    return { statusCode: 400, body: JSON.stringify({ error: "CEP inválido." }) };
  }

  if (!MELHOR_ENVIO_TOKEN) {
    return {
      statusCode: 200,
      body: JSON.stringify({ options: fallbackOptions(), fallback: true }),
    };
  }

  try {
    const res = await fetch(`${MELHOR_ENVIO_BASE}/api/v2/me/shipment/calculate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MELHOR_ENVIO_TOKEN}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "Usepy Moda Fitness (contato@usepy.com.br)",
      },
      body: JSON.stringify({
        from: { postal_code: STORE_CEP },
        to: { postal_code: cepDestino.replace(/\D/g, "") },
        package: {
          weight: Math.max(pesoKg || 0.5, 0.3),
          width: 20,
          height: 10,
          length: 25,
        },
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Erro na Melhor Envio");

    const options = data
      .filter((o) => !o.error)
      .map((o) => ({
        id: String(o.id),
        name: `${o.company.name} ${o.name}`,
        price_cents: Math.round(parseFloat(o.price) * 100),
        delivery_days: o.delivery_time,
      }))
      .sort((a, b) => a.price_cents - b.price_cents);

    if (options.length === 0) throw new Error("Nenhuma opção de frete retornada.");

    return { statusCode: 200, body: JSON.stringify({ options }) };
  } catch (err) {
    console.error("Erro ao calcular frete:", err);
    return {
      statusCode: 200,
      body: JSON.stringify({ options: fallbackOptions(), fallback: true }),
    };
  }
};

function fallbackOptions() {
  return [
    { id: "fallback-standard", name: "Correios PAC (estimado)", price_cents: 2200, delivery_days: 8 },
    { id: "fallback-express", name: "Correios SEDEX (estimado)", price_cents: 3800, delivery_days: 3 },
  ];
}
