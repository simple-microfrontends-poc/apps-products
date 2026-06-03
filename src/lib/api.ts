const API_BASE = process.env.API_BASE ?? "http://localhost:8000";

export interface Attribute {
  name: string;
  value: string;
}

export interface ProductOut {
  id: number;
  sku: string;
  name: string;
  images: string[];
  description: string;
  category: string;
  attributes: Attribute[];
  gtin: string;
}

export interface ProductList {
  items: ProductOut[];
  total: number;
  limit: number;
  offset: number;
}

export async function fetchProducts(
  limit = 20,
  offset = 0,
  search?: string,
  category?: number
): Promise<ProductList> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  if (search) params.set("search", search);
  if (category != null) params.set("category", String(category));

  const res = await fetch(`${API_BASE}/products?${params}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json();
}

export interface Category {
  id: number;
  name: string;
}

/** Full category breadcrumb (root first) — used to render the active filter
 *  as a clickable path (resolves the id from the URL to named, navigable crumbs). */
export async function fetchCategoryPath(id: number): Promise<Category[]> {
  const res = await fetch(`${API_BASE}/categories/${id}/paths`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json();
}
