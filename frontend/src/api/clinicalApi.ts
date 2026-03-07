import { baseApi } from './baseApi';

export const clinicalApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPatientMedicalHistory: builder.query({
      query: (patientId) => `/patients/${patientId}/medical-history`,
      providesTags: (result: any, error: any, patientId: string) => [{ type: 'PatientMedicalHistory' as const, id: patientId }],
    }),
    createVital: builder.mutation({
      query: ({ patientId, ...body }) => ({ url: `/patients/${patientId}/vitals`, method: 'POST', body }),
      invalidatesTags: (result: any, error: any, { patientId }: any) => ['Patient', { type: 'PatientMedicalHistory', id: patientId }],
    }),
    createDiagnosis: builder.mutation({
      query: ({ patientId, ...body }) => ({ url: `/patients/${patientId}/diagnoses`, method: 'POST', body }),
      invalidatesTags: (result: any, error: any, { patientId }: any) => ['Patient', { type: 'PatientMedicalHistory', id: patientId }],
    }),
    updateDiagnosis: builder.mutation({
      query: ({ id, patientId, ...body }) => ({ url: `/diagnoses/${id}`, method: 'PUT', body }),
      invalidatesTags: (result: any, error: any, { patientId }: any) => ['Patient', { type: 'PatientMedicalHistory', id: patientId }],
    }),
    deleteDiagnosis: builder.mutation({
      query: ({ id, patientId }) => ({ url: `/diagnoses/${id}`, method: 'DELETE' }),
      invalidatesTags: (result: any, error: any, { patientId }: any) => ['Patient', { type: 'PatientMedicalHistory', id: patientId }],
    }),
    createPrescription: builder.mutation({
      query: ({ patientId, ...body }) => ({ url: `/patients/${patientId}/prescriptions`, method: 'POST', body }),
      invalidatesTags: (result: any, error: any, { patientId }: any) => ['Patient', { type: 'PatientMedicalHistory', id: patientId }],
    }),
    updatePrescription: builder.mutation({
      query: ({ id, patientId, ...body }) => ({ url: `/prescriptions/${id}`, method: 'PUT', body }),
      invalidatesTags: (result: any, error: any, { patientId }: any) => ['Patient', { type: 'PatientMedicalHistory', id: patientId }],
    }),
    deletePrescription: builder.mutation({
      query: ({ id, patientId }) => ({ url: `/prescriptions/${id}`, method: 'DELETE' }),
      invalidatesTags: (result: any, error: any, { patientId }: any) => ['Patient', { type: 'PatientMedicalHistory', id: patientId }],
    }),
    createAllergy: builder.mutation({
      query: ({ patientId, ...body }) => ({ url: `/patients/${patientId}/allergies`, method: 'POST', body }),
      invalidatesTags: (result: any, error: any, { patientId }: any) => ['Patient', { type: 'PatientMedicalHistory', id: patientId }],
    }),
    deleteAllergy: builder.mutation({
      query: ({ id, patientId }) => ({ url: `/allergies/${id}`, method: 'DELETE' }),
      invalidatesTags: (result: any, error: any, { patientId }: any) => ['Patient', { type: 'PatientMedicalHistory', id: patientId }],
    }),
    createCondition: builder.mutation({
      query: ({ patientId, ...body }) => ({ url: `/patients/${patientId}/conditions`, method: 'POST', body }),
      invalidatesTags: (result: any, error: any, { patientId }: any) => ['Patient', { type: 'PatientMedicalHistory', id: patientId }],
    }),
    deleteCondition: builder.mutation({
      query: ({ id, patientId }) => ({ url: `/conditions/${id}`, method: 'DELETE' }),
      invalidatesTags: (result: any, error: any, { patientId }: any) => ['Patient', { type: 'PatientMedicalHistory', id: patientId }],
    }),
    createMedicalRecord: builder.mutation({
      query: ({ patientId, ...body }) => ({ url: `/patients/${patientId}/medical-records`, method: 'POST', body }),
      invalidatesTags: (result: any, error: any, { patientId }: any) => [{ type: 'PatientMedicalHistory', id: patientId }],
    }),
    updateMedicalRecord: builder.mutation({
      query: ({ id, patientId, ...body }) => ({ url: `/medical-records/${id}`, method: 'PUT', body }),
      invalidatesTags: (result: any, error: any, { patientId }: any) => [{ type: 'PatientMedicalHistory', id: patientId }],
    }),
    generateVisitNote: builder.mutation({
      query: ({ id }) => ({ url: `/appointments/${id}/generate-note`, method: 'POST' }),
    }),
    generatePatientSummary: builder.mutation({
      query: ({ patientId }) => ({ url: `/patients/${patientId}/generate-summary`, method: 'POST' }),
    }),
    // Lab Results
    getLabResults: builder.query({
      query: (params) => ({ url: '/lab-results', params }),
      providesTags: ['LabResult'],
    }),
    getLabResult: builder.query({
      query: (id) => `/lab-results/${id}`,
    }),
    createLabResult: builder.mutation({
      query: (body) => ({ url: '/lab-results', method: 'POST', body }),
      invalidatesTags: ['LabResult'],
    }),
    updateLabResult: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/lab-results/${id}`, method: 'PUT', body }),
      invalidatesTags: ['LabResult'],
    }),
    deleteLabResult: builder.mutation({
      query: (id) => ({ url: `/lab-results/${id}`, method: 'DELETE' }),
      invalidatesTags: ['LabResult'],
    }),
    // Clinical Decision Support
    checkDrugInteractions: builder.mutation({
      query: (body) => ({ url: '/clinical/drug-interactions', method: 'POST', body }),
    }),
    checkAllergyConflict: builder.mutation({
      query: (body) => ({ url: '/clinical/allergy-check', method: 'POST', body }),
    }),
    getDoctorBriefing: builder.query({
      query: ({ patientId, reason }) => ({ url: `/clinical/briefing/${patientId}`, params: reason ? { reason } : undefined }),
    }),
  }),
});

export const {
  useGetPatientMedicalHistoryQuery,
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
  useCreateMedicalRecordMutation,
  useUpdateMedicalRecordMutation,
  useGenerateVisitNoteMutation,
  useGeneratePatientSummaryMutation,
  useGetLabResultsQuery,
  useGetLabResultQuery,
  useCreateLabResultMutation,
  useUpdateLabResultMutation,
  useDeleteLabResultMutation,
  useCheckDrugInteractionsMutation,
  useCheckAllergyConflictMutation,
  useGetDoctorBriefingQuery,
} = clinicalApi;
