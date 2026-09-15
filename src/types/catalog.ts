export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  sort_order: number;
}

export interface ProductImage {
  id: string;
  storage_path: string;
  sort_order: number;
}

export interface ProductVariant {
  id: string;
  size: string | null;
  color: string | null;
  sku: string | null;
  stock_qty: number;
  price_cents_override: number | null;
}

export interface Product {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  price_cents: number;
  is_active: boolean;
  is_featured: boolean;
  product_images: ProductImage[];
  product_variants: ProductVariant[];
}

export interface CartItem {
  variantId: string;
  productId: string;
  productName: string;
  productSlug: string;
  size: string | null;
  color: string | null;
  unitPriceCents: number;
  quantity: number;
  imagePath: string | null;
  maxStock: number;
}
