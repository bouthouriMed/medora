import { useState } from 'react';
import { useGetDeviceReadingsQuery, useCreateDeviceReadingMutation, useDeleteDeviceReadingMutation, useGetPatientsQuery } from '../api';
import { showToast } from '../components/Toast';
import Modal from '../components/Modal';
import { useTranslation } from 'react-i18next';

const DEVICE_TYPES = [
  { value: 'BLOOD_PRESSURE', label: 'Blood Pressure', unit: 'mmHg', icon: '🫀' },
  { value: 'GLUCOSE', label: 'Glucose', unit: 'mg/dL', icon: '🩸' },
  { value: 'HEART_RATE', label: 'Heart Rate', unit: 'bpm', icon: '💓' },
  { value: 'OXYGEN', label: 'Oxygen Saturation', unit: '%', icon: '🫁' },
  { value: 'TEMPERATURE', label: 'Temperature', unit: '°C', icon: '🌡️' },
  { value: 'WEIGHT', label: 'Weight', unit: 'kg', icon: '⚖️' },
];

export default function RemoteMonitoring() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState({ deviceType: '', patientId: '' });
  const [showModal, setShowModal] = useState(false);
  const { data: readings, isLoading } = useGetDeviceReadingsQuery(filter);
  const { data: patients } = useGetPatientsQuery('');
  const [createReading, { isLoading: creating }] = useCreateDeviceReadingMutation();
  const [deleteReading] = useDeleteDeviceReadingMutation();

  const [form, setForm] = useState({
    patientId: '', deviceType: 'HEART_RATE', value: '', unit: 'bpm', systolic: '', diastolic: '', notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createReading({
        ...form,
        value: parseFloat(form.value),
        systolic: form.systolic ? parseFloat(form.systolic) : undefined,
        diastolic: form.diastolic ? parseFloat(form.diastolic) : undefined,
      }).unwrap();
      setShowModal(false);
      setForm({ patientId: '', deviceType: 'HEART_RATE', value: '', unit: 'bpm', systolic: '', diastolic: '', notes: '' });
      showToast(t('monitoring.readingAdded'), 'success');
    } catch (error) {
      showToast((error as any)?.data?.error || 'Failed', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    await deleteReading(id).unwrap();
    showToast(t('monitoring.readingDeleted'), 'success');
  };

  const abnormalCount = readings?.filter((r: any) => r.isAbnormal).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{t('monitoring.title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t('monitoring.subtitle')}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-gradient text-white px-5 py-2.5 rounded-xl font-medium">
          + {t('monitoring.addReading')}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('monitoring.totalReadings')}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{readings?.length || 0}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('monitoring.abnormal')}</p>
          <p className="text-2xl font-bold text-red-600">{abnormalCount}</p>
        </div>
        {DEVICE_TYPES.slice(0, 2).map(dt => (
          <div key={dt.value} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">{dt.icon} {dt.label}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {readings?.filter((r: any) => r.deviceType === dt.value).length || 0}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filter.deviceType}
          onChange={(e) => setFilter({ ...filter, deviceType: e.target.value })}
          className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
        >
          <option value="">{t('monitoring.allDevices')}</option>
          {DEVICE_TYPES.map(dt => <option key={dt.value} value={dt.value}>{dt.icon} {dt.label}</option>)}
        </select>
        <select
          value={filter.patientId}
          onChange={(e) => setFilter({ ...filter, patientId: e.target.value })}
          className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
        >
          <option value="">{t('monitoring.allPatients')}</option>
          {patients?.map((p: any) => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
        </select>
      </div>

      {/* Readings List */}
      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 skeleton rounded-2xl" />)}</div>
      ) : readings?.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="text-5xl mb-4">📡</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('monitoring.noReadings')}</h3>
          <p className="text-gray-500 dark:text-gray-400">{t('monitoring.noReadingsDesc')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {readings?.map((r: any) => {
            const dt = DEVICE_TYPES.find(d => d.value === r.deviceType);
            return (
              <div key={r.id} className={`bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border ${r.isAbnormal ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10' : 'border-gray-100 dark:border-gray-700'} flex items-center gap-4`}>
                <div className="text-3xl">{dt?.icon || '📊'}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 dark:text-white">{r.patient?.firstName} {r.patient?.lastName}</span>
                    {r.isAbnormal && <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">{t('monitoring.abnormal')}</span>}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {dt?.label}: <span className="font-bold text-gray-900 dark:text-white">
                      {r.deviceType === 'BLOOD_PRESSURE' ? `${r.systolic}/${r.diastolic}` : r.value} {r.unit}
                    </span>
                    {' '} • {new Date(r.recordedAt).toLocaleString()}
                  </p>
                  {r.notes && <p className="text-xs text-gray-400 mt-1">{r.notes}</p>}
                </div>
                <button onClick={() => handleDelete(r.id)} className="text-red-400 hover:text-red-600 p-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Reading Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={t('monitoring.addReading')}>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('monitoring.patient')} *</label>
            <select value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })} required
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl">
              <option value="">{t('monitoring.selectPatient')}</option>
              {patients?.map((p: any) => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('monitoring.deviceType')} *</label>
            <select value={form.deviceType} onChange={(e) => {
              const dt = DEVICE_TYPES.find(d => d.value === e.target.value);
              setForm({ ...form, deviceType: e.target.value, unit: dt?.unit || '' });
            }} className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl">
              {DEVICE_TYPES.map(dt => <option key={dt.value} value={dt.value}>{dt.icon} {dt.label}</option>)}
            </select>
          </div>
          {form.deviceType === 'BLOOD_PRESSURE' ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('monitoring.systolic')} *</label>
                <input type="number" value={form.systolic} onChange={(e) => setForm({ ...form, systolic: e.target.value, value: e.target.value })} required
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl" placeholder="120" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('monitoring.diastolic')} *</label>
                <input type="number" value={form.diastolic} onChange={(e) => setForm({ ...form, diastolic: e.target.value })} required
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl" placeholder="80" />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('monitoring.value')} ({form.unit}) *</label>
              <input type="number" step="0.1" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} required
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl" />
            </div>
          )}
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
              {creating ? t('common.loading') : t('monitoring.addReading')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
