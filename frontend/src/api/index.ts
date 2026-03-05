import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Patient', 'Appointment', 'Invoice', 'Dashboard', 'Preset', 'Tag', 'CustomField', 'NoteTemplate', 'RecurringAppointment', 'LabResult', 'Task', 'PatientMedicalHistory'],
  endpoints: (builder) => ({
    register: builder.mutation({
      query: (body) => ({
        url: '/auth/register',
        method: 'POST',
        body,
      }),
    }),
    login: builder.mutation({
      query: (body) => ({
        url: '/auth/login',
        method: 'POST',
        body,
      }),
    }),
    me: builder.query({
      query: () => '/auth/me',
    }),
    getUsers: builder.query({
      query: () => '/auth/users',
    }),
    createUser: builder.mutation({
      query: (body) => ({
        url: '/auth/users',
        method: 'POST',
        body,
      }),
    }),
    updateUser: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/auth/users/${id}`,
        method: 'PUT',
        body,
      }),
    }),
    deleteUser: builder.mutation({
      query: (id) => ({
        url: `/auth/users/${id}`,
        method: 'DELETE',
      }),
    }),
    getDashboard: builder.query({
      query: () => '/dashboard',
      providesTags: ['Dashboard'],
    }),
    getPatients: builder.query({
      query: (search) => ({
        url: '/patients',
        params: search ? { search } : undefined,
      }),
      providesTags: ['Patient'],
    }),
    getPatient: builder.query({
      query: (id) => `/patients/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'Patient', id }],
    }),
    createPatient: builder.mutation({
      query: (body) => ({
        url: '/patients',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Patient', 'Dashboard'],
    }),
    updatePatient: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/patients/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Patient'],
    }),
    deletePatient: builder.mutation({
      query: (id) => ({
        url: `/patients/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Patient', 'Dashboard'],
    }),
    regeneratePatientToken: builder.mutation({
      query: (id) => ({
        url: `/patients/${id}/regenerate-token`,
        method: 'POST',
      }),
      invalidatesTags: ['Patient'],
    }),
    getAppointments: builder.query({
      query: (params) => ({
        url: '/appointments',
        params,
      }),
      providesTags: ['Appointment'],
    }),
    getAppointment: builder.query({
      query: (id) => `/appointments/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'Appointment', id }],
    }),
    getPatientAppointments: builder.query({
      query: (patientId) => `/patients/${patientId}/appointments`,
      providesTags: ['Appointment'],
    }),
    createAppointment: builder.mutation({
      query: (body) => ({
        url: '/appointments',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Appointment', 'Dashboard'],
    }),
    updateAppointment: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/appointments/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Appointment', 'Dashboard'],
    }),
    cancelAppointment: builder.mutation({
      query: (id) => ({
        url: `/appointments/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Appointment', 'Dashboard'],
    }),
    getInvoices: builder.query({
      query: (status) => ({
        url: '/invoices',
        params: status ? { status } : undefined,
      }),
      providesTags: ['Invoice'],
    }),
    getUnpaidInvoices: builder.query({
      query: () => '/invoices/unpaid',
      providesTags: ['Invoice'],
    }),
    getInvoice: builder.query({
      query: (id) => `/invoices/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'Invoice', id }],
    }),
    createInvoice: builder.mutation({
      query: (body) => ({
        url: '/invoices',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Invoice', 'Dashboard'],
    }),
    markInvoiceAsPaid: builder.mutation({
      query: (id) => ({
        url: `/invoices/${id}/pay`,
        method: 'PUT',
      }),
      invalidatesTags: ['Invoice', 'Dashboard'],
    }),
    markInvoiceAsUnpaid: builder.mutation({
      query: (id) => ({
        url: `/invoices/${id}/unpay`,
        method: 'PUT',
      }),
      invalidatesTags: ['Invoice', 'Dashboard'],
    }),
    getPresets: builder.query({
      query: (type) => ({
        url: '/presets',
        params: type ? { type } : undefined,
      }),
      providesTags: ['Preset'],
    }),
    createPreset: builder.mutation({
      query: (body) => ({
        url: '/presets',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Preset'],
    }),
    createPresetsBulk: builder.mutation({
      query: (body) => ({
        url: '/presets/bulk',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Preset'],
    }),
    deletePreset: builder.mutation({
      query: (id) => ({
        url: `/presets/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Preset'],
    }),
    getPortalData: builder.query({
      query: (token) => `/public/patient/${token}`,
    }),
    getTags: builder.query({
      query: () => '/tags',
    }),
    createTag: builder.mutation({
      query: (body) => ({
        url: '/tags',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Tag'],
    }),
    deleteTag: builder.mutation({
      query: (id) => ({
        url: `/tags/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Tag'],
    }),
    getPatientTags: builder.query({
      query: (patientId) => `/patients/${patientId}/tags`,
    }),
    addTagToPatient: builder.mutation({
      query: (body) => ({
        url: '/patients/tags',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Patient'],
    }),
    removeTagFromPatient: builder.mutation({
      query: (args) => ({
        url: `/patients/${args.patientId}/tags/${args.tagId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Patient'],
    }),
    getCustomFields: builder.query({
      query: () => '/custom-fields',
    }),
    createCustomField: builder.mutation({
      query: (body) => ({
        url: '/custom-fields',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['CustomField'],
    }),
    deleteCustomField: builder.mutation({
      query: (id) => ({
        url: `/custom-fields/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['CustomField'],
    }),
    getPatientCustomFields: builder.query({
      query: (patientId) => `/patients/${patientId}/custom-fields`,
    }),
    savePatientCustomField: builder.mutation({
      query: ({ patientId, ...body }) => ({
        url: `/patients/${patientId}/custom-fields`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Patient'],
    }),
    getNoteTemplates: builder.query({
      query: (type) => ({
        url: '/note-templates',
        params: type ? { type } : undefined,
      }),
    }),
    createNoteTemplate: builder.mutation({
      query: (body) => ({
        url: '/note-templates',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['NoteTemplate'],
    }),
    deleteNoteTemplate: builder.mutation({
      query: (id) => ({
        url: `/note-templates/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['NoteTemplate'],
    }),
    getRecurringAppointments: builder.query({
      query: () => '/recurring-appointments',
      providesTags: ['RecurringAppointment'],
    }),
    createRecurringAppointment: builder.mutation({
      query: (body) => ({
        url: '/recurring-appointments',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['RecurringAppointment', 'Appointment'],
    }),
    deleteRecurringAppointment: builder.mutation({
      query: (id) => ({
        url: `/recurring-appointments/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['RecurringAppointment', 'Appointment'],
    }),
    getClinicSettings: builder.query({
      query: () => '/settings',
    }),
    updateClinicSettings: builder.mutation({
      query: (body) => ({
        url: '/settings',
        method: 'PUT',
        body,
      }),
    }),
    sendTestEmail: builder.mutation({
      query: (body) => ({
        url: '/settings/test-email',
        method: 'POST',
        body,
      }),
    }),
    getLabResults: builder.query({
      query: (params) => ({
        url: '/lab-results',
        params,
      }),
      providesTags: ['LabResult'],
    }),
    getLabResult: builder.query({
      query: (id) => `/lab-results/${id}`,
    }),
    createLabResult: builder.mutation({
      query: (body) => ({
        url: '/lab-results',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['LabResult'],
    }),
    updateLabResult: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/lab-results/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['LabResult'],
    }),
    deleteLabResult: builder.mutation({
      query: (id) => ({
        url: `/lab-results/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['LabResult'],
    }),
    getTasks: builder.query({
      query: (params) => ({
        url: '/tasks',
        params,
      }),
      providesTags: ['Task'],
    }),
    createTask: builder.mutation({
      query: (body) => ({
        url: '/tasks',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Task'],
    }),
    updateTask: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/tasks/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Task'],
    }),
    deleteTask: builder.mutation({
      query: (id) => ({
        url: `/tasks/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Task'],
    }),
    getPatientMedicalHistory: builder.query({
      query: (patientId) => `/patients/${patientId}/medical-history`,
      providesTags: (result, error, patientId) => [{ type: 'PatientMedicalHistory', id: patientId }],
    }),
    createVital: builder.mutation({
      query: ({ patientId, ...body }) => ({
        url: `/patients/${patientId}/vitals`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { patientId }) => [
        'Patient',
        { type: 'PatientMedicalHistory', id: patientId },
      ],
    }),
    createDiagnosis: builder.mutation({
      query: ({ patientId, ...body }) => ({
        url: `/patients/${patientId}/diagnoses`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { patientId }) => [
        'Patient',
        { type: 'PatientMedicalHistory', id: patientId },
      ],
    }),
    updateDiagnosis: builder.mutation({
      query: ({ id, patientId, ...body }) => ({
        url: `/diagnoses/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { patientId }) => [
        'Patient',
        { type: 'PatientMedicalHistory', id: patientId },
      ],
    }),
    deleteDiagnosis: builder.mutation({
      query: ({ id, patientId }) => ({
        url: `/diagnoses/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { patientId }) => [
        'Patient',
        { type: 'PatientMedicalHistory', id: patientId },
      ],
    }),
    createPrescription: builder.mutation({
      query: ({ patientId, ...body }) => ({
        url: `/patients/${patientId}/prescriptions`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { patientId }) => [
        'Patient',
        { type: 'PatientMedicalHistory', id: patientId },
      ],
    }),
    updatePrescription: builder.mutation({
      query: ({ id, patientId, ...body }) => ({
        url: `/prescriptions/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { patientId }) => [
        'Patient',
        { type: 'PatientMedicalHistory', id: patientId },
      ],
    }),
    deletePrescription: builder.mutation({
      query: ({ id, patientId }) => ({
        url: `/prescriptions/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { patientId }) => [
        'Patient',
        { type: 'PatientMedicalHistory', id: patientId },
      ],
    }),
    createAllergy: builder.mutation({
      query: ({ patientId, ...body }) => ({
        url: `/patients/${patientId}/allergies`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { patientId }) => [
        'Patient',
        { type: 'PatientMedicalHistory', id: patientId },
      ],
    }),
    deleteAllergy: builder.mutation({
      query: ({ id, patientId }) => ({
        url: `/allergies/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { patientId }) => [
        'Patient',
        { type: 'PatientMedicalHistory', id: patientId },
      ],
    }),
    createCondition: builder.mutation({
      query: ({ patientId, ...body }) => ({
        url: `/patients/${patientId}/conditions`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { patientId }) => [
        'Patient',
        { type: 'PatientMedicalHistory', id: patientId },
      ],
    }),
    deleteCondition: builder.mutation({
      query: ({ id, patientId }) => ({
        url: `/conditions/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { patientId }) => [
        'Patient',
        { type: 'PatientMedicalHistory', id: patientId },
      ],
    }),
    generateVisitNote: builder.mutation({
      query: ({ id }) => ({
        url: `/appointments/${id}/generate-note`,
        method: 'POST',
      }),
    }),
    generatePatientSummary: builder.mutation({
      query: ({ patientId }) => ({
        url: `/patients/${patientId}/generate-summary`,
        method: 'POST',
      }),
    }),
    createMedicalRecord: builder.mutation({
      query: ({ patientId, ...body }) => ({
        url: `/patients/${patientId}/medical-records`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { patientId }) => [
        { type: 'PatientMedicalHistory', id: patientId },
      ],
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useMeQuery,
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useGetDashboardQuery,
  useGetPatientsQuery,
  useGetPatientQuery,
  useCreatePatientMutation,
  useUpdatePatientMutation,
  useDeletePatientMutation,
  useRegeneratePatientTokenMutation,
  useGetAppointmentsQuery,
  useGetAppointmentQuery,
  useGetPatientAppointmentsQuery,
  useCreateAppointmentMutation,
  useUpdateAppointmentMutation,
  useCancelAppointmentMutation,
  useGetInvoicesQuery,
  useGetUnpaidInvoicesQuery,
  useGetInvoiceQuery,
  useCreateInvoiceMutation,
  useMarkInvoiceAsPaidMutation,
  useMarkInvoiceAsUnpaidMutation,
  useGetPresetsQuery,
  useCreatePresetMutation,
  useCreatePresetsBulkMutation,
  useDeletePresetMutation,
  useGetPortalDataQuery,
  useGetTagsQuery,
  useCreateTagMutation,
  useDeleteTagMutation,
  useGetPatientTagsQuery,
  useAddTagToPatientMutation,
  useRemoveTagFromPatientMutation,
  useGetCustomFieldsQuery,
  useCreateCustomFieldMutation,
  useDeleteCustomFieldMutation,
  useGetPatientCustomFieldsQuery,
  useSavePatientCustomFieldMutation,
  useGetNoteTemplatesQuery,
  useCreateNoteTemplateMutation,
  useDeleteNoteTemplateMutation,
  useGetRecurringAppointmentsQuery,
  useCreateRecurringAppointmentMutation,
  useDeleteRecurringAppointmentMutation,
  useGetClinicSettingsQuery,
  useUpdateClinicSettingsMutation,
  useSendTestEmailMutation,
  useGetLabResultsQuery,
  useGetLabResultQuery,
  useCreateLabResultMutation,
  useUpdateLabResultMutation,
  useDeleteLabResultMutation,
  useGetTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
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
  useGenerateVisitNoteMutation,
  useGeneratePatientSummaryMutation,
  useCreateMedicalRecordMutation,
} = api;
