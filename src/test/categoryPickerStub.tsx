import React from "react";
import type {
  CategoryPickerProps,
  CategorySelection,
} from "categoryPicker/CategoryPicker";

// Stand-in for the Module Federation remote `categoryPicker/CategoryPicker`.
// It renders the title (so tests can assert the modal opened) and a button
// that confirms a fixed selection, exercising the host's onSelect wiring.
export const STUB_SELECTION: CategorySelection = {
  id: 5,
  name: "Książki",
  path: [{ id: 5, name: "Książki" }],
};

export default function CategoryPickerStub({
  categoryId,
  onSelect,
  onCancel,
  title,
  confirmLabel,
}: CategoryPickerProps) {
  return (
    <div data-testid="category-picker-stub">
      {title && <h3>{title}</h3>}
      <span>cat:{categoryId}</span>
      <button type="button" onClick={() => onSelect(STUB_SELECTION)}>
        {confirmLabel ?? "Wybierz"}
      </button>
      {onCancel && (
        <button type="button" onClick={onCancel}>
          stub-cancel
        </button>
      )}
    </div>
  );
}
