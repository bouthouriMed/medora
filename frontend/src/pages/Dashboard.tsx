import { useNavigate } from 'react-router-dom';
import { useGetDashboardQuery } from '../api';
import type { Appointment } from '../types';

export default function Dashboard() {
  const { data, isLoading, error } = useGetDashboardQuery(undefined);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 skeleton rounded-lg"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 skeleton rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
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
      gradient: 'from-blue-400 to-blue-600',
      hover: 'hover:from-blue-500 hover:to-blue-700',
      onClick: () => navigate('/appointments?filter=today')
    },
    { 
      label: 'Upcoming', 
      value: data?.upcomingAppointments?.length || 0, 
      color: 'purple',
      icon: '⏰',
      gradient: 'from-purple-400 to-purple-600',
      hover: 'hover:from-purple-500 hover:to-purple-700',
      onClick: () => navigate('/appointments?filter=upcoming')
    },
    { 
      label: 'Monthly Revenue', 
      value: `$${Number(data?.monthlyRevenue || 0).toFixed(2)}`, 
      color: 'green',
      icon: '💰',
      gradient: 'from-green-400 to-green-600',
      hover: 'hover:from-green-500 hover:to-green-700',
      onClick: () => navigate('/invoices')
    },
    { 
      label: 'Unpaid Invoices', 
      value: data?.unpaidInvoices || 0, 
      color: 'red',
      icon: '📋',
      gradient: 'from-red-400 to-orange-500',
      hover: 'hover:from-red-500 hover:to-orange-600',
      onClick: () => navigate('/invoices?status=UNPAID')
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1 sm:mt-2">Welcome back! Here's what's happening at your clinic.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            onClick={stat.onClick}
            className={`group cursor-pointer bg-gradient-to-br ${stat.gradient} ${stat.hover} rounded-2xl p-5 sm:p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover-lift`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium">{stat.label}</p>
                <p className="text-3xl sm:text-4xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-xl flex items-center justify-center text-2xl sm:text-3xl backdrop-blur-sm">
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Appointments Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Today's Appointments */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover-lift">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-5 sm:px-6 py-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span>📅</span>
              <span>Today's Appointments</span>
            </h2>
          </div>
          <div className="p-4 sm:p-6">
            {data?.todayAppointments?.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <span className="text-5xl block mb-3">📅</span>
                <p className="font-medium">No appointments today</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data?.todayAppointments?.slice(0, 5).map((apt: Appointment) => (
                  <div 
                    key={apt.id} 
                    className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl hover:from-gray-100 hover:to-blue-100 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md">
                        {apt.patient?.firstName?.[0]}{apt.patient?.lastName?.[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm sm:text-base">{apt.patient?.firstName} {apt.patient?.lastName}</p>
                        <p className="text-xs sm:text-sm text-gray-500">{new Date(apt.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                    <span className={`px-2 sm:px-3 py-1 text-xs font-medium rounded-full ${
                      apt.status === 'COMPLETED' ? 'status-completed' :
                      apt.status === 'CANCELLED' ? 'status-cancelled' :
                      apt.status === 'NO_SHOW' ? 'status-no-show' :
                      'status-scheduled'
                    }`}>
                      {apt.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover-lift">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-5 sm:px-6 py-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span>⏰</span>
              <span>Upcoming Appointments</span>
            </h2>
          </div>
          <div className="p-4 sm:p-6">
            {data?.upcomingAppointments?.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <span className="text-5xl block mb-3">⏰</span>
                <p className="font-medium">No upcoming appointments</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data?.upcomingAppointments?.slice(0, 5).map((apt: Appointment) => (
                  <div 
                    key={apt.id} 
                    className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-purple-50 rounded-xl hover:from-gray-100 hover:to-purple-100 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md">
                        {apt.patient?.firstName?.[0]}{apt.patient?.lastName?.[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm sm:text-base">{apt.patient?.firstName} {apt.patient?.lastName}</p>
                        <p className="text-xs sm:text-sm text-gray-500">
                          {new Date(apt.dateTime).toLocaleDateString()} • {new Date(apt.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 sm:px-3 py-1 text-xs font-medium rounded-full ${
                      apt.status === 'COMPLETED' ? 'status-completed' :
                      apt.status === 'CANCELLED' ? 'status-cancelled' :
                      apt.status === 'NO_SHOW' ? 'status-no-show' :
                      'status-scheduled'
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
