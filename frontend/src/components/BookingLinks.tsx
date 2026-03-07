import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../store/hooks';
import { useGetPatientsQuery } from '../api';
import { Icons } from '../components/Icons';
import { showToast } from '../components/Toast';

export function BookingLinks() {
  const { t } = useTranslation();
  const { user } = useAppSelector((state) => state.auth);
  const { data: patients } = useGetPatientsQuery({ includeArchived: false });
  const [showModal, setShowModal] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const clinicId = user?.clinicId;
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const generalBookingUrl = `${baseUrl}/book/${clinicId}`;
  const patientBookingUrl = selectedPatientId 
    ? `${baseUrl}/book/${clinicId}?patientId=${selectedPatientId}`
    : '';

  const handleCopyGeneral = async () => {
    try {
      await navigator.clipboard.writeText(generalBookingUrl);
      showToast(t('other.linkCopied'), 'success');
    } catch {
      showToast(t('other.failedToCopy'), 'error');
    }
  };

  const handleCopyPatient = async () => {
    if (!selectedPatientId) {
      showToast(t('other.selectPatientFirst'), 'error');
      return;
    }
    try {
      await navigator.clipboard.writeText(patientBookingUrl);
      showToast(t('other.linkCopied'), 'success');
    } catch {
      showToast(t('other.failedToCopy'), 'error');
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            🔗 {t('other.onlineBooking')}
          </h3>
        </div>
        
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {t('other.generateBookingLinks')}
        </p>

        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-blue-900 dark:text-blue-200">
                {t('other.generalBookingLink')}
              </span>
              <button
                onClick={handleCopyGeneral}
                className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                {t('common.copy')}
              </button>
            </div>
            <p className="text-xs text-blue-700 dark:text-blue-300 truncate">
              {generalBookingUrl}
            </p>
            <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
              {t('other.generalBookingDesc')}
            </p>
          </div>

          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-purple-900 dark:text-purple-200">
                {t('other.patientBookingLink')}
              </span>
              <button
                onClick={() => setShowModal(true)}
                className="text-xs px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                {t('common.generate')}
              </button>
            </div>
            {selectedPatientId && (
              <p className="text-xs text-purple-700 dark:text-purple-300 truncate">
                {patientBookingUrl}
              </p>
            )}
            <p className="text-xs text-purple-500 dark:text-purple-400 mt-1">
              {t('other.patientBookingDesc')}
            </p>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('other.selectPatient')}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <Icons.x size={20} />
              </button>
            </div>

            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4"
            >
              <option value="">{t('common.select')} {t('other.patient')}</option>
              {patients?.map((patient: any) => (
                <option key={patient.id} value={patient.id}>
                  {patient.firstName} {patient.lastName}
                </option>
              ))}
            </select>

            {selectedPatientId && (
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg mb-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('other.bookingLink')}:</p>
                <p className="text-sm text-gray-900 dark:text-white break-all">{patientBookingUrl}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleCopyPatient}
                disabled={!selectedPatientId}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl transition-colors"
              >
                {t('common.copy')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
