import { useNavigate } from 'react-router-dom';
import { useGetDashboardQuery } from '../api';
import type { Appointment } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { useTranslation } from 'react-i18next';

const COLORS = ['#22c55e', '#ef4444', '#6b7280', '#3b82f6'];

const formatCurrency = (value: number) => {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}k`;
  }
  return `$${value}`;
};

export default function Dashboard() {
  const { data, isLoading, error } = useGetDashboardQuery(undefined);
  const navigate = useNavigate();
  const { t } = useTranslation();

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
      label: t('dashboard.todayAppointments'), 
      value: data?.todayAppointments?.length || 0, 
      subtext: `${data?.todayAppointments?.filter((a: Appointment) => a.status === 'COMPLETED').length || 0} ${t('appointments.completed')}`,
      color: 'blue',
      icon: '📅',
      gradient: 'from-blue-400 to-blue-600',
      hover: 'hover:from-blue-500 hover:to-blue-700',
      onClick: () => navigate('/appointments?filter=today')
    },
    { 
      label: t('dashboard.revenue'), 
      value: `$${(Number(data?.monthlyRevenue || 0)).toLocaleString()}`, 
      subtext: `${data?.monthlyRevenueCount || 0} ${t('invoices.title').toLowerCase()}`,
      color: 'green',
      icon: '💰',
      gradient: 'from-green-400 to-emerald-500',
      hover: 'hover:from-green-500 hover:to-emerald-600',
      onClick: () => navigate('/invoices')
    },
    { 
      label: t('dashboard.upcomingAppointments'), 
      value: data?.upcomingAppointments?.length || 0, 
      subtext: t('dashboard.thisMonth'),
      color: 'purple',
      icon: '⏰',
      gradient: 'from-purple-400 to-violet-600',
      hover: 'hover:from-purple-500 hover:to-violet-700',
      onClick: () => navigate('/appointments?filter=upcoming')
    },
    { 
      label: t('dashboard.pendingInvoices'), 
      value: data?.unpaidInvoices || 0, 
      subtext: t('dashboard.needsAttention'),
      color: 'red',
      icon: '⚠️',
      gradient: 'from-orange-400 to-red-500',
      hover: 'hover:from-orange-500 hover:to-red-600',
      onClick: () => navigate('/invoices?status=UNPAID')
    },
  ];

  const pieData = data?.appointmentsByMonth ? [
    { name: t('other.chartCompleted'), value: data.appointmentsByMonth.reduce((sum: number, m: any) => sum + m.completed, 0) },
    { name: t('other.chartCancelled'), value: data.appointmentsByMonth.reduce((sum: number, m: any) => sum + m.cancelled, 0) },
    { name: t('other.chartNoShow'), value: data.appointmentsByMonth.reduce((sum: number, m: any) => sum + m.noShow, 0) },
  ] : [];

  const completionRate = pieData.length > 0 && pieData.reduce((sum, d) => sum + d.value, 0) > 0
    ? Math.round((pieData[0].value / pieData.reduce((sum, d) => sum + d.value, 0)) * 100)
    : 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white dark:text-white dark:text-white">{t('dashboard.title')}</h1>
        <p className="text-gray-500 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400 mt-1 sm:mt-2">{t('dashboard.welcome')}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            onClick={stat.onClick}
            className={`group cursor-pointer bg-gradient-to-br ${stat.gradient} ${stat.hover} rounded-2xl p-5 sm:p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-white/80 text-sm font-medium">{stat.label}</p>
                <p className="text-3xl sm:text-4xl font-bold mt-1">{stat.value}</p>
                <p className="text-white/70 text-xs mt-1">{stat.subtext}</p>
              </div>
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-xl flex items-center justify-center text-2xl sm:text-3xl backdrop-blur-sm">
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t('appointments.newAppointment'), icon: '➕', path: '/appointments', color: 'blue' },
          { label: t('patients.addPatient'), icon: '👤', path: '/patients', color: 'purple' },
          { label: t('dashboard.createInvoice'), icon: '📝', path: '/invoices', color: 'green' },
          { label: t('dashboard.viewCalendar'), icon: '📅', path: '/appointments?view=calendar', color: 'orange' },
        ].map((action, i) => (
          <button
            key={i}
            onClick={() => navigate(action.path)}
            className={`flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 dark:border-gray-700 hover:border-${action.color}-300 hover:bg-${action.color}-50 dark:hover:bg-${action.color}-900/20 transition-all duration-200 group`}
          >
            <span className="text-lg">{action.icon}</span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 group-hover:text-gray-900 dark:text-white dark:text-white dark:group-hover:text-gray-100">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Revenue Trend - Larger */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white dark:text-white dark:text-white">{t('dashboard.revenueTrend')}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400">{t('dashboard.last6months')}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
              <span className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400">{t('dashboard.revenue')}</span>
            </div>
          </div>
          <div className="p-4 sm:p-6">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={data?.revenueByMonth || []}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={formatCurrency} />
                <Tooltip 
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value) => [`$${(value as number)?.toLocaleString() || 0}`, t('other.chartRevenue')]}
                />
                <Area type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={3} fill="url(#revenueGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Appointment Status Pie */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white dark:text-white dark:text-white">{t('dashboard.appointmentStatus')}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400">{t('dashboard.last6months')}</p>
          </div>
          <div className="p-4 sm:p-6">
            {pieData.length > 0 && pieData.reduce((sum, d) => sum + d.value, 0) > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-2">
                  {pieData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index] }}></span>
                      <span className="text-xs text-gray-600 dark:text-gray-400">{entry.name}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <p className="text-3xl font-bold text-gray-900 dark:text-white dark:text-white dark:text-white">{completionRate}%</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400">{t('dashboard.completionRate')}</p>
                </div>
              </>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-400">
                {t('common.noData')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Appointments Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white dark:text-white dark:text-white">{t('dashboard.appointmentsOverview')}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400">{t('dashboard.monthlyBreakdown')}</p>
          </div>
          <div className="p-4 sm:p-6">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data?.appointmentsByMonth || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend />
                <Bar dataKey="completed" stackId="a" fill="#22c55e" name={t('other.chartCompleted')} radius={[0, 0, 0, 0]} />
                <Bar dataKey="cancelled" stackId="a" fill="#ef4444" name={t('other.chartCancelled')} radius={[0, 0, 0, 0]} />
                <Bar dataKey="noShow" stackId="a" fill="#6b7280" name={t('other.chartNoShow')} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Patient Growth */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white dark:text-white dark:text-white">{t('dashboard.patientGrowth')}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400">{t('dashboard.newPatientsPerMonth')}</p>
          </div>
          <div className="p-4 sm:p-6">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data?.patientsByMonth || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value) => [value as number || 0, t('other.chartNewPatients')]}
                />
                <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Today's Schedule & Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Today's Appointments */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-5 sm:px-6 py-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span>📅</span>
              <span>{t('dashboard.todaysSchedule')}</span>
            </h2>
            <span className="bg-white/20 text-white text-sm px-3 py-1 rounded-full">
              {data?.todayAppointments?.length || 0} {t('appointments.title').toLowerCase()}
            </span>
          </div>
          <div className="p-4 sm:p-6 max-h-[400px] overflow-y-auto">
            {data?.todayAppointments?.length === 0 ? (
              <div className="text-center py-8 text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-400">
                <span className="text-5xl block mb-3">📅</span>
                <p className="font-medium">{t('dashboard.noAppointmentsToday')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data?.todayAppointments?.map((apt: Appointment) => (
                  <div 
                    key={apt.id} 
                    className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-xl hover:from-gray-100 hover:to-blue-100 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all cursor-pointer"
                    onClick={() => navigate('/appointments')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md">
                        {apt.patient?.firstName?.[0]}{apt.patient?.lastName?.[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white dark:text-white dark:text-white text-sm sm:text-base">{apt.patient?.firstName} {apt.patient?.lastName}</p>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400">
                          {new Date(apt.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {' • '}
                          {t('appointments.doctor')}. {apt.doctor?.firstName} {apt.doctor?.lastName}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 sm:px-3 py-1 text-xs font-medium rounded-full ${
                      apt.status === 'COMPLETED' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                      apt.status === 'CANCELLED' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                      apt.status === 'NO_SHOW' ? 'bg-gray-100 text-gray-700 dark:text-gray-300 dark:bg-gray-700 dark:text-gray-300' :
                      'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    }`}>
                      {apt.status === 'NO_SHOW' ? t('appointments.noShow') : apt.status === 'COMPLETED' ? t('appointments.completed') : apt.status === 'CANCELLED' ? t('appointments.cancelled') : t('appointments.scheduled')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-5 sm:px-6 py-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span>⏰</span>
              <span>{t('dashboard.upcomingAppointments')}</span>
            </h2>
            <span className="bg-white/20 text-white text-sm px-3 py-1 rounded-full">
              {t('dashboard.thisMonth')}
            </span>
          </div>
          <div className="p-4 sm:p-6 max-h-[400px] overflow-y-auto">
            {data?.upcomingAppointments?.length === 0 ? (
              <div className="text-center py-8 text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-400">
                <span className="text-5xl block mb-3">⏰</span>
                <p className="font-medium">{t('dashboard.noUpcomingAppointments')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data?.upcomingAppointments?.slice(0, 8).map((apt: Appointment) => (
                  <div 
                    key={apt.id} 
                    className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 rounded-xl hover:from-gray-100 hover:to-purple-100 dark:hover:from-gray-600 dark:hover:to-gray-500 transition-all cursor-pointer"
                    onClick={() => navigate('/appointments')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md">
                        {apt.patient?.firstName?.[0]}{apt.patient?.lastName?.[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">{apt.patient?.firstName} {apt.patient?.lastName}</p>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-300">
                          {new Date(apt.dateTime).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                          {' • '}
                          {new Date(apt.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">
                      {t('appointments.dr')} {apt.doctor?.firstName}
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
