import { useState, useEffect } from 'react';
import {
  useGetPatientQuery,
  useUpdatePatientMutation,
  useGetPatientAppointmentsQuery,
  useGetPatientMedicalHistoryQuery,
  useGetPatientTagsQuery,
  useGetTagsQuery,
  useAddTagToPatientMutation,
  useRemoveTagFromPatientMutation,
  useGetPatientCustomFieldsQuery,
  useSavePatientCustomFieldMutation,
  useRegeneratePatientTokenMutation,
  useCreateVitalMutation,
  useCreateDiagnosisMutation,
  useUpdateDiagnosisMutation,
  useDeleteDiagnosisMutation,
  useCreatePrescriptionMutation,
  useUpdatePrescriptionMutation,
  useDeletePrescriptionMutation,
  useCreateAllergyMutation,
  useDeleteAllergyMutation,
  useCreateConditionMutation,
  useDeleteConditionMutation,
} from '../api';
import { showToast } from '../components/Toast';

export function usePatientDetailData(patientId: string) {
  const { data: patient, isLoading } = useGetPatientQuery(patientId, { skip: !patientId });
  const { data: appointments = [] } = useGetPatientAppointmentsQuery(patientId, { skip: !patientId });
  const { data: medicalHistory } = useGetPatientMedicalHistoryQuery(patientId, { skip: !patientId });
  const { data: allTags = [] } = useGetTagsQuery(undefined);
  const { data: patientTags = [], refetch: refetchTags } = useGetPatientTagsQuery(patientId, { skip: !patientId });
  const { data: customFields = [], refetch: refetchCustomFields } = useGetPatientCustomFieldsQuery(patientId, { skip: !patientId });

  return {
    patient,
    appointments,
    medicalHistory,
    allTags,
    patientTags,
    customFields,
    isLoading,
    refetchTags,
    refetchCustomFields,
  };
}

export function usePatientDetailActions(patientId: string) {
  const [updatePatient] = useUpdatePatientMutation();
  const [regenerateToken] = useRegeneratePatientTokenMutation();
  const [addTag] = useAddTagToPatientMutation();
  const [removeTag] = useRemoveTagFromPatientMutation();
  const [saveCustomField] = useSavePatientCustomFieldMutation();
  const [createVital] = useCreateVitalMutation();
  const [createDiagnosis] = useCreateDiagnosisMutation();
  const [updateDiagnosis] = useUpdateDiagnosisMutation();
  const [deleteDiagnosis] = useDeleteDiagnosisMutation();
  const [createPrescription] = useCreatePrescriptionMutation();
  const [updatePrescription] = useUpdatePrescriptionMutation();
  const [deletePrescription] = useDeletePrescriptionMutation();
  const [createAllergy] = useCreateAllergyMutation();
  const [deleteAllergy] = useDeleteAllergyMutation();
  const [createCondition] = useCreateConditionMutation();
  const [deleteCondition] = useDeleteConditionMutation();

  const handleUpdatePatient = async (data: any) => {
    try {
      await updatePatient({ id: patientId, ...data }).unwrap();
      showToast('Patient updated', 'success');
      return true;
    } catch {
      showToast('Failed to update patient', 'error');
      return false;
    }
  };

  const handleRegenerateToken = async () => {
    try {
      await regenerateToken(patientId).unwrap();
      showToast('Portal token regenerated', 'success');
    } catch {
      showToast('Failed to regenerate token', 'error');
    }
  };

  const handleAddTag = async (tagId: string) => {
    try {
      await addTag({ patientId, tagId }).unwrap();
    } catch {
      showToast('Failed to add tag', 'error');
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    try {
      await removeTag({ patientId, tagId }).unwrap();
    } catch {
      showToast('Failed to remove tag', 'error');
    }
  };

  const handleSaveCustomField = async (fieldId: string, value: string) => {
    try {
      await saveCustomField({ patientId, customFieldId: fieldId, value }).unwrap();
    } catch {
      showToast('Failed to save field', 'error');
    }
  };

  return {
    handleUpdatePatient,
    handleRegenerateToken,
    handleAddTag,
    handleRemoveTag,
    handleSaveCustomField,
    // Medical record mutations (expose raw for flexibility)
    createVital,
    createDiagnosis,
    updateDiagnosis,
    deleteDiagnosis,
    createPrescription,
    updatePrescription,
    deletePrescription,
    createAllergy,
    deleteAllergy,
    createCondition,
    deleteCondition,
  };
}

export function useExpandedSections(initialSections: Record<string, boolean> = { overview: true }) {
  const [expandedSections, setExpandedSections] = useState(initialSections);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return { expandedSections, toggleSection };
}
