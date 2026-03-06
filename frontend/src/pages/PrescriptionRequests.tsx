import { useState } from 'react';
import { useGetPrescriptionRequestsQuery, useReviewPrescriptionRequestMutation } from '../api';
import { Icons } from '../components/Icons';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { useTranslation } from 'react-i18next';

export default function PrescriptionRequests() {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState('');
  const [reviewModal, setReviewModal] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const { data: requests = [], isLoading } = useGetPrescriptionRequestsQuery(
    statusFilter ? { status: statusFilter } : {}
  );
  const [reviewRequest, { isLoading: isReviewing }] = useReviewPrescriptionRequestMutation();

  const handleReview = async (status: 'APPROVED' | 'DENIED') => {
    if (!reviewModal) return;
    try {
      await reviewRequest({
        id: reviewModal.id,
        status,
        reviewNotes,
        ...(status === 'APPROVED' ? { dosage: dosage || 'As prescribed', frequency: frequency || 'As needed' } : {}),
      }).unwrap();
      setToast({ message: t('prescriptionRequests.reviewed'), type: 'success' });
      setReviewModal(null);
      setReviewNotes('');
      setDosage('');
      setFrequency('');
    } catch {
      setToast({ message: t('prescriptionRequests.reviewFailed'), type: 'error' });
    }
  };

  const statusColors: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    APPROVED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    DENIED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  };

  const pendingCount = (requests as any[]).filter((r: any) => r.status === 'PENDING').length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 skeleton rounded-lg"></div>
        {[1, 2, 3].map((i) => <div key={i} className="h-24 skeleton rounded-xl"></div>)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {t('prescriptionRequests.title')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t('prescriptionRequests.subtitle')}</p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
            {Icons.alert({ size: 18, className: 'text-amber-500' })}
            <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
              {pendingCount} {t('prescriptionRequests.pendingReview')}
            </span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['', 'PENDING', 'APPROVED', 'DENIED'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === s
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {s === '' ? t('common.all') : t(`prescriptionRequests.status${s.charAt(0) + s.slice(1).toLowerCase()}`)}
          </button>
        ))}
      </div>

      {/* Requests list */}
      {(requests as any[]).length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          {Icons.prescription({ size: 48, className: 'mx-auto text-gray-300 dark:text-gray-600 mb-4' })}
          <p className="text-gray-500 dark:text-gray-400 font-medium">{t('prescriptionRequests.noRequests')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(requests as any[]).map((req: any) => (
            <div
              key={req.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 sm:p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                    {req.patient?.firstName?.[0]}{req.patient?.lastName?.[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {req.patient?.firstName} {req.patient?.lastName}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                      <span className="font-medium">{t('prescriptionRequests.medication')}:</span> {req.medication}
                    </p>
                    {req.reason && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        <span className="font-medium">{t('prescriptionRequests.reason')}:</span> {req.reason}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {new Date(req.createdAt).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:flex-shrink-0">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusColors[req.status] || ''}`}>
                    {req.status}
                  </span>
                  {req.status === 'PENDING' && (
                    <button
                      onClick={() => setReviewModal(req)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      {t('prescriptionRequests.review')}
                    </button>
                  )}
                </div>
              </div>
              {req.reviewNotes && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-medium">{t('prescriptionRequests.reviewNotes')}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{req.reviewNotes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {reviewModal && (
        <Modal onClose={() => setReviewModal(null)} title={t('prescriptionRequests.reviewTitle')}>
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {reviewModal.patient?.firstName} {reviewModal.patient?.lastName}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {t('prescriptionRequests.medication')}: <span className="font-semibold">{reviewModal.medication}</span>
              </p>
              {reviewModal.reason && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t('prescriptionRequests.reason')}: {reviewModal.reason}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('prescriptionRequests.dosage')}
              </label>
              <input
                type="text"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="e.g., 500mg"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('prescriptionRequests.frequency')}
              </label>
              <input
                type="text"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                placeholder="e.g., Twice daily"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('prescriptionRequests.reviewNotes')}
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={3}
                placeholder={t('prescriptionRequests.notesPlaceholder')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => handleReview('APPROVED')}
                disabled={isReviewing}
                className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {Icons.check({ size: 16 })}
                {t('prescriptionRequests.approve')}
              </button>
              <button
                onClick={() => handleReview('DENIED')}
                disabled={isReviewing}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {Icons.x({ size: 16 })}
                {t('prescriptionRequests.deny')}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
