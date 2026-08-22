import { apiRequest, showToast } from './api.js';
import { initAuth } from './auth.js';

let currentPage = 1;
let currentLimit = 10;
let searchTimeout = null;
let metadata = { classes: [], divisions: [] };

document.addEventListener('DOMContentLoaded', async () => {
  const user = await initAuth();
  if (!user) return;

  await loadMetadata();
  loadStudents();
  setupEventListeners();
});

async function loadMetadata() {
  try {
    const res = await apiRequest('/reports/metadata');
    if (res && res.data) {
      metadata = res.data;
      populateFilterDropdowns();
    }
  } catch (err) {
    console.error('Failed to load metadata:', err);
  }
}

function populateFilterDropdowns() {
  const filterClass = document.getElementById('filter-class');
  const modalClass = document.getElementById('modal-student-class');

  if (filterClass) {
    metadata.classes.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.innerText = `Class ${c.name}`;
      filterClass.appendChild(opt);
    });
  }

  if (modalClass) {
    metadata.classes.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.innerText = `Class ${c.name}`;
      modalClass.appendChild(opt);
    });
  }
}

export async function loadStudents(page = 1) {
  currentPage = page;
  const search = document.getElementById('search-input')?.value || '';
  const classId = document.getElementById('filter-class')?.value || '';
  const status = document.getElementById('filter-status')?.value || '';

  const params = new URLSearchParams({
    page: currentPage,
    limit: currentLimit,
    search,
    classId,
    status
  });

  try {
    const res = await apiRequest(`/students?${params.toString()}`);
    if (res && res.data) {
      renderStudentsTable(res.data);
      renderPagination(res.pagination);
    }
  } catch (err) {
    console.error('Error fetching students:', err);
  }
}

function renderStudentsTable(students) {
  const tbody = document.getElementById('students-tbody');
  if (!tbody) return;

  if (students.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:var(--text-muted);">No student records found matching the criteria.</td></tr>`;
    return;
  }

  tbody.innerHTML = students.map(s => `
    <tr>
      <td><span class="gr-number-tag">${s.grNumber}</span></td>
      <td><strong>${s.fullName}</strong></td>
      <td>${s.gender}</td>
      <td>${s.dateOfBirth ? new Date(s.dateOfBirth).toLocaleDateString('en-IN') : '-'}</td>
      <td>${s.currentClass ? s.currentClass.name : '-'} ${s.currentDivision ? s.currentDivision.name : ''}</td>
      <td><span class="badge badge-${s.status.toLowerCase()}">${s.status}</span></td>
      <td>
        <div style="display:flex; gap:6px;">
          <a href="/student.html?id=${s.id}" class="btn btn-secondary btn-sm">GR Sheet</a>
        </div>
      </td>
    </tr>
  `).join('');
}

function renderPagination(p) {
  const info = document.getElementById('pagination-info');
  const controls = document.getElementById('pagination-controls');
  if (!info || !controls || !p) return;

  const start = p.total === 0 ? 0 : (p.page - 1) * p.limit + 1;
  const end = Math.min(p.page * p.limit, p.total);
  info.innerText = `Showing ${start} to ${end} of ${p.total} entries`;

  controls.innerHTML = `
    <button class="btn btn-secondary btn-sm" ${p.page <= 1 ? 'disabled' : ''} id="btn-prev-page">Previous</button>
    <button class="btn btn-secondary btn-sm" ${p.page >= p.totalPages ? 'disabled' : ''} id="btn-next-page">Next</button>
  `;

  document.getElementById('btn-prev-page')?.addEventListener('click', () => {
    if (currentPage > 1) loadStudents(currentPage - 1);
  });

  document.getElementById('btn-next-page')?.addEventListener('click', () => {
    if (currentPage < p.totalPages) loadStudents(currentPage + 1);
  });
}

function setupEventListeners() {
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        loadStudents(1);
      }, 300);
    });
  }

  document.getElementById('filter-class')?.addEventListener('change', () => loadStudents(1));
  document.getElementById('filter-status')?.addEventListener('change', () => loadStudents(1));

  // Export CSV
  document.getElementById('btn-export-csv')?.addEventListener('click', async () => {
    try {
      showToast('Preparing CSV Export...', 'info');
      const blob = await apiRequest('/reports/export/csv');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `GR-Students-Export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      showToast('Export downloaded successfully!', 'success');
    } catch (err) {
      showToast('Failed to export CSV', 'error');
    }
  });

  // Modal handlers for New Student
  const modal = document.getElementById('new-student-modal');
  const btnOpenModal = document.getElementById('btn-open-new-student-modal');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const formNewStudent = document.getElementById('form-new-student');

  btnOpenModal?.addEventListener('click', () => modal?.classList.add('open'));
  btnCloseModal?.addEventListener('click', () => modal?.classList.remove('open'));

  formNewStudent?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(formNewStudent);
    const payload = Object.fromEntries(formData.entries());

    try {
      await apiRequest('/students', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      showToast('Student registered successfully!', 'success');
      modal?.classList.remove('open');
      formNewStudent.reset();
      loadStudents(1);
    } catch (err) {
      // Error handled in api.js
    }
  });
}
