import { useState } from 'react';
import { useGetInsuranceClaimsQuery, useCreateInsuranceClaimMutation, useUpdateInsuranceClaimMutation, useDeleteInsuranceClaimMutation, useGetInsuranceStatsQuery, useGetPatientsQuery } from '../api';
import { useTranslation } from 'react-i18next';

export default function Insurance() {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { data: claims = [], isLoading } = useGetInsuranceClaimsQuery(statusFilter ? { status: statusFilter } : undefined);
  const { data: stats } = useGetInsuranceStatsQuery(undefined);
  const { data: patients = [] } = useGetPatientsQuery(undefined);
  const [createClaim] = useCreateInsuranceClaimMutation();
  const [updateClaim] = useUpdateInsuranceClaimMutation();
  const [deleteClaim] = useDeleteInsuranceClaimMutation();

  const [form, setForm] = useState({ patientId: '', insuranceProvider: '', policyNumber: '', claimAmount: '', notes: '' });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createClaim({ ...form, claimAmount: parseFloat(form.claimAmount) });
    setShowForm(false);
    setForm({ patientId: '', insuranceProvider: '', policyNumber: '', claimAmount: '', notes: '' });
  };

  const statCards = [
    { label: t('insurance.pendingClaims'), value: stats?.pendingCount || 0, amount: `$${(stats?.pendingAmount || 0).toLocaleString()}`, color: 'yellow' },
    { label: t('insurance.approved'), value: stats?.approved || 0, amount: `$${(stats?.approvedAmount || 0).toLocaleString()}`, color: 'green' },
    { label: t('insurance.denied'), value: stats?.denied || 0, amount: '', color: 'red' },
    { label: t('insurance.submitted'), value: stats?.submitted || 0, amount: '', color: 'blue' },
  ];

  const statusColors: Record<string, string> = {
    SUBMITTED: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    IN_REVIEW: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    APPROVED: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    DENIED: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{t('insurance.title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t('insurance.subtitle')}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium">
          {t('insurance.newClaim')}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
            <p className="text-sm text-gray-500 dark:text-gray-400">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{s.value}</p>
            {s.amount && <p className="text-xs text-gray-400 mt-0.5">{s.amount}</p>}
          </div>
        ))}
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 flex-wrap">
        {['', 'SUBMITTED', 'IN_REVIEW', 'APPROVED', 'DENIED'].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
            {s || t('common.all')}
          </button>
        ))}
      </div>

      {/* Claims List */}
      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 skeleton rounded-xl"></div>)}</div>
      ) : (claims as any[]).length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          <span className="text-5xl block mb-3">🏥</span>
          <p className="text-gray-500 dark:text-gray-400 font-medium">{t('insurance.noClaims')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(claims as any[]).map((claim: any) => (
            <div key={claim.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900 dark:text-white">{claim.patient?.firstName} {claim.patient?.lastName}</p>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[claim.status] || ''}`}>{claim.status}</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{claim.insuranceProvider} {claim.policyNumber ? `- ${claim.policyNumber}` : ''}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{new Date(claim.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">${claim.claimAmount?.toLocaleString()}</p>
                    {claim.approvedAmount != null && <p className="text-xs text-green-600">{t('insurance.approved')}: ${claim.approvedAmount.toLocaleString()}</p>}
                  </div>
                  {(claim.status === 'SUBMITTED' || claim.status === 'IN_REVIEW') && (
                    <div className="flex gap-1">
                      <button onClick={() => updateClaim({ id: claim.id, status: 'APPROVED', approvedAmount: claim.claimAmount })}
                        className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200">
                        {t('insurance.approve')}
                      </button>
                      <button onClick={() => updateClaim({ id: claim.id, status: 'DENIED' })}
                        className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200">
                        {t('insurance.deny')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {claim.denialReason && <p className="mt-2 text-sm text-red-500">{t('insurance.denialReason')}: {claim.denialReason}</p>}
            </div>
          ))}
        </div>
      )}

      {/* New Claim Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('insurance.newClaim')}</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('common.selectPatient')}</label>
                <select value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })} required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  <option value="">{t('common.selectPatient')}</option>
                  {(patients as any[]).map((p: any) => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('insurance.provider')}</label>
                <input type="text" value={form.insuranceProvider} onChange={(e) => setForm({ ...form, insuranceProvider: e.target.value })} required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('insurance.policyNumber')}</label>
                  <input type="text" value={form.policyNumber} onChange={(e) => setForm({ ...form, policyNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('insurance.claimAmount')}</label>
                  <input type="number" step="0.01" value={form.claimAmount} onChange={(e) => setForm({ ...form, claimAmount: e.target.value })} required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('common.notes')}</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700">{t('common.cancel')}</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700">{t('common.submit')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
