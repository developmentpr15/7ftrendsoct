/**
 * API Client Configuration
 * Centralized HTTP client for all API requests
 */

import { CONFIG } from '../../config/environment';

// API Response types
export class APIResponse {
  constructor(data = null, error = null, status = null) {
    this.data = data;
    this.error = error;
    this.status = status;
    this.success = !error && status >= 200 && status < 300;
  }
}

// HTTP Client class
class APIClient {
  constructor() {
    this.baseURL = CONFIG.BASE_URL;
    this.timeout = CONFIG.TIMEOUT;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  // Create fetch with timeout
  async fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Parse response
      let data;
      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      return new APIResponse(data, null, response.status);
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        return new APIResponse(
          null,
          { message: 'Request timeout', code: 'TIMEOUT' },
          null
        );
      }

      return new APIResponse(
        null,
        { message: error.message, code: 'NETWORK_ERROR' },
        null
      );
    }
  }

  // Get authentication headers
  getAuthHeaders() {
    // This would integrate with your auth store
    // For now, return empty object
    return {};
  }

  // Build full URL
  buildURL(endpoint) {
    return `${this.baseURL}${endpoint}`;
  }

  // HTTP Methods
  async get(endpoint, options = {}) {
    const url = this.buildURL(endpoint);
    const headers = {
      ...this.defaultHeaders,
      ...this.getAuthHeaders(),
      ...options.headers,
    };

    return this.fetchWithTimeout(url, {
      method: 'GET',
      headers,
      ...options,
    });
  }

  async post(endpoint, data = {}, options = {}) {
    const url = this.buildURL(endpoint);
    const headers = {
      ...this.defaultHeaders,
      ...this.getAuthHeaders(),
      ...options.headers,
    };

    return this.fetchWithTimeout(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
      ...options,
    });
  }

  async put(endpoint, data = {}, options = {}) {
    const url = this.buildURL(endpoint);
    const headers = {
      ...this.defaultHeaders,
      ...this.getAuthHeaders(),
      ...options.headers,
    };

    return this.fetchWithTimeout(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
      ...options,
    });
  }

  async patch(endpoint, data = {}, options = {}) {
    const url = this.buildURL(endpoint);
    const headers = {
      ...this.defaultHeaders,
      ...this.getAuthHeaders(),
      ...options.headers,
    };

    return this.fetchWithTimeout(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
      ...options,
    });
  }

  async delete(endpoint, options = {}) {
    const url = this.buildURL(endpoint);
    const headers = {
      ...this.defaultHeaders,
      ...this.getAuthHeaders(),
      ...options.headers,
    };

    return this.fetchWithTimeout(url, {
      method: 'DELETE',
      headers,
      ...options,
    });
  }

  // File upload method
  async upload(endpoint, file, options = {}) {
    const url = this.buildURL(endpoint);
    const formData = new FormData();

    // Add file to form data
    if (file) {
      formData.append('file', {
        uri: file.uri,
        type: file.type || 'image/jpeg',
        name: file.name || 'upload.jpg',
      });
    }

    // Add additional data
    if (options.data) {
      Object.keys(options.data).forEach(key => {
        formData.append(key, options.data[key]);
      });
    }

    const headers = {
      ...this.getAuthHeaders(),
      'Content-Type': 'multipart/form-data',
      ...options.headers,
    };

    return this.fetchWithTimeout(url, {
      method: 'POST',
      headers,
      body: formData,
    });
  }
}

// Create and export singleton instance
export const apiClient = new APIClient();

// Export convenience methods
export const api = {
  get: (endpoint, options) => apiClient.get(endpoint, options),
  post: (endpoint, data, options) => apiClient.post(endpoint, data, options),
  put: (endpoint, data, options) => apiClient.put(endpoint, data, options),
  patch: (endpoint, data, options) => apiClient.patch(endpoint, data, options),
  delete: (endpoint, options) => apiClient.delete(endpoint, options),
  upload: (endpoint, file, options) => apiClient.upload(endpoint, file, options),
};

export default api;