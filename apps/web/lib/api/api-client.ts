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

  /**
   * Centralized error handling
   */
  private async handleResponse<T>(
    response: Response,
    endpoint: string,
  ): Promise<T> {
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;

      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
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
      headers: this.defaultHeaders,
      signal: options?.signal,
    });

    return this.handleResponse<T>(response, endpoint);
  }

  /**
   * POST request
   */
  async post<T = unknown>(endpoint: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      method: "POST",
      headers: this.defaultHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    return this.handleResponse<T>(response, endpoint);
  }

  /**
   * PATCH request
   */
  async patch<T = unknown>(endpoint: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      method: "PATCH",
      headers: this.defaultHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    return this.handleResponse<T>(response, endpoint);
  }

  /**
   * DELETE request
   */
  async delete<T = unknown>(endpoint: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      method: "DELETE",
      headers: this.defaultHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.handleResponse<T>(response, endpoint);
  }
}

export const api = new APIClient();
