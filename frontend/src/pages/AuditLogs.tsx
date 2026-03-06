import { useState, useEffect } from 'react';
import { Icons } from '../components/Icons';
import { useTranslation } from 'react-i18next';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface AuditLog {
  id: string;
  userId: string | null;
  userName: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  details: any;
  ipAddress: string | null;
  createdAt: string;
}

export default function AuditLogs() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 25;

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(perPage));
      if (actionFilter) params.set('action', actionFilter);
      if (entityFilter) params.set('entityType', entityFilter);

      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/audit-logs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => { fetchLogs(); }, []);
  const refetch = () => { fetchLogs(); };

  // Re-fetch when filters change
  const handleFilterChange = (setter: (v: string) => void, value: string) => {
    setter(value);
    setPage(1);
    setTimeout(fetchLogs, 0);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setTimeout(fetchLogs, 0);
  };

  const actionIcon = (action: string) => {
    switch (action) {
      case 'CREATE': return Icons.plus({ size: 14, className: 'text-green-500' });
      case 'UPDATE': return Icons.edit({ size: 14, className: 'text-blue-500' });
      case 'DELETE': return Icons.trash({ size: 14, className: 'text-red-500' });
      default: return Icons.info({ size: 14, className: 'text-gray-400' });
    }
  };

  const actionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'UPDATE': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'DELETE': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          {t('auditLogs.title')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">{t('auditLogs.subtitle')}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={actionFilter}
          onChange={(e) => handleFilterChange(setActionFilter, e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300"
        >
          <option value="">{t('auditLogs.allActions')}</option>
          <option value="CREATE">CREATE</option>
          <option value="UPDATE">UPDATE</option>
          <option value="DELETE">DELETE</option>
        </select>
        <select
          value={entityFilter}
          onChange={(e) => handleFilterChange(setEntityFilter, e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300"
        >
          <option value="">{t('auditLogs.allEntities')}</option>
          {['PATIENTS', 'APPOINTMENTS', 'INVOICES', 'PRESCRIPTIONS', 'SETTINGS', 'AUTH'].map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
        <button
          onClick={refetch}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          {Icons.refresh({ size: 16 })}
        </button>
        <div className="ml-auto text-sm text-gray-500 dark:text-gray-400 self-center">
          {total} {t('auditLogs.totalEntries')}
        </div>
      </div>

      {/* Logs table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-16 skeleton rounded-xl"></div>)}
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          {Icons.shield({ size: 48, className: 'mx-auto text-gray-300 dark:text-gray-600 mb-4' })}
          <p className="text-gray-500 dark:text-gray-400 font-medium">{t('auditLogs.noLogs')}</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{t('auditLogs.time')}</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{t('auditLogs.user')}</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{t('auditLogs.action')}</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{t('auditLogs.entity')}</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{t('auditLogs.details')}</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                      <span className="text-gray-400 dark:text-gray-500">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {log.userName || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${actionColor(log.action)}`}>
                        {actionIcon(log.action)}
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 font-mono">
                      {log.entityType}
                      {log.entityId && <span className="text-gray-400 dark:text-gray-500 text-xs ml-1">#{log.entityId.slice(0, 8)}</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 dark:text-gray-500">
                      {log.details?.method} {log.details?.path?.slice(0, 40)}
                      {log.ipAddress && <span className="ml-2">{log.ipAddress}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400"
              >
                {t('common.back')}
              </button>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400"
              >
                {t('common.next')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
