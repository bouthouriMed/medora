import { useState } from 'react';
import { useGetVideoSessionsQuery, useCreateVideoSessionMutation, useUpdateVideoSessionMutation, useGetPatientsQuery, useGetUsersQuery } from '../api';
import { showToast } from '../components/Toast';
import Modal from '../components/Modal';
import { useTranslation } from 'react-i18next';

const STATUS_STYLES: Record<string, string> = {
  WAITING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  CANCELLED: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
};

export default function Telemedicine() {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const { data: sessions, isLoading } = useGetVideoSessionsQuery(statusFilter ? { status: statusFilter } : {});
  const { data: patients } = useGetPatientsQuery('');
  const { data: users } = useGetUsersQuery(undefined);
  const [createSession, { isLoading: creating }] = useCreateVideoSessionMutation();
  const [updateSession] = useUpdateVideoSessionMutation();

  const [form, setForm] = useState({ patientId: '', doctorId: '', notes: '' });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const session = await createSession(form).unwrap();
      setShowModal(false);
      setForm({ patientId: '', doctorId: '', notes: '' });
      showToast(t('telemedicine.sessionCreated'), 'success');
      // Copy room link
      const link = `${window.location.origin}/video/${session.roomId}`;
      await navigator.clipboard?.writeText(link);
      showToast(t('telemedicine.linkCopied'), 'success');
    } catch (error) {
      showToast((error as any)?.data?.error || 'Failed', 'error');
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateSession({ id, status }).unwrap();
      showToast(`Session ${status.toLowerCase()}`, 'success');
    } catch (error) {
      showToast('Failed to update', 'error');
    }
  };

  const doctors = users?.filter((u: any) => u.role === 'DOCTOR') || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{t('telemedicine.title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t('telemedicine.subtitle')}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-gradient text-white px-5 py-2.5 rounded-xl font-medium">
          + {t('telemedicine.newSession')}
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 flex-wrap">
        {['', 'WAITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
            {s || t('common.all')}
          </button>
        ))}
      </div>

      {/* Sessions */}
      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 skeleton rounded-2xl" />)}</div>
      ) : sessions?.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="text-5xl mb-4">📹</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('telemedicine.noSessions')}</h3>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions?.map((s: any) => (
            <div key={s.id} className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-lg font-bold">
                    {s.patient?.firstName?.[0]}{s.patient?.lastName?.[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {s.patient?.firstName} {s.patient?.lastName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('telemedicine.doctor')}: Dr. {s.doctor?.firstName} {s.doctor?.lastName}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(s.createdAt).toLocaleString()}
                      {s.duration && ` • ${s.duration} min`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${STATUS_STYLES[s.status]}`}>
                    {s.status}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                {s.status === 'WAITING' && (
                  <>
                    <button onClick={() => handleStatusChange(s.id, 'IN_PROGRESS')}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-xl font-medium hover:bg-blue-700">
                      {t('telemedicine.startCall')}
                    </button>
                    <button onClick={() => handleStatusChange(s.id, 'CANCELLED')}
                      className="px-4 py-2 text-red-600 text-sm rounded-xl font-medium hover:bg-red-50 dark:hover:bg-red-900/20">
                      {t('common.cancel')}
                    </button>
                  </>
                )}
                {s.status === 'IN_PROGRESS' && (
                  <button onClick={() => handleStatusChange(s.id, 'COMPLETED')}
                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-xl font-medium hover:bg-green-700">
                    {t('telemedicine.endCall')}
                  </button>
                )}
                <button onClick={async () => {
                  await navigator.clipboard?.writeText(`${window.location.origin}/video/${s.roomId}`);
                  showToast(t('telemedicine.linkCopied'), 'success');
                }} className="px-4 py-2 text-gray-600 dark:text-gray-400 text-sm rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700">
                  {t('telemedicine.copyLink')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Session Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={t('telemedicine.newSession')}>
        <form onSubmit={handleCreate} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('monitoring.patient')} *</label>
            <select value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })} required
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl">
              <option value="">{t('monitoring.selectPatient')}</option>
              {patients?.map((p: any) => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('telemedicine.doctor')}</label>
            <select value={form.doctorId} onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl">
              <option value="">{t('telemedicine.currentDoctor')}</option>
              {doctors.map((d: any) => <option key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('common.notes')}</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 font-medium">
              {t('common.cancel')}
            </button>
            <button type="submit" disabled={creating} className="flex-1 btn-gradient text-white py-3 rounded-xl font-medium disabled:opacity-50">
              {creating ? t('common.loading') : t('telemedicine.createAndShare')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
