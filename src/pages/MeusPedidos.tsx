import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { centsToBRL } from "../lib/format";
import Footer from "../components/Footer";

const STATUS_LABEL: Record<string, string> = {
  pending_payment: "Aguardando pagamento",
  pending_whatsapp: "Pendente — combinar pelo WhatsApp",
  paid: "Pago",
  shipped: "Enviado",
  cancelled: "Cancelado",
};

interface OrderItem {
  product_name: string;
  size: string | null;
  color: string | null;
  quantity: number;
  unit_price_cents: number;
}

interface OrderResult {
  id: string;
  status: string;
  payment_method: string;
  subtotal_cents: number;
  shipping_cost_cents: number;
  total_cents: number;
  created_at: string;
  items: OrderItem[];
}

export default function MeusPedidos() {
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<OrderResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch() {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) return;
    setLoading(true);
    setSearched(true);
    const { data, error } = await supabase.rpc("get_orders_by_phone", { p_phone: digits });
    if (error) {
      console.error(error);
      setOrders([]);
    } else {
      setOrders((data as OrderResult[]) ?? []);
    }
    setLoading(false);
  }

  return (
    <div>
      <header className="border-b border-usepy-sand px-6 py-4">
        <Link to="/" className="font-display text-2xl text-usepy-copper">
          usepy
        </Link>
      </header>

      <div className="max-w-xl mx-auto px-6 py-10">
        <h1 className="text-2xl text-usepy-bark mb-2">Meus pedidos</h1>
        <p className="text-sm text-usepy-ink/60 mb-6">
          Digite o WhatsApp usado na compra para ver o status dos seus pedidos.
        </p>

        <div className="flex gap-2 mb-8">
          <input
            className="flex-1 border border-usepy-sand px-3 py-2"
            placeholder="Seu WhatsApp (com DDD)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-usepy-copper text-white px-5 disabled:opacity-40"
          >
            {loading ? "Buscando..." : "Buscar"}
          </button>
        </div>

        {searched && !loading && orders?.length === 0 && (
          <p className="text-usepy-ink/50">Nenhum pedido encontrado para esse número.</p>
        )}

        <div className="space-y-4">
          {orders?.map((o) => (
            <div key={o.id} className="border border-usepy-sand p-4 rounded">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-usepy-ink text-sm">Pedido #{o.id.slice(0, 8)}</p>
                  <p className="text-xs text-usepy-ink/40">
                    {new Date(o.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <span className="text-xs border border-usepy-copper text-usepy-copper rounded-full px-3 py-1">
                  {STATUS_LABEL[o.status] ?? o.status}
                </span>
              </div>

              <ul className="text-sm text-usepy-ink/70 space-y-1 mb-2">
                {o.items.map((item, i) => (
                  <li key={i}>
                    {item.quantity}x {item.product_name}{" "}
                    {[item.size, item.color].filter(Boolean).join("/")} —{" "}
                    {centsToBRL(item.unit_price_cents * item.quantity)}
                  </li>
                ))}
              </ul>

              <div className="text-sm text-usepy-ink/60 flex justify-between border-t border-usepy-sand pt-2">
                <span>Frete: {centsToBRL(o.shipping_cost_cents)}</span>
                <span className="text-usepy-copper font-medium">Total: {centsToBRL(o.total_cents)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
