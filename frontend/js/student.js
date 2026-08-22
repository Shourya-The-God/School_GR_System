import { apiRequest, showToast } from './api.js';
import { initAuth } from './auth.js';

let studentId = null;
let currentStudent = null;

document.addEventListener('DOMContentLoaded', async () => {
  const user = await initAuth();
  if (!user) return;

  const params = new URLSearchParams(window.location.search);
  studentId = params.get('id');

  if (!studentId) {
    showToast('No student ID provided.', 'error');
    setTimeout(() => { window.location.href = '/students.html'; }, 1500);
    return;
  }

  loadStudentDetails();
  setupEventListeners();
});

async function loadStudentDetails() {
  try {
    const res = await apiRequest(`/students/${studentId}`);
    if (!res || !res.data) return;

    currentStudent = res.data;
    renderStudentProfile(currentStudent);
  } catch (err) {
    console.error('Failed to load student:', err);
  }
}

function renderStudentProfile(s) {
  document.getElementById('student-name').innerText = s.fullName;
  document.getElementById('student-gr-number').innerText = s.grNumber;
  document.getElementById('student-class-div').innerText = `${s.currentClass ? s.currentClass.name : 'N/A'} ${s.currentDivision ? s.currentDivision.name : ''}`;
  
  const statusBadge = document.getElementById('student-status-badge');
  if (statusBadge) {
    statusBadge.className = `badge badge-${s.status.toLowerCase()}`;
    statusBadge.innerText = s.status;
  }

  // Personal Info Fields
  document.getElementById('gr-val-gr-no').innerText = s.grNumber;
  document.getElementById('gr-val-adm-no').innerText = s.admissionNumber || '-';
  document.getElementById('gr-val-gender').innerText = s.gender;
  document.getElementById('gr-val-dob').innerText = s.dateOfBirth ? new Date(s.dateOfBirth).toLocaleDateString('en-IN') : '-';
  document.getElementById('gr-val-pob').innerText = s.birthPlace || '-';
  document.getElementById('gr-val-religion').innerText = s.religion || '-';
  document.getElementById('gr-val-caste').innerText = s.caste || '-';
  document.getElementById('gr-val-subcaste').innerText = s.subCaste || '-';
  document.getElementById('gr-val-nationality').innerText = s.nationality || 'Indian';
  document.getElementById('gr-val-mother-tongue').innerText = s.motherTongue || '-';
  document.getElementById('gr-val-aadhar').innerText = s.aadharNumber || '-';

  // Family Info Fields
  document.getElementById('gr-val-father').innerText = s.fatherName || '-';
  document.getElementById('gr-val-mother').innerText = s.motherName || '-';
  document.getElementById('gr-val-guardian').innerText = s.guardianName || '-';
  document.getElementById('gr-val-contact').innerText = s.parentContact || '-';
  document.getElementById('gr-val-address').innerText = s.residentialAddress || '-';

  // Admission History
  const admTbody = document.getElementById('admissions-tbody');
  if (admTbody) {
    if (s.admissions && s.admissions.length > 0) {
      admTbody.innerHTML = s.admissions.map(a => `
        <tr>
          <td>${new Date(a.admissionDate).toLocaleDateString('en-IN')}</td>
          <td>Class ${a.admittedClass}</td>
          <td>${a.previousSchool || 'N/A'}</td>
          <td>${a.remarks || '-'}</td>
        </tr>
      `).join('');
    } else {
      admTbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted);">No admission records attached.</td></tr>`;
    }
  }

  // Academic Progression History
  const acadTbody = document.getElementById('academic-history-tbody');
  if (acadTbody) {
    if (s.academicHistory && s.academicHistory.length > 0) {
      acadTbody.innerHTML = s.academicHistory.map(h => `
        <tr>
          <td>${h.academicYear}</td>
          <td>${h.class ? h.class.name : '-'} ${h.division ? h.division.name : ''}</td>
          <td>${h.result || 'Ongoing'}</td>
          <td>${h.percentage ? h.percentage + '%' : '-'}</td>
          <td>${h.conduct || 'Good'}</td>
        </tr>
      `).join('');
    } else {
      acadTbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">No historical exam progression found.</td></tr>`;
    }
  }

  // Documents
  const docsTbody = document.getElementById('documents-tbody');
  if (docsTbody) {
    if (s.documents && s.documents.length > 0) {
      docsTbody.innerHTML = s.documents.map(d => `
        <tr>
          <td><strong>${d.title}</strong></td>
          <td>${d.fileType}</td>
          <td>${Math.round(d.fileSize / 1024)} KB</td>
          <td>${new Date(d.createdAt).toLocaleDateString('en-IN')}</td>
          <td>
            <a href="/api/documents/file/${d.filePath}" target="_blank" class="btn btn-secondary btn-sm">Preview Document</a>
          </td>
        </tr>
      `).join('');
    } else {
      docsTbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">No scanned documents or certificates attached.</td></tr>`;
    }
  }
}

function setupEventListeners() {
  // Print button
  document.getElementById('btn-print-gr')?.addEventListener('click', () => {
    window.print();
  });

  // Edit GR modal
  const editModal = document.getElementById('edit-student-modal');
  const btnOpenEdit = document.getElementById('btn-open-edit-modal');
  const btnCloseEdit = document.getElementById('btn-close-edit-modal');
  const formEdit = document.getElementById('form-edit-student');

  btnOpenEdit?.addEventListener('click', () => {
    if (!currentStudent) return;
    document.getElementById('edit-gr-number').value = currentStudent.grNumber || '';
    document.getElementById('edit-first-name').value = currentStudent.firstName || '';
    document.getElementById('edit-middle-name').value = currentStudent.middleName || '';
    document.getElementById('edit-last-name').value = currentStudent.lastName || '';
    document.getElementById('edit-gender').value = currentStudent.gender || 'MALE';
    if (currentStudent.dateOfBirth) {
      document.getElementById('edit-dob').value = new Date(currentStudent.dateOfBirth).toISOString().split('T')[0];
    }
    document.getElementById('edit-birth-place').value = currentStudent.birthPlace || '';
    document.getElementById('edit-religion').value = currentStudent.religion || '';
    document.getElementById('edit-caste').value = currentStudent.caste || '';
    document.getElementById('edit-father').value = currentStudent.fatherName || '';
    document.getElementById('edit-mother').value = currentStudent.motherName || '';
    document.getElementById('edit-contact').value = currentStudent.parentContact || '';
    document.getElementById('edit-address').value = currentStudent.residentialAddress || '';
    editModal?.classList.add('open');
  });

  btnCloseEdit?.addEventListener('click', () => editModal?.classList.remove('open'));

  formEdit?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(formEdit);
    const payload = Object.fromEntries(formData.entries());

    try {
      await apiRequest(`/students/${studentId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      showToast('General Register record updated!', 'success');
      editModal?.classList.remove('open');
      loadStudentDetails();
    } catch (err) {
      // Handled in api.js
    }
  });
}
