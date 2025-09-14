import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./vitest.setup.ts",
    include: ["src/**/*.{test,spec}.{ts,tsx}", "convex/**/*.{test,spec}.{ts,tsx}"],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/cypress/**",
      "**/.{idea,git,cache,output,temp}/**",
      "**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*",
      "convex/stagingJobs.test.ts",
      "src/components/BatchProcessor.test.tsx",
      "src/components/ImageReviewSystem.test.tsx",
      "src/components/ImageApprovalWorkflow.test.tsx",
      "src/components/ImageComparisonSlider.test.tsx",
      "convex/lib/gemini.test.ts"
    ]
  }
});