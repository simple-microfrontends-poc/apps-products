import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      // The CategoryPicker is a Module Federation remote, unavailable under test.
      // Point it at a local stub so React.lazy() can resolve it.
      "categoryPicker/CategoryPicker": fileURLToPath(
        new URL("./src/test/categoryPickerStub.tsx", import.meta.url),
      ),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
});
