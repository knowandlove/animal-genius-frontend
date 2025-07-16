import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default defineConfig(({ mode }) => {
  // Load env files
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
  plugins: [
    react(),
    // Only add Sentry plugin in production builds
    process.env.NODE_ENV === 'production' && sentryVitePlugin({
      org: env.SENTRY_ORG,
      project: env.SENTRY_PROJECT,
      authToken: env.SENTRY_AUTH_TOKEN,
      sourcemaps: {
        include: ["./dist"],
        ignore: ["node_modules"],
        filesToDeleteAfterUpload: ["./dist/**/*.js.map"],
      },
      release: {
        name: process.env.VITE_APP_VERSION || `${Date.now()}`,
        setCommits: {
          auto: true,
        },
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@kalpro/shared-types": path.resolve(__dirname, "../shared-types/src"),
    },
  },
  assetsInclude: ['**/*.wasm'],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true, // Enable source maps for Sentry
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
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },
  };
});
