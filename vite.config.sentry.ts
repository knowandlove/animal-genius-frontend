import { sentryVitePlugin } from "@sentry/vite-plugin";
import { defineConfig } from 'vite';

// This extends your main vite.config.ts with Sentry source map upload
export default defineConfig({
  build: {
    sourcemap: true, // Enable source map generation
  },
  plugins: [
    // Put other plugins here first
    sentryVitePlugin({
      org: "your-sentry-org", // Replace with your Sentry org slug
      project: "animal-genius-frontend", // Replace with your project name
      
      // Auth token for uploading (set as env variable for security)
      authToken: process.env.SENTRY_AUTH_TOKEN,
      
      // Automatically upload source maps when building
      sourcemaps: {
        // Upload source maps for all JavaScript files
        include: ["./dist"],
        // Don't upload node_modules source maps
        ignore: ["node_modules"],
        // Delete source maps after uploading (keeps them out of production)
        filesToDeleteAfterUpload: ["./dist/**/*.js.map"],
      },
      
      // Release configuration
      release: {
        // Use the same release name as in your Sentry.init
        name: process.env.VITE_APP_VERSION || "development",
        // Automatically set commits
        setCommits: {
          auto: true,
        },
      },
    }),
  ],
});