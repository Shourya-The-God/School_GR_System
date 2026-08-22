'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthContext';
import {
  History,
  Search,
  Filter,
  Eye,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Clock,
  UserCheck,
  UserMinus,
  FileSpreadsheet,
  ScanLine,
  Lock,
  ArrowRight,
} from 'lucide-react';

export default function AuditTrailPage() {
  const { hasPerm } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [actionType, setActionType] = useState('');
  const [entityType, setEntityType] = useState('');
  const [search, setSearch] = useState('');

  // Selected Log Diff Modal
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (actionType) params.set('actionType', actionType);
      if (entityType) params.set('entityType', entityType);
      if (search) params.set('search', search);
      params.set('page', page.toString());
      params.set('limit', '20');

      const res = await fetch(`/api/audit-logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
        setTotal(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [page, actionType, entityType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchAuditLogs();
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'TRANSFER':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'OCR_APPROVE':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'OCR_REJECT':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'DELETE_ATTEMPT':
        return 'bg-red-200 text-red-900 border-red-400 font-bold';
      case 'EXPORT':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'LOGIN':
      case 'LOGOUT':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="space-y-5 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <History className="text-purple-600" />
            <span>Immutable Audit Trail</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographically sealed activity log of all modifications, OCR approvals, transfers, and exports ({total} events recorded)
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by User Name, GR Number, Entity Identifier, Details..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500 transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800"
          >
            Search Logs
          </button>
        </form>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Action Type</label>
            <select
              value={actionType}
              onChange={(e) => {
                setActionType(e.target.value);
                setPage(1);
              }}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
            >
              <option value="">All Actions</option>
              <option value="CREATE">Record Creation</option>
              <option value="UPDATE">Record Update</option>
              <option value="TRANSFER">Student Transfer &amp; TC</option>
              <option value="OCR_APPROVE">OCR Staged Record Approval</option>
              <option value="OCR_REJECT">OCR Staged Record Rejection</option>
              <option value="IMPORT_BATCH">GR Import Batch</option>
              <option value="DELETE_ATTEMPT">Blocked Deletion Attempt</option>
              <option value="EXPORT">Data Export</option>
              <option value="LOGIN">User Login</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Entity Type</label>
            <select
              value={entityType}
              onChange={(e) => {
                setEntityType(e.target.value);
                setPage(1);
              }}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
            >
              <option value="">All Entities</option>
              <option value="STUDENT">Student Record</option>
              <option value="TRANSFER">Transfer Record</option>
              <option value="IMPORT_BATCH">Import Batch</option>
              <option value="USER">User Account</option>
              <option value="REPORT">Report / Export</option>
              <option value="AUTH">Authentication</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">User (Actor)</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Activity Description</th>
                <th className="py-3 px-4 text-right">Details &amp; Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Loading audit events...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No audit records matching current search.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div>{log.userName || 'System / Auto'}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{log.userRole}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getActionColor(log.actionType)}`}>
                        {log.actionType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      <div>{log.entityType}</div>
                      {log.entityIdentifier && (
                        <div className="text-[10px] text-slate-400 truncate max-w-xs">{log.entityIdentifier}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 max-w-md text-slate-600 leading-relaxed">
                      {log.details}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {(log.previousValueJson || log.newValueJson) && (
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold flex items-center gap-1 ml-auto border border-purple-200"
                        >
                          <Eye size={13} />
                          <span>View Diff</span>
                        </button>
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
            Showing page <span className="font-bold">{page}</span> of <span className="font-bold">{totalPages || 1}</span> ({total} total audit logs)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Visual JSON State Diff Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 border border-slate-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <History className="text-purple-600" size={20} />
                <h3 className="text-base font-bold text-slate-900">
                  Audit Event State Diff
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <p><strong>Actor:</strong> {selectedLog.userName} ({selectedLog.userRole})</p>
              <p><strong>Timestamp:</strong> {new Date(selectedLog.createdAt).toLocaleString()}</p>
              <p><strong>Description:</strong> {selectedLog.details}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 overflow-y-auto pt-2">
              {/* Previous State */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <span className="text-[10px] font-bold text-rose-600 uppercase block mb-1">
                  - Previous State
                </span>
                <pre className="text-[10px] font-mono text-slate-700 bg-white p-2.5 rounded-lg border border-slate-100 overflow-x-auto whitespace-pre-wrap">
                  {selectedLog.previousValueJson ? JSON.stringify(JSON.parse(selectedLog.previousValueJson), null, 2) : '(None - Initial State)'}
                </pre>
              </div>

              {/* New State */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <span className="text-[10px] font-bold text-emerald-600 uppercase block mb-1">
                  + New State (Applied)
                </span>
                <pre className="text-[10px] font-mono text-slate-700 bg-white p-2.5 rounded-lg border border-slate-100 overflow-x-auto whitespace-pre-wrap">
                  {selectedLog.newValueJson ? JSON.stringify(JSON.parse(selectedLog.newValueJson), null, 2) : '(None)'}
                </pre>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
