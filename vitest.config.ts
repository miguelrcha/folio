import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// The @vitejs/plugin-react transform is enough to test React components and the
// pure `lib/` helpers. We don't run tests through Next/Turbopack — Vitest bundles
// with Vite, so anything that needs Next's runtime (server components, route
// handlers) is out of scope here; unit-test the extracted logic instead.
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Mirror the "@/*" alias from tsconfig.json so imports resolve the same way.
    alias: { "@": resolve(__dirname, ".") },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    // Only pick up files that opt in with `.test`/`.spec`, so route/page files
    // named `*.ts` are never mistaken for tests.
    include: ["**/*.{test,spec}.{ts,tsx}"],
  },
});
