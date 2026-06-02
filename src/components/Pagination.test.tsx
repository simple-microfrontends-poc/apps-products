import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Pagination from "./Pagination";

const noop = () => {};

describe("Pagination", () => {
  it("renders nothing when there is a single page", () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} onPrev={noop} onNext={noop} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the page info", () => {
    render(<Pagination currentPage={2} totalPages={3} onPrev={noop} onNext={noop} />);
    expect(screen.getByText("Strona 2 z 3")).toBeInTheDocument();
  });

  it("disables Previous on the first page", () => {
    render(<Pagination currentPage={1} totalPages={3} onPrev={noop} onNext={noop} />);
    expect(screen.getByRole("button", { name: "Poprzednia" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Nastepna" })).toBeEnabled();
  });

  it("disables Next on the last page", () => {
    render(<Pagination currentPage={3} totalPages={3} onPrev={noop} onNext={noop} />);
    expect(screen.getByRole("button", { name: "Nastepna" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Poprzednia" })).toBeEnabled();
  });

  it("calls onPrev / onNext when the buttons are clicked", async () => {
    const onPrev = vi.fn();
    const onNext = vi.fn();
    const user = userEvent.setup();
    render(
      <Pagination currentPage={2} totalPages={3} onPrev={onPrev} onNext={onNext} />,
    );

    await user.click(screen.getByRole("button", { name: "Poprzednia" }));
    await user.click(screen.getByRole("button", { name: "Nastepna" }));

    expect(onPrev).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledTimes(1);
  });
});
