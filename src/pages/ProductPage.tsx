import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { Category, Product, ProductVariant } from "../types/catalog";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { centsToBRL, productImageUrl } from "../lib/format";
import { useCartStore } from "../lib/cartStore";

export default function ProductPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    supabase.from("categories").select("*").then(({ data }) => setCategories(data ?? []));
  }, []);

  useEffect(() => {
    if (!slug) return;
    supabase
      .from("products")
      .select("*, product_images(*), product_variants(*)")
      .eq("slug", slug)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error(error);
          return;
        }
        const p = data as unknown as Product;
        setProduct(p);
        setSelectedVariant(p.product_variants[0] ?? null);
      });
  }, [slug]);

  if (!product) {
    return (
      <div>
        <Header categories={categories} />
        <div className="p-6 text-usepy-ink/50">Carregando produto...</div>
        <Footer />
      </div>
    );
  }

  const sizes = [...new Set(product.product_variants.map((v) => v.size).filter(Boolean))];
  const colors = [...new Set(product.product_variants.map((v) => v.color).filter(Boolean))];
  const price = selectedVariant?.price_cents_override ?? product.price_cents;
  const images = product.product_images.length
    ? product.product_images
    : [{ id: "placeholder", storage_path: "", sort_order: 0 }];

  function pickVariant(size: string | null, color: string | null) {
    const match = product!.product_variants.find((v) => v.size === size && v.color === color);
    if (match) setSelectedVariant(match);
  }

  function handleAddToCart() {
    if (!selectedVariant || selectedVariant.stock_qty === 0) return;
    addItem({
      variantId: selectedVariant.id,
      productId: product!.id,
      productName: product!.name,
      productSlug: product!.slug,
      size: selectedVariant.size,
      color: selectedVariant.color,
      unitPriceCents: price,
      quantity: 1,
      imagePath: images[0]?.storage_path || null,
      maxStock: selectedVariant.stock_qty,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div>
      <Header categories={categories} />

      <div className="max-w-5xl mx-auto px-6 py-12 grid md:grid-cols-2 gap-12">
        <div>
          <div className="aspect-[3/4] bg-usepy-sand mb-3 overflow-hidden rounded shadow-soft">
            <img
              src={productImageUrl(images[activeImage]?.storage_path || null)}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          {images.length > 1 && (
            <div className="flex gap-2">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(i)}
                  className={`w-16 h-16 bg-usepy-sand overflow-hidden rounded border ${
                    i === activeImage ? "border-usepy-copper" : "border-transparent"
                  }`}
                >
                  <img src={productImageUrl(img.storage_path)} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="md:sticky md:top-24 self-start">
          <h1 className="text-4xl text-usepy-bark mb-2 leading-tight">{product.name}</h1>
          <p className="text-2xl text-usepy-copper mb-5">{centsToBRL(price)}</p>
          {product.description && (
            <p className="text-usepy-ink/70 mb-6 leading-relaxed">{product.description}</p>
          )}

          {sizes.length > 0 && (
            <div className="mb-4">
              <p className="text-sm mb-2 text-usepy-ink/70">Tamanho</p>
              <div className="flex gap-2 flex-wrap">
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => pickVariant(size, selectedVariant?.color ?? colors[0] ?? null)}
                    className={`border rounded-full px-4 py-1.5 text-sm transition-colors ${
                      selectedVariant?.size === size
                        ? "border-usepy-copper bg-usepy-copper text-white"
                        : "border-usepy-line hover:border-usepy-copper"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {colors.length > 0 && (
            <div className="mb-6">
              <p className="text-sm mb-2 text-usepy-ink/70">Cor</p>
              <div className="flex gap-2 flex-wrap">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => pickVariant(selectedVariant?.size ?? sizes[0] ?? null, color)}
                    className={`border rounded-full px-4 py-1.5 text-sm transition-colors ${
                      selectedVariant?.color === color
                        ? "border-usepy-copper bg-usepy-copper text-white"
                        : "border-usepy-line hover:border-usepy-copper"
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleAddToCart}
            disabled={!selectedVariant || selectedVariant.stock_qty === 0}
            className="btn-primary w-full"
          >
            {!selectedVariant || selectedVariant.stock_qty === 0
              ? "Esgotado"
              : added
              ? "Adicionado ✓"
              : "Adicionar à sacola"}
          </button>
          <button
            onClick={() => navigate("/carrinho")}
            className="w-full text-usepy-copper text-sm mt-3 underline"
          >
            Ver sacola
          </button>

          <div className="border-t border-usepy-line mt-8 pt-5 text-xs text-usepy-ink/60 space-y-1.5">
            <p>✦ Frete calculado pelo seu CEP no checkout</p>
            <p>✦ Pagamento online seguro ou combine pelo WhatsApp</p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
