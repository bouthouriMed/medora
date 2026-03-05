import { useState } from 'react';
import { useGetWaitlistQuery, useCreateWaitlistEntryMutation, useUpdateWaitlistEntryMutation, useDeleteWaitlistEntryMutation, useBookFromWaitlistMutation, useGetPatientsQuery, useGetUsersQuery } from '../api';
import { useTranslation } from 'react-i18next';

export default function Waitlist() {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState('WAITING');
  const [showForm, setShowForm] = useState(false);
  const [bookingEntry, setBookingEntry] = useState<any>(null);

  const { data: entries = [], isLoading } = useGetWaitlistQuery(statusFilter || undefined);
  const { data: patients = [] } = useGetPatientsQuery(undefined);
  const { data: users = [] } = useGetUsersQuery(undefined);
  const [createEntry] = useCreateWaitlistEntryMutation();
  const [updateEntry] = useUpdateWaitlistEntryMutation();
  const [deleteEntry] = useDeleteWaitlistEntryMutation();
  const [bookFromWaitlist] = useBookFromWaitlistMutation();

  const doctors = (users as any[])?.filter((u: any) => u.role === 'DOCTOR') || [];

  const [form, setForm] = useState({ patientId: '', doctorId: '', preferredDate: '', preferredTimeStart: '', preferredTimeEnd: '', reason: '', priority: 'NORMAL' });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createEntry(form);
    setShowForm(false);
    setForm({ patientId: '', doctorId: '', preferredDate: '', preferredTimeStart: '', preferredTimeEnd: '', reason: '', priority: 'NORMAL' });
  };

  const [bookForm, setBookForm] = useState({ dateTime: '', doctorId: '' });

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingEntry) return;
    await bookFromWaitlist({ id: bookingEntry.id, ...bookForm });
    setBookingEntry(null);
    setBookForm({ dateTime: '', doctorId: '' });
  };

  const priorityColors: Record<string, string> = {
    URGENT: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    NORMAL: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    LOW: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  };

  const statusColors: Record<string, string> = {
    WAITING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    NOTIFIED: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    BOOKED: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{t('waitlist.title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t('waitlist.subtitle')}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium">
          {t('waitlist.addToWaitlist')}
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 flex-wrap">
        {['WAITING', 'NOTIFIED', 'BOOKED', 'CANCELLED', ''].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
            {s || t('common.all')}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 skeleton rounded-xl"></div>)}</div>
      ) : (entries as any[]).length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          <span className="text-5xl block mb-3">📋</span>
          <p className="text-gray-500 dark:text-gray-400 font-medium">{t('waitlist.noEntries')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(entries as any[]).map((entry: any) => (
            <div key={entry.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {entry.patient?.firstName?.[0]}{entry.patient?.lastName?.[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{entry.patient?.firstName} {entry.patient?.lastName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {entry.preferredDate && <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(entry.preferredDate).toLocaleDateString()}</span>}
                      {entry.preferredTimeStart && <span className="text-xs text-gray-500 dark:text-gray-400">{entry.preferredTimeStart} - {entry.preferredTimeEnd}</span>}
                      {entry.reason && <span className="text-xs text-gray-500 dark:text-gray-400">| {entry.reason}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${priorityColors[entry.priority] || priorityColors.NORMAL}`}>{entry.priority}</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[entry.status] || statusColors.WAITING}`}>{entry.status}</span>
                  {entry.status === 'WAITING' && (
                    <>
                      <button onClick={() => { setBookingEntry(entry); setBookForm({ dateTime: '', doctorId: entry.doctorId || '' }); }}
                        className="px-3 py-1 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded-full hover:bg-green-200 dark:hover:bg-green-800 transition-colors">
                        {t('waitlist.book')}
                      </button>
                      <button onClick={() => updateEntry({ id: entry.id, status: 'NOTIFIED', notifiedAt: new Date().toISOString() })}
                        className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors">
                        {t('waitlist.notify')}
                      </button>
                      <button onClick={() => deleteEntry(entry.id)}
                        className="px-3 py-1 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 rounded-full hover:bg-red-200 dark:hover:bg-red-800 transition-colors">
                        {t('common.remove')}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add to Waitlist Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('waitlist.addToWaitlist')}</h2>
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('waitlist.preferredDoctor')}</label>
                <select value={form.doctorId} onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  <option value="">{t('waitlist.anyDoctor')}</option>
                  {doctors.map((d: any) => <option key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('waitlist.preferredDate')}</label>
                  <input type="date" value={form.preferredDate} onChange={(e) => setForm({ ...form, preferredDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('waitlist.priority')}</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('waitlist.reason')}</label>
                <input type="text" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder={t('waitlist.reasonPlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700">{t('common.cancel')}</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700">{t('common.add')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Book from Waitlist Modal */}
      {bookingEntry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setBookingEntry(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('waitlist.bookAppointment')}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('waitlist.bookingFor')} {bookingEntry.patient?.firstName} {bookingEntry.patient?.lastName}</p>
            <form onSubmit={handleBook} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('appointments.dateTime')}</label>
                <input type="datetime-local" value={bookForm.dateTime} onChange={(e) => setBookForm({ ...bookForm, dateTime: e.target.value })} required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('appointments.doctor')}</label>
                <select value={bookForm.doctorId} onChange={(e) => setBookForm({ ...bookForm, doctorId: e.target.value })} required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  <option value="">{t('appointments.selectDoctor')}</option>
                  {doctors.map((d: any) => <option key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setBookingEntry(null)} className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700">{t('common.cancel')}</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700">{t('waitlist.confirmBooking')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
