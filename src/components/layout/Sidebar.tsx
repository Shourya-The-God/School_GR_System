'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthContext';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  FileText,
  ScanLine,
  UserMinus,
  History,
  Settings,
  LogOut,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Award,
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout, hasPerm } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  if (pathname === '/login') return null;

  const navItems = [
    {
      name: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      active: pathname === '/',
    },
    {
      name: 'Student Directory',
      href: '/students',
      icon: Users,
      active: pathname === '/students' && !pathname.includes('status='),
    },
    {
      name: 'Add Student',
      href: '/students/new',
      icon: UserPlus,
      active: pathname === '/students/new',
      hidden: !hasPerm('canEditStudents'),
    },
    {
      name: 'Official GR Folio',
      href: '/gr-folio',
      icon: BookOpen,
      active: pathname === '/gr-folio',
      badge: '20-Col',
    },
    {
      name: 'Transfers & Archived',
      href: '/students?status=TRANSFERRED',
      icon: UserMinus,
      active: pathname === '/students' && pathname.includes('status=TRANSFERRED'),
    },
    {
      name: 'GR Import & OCR',
      href: '/import',
      icon: ScanLine,
      active: pathname.startsWith('/import'),
      badge: 'AI/OCR',
    },
    {
      name: 'Audit Trail',
      href: '/audit',
      icon: History,
      active: pathname === '/audit',
      hidden: !hasPerm('canViewAuditLogs'),
    },
    {
      name: 'System Settings',
      href: '/settings',
      icon: Settings,
      active: pathname === '/settings',
    },
  ];

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'SCHOOL_ADMIN':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'DATA_ENTRY_OPERATOR':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <aside
      className={`no-print relative flex flex-col bg-slate-900 text-slate-100 transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      } min-h-screen border-r border-slate-800 shrink-0 select-none z-30`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-slate-800">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md font-bold text-lg">
            GR
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-base tracking-tight text-white truncate">
                Digital GR System
              </span>
              <span className="text-xs text-slate-400 truncate">
                {process.env.NEXT_PUBLIC_SCHOOL_CODE || 'AVM-MH-1984'}
              </span>
            </div>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          if (item.hidden) return null;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                item.active
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
              title={collapsed ? item.name : undefined}
            >
              <Icon size={20} className={item.active ? 'text-white' : 'text-slate-400 group-hover:text-white'} />
              {!collapsed && (
                <div className="flex items-center justify-between w-full">
                  <span className="truncate">{item.name}</span>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider ${
                        item.active ? 'bg-blue-700 text-white' : 'bg-slate-800 text-blue-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/50">
        {!collapsed ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user?.name || 'Loading...'}</p>
                <p className="text-xs text-slate-400 truncate">{user?.designation || user?.email}</p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold ${getRoleBadgeColor(
                  user?.role
                )}`}
              >
                {user?.role?.replace('_', ' ') || 'USER'}
              </span>
              <button
                onClick={logout}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-medium transition-colors"
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={logout}
              title="Logout"
              className="p-2 text-rose-400 hover:bg-slate-800 rounded-lg"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
