import { baseApi } from './baseApi';

export const patientApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPatients: builder.query({
      query: (arg) => {
        if (typeof arg === 'string') {
          return { url: '/patients', params: arg ? { search: arg } : undefined };
        }
        const params: Record<string, string> = {};
        if (arg?.search) params.search = arg.search;
        if (arg?.includeArchived) params.includeArchived = 'true';
        return { url: '/patients', params: Object.keys(params).length ? params : undefined };
      },
      providesTags: ['Patient'],
    }),
    getPatient: builder.query({
      query: (id) => `/patients/${id}`,
      providesTags: (_result: any, _err: any, id: string) => [{ type: 'Patient' as const, id }],
    }),
    createPatient: builder.mutation({
      query: (body) => ({ url: '/patients', method: 'POST', body }),
      invalidatesTags: ['Patient', 'Dashboard'],
    }),
    updatePatient: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/patients/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Patient'],
    }),
    deletePatient: builder.mutation({
      query: (id) => ({ url: `/patients/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Patient', 'Dashboard'],
    }),
    restorePatient: builder.mutation({
      query: (id) => ({ url: `/patients/${id}/restore`, method: 'POST' }),
      invalidatesTags: ['Patient', 'Dashboard'],
    }),
    regeneratePatientToken: builder.mutation({
      query: (id) => ({ url: `/patients/${id}/regenerate-token`, method: 'POST' }),
      invalidatesTags: ['Patient'],
    }),
    // Tags
    getTags: builder.query({
      query: () => '/tags',
    }),
    createTag: builder.mutation({
      query: (body) => ({ url: '/tags', method: 'POST', body }),
      invalidatesTags: ['Tag'],
    }),
    deleteTag: builder.mutation({
      query: (id) => ({ url: `/tags/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Tag'],
    }),
    getPatientTags: builder.query({
      query: (patientId) => `/patients/${patientId}/tags`,
    }),
    addTagToPatient: builder.mutation({
      query: (body) => ({ url: '/patients/tags', method: 'POST', body }),
      invalidatesTags: ['Patient'],
    }),
    removeTagFromPatient: builder.mutation({
      query: (args) => ({ url: `/patients/${args.patientId}/tags/${args.tagId}`, method: 'DELETE' }),
      invalidatesTags: ['Patient'],
    }),
    // Custom Fields
    getCustomFields: builder.query({
      query: () => '/custom-fields',
    }),
    createCustomField: builder.mutation({
      query: (body) => ({ url: '/custom-fields', method: 'POST', body }),
      invalidatesTags: ['CustomField'],
    }),
    deleteCustomField: builder.mutation({
      query: (id) => ({ url: `/custom-fields/${id}`, method: 'DELETE' }),
      invalidatesTags: ['CustomField'],
    }),
    getPatientCustomFields: builder.query({
      query: (patientId) => `/patients/${patientId}/custom-fields`,
    }),
    savePatientCustomField: builder.mutation({
      query: ({ patientId, ...body }) => ({ url: `/patients/${patientId}/custom-fields`, method: 'POST', body }),
      invalidatesTags: ['Patient'],
    }),
  }),
});

export const {
  useGetPatientsQuery,
  useGetPatientQuery,
  useCreatePatientMutation,
  useUpdatePatientMutation,
  useDeletePatientMutation,
  useRestorePatientMutation,
  useRegeneratePatientTokenMutation,
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
} = patientApi;
