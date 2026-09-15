import { Link } from "react-router-dom";
import type { Product } from "../types/catalog";
import { centsToBRL, productImageUrl } from "../lib/format";

export default function ProductCard({ product }: { product: Product }) {
  const cover = product.product_images[0]?.storage_path ?? null;
  const totalStock = product.product_variants.reduce((n, v) => n + v.stock_qty, 0);

  return (
    <Link to={`/produto/${product.slug}`} className="group block">
      <div className="aspect-[3/4] bg-usepy-sand overflow-hidden mb-3">
        <img
          src={productImageUrl(cover)}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <h3 className="text-sm text-usepy-ink">{product.name}</h3>
      <p className="text-usepy-copper font-medium">{centsToBRL(product.price_cents)}</p>
      {totalStock === 0 && <p className="text-xs text-usepy-ink/40">Esgotado</p>}
    </Link>
  );
}
