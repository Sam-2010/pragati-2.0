"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ShieldCheck, Loader2, AlertTriangle, FileText, Clock, User, Activity } from 'lucide-react';

interface AuditLog {
  id: string;
  application_id: string;
  action_taken: string;
  performed_by: string;
  ip_address: string;
  details: Record<string, any>;
  created_at: string;
}

const ACTION_STYLES: Record<string, { label: string; color: string; bg: string; border: string }> = {
  'MANUAL_OVERRIDE': { label: 'Override', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
  'DIRECT_APPROVAL': { label: 'Approved', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  'STATUS_UPDATE':   { label: 'Updated', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
};

export default function AuditTrailTable() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) setLogs(data);
      setLoading(false);
    }
    fetchLogs();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
        <Loader2 className="animate-spin" size={32} />
        <p className="text-xs font-medium">Loading Audit Ledger...</p>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="border-2 border-dashed border-slate-200 rounded-2xl p-16 text-center flex flex-col items-center gap-3">
        <Activity size={28} className="text-slate-300" />
        <p className="text-sm font-semibold text-slate-500">No audit entries yet.</p>
        <p className="text-xs text-slate-400">Actions will appear here once applications are processed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-indigo-600" />
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Immutable Audit Ledger</h2>
        </div>
        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded">
          {logs.length} entries
        </span>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800 text-white">
              <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider">Timestamp</th>
              <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider">Application</th>
              <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider">Action</th>
              <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider">Performed By</th>
              <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono text-xs">
            {logs.map((log) => {
              const style = ACTION_STYLES[log.action_taken] || ACTION_STYLES['STATUS_UPDATE'];
              return (
                <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Clock size={12} className="flex-shrink-0" />
                      <span>{new Date(log.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <FileText size={12} className="flex-shrink-0 text-slate-400" />
                      <span className="truncate max-w-[120px]" title={log.application_id}>
                        {log.application_id.slice(0, 8)}...
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${style.bg} ${style.color} ${style.border}`}>
                      {log.action_taken === 'MANUAL_OVERRIDE' && <AlertTriangle size={10} />}
                      {style.label}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <User size={12} className="flex-shrink-0" />
                      <span>{log.performed_by}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 max-w-[200px]">
                    <span className="truncate block" title={log.details?.justification || '—'}>
                      {log.details?.justification?.slice(0, 50) || '—'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer seal */}
      <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 pt-2">
        <ShieldCheck size={10} />
        <span>PRAGATI Transparency Engine — Tamper-proof Administrative Record</span>
      </div>
    </div>
  );
}
