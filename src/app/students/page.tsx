'use client';

import React, { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthContext';
import {
  Search,
  Filter,
  Download,
  UserPlus,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  UserMinus,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  BookOpen,
} from 'lucide-react';

export default function StudentsDirectoryPage() {
  const { hasPerm } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [standard, setStandard] = useState(searchParams.get('standard') || '');
  const [division, setDivision] = useState(searchParams.get('division') || '');
  const [casteCategory, setCasteCategory] = useState(searchParams.get('casteCategory') || '');
  const [gender, setGender] = useState(searchParams.get('gender') || '');
  const [sortBy, setSortBy] = useState('grNumber');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      if (standard) params.set('standard', standard);
      if (division) params.set('division', division);
      if (casteCategory) params.set('casteCategory', casteCategory);
      if (gender) params.set('gender', gender);
      params.set('page', page.toString());
      params.set('limit', '15');
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);

      const res = await fetch(`/api/students?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students);
        setTotal(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [page, status, standard, division, casteCategory, gender, sortBy, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchStudents();
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (standard) params.set('standard', standard);
    params.set('format', 'csv');
    window.open(`/api/reports/export?${params.toString()}`, '_blank');
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'ACTIVE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'TRANSFERRED':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'WITHDRAWN':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'GRADUATED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Search, filter, and review permanent General Register entries ({total} total records)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasPerm('canExportData') && (
            <button
              onClick={handleExport}
              className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Download size={15} />
              <span>Export CSV</span>
            </button>
          )}

          <Link
            href="/gr-folio"
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <BookOpen size={15} />
            <span>20-Col GR Folio</span>
          </Link>

          {hasPerm('canEditStudents') && (
            <Link
              href="/students/new"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <UserPlus size={15} />
              <span>+ Add Student</span>
            </Link>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Student Name, GR Number, Admission No, Father/Mother Name, Aadhar..."
              className="w-full pl-9 pr-4 py-2 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors shadow-xs"
          >
            Search
          </button>
          {(search || status || standard || division || casteCategory || gender) && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStatus('');
                setStandard('');
                setDivision('');
                setCasteCategory('');
                setGender('');
                setPage(1);
              }}
              className="px-3 py-2 text-xs text-slate-500 hover:text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
            >
              Reset Filters
            </button>
          )}
        </form>

        {/* Faceted Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-2 border-t border-slate-100 text-xs">
          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active (Enrolled)</option>
              <option value="TRANSFERRED">Transferred (Archived)</option>
              <option value="WITHDRAWN">Withdrawn</option>
              <option value="GRADUATED">Graduated (Alumni)</option>
            </select>
          </div>

          {/* Standard / Class */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Standard / Grade</label>
            <select
              value={standard}
              onChange={(e) => {
                setStandard(e.target.value);
                setPage(1);
              }}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Classes</option>
              {['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'].map((c) => (
                <option key={c} value={c}>
                  Std {c}
                </option>
              ))}
            </select>
          </div>

          {/* Division */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Division</label>
            <select
              value={division}
              onChange={(e) => {
                setDivision(e.target.value);
                setPage(1);
              }}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Divisions</option>
              <option value="A">Div A</option>
              <option value="B">Div B</option>
              <option value="C">Div C</option>
            </select>
          </div>

          {/* Caste Category */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Category</label>
            <select
              value={casteCategory}
              onChange={(e) => {
                setCasteCategory(e.target.value);
                setPage(1);
              }}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              <option value="General/Open">General / Open</option>
              <option value="OBC">OBC</option>
              <option value="SC">SC</option>
              <option value="ST">ST</option>
              <option value="EWS">EWS</option>
              <option value="VJNT">VJNT</option>
            </select>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Gender</label>
            <select
              value={gender}
              onChange={(e) => {
                setGender(e.target.value);
                setPage(1);
              }}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Genders</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Students Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">GR Number</th>
                <th className="py-3 px-4">Student Legal Name</th>
                <th className="py-3 px-4">Class &amp; Div</th>
                <th className="py-3 px-4">Date of Birth</th>
                <th className="py-3 px-4">Father / Guardian</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Loading General Register entries...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No student records matching current filters.
                  </td>
                </tr>
              ) : (
                students.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                      <Link href={`/students/${s.id}`} className="hover:underline">
                        {s.grNumber}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <Link href={`/students/${s.id}`} className="hover:text-blue-600">
                        {s.fullName}
                      </Link>
                      <div className="text-[10px] text-slate-400 font-normal">
                        Adm: {s.admissionNumber || '-'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium">
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-slate-800">
                        Std {s.currentClass}-{s.currentDivision}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div>{new Date(s.dob).toLocaleDateString()}</div>
                      <div className="text-[10px] text-slate-400">{s.gender}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div>{s.parent?.fatherName || '-'}</div>
                      <div className="text-[10px] text-slate-400">{s.parent?.fatherPhone || ''}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] bg-slate-100 font-medium">
                        {s.casteCategory || 'General'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${getStatusBadge(s.status)}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                      <Link
                        href={`/students/${s.id}`}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                        title="View Full Profile"
                      >
                        <Eye size={13} />
                        <span>Profile</span>
                      </Link>

                      {s.status === 'ACTIVE' && hasPerm('canTransferStudents') && (
                        <Link
                          href={`/students/${s.id}/transfer`}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-semibold transition-colors border border-amber-200"
                          title="Transfer / Issue TC"
                        >
                          <UserMinus size={13} />
                          <span>Transfer</span>
                        </Link>
                      )}

                      {s.status === 'TRANSFERRED' && (
                        <Link
                          href={`/certificates/tc/${s.id}`}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition-colors border border-blue-200"
                          title="Print Transfer Certificate"
                        >
                          <span>TC</span>
                        </Link>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
          <div>
            Showing page <span className="font-bold">{page}</span> of <span className="font-bold">{totalPages || 1}</span> ({total} total students)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
