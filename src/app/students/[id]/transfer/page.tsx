'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthContext';
import {
  UserMinus,
  ArrowLeft,
  AlertTriangle,
  FileText,
  CheckCircle,
  Building,
  Calendar,
  Award,
  ShieldAlert,
} from 'lucide-react';

export default function StudentTransferPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const router = useRouter();
  const { user, hasPerm } = useAuth();

  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [transferData, setTransferData] = useState({
    leavingDate: new Date().toISOString().slice(0, 10),
    leavingClass: '',
    reasonForLeaving: 'Parent job transfer to another district',
    conductRemark: 'Very Good',
    progressRemark: 'Good & Sincere in Studies',
    tcNumber: `TC-AVM-2026/${Math.floor(100 + Math.random() * 900)}`,
    destinationSchool: '',
    feesPaidUpToDate: true,
    duesRemarks: 'All school fees and library books cleared in full.',
    notes: 'Cumulative academic record card and character certificate attached.',
    newStatus: 'TRANSFERRED', // TRANSFERRED, WITHDRAWN, GRADUATED
  });

  useEffect(() => {
    async function fetchStudent() {
      try {
        const res = await fetch(`/api/students/${id}`);
        if (res.ok) {
          const data = await res.json();
          setStudent(data.student);
          setTransferData((prev) => ({
            ...prev,
            leavingClass: data.student.currentClass,
          }));
        }
      } catch (err) {
        console.error('Failed to load student:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStudent();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setTransferData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setTransferData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleInitiateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setShowConfirmModal(true);
  };

  const handleConfirmTransfer = async () => {
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/students/${id}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transferData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to process transfer');
      }

      // Success: Navigate to printable TC certificate
      router.push(`/certificates/tc/${id}`);
    } catch (err: any) {
      setError(err.message);
      setShowConfirmModal(false);
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400">Loading student details...</div>;
  }

  if (!hasPerm('canTransferStudents')) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
        <AlertTriangle className="mx-auto text-amber-500 mb-3" size={36} />
        <h2 className="text-lg font-bold text-slate-800">Transfer Authorization Required</h2>
        <p className="text-xs text-slate-500 mt-1">
          Only School Administrators and Super Admins have statutory authorization to issue Transfer Certificates and archive student enrollment.
        </p>
        <Link href={`/students/${id}`} className="mt-4 inline-block px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold">
          Return to Student Profile
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/students/${id}`}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Transfer / Discharge Workflow
            </h1>
            <p className="text-xs text-slate-500">
              Issue official School Leaving Certificate (TC) &amp; archive active enrollment
            </p>
          </div>
        </div>

        <span className="text-xs px-3 py-1 bg-amber-100 text-amber-800 rounded-full font-bold border border-amber-300">
          Statutory Transfer Process
        </span>
      </div>

      {/* Target Student Identity Card */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center font-bold text-blue-300 text-lg">
            {student?.firstName?.[0]}
            {student?.lastName?.[0]}
          </div>
          <div>
            <h2 className="text-base font-bold text-white">{student?.fullName}</h2>
            <p className="text-xs text-slate-400 font-mono">
              GR No: {student?.grNumber} • Current Std: {student?.currentClass}-{student?.currentDivision}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400 block uppercase">Admission Date</span>
          <span className="text-xs font-semibold text-slate-200">
            {student?.admission?.admissionDate ? new Date(student.admission.admissionDate).toLocaleDateString() : 'N/A'}
          </span>
        </div>
      </div>

      {/* Zero Deletion Guidance Notice */}
      <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-start gap-3">
        <ShieldAlert size={18} className="shrink-0 mt-0.5 text-blue-600" />
        <div>
          <p className="font-bold">Permanent Legal Register Policy:</p>
          <p className="text-blue-800/90 mt-0.5 leading-relaxed">
            Completing this workflow changes the student's status to <strong>TRANSFERRED</strong> and removes them from active grade rosters. The student's full historical record, original GR scans, and audit log entries will <strong>NEVER be deleted</strong> and remain permanently searchable in the General Register archives.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle size={16} className="text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleInitiateTransfer} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Transfer Certificate (TC) Number <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              name="tcNumber"
              value={transferData.tcNumber}
              onChange={handleChange}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-amber-700 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[10px] text-slate-400 mt-1">Must be unique across all issued certificates</p>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Date of Leaving / Discharge <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              name="leavingDate"
              value={transferData.leavingDate}
              onChange={handleChange}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Standard / Class from which Leaving <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              name="leavingClass"
              value={transferData.leavingClass}
              onChange={handleChange}
              placeholder="e.g. X"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Reason for Leaving School <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              name="reasonForLeaving"
              value={transferData.reasonForLeaving}
              onChange={handleChange}
              placeholder="e.g. Parent job transfer, Passed SSC Examination"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Destination School / College (if known)
            </label>
            <input
              type="text"
              name="destinationSchool"
              value={transferData.destinationSchool}
              onChange={handleChange}
              placeholder="e.g. Army Public School, Pune / Fergusson Junior College"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Conduct in School</label>
            <select
              name="conductRemark"
              value={transferData.conductRemark}
              onChange={handleChange}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="Exemplary">Exemplary</option>
              <option value="Very Good">Very Good</option>
              <option value="Good">Good</option>
              <option value="Satisfactory">Satisfactory</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Academic Progress</label>
            <select
              name="progressRemark"
              value={transferData.progressRemark}
              onChange={handleChange}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="Outstanding (Distinction)">Outstanding (Distinction)</option>
              <option value="Good & Sincere in Studies">Good &amp; Sincere in Studies</option>
              <option value="Satisfactory">Satisfactory</option>
              <option value="Promoted to Higher Standard">Promoted to Higher Standard</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Archival Category</label>
            <select
              name="newStatus"
              value={transferData.newStatus}
              onChange={handleChange}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="TRANSFERRED">Transferred to another school</option>
              <option value="WITHDRAWN">Withdrawn by parent/guardian</option>
              <option value="GRADUATED">Graduated (Completed Grade X/XII)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">Clearance &amp; Dues Remarks</label>
          <input
            type="text"
            name="duesRemarks"
            value={transferData.duesRemarks}
            onChange={handleChange}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Link
            href={`/students/${id}`}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
          >
            <UserMinus size={16} />
            <span>Review &amp; Issue Transfer Certificate</span>
          </button>
        </div>
      </form>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="p-3 bg-amber-100 rounded-xl">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Confirm Student Discharge &amp; TC Issue
                </h3>
                <p className="text-xs text-slate-500">
                  Please review the transfer details before finalizing
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl text-xs space-y-2 border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Student:</span>
                <span className="font-bold text-slate-900">{student?.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Permanent GR Number:</span>
                <span className="font-mono font-bold text-blue-700">{student?.grNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">TC Certificate Number:</span>
                <span className="font-mono font-bold text-amber-700">{transferData.tcNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date of Leaving:</span>
                <span className="font-bold text-slate-900">{transferData.leavingDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Reason:</span>
                <span className="font-medium text-slate-800">{transferData.reasonForLeaving}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 italic">
              Upon confirmation, the student will be moved to the Transferred register and an official audit log entry will be created.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={submitting}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Go Back &amp; Edit
              </button>
              <button
                type="button"
                onClick={handleConfirmTransfer}
                disabled={submitting}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
              >
                {submitting ? 'Generating TC & Archiving...' : 'Confirm & Generate Certificate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
