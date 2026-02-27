import { API_BASE_URL } from "./config";
import { SecureStorage } from "./secureStorage";

/**
 * API client for making authenticated requests
 */
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  /**
   * Get the session token for authentication
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await SecureStorage.getSessionToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Make an HTTP request
   */
  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const authHeaders = await this.getAuthHeaders();

    const config: RequestInit = {
      ...options,
      headers: {
        ...authHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      // Handle unauthorized
      if (response.status === 401) {
        await SecureStorage.clearAll();
        throw new Error("Session expired. Please login again.");
      }

      // Handle errors
      if (!response.ok) {
        const error = await response.json().catch(() => ({
          error: "An error occurred",
        }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      // Parse JSON response
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return await response.json();
      }

      return {} as T;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Network error. Please check your connection.");
    }
  }

  /**
   * GET request
   */
  get<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: "GET", headers });
  }

  /**
   * POST request
   */
  post<T>(
    endpoint: string,
    body: object,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
      headers,
    });
  }

  /**
   * PUT request
   */
  put<T>(
    endpoint: string,
    body: object,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
      headers,
    });
  }

  /**
   * DELETE request
   */
  delete<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE", headers });
  }
}

// Export singleton instance
export const api = new ApiClient(API_BASE_URL);
