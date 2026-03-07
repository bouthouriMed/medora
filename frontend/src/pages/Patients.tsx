import { useState } from 'react';
import { useGetTagsQuery, useRegeneratePatientTokenMutation } from '../api';
import { exportPatients } from '../utils/export';
import type { Patient } from '../types';
import { useTranslation } from 'react-i18next';
import { usePatientList } from '../hooks/usePatientList';
import { useAppSelector } from '../store/hooks';
import { showToast } from '../components/Toast';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import PatientFilters from '../components/PatientFilters';
import PatientDetailModal from '../components/PatientDetailModal';
import PatientForm from '../components/PatientForm';
import PatientList from '../components/PatientList';

export default function Patients() {
  const { t } = useTranslation();
  const {
    search, setSearch,
    showModal, setShowModal,
    showFilters, setShowFilters,
    openMenuId, setOpenMenuId,
    showArchived, setShowArchived,
    filters, setFilters,
    formData, setFormData,
    menuRef,
    patients,
    isLoading,
    isCreating,
    handleSubmit,
    handleDelete,
    handleRestore,
  } = usePatientList(t);

  const { user } = useAppSelector((state) => state.auth);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const { data: allTags } = useGetTagsQuery(undefined);
  const [regenerateToken] = useRegeneratePatientTokenMutation();

  const handleViewPatient = (patient: Patient) => {
    setSelectedPatient(patient);
  };

  const handlePortalClick = async (patient: Patient) => {
    if (patient.portalToken) {
      window.open(`${window.location.origin}/portal/${patient.portalToken}`, '_blank');
    } else {
      try {
        const result = await regenerateToken(patient.id).unwrap();
        window.open(`${window.location.origin}/portal/${result.portalToken}`, '_blank');
      } catch {
        showToast(t('other.failedToGeneratePortalLink'), 'error');
      }
    }
  };

  const handleBookingClick = (patient: Patient) => {
    const baseUrl = window.location.origin;
    const clinicId = user?.clinicId;
    if (clinicId) {
      const params = new URLSearchParams({
        patientName: `${patient.firstName} ${patient.lastName}`,
        ...(patient.email && { email: patient.email }),
        ...(patient.phone && { phone: patient.phone }),
      });
      window.open(`${baseUrl}/book/${clinicId}?${params.toString()}`, '_blank');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title={t('patients.title')}
        subtitle={t('patients.managePatients')}
        actions={
          <>
            <Button variant="secondary" onClick={exportPatients}>
              📥 {t('common.export')}
            </Button>
            <Button onClick={() => setShowModal(true)}>
              + {t('patients.addPatient')}
            </Button>
          </>
        }
      />

      <PatientFilters
        search={search}
        onSearchChange={setSearch}
        showArchived={showArchived}
        onArchivedToggle={() => setShowArchived(!showArchived)}
        showFilters={showFilters}
        onFiltersToggle={() => setShowFilters(!showFilters)}
        filters={filters}
        onFiltersChange={setFilters}
        allTags={allTags || []}
        t={t}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 skeleton rounded-2xl"></div>
          ))}
        </div>
      ) : patients?.length === 0 ? (
        <EmptyState
          icon="👥"
          title={t('patients.noPatients')}
          description={t('patients.noPatientsDesc')}
          action={{
            label: t('patients.addPatient'),
            onClick: () => setShowModal(true),
          }}
        />
      ) : (
        <PatientList
          patients={patients || []}
          onViewPatient={handleViewPatient}
          onDelete={handleDelete}
          onRestore={handleRestore}
          onPortalClick={handlePortalClick}
          onBookingClick={handleBookingClick}
          openMenuId={openMenuId}
          setOpenMenuId={setOpenMenuId}
          menuRef={menuRef}
          t={t}
        />
      )}

      <PatientDetailModal
        patient={selectedPatient}
        isOpen={!!selectedPatient}
        onClose={() => setSelectedPatient(null)}
        t={t}
      />

      <PatientForm
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        formData={formData}
        setFormData={setFormData}
        isLoading={isCreating}
        t={t}
      />
    </div>
  );
}
