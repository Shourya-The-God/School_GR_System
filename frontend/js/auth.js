import { apiRequest, showToast } from './api.js';

export const initAuth = async () => {
  const isLoginPage = window.location.pathname.endsWith('login.html') || window.location.pathname.includes('login');
  const token = localStorage.getItem('gr_auth_token');

  // If not logged in and not on login page, redirect to login
  if (!token && !isLoginPage) {
    window.location.href = './login.html';
    return null;
  }

  // If already logged in and on login page, redirect to dashboard
  if (token && isLoginPage) {
    window.location.href = './dashboard.html';
    return null;
  }

  // Verify session if token exists
  if (token) {
    try {
      const res = await apiRequest('/auth/me');
      if (res && res.data && res.data.user) {
        localStorage.setItem('gr_user', JSON.stringify(res.data.user));
        renderSidebarUser(res.data.user);
        return res.data.user;
      } else {
        // Token is invalid/expired
        localStorage.removeItem('gr_auth_token');
        localStorage.removeItem('gr_user');
        if (!isLoginPage) {
          window.location.href = './login.html';
        }
      }
    } catch (err) {
      console.warn('Session verification failed:', err);
      localStorage.removeItem('gr_auth_token');
      localStorage.removeItem('gr_user');
      if (!isLoginPage) {
        window.location.href = './login.html';
      }
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
        window.location.href = './dashboard.html';
      }, 500);
      return res.data;
    }
  } catch (err) {
    console.error('Login error:', err);
    throw err; // Re-throw so login.html can catch and handle it
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
    window.location.href = './login.html';
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
      e.preventDefault(); // <-- Fixed typo (was eventDefault())
      logout();
    });
  }
}
