import { Link } from "react-router-dom";
import type { Product } from "../types/catalog";
import { centsToBRL, productImageUrl } from "../lib/format";

export default function ProductCard({ product }: { product: Product }) {
  const cover = product.product_images[0]?.storage_path ?? null;
  const totalStock = product.product_variants.reduce((n, v) => n + v.stock_qty, 0);

  return (
    <Link to={`/produto/${product.slug}`} className="group block">
      <div className="relative aspect-[3/4] bg-usepy-sand overflow-hidden mb-3 rounded">
        <img
          src={productImageUrl(cover)}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500 ease-out"
        />
        {product.is_featured && totalStock > 0 && (
          <span className="absolute top-2 left-2 bg-usepy-cream/90 text-usepy-copper text-xs px-2.5 py-1 rounded-full">
            Destaque
          </span>
        )}
        {totalStock === 0 && (
          <div className="absolute inset-0 bg-usepy-cream/70 flex items-center justify-center">
            <span className="section-label text-base">Esgotado</span>
          </div>
        )}
      </div>
      <h3 className="text-[15px] text-usepy-ink group-hover:text-usepy-copper transition-colors">
        {product.name}
      </h3>
      <p className="text-usepy-copper text-sm mt-0.5">{centsToBRL(product.price_cents)}</p>
    </Link>
  );
}
