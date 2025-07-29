import { toast } from "@/hooks/use-toast";

// Global flag to prevent multiple toasts
let hasShownExpiryToast = false;

export function showSessionExpiryToast() {
  if (!hasShownExpiryToast) {
    hasShownExpiryToast = true;
    toast({
      title: "Session Expired",
      description: "Your session has expired. Please log in again.",
      variant: "destructive",
    });
    
    // Reset the flag after a delay to allow future toasts
    setTimeout(() => {
      hasShownExpiryToast = false;
    }, 10000);
  }
}