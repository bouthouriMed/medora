import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  useGetInvoicesQuery,
  useGetAppointmentsQuery,
  useGetPatientsQuery,
  useCreateInvoiceMutation,
  useMarkInvoiceAsPaidMutation,
  useMarkInvoiceAsUnpaidMutation,
  useGetPresetsQuery,
  useCreateCheckoutSessionMutation,
} from '../api';
import { showToast } from '../components/Toast';
import type { Invoice } from '../types';

export function useInvoices(t: (key: string) => string) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const statusFilter = searchParams.get('status') || '';

  const { data: invoices, isLoading } = useGetInvoicesQuery(statusFilter);
  const { data: appointments } = useGetAppointmentsQuery({});
  const { data: patients } = useGetPatientsQuery('');
  const { data: presets } = useGetPresetsQuery('PROCEDURE');
  const [createInvoice, { isLoading: isCreating }] = useCreateInvoiceMutation();
  const [markAsPaid] = useMarkInvoiceAsPaidMutation();
  const [markAsUnpaid] = useMarkInvoiceAsUnpaidMutation();
  const [createCheckout] = useCreateCheckoutSessionMutation();

  const handleStatusChange = (status: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (status) {
      newParams.set('status', status);
    } else {
      newParams.delete('status');
    }
    setSearchParams(newParams);
  };

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
      showToast(t('other.invoiceCreated'), 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('other.failedToCreateInvoice'), 'error');
    }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      await markAsPaid(id).unwrap();
      showToast(t('other.invoiceMarkedPaid'), 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('other.failedToUpdateInvoice'), 'error');
    }
  };

  const handlePayOnline = async (invoiceId: string) => {
    try {
      const result = await createCheckout({ invoiceId, returnUrl: window.location.href }).unwrap();
      if (result.url) window.location.href = result.url;
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Stripe not configured', 'error');
    }
  };

  const handleMarkUnpaid = async (id: string) => {
    try {
      await markAsUnpaid(id).unwrap();
      showToast(t('other.invoiceMarkedUnpaid'), 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('other.failedToUpdateInvoice'), 'error');
    }
  };

  const totalUnpaid = invoices?.filter((i: Invoice) => i.status === 'UNPAID').reduce((sum: number, i: Invoice) => sum + Number(i.amount), 0) || 0;
  const totalPaid = invoices?.filter((i: Invoice) => i.status === 'PAID').reduce((sum: number, i: Invoice) => sum + Number(i.amount), 0) || 0;

  return {
    // State
    showModal, setShowModal,
    showFilters, setShowFilters,
    dateRange, setDateRange,
    statusFilter,
    formData, setFormData,
    // Data
    invoices,
    appointments,
    patients,
    presets,
    isLoading,
    isCreating,
    // Actions
    handleStatusChange,
    handleSubmit,
    handleMarkPaid,
    handlePayOnline,
    handleMarkUnpaid,
    // Computed
    totalUnpaid,
    totalPaid,
  };
}
