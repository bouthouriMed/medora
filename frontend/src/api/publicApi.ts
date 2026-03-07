import { baseApi } from './baseApi';

export const publicApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPortalData: builder.query({
      query: (token) => `/public/patient/${token}`,
    }),
    portalChat: builder.mutation({
      query: ({ token, message, history }) => ({ url: `/public/patient/${token}/chat`, method: 'POST', body: { message, history } }),
    }),
    getPortalMessages: builder.query({
      query: (token) => `/public/patient/${token}/messages`,
    }),
    sendPortalMessage: builder.mutation({
      query: ({ token, ...body }) => ({ url: `/public/patient/${token}/messages`, method: 'POST', body }),
    }),
    createPortalPrescriptionRequest: builder.mutation({
      query: ({ token, ...body }) => ({ url: `/public/patient/${token}/prescription-request`, method: 'POST', body }),
    }),
    createPublicRating: builder.mutation({
      query: ({ clinicId, ...body }) => ({ url: `/public/clinic/${clinicId}/rating`, method: 'POST', body }),
    }),
    // Public Booking
    getClinicDoctors: builder.query<{ clinic: { name: string; address: string | null; phone: string | null }; doctors: Array<{ id: string; firstName: string; lastName: string; email: string; specialty?: string }> }, string>({
      query: (clinicId) => `/public/clinic/${clinicId}/doctors`,
    }),
    getAvailableSlots: builder.query<{ slots: string[] }, { clinicId: string; doctorId: string; date: string }>({
      query: ({ clinicId, doctorId, date }) => `/public/clinic/${clinicId}/${doctorId}/slots/${date}`,
    }),
    requestAppointment: builder.mutation({
      query: ({ clinicId, ...body }) => ({ url: `/public/clinic/${clinicId}/appointment/request`, method: 'POST', body }),
    }),
    triageSymptoms: builder.mutation({
      query: (body) => ({ url: '/public/triage', method: 'POST', body }),
    }),
  }),
});

export const {
  useGetPortalDataQuery,
  usePortalChatMutation,
  useGetPortalMessagesQuery,
  useSendPortalMessageMutation,
  useCreatePortalPrescriptionRequestMutation,
  useCreatePublicRatingMutation,
  useGetClinicDoctorsQuery,
  useGetAvailableSlotsQuery,
  useRequestAppointmentMutation,
  useTriageSymptomsMutation,
} = publicApi;
