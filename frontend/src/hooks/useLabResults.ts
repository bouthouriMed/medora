import { useState } from 'react';
import {
  useGetLabResultsQuery,
  useGetPatientsQuery,
  useCreateLabResultMutation,
  useUpdateLabResultMutation,
  useDeleteLabResultMutation,
} from '../api';
import { showToast } from '../components/Toast';
import type { LabResult } from '../types';

export const LAB_CATEGORIES = [
  'Blood Test',
  'Urine Test',
  'Imaging',
  'Biopsy',
  'Pathology',
  'Chemistry',
  'Microbiology',
  'Other',
];

export function parseReferenceRange(rangeStr: string): { min?: number; max?: number } | null {
  if (!rangeStr) return null;
  
  const match = rangeStr.match(/([<>]=?|[-–])\s*(\d+\.?\d*)/g);
  if (!match) {
    const simpleRange = rangeStr.match(/(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)/);
    if (simpleRange) {
      return { min: parseFloat(simpleRange[1]), max: parseFloat(simpleRange[2]) };
    }
    const singleNum = rangeStr.match(/(\d+\.?\d*)/);
    if (singleNum) {
      return { max: parseFloat(singleNum[1]) };
    }
    return null;
  }
  
  const result: { min?: number; max?: number } = {};
  for (const part of match) {
    if (part.startsWith('>')) result.min = parseFloat(part.slice(1));
    else if (part.startsWith('>=')) result.min = parseFloat(part.slice(2));
    else if (part.startsWith('<')) result.max = parseFloat(part.slice(1));
    else if (part.startsWith('<=')) result.max = parseFloat(part.slice(2));
    else if (part.includes('-') || part.includes('–')) {
      const [min, max] = part.split(/[-–]/).map(n => parseFloat(n.trim()));
      if (!isNaN(min)) result.min = min;
      if (!isNaN(max)) result.max = max;
    }
  }
  return result.min !== undefined || result.max !== undefined ? result : null;
}

export function getResultStatus(result: string | null, normalRange: string | null): 'normal' | 'low' | 'high' | 'unknown' {
  if (!result || !normalRange) return 'unknown';
  
  const resultNum = parseFloat(result);
  if (isNaN(resultNum)) return 'unknown';
  
  const range = parseReferenceRange(normalRange);
  if (!range) return 'unknown';
  
  if (range.min !== undefined && resultNum < range.min) return 'low';
  if (range.max !== undefined && resultNum > range.max) return 'high';
  return 'normal';
}

export function useLabResults(t: (key: string) => string) {
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
        showToast(t('other.labResultUpdated'), 'success');
      } else {
        await createLabResult(formData).unwrap();
        showToast(t('other.labResultCreated'), 'success');
      }
      setShowModal(false);
      setEditingResult(null);
      setFormData({ patientId: '', testName: '', category: '', result: '', normalRange: '', status: 'PENDING', notes: '' });
    } catch (error) {
      showToast(t('other.failedToSaveLabResult'), 'error');
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
    if (confirm(t('other.deleteThisLabResult'))) {
      try {
        await deleteLabResult(id).unwrap();
        showToast(t('other.labResultDeleted'), 'success');
      } catch (error) {
        showToast(t('other.failedToDeleteLabResult'), 'error');
      }
    }
  };

  const handleOpenCreate = () => {
    setEditingResult(null);
    setFormData({ patientId: '', testName: '', category: '', result: '', normalRange: '', status: 'PENDING', notes: '' });
    setShowModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'ABNORMAL': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'PENDING': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      default: return 'bg-gray-100 text-gray-700 dark:text-gray-300';
    }
  };

  return {
    // State
    showModal, setShowModal,
    editingResult, setEditingResult,
    filterPatient, setFilterPatient,
    filterStatus, setFilterStatus,
    formData, setFormData,
    // Data
    labResults,
    patients,
    isLoading,
    // Actions
    handleSubmit,
    handleEdit,
    handleDelete,
    handleOpenCreate,
    getStatusColor,
  };
}
