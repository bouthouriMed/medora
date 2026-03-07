import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppointmentData, useAppointmentActions } from '../hooks/useAppointments';
import { exportAppointments, generateICS } from '../utils/export';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import AppointmentForm from '../components/AppointmentForm';
import AppointmentList from '../components/AppointmentList';
import CalendarView from '../components/CalendarView';
import RecurringAppointments from '../components/RecurringAppointments';
import AppointmentRequests from '../components/AppointmentRequests';
import AppointmentsFilters from '../components/AppointmentsFilters';
import type { Appointment } from '../types';

export default function Appointments() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    selectedDate,
    viewMode,
    setViewMode,
    selectedAppointment,
    setSelectedAppointment,
    appointments,
    allAppointments,
    allPatients,
    doctors,
    recurringAppointments,
    appointmentRequests,
    isLoading,
  } = useAppointmentData();

  const {
    showModal,
    setShowModal,
    showRecurring,
    setShowRecurring,
    openMenuId,
    setOpenMenuId,
    menuRef,
    formData,
    setFormData,
    isCreating,
    handleSubmit,
    handleCancel,
    handleUpdateStatus,
    handleDeleteRecurring,
    handleApproveRequest,
    handleRejectRequest,
    getStatusClass,
    getStatusLabel,
  } = useAppointmentActions(t);

  const handleFilterChange = (filter: string | null) => {
    const newParams = new URLSearchParams();
    if (filter) {
      newParams.set('filter', filter);
    }
    setSearchParams(newParams);
  };

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(field, value);
      newParams.delete('filter');
    } else {
      newParams.delete(field);
    }
    setSearchParams(newParams);
  };

  const handleCheckIn = async (appointmentId: string) => {
    await handleUpdateStatus(appointmentId, 'CHECKED_IN');
  };

  const handleStartConsultation = (appointmentId: string, patientId: string) => {
    window.location.href = `/patients/${patientId}?appointmentId=${appointmentId}&mode=consultation`;
  };

  const getStatusLabelWithT = (status: string) => getStatusLabel(status, t);

  const currentFilter = searchParams.get('filter');
  const startDateParam = searchParams.get('startDate');
  const endDateParam = searchParams.get('endDate');
  const hasCustomDateRange = !currentFilter && (startDateParam || endDateParam);

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title={t('appointments.title')}
        subtitle={t('appointments.manageAppointments')}
        actions={
          <>
            <Button variant="secondary" onClick={() => generateICS(allAppointments || [], 'all_appointments')}>
              📅 {t('appointments.exportICS')}
            </Button>
            <Button variant="secondary" onClick={() => exportAppointments(selectedDate, selectedDate)}>
              📥 {t('common.export')}
            </Button>
            <Button onClick={() => setShowModal(true)}>
              + {t('appointments.newAppointment')}
            </Button>
          </>
        }
      />

      <AppointmentsFilters
        selectedDate={selectedDate}
        startDate={searchParams.get('startDate') || undefined}
        endDate={searchParams.get('endDate') || undefined}
        onDateChange={handleDateChange}
        onFilterChange={handleFilterChange}
        currentFilter={hasCustomDateRange ? null : currentFilter}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        t={t}
      />

      <RecurringAppointments
        appointments={recurringAppointments}
        onDelete={handleDeleteRecurring}
        onCreateNew={() => setShowModal(true)}
        isExpanded={showRecurring}
        onToggle={() => setShowRecurring(!showRecurring)}
        t={t}
      />

      <AppointmentRequests
        requests={appointmentRequests}
        onApprove={handleApproveRequest}
        onReject={handleRejectRequest}
        isApproving={false}
        t={t}
      />

      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 skeleton rounded-2xl"></div>
          ))}
        </div>
      ) : viewMode === 'calendar' ? (
        <CalendarView
          appointments={appointments}
          recurringAppointments={recurringAppointments}
          currentMonth={new Date(selectedDate)}
          onMonthChange={(date) => setSelectedDate(date.toISOString().split('T')[0])}
          onDateClick={(date) => {
            setSelectedDate(date);
            setShowModal(true);
          }}
          onEventClick={(apt) => setSelectedAppointment(apt)}
        />
      ) : appointments?.length === 0 ? (
        <EmptyState
          icon="📅"
          title={t('appointments.noAppointments')}
          description={t('appointments.manageAppointments')}
          action={{
            label: t('appointments.newAppointment'),
            onClick: () => setShowModal(true),
          }}
        />
      ) : (
        <AppointmentList
          appointments={appointments}
          onView={(apt: Appointment) => setSelectedAppointment(apt)}
          onStatusChange={handleUpdateStatus}
          onCancel={handleCancel}
          onCheckIn={handleCheckIn}
          onStartConsultation={handleStartConsultation}
          onDeleteRecurring={handleDeleteRecurring}
          getStatusClass={getStatusClass}
          getStatusLabel={getStatusLabelWithT}
          openMenuId={openMenuId}
          setOpenMenuId={setOpenMenuId}
          menuRef={menuRef}
          t={t}
        />
      )}

      <AppointmentForm
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        formData={formData}
        setFormData={setFormData}
        patients={allPatients}
        doctors={doctors}
        isLoading={isCreating}
        t={t}
      />
    </div>
  );
}
