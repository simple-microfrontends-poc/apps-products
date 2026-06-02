import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchProducts, fetchCategoryPath } from "./api";

const API_BASE = "http://localhost:8000";

function mockFetchOnce(body: unknown, init?: Partial<Response>) {
  const res = {
    ok: init?.ok ?? true,
    status: init?.status ?? 200,
    statusText: init?.statusText ?? "OK",
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
  return vi.fn().mockResolvedValue(res);
}

/** Pull the URL string the fetch mock was called with. */
function calledUrl(): string {
  return (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
}

describe("fetchProducts", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.unstubAllGlobals());

  it("always sends limit and offset", async () => {
    vi.stubGlobal("fetch", mockFetchOnce({ items: [], total: 0 }));

    await fetchProducts(20, 40);

    const url = new URL(calledUrl());
    expect(url.origin + url.pathname).toBe(`${API_BASE}/products`);
    expect(url.searchParams.get("limit")).toBe("20");
    expect(url.searchParams.get("offset")).toBe("40");
    expect(url.searchParams.has("search")).toBe(false);
    expect(url.searchParams.has("category")).toBe(false);
  });

  it("uses the default limit/offset when omitted", async () => {
    vi.stubGlobal("fetch", mockFetchOnce({ items: [], total: 0 }));

    await fetchProducts();

    const url = new URL(calledUrl());
    expect(url.searchParams.get("limit")).toBe("20");
    expect(url.searchParams.get("offset")).toBe("0");
  });

  it("includes search and category only when provided", async () => {
    vi.stubGlobal("fetch", mockFetchOnce({ items: [], total: 0 }));

    await fetchProducts(10, 0, "widget", 7);

    const url = new URL(calledUrl());
    expect(url.searchParams.get("search")).toBe("widget");
    expect(url.searchParams.get("category")).toBe("7");
  });

  it("includes category 0 (falsy id) because the guard is != null", async () => {
    vi.stubGlobal("fetch", mockFetchOnce({ items: [], total: 0 }));

    await fetchProducts(10, 0, undefined, 0);

    const url = new URL(calledUrl());
    expect(url.searchParams.get("category")).toBe("0");
  });

  it("returns the parsed body", async () => {
    const body = { items: [{ sku: "A1" }], total: 1, limit: 20, offset: 0 };
    vi.stubGlobal("fetch", mockFetchOnce(body));

    await expect(fetchProducts()).resolves.toEqual(body);
  });

  it("throws on a non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetchOnce(null, { ok: false, status: 503, statusText: "Unavailable" }),
    );

    await expect(fetchProducts()).rejects.toThrow("HTTP 503: Unavailable");
  });
});

describe("fetchCategoryPath", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.unstubAllGlobals());

  it("GETs /categories/:id/paths and returns the parsed breadcrumb", async () => {
    const body = [
      { id: 1, name: "Elektronika" },
      { id: 11, name: "Smartfony i akcesoria" },
    ];
    vi.stubGlobal("fetch", mockFetchOnce(body));

    const result = await fetchCategoryPath(7);

    expect(fetch).toHaveBeenCalledWith(`${API_BASE}/categories/7/paths`);
    expect(result).toEqual(body);
  });

  it("throws on a non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetchOnce(null, { ok: false, status: 404, statusText: "Not Found" }),
    );

    await expect(fetchCategoryPath(99)).rejects.toThrow("HTTP 404: Not Found");
  });
});
