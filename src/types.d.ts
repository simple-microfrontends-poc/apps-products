declare module "categoryPicker/CategoryPicker" {
  import type React from "react";

  export interface CategoryRef {
    id: number;
    name: string;
  }

  export interface CategorySelection {
    id: number;
    name: string;
    path: CategoryRef[];
  }

  export interface CategoryPickerProps {
    onSelect: (selection: CategorySelection) => void;
    onCancel?: () => void;
    selectionMode?: "leaf" | "any";
    confirmLabel?: string;
    title?: string;
  }

  const CategoryPicker: React.ComponentType<CategoryPickerProps>;
  export default CategoryPicker;
}
