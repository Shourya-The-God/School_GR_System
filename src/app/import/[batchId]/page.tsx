'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthContext';
import { convertDateToWords } from '@/lib/number-to-words';
import { SAMPLE_GR_SCANS } from '@/lib/sample-scans';
import {
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Save,
  Check,
  Eye,
} from 'lucide-react';

export default function SplitScreenVerificationStudio({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  const resolvedParams = use(params);
  const { batchId } = resolvedParams;
  const router = useRouter();
  const { user, hasPerm } = useAuth();

  const [batch, setBatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Scanned Document Viewer Controls
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Staged Record Form State
  const [formData, setFormData] = useState<any>({});
  const [confidenceMap, setConfidenceMap] = useState<any>({});
  const [reviewNotes, setReviewNotes] = useState('');

  // Action states
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchBatch = async () => {
    try {
      const res = await fetch(`/api/import/batches/${batchId}`);
      if (res.ok) {
        const data = await res.json();
        setBatch(data.batch);

        if (data.batch.stagedRecords?.length > 0) {
          loadStagedRecord(data.batch.stagedRecords[currentIndex] || data.batch.stagedRecords[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load batch:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStagedRecord = (record: any) => {
    if (!record) return;
    try {
      const parsedData = typeof record.extractedDataJson === 'string' ? JSON.parse(record.extractedDataJson) : record.extractedDataJson;
      const parsedConfidence = typeof record.confidenceScoresJson === 'string' ? JSON.parse(record.confidenceScoresJson) : record.confidenceScoresJson;

      setFormData(parsedData || {});
      setConfidenceMap(parsedConfidence || {});
      setReviewNotes(record.reviewNotes || '');
      setErrorMsg('');
      setSuccessMsg('');
    } catch (e) {
      console.error('Error parsing staged record JSON:', e);
    }
  };

  useEffect(() => {
    fetchBatch();
  }, [batchId]);

  const handleSelectRecord = (index: number) => {
    if (batch?.stagedRecords?.[index]) {
      setCurrentIndex(index);
      loadStagedRecord(batch.stagedRecords[index]);
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev: any) => {
      const updated = { ...prev, [field]: value };
      // Auto-update full name if first or last name changes
      if (field === 'firstName' || field === 'middleName' || field === 'lastName') {
        const f = field === 'firstName' ? value : prev.firstName;
        const m = field === 'middleName' ? value : prev.middleName;
        const l = field === 'lastName' ? value : prev.lastName;
        updated.fullName = `${l || ''} ${f || ''} ${m || ''}`.replace(/\s+/g, ' ').trim();
      }
      // Auto-update DOB in words if DOB changes
      if (field === 'dob' && value) {
        updated.dobInWords = convertDateToWords(value);
      }
      return updated;
    });
  };

  const handleVerificationAction = async (action: 'APPROVE' | 'REJECT' | 'UPDATE') => {
    const currentRecord = batch?.stagedRecords?.[currentIndex];
    if (!currentRecord) return;

    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch(`/api/import/verify/${currentRecord.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          correctedData: formData,
          reviewNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Failed to execute ${action}`);
      }

      if (action === 'APPROVE') {
        setSuccessMsg(`Record for "${formData.fullName}" (GR: ${formData.grNumber}) verified and entered into production General Register!`);
      } else if (action === 'REJECT') {
        setSuccessMsg('Record rejected and removed from pending queue.');
      } else {
        setSuccessMsg('Manual corrections saved to staged draft.');
      }

      // Re-fetch batch to update status and advance if possible
      const updatedRes = await fetch(`/api/import/batches/${batchId}`);
      if (updatedRes.ok) {
        const updatedData = await updatedRes.json();
        setBatch(updatedData.batch);
        // Advance to next pending record if available
        const nextPending = updatedData.batch.stagedRecords.findIndex(
          (r: any, idx: number) => idx > currentIndex && r.status === 'PENDING'
        );
        if (nextPending !== -1) {
          setCurrentIndex(nextPending);
          loadStagedRecord(updatedData.batch.stagedRecords[nextPending]);
        } else {
          loadStagedRecord(updatedData.batch.stagedRecords[currentIndex]);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Helper for confidence badge colors
  const getConfidenceBadge = (score?: number) => {
    if (score === undefined) return null;
    let color = 'bg-emerald-50 text-emerald-700 border-emerald-300';
    let label = `${score}% (High)`;

    if (score < 60) {
      color = 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse';
      label = `${score}% (Low - Needs Review)`;
    } else if (score < 80) {
      color = 'bg-amber-50 text-amber-700 border-amber-300';
      label = `${score}% (Medium)`;
    }

    return (
      <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono font-bold ${color}`}>
        {label}
      </span>
    );
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400">Loading Verification Studio...</div>;
  }

  if (!batch) {
    return <div className="p-12 text-center text-slate-400">Batch not found</div>;
  }

  const currentRecord = batch.stagedRecords?.[currentIndex];
  const scanDocumentUrl = batch.documents?.[0]?.fileUrl || batch.fileUrl || SAMPLE_GR_SCANS[0].previewSvg;

  return (
    <div className="space-y-4 pb-16">
      {/* Top Studio Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/import"
            className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900">{batch.batchName}</h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-indigo-100 text-indigo-800 border border-indigo-200">
                Split-Screen Verification
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {batch.originalFileName} • {batch.recordsDetected} records detected • {batch.recordsApproved} approved
            </p>
          </div>
        </div>

        {/* Record Navigator Carousel */}
        {batch.stagedRecords?.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSelectRecord(Math.max(0, currentIndex - 1))}
              disabled={currentIndex <= 0}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30"
              title="Previous Record"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-bold text-slate-800">
              Record {currentIndex + 1} of {batch.stagedRecords.length}
            </span>
            <button
              onClick={() => handleSelectRecord(Math.min(batch.stagedRecords.length - 1, currentIndex + 1))}
              disabled={currentIndex >= batch.stagedRecords.length - 1}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30"
              title="Next Record"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
          <AlertTriangle size={16} className="text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Flagged Status Banner */}
      {currentRecord && currentRecord.status !== 'PENDING' && (
        <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
          currentRecord.status === 'APPROVED' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} />
            <span>
              This staged record has already been marked as <strong>{currentRecord.status}</strong> by{' '}
              {currentRecord.reviewedByName || 'Administrator'}.
            </span>
          </div>
          {currentRecord.studentId && (
            <Link
              href={`/students/${currentRecord.studentId}`}
              className="px-2.5 py-1 bg-white border border-emerald-300 rounded-lg text-emerald-800 font-bold hover:bg-emerald-100"
            >
              View in Main Register →
            </Link>
          )}
        </div>
      )}

      {/* Main Split-Screen Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-210px)] min-h-[580px]">
        {/* LEFT PANE (5 cols): High-Resolution Scanned Document Viewer */}
        <div className="lg:col-span-5 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col overflow-hidden shadow-md">
          {/* Document Viewer Toolbar */}
          <div className="p-3 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-white">
            <div className="flex items-center gap-2">
              <FileText size={15} className="text-indigo-400" />
              <span className="font-bold">Original Scanned GR Ledger</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-300"
                title="Zoom Out"
              >
                <ZoomOut size={15} />
              </button>
              <span className="text-[11px] font-mono px-1">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-300"
                title="Zoom In"
              >
                <ZoomIn size={15} />
              </button>
              <button
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-300 ml-1"
                title="Rotate 90°"
              >
                <RotateCw size={15} />
              </button>
              <button
                onClick={() => {
                  setZoom(1);
                  setRotation(0);
                }}
                className="text-[10px] px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 ml-1"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Interactive Document Image Container */}
          <div className="flex-1 bg-slate-950/60 overflow-auto p-4 flex items-center justify-center relative select-none">
            <div
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
                transition: 'transform 0.15s ease-out',
              }}
              className="max-w-full max-h-full rounded-lg shadow-2xl border border-slate-700 bg-white"
            >
              <img
                src={scanDocumentUrl}
                alt="Scanned General Register Page"
                className="max-w-full h-auto object-contain pointer-events-none"
              />
            </div>
          </div>

          {/* Raw Extracted OCR Snippet Footnote */}
          {currentRecord?.rawOcrText && (
            <div className="p-2.5 bg-slate-950 border-t border-slate-800 text-[10px] text-slate-400 font-mono line-clamp-2">
              <span className="text-indigo-400 font-bold">Raw OCR Snippet: </span>
              {currentRecord.rawOcrText}
            </div>
          )}
        </div>

        {/* RIGHT PANE (7 cols): Staged Record Reviewer & Live Editor */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 flex flex-col overflow-hidden shadow-md">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">
                  Extracted Field Verification &amp; Correction
                </h2>
                {currentRecord && (
                  <span className="text-xs font-semibold text-slate-500">
                    (Row #{currentRecord.rowNumber || 1})
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Review low-confidence fields highlighted in yellow/red before approving into the database
              </p>
            </div>

            {/* Overall Confidence Pill */}
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Overall Score</span>
              <span className="text-xs font-bold font-mono text-indigo-700">
                {currentRecord?.overallConfidence ? `${currentRecord.overallConfidence}%` : 'N/A'}
              </span>
            </div>
          </div>

          {/* Editable Form Fields with Confidence Badges */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
            {/* GR Number and Admission Number */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">GR Number *</label>
                  {getConfidenceBadge(confidenceMap?.grNumber)}
                </div>
                <input
                  type="text"
                  value={formData.grNumber || ''}
                  onChange={(e) => handleFieldChange('grNumber', e.target.value)}
                  placeholder="GR-XXXX"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-blue-700 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Admission No</label>
                  {getConfidenceBadge(confidenceMap?.admissionNumber)}
                </div>
                <input
                  type="text"
                  value={formData.admissionNumber || ''}
                  onChange={(e) => handleFieldChange('admissionNumber', e.target.value)}
                  placeholder="ADM-XXXX"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Gender *</label>
                  {getConfidenceBadge(confidenceMap?.gender)}
                </div>
                <select
                  value={formData.gender || 'MALE'}
                  onChange={(e) => handleFieldChange('gender', e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            {/* Names */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Surname (Last Name) *</label>
                  {getConfidenceBadge(confidenceMap?.lastName)}
                </div>
                <input
                  type="text"
                  value={formData.lastName || ''}
                  onChange={(e) => handleFieldChange('lastName', e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">First Name *</label>
                  {getConfidenceBadge(confidenceMap?.firstName)}
                </div>
                <input
                  type="text"
                  value={formData.firstName || ''}
                  onChange={(e) => handleFieldChange('firstName', e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Middle Name</label>
                  {getConfidenceBadge(confidenceMap?.middleName)}
                </div>
                <input
                  type="text"
                  value={formData.middleName || ''}
                  onChange={(e) => handleFieldChange('middleName', e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Date of Birth & DOB Words */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Date of Birth (Figures) *</label>
                  {getConfidenceBadge(confidenceMap?.dob)}
                </div>
                <input
                  type="date"
                  value={formData.dob || ''}
                  onChange={(e) => handleFieldChange('dob', e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Class &amp; Division</label>
                  {getConfidenceBadge(confidenceMap?.currentClass)}
                </div>
                <div className="flex gap-2">
                  <select
                    value={formData.currentClass || 'I'}
                    onChange={(e) => handleFieldChange('currentClass', e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  >
                    {['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'].map((c) => (
                      <option key={c} value={c}>
                        Std {c}
                      </option>
                    ))}
                  </select>
                  <select
                    value={formData.currentDivision || 'A'}
                    onChange={(e) => handleFieldChange('currentDivision', e.target.value)}
                    className="w-20 p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                  </select>
                </div>
              </div>
            </div>

            {/* DOB in Words Preview */}
            <div className="p-2.5 bg-blue-50/70 border border-blue-100 rounded-xl text-[11px] text-blue-900">
              <strong>DOB in Words: </strong> {formData.dobInWords || convertDateToWords(formData.dob || '')}
            </div>

            {/* Caste, Religion, Place of Birth */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Category</label>
                  {getConfidenceBadge(confidenceMap?.casteCategory)}
                </div>
                <select
                  value={formData.casteCategory || 'General/Open'}
                  onChange={(e) => handleFieldChange('casteCategory', e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="General/Open">General / Open</option>
                  <option value="OBC">OBC</option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                  <option value="EWS">EWS</option>
                  <option value="VJNT">VJNT</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Sub-caste</label>
                  {getConfidenceBadge(confidenceMap?.subCaste)}
                </div>
                <input
                  type="text"
                  value={formData.subCaste || ''}
                  onChange={(e) => handleFieldChange('subCaste', e.target.value)}
                  placeholder="e.g. Maratha, Brahmin"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Place of Birth</label>
                  {getConfidenceBadge(confidenceMap?.placeOfBirth)}
                </div>
                <input
                  type="text"
                  value={formData.placeOfBirth || ''}
                  onChange={(e) => handleFieldChange('placeOfBirth', e.target.value)}
                  placeholder="City / Village"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            {/* Parent Names */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Father's Name</label>
                  {getConfidenceBadge(confidenceMap?.fatherName)}
                </div>
                <input
                  type="text"
                  value={formData.fatherName || ''}
                  onChange={(e) => handleFieldChange('fatherName', e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Mother's Name</label>
                  {getConfidenceBadge(confidenceMap?.motherName)}
                </div>
                <input
                  type="text"
                  value={formData.motherName || ''}
                  onChange={(e) => handleFieldChange('motherName', e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            {/* Previous School */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700">Previous School Attended</label>
                {getConfidenceBadge(confidenceMap?.previousSchoolName)}
              </div>
              <input
                type="text"
                value={formData.previousSchoolName || ''}
                onChange={(e) => handleFieldChange('previousSchoolName', e.target.value)}
                placeholder="Name of Kindergarten or Primary School"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            {/* Reviewer Notes */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Administrator Verification Notes:
              </label>
              <input
                type="text"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="e.g. Cross-verified DOB against birth register; corrected caste spelling."
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600"
              />
            </div>
          </div>

          {/* Action Button Bar */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleVerificationAction('UPDATE')}
                disabled={actionLoading}
                className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Save size={14} />
                <span>Save Draft</span>
              </button>

              <button
                type="button"
                onClick={() => handleVerificationAction('REJECT')}
                disabled={actionLoading}
                className="px-3.5 py-2 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <XCircle size={14} />
                <span>Reject Record</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleVerificationAction('APPROVE')}
                disabled={actionLoading}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Check size={16} />
                <span>{actionLoading ? 'Merging...' : 'Approve & Merge into General Register'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
