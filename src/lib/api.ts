const API_BASE = "http://localhost:8000";

export interface Attribute {
  name: string;
  value: string;
}

export interface ProductOut {
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

/** Resolve a category id to its name — used to label the active filter chip
 *  when the filter comes from the URL (deep link) and the name isn't known. */
export async function fetchCategory(id: number): Promise<Category> {
  const res = await fetch(`${API_BASE}/categories/${id}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json();
}
