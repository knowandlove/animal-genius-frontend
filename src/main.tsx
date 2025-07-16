import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./App";
import ErrorBoundary from "./components/error-boundary";
import "./index.css";
import "@/styles/patterns.css";

// Initialize Sentry
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN, // We'll use env variable for security
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      // Mask all text content for privacy
      maskAllText: true,
      maskAllInputs: true,
      // Only record 10% of sessions to save quota
      sessionSampleRate: 0.1,
      // Record 100% of sessions with errors
      errorSampleRate: 1.0,
    }),
  ],
  // Performance Monitoring
  tracesSampleRate: 0.1, // 10% of transactions
  // Release tracking
  release: import.meta.env.VITE_APP_VERSION || "development",
  environment: import.meta.env.VITE_APP_ENV || "development",
  
  // Additional recommended settings
  normalizeDepth: 5, // Limit depth of context data
  attachStacktrace: true, // Always attach stack traces
  autoSessionTracking: true, // Track user sessions
  
  // Ignore specific errors
  ignoreErrors: [
    // Browser extensions
    'top.GLOBALS',
    // Random network errors
    'Network request failed',
    'NetworkError',
    'Failed to fetch',
    // Ignore benign browser errors
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
  ],
  
  // Filter transactions
  beforeTransaction(event) {
    // Don't send transactions for health checks
    if (event.transaction === '/health' || event.transaction === '/api/health') {
      return null;
    }
    return event;
  },
  
  // Privacy settings for student data
  beforeSend(event, hint) {
    // Remove sensitive data
    if (event.user) {
      // Only keep anonymous ID, remove email/name
      event.user = { id: event.user.id };
    }
    
    // Scrub passport codes from URLs
    if (event.request?.url) {
      event.request.url = event.request.url.replace(/[A-Z]{3}-[A-Z0-9]{3}/g, '[PASSPORT]');
    }
    
    // Remove student names from breadcrumbs
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
        if (breadcrumb.message) {
          breadcrumb.message = breadcrumb.message.replace(/[A-Z]{3}-[A-Z0-9]{3}/g, '[PASSPORT]');
        }
        return breadcrumb;
      });
    }
    
    return event;
  },
});

// Force mint gradient background immediately
document.documentElement.style.background = 'linear-gradient(135deg, #d3f2ed 0%, #e8f7f3 40%, #f0faf7 100%)';
document.body.style.background = 'linear-gradient(135deg, #d3f2ed 0%, #e8f7f3 40%, #f0faf7 100%)';
document.body.style.backgroundAttachment = 'fixed';

createRoot(document.getElementById("root")!).render(
  <Sentry.ErrorBoundary fallback={ErrorBoundary} showDialog>
    <App />
  </Sentry.ErrorBoundary>
);
