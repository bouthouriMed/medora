import { useState } from 'react';
import { useGetNoteTemplatesQuery, useCreateNoteTemplateMutation, useDeleteNoteTemplateMutation } from '../api';
import { showToast } from '../components/Toast';
import Modal from '../components/Modal';
import type { NoteTemplate } from '../types';
import { useTranslation } from 'react-i18next';

export default function NoteTemplates() {
  const { t } = useTranslation();
  const { data: templates, isLoading, refetch } = useGetNoteTemplatesQuery(undefined);
  const [createTemplate, { isLoading: isCreating }] = useCreateNoteTemplateMutation();
  const [deleteTemplate] = useDeleteNoteTemplateMutation();
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<string>('');
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    content: '',
    type: 'APPOINTMENT',
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTemplate(newTemplate).unwrap();
      setShowModal(false);
      setNewTemplate({ name: '', content: '', type: 'APPOINTMENT' });
      showToast('Template created!', 'success');
      refetch();
    } catch (error) {
      showToast('Failed to create template', 'error');
    }
  };

  const handleDelete = async (template: NoteTemplate) => {
    if (confirm(`Delete "${template.name}"?`)) {
      try {
        await deleteTemplate(template.id).unwrap();
        showToast('Template deleted', 'success');
        refetch();
      } catch (error) {
        showToast('Failed to delete template', 'error');
      }
    }
  };

  const filteredTemplates = templates?.filter((t: NoteTemplate) => 
    filter ? t.type === filter : true
  ) || [];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white dark:text-white">{t('other.noteTemplates')}</h1>
          <p className="text-gray-500 dark:text-gray-400 dark:text-gray-400 mt-1">{t('other.noteTemplatesDesc')}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-gradient text-white px-5 py-2.5 rounded-xl hover:shadow-lg transition-all duration-200 font-medium btn-shine"
        >
          + {t('other.newTemplate')}
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setFilter('')}
          className={`px-4 py-2 rounded-xl font-medium transition-colors ${!filter ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:text-gray-300'}`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('APPOINTMENT')}
          className={`px-4 py-2 rounded-xl font-medium transition-colors ${filter === 'APPOINTMENT' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:text-gray-300'}`}
        >
          Appointment
        </button>
        <button
          onClick={() => setFilter('INVOICE')}
          className={`px-4 py-2 rounded-xl font-medium transition-colors ${filter === 'INVOICE' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:text-gray-300'}`}
        >
          Invoice
        </button>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-24 skeleton rounded-xl"></div>)}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No templates</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Create templates for quick note entry</p>
          <button onClick={() => setShowModal(true)} className="btn-gradient text-white px-6 py-3 rounded-xl">
            + Create Template
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template: NoteTemplate) => (
            <div key={template.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 p-4 hover-lift">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{template.name}</h3>
                  <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">{template.type}</span>
                </div>
                <button onClick={() => handleDelete(template)} className="text-gray-400 hover:text-red-500">
                  ✕
                </button>
              </div>
              <p className="text-sm text-gray-600 line-clamp-3 whitespace-pre-wrap">{template.content}</p>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Note Template">
        <div className="p-6">
          <form onSubmit={handleCreate}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Template Name *</label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Follow-up Visit"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Type</label>
                <select
                  value={newTemplate.type}
                  onChange={(e) => setNewTemplate({ ...newTemplate, type: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="APPOINTMENT">Appointment</option>
                  <option value="INVOICE">Invoice</option>
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Content *</label>
                <textarea
                  value={newTemplate.content}
                  onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                  rows={5}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Template content..."
                  required
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700">
                  Cancel
                </button>
                <button type="submit" disabled={isCreating} className="flex-1 btn-gradient text-white py-3 rounded-xl hover:shadow-lg disabled:opacity-50">
                  {isCreating ? 'Creating...' : 'Create Template'}
                </button>
              </div>
            </form>
        </div>
      </Modal>
    </div>
  );
}
