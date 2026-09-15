import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase, ADMIN_PATH } from "../../lib/supabase";
import type { Category, ProductImage, ProductVariant } from "../../types/catalog";
import { productImageUrl } from "../../lib/format";

interface VariantRow {
  id?: string;
  size: string;
  color: string;
  sku: string;
  stock_qty: number;
}

export default function AdminProductForm() {
  const { id } = useParams();
  const isNew = !id || id === "novo";
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [priceReais, setPriceReais] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [variants, setVariants] = useState<VariantRow[]>([{ size: "", color: "", sku: "", stock_qty: 0 }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("categories").select("*").order("sort_order").then(({ data }) => setCategories(data ?? []));
  }, []);

  useEffect(() => {
    if (isNew) return;
    supabase
      .from("products")
      .select("*, product_images(*), product_variants(*)")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        if (!data) return;
        setName(data.name);
        setSlug(data.slug);
        setDescription(data.description ?? "");
        setPriceReais((data.price_cents / 100).toFixed(2));
        setCategoryId(data.category_id ?? "");
        setIsActive(data.is_active);
        setIsFeatured(data.is_featured);
        setImages(data.product_images ?? []);
        setVariants(
          (data.product_variants as ProductVariant[]).length
            ? (data.product_variants as ProductVariant[]).map((v) => ({
                id: v.id,
                size: v.size ?? "",
                color: v.color ?? "",
                sku: v.sku ?? "",
                stock_qty: v.stock_qty,
              }))
            : [{ size: "", color: "", sku: "", stock_qty: 0 }]
        );
      });
  }, [id, isNew]);

  function slugify(value: string) {
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  function updateVariant(index: number, field: keyof VariantRow, value: string | number) {
    setVariants((rows) => rows.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  }

  async function handleSave() {
    setError(null);
    const priceCents = Math.round(parseFloat(priceReais.replace(",", ".")) * 100);
    if (!name || !slug || isNaN(priceCents)) {
      setError("Preencha nome, slug e preço válidos.");
      return;
    }
    setSaving(true);

    const productPayload = {
      name,
      slug,
      description,
      price_cents: priceCents,
      category_id: categoryId || null,
      is_active: isActive,
      is_featured: isFeatured,
    };

    let productId = id;
    if (isNew) {
      const { data, error: insertError } = await supabase
        .from("products")
        .insert(productPayload)
        .select()
        .single();
      if (insertError || !data) {
        setError(insertError?.message ?? "Erro ao criar produto.");
        setSaving(false);
        return;
      }
      productId = data.id;
    } else {
      const { error: updateError } = await supabase.from("products").update(productPayload).eq("id", id);
      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }
    }

    // Upload de novas imagens
    for (const file of newFiles) {
      const path = `${productId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("product-images").upload(path, file);
      if (!uploadError) {
        await supabase.from("product_images").insert({ product_id: productId, storage_path: path });
      }
    }

    // Variações: apaga e recria (simples para o scaffold; dá pra evoluir
    // para um diff mais fino depois, preservando IDs existentes)
    await supabase.from("product_variants").delete().eq("product_id", productId);
    const validVariants = variants.filter((v) => v.size || v.color);
    if (validVariants.length > 0) {
      await supabase.from("product_variants").insert(
        validVariants.map((v) => ({
          product_id: productId,
          size: v.size || null,
          color: v.color || null,
          sku: v.sku || null,
          stock_qty: v.stock_qty,
        }))
      );
    }

    setSaving(false);
    navigate(`${ADMIN_PATH}/produtos`);
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl text-usepy-bark mb-6">{isNew ? "Novo produto" : "Editar produto"}</h1>

      <div className="space-y-3">
        <input
          className="w-full border p-2"
          placeholder="Nome"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (isNew) setSlug(slugify(e.target.value));
          }}
        />
        <input
          className="w-full border p-2"
          placeholder="slug (URL do produto)"
          value={slug}
          onChange={(e) => setSlug(slugify(e.target.value))}
        />
        <textarea
          className="w-full border p-2"
          placeholder="Descrição"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="flex gap-3">
          <input
            className="w-32 border p-2"
            placeholder="Preço (R$)"
            value={priceReais}
            onChange={(e) => setPriceReais(e.target.value)}
          />
          <select className="flex-1 border p-2" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Sem categoria</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-4 text-sm">
          <label>
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Ativo
          </label>
          <label>
            <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} /> Destaque
          </label>
        </div>

        <div>
          <p className="text-sm text-usepy-ink/70 mb-2">Imagens</p>
          <div className="flex gap-2 flex-wrap mb-2">
            {images.map((img) => (
              <img
                key={img.id}
                src={productImageUrl(img.storage_path)}
                className="w-16 h-16 object-cover border"
              />
            ))}
          </div>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => setNewFiles(Array.from(e.target.files ?? []))}
          />
        </div>

        <div>
          <p className="text-sm text-usepy-ink/70 mb-2">Variações (tamanho / cor / estoque)</p>
          {variants.map((v, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                className="w-20 border p-1"
                placeholder="Tam."
                value={v.size}
                onChange={(e) => updateVariant(i, "size", e.target.value)}
              />
              <input
                className="w-28 border p-1"
                placeholder="Cor"
                value={v.color}
                onChange={(e) => updateVariant(i, "color", e.target.value)}
              />
              <input
                className="w-28 border p-1"
                placeholder="SKU"
                value={v.sku}
                onChange={(e) => updateVariant(i, "sku", e.target.value)}
              />
              <input
                className="w-20 border p-1"
                type="number"
                placeholder="Estoque"
                value={v.stock_qty}
                onChange={(e) => updateVariant(i, "stock_qty", Number(e.target.value))}
              />
              <button
                onClick={() => setVariants((rows) => rows.filter((_, idx) => idx !== i))}
                className="text-red-600 text-xs"
              >
                remover
              </button>
            </div>
          ))}
          <button
            onClick={() => setVariants((rows) => [...rows, { size: "", color: "", sku: "", stock_qty: 0 }])}
            className="text-usepy-copper text-sm underline"
          >
            + variação
          </button>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-usepy-copper text-white px-6 py-2 rounded disabled:opacity-40"
        >
          {saving ? "Salvando..." : "Salvar produto"}
        </button>
      </div>
    </div>
  );
}
