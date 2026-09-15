export function centsToBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

// Monta a URL pública de uma imagem guardada no bucket `product-images`.
export function productImageUrl(storagePath: string | null): string {
  if (!storagePath) return "/placeholder-produto.svg";
  return `${SUPABASE_URL}/storage/v1/object/public/product-images/${storagePath}`;
}
