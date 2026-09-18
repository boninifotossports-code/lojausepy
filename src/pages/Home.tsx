import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { Category, Product } from "../types/catalog";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [params] = useSearchParams();
  const categoriaSlug = params.get("categoria");

  useEffect(() => {
    supabase
      .from("categories")
      .select("*")
      .order("sort_order")
      .then(({ data }) => setCategories(data ?? []));
  }, []);

  useEffect(() => {
    setLoading(true);
    let query = supabase
      .from("products")
      .select("*, product_images(*), product_variants(*)")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (categoriaSlug) {
      const cat = categories.find((c) => c.slug === categoriaSlug);
      if (cat) query = query.eq("category_id", cat.id);
    }

    query.then(({ data, error }) => {
      if (error) console.error(error);
      setProducts((data as unknown as Product[]) ?? []);
      setLoading(false);
    });
  }, [categoriaSlug, categories]);

  const topCategories = categories.filter((c) => !c.parent_id).slice(0, 4);

  return (
    <div>
      <Header categories={categories} />

      {/* Hero */}
      <section className="relative bg-usepy-sand overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-28 grid md:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
          <div>
            <h1 className="text-5xl md:text-[3.5rem] mb-5 text-usepy-bark leading-[1.05]">
              Treine com atitude,
              <br />
              vista com propósito
            </h1>
            <p className="text-usepy-ink/70 max-w-sm mb-8 leading-relaxed">
              Conjuntos, leggings e acessórios desenhados para acompanhar cada
              treino — e o resto do seu dia.
            </p>
            <Link to="#vitrine" className="btn-primary inline-block">
              Ver coleção
            </Link>
          </div>

          <div className="relative h-72 md:h-[26rem] hidden md:block" aria-hidden="true">
            <div
              className="absolute inset-0 m-auto w-72 h-72 bg-gradient-to-br from-usepy-copper to-usepy-gold opacity-90"
              style={{ borderRadius: "62% 38% 55% 45% / 48% 55% 45% 52%" }}
            />
            <div className="absolute top-4 right-2 w-44 h-44 border border-usepy-bark/20 rounded-full" />
            <span className="absolute top-0 left-8 text-usepy-copper/70 text-3xl">✦</span>
            <span className="absolute bottom-10 right-6 text-usepy-gold text-2xl">✦</span>
            <span className="absolute bottom-28 left-2 text-usepy-bark/25 text-lg">✦</span>
          </div>
        </div>
      </section>

      {/* Categorias em destaque */}
      {topCategories.length > 0 && (
        <section className="px-6 py-10 max-w-5xl mx-auto">
          <div className="flex gap-3 justify-center flex-wrap">
            {topCategories.map((c) => (
              <Link
                key={c.id}
                to={`/?categoria=${c.slug}#vitrine`}
                className={`text-sm px-5 py-2 rounded-full border transition-colors ${
                  categoriaSlug === c.slug
                    ? "bg-usepy-copper text-white border-usepy-copper"
                    : "border-usepy-line text-usepy-bark hover:border-usepy-copper"
                }`}
              >
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Vitrine */}
      <section id="vitrine" className="px-6 py-12 max-w-6xl mx-auto scroll-mt-20">
        <div className="flex items-end justify-between mb-8 border-b border-usepy-line pb-4">
          <div>
            <p className="section-label mb-1">Vitrine</p>
            <h2 className="text-3xl text-usepy-bark">
              {categoriaSlug
                ? categories.find((c) => c.slug === categoriaSlug)?.name ?? "Produtos"
                : "Todos os produtos"}
            </h2>
          </div>
          {categoriaSlug && (
            <Link to="/" className="text-sm text-usepy-copper underline">
              limpar filtro
            </Link>
          )}
        </div>

        {loading && <p className="text-usepy-ink/50">Carregando...</p>}
        {!loading && products.length === 0 && (
          <p className="text-usepy-ink/50">Nenhum produto encontrado nessa categoria.</p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Faixa de confiança */}
      <section className="border-t border-usepy-line px-6 py-10">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-sm text-usepy-ink/70">
          <div>
            <p className="text-usepy-copper mb-1">✦</p>
            <p>Frete calculado na hora, direto pelo seu CEP</p>
          </div>
          <div>
            <p className="text-usepy-copper mb-1">✦</p>
            <p>Pagamento online seguro ou combine pelo WhatsApp</p>
          </div>
          <div>
            <p className="text-usepy-copper mb-1">✦</p>
            <p>Acompanhe seu pedido a qualquer momento</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
