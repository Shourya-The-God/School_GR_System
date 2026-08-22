'use client';

import React, { useState } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { School, ShieldAlert, Lock, Mail, ArrowRight, UserCheck } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@school.edu');
  const [password, setPassword] = useState('Admin@123');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const res = await login(email, password);
    if (!res.success) {
      setError(res.error || 'Authentication failed');
      setSubmitting(false);
    }
  };

  const handleQuickLogin = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      {/* Decorative background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 relative z-10">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="h-16 w-16 bg-blue-600/20 text-blue-500 rounded-2xl flex items-center justify-center mb-4 ring-1 ring-blue-500/30 shadow-inner">
            <School size={34} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Digital General Register
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Official School Record & Student Lifecycle Management
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-rose-950/50 border border-rose-800/80 text-rose-300 text-sm flex items-start gap-2">
            <ShieldAlert size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Staff Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@school.edu"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Secure Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-slate-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-sm rounded-lg shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {submitting ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Register System</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Quick Role Fill Presets for Easy Evaluation */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <p className="text-xs text-slate-400 font-semibold mb-3 text-center uppercase tracking-wider">
            Quick Role Switcher (Preloaded Demo Accounts)
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@school.edu', 'Admin@123')}
              className="px-2.5 py-2 text-left bg-slate-800/60 hover:bg-slate-800 border border-purple-900/50 hover:border-purple-500/50 rounded-lg transition-all"
            >
              <div className="text-[11px] font-bold text-purple-300">Super Admin</div>
              <div className="text-[10px] text-slate-400 truncate">admin@school.edu</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('headclerk@school.edu', 'Admin@123')}
              className="px-2.5 py-2 text-left bg-slate-800/60 hover:bg-slate-800 border border-blue-900/50 hover:border-blue-500/50 rounded-lg transition-all"
            >
              <div className="text-[11px] font-bold text-blue-300">School Admin</div>
              <div className="text-[10px] text-slate-400 truncate">headclerk@school.edu</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('operator@school.edu', 'Operator@123')}
              className="px-2.5 py-2 text-left bg-slate-800/60 hover:bg-slate-800 border border-emerald-900/50 hover:border-emerald-500/50 rounded-lg transition-all"
            >
              <div className="text-[11px] font-bold text-emerald-300">Data Operator</div>
              <div className="text-[10px] text-slate-400 truncate">operator@school.edu</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('viewer@school.edu', 'Viewer@123')}
              className="px-2.5 py-2 text-left bg-slate-800/60 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 rounded-lg transition-all"
            >
              <div className="text-[11px] font-bold text-slate-300">Read-only Viewer</div>
              <div className="text-[10px] text-slate-400 truncate">viewer@school.edu</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
