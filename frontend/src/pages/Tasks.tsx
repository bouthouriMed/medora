import { useState } from 'react';
import { useGetTasksQuery, useCreateTaskMutation, useUpdateTaskMutation, useDeleteTaskMutation, useGetUsersQuery, useGetPatientsQuery } from '../api';
import { showToast } from '../components/Toast';
import { Icons } from '../components/Icons';
import Modal from '../components/Modal';
import type { Task, User, Patient } from '../types';
import { useTranslation } from 'react-i18next';
import { useTasks, PRIORITIES, STATUSES } from '../hooks/useTasks';

export default function Tasks() {
  const { t } = useTranslation();
  const priorityLabels: Record<string, string> = {
    HIGH: t('other.priorityHigh'),
    MEDIUM: t('other.priorityMedium'),
    LOW: t('other.priorityLow'),
  };
  const statusLabels: Record<string, string> = {
    PENDING: t('other.statusPending'),
    IN_PROGRESS: t('other.statusInProgress'),
    COMPLETED: t('other.statusCompleted'),
  };

  const {
    showModal, setShowModal,
    editingTask, setEditingTask,
    filterStatus, setFilterStatus,
    filterPriority, setFilterPriority,
    formData, setFormData,
    tasks,
    users,
    patients,
    isLoading,
    handleSubmit,
    handleEdit,
    handleDelete,
    handleStatusChange,
    handleOpenCreate,
    pendingTasks,
    completedTasks,
    getPriorityColor,
    getStatusColor,
  } = useTasks(t);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white dark:text-white dark:text-white">{t('other.tasks')}</h1>
          <p className="text-gray-500 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400 mt-1">{t('other.manageTasks')}</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="btn-gradient text-white px-5 py-2.5 rounded-xl hover:shadow-lg transition-all duration-200 font-medium btn-shine flex items-center gap-2"
        >
          <Icons.plus size={18} /> {t('other.newTask')}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 dark:border-gray-700 p-4">
        <div className="flex flex-wrap gap-3">
          <div className="min-w-[150px]">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
            >
              <option value="">{t('other.allStatuses')}</option>
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{statusLabels[s.label]}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[150px]">
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
            >
              <option value="">{t('other.allPriorities')}</option>
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>{priorityLabels[p.label]}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Task Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Icons.clock size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">{pendingTasks.length}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">{t('other.pendingTasks')}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Icons.alert size={20} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">{tasks?.filter((t: Task) => t.priority === 'HIGH' && t.status !== 'COMPLETED').length || 0}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">{t('other.highPriority')}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Icons.checkCircle size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">{completedTasks.length}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">{t('other.completedTask')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 skeleton rounded-2xl"></div>
          ))}
        </div>
      ) : tasks?.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">
            <Icons.task size={40} className="text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white dark:text-white mb-2">{t('other.noTasksYet')}</h3>
          <p className="text-gray-500 dark:text-gray-400 dark:text-gray-400 mb-6">{t('other.createFirstTask')}</p>
          <button
            onClick={() => setShowModal(true)}
            className="btn-gradient text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-200 font-medium"
          >
            + {t('other.createTask')}
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {tasks?.map((task: Task) => (
            <div key={task.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 p-5 hover:shadow-lg transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <button
                    onClick={() => handleStatusChange(task, task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED')}
                    className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      task.status === 'COMPLETED' ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-green-500'
                    }`}
                  >
                    {task.status === 'COMPLETED' && <Icons.check size={12} className="text-white" strokeWidth={3} />}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`font-semibold text-gray-900 dark:text-white dark:text-white ${task.status === 'COMPLETED' ? 'line-through opacity-60' : ''}`}>
                        {task.title}
                      </h3>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                    {task.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400 mt-1">{task.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      {task.dueDate && (
                        <span className="flex items-center gap-1">
                          <Icons.calendarClock size={14} />
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                      {task.patientId && (
                        <span className="flex items-center gap-1">
                          <Icons.user size={14} />
                          Patient linked
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 sm:flex-col md:flex-row">
                  <button
                    onClick={() => handleEdit(task)}
                    className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors flex items-center gap-1"
                  >
                    <Icons.edit size={16} /> {t('common.edit')}
                  </button>
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg font-medium transition-colors flex items-center gap-1"
                  >
                    <Icons.trash size={16} /> {t('common.delete')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditingTask(null); }} title={editingTask ? t('other.editTask') : t('other.newTask')}>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('other.titleField')}</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('other.titlePlaceholder')}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('other.descriptionField')}</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder={t('other.descriptionPlaceholder')}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('other.priorityField')}</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>{priorityLabels[p.label]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('other.statusField')}</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
                  >
                    {STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{statusLabels[s.label]}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('other.dueDateField')}</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('other.assignTo')}</label>
                  <select
                    value={formData.assignedTo}
                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
                  >
                    <option value="">{t('other.unassigned')}</option>
                    {users?.map((u: User) => (
                      <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('other.relatedPatient')}</label>
                  <select
                    value={formData.patientId}
                    onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
                  >
                    <option value="">{t('other.none')}</option>
                    {patients?.map((p: Patient) => (
                      <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingTask(null); }}
                  className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 font-medium"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-gradient text-white py-3 rounded-xl hover:shadow-lg font-medium transition-all btn-shine"
                >
                  {editingTask ? t('common.update') : t('common.create')}
                </button>
              </div>
            </form>
        </div>
      </Modal>
    </div>
  );
}
