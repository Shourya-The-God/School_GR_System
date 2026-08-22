import { apiRequest } from './api.js';
import { initAuth } from './auth.js';

let enrollmentChartInstance = null;
let genderChartInstance = null;

document.addEventListener('DOMContentLoaded', async () => {
  const user = await initAuth();
  if (!user) return;

  loadDashboardData();
});

async function loadDashboardData() {
  try {
    const res = await apiRequest('/reports/dashboard');
    if (!res || !res.data) return;

    const { kpi, recentStudents, classEnrollment, genderDistribution } = res.data;

    // 1. Render KPI numbers
    document.getElementById('kpi-total-students').innerText = kpi.totalStudents || 0;
    document.getElementById('kpi-active-students').innerText = kpi.activeStudents || 0;
    document.getElementById('kpi-transferred-students').innerText = kpi.transferredStudents || 0;
    document.getElementById('kpi-pending-ocr').innerText = kpi.pendingOcrCount || 0;

    // 2. Render Recent Students Table
    const recentTableBody = document.getElementById('recent-students-tbody');
    if (recentTableBody) {
      if (recentStudents.length === 0) {
        recentTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No student records found.</td></tr>`;
      } else {
        recentTableBody.innerHTML = recentStudents.map(s => `
          <tr>
            <td><span class="gr-number-tag">${s.grNumber}</span></td>
            <td><strong>${s.fullName}</strong></td>
            <td>${s.currentClass ? s.currentClass.name : '-'} ${s.currentDivision ? s.currentDivision.name : ''}</td>
            <td><span class="badge badge-${s.status.toLowerCase()}">${s.status}</span></td>
            <td><a href="/student.html?id=${s.id}" class="btn btn-secondary btn-sm">View GR</a></td>
          </tr>
        `).join('');
      }
    }

    // 3. Render Chart.js charts if Chart library is loaded
    if (window.Chart) {
      renderEnrollmentChart(classEnrollment);
      renderGenderChart(genderDistribution);
    }
  } catch (err) {
    console.error('Error loading dashboard stats:', err);
  }
}

function renderEnrollmentChart(classes = []) {
  const ctx = document.getElementById('enrollmentChart')?.getContext('2d');
  if (!ctx) return;

  if (enrollmentChartInstance) {
    enrollmentChartInstance.destroy();
  }

  const labels = classes.map(c => c.name);
  const data = classes.map(c => c.count);

  enrollmentChartInstance = new window.Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Active Students',
        data,
        backgroundColor: '#1e3a8a',
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0 } }
      }
    }
  });
}

function renderGenderChart(genderStats = []) {
  const ctx = document.getElementById('genderChart')?.getContext('2d');
  if (!ctx) return;

  if (genderChartInstance) {
    genderChartInstance.destroy();
  }

  const labels = genderStats.map(g => g.gender);
  const data = genderStats.map(g => g.count);

  genderChartInstance = new window.Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: ['#0284c7', '#ec4899', '#8b5cf6']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });
}
