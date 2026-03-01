import { useState } from 'react';
import { useGetTagsQuery, useCreateTagMutation, useDeleteTagMutation } from '../api';
import { showToast } from '../components/Toast';
import Modal from '../components/Modal';
import type { Tag } from '../types';
import { useTranslation } from 'react-i18next';

const TAG_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#0ea5e9', '#64748b',
];

export default function Tags() {
  const { t } = useTranslation();
  const { data: tags, isLoading, refetch } = useGetTagsQuery(undefined);
  const [createTag, { isLoading: isCreating }] = useCreateTagMutation();
  const [deleteTag] = useDeleteTagMutation();
  const [showModal, setShowModal] = useState(false);
  const [newTag, setNewTag] = useState({ name: '', color: TAG_COLORS[0] });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTag(newTag).unwrap();
      setShowModal(false);
      setNewTag({ name: '', color: TAG_COLORS[0] });
      showToast('Tag created successfully!', 'success');
      refetch();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to create tag', 'error');
    }
  };

  const handleDelete = async (tag: Tag) => {
    if (confirm(`Are you sure you want to delete "${tag.name}"?`)) {
      try {
        await deleteTag(tag.id).unwrap();
        showToast('Tag deleted', 'success');
        refetch();
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Failed to delete tag', 'error');
      }
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white dark:text-white">{t('other.patientTags')}</h1>
          <p className="text-gray-500 dark:text-gray-400 dark:text-gray-400 mt-1">{t('other.organizePatients')}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-gradient text-white px-5 py-2.5 rounded-xl hover:shadow-lg transition-all duration-200 font-medium btn-shine"
        >
          + {t('other.newTag')}
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 skeleton rounded-xl"></div>
          ))}
        </div>
      ) : tags?.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">🏷️</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No tags yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Create tags to categorize your patients</p>
          <button
            onClick={() => setShowModal(true)}
            className="btn-gradient text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-200 font-medium"
          >
            + Create Tag
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {tags?.map((tag: Tag) => (
            <div key={tag.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 p-4 hover-lift">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  ></div>
                  <span className="font-medium text-gray-900 dark:text-white">{tag.name}</span>
                </div>
                <button
                  onClick={() => handleDelete(tag)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {tag.patientCount || 0} patient{tag.patientCount !== 1 ? 's' : ''}
              </p>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Tag">
        <div className="p-6">
          <form onSubmit={handleCreate}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Name *</label>
                <input
                  type="text"
                  value={newTag.name}
                  onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., VIP, New Patient, Chronic"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Color</label>
                <div className="flex flex-wrap gap-2">
                  {TAG_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewTag({ ...newTag, color })}
                      className={`w-8 h-8 rounded-full transition-transform ${newTag.color === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-110'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 btn-gradient text-white py-3 rounded-xl hover:shadow-lg font-medium disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create Tag'}
                </button>
              </div>
            </form>
        </div>
      </Modal>
    </div>
  );
}
