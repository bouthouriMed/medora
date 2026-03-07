import type { Appointment } from '../types';

interface AppointmentListProps {
  appointments: Appointment[];
  onView: (apt: Appointment) => void;
  onStatusChange: (id: string, status: string) => void;
  onCancel: (id: string) => void;
  onCheckIn: (id: string) => void;
  onStartConsultation: (appointmentId: string, patientId: string) => void;
  onDeleteRecurring: (id: string) => void;
  getStatusClass: (status: string) => string;
  getStatusLabel: (status: string) => string;
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
  menuRef: React.RefObject<HTMLDivElement>;
  t: (key: string) => string;
}

export default function AppointmentList({
  appointments,
  onView,
  onStatusChange,
  onCancel,
  onCheckIn,
  onStartConsultation,
  getStatusClass,
  getStatusLabel,
  openMenuId,
  setOpenMenuId,
  menuRef,
  t,
}: AppointmentListProps) {
  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden">
        <div className="table-responsive">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">{t('other.time')}</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">{t('other.patient')}</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">{t('other.doctor')}</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">{t('common.status')}</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">{t('common.notes')}</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {appointments.map((apt) => (
                <tr key={apt.id} className="hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      {new Date(apt.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(apt.dateTime).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                        {apt.patient?.firstName?.[0]}{apt.patient?.lastName?.[0]}
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {apt.patient?.firstName} {apt.patient?.lastName}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">
                    {t('appointments.dr')} {apt.doctor?.firstName} {apt.doctor?.lastName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusClass(apt.status)}`}>
                      {getStatusLabel(apt.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-sm max-w-xs truncate">
                    {apt.notes || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <AppointmentMenu
                      apt={apt}
                      onView={onView}
                      onStatusChange={onStatusChange}
                      onCancel={onCancel}
                      onCheckIn={onCheckIn}
                      onStartConsultation={onStartConsultation}
                      openMenuId={openMenuId}
                      setOpenMenuId={setOpenMenuId}
                      menuRef={menuRef}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {appointments.map((apt) => (
          <div key={apt.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {apt.patient?.firstName?.[0]}{apt.patient?.lastName?.[0]}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {apt.patient?.firstName} {apt.patient?.lastName}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(apt.dateTime).toLocaleDateString()} {new Date(apt.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusClass(apt.status)}`}>
                {getStatusLabel(apt.status)}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {t('appointments.dr')} {apt.doctor?.firstName} {apt.doctor?.lastName}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => onView(apt)}
                className="flex-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-2 rounded-lg text-sm font-medium text-center"
              >
                {t('other.view')}
              </button>
              {apt.status === 'SCHEDULED' && (
                <button
                  onClick={() => onStatusChange(apt.id, 'CONFIRMED')}
                  className="flex-1 text-emerald-600 hover:bg-emerald-50 px-3 py-2 rounded-lg text-sm font-medium text-center"
                >
                  Confirm
                </button>
              )}
              {apt.status === 'CONFIRMED' && (
                <button
                  onClick={() => onCheckIn(apt.id)}
                  className="flex-1 text-yellow-600 hover:bg-yellow-50 px-3 py-2 rounded-lg text-sm font-medium text-center"
                >
                  Check In
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function AppointmentMenu({
  apt,
  onView,
  onStatusChange,
  onCancel,
  onCheckIn,
  onStartConsultation,
  openMenuId,
  setOpenMenuId,
  menuRef,
}: {
  apt: Appointment;
  onView: (apt: Appointment) => void;
  onStatusChange: (id: string, status: string) => void;
  onCancel: (id: string) => void;
  onCheckIn: (id: string) => void;
  onStartConsultation: (appointmentId: string, patientId: string) => void;
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
  menuRef: React.RefObject<HTMLDivElement>;
}) {
  return (
    <div className="relative" ref={openMenuId === apt.id ? menuRef : undefined}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === apt.id ? null : apt.id); }}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
      >
        <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>
      {openMenuId === apt.id && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
          <button
            onClick={() => { onView(apt); setOpenMenuId(null); }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            View
          </button>
          {apt.status === 'SCHEDULED' && (
            <>
              <button
                onClick={() => { onStatusChange(apt.id, 'CONFIRMED'); setOpenMenuId(null); }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-emerald-600 hover:bg-emerald-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Confirm
              </button>
              <hr className="my-1 border-gray-100" />
              <button
                onClick={() => { onCancel(apt.id); setOpenMenuId(null); }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                Reject
              </button>
            </>
          )}
          {apt.status === 'CONFIRMED' && (
            <button
              onClick={() => { onCheckIn(apt.id); setOpenMenuId(null); }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-yellow-600 hover:bg-yellow-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              Check In
            </button>
          )}
          {apt.status === 'CHECKED_IN' && (
            <button
              onClick={() => { onStartConsultation(apt.id, apt.patientId); setOpenMenuId(null); }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-orange-600 hover:bg-orange-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Start Consultation
            </button>
          )}
          {apt.status === 'IN_PROGRESS' && (
            <button
              onClick={() => { onStatusChange(apt.id, 'COMPLETED'); setOpenMenuId(null); }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-green-600 hover:bg-green-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Complete Visit
            </button>
          )}
        </div>
      )}
    </div>
  );
}
