'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthContext';
import {
  Users,
  UserCheck,
  UserMinus,
  GraduationCap,
  ScanLine,
  UserPlus,
  Search,
  BookOpen,
  History,
  FileSpreadsheet,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Clock,
  ShieldCheck,
  FileText,
  Building,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, hasPerm } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/reports/statistics');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Failed to load stats:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner */}
      <div className="bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-2 border border-blue-400/30">
              <ShieldCheck size={14} />
              <span>Statutory School General Register Archive</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Welcome back, {user?.name || 'Administrator'}
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Permanent digital General Register maintaining all admitted, active, and transferred student records with full historical audit trails and OCR migration.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {hasPerm('canImportGR') && (
              <Link
                href="/import"
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-md flex items-center gap-2 transition-all"
              >
                <ScanLine size={16} />
                <span>Import GR Scan</span>
              </Link>
            )}
            {hasPerm('canEditStudents') && (
              <Link
                href="/students/new"
                className="px-4 py-2.5 bg-white text-slate-900 hover:bg-slate-100 text-xs font-semibold rounded-xl shadow-md flex items-center gap-2 transition-all"
              >
                <UserPlus size={16} className="text-blue-600" />
                <span>Add Student</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Admitted */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Admitted</span>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <Users size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {loading ? '...' : stats?.metrics?.totalStudents || 0}
          </div>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <Building size={12} />
            <span>Permanent GR entries since 1984</span>
          </p>
        </div>

        {/* Currently Active */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-emerald-600 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Currently Enrolled</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <UserCheck size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {loading ? '...' : stats?.metrics?.activeStudents || 0}
          </div>
          <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <span>● Active on school rolls</span>
          </p>
        </div>

        {/* Transferred / Departed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-amber-600 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Transferred / Left</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <UserMinus size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {loading ? '...' : (stats?.metrics?.transferredStudents || 0) + (stats?.metrics?.withdrawnStudents || 0)}
          </div>
          <p className="text-xs text-amber-600 font-medium mt-1 flex items-center gap-1">
            <span>TC issued &amp; archived</span>
          </p>
        </div>

        {/* OCR Verification Queue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-blue-600 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">OCR Review Queue</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <ScanLine size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {loading ? '...' : stats?.metrics?.pendingOcrRecordsCount || 0}
          </div>
          <p className="text-xs text-blue-600 font-medium mt-1 flex items-center gap-1">
            <span>Records awaiting verification</span>
          </p>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Link
          href="/students/new"
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all flex flex-col items-center text-center group"
        >
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors mb-2">
            <UserPlus size={20} />
          </div>
          <span className="text-xs font-bold text-slate-800">+ Add Student</span>
          <span className="text-[10px] text-slate-500">Direct admission</span>
        </Link>

        <Link
          href="/import"
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-indigo-500 hover:shadow-md transition-all flex flex-col items-center text-center group"
        >
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors mb-2">
            <ScanLine size={20} />
          </div>
          <span className="text-xs font-bold text-slate-800">Import GR Scan</span>
          <span className="text-[10px] text-slate-500">OCR migration</span>
        </Link>

        <Link
          href="/students"
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all flex flex-col items-center text-center group"
        >
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors mb-2">
            <Search size={20} />
          </div>
          <span className="text-xs font-bold text-slate-800">Search Students</span>
          <span className="text-[10px] text-slate-500">Faceted lookup</span>
        </Link>

        <Link
          href="/gr-folio"
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-amber-500 hover:shadow-md transition-all flex flex-col items-center text-center group"
        >
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors mb-2">
            <BookOpen size={20} />
          </div>
          <span className="text-xs font-bold text-slate-800">Official GR Folio</span>
          <span className="text-[10px] text-slate-500">20-Column format</span>
        </Link>

        <Link
          href="/students?status=TRANSFERRED"
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-rose-500 hover:shadow-md transition-all flex flex-col items-center text-center group"
        >
          <div className="p-3 rounded-xl bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors mb-2">
            <UserMinus size={20} />
          </div>
          <span className="text-xs font-bold text-slate-800">Transfers &amp; TC</span>
          <span className="text-[10px] text-slate-500">Archived exits</span>
        </Link>

        <Link
          href="/audit"
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-purple-500 hover:shadow-md transition-all flex flex-col items-center text-center group"
        >
          <div className="p-3 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors mb-2">
            <History size={20} />
          </div>
          <span className="text-xs font-bold text-slate-800">Audit Trail</span>
          <span className="text-[10px] text-slate-500">Immutable logs</span>
        </Link>
      </div>

      {/* Main Content Grid: Pending OCR Queue & Recent Admissions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Student Admissions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-800">Recent Student Admissions</h2>
                <p className="text-xs text-slate-500">Newly registered students in the General Register</p>
              </div>
              <Link
                href="/students"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {stats?.recentAdmissions?.length > 0 ? (
                stats.recentAdmissions.map((student: any) => (
                  <div key={student.id} className="p-4 hover:bg-slate-50 flex items-center justify-between transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-xs">
                        {student.currentClass}-{student.currentDivision}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Link href={`/students/${student.id}`} className="text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors">
                            {student.fullName}
                          </Link>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                            {student.grNumber}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Father: {student.parent?.fatherName || 'N/A'} • DOB: {new Date(student.dob).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                        student.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {student.status}
                      </span>
                      <Link
                        href={`/students/${student.id}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                        title="View Profile"
                      >
                        <ArrowRight size={16} />
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-400 text-sm">No student records found</div>
              )}
            </div>
          </div>

          {/* Recent Transfers & TC Issued */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-800">Recent Transfers &amp; Leaving Certificates</h2>
                <p className="text-xs text-slate-500">Departed students preserved in historical archive</p>
              </div>
              <Link
                href="/students?status=TRANSFERRED"
                className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
              >
                <span>View Transferred</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {stats?.recentTransfers?.length > 0 ? (
                stats.recentTransfers.map((t: any) => (
                  <div key={t.id} className="p-4 hover:bg-slate-50 flex items-center justify-between transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <Link href={`/students/${t.studentId}`} className="text-sm font-bold text-slate-900 hover:text-blue-600">
                          {t.student?.fullName}
                        </Link>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold border border-amber-200">
                          {t.tcNumber}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Reason: {t.reasonForLeaving} • Std {t.leavingClass}
                      </p>
                    </div>

                    <Link
                      href={`/certificates/tc/${t.studentId}`}
                      className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded-lg"
                    >
                      <FileText size={13} />
                      <span>Print TC</span>
                    </Link>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-400 text-sm">No transfer records found</div>
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Pending OCR Batches & Recent Audit Logs */}
        <div className="space-y-6">
          {/* Pending OCR Verification Callout */}
          <div className="bg-linear-to-br from-indigo-50 to-blue-50 rounded-2xl p-5 border border-indigo-100 shadow-xs">
            <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm mb-2">
              <ScanLine size={18} className="text-indigo-600" />
              <span>GR Migration Status</span>
            </div>
            <p className="text-xs text-indigo-950/80 mb-4">
              Upload physical General Register scans to extract, verify on a split screen, and merge historical students safely.
            </p>
            <div className="bg-white p-3 rounded-xl border border-indigo-100 mb-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Pending Review:</span>
                <span className="font-bold text-indigo-600">{stats?.metrics?.pendingOcrRecordsCount || 0} Records</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Active Batches:</span>
                <span className="font-bold text-slate-800">{stats?.metrics?.pendingBatches || 0} Batches</span>
              </div>
            </div>
            <Link
              href="/import"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all"
            >
              <span>Open Verification Studio</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Live Audit Activity Stream */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-slate-500" />
                <h3 className="text-sm font-bold text-slate-800">Live Audit Activity</h3>
              </div>
              <Link href="/audit" className="text-xs text-blue-600 hover:underline font-semibold">
                Logs
              </Link>
            </div>

            <div className="space-y-3">
              {stats?.recentAuditLogs?.length > 0 ? (
                stats.recentAuditLogs.map((log: any) => (
                  <div key={log.id} className="text-xs space-y-0.5 pb-2 border-b border-slate-50 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{log.userName || 'System'}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-600 line-clamp-2 leading-relaxed">
                      {log.details}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-xs text-center py-4">No audit logs recorded yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
