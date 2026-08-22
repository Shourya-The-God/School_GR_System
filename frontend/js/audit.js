import { apiRequest } from './api.js';
import { initAuth } from './auth.js';

let currentPage = 1;
let currentLimit = 15;
let searchTimeout = null;

document.addEventListener('DOMContentLoaded', async () => {
  const user = await initAuth();
  if (!user) return;

  loadAuditLogs();
  setupEventListeners();
});

async function loadAuditLogs(page = 1) {
  currentPage = page;
  const search = document.getElementById('search-audit-input')?.value || '';
  const action = document.getElementById('filter-audit-action')?.value || '';

  const params = new URLSearchParams({
    page: currentPage,
    limit: currentLimit,
    search,
    action
  });

  try {
    const res = await apiRequest(`/audit?${params.toString()}`);
    if (res && res.data) {
      renderAuditTable(res.data);
      renderPagination(res.pagination);
    }
  } catch (err) {
    console.error('Error loading audit logs:', err);
  }
}

function renderAuditTable(logs) {
  const tbody = document.getElementById('audit-tbody');
  if (!tbody) return;

  if (logs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:24px; color:var(--text-muted);">No audit logs recorded.</td></tr>`;
    return;
  }

  tbody.innerHTML = logs.map(l => `
    <tr>
      <td>${new Date(l.timestamp).toLocaleString('en-IN')}</td>
      <td><strong>${l.user ? l.user.fullName : 'System'}</strong> <small style="color:var(--text-muted);">(${l.user?.role?.name || 'SYS'})</small></td>
      <td><span class="gr-number-tag">${l.action}</span></td>
      <td>${l.entityType} ${l.entityId ? `#${l.entityId.substring(0, 8)}...` : ''}</td>
      <td><code>${l.ipAddress || '127.0.0.1'}</code></td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick='window.viewAuditDetail(${JSON.stringify(JSON.stringify(l))})'>View Detail</button>
      </td>
    </tr>
  `).join('');
}

window.viewAuditDetail = (logStr) => {
  const log = JSON.parse(logStr);
  const detailModal = document.getElementById('audit-detail-modal');
  const codeEl = document.getElementById('audit-detail-json');
  if (codeEl) {
    codeEl.innerText = JSON.stringify({
      action: log.action,
      user: log.user?.username,
      entity: log.entityType,
      oldValue: log.oldValue ? JSON.parse(log.oldValue) : null,
      newValue: log.newValue ? JSON.parse(log.newValue) : null,
      userAgent: log.userAgent,
      timestamp: log.timestamp
    }, null, 2);
  }
  detailModal?.classList.add('open');
};

function renderPagination(p) {
  const info = document.getElementById('audit-pagination-info');
  const controls = document.getElementById('audit-pagination-controls');
  if (!info || !controls || !p) return;

  const start = p.total === 0 ? 0 : (p.page - 1) * p.limit + 1;
  const end = Math.min(p.page * p.limit, p.total);
  info.innerText = `Showing ${start} to ${end} of ${p.total} logs`;

  controls.innerHTML = `
    <button class="btn btn-secondary btn-sm" ${p.page <= 1 ? 'disabled' : ''} id="btn-prev-audit">Previous</button>
    <button class="btn btn-secondary btn-sm" ${p.page >= p.totalPages ? 'disabled' : ''} id="btn-next-audit">Next</button>
  `;

  document.getElementById('btn-prev-audit')?.addEventListener('click', () => {
    if (currentPage > 1) loadAuditLogs(currentPage - 1);
  });

  document.getElementById('btn-next-audit')?.addEventListener('click', () => {
    if (currentPage < p.totalPages) loadAuditLogs(currentPage + 1);
  });
}

function setupEventListeners() {
  const searchInput = document.getElementById('search-audit-input');
  searchInput?.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => loadAuditLogs(1), 300);
  });

  document.getElementById('filter-audit-action')?.addEventListener('change', () => loadAuditLogs(1));
  document.getElementById('btn-close-audit-modal')?.addEventListener('click', () => {
    document.getElementById('audit-detail-modal')?.classList.remove('open');
  });
}
