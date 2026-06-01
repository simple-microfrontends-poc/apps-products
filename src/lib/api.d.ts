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
export declare function fetchProducts(limit?: number, offset?: number, search?: string, category?: number): Promise<ProductList>;
export interface Category {
    id: number;
    name: string;
}
/** Resolve a category id to its name — used to label the active filter chip
 *  when the filter comes from the URL (deep link) and the name isn't known. */
export declare function fetchCategory(id: number): Promise<Category>;
//# sourceMappingURL=api.d.ts.map