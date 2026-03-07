import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useGetPatientsQuery,
  useCreatePatientMutation,
  useDeletePatientMutation,
  useRestorePatientMutation,
} from '../api';
import { showToast } from '../components/Toast';
import type { Patient } from '../types';

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  address: '',
  notes: '',
};

export function usePatientList(t: (key: string) => string) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState({ tag: '', dateFrom: '', dateTo: '' });
  const [formData, setFormData] = useState(EMPTY_FORM);

  const { data: patients, isLoading } = useGetPatientsQuery({ search, includeArchived: showArchived });
  const [createPatient, { isLoading: isCreating }] = useCreatePatientMutation();
  const [deletePatient] = useDeletePatientMutation();
  const [restorePatient] = useRestorePatientMutation();

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredPatients = useMemo(() => {
    if (!patients) return [];
    return patients.filter((patient: Patient) => {
      if (filters.tag) {
        const hasTag = patient.patientTags?.some((pt: any) => pt.tagId === filters.tag);
        if (!hasTag) return false;
      }
      if (filters.dateFrom) {
        if (new Date(patient.createdAt) < new Date(filters.dateFrom)) return false;
      }
      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59);
        if (new Date(patient.createdAt) > toDate) return false;
      }
      return true;
    });
  }, [patients, filters]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPatient({
        ...formData,
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth) : undefined,
      }).unwrap();
      setShowModal(false);
      setFormData(EMPTY_FORM);
      showToast(t('other.patientCreated'), 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('other.failedToCreatePatient'), 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('other.confirmArchivePatient'))) {
      try {
        await deletePatient(id).unwrap();
        showToast(t('other.patientArchived'), 'success');
      } catch {
        showToast(t('other.failedToArchivePatient'), 'error');
      }
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await restorePatient(id).unwrap();
      showToast('Patient restored successfully', 'success');
    } catch {
      showToast('Failed to restore patient', 'error');
    }
  };

  const handleViewPatient = (patient: Patient) => {
    navigate(`/patients/${patient.id}`);
  };

  return {
    // State
    search, setSearch,
    showModal, setShowModal,
    showFilters, setShowFilters,
    openMenuId, setOpenMenuId,
    showArchived, setShowArchived,
    filters, setFilters,
    formData, setFormData,
    menuRef,
    // Data
    patients: filteredPatients,
    isLoading,
    isCreating,
    // Actions
    handleSubmit,
    handleDelete,
    handleRestore,
    handleViewPatient,
  };
}
