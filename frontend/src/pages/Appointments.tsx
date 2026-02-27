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
  const [searchParams] = useSearchParams();
  const filterParam = searchParams.get('filter');

  const getTodayString = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  useEffect(() => {
    if (filterParam === 'today') {
      setSelectedDate(getTodayString());
    } else if (filterParam === 'upcoming') {
      setSelectedDate('');
    }
  }, [filterParam]);
  
  const { data: allAppointments } = useGetAppointmentsQuery({});
  const { data: appointments, isLoading } = useGetAppointmentsQuery(
    selectedDate ? { startDate: selectedDate, endDate: selectedDate } : {}
  );
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-blue-100 text-blue-700';
      case 'COMPLETED': return 'bg-green-100 text-green-700';
      case 'CANCELLED': return 'bg-red-100 text-red-700';
      case 'NO_SHOW': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-500 mt-1">Manage your clinic appointments</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-2.5 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
        >
          + New Appointment
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-6 items-center">
        <div className="flex-1 min-w-[200px] max-w-xs">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm transition-all"
          />
        </div>
        <button
          onClick={() => setSelectedDate(getTodayString())}
          className={`px-4 py-2.5 rounded-xl font-medium transition-colors ${selectedDate === getTodayString() ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
        >
          Today
        </button>
        <button
          onClick={() => setSelectedDate('')}
          className={`px-4 py-2.5 rounded-xl font-medium transition-colors ${!selectedDate ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
        >
          Show All
        </button>
        <div className="flex rounded-xl overflow-hidden border border-gray-200">
          <button
            onClick={() => setView('list')}
            className={`px-5 py-2.5 font-medium transition-all ${view === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            List
          </button>
          <button
            onClick={() => setView('calendar')}
            className={`px-5 py-2.5 font-medium transition-all ${view === 'calendar' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            Calendar
          </button>
        </div>
      </div>

      {view === 'list' && (
        <>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
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
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
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
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(apt.status)}`}>
                          {apt.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-sm max-w-xs truncate">
                        {apt.notes || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        {apt.status === 'SCHEDULED' && (
                          <div className="flex justify-end gap-2">
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
              {appointments?.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <span className="text-5xl block mb-3">📅</span>
                  No appointments found
                </div>
              )}
            </div>
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

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-6 text-gray-900">New Appointment</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Patient</label>
                <select
                  value={formData.patientId}
                  onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
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
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Doctor</label>
                <select
                  value={formData.doctorId}
                  onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
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
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Date & Time</label>
                <input
                  type="datetime-local"
                  value={formData.dateTime}
                  onChange={(e) => setFormData({ ...formData, dateTime: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 font-medium transition-all disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
