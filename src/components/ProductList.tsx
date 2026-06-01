import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { bus } from "@admin/event-bus";
import type {
  CategorySelection,
  CategoryPickerProps,
} from "categoryPicker/CategoryPicker";
import { fetchProducts, fetchCategory, ProductOut } from "../lib/api";

const LIMIT = 20;

const CategoryPicker = React.lazy(
  () => import("categoryPicker/CategoryPicker")
) as React.LazyExoticComponent<React.ComponentType<CategoryPickerProps>>;

class PickerErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="bg-white rounded-lg border border-red-200 p-6">
          <h3 className="text-red-700 font-medium">Picker kategorii niedostępny</h3>
          <p className="text-red-600 text-sm mt-1">{this.state.error.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

function CategoryPickerModal({
  onSelect,
  onClose,
}: {
  onSelect: (selection: CategorySelection) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <PickerErrorBoundary>
          <React.Suspense
            fallback={
              <div className="bg-white rounded-lg border border-gray-200 p-12 flex justify-center">
                <div className="animate-spin w-6 h-6 border-2 border-indigo-300 border-t-indigo-600 rounded-full" />
              </div>
            }
          >
            <CategoryPicker
              selectionMode="any"
              confirmLabel="Filtruj"
              title="Filtruj wg kategorii"
              onSelect={onSelect}
              onCancel={onClose}
            />
          </React.Suspense>
        </PickerErrorBoundary>
      </div>
    </div>
  );
}

function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get("category"); // category id (string) | null
  const q = searchParams.get("q") ?? "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const offset = (page - 1) * LIMIT;

  const [products, setProducts] = useState<ProductOut[]>([]);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState(q);
  const [categoryName, setCategoryName] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Keep the input in sync when q changes from outside (back/forward, deep link).
  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  // Resolve the category id (from the URL) to a name for the filter chip.
  useEffect(() => {
    if (!category) {
      setCategoryName(null);
      return;
    }
    let cancelled = false;
    fetchCategory(Number(category))
      .then((c) => !cancelled && setCategoryName(c.name))
      .catch(() => !cancelled && setCategoryName(null));
    return () => {
      cancelled = true;
    };
  }, [category]);

  // The URL is the single source of truth — refetch whenever it changes.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchProducts(LIMIT, offset, q || undefined, category ? Number(category) : undefined)
      .then((data) => {
        if (!cancelled) {
          setProducts(data.items);
          setTotal(data.total);
        }
      })
      .catch((e) => console.error("Failed to load products:", e))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [q, category, offset]);

  // Mutate the filter/keyword and reset back to the first page.
  const setFilter = (mutate: (p: URLSearchParams) => void) => {
    const next = new URLSearchParams(searchParams);
    mutate(next);
    next.delete("page");
    setSearchParams(next);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilter((p) => {
      if (searchInput) p.set("q", searchInput);
      else p.delete("q");
    });
  };

  const handleCategorySelect = (selection: CategorySelection) => {
    setCategoryName(selection.name);
    setFilter((p) => p.set("category", String(selection.id)));
    setPickerOpen(false);
  };

  const clearCategoryFilter = () => {
    setFilter((p) => p.delete("category"));
  };

  const goToPage = (next: number) => {
    const params = new URLSearchParams(searchParams);
    if (next <= 1) params.delete("page");
    else params.set("page", String(next));
    setSearchParams(params);
  };

  // Loosely coupled with navigation: announce the selection and let whoever
  // owns routing (the shell) open the product card.
  const handleSelectProduct = (product: ProductOut) => {
    bus.emit("productSelected", { sku: product.sku });
  };

  const totalPages = Math.ceil(total / LIMIT);
  const currentPage = page;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">Produkty</h2>
        <p className="text-sm text-gray-500">
          {total} produkt{total !== 1 ? "ów" : ""} w bazie
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="flex gap-3 flex-1 min-w-[16rem]">
          <input
            type="text"
            placeholder="Szukaj po nazwie lub SKU..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <button
            type="submit"
            className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm"
          >
            Szukaj
          </button>
        </form>
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm text-gray-700"
        >
          Filtruj wg kategorii
        </button>
      </div>

      {category && (
        <div className="mb-4">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm">
            Kategoria: <span className="font-medium">{categoryName ?? `#${category}`}</span>
            <button
              onClick={clearCategoryFilter}
              className="text-indigo-400 hover:text-indigo-700 leading-none"
              aria-label="Wyczyść filtr kategorii"
            >
              ×
            </button>
          </span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-6 h-6 border-2 border-indigo-300 border-t-indigo-600 rounded-full" />
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Nazwa
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    GTIN
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-12 text-center text-gray-400">
                      Brak produktow.
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr
                      key={product.sku}
                      onClick={() => handleSelectProduct(product)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-mono text-gray-600">
                        {product.sku}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 font-medium">
                        {product.name}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-400">
                        {product.gtin}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-500">
                Strona {currentPage} z {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={offset === 0}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Poprzednia
                </button>
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={offset + LIMIT >= total}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Nastepna
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {pickerOpen && (
        <CategoryPickerModal
          onSelect={handleCategorySelect}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}

export default Products;
