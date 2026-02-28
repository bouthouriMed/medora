import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGetAppointmentsQuery, useGetPatientsQuery, useGetUsersQuery, useCreateAppointmentMutation, useCancelAppointmentMutation, useUpdateAppointmentMutation } from '../api';
import { showToast } from '../components/Toast';
import CalendarView from '../components/CalendarView';

export default function Appointments() {
  const [showModal, setShowModal] = useState(false);
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const filterParam = searchParams.get('filter');

  const getTodayString = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  const isTodayActive = () => {
    const filter = searchParams.get('filter');
    const startDate = searchParams.get('startDate');
    return filter === 'today' || (startDate && startDate === getTodayString());
  };

  useEffect(() => {
    if (filterParam === 'today') {
      setSelectedDate(getTodayString());
    } else if (filterParam === 'upcoming') {
      setSelectedDate('');
    } else if (!filterParam) {
      setSelectedDate('');
    }
  }, [filterParam]);
  
  const { data: allAppointments } = useGetAppointmentsQuery({});
  
  const queryParams = (() => {
    const filter = searchParams.get('filter');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    if (filter === 'upcoming') {
      return { filter: 'upcoming' };
    }
    if (filter === 'today' || (startDate && endDate)) {
      return { startDate: startDate || getTodayString(), endDate: endDate || getTodayString() };
    }
    if (startDate) {
      return { startDate, endDate };
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

  const doctors = users?.filter((u: any) => u.role === 'DOCTOR') || [];

  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    dateTime: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAppointment({
        ...formData,
        dateTime: new Date(formData.dateTime).toISOString(),
      }).unwrap();
      setShowModal(false);
      setFormData({ patientId: '', doctorId: '', dateTime: '', notes: '' });
      showToast('Appointment created successfully!', 'success');
    } catch (error: any) {
      showToast(error?.data?.error || 'Failed to create appointment', 'error');
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateAppointment({ id, status }).unwrap();
      showToast(`Appointment marked as ${status}`, 'success');
    } catch (error: any) {
      showToast(error?.data?.error || 'Failed to update appointment', 'error');
    }
  };

  const handleCancel = async (id: string) => {
    if (confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await cancelAppointment(id).unwrap();
        showToast('Appointment cancelled', 'success');
      } catch (error: any) {
        showToast(error?.data?.error || 'Failed to cancel appointment', 'error');
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-500 mt-1">Manage your clinic appointments</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-gradient text-white px-5 py-2.5 rounded-xl hover:shadow-lg transition-all duration-200 font-medium btn-shine"
        >
          + New Appointment
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[180px] max-w-xs">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              if (e.target.value) {
                setSearchParams({ startDate: e.target.value, endDate: e.target.value });
              } else {
                setSearchParams({});
              }
            }}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm transition-all"
          />
        </div>
        <button
          onClick={() => {
            setSelectedDate(getTodayString());
            setSearchParams({ filter: 'today' });
          }}
          className={`px-4 py-2.5 rounded-xl font-medium transition-colors ${isTodayActive() ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
        >
          Today
        </button>
        <button
          onClick={() => {
            setSelectedDate('');
            setSearchParams({});
          }}
          className={`px-4 py-2.5 rounded-xl font-medium transition-colors ${!selectedDate && !filterParam ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
        >
          Show All
        </button>
        <div className="flex rounded-xl overflow-hidden border border-gray-200 shadow-sm">
          <button
            onClick={() => setView('list')}
            className={`px-4 py-2.5 font-medium transition-all ${view === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            <span className="sm:hidden">📋</span>
            <span className="hidden sm:inline">List</span>
          </button>
          <button
            onClick={() => setView('calendar')}
            className={`px-4 py-2.5 font-medium transition-all ${view === 'calendar' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            <span className="sm:hidden">📅</span>
            <span className="hidden sm:inline">Calendar</span>
          </button>
        </div>
      </div>

      {/* List View */}
      {view === 'list' && (
        <>
          {loading ? (
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 skeleton rounded-2xl"></div>
              ))}
            </div>
          ) : appointments?.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">📅</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No appointments found</h3>
              <p className="text-gray-500">Create your first appointment to get started</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block bg-white shadow-lg border border-gray-100 rounded-2xl overflow-hidden">
                <div className="table-responsive">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Time</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Patient</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Doctor</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Notes</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {appointments?.map((apt: any) => (
                        <tr key={apt.id} className="hover:bg-blue-50/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900">
                              {new Date(apt.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(apt.dateTime).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-md">
                                {apt.patient?.firstName?.[0]}{apt.patient?.lastName?.[0]}
                              </div>
                              <span className="font-medium text-gray-900">
                                {apt.patient?.firstName} {apt.patient?.lastName}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                            Dr. {apt.doctor?.firstName} {apt.doctor?.lastName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusClass(apt.status)}`}>
                              {apt.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-500 text-sm max-w-xs truncate">
                            {apt.notes || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                            {apt.status === 'SCHEDULED' && (
                              <div className="flex justify-end gap-2 flex-wrap">
                                <button
                                  onClick={() => handleStatusChange(apt.id, 'COMPLETED')}
                                  className="text-green-600 hover:text-green-800 hover:bg-green-50 px-3 py-1.5 rounded-lg transition-colors font-medium"
                                >
                                  Complete
                                </button>
                                <button
                                  onClick={() => handleStatusChange(apt.id, 'NO_SHOW')}
                                  className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors font-medium"
                                >
                                  No Show
                                </button>
                                <button
                                  onClick={() => handleCancel(apt.id)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors font-medium"
                                >
                                  Cancel
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
                {appointments?.map((apt: any) => (
                  <div key={apt.id} className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 hover-lift">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
                          {apt.patient?.firstName?.[0]}{apt.patient?.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{apt.patient?.firstName} {apt.patient?.lastName}</p>
                          <p className="text-sm text-gray-500">Dr. {apt.doctor?.firstName} {apt.doctor?.lastName}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusClass(apt.status)}`}>
                        {apt.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                      <span>🕐 {new Date(apt.dateTime).toLocaleDateString()} {new Date(apt.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    {apt.notes && (
                      <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-2 mb-3">{apt.notes}</p>
                    )}
                    {apt.status === 'SCHEDULED' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStatusChange(apt.id, 'COMPLETED')}
                          className="flex-1 text-green-600 hover:bg-green-50 px-3 py-2 rounded-lg transition-colors font-medium text-center"
                        >
                          ✓ Complete
                        </button>
                        <button
                          onClick={() => handleCancel(apt.id)}
                          className="flex-1 text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors font-medium text-center"
                        >
                          ✕ Cancel
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
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
          onDateClick={(date) => setSelectedDate(date)}
        />
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 modal-backdrop">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl modal-content max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">New Appointment</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Patient *</label>
                <select
                  value={formData.patientId}
                  onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                  required
                >
                  <option value="">Select patient</option>
                  {patients?.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Doctor *</label>
                <select
                  value={formData.doctorId}
                  onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                  required
                >
                  <option value="">Select doctor</option>
                  {doctors.map((d: any) => (
                    <option key={d.id} value={d.id}>
                      Dr. {d.firstName} {d.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Date & Time *</label>
                <input
                  type="datetime-local"
                  value={formData.dateTime}
                  onChange={(e) => setFormData({ ...formData, dateTime: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 btn-gradient text-white py-3 rounded-xl hover:shadow-lg font-medium transition-all disabled:opacity-50 btn-shine"
                >
                  {isCreating ? 'Creating...' : 'Create Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
