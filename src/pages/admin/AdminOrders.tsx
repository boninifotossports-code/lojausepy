import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { centsToBRL } from "../../lib/format";

interface OrderRow {
  id: string;
  customer_name: string;
  customer_phone: string;
  status: string;
  payment_method: string;
  total_cents: number;
  created_at: string;
  order_items: { id: string; quantity: number; product_variant_id: string }[];
}

const STATUS_LABEL: Record<string, string> = {
  pending_payment: "Aguardando pagamento",
  pending_whatsapp: "Pendente (WhatsApp)",
  paid: "Pago",
  shipped: "Enviado",
  cancelled: "Cancelado",
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false });
    setOrders((data as unknown as OrderRow[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function markAsPaid(order: OrderRow) {
    if (!confirm("Confirmar pagamento e dar baixa no estoque deste pedido?")) return;
    await supabase.from("orders").update({ status: "paid" }).eq("id", order.id);
    for (const item of order.order_items) {
      await supabase.rpc("decrement_stock", {
        p_variant_id: item.product_variant_id,
        p_qty: item.quantity,
        p_order_id: order.id,
        p_reason: "sale",
      });
    }
    load();
  }

  async function markAsShipped(order: OrderRow) {
    await supabase.from("orders").update({ status: "shipped" }).eq("id", order.id);
    load();
  }

  async function cancelOrder(order: OrderRow) {
    if (!confirm("Cancelar este pedido?")) return;
    await supabase.from("orders").update({ status: "cancelled" }).eq("id", order.id);
    load();
  }

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl text-usepy-bark">Pedidos</h1>
        <select className="border p-2 text-sm" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">Todos</option>
          {Object.entries(STATUS_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="text-usepy-ink/50">Carregando...</p>}

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-usepy-ink/50 border-b border-usepy-sand">
            <th className="py-2">Cliente</th>
            <th>Total</th>
            <th>Pagamento</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((o) => (
            <tr key={o.id} className="border-b border-usepy-sand/50">
              <td className="py-2">
                {o.customer_name}
                <div className="text-xs text-usepy-ink/40">{o.customer_phone}</div>
              </td>
              <td>{centsToBRL(o.total_cents)}</td>
              <td>{o.payment_method}</td>
              <td>{STATUS_LABEL[o.status] ?? o.status}</td>
              <td className="text-right space-x-3">
                {(o.status === "pending_payment" || o.status === "pending_whatsapp") && (
                  <button onClick={() => markAsPaid(o)} className="text-green-700 underline">
                    marcar pago
                  </button>
                )}
                {o.status === "paid" && (
                  <button onClick={() => markAsShipped(o)} className="text-usepy-copper underline">
                    marcar enviado
                  </button>
                )}
                {o.status !== "cancelled" && o.status !== "shipped" && (
                  <button onClick={() => cancelOrder(o)} className="text-red-600 underline">
                    cancelar
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
