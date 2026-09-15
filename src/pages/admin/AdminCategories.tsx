import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { Category } from "../../types/catalog";

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase.from("categories").select("*").order("sort_order");
    setCategories(data ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  function slugify(value: string) {
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  function startEdit(c: Category) {
    setEditingId(c.id);
    setName(c.name);
    setParentId(c.parent_id ?? "");
  }

  function resetForm() {
    setEditingId(null);
    setName("");
    setParentId("");
    setError(null);
  }

  async function handleSave() {
    if (!name.trim()) {
      setError("Digite um nome para a categoria.");
      return;
    }
    setError(null);
    const payload = { name, slug: slugify(name), parent_id: parentId || null };

    const { error: saveError } = editingId
      ? await supabase.from("categories").update(payload).eq("id", editingId)
      : await supabase.from("categories").insert(payload);

    if (saveError) {
      setError(saveError.message);
      return;
    }
    resetForm();
    load();
  }

  async function remove(c: Category) {
    if (!confirm(`Excluir a categoria "${c.name}"? Produtos ligados a ela ficam sem categoria.`)) return;
    await supabase.from("categories").delete().eq("id", c.id);
    load();
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl text-usepy-bark mb-6">Categorias</h1>

      <div className="border border-usepy-sand p-4 rounded mb-6">
        <p className="text-sm text-usepy-ink/70 mb-2">
          {editingId ? "Editar categoria" : "Nova categoria"}
        </p>
        <div className="flex gap-2 mb-2">
          <input
            className="flex-1 border p-2"
            placeholder="Nome (ex.: Leggings, Conjuntos, Top)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <select className="border p-2" value={parentId} onChange={(e) => setParentId(e.target.value)}>
            <option value="">Categoria principal</option>
            {categories
              .filter((c) => c.id !== editingId)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  Subcategoria de {c.name}
                </option>
              ))}
          </select>
        </div>
        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
        <div className="flex gap-2">
          <button onClick={handleSave} className="bg-usepy-copper text-white px-4 py-2 rounded">
            {editingId ? "Salvar alterações" : "Adicionar categoria"}
          </button>
          {editingId && (
            <button onClick={resetForm} className="text-sm text-usepy-ink/50 underline">
              cancelar edição
            </button>
          )}
        </div>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-usepy-ink/50 border-b border-usepy-sand">
            <th className="py-2">Nome</th>
            <th>Tipo</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {categories.map((c) => (
            <tr key={c.id} className="border-b border-usepy-sand/50">
              <td className="py-2">{c.name}</td>
              <td className="text-usepy-ink/50">
                {c.parent_id
                  ? `Subcategoria de ${categories.find((p) => p.id === c.parent_id)?.name ?? "—"}`
                  : "Principal"}
              </td>
              <td className="text-right space-x-3">
                <button onClick={() => startEdit(c)} className="text-usepy-copper underline">
                  editar
                </button>
                <button onClick={() => remove(c)} className="text-red-600 underline">
                  excluir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
