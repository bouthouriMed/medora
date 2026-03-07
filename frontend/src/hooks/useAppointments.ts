import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  useGetAppointmentsQuery,
  useGetPatientsQuery,
  useGetUsersQuery,
  useCreateAppointmentMutation,
  useCancelAppointmentMutation,
  useUpdateAppointmentMutation,
  useCompleteWithInvoiceMutation,
  useGetNoteTemplatesQuery,
  useGetRecurringAppointmentsQuery,
  useCreateRecurringAppointmentMutation,
  useDeleteRecurringAppointmentMutation,
  useGetAppointmentRequestsQuery,
  useApproveAppointmentRequestMutation,
  useRejectAppointmentRequestMutation,
} from '../api';
import { showToast } from '../components/Toast';
import type { Appointment, Patient, User, NoteTemplate } from '../types';

export function useAppointmentData() {
  const [searchParams] = useSearchParams();
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = searchParams.get('date');
    return d || new Date().toISOString().split('T')[0];
  });
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [activeTab, setActiveTab] = useState<'appointments' | 'requests' | 'recurring'>('appointments');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  const filter = searchParams.get('filter');
  const startDateParam = searchParams.get('startDate');
  const endDateParam = searchParams.get('endDate');

  const dateRange = useMemo(() => {
    if (viewMode === 'calendar') return undefined;
    
    if (filter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      return { startDate: today, endDate: today };
    }
    
    if (filter === 'upcoming') {
      const today = new Date().toISOString().split('T')[0];
      return { startDate: today };
    }
    
    if (startDateParam && endDateParam) {
      return { startDate: startDateParam, endDate: endDateParam };
    }
    
    if (startDateParam) {
      return { startDate: startDateParam, endDate: startDateParam };
    }
    
    return undefined;
  }, [selectedDate, viewMode, filter, startDateParam, endDateParam]);

  const { data: appointments = [], isLoading } = useGetAppointmentsQuery(dateRange);
  const { data: allAppointments = [] } = useGetAppointmentsQuery({});
  const { data: allPatients = [] } = useGetPatientsQuery('');
  const { data: users = [] } = useGetUsersQuery(undefined);
  const { data: noteTemplates = [] } = useGetNoteTemplatesQuery(undefined);
  const { data: recurringAppointments = [] } = useGetRecurringAppointmentsQuery(undefined);
  const { data: appointmentRequests = [] } = useGetAppointmentRequestsQuery(undefined);

  const doctors = useMemo(
    () => (users as User[]).filter((u: User) => u.role === 'DOCTOR'),
    [users]
  );

  useEffect(() => {
    const hl = searchParams.get('highlight');
    if (hl && allAppointments.length && !highlightId) {
      const found = allAppointments.find((a: Appointment) => a.id === hl);
      if (found) {
        setSelectedAppointment(found);
        setHighlightId(hl);
      }
    }
  }, [searchParams, allAppointments, highlightId]);

  return {
    selectedDate, setSelectedDate,
    viewMode, setViewMode,
    activeTab, setActiveTab,
    selectedAppointment, setSelectedAppointment,
    appointments: appointments as Appointment[],
    allAppointments: allAppointments as Appointment[],
    allPatients: allPatients as Patient[],
    doctors,
    users: users as User[],
    noteTemplates: noteTemplates as NoteTemplate[],
    recurringAppointments,
    appointmentRequests,
    isLoading,
  };
}

