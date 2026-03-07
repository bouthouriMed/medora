import { useState } from 'react';
import {
  useGetTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useGetUsersQuery,
  useGetPatientsQuery,
} from '../api';
import { showToast } from '../components/Toast';
import type { Task } from '../types';

export const PRIORITIES = [
  { value: 'HIGH', label: 'HIGH', color: 'red' },
  { value: 'MEDIUM', label: 'MEDIUM', color: 'yellow' },
  { value: 'LOW', label: 'LOW', color: 'green' },
];

export const STATUSES = [
  { value: 'PENDING', label: 'PENDING', color: 'gray' },
  { value: 'IN_PROGRESS', label: 'IN_PROGRESS', color: 'blue' },
  { value: 'COMPLETED', label: 'COMPLETED', color: 'green' },
];

export function useTasks(t: (key: string) => string) {
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  const { data: tasks, isLoading } = useGetTasksQuery({
    status: filterStatus || undefined,
    priority: filterPriority || undefined,
  });
  const { data: users } = useGetUsersQuery(undefined);
  const { data: patients } = useGetPatientsQuery('');
  const [createTask] = useCreateTaskMutation();
  const [updateTask] = useUpdateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    status: 'PENDING',
    dueDate: '',
    assignedTo: '',
    patientId: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        dueDate: formData.dueDate || undefined,
        assignedTo: formData.assignedTo || undefined,
        patientId: formData.patientId || undefined,
      };
      
      if (editingTask) {
        await updateTask({ id: editingTask.id, ...data }).unwrap();
        showToast(t('other.taskUpdated'), 'success');
      } else {
        await createTask(data).unwrap();
        showToast(t('other.taskCreated'), 'success');
      }
      setShowModal(false);
      setEditingTask(null);
      setFormData({ title: '', description: '', priority: 'MEDIUM', status: 'PENDING', dueDate: '', assignedTo: '', patientId: '' });
    } catch (error) {
      showToast(t('other.failedToSaveTask'), 'error');
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      assignedTo: task.assignedTo || '',
      patientId: task.patientId || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('other.deleteThisTask'))) {
      try {
        await deleteTask(id).unwrap();
        showToast(t('other.taskDeleted'), 'success');
      } catch (error) {
        showToast(t('other.failedToDeleteTask'), 'error');
      }
    }
  };

  const handleStatusChange = async (task: Task, newStatus: string) => {
    try {
      await updateTask({ id: task.id, status: newStatus }).unwrap();
      showToast(t('other.taskUpdated'), 'success');
    } catch (error) {
      showToast(t('other.failedToUpdate'), 'error');
    }
  };

  const handleOpenCreate = () => {
    setEditingTask(null);
    setFormData({ title: '', description: '', priority: 'MEDIUM', status: 'PENDING', dueDate: '', assignedTo: '', patientId: '' });
    setShowModal(true);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-700 border-red-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'LOW': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 dark:text-gray-300 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-700';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700';
      case 'PENDING': return 'bg-gray-100 text-gray-700 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-700 dark:text-gray-300';
    }
  };

  const pendingTasks = tasks?.filter((t: Task) => t.status !== 'COMPLETED') || [];
  const completedTasks = tasks?.filter((t: Task) => t.status === 'COMPLETED') || [];

  return {
    // State
    showModal, setShowModal,
    editingTask, setEditingTask,
    filterStatus, setFilterStatus,
    filterPriority, setFilterPriority,
    formData, setFormData,
    // Data
    tasks,
    users,
    patients,
    isLoading,
    // Actions
    handleSubmit,
    handleEdit,
    handleDelete,
    handleStatusChange,
    handleOpenCreate,
    // Computed
    pendingTasks,
    completedTasks,
    // Helpers
    getPriorityColor,
    getStatusColor,
  };
}
