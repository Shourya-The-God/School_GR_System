'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthContext';
import {
  BookOpen,
  Printer,
  Download,
  Filter,
  Search,
  Eye,
  School,
  FileSpreadsheet,
  ArrowLeft,
} from 'lucide-react';

export default function GeneralRegisterFolioPage() {
  const { hasPerm } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [standard, setStandard] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  const fetchFolio = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (standard) params.set('standard', standard);
      if (status) params.set('status', status);
      if (search) params.set('search', search);

      const res = await fetch(`/api/reports/gr-folio?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load GR folio:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFolio();
  }, [standard, status]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFolio();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5 pb-16">
      {/* Top Controls (Hidden on Print) */}
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/students"
            className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span>Official General Register Folio</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-300">
                Government Standard (20-Col)
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              Permanent statutory register format required for educational board inspections and audits
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasPerm('canExportData') && (
            <button
              onClick={() => {
                const params = new URLSearchParams();
                if (standard) params.set('standard', standard);
                if (status) params.set('status', status);
                params.set('format', 'csv');
                window.open(`/api/reports/export?${params.toString()}`, '_blank');
              }}
              className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>
          )}

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Printer size={15} />
            <span>Print Folio Book</span>
          </button>
        </div>
      </div>

      {/* Filter Bar (Hidden on Print) */}
      <div className="no-print bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name or GR number..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-slate-800 text-white font-semibold rounded-lg"
          >
            Filter
          </button>
        </form>

        <div className="flex items-center gap-2">
          <div>
            <select
              value={standard}
              onChange={(e) => setStandard(e.target.value)}
              className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
            >
              <option value="">All Standards</option>
              {['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'].map((c) => (
                <option key={c} value={c}>
                  Std {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Enrolled (Active)</option>
              <option value="TRANSFERRED">Transferred (Archived)</option>
              <option value="GRADUATED">Graduated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Official Printable GR Folio Sheet */}
      <div className="bg-amber-50/20 border-2 border-amber-900/40 rounded-2xl p-6 shadow-md print:border-0 print:p-0 print:bg-white">
        {/* Folio Ledger Header */}
        <div className="text-center pb-4 border-b-2 border-amber-900/60 mb-4 space-y-1">
          <div className="flex items-center justify-center gap-2">
            <School className="text-amber-900" size={24} />
            <h2 className="text-xl md:text-2xl font-serif font-black uppercase text-amber-950 tracking-wider">
              {data?.schoolMetadata?.schoolName || 'Adarsh Vidya Mandir High School'}
            </h2>
          </div>
          <p className="text-xs font-serif text-amber-900 font-semibold">
            GENERAL REGISTER OF PUPILS (MANDATORY GOVERNMENT REGISTER BOOK)
          </p>
          <p className="text-[11px] text-slate-600">
            School Code: {data?.schoolMetadata?.schoolCode || 'AVM-MH-1984'} • Affiliation: {data?.schoolMetadata?.affiliation}
          </p>
        </div>

        {/* 20-Column Table Layout */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] border-collapse border border-slate-800 font-serif">
            <thead>
              <tr className="bg-amber-100/70 text-slate-900 text-center font-bold border-b border-slate-800 divide-x divide-slate-800">
                <th className="p-1.5 w-8">1</th>
                <th className="p-1.5 w-16">2</th>
                <th className="p-1.5 w-16">3</th>
                <th className="p-1.5 w-32">4</th>
                <th className="p-1.5 w-28">5</th>
                <th className="p-1.5 w-24">6</th>
                <th className="p-1.5 w-16">7</th>
                <th className="p-1.5 w-16">8</th>
                <th className="p-1.5 w-16">9</th>
                <th className="p-1.5 w-16">10</th>
                <th className="p-1.5 w-24">11</th>
                <th className="p-1.5 w-20">12</th>
                <th className="p-1.5 w-32">13</th>
                <th className="p-1.5 w-32">14</th>
                <th className="p-1.5 w-20">15</th>
                <th className="p-1.5 w-16">16</th>
                <th className="p-1.5 w-16">17</th>
                <th className="p-1.5 w-20">18</th>
                <th className="p-1.5 w-32">19</th>
                <th className="p-1.5 w-20">20</th>
              </tr>
              <tr className="bg-amber-50 text-[10px] uppercase font-bold text-slate-900 border-b-2 border-slate-800 divide-x divide-slate-800">
                <th className="p-1.5 text-center">Sr. No</th>
                <th className="p-1.5 text-center">G.R. No</th>
                <th className="p-1.5 text-center">Adm No</th>
                <th className="p-1.5">Pupil's Full Name</th>
                <th className="p-1.5">Father's Name</th>
                <th className="p-1.5">Mother's Name</th>
                <th className="p-1.5 text-center">Nation</th>
                <th className="p-1.5">Religion</th>
                <th className="p-1.5">Category</th>
                <th className="p-1.5">Sub-caste</th>
                <th className="p-1.5">Birth Place</th>
                <th className="p-1.5 text-center">DOB (Figs)</th>
                <th className="p-1.5">DOB in Words</th>
                <th className="p-1.5">Previous School Attended</th>
                <th className="p-1.5 text-center">Adm Date</th>
                <th className="p-1.5 text-center">Adm Std</th>
                <th className="p-1.5 text-center">Cur Std</th>
                <th className="p-1.5 text-center">Leaving Date</th>
                <th className="p-1.5">Reason for Leaving</th>
                <th className="p-1.5 text-center">T.C. No</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-400 text-slate-900 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={20} className="p-8 text-center text-slate-500 font-sans">
                    Loading General Register folio rows...
                  </td>
                </tr>
              ) : data?.folioRows?.length === 0 ? (
                <tr>
                  <td colSpan={20} className="p-8 text-center text-slate-500 font-sans">
                    No records found matching filters.
                  </td>
                </tr>
              ) : (
                data?.folioRows?.map((row: any) => (
                  <tr
                    key={row.col2_grNumber}
                    className={`divide-x divide-slate-300 hover:bg-amber-50/50 transition-colors ${
                      row.status === 'TRANSFERRED' ? 'bg-amber-50/30' : ''
                    }`}
                  >
                    <td className="p-1.5 text-center font-mono">{row.col1_serialNo}</td>
                    <td className="p-1.5 text-center font-mono font-bold text-blue-900">
                      <Link href={`/students/${row.studentId}`} className="hover:underline">
                        {row.col2_grNumber}
                      </Link>
                    </td>
                    <td className="p-1.5 text-center font-mono text-[10px]">{row.col3_admissionNumber}</td>
                    <td className="p-1.5 font-bold">
                      <Link href={`/students/${row.studentId}`} className="hover:text-blue-800">
                        {row.col4_studentFullName}
                      </Link>
                    </td>
                    <td className="p-1.5">{row.col5_fatherName}</td>
                    <td className="p-1.5">{row.col6_motherName}</td>
                    <td className="p-1.5 text-center">{row.col7_nationality}</td>
                    <td className="p-1.5">{row.col8_religion}</td>
                    <td className="p-1.5">{row.col9_casteCategory}</td>
                    <td className="p-1.5">{row.col10_subCaste}</td>
                    <td className="p-1.5">{row.col11_placeOfBirth}</td>
                    <td className="p-1.5 text-center font-mono whitespace-nowrap">{row.col12_dobFigures}</td>
                    <td className="p-1.5 text-[10px] leading-tight">{row.col13_dobWords}</td>
                    <td className="p-1.5 text-[10px]">{row.col14_previousSchool}</td>
                    <td className="p-1.5 text-center font-mono whitespace-nowrap">{row.col15_admissionDate}</td>
                    <td className="p-1.5 text-center font-bold">{row.col16_admittedClass}</td>
                    <td className="p-1.5 text-center font-bold">{row.col17_currentClass}</td>
                    <td className="p-1.5 text-center font-mono whitespace-nowrap">{row.col18_leavingDate}</td>
                    <td className="p-1.5 text-[10px]">{row.col19_reasonForLeaving}</td>
                    <td className="p-1.5 text-center font-mono font-bold text-amber-900 whitespace-nowrap">
                      {row.col20_tcNumber}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Signature Blocks for Printing */}
        <div className="pt-10 grid grid-cols-3 gap-6 text-center text-xs font-serif text-slate-800 print:pt-16">
          <div>
            <div className="border-t border-slate-700 w-48 mx-auto pt-1 font-bold">
              Class Teacher
            </div>
          </div>
          <div>
            <div className="border-t border-slate-700 w-48 mx-auto pt-1 font-bold">
              Head Clerk / Registrar
            </div>
          </div>
          <div>
            <div className="border-t border-slate-700 w-48 mx-auto pt-1 font-bold">
              Headmaster / Principal
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
