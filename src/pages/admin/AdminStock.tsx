import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

interface VariantRow {
  id: string;
  size: string | null;
  color: string | null;
  sku: string | null;
  stock_qty: number;
  product_id: string;
  products: { name: string } | null;
}

export default function AdminStock() {
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deltas, setDeltas] = useState<Record<string, string>>({});
  const [onlyLow, setOnlyLow] = useState(false);
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("product_variants")
      .select("*, products(name)")
      .order("stock_qty", { ascending: true });
    setVariants((data as unknown as VariantRow[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function applyAdjustment(variant: VariantRow) {
    const raw = deltas[variant.id];
    const delta = parseInt(raw, 10);
    if (!raw || isNaN(delta) || delta === 0) return;

    const reason = delta > 0 ? "restock" : "manual_adjustment";
    // decrement_stock subtrai p_qty do estoque; para ADICIONAR estoque
    // (delta positivo) passamos o valor negativo.
    await supabase.rpc("decrement_stock", {
      p_variant_id: variant.id,
      p_qty: -delta,
      p_order_id: null,
      p_reason: reason,
    });
    setDeltas((d) => ({ ...d, [variant.id]: "" }));
    load();
  }

  const filtered = variants
    .filter((v) => !onlyLow || v.stock_qty <= 3)
    .filter((v) =>
      search
        ? (v.products?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
          (v.sku ?? "").toLowerCase().includes(search.toLowerCase())
        : true
    );

  return (
    <div>
      <h1 className="text-2xl text-usepy-bark mb-6">Estoque</h1>

      <div className="flex gap-3 mb-4 text-sm">
        <input
          className="border p-2 flex-1"
          placeholder="Buscar por produto ou SKU"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={onlyLow} onChange={(e) => setOnlyLow(e.target.checked)} />
          Só estoque baixo (≤3)
        </label>
      </div>

      {loading && <p className="text-usepy-ink/50">Carregando...</p>}

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-usepy-ink/50 border-b border-usepy-sand">
            <th className="py-2">Produto</th>
            <th>Variação</th>
            <th>SKU</th>
            <th>Estoque</th>
            <th>Ajustar</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((v) => (
            <tr key={v.id} className="border-b border-usepy-sand/50">
              <td className="py-2">{v.products?.name ?? "—"}</td>
              <td>{[v.size, v.color].filter(Boolean).join(" / ") || "—"}</td>
              <td className="text-usepy-ink/50">{v.sku ?? "—"}</td>
              <td className={v.stock_qty <= 3 ? "text-red-600 font-medium" : ""}>{v.stock_qty}</td>
              <td>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    className="w-20 border p-1"
                    placeholder="+/- qtd"
                    value={deltas[v.id] ?? ""}
                    onChange={(e) => setDeltas((d) => ({ ...d, [v.id]: e.target.value }))}
                  />
                  <button
                    onClick={() => applyAdjustment(v)}
                    className="text-usepy-copper underline text-xs"
                  >
                    aplicar
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-usepy-ink/40 mt-3">
        Use números positivos para repor estoque (ex.: 10) e negativos para corrigir uma
        contagem (ex.: -2). Toda alteração fica registrada em <code>stock_movements</code>.
      </p>
    </div>
  );
}
