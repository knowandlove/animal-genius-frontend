import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { api } from "@/config/api";

async function refreshAuthToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) {
    return null;
  }

  try {
    const response = await fetch(api("/api/auth/refresh-token"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("refreshToken", data.refreshToken);
      return data.token;
    }
  } catch (error) {
    console.error("Token refresh failed:", error);
  }

  return null;
}

async function throwIfResNotOk(res: Response, originalUrl?: string, originalOptions?: RequestInit): Promise<Response | void> {
  if (!res.ok) {
    let errorMessage = res.statusText;
    let errorDetails: any = {};
    try {
      const jsonResponse = await res.json();
      errorMessage = jsonResponse.message || res.statusText;
      errorDetails = jsonResponse;
      
      // Check if this is a student endpoint
      const isStudentEndpoint = originalUrl && (
        originalUrl.includes('/api/room/') ||
        originalUrl.includes('/api/room-page-data/') ||
        originalUrl.includes('/api/store/catalog')
      );
      
      // Check if we have a token (meaning we're a teacher trying to access a student endpoint)
      const hasToken = !!localStorage.getItem("authToken");
      
      // Handle token expiration by attempting refresh (but not for unauthenticated student access)
      if ((res.status === 401 || res.status === 403) && errorMessage.includes("token") && hasToken && !isStudentEndpoint) {
        const newToken = await refreshAuthToken();
        
        if (newToken && originalUrl) {
          // Retry the original request with the new token
          const retryOptions = {
            ...originalOptions,
            headers: {
              ...originalOptions?.headers,
              "Authorization": `Bearer ${newToken}`,
            },
          };
          
          const retryResponse = await fetch(originalUrl, retryOptions);
          
          if (retryResponse.ok) {
            return retryResponse; // Return successful retry response
          }
        }
        
        // If refresh failed or retry failed, clear auth and redirect
        if (process.env.NODE_ENV === 'development') {
          console.log('Token refresh failed, clearing authentication and redirecting to login');
        }
        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        // Small delay to ensure localStorage is cleared before redirect
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      }
    } catch (e) {
      try {
        const text = await res.text();
        errorMessage = text || res.statusText;
      } catch (e2) {
        // Use default statusText if all parsing fails
      }
    }
    
    // Create an error with status code
    const error: any = new Error(errorMessage);
    error.status = res.status;
    error.details = errorDetails;
    throw error;
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options?: {
    headers?: Record<string, string>;
  }
): Promise<any> {
  const token = localStorage.getItem("authToken");
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[AUTH DEBUG] Request to:', url);
    console.log('[AUTH DEBUG] Has token:', !!token);
  }
  
  const headers: Record<string, string> = {
    ...(options?.headers || {})
  };
  if (data && !(data instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  
  // Always add auth header if we have a token - this allows teachers to access student rooms
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
    if (process.env.NODE_ENV === 'development') {
      console.log('[AUTH DEBUG] Adding auth header');
    }
  } else {
    if (process.env.NODE_ENV === 'development') {
      console.log('[AUTH DEBUG] No token available');
    }
  }

  const requestOptions = {
    method,
    headers,
    body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined),
    credentials: "include" as RequestCredentials,
  };

  const res = await fetch(api(url), requestOptions);

  const retryResponse = await throwIfResNotOk(res, api(url), requestOptions);
  const finalResponse = retryResponse || res;
  
  // Handle empty responses (like 204 No Content)
  const contentType = finalResponse.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return {};
  }
  
  const text = await finalResponse.text();
  return text ? JSON.parse(text) : {};
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const token = localStorage.getItem("authToken");
    const url = queryKey[0] as string;
    
    const headers: Record<string, string> = {};
    
    // Always add auth header if we have a token - this allows teachers to access student rooms
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const requestOptions = {
      headers,
      credentials: "include" as RequestCredentials,
    };

    const res = await fetch(api(url), requestOptions);

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    const retryResponse = await throwIfResNotOk(res, api(url), requestOptions);
    const finalResponse = retryResponse || res;
    return await finalResponse.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
    mutations: {
      retry: false,
    },
  },
});
