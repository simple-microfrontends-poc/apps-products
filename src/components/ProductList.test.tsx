import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ProductOut } from "../lib/api";

vi.mock("../lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/api")>();
  return { ...actual, fetchProducts: vi.fn(), fetchCategoryPath: vi.fn() };
});

import Products from "./ProductList";
import { fetchProducts, fetchCategoryPath } from "../lib/api";
import { bus } from "@admin/event-bus";

const mockFetchProducts = vi.mocked(fetchProducts);
const mockCategoryPath = vi.mocked(fetchCategoryPath);

function product(id: number, sku: string, name: string, gtin = "0000"): ProductOut {
  return {
    id,
    sku,
    name,
    gtin,
    images: [],
    description: "",
    category: "",
    attributes: [],
  };
}

const SAMPLE = [product(1, "A1", "Widget", "111"), product(2, "B2", "Gadget", "222")];

function renderAt(path = "/", items = SAMPLE, total = items.length) {
  mockFetchProducts.mockResolvedValue({ items, total, limit: 20, offset: 0 });
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Products />
    </MemoryRouter>,
  );
}

/** Args of the most recent fetchProducts call: [limit, offset, search, category]. */
function lastProductsCall() {
  const calls = mockFetchProducts.mock.calls;
  return calls[calls.length - 1];
}

beforeEach(() => {
  mockFetchProducts.mockReset();
  mockCategoryPath.mockReset();
  mockCategoryPath.mockResolvedValue([]);
});

describe("Products — rendering", () => {
  it("renders the product rows and the total count after loading", async () => {
    renderAt("/", SAMPLE, 2);

    expect(await screen.findByText("Widget")).toBeInTheDocument();
    expect(screen.getByText("Gadget")).toBeInTheDocument();
    expect(screen.getByText("A1")).toBeInTheDocument();
    expect(screen.getByText("2 produktów w bazie")).toBeInTheDocument();
  });

  it("shows the empty state when there are no products", async () => {
    renderAt("/", [], 0);

    expect(await screen.findByText("Brak produktow.")).toBeInTheDocument();
  });

  it("shows a spinner while the fetch is pending", async () => {
    let resolve!: (v: { items: ProductOut[]; total: number; limit: number; offset: number }) => void;
    mockFetchProducts.mockReturnValue(new Promise((r) => (resolve = r)));

    const { container } = render(
      <MemoryRouter initialEntries={["/"]}>
        <Products />
      </MemoryRouter>,
    );

    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
    resolve({ items: SAMPLE, total: 2, limit: 20, offset: 0 });
    expect(await screen.findByText("Widget")).toBeInTheDocument();
  });
});

describe("Products — fetch parameters from the URL", () => {
  it("passes the search term and category id from the query string", async () => {
    renderAt("/?q=widget&category=7", SAMPLE, 2);

    await screen.findByText("Widget");
    expect(lastProductsCall()).toEqual([20, 0, "widget", 7]);
  });

  it("computes the offset from the page number", async () => {
    renderAt("/?page=3", SAMPLE, 100);

    await screen.findByText("Widget");
    // page 3 -> offset (3-1) * 20 = 40
    expect(lastProductsCall()).toEqual([20, 40, undefined, undefined]);
  });
});

describe("Products — search", () => {
  it("submitting the search form refetches with the typed term", async () => {
    const user = userEvent.setup();
    renderAt("/", SAMPLE, 2);
    await screen.findByText("Widget");

    await user.type(
      screen.getByPlaceholderText("Szukaj po nazwie lub SKU..."),
      "gadget",
    );
    await user.click(screen.getByRole("button", { name: "Szukaj" }));

    await waitFor(() => expect(lastProductsCall()[2]).toBe("gadget"));
  });
});

