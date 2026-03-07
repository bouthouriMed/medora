import { baseApi } from './baseApi';

export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Presets
    getPresets: builder.query({
      query: (type) => ({ url: '/presets', params: type ? { type } : undefined }),
      providesTags: ['Preset'],
    }),
    createPreset: builder.mutation({
      query: (body) => ({ url: '/presets', method: 'POST', body }),
      invalidatesTags: ['Preset'],
    }),
    createPresetsBulk: builder.mutation({
      query: (body) => ({ url: '/presets/bulk', method: 'POST', body }),
      invalidatesTags: ['Preset'],
    }),
    deletePreset: builder.mutation({
      query: (id) => ({ url: `/presets/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Preset'],
    }),
    // Note Templates
    getNoteTemplates: builder.query({
      query: (type) => ({ url: '/note-templates', params: type ? { type } : undefined }),
    }),
    createNoteTemplate: builder.mutation({
      query: (body) => ({ url: '/note-templates', method: 'POST', body }),
      invalidatesTags: ['NoteTemplate'],
    }),
    deleteNoteTemplate: builder.mutation({
      query: (id) => ({ url: `/note-templates/${id}`, method: 'DELETE' }),
      invalidatesTags: ['NoteTemplate'],
    }),
    // Settings
    getClinicSettings: builder.query({
      query: () => '/settings',
    }),
    updateClinicSettings: builder.mutation({
      query: (body) => ({ url: '/settings', method: 'PUT', body }),
    }),
    sendTestEmail: builder.mutation({
      query: (body) => ({ url: '/settings/test-email', method: 'POST', body }),
    }),
    // Doctor Ratings
    getDoctorRatingSummaries: builder.query({
      query: () => '/ratings',
      providesTags: ['Rating'],
    }),
    getDoctorRatings: builder.query({
      query: (doctorId) => `/ratings/${doctorId}`,
      providesTags: ['Rating'],
    }),
    createRating: builder.mutation({
      query: (body) => ({ url: '/ratings', method: 'POST', body }),
      invalidatesTags: ['Rating'],
    }),
    // Clinic Groups
    getClinicGroup: builder.query({
      query: () => '/clinic-group',
    }),
    createClinicGroup: builder.mutation({
      query: (body) => ({ url: '/clinic-group', method: 'POST', body }),
    }),
    addClinicToGroup: builder.mutation({
      query: (body) => ({ url: '/clinic-group/add-clinic', method: 'POST', body }),
    }),
    getGroupAnalytics: builder.query({
      query: () => '/clinic-group/analytics',
    }),
  }),
});

export const {
  useGetPresetsQuery,
  useCreatePresetMutation,
  useCreatePresetsBulkMutation,
  useDeletePresetMutation,
  useGetNoteTemplatesQuery,
  useCreateNoteTemplateMutation,
  useDeleteNoteTemplateMutation,
  useGetClinicSettingsQuery,
  useUpdateClinicSettingsMutation,
  useSendTestEmailMutation,
  useGetDoctorRatingSummariesQuery,
  useGetDoctorRatingsQuery,
  useCreateRatingMutation,
  useGetClinicGroupQuery,
  useCreateClinicGroupMutation,
  useAddClinicToGroupMutation,
  useGetGroupAnalyticsQuery,
} = adminApi;
