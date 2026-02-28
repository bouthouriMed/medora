import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGetInvoicesQuery, useGetAppointmentsQuery, useGetPatientsQuery, useCreateInvoiceMutation, useMarkInvoiceAsPaidMutation, useMarkInvoiceAsUnpaidMutation } from '../api';
import { showToast } from '../components/Toast';
import type { Invoice, Patient, Appointment } from '../types';

export default function Invoices() {
  const [showModal, setShowModal] = useState(false);
  const [searchParams] = useSearchParams();
  const statusParam = searchParams.get('status') || '';
  const [statusFilter, setStatusFilter] = useState<string>(statusParam);
  
  const { data: invoices, isLoading } = useGetInvoicesQuery(statusFilter || '');
  const { data: appointments } = useGetAppointmentsQuery({});
  const { data: patients } = useGetPatientsQuery('');
  const [createInvoice, { isLoading: isCreating }] = useCreateInvoiceMutation();
  const [markAsPaid] = useMarkInvoiceAsPaidMutation();
  const [markAsUnpaid] = useMarkInvoiceAsUnpaidMutation();

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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-500 mt-1">Manage billing and payments</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-gradient text-white px-5 py-2.5 rounded-xl hover:shadow-lg transition-all duration-200 font-medium btn-shine"
        >
          + Create Invoice
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-md border border-gray-100 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Invoices</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{invoices?.length || 0}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center text-2xl">📋</div>
          </div>
        </div>
        <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-md border border-gray-100 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Paid</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-600 mt-1">${totalPaid.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center text-2xl">✅</div>
          </div>
        </div>
        <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-md border border-gray-100 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Unpaid</p>
              <p className="text-2xl sm:text-3xl font-bold text-orange-500 mt-1">${totalUnpaid.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-red-100 rounded-xl flex items-center justify-center text-2xl">⏳</div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm transition-all"
        >
          <option value="">All Invoices</option>
          <option value="PAID">Paid</option>
          <option value="UNPAID">Unpaid</option>
        </select>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 skeleton rounded-2xl"></div>
          ))}
        </div>
      ) : invoices?.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">📄</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No invoices found</h3>
          <p className="text-gray-500 mb-6">Create your first invoice to get started</p>
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
          <div className="hidden md:block bg-white shadow-lg border border-gray-100 rounded-2xl overflow-hidden">
            <div className="table-responsive">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Invoice #</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Patient</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Due Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoices?.map((invoice: Invoice) => (
                    <tr key={invoice.id} className="hover:bg-blue-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-600">
                        #{invoice.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-md">
                            {invoice.patient?.firstName?.[0]}{invoice.patient?.lastName?.[0]}
                          </div>
                          <span className="font-medium text-gray-900">
                            {invoice.patient?.firstName} {invoice.patient?.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                        ${Number(invoice.amount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusClass(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
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
              <div key={invoice.id} className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 hover-lift">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
                      {invoice.patient?.firstName?.[0]}{invoice.patient?.lastName?.[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{invoice.patient?.firstName} {invoice.patient?.lastName}</p>
                      <p className="text-sm text-gray-500">#{invoice.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusClass(invoice.status)}`}>
                    {invoice.status}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl font-bold text-gray-900">${Number(invoice.amount).toFixed(2)}</span>
                  <span className="text-sm text-gray-500">
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
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 modal-backdrop">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl modal-content max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Create Invoice</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Patient *</label>
                <select
                  value={formData.patientId}
                  onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Appointment *</label>
                <select
                  value={formData.appointmentId}
                  onChange={(e) => setFormData({ ...formData, appointmentId: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Due Date</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <div className="flex gap-3">
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
                  {isCreating ? 'Creating...' : 'Create Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
