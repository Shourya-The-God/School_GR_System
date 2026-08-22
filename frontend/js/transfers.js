import { apiRequest, showToast } from './api.js';
import { initAuth } from './auth.js';

let currentPage = 1;
let currentLimit = 10;
let searchTimeout = null;

document.addEventListener('DOMContentLoaded', async () => {
  const user = await initAuth();
  if (!user) return;

  loadTransfers();
  setupEventListeners();
});

async function loadTransfers(page = 1) {
  currentPage = page;
  const search = document.getElementById('search-tc-input')?.value || '';

  const params = new URLSearchParams({
    page: currentPage,
    limit: currentLimit,
    search
  });

  try {
    const res = await apiRequest(`/transfers?${params.toString()}`);
    if (res && res.data) {
      renderTransfersTable(res.data);
    }
  } catch (err) {
    console.error('Error fetching transfers:', err);
  }
}

function renderTransfersTable(transfers) {
  const tbody = document.getElementById('transfers-tbody');
  if (!tbody) return;

  if (transfers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:24px; color:var(--text-muted);">No Transfer Certificates issued yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = transfers.map(t => `
    <tr>
      <td><strong>${t.tcNumber}</strong></td>
      <td><span class="gr-number-tag">${t.student?.grNumber || '-'}</span></td>
      <td>${t.student?.fullName || '-'}</td>
      <td>${new Date(t.leavingDate).toLocaleDateString('en-IN')}</td>
      <td>${t.reasonForLeaving}</td>
      <td><span class="badge badge-transferred">${t.status}</span></td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="window.printTC('${t.id}')">Print TC</button>
      </td>
    </tr>
  `).join('');
}

window.printTC = async (transferId) => {
  try {
    const res = await apiRequest(`/transfers/${transferId}`);
    if (!res || !res.data) return;

    const t = res.data;
    const s = t.student;

    const printWindow = window.open('', '_blank', 'width=800,height=900');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Transfer Certificate - ${t.tcNumber}</title>
        <style>
          body { font-family: 'Times New Roman', serif; padding: 40px; color: #000; line-height: 1.6; }
          .border-box { border: 4px double #000; padding: 30px; }
          .header { text-align: center; margin-bottom: 20px; }
          .header h1 { margin: 0; font-size: 24px; text-transform: uppercase; }
          .header p { margin: 4px 0; font-size: 14px; }
          .tc-title { text-align: center; font-size: 20px; font-weight: bold; margin: 20px 0; text-decoration: underline; }
          .row { display: flex; justify-content: space-between; margin-bottom: 12px; }
          .field { margin-bottom: 14px; font-size: 16px; }
          .field-label { font-weight: bold; }
          .field-val { border-bottom: 1px dotted #000; display: inline-block; min-width: 250px; }
          .footer { margin-top: 50px; display: flex; justify-content: space-between; text-align: center; }
          .sign-box { width: 180px; border-top: 1px solid #000; padding-top: 5px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="border-box">
          <div class="header">
            <h1>Ideal High School & Junior College</h1>
            <p>Affiliated to State Board of Secondary & Higher Secondary Education</p>
            <p>School Code: 14.02.008 | Recognition No: MH/SCH/8945</p>
          </div>
          <div class="tc-title">SCHOOL LEAVING / TRANSFER CERTIFICATE</div>
          
          <div class="row">
            <div><span class="field-label">TC No:</span> <strong>${t.tcNumber}</strong></div>
            <div><span class="field-label">General Register No:</span> <strong>${s.grNumber}</strong></div>
          </div>

          <div class="field"><span class="field-label">1. Name of Pupil in full:</span> <span class="field-val" style="min-width: 450px;">${s.fullName}</span></div>
          <div class="field"><span class="field-label">2. Father's Name:</span> <span class="field-val">${s.fatherName || '-'}</span></div>
          <div class="field"><span class="field-label">3. Mother's Name:</span> <span class="field-val">${s.motherName || '-'}</span></div>
          <div class="field"><span class="field-label">4. Nationality & Religion:</span> <span class="field-val">${s.nationality} / ${s.religion || '-'}</span></div>
          <div class="field"><span class="field-label">5. Caste & Sub-Caste:</span> <span class="field-val">${s.caste || '-'} (${s.subCaste || '-'})</span></div>
          <div class="field"><span class="field-label">6. Place of Birth:</span> <span class="field-val">${s.birthPlace || '-'}</span></div>
          <div class="field"><span class="field-label">7. Date of Birth (in figures):</span> <span class="field-val">${new Date(s.dateOfBirth).toLocaleDateString('en-IN')}</span></div>
          <div class="field"><span class="field-label">8. Date of Admission:</span> <span class="field-val">${s.admissions?.[0]?.admissionDate ? new Date(s.admissions[0].admissionDate).toLocaleDateString('en-IN') : '-'}</span></div>
          <div class="field"><span class="field-label">9. Standard in which studying:</span> <span class="field-val">${s.currentClass ? s.currentClass.name : '-'}</span></div>
          <div class="field"><span class="field-label">10. Progress in studies:</span> <span class="field-val">${t.progressReport || 'Satisfactory'}</span></div>
          <div class="field"><span class="field-label">11. Conduct:</span> <span class="field-val">${t.conduct || 'Good'}</span></div>
          <div class="field"><span class="field-label">12. Date of Leaving School:</span> <span class="field-val">${new Date(t.leavingDate).toLocaleDateString('en-IN')}</span></div>
          <div class="field"><span class="field-label">13. Reason for leaving:</span> <span class="field-val" style="min-width: 400px;">${t.reasonForLeaving}</span></div>
          <div class="field"><span class="field-label">14. Remarks:</span> <span class="field-val">${t.remarks || 'None'}</span></div>

          <div class="footer">
            <div class="sign-box">Prepared By (Clerk)</div>
            <div class="sign-box">Checked By</div>
            <div class="sign-box">Principal (Seal & Signature)</div>
          </div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 500);
  } catch (err) {
    showToast('Failed to generate printable TC', 'error');
  }
};

function setupEventListeners() {
  const searchInput = document.getElementById('search-tc-input');
  searchInput?.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => loadTransfers(1), 300);
  });

  const modal = document.getElementById('new-tc-modal');
  const btnOpenModal = document.getElementById('btn-open-tc-modal');
  const btnCloseModal = document.getElementById('btn-close-tc-modal');
  const formTc = document.getElementById('form-issue-tc');

  btnOpenModal?.addEventListener('click', () => {
    document.getElementById('tc-number-input').value = `TC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    modal?.classList.add('open');
  });

  btnCloseModal?.addEventListener('click', () => modal?.classList.remove('open'));

  // Live student search inside modal
  const studentSearchInput = document.getElementById('tc-student-search');
  const studentSelect = document.getElementById('tc-student-id');

  studentSearchInput?.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
      const q = studentSearchInput.value.trim();
      if (!q) return;
      try {
        const res = await apiRequest(`/students?search=${encodeURIComponent(q)}&status=ACTIVE`);
        if (res && res.data && studentSelect) {
          studentSelect.innerHTML = '<option value="">-- Select Active Student --</option>';
          res.data.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.id;
            opt.innerText = `${s.grNumber} - ${s.fullName} (${s.currentClass ? s.currentClass.name : ''})`;
            studentSelect.appendChild(opt);
          });
        }
      } catch (err) {}
    }, 300);
  });

  formTc?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(formTc);
    const payload = Object.fromEntries(formData.entries());

    try {
      const res = await apiRequest('/transfers', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      showToast('Transfer Certificate issued successfully!', 'success');
      modal?.classList.remove('open');
      formTc.reset();
      loadTransfers(1);
      if (res && res.data) {
        window.printTC(res.data.id);
      }
    } catch (err) {
      // Handled in api.js
    }
  });
}
