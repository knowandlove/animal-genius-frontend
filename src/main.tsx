import { createRoot } from "react-dom/client";
import App from "./App";
import ErrorBoundary from "./components/error-boundary";
import "./index.css";

// Force mint gradient background immediately
document.documentElement.style.background = 'linear-gradient(135deg, #d3f2ed 0%, #e8f7f3 40%, #f0faf7 100%)';
document.body.style.background = 'linear-gradient(135deg, #d3f2ed 0%, #e8f7f3 40%, #f0faf7 100%)';
document.body.style.backgroundAttachment = 'fixed';

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
