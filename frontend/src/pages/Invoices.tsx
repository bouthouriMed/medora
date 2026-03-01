import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGetInvoicesQuery, useGetAppointmentsQuery, useGetPatientsQuery, useCreateInvoiceMutation, useMarkInvoiceAsPaidMutation, useMarkInvoiceAsUnpaidMutation, useGetPresetsQuery } from '../api';
import { showToast } from '../components/Toast';
import { exportInvoices } from '../utils/export';
import Modal from '../components/Modal';
import type { Invoice, Patient, Appointment } from '../types';
import { useTranslation } from 'react-i18next';

export default function Invoices() {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showFilters, setShowFilters] = useState(false);

  const statusFilter = searchParams.get('status') || '';
  
  const { data: invoices, isLoading } = useGetInvoicesQuery(statusFilter);
  const { data: appointments } = useGetAppointmentsQuery({});
  const { data: patients } = useGetPatientsQuery('');
  const { data: presets } = useGetPresetsQuery('PROCEDURE');
  const [createInvoice, { isLoading: isCreating }] = useCreateInvoiceMutation();
  const [markAsPaid] = useMarkInvoiceAsPaidMutation();
  const [markAsUnpaid] = useMarkInvoiceAsUnpaidMutation();

  const handleStatusChange = (status: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (status) {
      newParams.set('status', status);
    } else {
      newParams.delete('status');
    }
    setSearchParams(newParams);
  };

  const [formData, setFormData] = useState({
    appointmentId: '',
    patientId: '',
    amount: '',
    dueDate: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createInvoice({
        ...formData,
        amount: parseFloat(formData.amount),
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
      }).unwrap();
      setShowModal(false);
      setFormData({ appointmentId: '', patientId: '', amount: '', dueDate: '' });
      showToast('Invoice created successfully!', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to create invoice', 'error');
    }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      await markAsPaid(id).unwrap();
      showToast('Invoice marked as paid!', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to update invoice', 'error');
    }
  };

  const handleMarkUnpaid = async (id: string) => {
    try {
      await markAsUnpaid(id).unwrap();
      showToast('Invoice marked as unpaid', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to update invoice', 'error');
    }
  };

  const getStatusClass = (status: string) => {
    return status === 'PAID' ? 'status-paid' : 'status-unpaid';
  };

  const totalUnpaid = invoices?.filter((i: Invoice) => i.status === 'UNPAID').reduce((sum: number, i: Invoice) => sum + Number(i.amount), 0) || 0;
  const totalPaid = invoices?.filter((i: Invoice) => i.status === 'PAID').reduce((sum: number, i: Invoice) => sum + Number(i.amount), 0) || 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white dark:text-white dark:text-white">{t('invoices.title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400 mt-1">{t('invoices.manageBilling')}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => exportInvoices(statusFilter)}
            className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:border-gray-700 text-gray-700 dark:text-gray-300 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 dark:hover:bg-gray-700 transition-colors font-medium"
          >
            📥 {t('common.export')}
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="btn-gradient text-white px-5 py-2.5 rounded-xl hover:shadow-lg transition-all duration-200 font-medium btn-shine"
          >
            + {t('invoices.createInvoice')}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 dark:border-gray-700 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400 font-medium">{t('invoices.totalInvoices')}</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white dark:text-white dark:text-white mt-1">{invoices?.length || 0}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-xl flex items-center justify-center text-2xl">📋</div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 dark:border-gray-700 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400 font-medium">{t('invoices.paid')}</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400 mt-1">${totalPaid.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 rounded-xl flex items-center justify-center text-2xl">✅</div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 dark:border-gray-700 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400 font-medium">{t('invoices.unpaid')}</p>
              <p className="text-2xl sm:text-3xl font-bold text-orange-500 dark:text-orange-400 mt-1">${totalUnpaid.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900 dark:to-red-900 rounded-xl flex items-center justify-center text-2xl">⏳</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 p-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium hover:text-gray-900 dark:text-white dark:text-white transition-colors"
        >
          <svg className={`w-5 h-5 transition-transform ${showFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
            {[statusFilter, dateRange.start, dateRange.end].filter(Boolean).length || 'All'}
          </span>
        </button>
        
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[150px]">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 dark:text-gray-400 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">All Statuses</option>
                  <option value="PAID">Paid</option>
                  <option value="UNPAID">Unpaid</option>
                </select>
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 dark:text-gray-400 mb-1">From Date</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 dark:text-gray-400 mb-1">To Date</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={() => {
                  handleStatusChange('');
                  setDateRange({ start: '', end: '' });
                }}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white dark:text-white hover:bg-gray-100 rounded-lg transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 skeleton rounded-2xl"></div>
          ))}
        </div>
      ) : invoices?.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">📄</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white dark:text-white mb-2">No invoices found</h3>
          <p className="text-gray-500 dark:text-gray-400 dark:text-gray-400 mb-6">Create your first invoice to get started</p>
          <button
            onClick={() => setShowModal(true)}
            className="btn-gradient text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-200 font-medium"
          >
            + Create Invoice
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden">
            <div className="table-responsive">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 dark:text-gray-300 uppercase tracking-wider">Invoice #</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 dark:text-gray-300 uppercase tracking-wider">Patient</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 dark:text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 dark:text-gray-300 uppercase tracking-wider">Due Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 dark:text-gray-300 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {invoices?.map((invoice: Invoice) => (
                    <tr key={invoice.id} className="hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400">
                        #{invoice.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-md">
                            {invoice.patient?.firstName?.[0]}{invoice.patient?.lastName?.[0]}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white dark:text-white">
                            {invoice.patient?.firstName} {invoice.patient?.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900 dark:text-white dark:text-white">
                        ${Number(invoice.amount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusClass(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400 dark:text-gray-400">
                        {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400 dark:text-gray-400">
                        {new Date(invoice.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        {invoice.status === 'UNPAID' ? (
                          <button
                            onClick={() => handleMarkPaid(invoice.id)}
                            className="text-green-600 hover:text-green-800 hover:bg-green-50 px-3 py-1.5 rounded-lg transition-colors font-medium"
                          >
                            Mark Paid
                          </button>
                        ) : (
                          <button
                            onClick={() => handleMarkUnpaid(invoice.id)}
                            className="text-orange-600 hover:text-orange-800 hover:bg-orange-50 px-3 py-1.5 rounded-lg transition-colors font-medium"
                          >
                            Mark Unpaid
                          </button>
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
            {invoices?.map((invoice: Invoice) => (
              <div key={invoice.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 p-4 hover-lift">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
                      {invoice.patient?.firstName?.[0]}{invoice.patient?.lastName?.[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white dark:text-white">{invoice.patient?.firstName} {invoice.patient?.lastName}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">#{invoice.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusClass(invoice.status)}`}>
                    {invoice.status}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">${Number(invoice.amount).toFixed(2)}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">
                    Due: {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'No due date'}
                  </span>
                </div>
                {invoice.status === 'UNPAID' ? (
                  <button
                    onClick={() => handleMarkPaid(invoice.id)}
                    className="w-full text-green-600 hover:bg-green-50 px-4 py-2.5 rounded-xl transition-colors font-medium text-center"
                  >
                    ✓ Mark as Paid
                  </button>
                ) : (
                  <button
                    onClick={() => handleMarkUnpaid(invoice.id)}
                    className="w-full text-orange-600 hover:bg-orange-50 px-4 py-2.5 rounded-xl transition-colors font-medium text-center"
                  >
                    ↩ Mark as Unpaid
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Invoice">
        <div className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Patient *</label>
              <select
                value={formData.patientId}
                onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                required
              >
                <option value="">Select patient</option>
                {patients?.map((p: Patient) => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName}
                  </option>
                ))}
              </select>
            </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Appointment *</label>
                <select
                  value={formData.appointmentId}
                  onChange={(e) => setFormData({ ...formData, appointmentId: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                  required
                >
                  <option value="">Select appointment</option>
                  {appointments?.filter((a: Appointment) => a.status === 'COMPLETED').map((a: Appointment) => (
                    <option key={a.id} value={a.id}>
                      {new Date(a.dateTime).toLocaleDateString()} - {a.patient?.firstName} {a.patient?.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Amount ($) *</label>
                {presets && presets.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1">
                    {presets.slice(0, 5).map((preset: any) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, amount: String(preset.price || 0) })}
                        className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded-full hover:bg-green-100"
                      >
                        {preset.name} ${preset.price}
                      </button>
                    ))}
                  </div>
                )}
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder=" 0.00"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Due Date</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 btn-gradient text-white py-3 rounded-xl hover:shadow-lg font-medium transition-all disabled:opacity-50 btn-shine"
                >
                  {isCreating ? 'Creating...' : 'Create Invoice'}
                </button>
              </div>
            </form>
        </div>
      </Modal>
    </div>
  );
}
