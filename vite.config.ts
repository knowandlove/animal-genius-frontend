import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  assetsInclude: ['**/*.wasm'],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // React and related core libraries
          'react-vendor': ['react', 'react-dom', 'wouter'],
          // UI libraries
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-label', '@radix-ui/react-select', '@radix-ui/react-slot', '@radix-ui/react-tooltip', 'framer-motion'],
          // Data fetching and state management  
          'data-vendor': ['@tanstack/react-query', 'zod', 'react-hook-form'],
          // Utilities
          'utils-vendor': ['clsx', 'tailwind-merge', 'class-variance-authority', 'date-fns'],
          // Charts and visualization
          'chart-vendor': ['recharts'],
          // Icons
          'icon-vendor': ['lucide-react', 'react-icons'],
        },
      },
    },
    chunkSizeWarningLimit: 600, // Increase warning limit since we're splitting properly now
  },
  server: {
    port: 5173,
    open: true,
  },
});