export function useAppointmentActions(t: (key: string) => string) {
  const [showModal, setShowModal] = useState(false);
  const [showRecurring, setShowRecurring] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [createAppointment, { isLoading: isCreating }] = useCreateAppointmentMutation();
  const [cancelAppointment] = useCancelAppointmentMutation();
  const [updateAppointment] = useUpdateAppointmentMutation();
  const [completeWithInvoice] = useCompleteWithInvoiceMutation();
  const [createRecurring] = useCreateRecurringAppointmentMutation();
  const [deleteRecurring] = useDeleteRecurringAppointmentMutation();
  const [approveRequest] = useApproveAppointmentRequestMutation();
  const [rejectRequest] = useRejectAppointmentRequestMutation();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    dateTime: '',
    notes: '',
    isRecurring: false,
    repeatFrequency: 'WEEKLY',
    repeatInterval: 1,
    repeatEndDate: '',
  });

  const resetForm = () => {
    setFormData({
      patientId: '',
      doctorId: '',
      dateTime: '',
      notes: '',
      isRecurring: false,
      repeatFrequency: 'WEEKLY',
      repeatInterval: 1,
      repeatEndDate: '',
    });
  };

  const handleCreate = async (data: any) => {
    try {
      await createAppointment(data).unwrap();
      showToast(t('other.appointmentCreated') || 'Appointment created', 'success');
      return true;
    } catch (error) {
      showToast(t('other.failedToCreateAppointment') || 'Failed to create appointment', 'error');
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (formData.isRecurring) {
        await createRecurring({
          patientId: formData.patientId,
          doctorId: formData.doctorId,
          startDate: new Date(formData.dateTime).toISOString(),
          frequency: formData.repeatFrequency,
          interval: formData.repeatInterval,
          endDate: formData.repeatEndDate || undefined,
        }).unwrap();
        showToast(t('other.recurringCreated') || 'Recurring appointment created', 'success');
      } else {
        await handleCreate({
          patientId: formData.patientId,
          doctorId: formData.doctorId,
          dateTime: new Date(formData.dateTime).toISOString(),
          notes: formData.notes,
        });
      }
      setShowModal(false);
      resetForm();
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('other.failedToCreateAppointment'), 'error');
    }
  };

  const handleCancel = async (id: string) => {
    if (confirm(t('other.confirmCancelAppointment') || 'Cancel this appointment?')) {
      try {
        await cancelAppointment(id).unwrap();
        showToast(t('other.appointmentCancelled') || 'Appointment cancelled', 'success');
      } catch {
        showToast('Failed to cancel appointment', 'error');
      }
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await updateAppointment({ id, status }).unwrap();
      showToast(`Appointment ${status.toLowerCase()}`, 'success');
    } catch {
      showToast('Failed to update appointment', 'error');
    }
  };

  const handleComplete = async (id: string, items?: any[], notes?: string) => {
    try {
      await completeWithInvoice({ id, items, notes }).unwrap();
      showToast('Appointment completed with invoice', 'success');
      return true;
    } catch {
      showToast('Failed to complete appointment', 'error');
      return false;
    }
  };

  const handleDeleteRecurring = async (id: string) => {
    if (confirm(t('other.confirmDeleteSeries') || 'Delete this recurring series?')) {
      try {
        await deleteRecurring(id).unwrap();
        showToast(t('other.recurringDeleted') || 'Recurring appointment deleted', 'success');
      } catch (error) {
        showToast(error instanceof Error ? error.message : t('other.failedToDeleteRecurring') || 'Failed to delete', 'error');
      }
    }
  };

  const handleApproveRequest = async (id: string) => {
    try {
      await approveRequest(id).unwrap();
      showToast('Appointment request approved', 'success');
    } catch {
      showToast('Failed to approve request', 'error');
    }
  };

  const handleRejectRequest = async (id: string, reason: string) => {
    try {
      await rejectRequest({ id, reason }).unwrap();
      showToast('Appointment request rejected', 'success');
    } catch {
      showToast('Failed to reject request', 'error');
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'CONFIRMED': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'CHECKED_IN': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'IN_PROGRESS': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
      case 'COMPLETED': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'CANCELLED': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      case 'NO_SHOW': return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusLabel = (status: string, t: (key: string) => string) => {
    switch (status) {
      case 'SCHEDULED': return 'Pending Review';
      case 'CONFIRMED': return 'Confirmed';
      case 'CHECKED_IN': return t('appointments.checkedIn');
      case 'IN_PROGRESS': return t('appointments.inProgress');
      case 'COMPLETED': return 'Completed';
      case 'CANCELLED': return 'Cancelled';
      case 'NO_SHOW': return 'No Show';
      default: return status;
    }
  };

  return {
    showModal, setShowModal,
    showRecurring, setShowRecurring,
    openMenuId, setOpenMenuId,
    menuRef,
    formData, setFormData,
    resetForm,
    isCreating,
    handleSubmit,
    handleCreate,
    handleCancel,
    handleUpdateStatus,
    handleComplete,
    handleDeleteRecurring,
    handleApproveRequest,
    handleRejectRequest,
    getStatusClass,
    getStatusLabel,
  };
}
