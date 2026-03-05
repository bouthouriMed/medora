import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGetAppointmentsQuery, useGetPatientsQuery, useGetUsersQuery, useCreateAppointmentMutation, useCancelAppointmentMutation, useUpdateAppointmentMutation, useGetNoteTemplatesQuery, useGetRecurringAppointmentsQuery, useCreateRecurringAppointmentMutation, useDeleteRecurringAppointmentMutation, useGenerateVisitNoteMutation, useCreateMedicalRecordMutation } from '../api';
import { showToast } from '../components/Toast';
import { exportAppointments, generateICS } from '../utils/export';
import CalendarView from '../components/CalendarView';
import Modal from '../components/Modal';
import type { Appointment, Patient, User, RecurringAppointment, NoteTemplate } from '../types';
import { useTranslation } from 'react-i18next';

function MarkdownContent({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-1 text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-3" />;
        if (/^---+$/.test(line.trim())) return <hr key={i} className="border-gray-200 dark:border-gray-600 my-3" />;
        if (/^#{1,3}\s/.test(line)) {
          const content = line.replace(/^#{1,3}\s+/, '').replace(/^\*\*|\*\*$/g, '');
          return (
            <div key={i} className="flex items-center gap-2 mt-4 mb-2">
              <div className="w-1 h-5 bg-purple-500 rounded-full flex-shrink-0" />
              <h3 className="font-bold text-base text-gray-900 dark:text-white">{content}</h3>
            </div>
          );
        }
        if (/^\*\*\d+\.\s/.test(line)) {
          const content = line.replace(/^\*\*/, '').replace(/\*\*:?\s*$/, '').replace(/\*\*$/, '');
          return (
            <div key={i} className="flex items-center gap-2 mt-4 mb-2">
              <div className="w-1 h-5 bg-purple-500 rounded-full flex-shrink-0" />
              <h3 className="font-bold text-base text-gray-900 dark:text-white">{content}</h3>
            </div>
          );
        }
        const inline = (s: string) => s
          .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-gray-900 dark:text-white">$1</strong>')
          .replace(/\*([^*\n]+)\*/g, '<em class="italic">$1</em>');
        const bulletMatch = line.match(/^(\s*)[\*\-]\s+(.*)/);
        if (bulletMatch) {
          const indent = Math.floor(bulletMatch[1].length / 4);
          return (
            <div key={i} className="flex gap-2" style={{ paddingLeft: `${indent * 16 + 12}px` }}>
              <span className="text-purple-400 mt-0.5 flex-shrink-0">•</span>
              <span dangerouslySetInnerHTML={{ __html: inline(bulletMatch[2]) }} />
            </div>
          );
        }
        const numMatch = line.match(/^(\s*)(\d+)\.\s+(.*)/);
        if (numMatch && parseInt(numMatch[2]) < 20) {
          const indent = Math.floor(numMatch[1].length / 4);
          return (
            <div key={i} className="flex gap-2" style={{ paddingLeft: `${indent * 16 + 12}px` }}>
              <span className="text-purple-400 font-semibold flex-shrink-0 w-5">{numMatch[2]}.</span>
              <span dangerouslySetInnerHTML={{ __html: inline(numMatch[3]) }} />
            </div>
          );
        }
        return <p key={i} className="text-gray-700 dark:text-gray-300" dangerouslySetInnerHTML={{ __html: inline(line) }} />;
      })}
    </div>
  );
}

