import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { ADMIN_PATH } from "../../lib/supabase";
import { centsToBRL } from "../../lib/format";
import type { Product } from "../../types/catalog";

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("products")
      .select("*, product_images(*), product_variants(*)")
      .order("created_at", { ascending: false });
    setProducts((data as unknown as Product[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleActive(p: Product) {
    await supabase.from("products").update({ is_active: !p.is_active }).eq("id", p.id);
    load();
  }

  async function remove(p: Product) {
    if (!confirm(`Excluir "${p.name}"? Essa ação não pode ser desfeita.`)) return;
    await supabase.from("products").delete().eq("id", p.id);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl text-usepy-bark">Produtos</h1>
        <Link
          to={`${ADMIN_PATH}/produtos/novo`}
          className="bg-usepy-copper text-white px-4 py-2 rounded"
        >
          + Novo produto
        </Link>
      </div>

      {loading && <p className="text-usepy-ink/50">Carregando...</p>}

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-usepy-ink/50 border-b border-usepy-sand">
            <th className="py-2">Produto</th>
            <th>Preço</th>
            <th>Estoque total</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => {
            const stock = p.product_variants.reduce((n, v) => n + v.stock_qty, 0);
            return (
              <tr key={p.id} className="border-b border-usepy-sand/50">
                <td className="py-2">{p.name}</td>
                <td>{centsToBRL(p.price_cents)}</td>
                <td className={stock <= 3 ? "text-red-600" : ""}>{stock}</td>
                <td>
                  <button onClick={() => toggleActive(p)} className="underline text-xs">
                    {p.is_active ? "ativo" : "inativo"}
                  </button>
                </td>
                <td className="text-right space-x-3">
                  <Link to={`${ADMIN_PATH}/produtos/${p.id}`} className="text-usepy-copper underline">
                    editar
                  </Link>
                  <button onClick={() => remove(p)} className="text-red-600 underline">
                    excluir
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
