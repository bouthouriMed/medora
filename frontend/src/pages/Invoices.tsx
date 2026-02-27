import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGetInvoicesQuery, useGetAppointmentsQuery, useGetPatientsQuery, useCreateInvoiceMutation, useMarkInvoiceAsPaidMutation, useMarkInvoiceAsUnpaidMutation } from '../api';
import { showToast } from '../components/Toast';

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
    } catch (error: any) {
      showToast(error?.data?.error || 'Failed to create invoice', 'error');
    }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      await markAsPaid(id).unwrap();
      showToast('Invoice marked as paid!', 'success');
    } catch (error: any) {
      showToast(error?.data?.error || 'Failed to update invoice', 'error');
    }
  };

  const handleMarkUnpaid = async (id: string) => {
    try {
      await markAsUnpaid(id).unwrap();
      showToast('Invoice marked as unpaid', 'success');
    } catch (error: any) {
      showToast(error?.data?.error || 'Failed to update invoice', 'error');
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700';
  };

  const totalUnpaid = invoices?.filter((i: any) => i.status === 'UNPAID').reduce((sum: number, i: any) => sum + Number(i.amount), 0) || 0;
  const totalPaid = invoices?.filter((i: any) => i.status === 'PAID').reduce((sum: number, i: any) => sum + Number(i.amount), 0) || 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-500 mt-1">Manage billing and payments</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-2.5 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
        >
          + Create Invoice
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Invoices</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{invoices?.length || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl">📋</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Paid</p>
              <p className="text-3xl font-bold text-green-600 mt-1">${totalPaid.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-2xl">✅</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Unpaid</p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">${totalUnpaid.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center text-2xl">⏳</div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
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

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
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
              {invoices?.map((invoice: any) => (
                <tr key={invoice.id} className="hover:bg-blue-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-600">
                    #{invoice.id.slice(0, 8).toUpperCase()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
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
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
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
                        className="text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 px-3 py-1.5 rounded-lg transition-colors font-medium"
                      >
                        Mark Unpaid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {invoices?.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <span className="text-5xl block mb-3">📄</span>
              No invoices found
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-6 text-gray-900">Create Invoice</h2>
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Appointment</label>
                <select
                  value={formData.appointmentId}
                  onChange={(e) => setFormData({ ...formData, appointmentId: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                  required
                >
                  <option value="">Select appointment</option>
                  {appointments?.filter((a: any) => a.status === 'COMPLETED').map((a: any) => (
                    <option key={a.id} value={a.id}>
                      {new Date(a.dateTime).toLocaleDateString()} - {a.patient?.firstName} {a.patient?.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
