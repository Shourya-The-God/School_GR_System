import { apiRequest, showToast } from './api.js';

export const initAuth = async () => {
  const isLoginPage = window.location.pathname.includes('login.html');
  const token = localStorage.getItem('gr_auth_token');

  if (!token && !isLoginPage) {
    window.location.href = '/login.html';
    return null;
  }

  if (token && isLoginPage) {
    window.location.href = '/dashboard.html';
    return null;
  }

  if (token) {
    try {
      const res = await apiRequest('/auth/me');
      if (res && res.data && res.data.user) {
        localStorage.setItem('gr_user', JSON.stringify(res.data.user));
        renderSidebarUser(res.data.user);
        return res.data.user;
      }
    } catch (err) {
      console.warn('Session verification failed:', err);
    }
  }

  return null;
};

export const login = async (username, password) => {
  try {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });

    if (res && res.data && res.data.token) {
      localStorage.setItem('gr_auth_token', res.data.token);
      localStorage.setItem('gr_user', JSON.stringify(res.data.user));
      showToast('Login successful! Redirecting...', 'success');
      setTimeout(() => {
        window.location.href = '/dashboard.html';
      }, 500);
    }
  } catch (err) {
    // Handled in api.js showToast
  }
};

export const logout = async () => {
  try {
    await apiRequest('/auth/logout', { method: 'POST' });
  } catch (err) {
    // Ignore error on logout
  } finally {
    localStorage.removeItem('gr_auth_token');
    localStorage.removeItem('gr_user');
    window.location.href = '/login.html';
  }
};

function renderSidebarUser(user) {
  const userNameEl = document.getElementById('current-user-name');
  const userRoleEl = document.getElementById('current-user-role');
  if (userNameEl) userNameEl.innerText = user.fullName || user.username;
  if (userRoleEl) userRoleEl.innerText = user.role?.name || 'Staff';

  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  }
}
