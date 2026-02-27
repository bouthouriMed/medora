import { useNavigate } from 'react-router-dom';
import { useGetDashboardQuery } from '../api';

export default function Dashboard() {
  const { data, isLoading, error } = useGetDashboardQuery(undefined);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        Error loading dashboard
      </div>
    );
  }

  const stats = [
    { 
      label: "Today's Appointments", 
      value: data?.todayAppointments?.length || 0, 
      color: 'blue',
      icon: '📅',
      onClick: () => navigate('/appointments?filter=today')
    },
    { 
      label: 'Upcoming', 
      value: data?.upcomingAppointments?.length || 0, 
      color: 'purple',
      icon: '⏰',
      onClick: () => navigate('/appointments?filter=upcoming')
    },
    { 
      label: 'Monthly Revenue', 
      value: `$${Number(data?.monthlyRevenue || 0).toFixed(2)}`, 
      color: 'green',
      icon: '💰',
      onClick: () => navigate('/invoices')
    },
    { 
      label: 'Unpaid Invoices', 
      value: data?.unpaidInvoices || 0, 
      color: 'red',
      icon: '📋',
      onClick: () => navigate('/invoices?status=UNPAID')
    },
  ];

  const colorClasses: Record<string, { bg: string; text: string; border: string; hover: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', hover: 'hover:bg-blue-100' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', hover: 'hover:bg-purple-100' },
    green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200', hover: 'hover:bg-green-100' },
    red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', hover: 'hover:bg-red-100' },
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back! Here's what's happening at your clinic.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const colors = colorClasses[stat.color];
          return (
            <div
              key={index}
              onClick={stat.onClick}
              className={`${colors.bg} border ${colors.border} rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${colors.hover}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className={`text-3xl font-bold ${colors.text} mt-2`}>{stat.value}</p>
                </div>
                <div className={`text-4xl ${colors.text} opacity-80`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
            <h2 className="text-lg font-semibold text-white">Today's Appointments</h2>
          </div>
          <div className="p-6">
            {data?.todayAppointments?.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <span className="text-4xl block mb-2">📅</span>
                No appointments today
              </div>
            ) : (
              <div className="space-y-3">
                {data?.todayAppointments?.map((apt: any) => (
                  <div key={apt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                        {apt.patient.firstName[0]}{apt.patient.lastName[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{apt.patient.firstName} {apt.patient.lastName}</p>
                        <p className="text-sm text-gray-500">{new Date(apt.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      apt.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                      apt.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                      apt.status === 'NO_SHOW' ? 'bg-gray-100 text-gray-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {apt.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
            <h2 className="text-lg font-semibold text-white">Upcoming Appointments</h2>
          </div>
          <div className="p-6">
            {data?.upcomingAppointments?.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <span className="text-4xl block mb-2">⏰</span>
                No upcoming appointments
              </div>
            ) : (
              <div className="space-y-3">
                {data?.upcomingAppointments?.map((apt: any) => (
                  <div key={apt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-semibold">
                        {apt.patient.firstName[0]}{apt.patient.lastName[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{apt.patient.firstName} {apt.patient.lastName}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(apt.dateTime).toLocaleDateString()} • {new Date(apt.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      apt.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                      apt.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                      apt.status === 'NO_SHOW' ? 'bg-gray-100 text-gray-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {apt.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
