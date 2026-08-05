const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Custom API client fetch wrapper handling base URL, default headers, and JSON error responses.
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    
    // Parse response content if present
    const contentType = response.headers.get('content-type');
    let data = null;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const errorMessage = typeof data === 'object' && data?.detail
        ? (typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail))
        : `Request failed with status ${response.status}`;
      
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      const connError = new Error(`Cannot connect to backend server at ${API_BASE_URL}. Ensure backend is running.`);
      connError.status = 0;
      throw connError;
    }
    throw error;
  }
}
