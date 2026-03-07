import type { Patient } from '../../types';

interface PatientListProps {
  patients: Patient[];
  onViewPatient: (patient: Patient) => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
  onPortalClick: (patient: Patient) => void;
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
  menuRef: React.RefObject<HTMLDivElement>;
  t: (key: string) => string;
}

export default function PatientList({
  patients,
  onViewPatient,
  onDelete,
  onRestore,
  onPortalClick,
  openMenuId,
  setOpenMenuId,
  menuRef,
  t,
}: PatientListProps) {
  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden">
        <div className="table-responsive">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">{t('other.patient')}</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">{t('other.contact')}</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">{t('common.phone')}</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">{t('other.tags')}</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">{t('patients.dateOfBirth')}</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {patients.map((patient) => (
                <PatientRow
                  key={patient.id}
                  patient={patient}
                  onView={onViewPatient}
                  onDelete={onDelete}
                  onRestore={onRestore}
                  onPortalClick={onPortalClick}
                  isMenuOpen={openMenuId === patient.id}
                  onMenuToggle={() => setOpenMenuId(openMenuId === patient.id ? null : patient.id)}
                  menuRef={menuRef}
                  t={t}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden grid grid-cols-1 gap-4">
        {patients.map((patient) => (
          <PatientCard
            key={patient.id}
            patient={patient}
            onView={onViewPatient}
            onDelete={onDelete}
            onRestore={onRestore}
            onPortalClick={onPortalClick}
            t={t}
          />
        ))}
      </div>
    </>
  );
}

function PatientRow({ patient, onView, onDelete, onRestore, onPortalClick, isMenuOpen, onMenuToggle, menuRef, t }: any) {
  return (
    <tr className={`hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors ${patient.deletedAt ? 'opacity-60' : ''}`}>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold shadow-md ${patient.deletedAt ? 'bg-gray-400' : 'bg-gradient-to-br from-purple-400 to-pink-500'}`}>
            {patient.firstName[0]}{patient.lastName[0]}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 dark:text-white">{patient.firstName} {patient.lastName}</span>
            {patient.deletedAt && (
              <span className="px-2 py-0.5 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full">Archived</span>
            )}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">{patient.email || '-'}</td>
      <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">{patient.phone || '-'}</td>
      <td className="px-6 py-4">
        <div className="flex flex-wrap gap-1">
          {patient.patientTags && patient.patientTags.length > 0 ? (
            patient.patientTags.map(({ tag }: any) => (
              <span key={tag.id} className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: tag.color + '20', color: tag.color }}>
                {tag.name}
              </span>
            ))
          ) : (
            <span className="text-gray-400 text-xs">-</span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">
        {patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
        <div className="relative" ref={isMenuOpen ? menuRef : undefined}>
          <button onClick={onMenuToggle} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="5" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="19" r="1.5" />
            </svg>
          </button>
          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
              <button onClick={() => { onView(patient); onMenuToggle(); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                {t('other.view')}
              </button>
              <button onClick={() => { onPortalClick(patient); onMenuToggle(); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                {t('other.patientPortal')}
              </button>
              <hr className="my-1 border-gray-100 dark:border-gray-700" />
              {patient.deletedAt ? (
                <button onClick={() => { onRestore(patient.id); onMenuToggle(); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  Restore
                </button>
              ) : (
                <button onClick={() => { onDelete(patient.id); onMenuToggle(); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  {t('other.archive')}
                </button>
              )}
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

function PatientCard({ patient, onView, onDelete, onRestore, onPortalClick, t }: any) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 p-4 hover-lift">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
            {patient.firstName[0]}{patient.lastName[0]}
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">{patient.firstName} {patient.lastName}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{patient.email || t('other.noEmail')}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{patient.phone || t('other.noPhone')}</p>
            {patient.patientTags && patient.patientTags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {patient.patientTags.map(({ tag }: any) => (
                  <span key={tag.id} className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: tag.color + '20', color: tag.color }}>
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button onClick={() => onView(patient)} className="flex-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-2 rounded-lg text-sm font-medium text-center">
          {t('other.view')}
        </button>
        <button onClick={() => onPortalClick(patient)} className="flex-1 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 px-3 py-2 rounded-lg text-sm font-medium text-center">
          {t('other.patientPortal')}
        </button>
        {patient.deletedAt ? (
          <button onClick={() => onRestore(patient.id)} className="flex-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 px-3 py-2 rounded-lg text-sm font-medium text-center">
            Restore
          </button>
        ) : (
          <button onClick={() => onDelete(patient.id)} className="flex-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-2 rounded-lg text-sm font-medium text-center">
            {t('other.archive')}
          </button>
        )}
      </div>
    </div>
  );
}
