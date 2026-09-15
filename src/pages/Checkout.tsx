import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useCartStore } from "../lib/cartStore";
import { centsToBRL } from "../lib/format";
import { buildWhatsappOrderLink } from "../lib/whatsapp";
import Footer from "../components/Footer";

interface ShippingOption {
  id: string;
  name: string;
  price_cents: number;
  delivery_days: number;
}

export default function Checkout() {
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotalCents());
  const clearCart = useCartStore((s) => s.clear);
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [cep, setCep] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [addressNumber, setAddressNumber] = useState("");

  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const [calculatingShipping, setCalculatingShipping] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-6 py-20 text-center">
        <p className="text-usepy-ink/50 mb-4">Sua sacola está vazia.</p>
        <Link to="/" className="text-usepy-copper underline">
          Voltar para a loja
        </Link>
      </div>
    );
  }

  async function calcularFrete() {
    setShippingError(null);
    setSelectedShipping(null);
    const cepDigits = cep.replace(/\D/g, "");
    if (cepDigits.length !== 8) {
      setShippingError("Digite um CEP válido (8 dígitos).");
      return;
    }
    setCalculatingShipping(true);
    try {
      // Preenche endereço a partir do CEP (ViaCEP) só para exibir/confirmar
      const viaCep = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`).then((r) => r.json());
      if (!viaCep.erro) {
        setAddressLine(`${viaCep.logradouro}, ${viaCep.bairro} — ${viaCep.localidade}/${viaCep.uf}`);
      }

      const totalWeightKg = items.reduce((sum, i) => sum + 0.3 * i.quantity, 0); // estimativa: 300g/peça

      const res = await fetch("/.netlify/functions/calcular-frete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cepDestino: cepDigits, pesoKg: totalWeightKg }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Não foi possível calcular o frete.");
      setShippingOptions(data.options);
      if (data.options[0]) setSelectedShipping(data.options[0]);
    } catch (err) {
      setShippingError(err instanceof Error ? err.message : "Erro ao calcular o frete.");
    } finally {
      setCalculatingShipping(false);
    }
  }

  async function createOrder(paymentMethod: "pagseguro" | "whatsapp") {
    if (!name || !phone || !selectedShipping) return null;
    const total = subtotal + selectedShipping.price_cents;

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        customer_name: name,
        customer_phone: phone,
        customer_email: email || null,
        shipping_cep: cep.replace(/\D/g, ""),
        shipping_address: { line: addressLine, number: addressNumber },
        shipping_cost_cents: selectedShipping.price_cents,
        subtotal_cents: subtotal,
        total_cents: total,
        status: paymentMethod === "whatsapp" ? "pending_whatsapp" : "pending_payment",
        payment_method: paymentMethod,
      })
      .select()
      .single();

    if (error || !order) {
      console.error(error);
      return null;
    }

    const orderItems = items.map((i) => ({
      order_id: order.id,
      product_variant_id: i.variantId,
      quantity: i.quantity,
      unit_price_cents: i.unitPriceCents,
    }));
    await supabase.from("order_items").insert(orderItems);

    return order;
  }

  async function handleWhatsappCheckout() {
    if (!name || !phone) {
      setShippingError("Preencha nome e telefone.");
      return;
    }
    if (!selectedShipping) {
      setShippingError("Calcule o frete antes de continuar.");
      return;
    }
    setSubmitting(true);
    const order = await createOrder("whatsapp");
    setSubmitting(false);
    if (!order) {
      setShippingError("Não foi possível criar o pedido. Tente novamente.");
      return;
    }
    const link = buildWhatsappOrderLink({
      orderId: order.id,
      items,
      subtotalCents: subtotal,
      shippingCents: selectedShipping.price_cents,
      customerName: name,
    });
    clearCart();
    window.location.href = link;
  }

  async function handlePagseguroCheckout() {
    if (!name || !phone) {
      setShippingError("Preencha nome e telefone.");
      return;
    }
    if (!selectedShipping) {
      setShippingError("Calcule o frete antes de continuar.");
      return;
    }
    setSubmitting(true);
    const order = await createOrder("pagseguro");
    if (!order) {
      setSubmitting(false);
      setShippingError("Não foi possível criar o pedido. Tente novamente.");
      return;
    }
    try {
      const res = await fetch("/.netlify/functions/criar-pagamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao iniciar pagamento.");
      clearCart();
      window.location.href = data.checkoutUrl;
    } catch (err) {
      setShippingError(err instanceof Error ? err.message : "Erro ao iniciar pagamento.");
      setSubmitting(false);
    }
  }

  const total = subtotal + (selectedShipping?.price_cents ?? 0);

  return (
    <div>
      <header className="border-b border-usepy-sand px-6 py-4">
        <Link to="/" className="font-display text-2xl text-usepy-copper">
          usepy
        </Link>
      </header>

      <div className="max-w-xl mx-auto px-6 py-10">
        <h1 className="text-2xl text-usepy-bark mb-6">Finalizar pedido</h1>

        <div className="space-y-3 mb-6">
          <input
            className="w-full border border-usepy-sand px-3 py-2"
            placeholder="Nome completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="w-full border border-usepy-sand px-3 py-2"
            placeholder="WhatsApp (com DDD)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <input
            className="w-full border border-usepy-sand px-3 py-2"
            placeholder="E-mail (opcional)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="mb-6">
          <p className="text-sm text-usepy-ink/70 mb-2">Calcular frete</p>
          <div className="flex gap-2">
            <input
              className="flex-1 border border-usepy-sand px-3 py-2"
              placeholder="Seu CEP"
              value={cep}
              onChange={(e) => setCep(e.target.value)}
            />
            <button
              onClick={calcularFrete}
              disabled={calculatingShipping}
              className="border border-usepy-copper text-usepy-copper px-4 disabled:opacity-40"
            >
              {calculatingShipping ? "Calculando..." : "Calcular"}
            </button>
          </div>
          {addressLine && <p className="text-xs text-usepy-ink/50 mt-1">{addressLine}</p>}
          <input
            className="w-full border border-usepy-sand px-3 py-2 mt-2"
            placeholder="Número / complemento"
            value={addressNumber}
            onChange={(e) => setAddressNumber(e.target.value)}
          />

          {shippingOptions.length > 0 && (
            <div className="mt-3 space-y-2">
              {shippingOptions.map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-center justify-between border px-3 py-2 cursor-pointer ${
                    selectedShipping?.id === opt.id ? "border-usepy-copper" : "border-usepy-sand"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={selectedShipping?.id === opt.id}
                      onChange={() => setSelectedShipping(opt)}
                    />
                    {opt.name} — até {opt.delivery_days} dias úteis
                  </span>
                  <span className="text-usepy-copper">{centsToBRL(opt.price_cents)}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {shippingError && <p className="text-red-600 text-sm mb-4">{shippingError}</p>}

        <div className="border-t border-usepy-sand pt-4 mb-6 text-sm space-y-1">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{centsToBRL(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Frete</span>
            <span>{selectedShipping ? centsToBRL(selectedShipping.price_cents) : "—"}</span>
          </div>
          <div className="flex justify-between text-lg text-usepy-copper font-medium">
            <span>Total</span>
            <span>{centsToBRL(total)}</span>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handlePagseguroCheckout}
            disabled={submitting}
            className="w-full bg-usepy-copper text-white py-3 rounded-full hover:bg-usepy-gold transition-colors disabled:opacity-40"
          >
            Pagar online (PagSeguro)
          </button>
          <button
            onClick={handleWhatsappCheckout}
            disabled={submitting}
            className="w-full border border-usepy-copper text-usepy-copper py-3 rounded-full hover:bg-usepy-sand transition-colors disabled:opacity-40"
          >
            Fechar pedido pelo WhatsApp
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
