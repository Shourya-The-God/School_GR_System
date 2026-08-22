'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthContext';
import { SAMPLE_GR_SCANS } from '@/lib/sample-scans';
import {
  ScanLine,
  Upload,
  FileText,
  CheckCircle2,
  Clock,
  ArrowRight,
  AlertCircle,
  Sparkles,
  BookOpen,
  Eye,
  Layers,
  Plus,
} from 'lucide-react';

export default function ImportManagementPage() {
  const { user, hasPerm } = useAuth();
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(SAMPLE_GR_SCANS[0].id);
  const [batchName, setBatchName] = useState('GR Ledger Migration – Vol. III (1998-2002)');
  const [customText, setCustomText] = useState('');
  const [activeTab, setActiveTab] = useState<'preset' | 'custom'>('preset');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchBatches = async () => {
    try {
      const res = await fetch('/api/import/batches');
      if (res.ok) {
        const data = await res.json();
        setBatches(data.batches);
      }
    } catch (err) {
      console.error('Failed to load batches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const handleCreateBatchAndRunOCR = async () => {
    setCreating(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      let rawTextToProcess = '';
      let fileName = 'scanned_gr_ledger.png';
      let fileUrl = '';

      if (activeTab === 'preset') {
        const preset = SAMPLE_GR_SCANS.find((s) => s.id === selectedPreset) || SAMPLE_GR_SCANS[0];
        rawTextToProcess = preset.simulatedText;
        fileName = `${preset.id}.svg`;
        fileUrl = preset.previewSvg;
      } else {
        if (!customText.trim()) throw new Error('Please paste or enter raw OCR ledger text to process');
        rawTextToProcess = customText;
        fileName = 'custom_uploaded_scan.txt';
        fileUrl = SAMPLE_GR_SCANS[0].previewSvg;
      }

      // 1. Create Batch
      const batchRes = await fetch('/api/import/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchName: batchName.trim() || `GR Import Batch – ${new Date().toLocaleDateString()}`,
          originalFileName: fileName,
          fileUrl,
          fileType: 'image/svg+xml',
          totalPages: 1,
        }),
      });

      const batchData = await batchRes.json();
      if (!batchRes.ok) throw new Error(batchData.error || 'Failed to create import batch');

      const batchId = batchData.batch.id;

      // 2. Process OCR text and generate staged candidate records
      const ocrRes = await fetch('/api/import/process-ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId,
          rawText: rawTextToProcess,
          pageNumber: 1,
        }),
      });

      const ocrData = await ocrRes.json();
      if (!ocrRes.ok) throw new Error(ocrData.error || 'OCR parsing failed');

      setSuccessMsg(`Successfully processed OCR! Detected ${ocrData.records.length} student record candidates.`);
      fetchBatches();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setCreating(false);
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'COMPLETED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'PARTIALLY_APPROVED':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'PENDING_REVIEW':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            GR Document Import &amp; OCR Migration
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload and digitize historical physical General Register ledgers with AI-assisted split-screen verification
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full font-bold border border-indigo-200 flex items-center gap-1.5">
            <Sparkles size={14} />
            <span>OCR &amp; Heuristic Extraction Pipeline</span>
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={16} className="text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Migration Workflow Stepper Card */}
      <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-md space-y-4">
        <h2 className="text-sm font-bold tracking-wider uppercase text-indigo-300">
          General Register Migration Workflow
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <div className="font-bold text-indigo-300 mb-1">Step 1: Upload / Scan</div>
            <p className="text-slate-300 text-[11px]">Upload scanned PDF, photo, or select historical register preset.</p>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <div className="font-bold text-indigo-300 mb-1">Step 2: OCR &amp; Extraction</div>
            <p className="text-slate-300 text-[11px]">Heuristic OCR engine extracts GR No, student names, DOB, and caste.</p>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <div className="font-bold text-indigo-300 mb-1">Step 3: Split-Screen Review</div>
            <p className="text-slate-300 text-[11px]">Side-by-side inspection of scanned page vs editable fields with confidence flags.</p>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <div className="font-bold text-indigo-300 mb-1">Step 4: Merge &amp; Link</div>
            <p className="text-slate-300 text-[11px]">Approved records enter production DB with permanent link to original scan.</p>
          </div>
        </div>
      </div>

      {/* Upload / Create Batch Section */}
      {hasPerm('canImportGR') && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Upload className="text-indigo-600" size={18} />
              <h3 className="text-sm font-bold text-slate-800">
                Create New GR Import Batch &amp; Run OCR
              </h3>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('preset')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                  activeTab === 'preset' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Sample GR Ledger Presets
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('custom')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                  activeTab === 'custom' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Custom OCR Text / Scan Input
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Batch Name / Ledger Description <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                placeholder="e.g. GR Register Book Vol-III (Pages 40-50)"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {activeTab === 'preset' ? (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                Choose Scanned Ledger Page Preset for OCR Processing:
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SAMPLE_GR_SCANS.map((preset) => (
                  <div
                    key={preset.id}
                    onClick={() => setSelectedPreset(preset.id)}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      selectedPreset === preset.id
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-slate-900">{preset.name}</span>
                        {selectedPreset === preset.id && (
                          <span className="text-[10px] bg-indigo-600 text-white font-bold px-2 py-0.5 rounded-full">
                            Selected
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mb-3">{preset.description}</p>
                    </div>

                    <div className="h-32 border border-slate-200 rounded-lg overflow-hidden bg-slate-50 flex items-center justify-center p-1">
                      <img
                        src={preset.previewSvg}
                        alt={preset.name}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Paste Raw OCR Extracted Text from Document Scan:
              </label>
              <textarea
                rows={5}
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Paste OCR text lines from scanner... e.g.&#10;GR No: 1080 | Name: Joshi Atharva | DOB: 15/07/2012 | Class: VI-A | Father: Mangesh Joshi"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleCreateBatchAndRunOCR}
              disabled={creating}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
            >
              <ScanLine size={16} />
              <span>{creating ? 'Extracting & Staging OCR Records...' : 'Start OCR Extraction & Create Batch'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Existing Import Batches Queue */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800">Import Batches Queue</h2>
            <p className="text-xs text-slate-500">
              Track scanned document batches, OCR confidence, and verification progress
            </p>
          </div>
          <button
            onClick={fetchBatches}
            className="text-xs text-indigo-600 hover:underline font-semibold"
          >
            Refresh Queue
          </button>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading import batches...</div>
          ) : batches.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              No import batches found. Create a batch above to begin OCR migration.
            </div>
          ) : (
            batches.map((batch) => (
              <div key={batch.id} className="p-5 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{batch.batchName}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(batch.status)}`}>
                      {batch.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    File: {batch.originalFileName} • Created by: {batch.createdByName || 'Operator'} • Date: {new Date(batch.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Metrics Badges */}
                <div className="flex items-center gap-4">
                  <div className="text-center px-3 py-1 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase block font-bold">Detected</span>
                    <span className="font-bold text-slate-800 text-sm">{batch.recordsDetected}</span>
                  </div>
                  <div className="text-center px-3 py-1 bg-emerald-50 rounded-xl border border-emerald-200">
                    <span className="text-[10px] text-emerald-600 uppercase block font-bold">Approved</span>
                    <span className="font-bold text-emerald-700 text-sm">{batch.recordsApproved}</span>
                  </div>
                  <div className="text-center px-3 py-1 bg-amber-50 rounded-xl border border-amber-200">
                    <span className="text-[10px] text-amber-600 uppercase block font-bold">Pending Review</span>
                    <span className="font-bold text-amber-700 text-sm">{batch.recordsPending}</span>
                  </div>

                  {/* Verification Studio Button */}
                  <Link
                    href={`/import/${batch.id}`}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all text-xs"
                  >
                    <span>Verification Studio</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
