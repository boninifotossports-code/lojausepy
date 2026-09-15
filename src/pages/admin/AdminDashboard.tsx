import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { centsToBRL } from "../../lib/format";

export default function AdminDashboard() {
  const [stats, setStats] = useState<{
    pedidosPendentes: number;
    vendasMes: number;
    estoqueBaixo: number;
  } | null>(null);

  useEffect(() => {
    async function load() {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const [{ count: pendentes }, { data: pagosNoMes }, { data: variants }] = await Promise.all([
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .in("status", ["pending_payment", "pending_whatsapp"]),
        supabase
          .from("orders")
          .select("total_cents")
          .eq("status", "paid")
          .gte("created_at", startOfMonth.toISOString()),
        supabase.from("product_variants").select("id, stock_qty").lte("stock_qty", 3),
      ]);

      setStats({
        pedidosPendentes: pendentes ?? 0,
        vendasMes: (pagosNoMes ?? []).reduce((sum, o) => sum + o.total_cents, 0),
        estoqueBaixo: (variants ?? []).length,
      });
    }
    load();
  }, []);

  if (!stats) return <p className="text-usepy-ink/50">Carregando...</p>;

  return (
    <div>
      <h1 className="text-2xl text-usepy-bark mb-6">Dashboard</h1>
      <div className="grid grid-cols-3 gap-4">
        <Card label="Pedidos pendentes" value={String(stats.pedidosPendentes)} />
        <Card label="Vendas no mês (pagas)" value={centsToBRL(stats.vendasMes)} />
        <Card label="Variações com estoque baixo (≤3)" value={String(stats.estoqueBaixo)} />
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-usepy-sand p-4 rounded">
      <p className="text-xs text-usepy-ink/50 mb-1">{label}</p>
      <p className="text-2xl text-usepy-copper">{value}</p>
    </div>
  );
}
