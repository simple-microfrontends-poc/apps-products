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
export declare function fetchProductById(id: number): Promise<ProductOut>;
//# sourceMappingURL=api.d.ts.map