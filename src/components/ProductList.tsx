import React, { useState, useEffect, useCallback } from "react";
import type {
  CategorySelection,
  CategoryPickerProps,
} from "categoryPicker/CategoryPicker";
import {
  fetchProducts,
  ProductOut,
  ProductList as ProductListData,
} from "../lib/api";

type View = "list" | "detail";

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
  const [products, setProducts] = useState<ProductOut[]>([]);
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductOut | null>(null);
  const [view, setView] = useState<View>("list");

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data: ProductListData = await fetchProducts(
        limit,
        offset,
        appliedSearch || undefined,
        categoryFilter?.id
      );
      setProducts(data.items);
      setTotal(data.total);
    } catch (e) {
      console.error("Failed to load products:", e);
    } finally {
      setLoading(false);
    }
  }, [limit, offset, appliedSearch, categoryFilter]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setOffset(0);
    setAppliedSearch(search);
  };

  const handlePageChange = (newOffset: number) => {
    setOffset(newOffset);
  };

  const handleCategorySelect = (selection: CategorySelection) => {
    setCategoryFilter({ id: selection.id, name: selection.name });
    setOffset(0);
    setPickerOpen(false);
  };

  const clearCategoryFilter = () => {
    setCategoryFilter(null);
    setOffset(0);
  };

  const handleSelectProduct = (product: ProductOut) => {
    setSelectedProduct(product);
    setView("detail");
  };

  const handleBackToList = () => {
    setView("list");
    setSelectedProduct(null);
  };

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  if (view === "detail" && selectedProduct) {
    return (
      <ProductDetail
        product={selectedProduct}
        onBack={handleBackToList}
      />
    );
  }

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
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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

      {categoryFilter && (
        <div className="mb-4">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm">
            Kategoria: <span className="font-medium">{categoryFilter.name}</span>
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
                    Kategoria
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    GTIN
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-gray-400">
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
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {product.category}
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
                  onClick={() => handlePageChange(offset - limit)}
                  disabled={offset === 0}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Poprzednia
                </button>
                <button
                  onClick={() => handlePageChange(offset + limit)}
                  disabled={offset + limit >= total}
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

function ProductDetail({
  product,
  onBack,
}: {
  product: ProductOut;
  onBack: () => void;
}) {
  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
      >
        &larr; Powrot do listy
      </button>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-1">{product.name}</h2>
        <div className="flex gap-4 mb-4 text-sm">
          <span className="text-gray-500">SKU: <span className="font-mono text-gray-700">{product.sku}</span></span>
          <span className="text-gray-500">GTIN: <span className="font-mono text-gray-700">{product.gtin}</span></span>
          <span className="text-gray-500">Kategoria: <span className="text-gray-700">{product.category}</span></span>
        </div>

        <p className="text-gray-600 text-sm mb-4">{product.description}</p>

        {product.images.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Zdjecia</h3>
            <div className="flex gap-2">
              {product.images.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt=""
                  className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                />
              ))}
            </div>
          </div>
        )}

        {product.attributes.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Atrybuty</h3>
            <div className="grid grid-cols-2 gap-2">
              {product.attributes.map((attr, i) => (
                <div
                  key={i}
                  className="flex justify-between px-3 py-2 bg-gray-50 rounded text-sm"
                >
                  <span className="text-gray-500">{attr.name}</span>
                  <span className="text-gray-800 font-medium">{attr.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Products;
