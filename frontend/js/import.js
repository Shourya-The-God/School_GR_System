import { apiRequest, showToast } from './api.js';
import { initAuth } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
  const user = await initAuth();
  if (!user) return;

  loadImportHistory();
  setupDropzone();
});

async function loadImportHistory() {
  try {
    const res = await apiRequest('/imports');
    if (!res || !res.data) return;

    renderImportTable(res.data);
  } catch (err) {
    console.error('Error loading imports:', err);
  }
}

function renderImportTable(imports) {
  const tbody = document.getElementById('imports-tbody');
  if (!tbody) return;

  if (imports.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:24px; color:var(--text-muted);">No document imports processed yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = imports.map(imp => {
    const rec = imp.ocrRecords?.[0];
    const status = rec ? rec.verificationStatus : imp.status;
    const isPending = status === 'PENDING_REVIEW' || status === 'PROCESSING';

    return `
      <tr>
        <td><strong>${imp.batchName}</strong></td>
        <td>${imp.fileType}</td>
        <td>${Math.round(imp.fileSize / 1024)} KB</td>
        <td>${new Date(imp.createdAt).toLocaleString('en-IN')}</td>
        <td>
          <span class="badge ${status === 'VERIFIED' ? 'badge-active' : status === 'REJECTED' ? 'badge-danger' : 'badge-pending'}">
            ${status}
          </span>
        </td>
        <td>
          ${rec ? `
            <a href="/verification.html?recordId=${rec.id}" class="btn ${isPending ? 'btn-primary' : 'btn-secondary'} btn-sm">
              ${isPending ? 'Review & Verify' : 'View Verification'}
            </a>
          ` : '-'}
        </td>
      </tr>
    `;
  }).join('');
}

function setupDropzone() {
  const dropzone = document.getElementById('ocr-dropzone');
  const fileInput = document.getElementById('file-input');
  const uploadProgress = document.getElementById('upload-progress');

  if (!dropzone || !fileInput) return;

  dropzone.addEventListener('click', () => fileInput.click());

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });

  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      handleFileUpload(fileInput.files[0]);
    }
  });

  async function handleFileUpload(file) {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      showToast('Please upload a valid JPG, PNG, or PDF document.', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('document', file);
    formData.append('batchName', `GR-Scan-${file.name}`);

    if (uploadProgress) {
      uploadProgress.style.display = 'block';
      uploadProgress.innerText = `Uploading and running OCR extraction on ${file.name}... (Please wait)`;
    }

    try {
      showToast('Document uploaded. Running OCR extraction...', 'info');
      const res = await apiRequest('/imports/upload', {
        method: 'POST',
        body: formData
      });

      if (res && res.data) {
        showToast('OCR extraction completed! Redirecting to human verification review...', 'success');
        setTimeout(() => {
          window.location.href = `/verification.html?recordId=${res.data.record.id}`;
        }, 800);
      }
    } catch (err) {
      if (uploadProgress) uploadProgress.style.display = 'none';
    }
  }
}
