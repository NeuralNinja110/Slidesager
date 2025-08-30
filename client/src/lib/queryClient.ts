import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let text: string;
    try {
      text = await res.text();
    } catch (e) {
      text = res.statusText || "Unknown error";
    }
    
    // Try to parse as JSON to get error message
    try {
      const errorData = JSON.parse(text);
      const message = errorData.error || errorData.message || text;
      throw new Error(`${res.status}: ${message}`);
    } catch (jsonError) {
      // If not JSON, use raw text
      throw new Error(`${res.status}: ${text || res.statusText}`);
    }
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    
    try {
      return await res.json();
    } catch (error) {
      console.error("JSON parsing error:", error);
      console.error("Response status:", res.status, res.statusText);
      throw new Error(`Invalid JSON response: ${error instanceof Error ? error.message : "Unknown parsing error"}`);
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
