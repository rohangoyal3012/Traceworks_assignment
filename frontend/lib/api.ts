const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
}

export class ApiClient {
  private static getHeaders(token?: string): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  }

  static async request<T>(
    endpoint: string,
    options: RequestInit = {},
    token?: string
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: this.getHeaders(token),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.message || "Something went wrong",
        };
      }

      return { data };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  static async post<T>(
    endpoint: string,
    body: any,
    token?: string
  ): Promise<ApiResponse<T>> {
    return this.request<T>(
      endpoint,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
      token
    );
  }

  static async get<T>(
    endpoint: string,
    token?: string
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "GET" }, token);
  }
}