export default function Appointments() {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [showRecurring, setShowRecurring] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [generatedNoteText, setGeneratedNoteText] = useState('');
  const [notePatientId, setNotePatientId] = useState('');
  const [noteIsEditing, setNoteIsEditing] = useState(false);
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [searchParams, setSearchParams] = useSearchParams();
  
  const { data: noteTemplates } = useGetNoteTemplatesQuery('APPOINTMENT');

  const getTodayString = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  const getDefaultEndDate = () => getTodayString();

  const dateRange = useMemo(() => {
    const filter = searchParams.get('filter');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (filter === 'today') {
      const today = getTodayString();
      return { startDate: today, endDate: today };
    }
    if (filter === 'upcoming' || (!startDate && !endDate)) {
      return { startDate: '', endDate: '' };
    }
    return { 
      startDate: startDate || '', 
      endDate: endDate || getDefaultEndDate() 
    };
  }, [searchParams]);

  const isTodayActive = () => {
    const filter = searchParams.get('filter');
    return filter === 'today';
  };

  const isUpcomingActive = () => {
    const filter = searchParams.get('filter');
    return filter === 'upcoming';
  };

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(field, value);
      if (field === 'startDate' && !searchParams.get('endDate')) {
        newParams.set('endDate', getDefaultEndDate());
      }
      if (field === 'endDate' && !searchParams.get('startDate')) {
        newParams.set('startDate', getTodayString());
      }
      newParams.delete('filter');
    } else {
      newParams.delete(field);
    }
    setSearchParams(newParams);
  };
  
  const { data: allAppointments } = useGetAppointmentsQuery({});
  
  const queryParams = (() => {
    const filter = searchParams.get('filter');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    if (filter === 'upcoming') {
      return { filter: 'upcoming' };
    }
    if (filter === 'today') {
      const today = getTodayString();
      return { startDate: today, endDate: today };
    }
    if (startDate) {
      return { startDate, endDate: endDate || getDefaultEndDate() };
    }
    return {};
  })();
  
  const { data: appointments, isLoading, isFetching } = useGetAppointmentsQuery(
    queryParams, 
    { pollingInterval: 0 }
  );
  
  const loading = isLoading || isFetching;
  const { data: patients } = useGetPatientsQuery('');
  const { data: users } = useGetUsersQuery(null);
  const [createAppointment, { isLoading: isCreating }] = useCreateAppointmentMutation();
  const [cancelAppointment] = useCancelAppointmentMutation();
  const [updateAppointment] = useUpdateAppointmentMutation();
  const { data: recurringAppointments } = useGetRecurringAppointmentsQuery(undefined);
  const [createRecurringAppointment] = useCreateRecurringAppointmentMutation();
  const [deleteRecurringAppointment] = useDeleteRecurringAppointmentMutation();
  const [generateVisitNote, { isLoading: isGeneratingNote }] = useGenerateVisitNoteMutation();
  const [createMedicalRecord, { isLoading: isSavingNote }] = useCreateMedicalRecordMutation();

  const doctors = users?.filter((u: User) => u.role === 'DOCTOR') || [];

  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    dateTime: '',
    notes: '',
    isRecurring: false,
    repeatFrequency: 'WEEKLY',
    repeatInterval: 1,
    repeatEndDate: '',
  });

  const handleDeleteRecurring = async (id: string) => {
    if (confirm(t('other.confirmDeleteSeries'))) {
      try {
        await deleteRecurringAppointment(id).unwrap();
        showToast(t('other.recurringDeleted'), 'success');
      } catch (error) {
        showToast(error instanceof Error ? error.message : t('other.failedToDeleteRecurring'), 'error');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (formData.isRecurring) {
        await createRecurringAppointment({
          patientId: formData.patientId,
          doctorId: formData.doctorId,
          startDate: new Date(formData.dateTime).toISOString(),
          frequency: formData.repeatFrequency,
          interval: formData.repeatInterval,
          endDate: formData.repeatEndDate || undefined,
        }).unwrap();
        showToast(t('other.recurringCreated'), 'success');
      } else {
        await createAppointment({
          patientId: formData.patientId,
          doctorId: formData.doctorId,
          dateTime: new Date(formData.dateTime).toISOString(),
          notes: formData.notes,
        }).unwrap();
        showToast(t('other.appointmentCreated'), 'success');
      }
      setShowModal(false);
      setFormData({ patientId: '', doctorId: '', dateTime: '', notes: '', isRecurring: false, repeatFrequency: 'WEEKLY', repeatInterval: 1, repeatEndDate: '' });
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('other.failedToCreateAppointment'), 'error');
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateAppointment({ id, status }).unwrap();
      showToast(`Appointment marked as ${status}`, 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('other.failedToUpdateAppointment'), 'error');
    }
  };

  const handleCancel = async (id: string) => {
    if (confirm(t('other.confirmCancelAppointment'))) {
      try {
        await cancelAppointment(id).unwrap();
        showToast(t('other.appointmentCancelled'), 'success');
      } catch (error) {
        showToast(error instanceof Error ? error.message : t('other.failedToCancelAppointment'), 'error');
      }
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'status-scheduled';
      case 'COMPLETED': return 'status-completed';
      case 'CANCELLED': return 'status-cancelled';
      case 'NO_SHOW': return 'status-no-show';
      default: return 'status-no-show';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white dark:text-white dark:text-white">{t('appointments.title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400 mt-1">{t('appointments.manageAppointments')}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => generateICS(allAppointments || [], 'all_appointments')}
            className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:border-gray-700 text-gray-700 dark:text-gray-300 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 dark:hover:bg-gray-700 transition-colors font-medium"
          >
            📅 {t('appointments.exportICS')}
          </button>
          <button
            onClick={() => exportAppointments(dateRange.startDate, dateRange.endDate)}
            className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:border-gray-700 text-gray-700 dark:text-gray-300 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 dark:hover:bg-gray-700 transition-colors font-medium"
          >
            📥 {t('common.export')}
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="btn-gradient text-white px-5 py-2.5 rounded-xl hover:shadow-lg transition-all duration-200 font-medium btn-shine"
          >
            + {t('appointments.newAppointment')}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-2 items-center flex-1 min-w-[280px]">
          <div className="flex-1 min-w-[130px]">
            <label className="block text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400 mb-1">{t('appointments.from')}</label>
            <input
              type="date"
              value={dateRange.startDate}
              max={dateRange.endDate || undefined}
              onChange={(e) => handleDateChange('startDate', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm transition-all"
            />
          </div>
          <span className="text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-400 mt-5">→</span>
          <div className="flex-1 min-w-[130px]">
            <label className="block text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400 mb-1">{t('appointments.to')}</label>
            <input
              type="date"
              value={dateRange.endDate}
              min={dateRange.startDate || undefined}
              onChange={(e) => handleDateChange('endDate', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm transition-all"
            />
          </div>
        </div>
        <button
          onClick={() => setSearchParams({ filter: 'today' })}
          className={`px-4 py-2 rounded-xl font-medium transition-colors ${isTodayActive() ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 dark:text-gray-300'}`}
        >
          {t('appointments.today')}
        </button>
        <button
          onClick={() => setSearchParams({ filter: 'upcoming' })}
          className={`px-4 py-2 rounded-xl font-medium transition-colors ${isUpcomingActive() ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 dark:text-gray-300'}`}
        >
          {t('appointments.upcoming')}
        </button>
        <button
          onClick={() => setSearchParams({})}
          className={`px-4 py-2 rounded-xl font-medium transition-colors ${!dateRange.startDate && !searchParams.get('filter') ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 dark:text-gray-300'}`}
        >
          {t('appointments.showAll')}
        </button>
        <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
          <button
            onClick={() => setView('list')}
            className={`px-4 py-2 font-medium transition-all ${view === 'list' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
            <span className="sm:hidden">📋</span>
            <span className="hidden sm:inline">{t('other.list')}</span>
          </button>
          <button
            onClick={() => setView('calendar')}
            className={`px-4 py-2 font-medium transition-all ${view === 'calendar' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
            <span className="sm:hidden">📅</span>
            <span className="hidden sm:inline">{t('other.calendar')}</span>
          </button>
        </div>
      </div>

      {/* Collapsible Recurring Banner */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden mb-6">
        <button
          onClick={() => setShowRecurring(!showRecurring)}
          className="w-full px-6 py-3 flex items-center justify-between hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-lg">🔄</div>
            <div className="text-left">
              <p className="font-semibold text-gray-900 dark:text-white dark:text-white">{t('appointments.recurringAppointments')}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">{recurringAppointments?.length || 0} {t('appointments.activeSeries')}</p>
            </div>
          </div>
          <svg 
            className={`w-5 h-5 text-gray-400 transition-transform ${showRecurring ? 'rotate-180' : ''}`} 
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {showRecurring && (
          <div className="border-t border-gray-100 p-4">
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setShowModal(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <span>+</span> {t('appointments.newRecurring')}
              </button>
            </div>
            
            {recurringAppointments?.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-2xl mx-auto mb-3">🔄</div>
                <h3 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-1">{t('appointments.noRecurringAppointments')}</h3>
                <p className="text-gray-500 dark:text-gray-400 dark:text-gray-400 text-sm mb-3">{t('appointments.createRecurringAppointment')}</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="text-purple-600 dark:text-purple-400 font-medium hover:underline text-sm"
                >
                  {t('appointments.createFirstRecurring')}
                </button>
              </div>
            ) : (
              <div className="grid gap-3">
                {recurringAppointments?.map((ra: RecurringAppointment) => (
                  <div key={ra.id} className="flex items-center justify-between p-3 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-purple-200 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center">🔄</div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white dark:text-white text-sm">{ra.patient?.firstName} {ra.patient?.lastName}</p>
                        <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                          <span className="font-medium text-purple-600 dark:text-purple-400">{ra.frequency === 'DAILY' ? t('appointments.daily') : ra.frequency === 'WEEKLY' ? t('appointments.weekly') : t('appointments.monthly')}</span>
                          <span>• {t('appointments.every')} {ra.interval}</span>
                          <span>• {t('appointments.starting')} {new Date(ra.startDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">{t('appointments.dr')} {ra.doctor?.firstName} {ra.doctor?.lastName}</span>
                      <button
                        onClick={() => handleDeleteRecurring(ra.id)}
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
      {view === 'list' && (
        <>
          {loading ? (
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 skeleton rounded-2xl"></div>
              ))}
            </div>
          ) : appointments?.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">📅</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white dark:text-white mb-2">{t('appointments.noAppointments')}</h3>
              <p className="text-gray-500 dark:text-gray-400 dark:text-gray-400">{t('appointments.manageAppointments')}</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden">
                <div className="table-responsive">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-700">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 dark:text-gray-300 uppercase tracking-wider">{t('other.time')}</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 dark:text-gray-300 uppercase tracking-wider">{t('other.patient')}</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 dark:text-gray-300 uppercase tracking-wider">{t('other.doctor')}</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 dark:text-gray-300 uppercase tracking-wider">{t('common.status')}</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 dark:text-gray-300 uppercase tracking-wider">{t('common.notes')}</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 dark:text-gray-300 uppercase tracking-wider">{t('common.actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {appointments?.map((apt: Appointment) => (
                        <tr key={apt.id} className="hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900 dark:text-white dark:text-white">
                              {new Date(apt.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">
                              {new Date(apt.dateTime).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-md">
                                {apt.patient?.firstName?.[0]}{apt.patient?.lastName?.[0]}
                              </div>
                              <span className="font-medium text-gray-900 dark:text-white dark:text-white">
                                {apt.patient?.firstName} {apt.patient?.lastName}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">
                            {t('appointments.dr')} {apt.doctor?.firstName} {apt.doctor?.lastName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusClass(apt.status)}`}>
                              {apt.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-500 dark:text-gray-400 dark:text-gray-400 text-sm max-w-xs truncate">
                            {apt.notes || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                            {apt.status === 'SCHEDULED' && (
                              <div className="flex justify-end gap-2 flex-wrap">
                                <button
                                  onClick={() => handleStatusChange(apt.id, 'COMPLETED')}
                                  className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 px-3 py-1.5 rounded-lg transition-colors font-medium"
                                >
                                  {t('appointments.complete')}
                                </button>
                                <button
                                  onClick={() => handleStatusChange(apt.id, 'NO_SHOW')}
                                  className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-colors font-medium"
                                >
                                  {t('appointments.noShow')}
                                </button>
                                <button
                                  onClick={() => handleCancel(apt.id)}
                                  className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition-colors font-medium"
                                >
                                  {t('appointments.cancel')}
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4">
                {appointments?.map((apt: Appointment) => (
                  <div key={apt.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 p-4 hover-lift">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
                          {apt.patient?.firstName?.[0]}{apt.patient?.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white dark:text-white">{apt.patient?.firstName} {apt.patient?.lastName}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">{t('appointments.dr')} {apt.doctor?.firstName} {apt.doctor?.lastName}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusClass(apt.status)}`}>
                        {apt.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400 mb-3">
                      <span>🕐 {new Date(apt.dateTime).toLocaleDateString()} {new Date(apt.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    {apt.notes && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-2 mb-3">{apt.notes}</p>
                    )}
                    {apt.status === 'SCHEDULED' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStatusChange(apt.id, 'COMPLETED')}
                          className="flex-1 text-green-600 hover:bg-green-50 px-3 py-2 rounded-lg transition-colors font-medium text-center"
                        >
                          ✓ {t('appointments.complete')}
                        </button>
                        <button
                          onClick={() => handleCancel(apt.id)}
                          className="flex-1 text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors font-medium text-center"
                        >
                          ✕ {t('appointments.cancel')}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Calendar View */}
      {view === 'calendar' && (
        <CalendarView 
          appointments={allAppointments || []}
          recurringAppointments={recurringAppointments || []}
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
          onDateClick={(date) => {
            const dateTime = new Date(date);
            dateTime.setHours(9, 0, 0, 0);
            setFormData({ ...formData, dateTime: dateTime.toISOString().slice(0, 16) });
            setShowModal(true);
          }}
          onEventClick={(apt) => {
            setSelectedAppointment(apt);
          }}
          onEventDrop={(apt) => {
            handleStatusChange(apt.id, apt.status);
          }}
        />
      )}

      {/* Appointment Details Modal */}
      <Modal isOpen={!!selectedAppointment} onClose={() => setSelectedAppointment(null)} title={t('appointments.appointmentDetails')}>
        <div className="p-6">
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">{t('other.patient')}</p>
              <p className="font-semibold text-gray-900 dark:text-white dark:text-white">{selectedAppointment?.patient?.firstName} {selectedAppointment?.patient?.lastName}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">{t('other.doctor')}</p>
              <p className="font-semibold text-gray-900 dark:text-white dark:text-white">{t('appointments.dr')} {selectedAppointment?.doctor?.firstName} {selectedAppointment?.doctor?.lastName}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">{t('other.dateTime')}</p>
              <p className="font-semibold text-gray-900 dark:text-white dark:text-white">
                {selectedAppointment && new Date(selectedAppointment.dateTime).toLocaleDateString()} at {selectedAppointment && new Date(selectedAppointment.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">{t('common.status')}</p>
                <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                  selectedAppointment?.status === 'COMPLETED' ? 'status-completed' :
                  selectedAppointment?.status === 'CANCELLED' ? 'status-cancelled' :
                  selectedAppointment?.status === 'NO_SHOW' ? 'status-no-show' : 'status-scheduled'
                }`}>
                  {selectedAppointment?.status}
                </span>
              </div>
              {selectedAppointment?.notes && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">{t('common.notes')}</p>
                  <p className="font-medium text-gray-900 dark:text-white dark:text-white">{selectedAppointment?.notes}</p>
                </div>
              )}
              {selectedAppointment?.status === 'SCHEDULED' && (
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      handleStatusChange(selectedAppointment!.id, 'COMPLETED');
                      setSelectedAppointment(null);
                    }}
                    className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors"
                  >
                    ✓ {t('appointments.complete')}
                  </button>
                  <button
                    onClick={() => {
                      handleStatusChange(selectedAppointment!.id, 'NO_SHOW');
                      setSelectedAppointment(null);
                    }}
                    className="flex-1 px-4 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors"
                  >
                    {t('appointments.noShow')}
                  </button>
                  <button
                    onClick={() => {
                      handleCancel(selectedAppointment!.id);
                      setSelectedAppointment(null);
                    }}
                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors"
                  >
                    {t('appointments.cancel')}
                  </button>
                </div>
              )}
              <button
                onClick={async () => {
                  if (!selectedAppointment) return;
                  try {
                    const result = await generateVisitNote({ id: selectedAppointment.id }).unwrap();
                    setGeneratedNoteText(result.generatedText);
                    setNotePatientId(result.patientId);
                    setShowNoteModal(true);
                  } catch {
                    showToast('Failed to generate note', 'error');
                  }
                }}
                disabled={isGeneratingNote}
                className="w-full px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isGeneratingNote ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Generating...
                  </>
                ) : '✨ Generate AI Visit Note'}
              </button>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 font-medium transition-colors"
              >
{t('common.close')}
              </button>
            </div>
          </div>
        </Modal>

      {/* AI Visit Note Modal */}
      <Modal isOpen={showNoteModal} onClose={() => { setShowNoteModal(false); setNoteIsEditing(false); }} title="✨ AI-Generated Visit Note">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">AI-generated SOAP note — click to edit</p>
            <button onClick={() => setNoteIsEditing(!noteIsEditing)} className="text-xs px-3 py-1 rounded-lg border border-purple-200 dark:border-purple-700 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors">
              {noteIsEditing ? '👁 Preview' : '✏️ Edit'}
            </button>
          </div>
          {noteIsEditing ? (
            <textarea
              value={generatedNoteText}
              onChange={(e) => setGeneratedNoteText(e.target.value)}
              rows={18}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm resize-none"
              autoFocus
            />
          ) : (
            <div
              onClick={() => setNoteIsEditing(true)}
              className="cursor-text max-h-96 overflow-y-auto border border-gray-100 dark:border-gray-700 rounded-xl p-5 bg-gray-50 dark:bg-gray-800/50 hover:border-purple-300 dark:hover:border-purple-600 transition-colors"
            >
              <MarkdownContent text={generatedNoteText} />
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => { setShowNoteModal(false); setNoteIsEditing(false); }}
              className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
            >
              Discard
            </button>
            <button
              onClick={async () => {
                try {
                  await createMedicalRecord({
                    patientId: notePatientId,
                    type: 'AI_CLINICAL_NOTE',
                    title: `Visit Note - ${new Date().toLocaleDateString()}`,
                    description: generatedNoteText,
                    data: { generatedBy: 'gemini-2.5-flash', appointmentId: selectedAppointment?.id },
                  }).unwrap();
                  showToast('Visit note saved to medical records', 'success');
                  setShowNoteModal(false);
                  setNoteIsEditing(false);
                  setGeneratedNoteText('');
                } catch {
                  showToast('Failed to save note', 'error');
                }
              }}
              disabled={isSavingNote}
              className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white rounded-xl font-medium transition-colors"
            >
              {isSavingNote ? 'Saving...' : 'Save to Records'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Create Appointment Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={t('appointments.newAppointment')}>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('appointments.patient')} *</label>
                <select
                  value={formData.patientId}
                  onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                  required
                >
                  <option value="">{t('other.selectPatient')}</option>
                  {patients?.map((p: Patient) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('appointments.doctor')} *</label>
                <select
                  value={formData.doctorId}
                  onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                  required
                >
                  <option value="">{t('other.selectDoctor')}</option>
                  {doctors.map((d: User) => (
                    <option key={d.id} value={d.id}>
                      {t('appointments.dr')} {d.firstName} {d.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('appointments.dateTime')} *</label>
                <input
                  type="datetime-local"
                  value={formData.dateTime}
                  onChange={(e) => setFormData({ ...formData, dateTime: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
              
              {/* Repeat Toggle */}
              <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/30 rounded-xl border border-purple-100 dark:border-purple-800">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔄</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">{t('appointments.repeat')}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isRecurring: !formData.isRecurring })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.isRecurring ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.isRecurring ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Repeat Options */}
              {formData.isRecurring && (
                <div className="grid grid-cols-3 gap-3 p-4 bg-purple-50 dark:bg-purple-900/30 rounded-xl border border-purple-100 dark:border-purple-800">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t('other.frequency')}</label>
                    <select
                      value={formData.repeatFrequency}
                      onChange={(e) => setFormData({ ...formData, repeatFrequency: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-purple-200 dark:border-purple-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="DAILY">{t('appointments.daily')}</option>
                      <option value="WEEKLY">{t('appointments.weekly')}</option>
                      <option value="MONTHLY">{t('appointments.monthly')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t('other.every')}</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.repeatInterval}
                      onChange={(e) => setFormData({ ...formData, repeatInterval: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 text-sm border border-purple-200 dark:border-purple-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t('other.ends')}</label>
                    <input
                      type="date"
                      value={formData.repeatEndDate}
                      onChange={(e) => setFormData({ ...formData, repeatEndDate: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-purple-200 dark:border-purple-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('common.notes')}</label>
                {noteTemplates && noteTemplates.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1">
                    {noteTemplates.slice(0, 3).map((template: NoteTemplate) => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, notes: formData.notes + (formData.notes ? '\n' : '') + template.content })}
                        className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100"
                      >
                        {template.name}
                      </button>
                    ))}
                  </div>
                )}
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  placeholder={t('common.notes')}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 font-medium transition-colors"
                >
                  {t('appointments.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 btn-gradient text-white py-3 rounded-xl hover:shadow-lg font-medium transition-all disabled:opacity-50 btn-shine"
                >
                  {isCreating ? t('appointments.creating') : t('appointments.newAppointment')}
                </button>
              </div>
            </form>
        </div>
      </Modal>
    </div>
  );
}
