import { useState } from 'react';
import { useGetCustomFieldsQuery, useCreateCustomFieldMutation, useDeleteCustomFieldMutation } from '../api';
import { showToast } from '../components/Toast';
import Modal from '../components/Modal';
import type { CustomField } from '../types';

const FIELD_TYPES = [
  { value: 'TEXT', label: 'Text' },
  { value: 'NUMBER', label: 'Number' },
  { value: 'DATE', label: 'Date' },
  { value: 'SELECT', label: 'Dropdown' },
];

export default function CustomFields() {
  const { data: fields, isLoading, refetch } = useGetCustomFieldsQuery(undefined);
  const [createField, { isLoading: isCreating }] = useCreateCustomFieldMutation();
  const [deleteField] = useDeleteCustomFieldMutation();
  const [showModal, setShowModal] = useState(false);
  const [newField, setNewField] = useState({
    name: '',
    fieldType: 'TEXT',
    options: '',
    required: false,
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createField({
        ...newField,
        options: newField.fieldType === 'SELECT' ? newField.options : null,
      }).unwrap();
      setShowModal(false);
      setNewField({ name: '', fieldType: 'TEXT', options: '', required: false });
      showToast('Custom field created!', 'success');
      refetch();
    } catch (error) {
      showToast('Failed to create field', 'error');
    }
  };

  const handleDelete = async (field: CustomField) => {
    if (confirm(`Delete "${field.name}"? This will also delete all patient data for this field.`)) {
      try {
        await deleteField(field.id).unwrap();
        showToast('Field deleted', 'success');
        refetch();
      } catch (error) {
        showToast('Failed to delete field', 'error');
      }
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Custom Fields</h1>
          <p className="text-gray-500 mt-1">Add custom fields to patient records</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-gradient text-white px-5 py-2.5 rounded-xl hover:shadow-lg transition-all duration-200 font-medium btn-shine"
        >
          + New Field
        </button>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-16 skeleton rounded-xl"></div>)}
        </div>
      ) : fields?.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">📝</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No custom fields</h3>
          <p className="text-gray-500 mb-6">Add custom fields to collect more patient info</p>
          <button onClick={() => setShowModal(true)} className="btn-gradient text-white px-6 py-3 rounded-xl">
            + Add Custom Field
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Field Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Required</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {fields?.map((field: CustomField) => (
                <tr key={field.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{field.name}</td>
                  <td className="px-6 py-4 text-gray-600">
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs">{field.fieldType}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {field.required ? '✓ Yes' : 'No'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleDelete(field)} className="text-red-500 hover:text-red-700">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Custom Field">
        <div className="p-6">
          <form onSubmit={handleCreate}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Field Name *</label>
                <input
                  type="text"
                  value={newField.name}
                  onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Insurance ID, Emergency Contact"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Field Type</label>
                <select
                  value={newField.fieldType}
                  onChange={(e) => setNewField({ ...newField, fieldType: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              {newField.fieldType === 'SELECT' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Options (comma separated)</label>
                  <input
                    type="text"
                    value={newField.options}
                    onChange={(e) => setNewField({ ...newField, options: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Option 1, Option 2, Option 3"
                  />
                </div>
              )}
              <div className="mb-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newField.required}
                    onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700">Required field</span>
                </label>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={isCreating} className="flex-1 btn-gradient text-white py-3 rounded-xl hover:shadow-lg disabled:opacity-50">
                  {isCreating ? 'Creating...' : 'Create Field'}
                </button>
              </div>
            </form>
        </div>
      </Modal>
    </div>
  );
}
