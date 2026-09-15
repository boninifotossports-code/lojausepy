import { Link } from "react-router-dom";
import type { Category } from "../types/catalog";
import { useCartStore } from "../lib/cartStore";

export default function Header({ categories }: { categories: Category[] }) {
  const itemCount = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));

  return (
    <header className="border-b border-usepy-sand px-6 py-4 flex items-center justify-between sticky top-0 bg-usepy-cream/95 backdrop-blur z-10">
      <Link to="/" className="font-display text-3xl tracking-wide text-usepy-copper">
        usepy
      </Link>
      <nav className="hidden md:flex gap-6 text-sm text-usepy-ink/80">
        {categories
          .filter((c) => !c.parent_id)
          .map((c) => (
            <Link key={c.id} to={`/?categoria=${c.slug}`} className="hover:text-usepy-copper">
              {c.name}
            </Link>
          ))}
      </nav>
      <Link
        to="/carrinho"
        className="text-sm border border-usepy-copper text-usepy-copper rounded-full px-4 py-1.5 hover:bg-usepy-copper hover:text-white transition-colors"
      >
        Sacola {itemCount > 0 ? `(${itemCount})` : ""}
      </Link>
    </header>
  );
}
