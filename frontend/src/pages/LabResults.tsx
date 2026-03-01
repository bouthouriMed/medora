import { useState } from 'react';
import { useGetLabResultsQuery, useGetPatientsQuery, useCreateLabResultMutation, useUpdateLabResultMutation, useDeleteLabResultMutation } from '../api';
import { showToast } from '../components/Toast';
import Modal from '../components/Modal';
import type { LabResult, Patient } from '../types';
import { useTranslation } from 'react-i18next';

const LAB_CATEGORIES = [
  'Blood Test',
  'Urine Test',
  'Imaging',
  'Biopsy',
  'Pathology',
  'Chemistry',
  'Microbiology',
  'Other',
];

export default function LabResults() {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [editingResult, setEditingResult] = useState<LabResult | null>(null);
  const [filterPatient, setFilterPatient] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const { data: labResults, isLoading } = useGetLabResultsQuery({
    patientId: filterPatient || undefined,
    status: filterStatus || undefined,
  });
  const { data: patients } = useGetPatientsQuery('');
  const [createLabResult] = useCreateLabResultMutation();
  const [updateLabResult] = useUpdateLabResultMutation();
  const [deleteLabResult] = useDeleteLabResultMutation();

  const [formData, setFormData] = useState({
    patientId: '',
    testName: '',
    category: '',
    result: '',
    normalRange: '',
    status: 'PENDING',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingResult) {
        await updateLabResult({
          id: editingResult.id,
          ...formData,
        }).unwrap();
        showToast('Lab result updated!', 'success');
      } else {
        await createLabResult(formData).unwrap();
        showToast('Lab result created!', 'success');
      }
      setShowModal(false);
      setEditingResult(null);
      setFormData({ patientId: '', testName: '', category: '', result: '', normalRange: '', status: 'PENDING', notes: '' });
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to save lab result', 'error');
    }
  };

  const handleEdit = (result: LabResult) => {
    setEditingResult(result);
    setFormData({
      patientId: result.patientId,
      testName: result.testName,
      category: result.category || '',
      result: result.result || '',
      normalRange: result.normalRange || '',
      status: result.status,
      notes: result.notes || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this lab result?')) {
      try {
        await deleteLabResult(id).unwrap();
        showToast('Lab result deleted', 'success');
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Failed to delete', 'error');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-700';
      case 'ABNORMAL': return 'bg-red-100 text-red-700';
      case 'PENDING': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white dark:text-white">{t('other.labResults')}</h1>
          <p className="text-gray-500 dark:text-gray-400 dark:text-gray-400 mt-1">{t('other.trackLabResults')}</p>
        </div>
        <button
          onClick={() => {
            setEditingResult(null);
            setFormData({ patientId: '', testName: '', category: '', result: '', normalRange: '', status: 'PENDING', notes: '' });
            setShowModal(true);
          }}
          className="btn-gradient text-white px-5 py-2.5 rounded-xl hover:shadow-lg transition-all duration-200 font-medium btn-shine"
        >
          + {t('other.addLabResult')}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <select
              value={filterPatient}
              onChange={(e) => setFilterPatient(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
            >
              <option value="">All Patients</option>
              {patients?.map((p: Patient) => (
                <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[150px]">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
              <option value="ABNORMAL">Abnormal</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Grid */}
      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 skeleton rounded-2xl"></div>
          ))}
        </div>
      ) : labResults?.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">🧪</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No lab results found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Add your first lab result to get started</p>
          <button
            onClick={() => setShowModal(true)}
            className="btn-gradient text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-200 font-medium"
          >
            + Add Lab Result
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {labResults?.map((result: LabResult) => (
            <div key={result.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 p-5 hover:shadow-lg transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center text-white text-xl">🧪</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{result.testName}</h3>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(result.status)}`}>
                        {result.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {result.patient?.firstName} {result.patient?.lastName}
                      {result.category && ` • ${result.category}`}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Ordered: {new Date(result.orderedAt).toLocaleDateString()}
                      {result.completedAt && ` • Completed: ${new Date(result.completedAt).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 sm:flex-col md:flex-row">
                  <button
                    onClick={() => handleEdit(result)}
                    className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(result.id)}
                    className="px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg font-medium transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
              {(result.result || result.normalRange || result.notes) && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {result.result && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Result</p>
                        <p className="font-medium text-gray-900 dark:text-white">{result.result}</p>
                      </div>
                    )}
                    {result.normalRange && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Normal Range</p>
                        <p className="font-medium text-gray-600">{result.normalRange}</p>
                      </div>
                    )}
                    {result.notes && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Notes</p>
                        <p className="font-medium text-gray-600">{result.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditingResult(null); }} title={editingResult ? 'Edit Lab Result' : 'Add Lab Result'}>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Patient *</label>
                <select
                  value={formData.patientId}
                  onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
                  required
                >
                  <option value="">Select patient</option>
                  {patients?.map((p: Patient) => (
                    <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Test Name *</label>
                <input
                  type="text"
                  value={formData.testName}
                  onChange={(e) => setFormData({ ...formData, testName: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Complete Blood Count"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
                  >
                    <option value="">Select category</option>
                    {LAB_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="ABNORMAL">Abnormal</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Result</label>
                  <input
                    type="text"
                    value={formData.result}
                    onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 14.5 g/dL"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Normal Range</label>
                  <input
                    type="text"
                    value={formData.normalRange}
                    onChange={(e) => setFormData({ ...formData, normalRange: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 12.0-17.5 g/dL"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Additional notes..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingResult(null); }}
                  className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-gradient text-white py-3 rounded-xl hover:shadow-lg font-medium transition-all btn-shine"
                >
                  {editingResult ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
        </div>
      </Modal>
    </div>
  );
}
