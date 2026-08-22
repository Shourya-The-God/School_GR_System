/**
 * Centralized API client for standard fetch() communication
 */

const API_BASE = '/api';

export const showToast = (message, type = 'info') => {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerText = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
};

export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('gr_auth_token');
  
  const defaultHeaders = {
    'Accept': 'application/json'
  };

  // Only set Content-Type to application/json if not uploading FormData
  if (!(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers
    }
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);

    // Handle 401 Unauthorized (session expired)
    if (response.status === 401) {
      if (!window.location.pathname.includes('login.html')) {
        localStorage.removeItem('gr_auth_token');
        localStorage.removeItem('gr_user');
        window.location.href = '/login.html';
      }
    }

    // Handle non-JSON responses (e.g. CSV downloads or binary streams)
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/csv') || contentType.includes('application/octet-stream') || contentType.includes('application/pdf')) {
      if (!response.ok) throw new Error('Failed to download file.');
      return await response.blob();
    }

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.message || `Request failed with status ${response.status}`;
      showToast(errorMsg, 'error');
      throw new Error(errorMsg);
    }

    return data;
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err);
    throw err;
  }
};
