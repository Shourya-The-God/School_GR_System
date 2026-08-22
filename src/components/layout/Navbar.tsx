'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Bell, School, Sparkles, Plus, FileSpreadsheet } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthContext';

export default function Navbar() {
  const [query, setQuery] = useState('');
  const router = useRouter();
  const { user, hasPerm } = useAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/students?search=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <header className="no-print h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      {/* School Info Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-blue-50 text-blue-700">
          <School size={20} />
        </div>
        <div>
          <h1 className="text-sm font-bold text-slate-800 leading-tight">
            {process.env.NEXT_PUBLIC_SCHOOL_NAME || 'Adarsh Vidya Mandir High School'}
          </h1>
          <p className="text-xs text-slate-500">
            Official General Register of Pupils (Mandatory Permanent Record)
          </p>
        </div>
      </div>

      {/* Center Search Bar */}
      <div className="flex-1 max-w-md mx-6">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by Student Name, GR No, Father's Name, Admission No..."
            className="w-full pl-9 pr-4 py-2 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
          />
        </form>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex items-center gap-2">
        <Link
          href="/gr-folio"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-300"
          title="Open 20-Column General Register Book"
        >
          <FileSpreadsheet size={15} />
          <span>GR Book</span>
        </Link>

        {hasPerm('canEditStudents') && (
          <Link
            href="/students/new"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
          >
            <Plus size={15} />
            <span>Add Student</span>
          </Link>
        )}
      </div>
    </header>
  );
}
