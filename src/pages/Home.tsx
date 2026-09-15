import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
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

  return (
    <div>
      <Header categories={categories} />

      <section className="bg-usepy-sand px-6 py-20 text-center">
        <h1 className="text-4xl md:text-5xl mb-4 text-usepy-bark">
          Moda fitness com atitude
        </h1>
        <p className="text-usepy-ink/70 max-w-md mx-auto">
          Conjuntos, leggings e acessórios pensados para o seu treino — e para o seu dia.
        </p>
      </section>

      <section className="px-6 py-12 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl text-usepy-bark">
            {categoriaSlug
              ? categories.find((c) => c.slug === categoriaSlug)?.name ?? "Produtos"
              : "Todos os produtos"}
          </h2>
        </div>

        {loading && <p className="text-usepy-ink/50">Carregando...</p>}
        {!loading && products.length === 0 && (
          <p className="text-usepy-ink/50">Nenhum produto encontrado nessa categoria.</p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
