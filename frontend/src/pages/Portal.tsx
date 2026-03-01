import { useParams } from 'react-router-dom';
import { useGetPortalDataQuery } from '../api';
import type { PortalData } from '../types';
import { useTranslation } from 'react-i18next';

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export default function Portal() {
  const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();
  const { data, isLoading, error } = useGetPortalDataQuery(token || '', {
    skip: !token,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your portal...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white mb-2">Unable to Load Portal</h1>
          <p className="text-gray-600 dark:text-gray-400">
            The link you followed may be invalid or expired. Please contact your healthcare provider for assistance.
          </p>
        </div>
      </div>
    );
  }

  const portalData = data as PortalData;
  const { patient, clinic, upcomingAppointments, pastAppointments, outstandingInvoices } = portalData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">{clinic.name}</h1>
              {clinic.address && <p className="text-gray-500 dark:text-gray-400 dark:text-gray-400 text-sm mt-1">{clinic.address}</p>}
            </div>
            <div className="text-right text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">
              {clinic.phone && <p>📞 {clinic.phone}</p>}
              {clinic.email && <p>✉️ {clinic.email}</p>}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {patient.firstName[0]}{patient.lastName[0]}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">
                Welcome, {patient.firstName}!
              </h2>
              <p className="text-gray-500 dark:text-gray-400 dark:text-gray-400">Your Personal Health Portal</p>
            </div>
          </div>
        </div>

        {outstandingInvoices.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-amber-800">
                Outstanding Invoices: {formatCurrency(outstandingInvoices.reduce((sum, inv) => sum + inv.amount, 0))}
              </h3>
            </div>
            <div className="space-y-3">
              {outstandingInvoices.map((invoice) => (
                <div key={invoice.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white dark:text-white">
                      Invoice #{invoice.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">
                      Due: {invoice.dueDate ? formatDate(invoice.dueDate) : 'No due date'}
                    </p>
                  </div>
                  <span className="text-lg font-bold text-amber-600">
                    {formatCurrency(invoice.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Upcoming Appointments
              </h3>
            </div>
            <div className="p-6">
              {upcomingAppointments.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 dark:text-gray-400 text-center py-4">No upcoming appointments</p>
              ) : (
                <div className="space-y-4">
                  {upcomingAppointments.map((apt) => (
                    <div key={apt.id} className="border-l-4 border-green-500 pl-4">
                      <p className="font-semibold text-gray-900 dark:text-white dark:text-white">{formatDate(apt.dateTime)}</p>
                      <p className="text-gray-600 dark:text-gray-400">{formatTime(apt.dateTime)}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">Dr. {apt.doctor?.firstName} {apt.doctor?.lastName}</p>
                      <span className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full ${
                        apt.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 dark:text-gray-300'
                      }`}>
                        {apt.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Appointment History
              </h3>
            </div>
            <div className="p-6">
              {pastAppointments.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 dark:text-gray-400 text-center py-4">No past appointments</p>
              ) : (
                <div className="space-y-4">
                  {pastAppointments.slice(0, 5).map((apt) => (
                    <div key={apt.id} className="border-l-4 border-purple-400 pl-4">
                      <p className="font-semibold text-gray-900 dark:text-white dark:text-white">{formatDate(apt.dateTime)}</p>
                      <p className="text-gray-600 dark:text-gray-400">{formatTime(apt.dateTime)}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">Dr. {apt.doctor?.firstName} {apt.doctor?.lastName}</p>
                      <span className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full ${
                        apt.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 
                        apt.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700 dark:text-gray-300'
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

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-700 to-gray-900 px-6 py-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Your Information
            </h3>
          </div>
          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">Full Name</p>
                <p className="font-semibold text-gray-900 dark:text-white dark:text-white">{patient.firstName} {patient.lastName}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">Email</p>
                <p className="font-semibold text-gray-900 dark:text-white dark:text-white">{patient.email || 'Not provided'}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">Phone</p>
                <p className="font-semibold text-gray-900 dark:text-white dark:text-white">{patient.phone || 'Not provided'}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">Date of Birth</p>
                <p className="font-semibold text-gray-900 dark:text-white dark:text-white">
                  {patient.dateOfBirth ? formatDate(patient.dateOfBirth) : 'Not provided'}
                </p>
              </div>
              {patient.address && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 md:col-span-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">Address</p>
                  <p className="font-semibold text-gray-900 dark:text-white dark:text-white">{patient.address}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} {clinic.name}. All rights reserved.
          </p>
          <p className="text-gray-500 dark:text-gray-400 dark:text-gray-400 text-xs mt-2">
            This is a read-only portal. For any questions, please contact the clinic directly.
          </p>
        </div>
      </footer>

      <style>{`
        @media print {
          body { background: white; }
          footer, .no-print { display: none; }
          .shadow-lg, .shadow-md, .shadow-sm { box-shadow: none; }
        }
      `}</style>
    </div>
  );
}
