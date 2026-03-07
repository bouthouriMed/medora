import type { RecurringAppointment } from '../types';

interface RecurringAppointmentsProps {
  appointments: RecurringAppointment[];
  onDelete: (id: string) => void;
  onCreateNew: () => void;
  isExpanded: boolean;
  onToggle: () => void;
  t: (key: string) => string;
}

export default function RecurringAppointments({
  appointments,
  onDelete,
  onCreateNew,
  isExpanded,
  onToggle,
  t,
}: RecurringAppointmentsProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden mb-6">
      <button
        onClick={onToggle}
        className="w-full px-6 py-3 flex items-center justify-between hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-lg">🔄</div>
          <div className="text-left">
            <p className="font-semibold text-gray-900 dark:text-white">{t('appointments.recurringAppointments')}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{appointments.length} {t('appointments.activeSeries')}</p>
          </div>
        </div>
        <svg 
          className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isExpanded && (
        <div className="border-t border-gray-100 p-4">
          <div className="flex justify-end mb-4">
            <button
              onClick={onCreateNew}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <span>+</span> {t('appointments.newRecurring')}
            </button>
          </div>
          
          {appointments.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-2xl mx-auto mb-3">🔄</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{t('appointments.noRecurringAppointments')}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">{t('appointments.createRecurringAppointment')}</p>
              <button
                onClick={onCreateNew}
                className="text-purple-600 dark:text-purple-400 font-medium hover:underline text-sm"
              >
                {t('appointments.createFirstRecurring')}
              </button>
            </div>
          ) : (
            <div className="grid gap-3">
              {appointments.map((ra) => (
                <div key={ra.id} className="flex items-center justify-between p-3 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-purple-200 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center">🔄</div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{ra.patient?.firstName} {ra.patient?.lastName}</p>
                      <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                        <span className="font-medium text-purple-600 dark:text-purple-400">
                          {ra.frequency === 'DAILY' ? t('appointments.daily') : ra.frequency === 'WEEKLY' ? t('appointments.weekly') : t('appointments.monthly')}
                        </span>
                        <span>• {t('appointments.every')} {ra.interval}</span>
                        <span>• {t('appointments.starting')} {new Date(ra.startDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">{t('appointments.dr')} {ra.doctor?.firstName} {ra.doctor?.lastName}</span>
                    <button
                      onClick={() => onDelete(ra.id)}
                      className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                      title={t('appointments.deleteSeries')}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
