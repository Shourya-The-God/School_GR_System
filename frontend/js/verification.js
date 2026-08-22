import { apiRequest, showToast } from './api.js';
import { initAuth } from './auth.js';

let recordId = null;
let ocrRecord = null;
let metadata = { classes: [], divisions: [] };

document.addEventListener('DOMContentLoaded', async () => {
  const user = await initAuth();
  if (!user) return;

  const params = new URLSearchParams(window.location.search);
  recordId = params.get('recordId');

  if (!recordId) {
    showToast('No OCR record specified.', 'error');
    setTimeout(() => { window.location.href = '/import.html'; }, 1500);
    return;
  }

  await loadMetadata();
  loadRecordData();
  setupFormHandlers();
});

async function loadMetadata() {
  try {
    const res = await apiRequest('/reports/metadata');
    if (res && res.data) {
      metadata = res.data;
      const classSelect = document.getElementById('field-class');
      if (classSelect) {
        metadata.classes.forEach(c => {
          const opt = document.createElement('option');
          opt.value = c.id;
          opt.innerText = `Class ${c.name}`;
          classSelect.appendChild(opt);
        });
      }
    }
  } catch (err) {
    console.error('Failed to load classes:', err);
  }
}

async function loadRecordData() {
  try {
    const res = await apiRequest(`/imports/record/${recordId}`);
    if (!res || !res.data) return;

    ocrRecord = res.data;
    renderVerificationView(ocrRecord);
  } catch (err) {
    console.error('Error fetching OCR record:', err);
  }
}

function renderVerificationView(record) {
  const parsed = record.parsedData || {};
  const conf = record.confidence?.fields || {};
  const overallConf = record.confidence?.overall || 0;

  // Render Overall Confidence
  const overallBadge = document.getElementById('overall-confidence-badge');
  if (overallBadge) {
    overallBadge.innerText = `Overall Confidence: ${overallConf}%`;
    overallBadge.className = `badge ${overallConf >= 75 ? 'badge-active' : overallConf >= 50 ? 'badge-pending' : 'badge-danger'}`;
  }

  // Render Document Preview (Left Panel)
  const previewContainer = document.getElementById('doc-preview-container');
  if (previewContainer && record.import?.originalFile) {
    const fileUrl = `/api/documents/file/${record.import.originalFile}`;
    if (record.import.fileType === 'application/pdf') {
      previewContainer.innerHTML = `<iframe src="${fileUrl}" title="Original PDF Document"></iframe>`;
    } else {
      previewContainer.innerHTML = `<img src="${fileUrl}" alt="Scanned GR Document" style="cursor: zoom-in;" onclick="window.open('${fileUrl}', '_blank')" />`;
    }
  }

  // Populate Form Fields (Right Panel)
  setField('field-gr-number', parsed.grNumber, conf.grNumber);
  setField('field-adm-number', parsed.admissionNumber, conf.admissionNumber);
  setField('field-adm-date', parsed.admissionDate, conf.admissionDate);
  setField('field-first-name', parsed.firstName, conf.fullName);
  setField('field-middle-name', parsed.middleName, conf.fullName);
  setField('field-last-name', parsed.lastName, conf.fullName);
  
  if (parsed.gender) {
    const gSelect = document.getElementById('field-gender');
    if (gSelect) gSelect.value = parsed.gender.toUpperCase();
  }

  setField('field-dob', parsed.dateOfBirth, conf.dateOfBirth);
  setField('field-pob', parsed.birthPlace);
  setField('field-religion', parsed.religion, conf.religion);
  setField('field-caste', parsed.caste, conf.caste);
  setField('field-subcaste', parsed.subCaste);
  setField('field-father', parsed.fatherName, conf.fatherName);
  setField('field-mother', parsed.motherName, conf.motherName);
  setField('field-prev-school', parsed.previousSchool);

  // Raw OCR Text viewer
  const rawTextEl = document.getElementById('raw-ocr-text');
  if (rawTextEl) {
    rawTextEl.value = record.rawExtractedText || 'No raw text available.';
  }

  // If already verified or rejected, disable submit
  if (record.verificationStatus !== 'PENDING_REVIEW') {
    const submitBtn = document.getElementById('btn-approve-ocr');
    const rejectBtn = document.getElementById('btn-reject-ocr');
    if (submitBtn) submitBtn.disabled = true;
    if (rejectBtn) rejectBtn.disabled = true;
    showToast(`This record has already been marked as ${record.verificationStatus}.`, 'info');
  }
}

function setField(id, value, score) {
  const el = document.getElementById(id);
  if (!el) return;
  if (value) el.value = value;

  if (score !== undefined) {
    const label = el.closest('.form-group')?.querySelector('.form-label');
    if (label && !label.querySelector('.confidence-tag')) {
      const tag = document.createElement('span');
      const cls = score >= 75 ? 'confidence-high' : score >= 50 ? 'confidence-med' : 'confidence-low';
      tag.className = `confidence-tag ${cls}`;
      tag.innerText = `${score}% conf`;
      label.appendChild(tag);
    }
  }
}

function setupFormHandlers() {
  const form = document.getElementById('form-verify-ocr');
  const btnReject = document.getElementById('btn-reject-ocr');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const studentData = Object.fromEntries(formData.entries());

    try {
      showToast('Committing verified data to Student register...', 'info');
      const res = await apiRequest(`/imports/verify/${recordId}`, {
        method: 'POST',
        body: JSON.stringify({
          decision: 'VERIFIED',
          studentData
        })
      });

      if (res && res.data) {
        showToast('Student successfully created from OCR record!', 'success');
        setTimeout(() => {
          window.location.href = `/student.html?id=${res.data.student.id}`;
        }, 1000);
      }
    } catch (err) {
      // Handled in api.js
    }
  });

  btnReject?.addEventListener('click', async () => {
    if (!confirm('Are you sure you want to reject this OCR record?')) return;
    try {
      await apiRequest(`/imports/verify/${recordId}`, {
        method: 'POST',
        body: JSON.stringify({ decision: 'REJECTED' })
      });
      showToast('OCR record marked as rejected.', 'info');
      setTimeout(() => { window.location.href = '/import.html'; }, 800);
    } catch (err) {
      // Handled in api.js
    }
  });
}
