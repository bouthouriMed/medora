import { useGetAnalyticsQuery, useGetSmartSchedulingQuery } from '../api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, PieChart, Pie, Cell, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { useTranslation } from 'react-i18next';

const COLORS = ['#3b82f6', '#22c55e', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const formatCurrency = (value: number) => value >= 1000 ? `$${(value / 1000).toFixed(1)}k` : `$${value}`;

export default function Analytics() {
  const { data, isLoading, error } = useGetAnalyticsQuery(undefined);
  const { data: scheduling } = useGetSmartSchedulingQuery(undefined);
  const { t } = useTranslation();

  if (isLoading) return (
    <div className="space-y-6">
      <div className="h-8 w-64 skeleton rounded-lg"></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 skeleton rounded-2xl"></div>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-80 skeleton rounded-2xl"></div>)}
      </div>
    </div>
  );

  if (error) return <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">Error loading analytics</div>;

  const stats = [
    { label: t('analytics.totalPatients'), value: data?.totalPatients || 0, icon: '👥', color: 'blue' },
    { label: t('analytics.totalAppointments'), value: data?.totalAppointments || 0, icon: '📅', color: 'purple' },
    { label: t('analytics.totalRevenue'), value: formatCurrency(data?.totalRevenue || 0), icon: '💰', color: 'green' },
    { label: t('analytics.avgRevenuePerPatient'), value: formatCurrency(data?.avgRevenuePerPatient || 0), icon: '📊', color: 'orange' },
  ];

  const statusColors: Record<string, string> = {
    SCHEDULED: '#3b82f6', COMPLETED: '#22c55e', CANCELLED: '#ef4444', NO_SHOW: '#6b7280',
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">{t('analytics.title')}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">{t('analytics.subtitle')}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
              </div>
              <div className="w-12 h-12 bg-gray-50 dark:bg-gray-700 rounded-xl flex items-center justify-center text-2xl">{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Trend (12 months) */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('analytics.revenueTrend')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('analytics.last12months')}</p>
        </div>
        <div className="p-4 sm:p-6">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data?.revenueByMonth || []}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#9ca3af" tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" tickFormatter={formatCurrency} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} formatter={(v) => [`$${(v as number).toLocaleString()}`, 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={3} fill="url(#revenueGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row: Doctor Performance + Peak Hours */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Doctor */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('analytics.revenueByDoctor')}</h2>
          </div>
          <div className="p-4 sm:p-6">
            {data?.revenueByDoctor?.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.revenueByDoctor} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tickFormatter={formatCurrency} tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <Tooltip contentStyle={{ borderRadius: 12, border: 'none' }} formatter={(v) => [`$${(v as number).toLocaleString()}`, 'Revenue']} />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="h-[250px] flex items-center justify-center text-gray-400">{t('common.noData')}</div>}
          </div>
        </div>

        {/* Peak Hours */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('analytics.peakHours')}</h2>
          </div>
          <div className="p-4 sm:p-6">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data?.peakHours || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none' }} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row: Appointments by Doctor + Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointments by Doctor */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('analytics.appointmentsByDoctor')}</h2>
          </div>
          <div className="p-4 sm:p-6">
            {data?.appointmentsByDoctor?.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.appointmentsByDoctor}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <Tooltip contentStyle={{ borderRadius: 12, border: 'none' }} />
                  <Legend />
                  <Bar dataKey="completed" stackId="a" fill="#22c55e" name={t('appointments.completed')} />
                  <Bar dataKey="cancelled" stackId="a" fill="#ef4444" name={t('appointments.cancelled')} />
                  <Bar dataKey="noShow" stackId="a" fill="#6b7280" name={t('appointments.noShow')} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="h-[250px] flex items-center justify-center text-gray-400">{t('common.noData')}</div>}
          </div>
        </div>

        {/* Appointment Status Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('analytics.statusBreakdown')}</h2>
          </div>
          <div className="p-4 sm:p-6">
            {data?.appointmentStatusBreakdown?.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={data.appointmentStatusBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="count" nameKey="status">
                      {data.appointmentStatusBreakdown.map((entry: any, i: number) => (
                        <Cell key={i} fill={statusColors[entry.status] || COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, border: 'none' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-4 mt-2">
                  {data.appointmentStatusBreakdown.map((entry: any, i: number) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: statusColors[entry.status] || COLORS[i % COLORS.length] }}></span>
                      <span className="text-xs text-gray-600 dark:text-gray-400">{entry.status} ({entry.count})</span>
                    </div>
                  ))}
                </div>
              </>
            ) : <div className="h-[200px] flex items-center justify-center text-gray-400">{t('common.noData')}</div>}
          </div>
        </div>
      </div>

      {/* Row: Patient Growth + Top Diagnoses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient Growth */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('analytics.patientGrowth')}</h2>
          </div>
          <div className="p-4 sm:p-6">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data?.patientsByMonth || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#9ca3af" tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none' }} />
                <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Diagnoses */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('analytics.topDiagnoses')}</h2>
          </div>
          <div className="p-4 sm:p-6">
            {data?.topDiagnoses?.length > 0 ? (
              <div className="space-y-3">
                {data.topDiagnoses.map((d: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: COLORS[i % COLORS.length] }}>{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{d.name}</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white ml-2">{d.count}</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                        <div className="h-2 rounded-full" style={{ width: `${(d.count / (data.topDiagnoses[0]?.count || 1)) * 100}%`, backgroundColor: COLORS[i % COLORS.length] }}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : <div className="h-[250px] flex items-center justify-center text-gray-400">{t('common.noData')}</div>}
          </div>
        </div>
      </div>

      {/* Smart Scheduling Suggestions */}
      {scheduling?.suggestions?.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('analytics.smartScheduling')}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('analytics.smartSchedulingDesc')}</p>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {scheduling.suggestions.map((s: any, i: number) => (
              <div key={i} className="px-6 py-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {s.patientName} → Dr. {s.doctorName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('analytics.openSlot')}: {new Date(s.suggestedDateTime).toLocaleString()} • {t('analytics.matchScore')}: {s.matchScore}%
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  s.matchScore >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                  s.matchScore >= 50 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                  'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                }`}>
                  {s.matchScore >= 80 ? t('analytics.highMatch') : s.matchScore >= 50 ? t('analytics.medMatch') : t('analytics.lowMatch')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Appointment Trends (12 months) */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('analytics.appointmentTrends')}</h2>
        </div>
        <div className="p-4 sm:p-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data?.appointmentsByMonth || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#9ca3af" tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none' }} />
              <Legend />
              <Bar dataKey="completed" stackId="a" fill="#22c55e" name={t('appointments.completed')} />
              <Bar dataKey="cancelled" stackId="a" fill="#ef4444" name={t('appointments.cancelled')} />
              <Bar dataKey="noShow" stackId="a" fill="#6b7280" name={t('appointments.noShow')} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
