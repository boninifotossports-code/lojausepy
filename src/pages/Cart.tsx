import { Link, useNavigate } from "react-router-dom";
import { useCartStore } from "../lib/cartStore";
import { centsToBRL, productImageUrl } from "../lib/format";
import Footer from "../components/Footer";

export default function Cart() {
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const subtotal = useCartStore((s) => s.subtotalCents());
  const navigate = useNavigate();

  return (
    <div>
      <header className="border-b border-usepy-sand px-6 py-4">
        <Link to="/" className="font-display text-2xl text-usepy-copper">
          usepy
        </Link>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl text-usepy-bark mb-6">Sua sacola</h1>

        {items.length === 0 && (
          <div className="text-center py-16">
            <p className="text-usepy-ink/50 mb-4">Sua sacola está vazia.</p>
            <Link to="/" className="text-usepy-copper underline">
              Continuar comprando
            </Link>
          </div>
        )}

        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.variantId} className="flex gap-4 border-b border-usepy-sand pb-4">
              <div className="w-20 h-24 bg-usepy-sand overflow-hidden shrink-0">
                <img
                  src={productImageUrl(item.imagePath)}
                  className="w-full h-full object-cover"
                  alt={item.productName}
                />
              </div>
              <div className="flex-1">
                <Link to={`/produto/${item.productSlug}`} className="text-usepy-ink hover:text-usepy-copper">
                  {item.productName}
                </Link>
                <p className="text-sm text-usepy-ink/50">
                  {[item.size, item.color].filter(Boolean).join(" · ")}
                </p>
                <p className="text-usepy-copper">{centsToBRL(item.unitPriceCents)}</p>
                <div className="flex items-center gap-2 mt-2">
                  <select
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.variantId, Number(e.target.value))}
                    className="border border-usepy-sand px-2 py-1 text-sm"
                  >
                    {Array.from({ length: item.maxStock }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => removeItem(item.variantId)}
                    className="text-xs text-usepy-ink/40 underline"
                  >
                    remover
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {items.length > 0 && (
          <div className="mt-8">
            <div className="flex justify-between text-lg mb-4">
              <span>Subtotal</span>
              <span className="text-usepy-copper">{centsToBRL(subtotal)}</span>
            </div>
            <p className="text-xs text-usepy-ink/50 mb-4">Frete calculado no próximo passo.</p>
            <button
              onClick={() => navigate("/checkout")}
              className="w-full bg-usepy-copper text-white py-3 rounded-full hover:bg-usepy-gold transition-colors"
            >
              Fechar pedido
            </button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
