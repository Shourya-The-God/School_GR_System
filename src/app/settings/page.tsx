'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import {
  Settings,
  Users,
  ShieldCheck,
  Building,
  Key,
  Plus,
  CheckCircle,
  AlertTriangle,
  Lock,
  Database,
  FileSpreadsheet,
} from 'lucide-react';

export default function SettingsPage() {
  const { user, hasPerm } = useAuth();
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // New User Form
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'DATA_ENTRY_OPERATOR',
    designation: '',
    phone: '',
    password: '',
  });
  const [userError, setUserError] = useState('');
  const [userSuccess, setUserSuccess] = useState('');
  const [creatingUser, setCreatingUser] = useState(false);

  const fetchUsers = async () => {
    if (!hasPerm('canManageUsers')) return;
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsersList(data.users);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError('');
    setUserSuccess('');
    setCreatingUser(true);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create user account');

      setUserSuccess(`Staff account created for ${newUser.name} with role ${newUser.role}`);
      setShowAddUserModal(false);
      setNewUser({
        name: '',
        email: '',
        role: 'DATA_ENTRY_OPERATOR',
        designation: '',
        phone: '',
        password: '',
      });
      fetchUsers();
    } catch (err: any) {
      setUserError(err.message);
    } finally {
      setCreatingUser(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="text-blue-600" />
          <span>System Settings &amp; Governance</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          School institutional profile, role-based access control, and statutory data protection policies
        </p>
      </div>

      {/* School Information Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Building className="text-blue-600" size={18} />
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            School Institution Profile
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Institution Name</span>
            <input
              type="text"
              readOnly
              value={process.env.NEXT_PUBLIC_SCHOOL_NAME || 'Adarsh Vidya Mandir High School'}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800"
            />
          </div>

          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">School Register Code</span>
            <input
              type="text"
              readOnly
              value={process.env.NEXT_PUBLIC_SCHOOL_CODE || 'AVM-MH-1984'}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-blue-700"
            />
          </div>

          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Affiliation Board</span>
            <input
              type="text"
              readOnly
              value="State Board of Secondary & Higher Secondary Education"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            />
          </div>
        </div>
      </div>

      {/* User Management Section (Super Admin only) */}
      {hasPerm('canManageUsers') && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Users className="text-purple-600" size={18} />
              <div>
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  Authorized Staff Accounts &amp; RBAC Permissions
                </h2>
                <p className="text-[11px] text-slate-400">
                  Assign administrative, OCR verification, or read-only roles
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAddUserModal(true)}
              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Plus size={14} />
              <span>+ Add Staff Account</span>
            </button>
          </div>

          {userSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle size={15} className="text-emerald-600 shrink-0" />
              <span>{userSuccess}</span>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Staff Name</th>
                  <th className="py-2.5 px-3">Email Address</th>
                  <th className="py-2.5 px-3">System Role</th>
                  <th className="py-2.5 px-3">Designation</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Last Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-bold text-slate-900">{u.name}</td>
                    <td className="py-3 px-3 font-mono text-slate-600">{u.email}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{u.designation || '-'}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                        Active
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[11px] text-slate-400">
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Statutory Data Protection & Legal Notice */}
      <div className="bg-linear-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200 shadow-xs space-y-3 text-xs text-blue-950">
        <div className="flex items-center gap-2 font-bold text-blue-900 text-sm">
          <ShieldCheck size={18} className="text-blue-600" />
          <span>Statutory General Register Legal Compliance &amp; DPDP Policy</span>
        </div>
        <div className="space-y-2 text-[11px] text-blue-900/85 leading-relaxed">
          <p>
            <strong>1. Mandatory Permanent Record:</strong> Under statutory state school codes and educational acts, the General Register is a permanent institutional document that must be maintained in perpetuity. The system enforces strict zero-hard-deletion guards.
          </p>
          <p>
            <strong>2. Transfer Certificate Archival:</strong> When a student departs the school, a formal Transfer Certificate is recorded with leaving date and reason, archiving the active enrollment while preserving historical register folios.
          </p>
          <p>
            <strong>3. Immutable Audit Logging:</strong> In compliance with data governance standards, every record creation, edit diff, OCR verification, and export action is cryptographically recorded with actor details and timestamps.
          </p>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add Authorized Staff Account</h3>
              <button onClick={() => setShowAddUserModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            {userError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
                {userError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Staff Name *</label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="e.g. Meenakshi S. Kulkarni"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="name@school.edu"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">System Role *</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                >
                  <option value="DATA_ENTRY_OPERATOR">Data Entry Operator (Can add/edit & verify OCR)</option>
                  <option value="SCHOOL_ADMIN">School Administrator (Can manage students & issue TC)</option>
                  <option value="SUPER_ADMIN">Super Admin (Full system control & staff management)</option>
                  <option value="VIEWER">Read-only Viewer (Cannot modify records)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Designation</label>
                <input
                  type="text"
                  value={newUser.designation}
                  onChange={(e) => setNewUser({ ...newUser, designation: e.target.value })}
                  placeholder="e.g. Senior Clerk, Examination Incharge"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Temporary Password *</label>
                <input
                  type="password"
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingUser}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  {creatingUser ? 'Creating Account...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