describe("Products — category filter breadcrumb", () => {
  const PATH_7 = [
    { id: 1, name: "Elektronika" },
    { id: 11, name: "Smartfony i akcesoria" },
    { id: 7, name: "Etui" },
  ];

  it("renders the active category as a breadcrumb resolved from its id", async () => {
    mockCategoryPath.mockResolvedValue(PATH_7);
    renderAt("/?category=7", SAMPLE, 2);

    expect(await screen.findByText("Elektronika")).toBeInTheDocument();
    expect(screen.getByText("Smartfony i akcesoria")).toBeInTheDocument();
    expect(screen.getByText("Etui")).toBeInTheDocument();
    expect(mockCategoryPath).toHaveBeenCalledWith(7);
  });

  it("falls back to #id when the path cannot be resolved", async () => {
    mockCategoryPath.mockRejectedValue(new Error("nope"));
    renderAt("/?category=7", SAMPLE, 2);

    expect(await screen.findByText("#7")).toBeInTheDocument();
  });

  it("clicking a breadcrumb crumb switches the filter to that category", async () => {
    mockCategoryPath.mockResolvedValue(PATH_7);
    const user = userEvent.setup();
    renderAt("/?category=7", SAMPLE, 2);
    await screen.findByText("Elektronika");

    await user.click(screen.getByRole("button", { name: "Elektronika" }));

    // Refetches products filtered by the clicked crumb's id (1).
    await waitFor(() => expect(lastProductsCall()[3]).toBe(1));
  });

  it("clearing the breadcrumb removes the category from the fetch", async () => {
    mockCategoryPath.mockResolvedValue(PATH_7);
    const user = userEvent.setup();
    renderAt("/?category=7", SAMPLE, 2);
    await screen.findByText("Elektronika");

    await user.click(screen.getByLabelText("Wyczyść filtr kategorii"));

    await waitFor(() => expect(lastProductsCall()[3]).toBeUndefined());
  });
});

describe("Products — pagination", () => {
  it("shows page info and disables Previous on the first page", async () => {
    renderAt("/", SAMPLE, 45); // 45 / 20 -> 3 pages
    await screen.findByText("Widget");

    // Pagination is rendered both above and below the table.
    expect(screen.getAllByText("Strona 1 z 3")).toHaveLength(2);
    screen
      .getAllByRole("button", { name: "Poprzednia" })
      .forEach((btn) => expect(btn).toBeDisabled());
    screen
      .getAllByRole("button", { name: "Nastepna" })
      .forEach((btn) => expect(btn).toBeEnabled());
  });

  it("does not render pagination when everything fits on one page", async () => {
    renderAt("/", SAMPLE, 2);
    await screen.findByText("Widget");

    expect(screen.queryByText(/Strona \d+ z/)).not.toBeInTheDocument();
  });

  it("clicking Next refetches the following page's offset", async () => {
    const user = userEvent.setup();
    renderAt("/", SAMPLE, 45);
    await screen.findByText("Widget");

    await user.click(screen.getAllByRole("button", { name: "Nastepna" })[0]);

    await waitFor(() => expect(lastProductsCall()[1]).toBe(20));
  });
});

describe("Products — event bus", () => {
  it("emits productSelected with the id when a row is clicked", async () => {
    const emit = vi.spyOn(bus, "emit");
    const user = userEvent.setup();
    renderAt("/", SAMPLE, 2);

    await user.click(await screen.findByText("Widget"));

    expect(emit).toHaveBeenCalledWith("productSelected", { id: 1 });
  });
});

describe("Products — category picker (federated remote, stubbed)", () => {
  it("opens the picker and applies the chosen category as a filter", async () => {
    // Once category=5 lands in the URL, the breadcrumb effect re-resolves it;
    // make that match the picked path so it isn't overwritten.
    mockCategoryPath.mockResolvedValue([{ id: 5, name: "Książki" }]);
    const user = userEvent.setup();
    renderAt("/", SAMPLE, 2);
    await screen.findByText("Widget");

    await user.click(screen.getByRole("button", { name: "Filtruj wg kategorii" }));

    // Stub renders the title and a confirm button labelled by confirmLabel="Filtruj".
    const picker = await screen.findByTestId("category-picker-stub");
    expect(within(picker).getByText("Filtruj wg kategorii")).toBeInTheDocument();

    await user.click(within(picker).getByRole("button", { name: "Filtruj" }));

    // STUB_SELECTION = { id: 5, name: "Książki" }
    expect(await screen.findByText("Książki")).toBeInTheDocument();
    await waitFor(() => expect(lastProductsCall()[3]).toBe(5));
  });

  it("opens the picker pre-navigated to the active category filter", async () => {
    const user = userEvent.setup();
    renderAt("/?category=7", SAMPLE, 2);
    await screen.findByText("Widget");

    await user.click(screen.getByRole("button", { name: "Filtruj wg kategorii" }));
    const picker = await screen.findByTestId("category-picker-stub");

    expect(within(picker).getByText("cat:7")).toBeInTheDocument();
  });

  it("closes the picker on Escape", async () => {
    const user = userEvent.setup();
    renderAt("/", SAMPLE, 2);
    await screen.findByText("Widget");

    await user.click(screen.getByRole("button", { name: "Filtruj wg kategorii" }));
    expect(await screen.findByTestId("category-picker-stub")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByTestId("category-picker-stub")).not.toBeInTheDocument();
  });
});
