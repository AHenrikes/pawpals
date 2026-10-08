/**
 * Centralized API Client
 * Handles: authentication, error handling, retry logic, headers
 * Usage: import { api } from "@/lib/api/api-client"; api.get<T>(endpoint)
 */

interface ApiError {
  message: string;
  status: number;
  endpoint: string;
}

class APIClient {
  private readonly baseUrl: string;
  private readonly defaultHeaders: HeadersInit;

  constructor() {
    this.baseUrl =
      globalThis.window === undefined ? "" : globalThis.window.location.origin;
    this.defaultHeaders = {
      "Content-Type": "application/json",
    };
  }

  private getHeaders(): HeadersInit {
    if (globalThis.window === undefined) return this.defaultHeaders;
    const actingFursonaId = globalThis.window.localStorage.getItem(
      "pawpals:acting-fursona-id",
    );
    return actingFursonaId
      ? { ...this.defaultHeaders, "x-acting-fursona-id": actingFursonaId }
      : this.defaultHeaders;
  }

  setActingFursona(fursonaId: string | null) {
    if (globalThis.window === undefined) return;
    if (fursonaId) {
      globalThis.window.localStorage.setItem(
        "pawpals:acting-fursona-id",
        fursonaId,
      );
    } else {
      globalThis.window.localStorage.removeItem("pawpals:acting-fursona-id");
    }
  }

  getActingFursona(): string | null {
    if (globalThis.window === undefined) return null;
    return globalThis.window.localStorage.getItem("pawpals:acting-fursona-id");
  }

  /**
   * Centralized error handling with sanitization
   */
  private async handleResponse<T>(
    response: Response,
    endpoint: string,
  ): Promise<T> {
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;

      try {
        const errorData = await response.json();
        // Sanitize error messages to prevent exposing sensitive information
        if (response.status === 500) {
          errorMessage = "Server error occurred. Please try again later.";
        } else {
          errorMessage = errorData.message || errorData.error || errorMessage;
        }
      } catch {
        errorMessage = response.statusText || errorMessage;
      }

      const error: ApiError = {
        message: errorMessage,
        status: response.status,
        endpoint,
      };

      throw error;
    }

    try {
      const data = await response.json();
      return data as T;
    } catch {
      const error = new Error("Failed to parse response") as Error & ApiError;
      error.status = response.status;
      error.endpoint = endpoint;
      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T = unknown>(
    endpoint: string,
    options?: { signal?: AbortSignal },
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(),
      signal: options?.signal,
    });

    return this.handleResponse<T>(response, endpoint);
  }

  /**
   * Unified request method for POST, PATCH, DELETE
   */
  private async request<T = unknown>(
    method: "POST" | "PATCH" | "DELETE",
    endpoint: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      method,
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });

    return this.handleResponse<T>(response, endpoint);
  }

  /**
   * POST request
   */
  async post<T = unknown>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>("POST", endpoint, body);
  }

  /**
   * PATCH request
   */
  async patch<T = unknown>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>("PATCH", endpoint, body);
  }

  /**
   * DELETE request
   */
  async delete<T = unknown>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>("DELETE", endpoint, body);
  }
}

export const api = new APIClient();
