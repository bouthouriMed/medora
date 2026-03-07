import { baseApi } from './baseApi';

export const appointmentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAppointments: builder.query({
      query: (params) => ({ url: '/appointments', params }),
      providesTags: ['Appointment'],
    }),
    getAppointment: builder.query({
      query: (id) => `/appointments/${id}`,
      providesTags: (_result: any, _err: any, id: string) => [{ type: 'Appointment' as const, id }],
    }),
    getPatientAppointments: builder.query({
      query: (patientId) => `/patients/${patientId}/appointments`,
      providesTags: ['Appointment'],
    }),
    createAppointment: builder.mutation({
      query: (body) => ({ url: '/appointments', method: 'POST', body }),
      invalidatesTags: ['Appointment', 'Dashboard'],
    }),
    updateAppointment: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/appointments/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Appointment', 'Dashboard'],
    }),
    completeWithInvoice: builder.mutation({
      query: ({ id, items, notes }) => ({ url: `/appointments/${id}/complete-with-invoice`, method: 'POST', body: { items, notes } }),
      invalidatesTags: ['Appointment', 'Invoice', 'Dashboard'],
    }),
    cancelAppointment: builder.mutation({
      query: (id) => ({ url: `/appointments/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Appointment', 'Dashboard'],
    }),
    getAppointmentRequests: builder.query({
      query: (status) => ({ url: '/appointment-requests', params: status ? { status } : undefined }),
      providesTags: ['AppointmentRequest'],
    }),
    approveAppointmentRequest: builder.mutation({
      query: (id) => ({ url: `/appointment-requests/${id}/approve`, method: 'POST' }),
      invalidatesTags: ['AppointmentRequest', 'Appointment', 'Patient', 'Dashboard'],
    }),
    rejectAppointmentRequest: builder.mutation({
      query: ({ id, reason }) => ({ url: `/appointment-requests/${id}/reject`, method: 'POST', body: { reason } }),
      invalidatesTags: ['AppointmentRequest'],
    }),
    // Recurring Appointments
    getRecurringAppointments: builder.query({
      query: () => '/recurring-appointments',
      providesTags: ['RecurringAppointment'],
    }),
    createRecurringAppointment: builder.mutation({
      query: (body) => ({ url: '/recurring-appointments', method: 'POST', body }),
      invalidatesTags: ['RecurringAppointment', 'Appointment'],
    }),
    deleteRecurringAppointment: builder.mutation({
      query: (id) => ({ url: `/recurring-appointments/${id}`, method: 'DELETE' }),
      invalidatesTags: ['RecurringAppointment', 'Appointment'],
    }),
    // Waitlist
    getWaitlist: builder.query({
      query: (status) => ({ url: '/waitlist', params: status ? { status } : undefined }),
      providesTags: ['Waitlist'],
    }),
    createWaitlistEntry: builder.mutation({
      query: (body) => ({ url: '/waitlist', method: 'POST', body }),
      invalidatesTags: ['Waitlist'],
    }),
    updateWaitlistEntry: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/waitlist/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Waitlist'],
    }),
    deleteWaitlistEntry: builder.mutation({
      query: (id) => ({ url: `/waitlist/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Waitlist'],
    }),
    bookFromWaitlist: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/waitlist/${id}/book`, method: 'POST', body }),
      invalidatesTags: ['Waitlist', 'Appointment'],
    }),
    // Reminders
    getPendingReminders: builder.query({
      query: () => '/reminders',
      providesTags: ['Reminder'],
    }),
    triggerReminders: builder.mutation({
      query: () => ({ url: '/reminders/send', method: 'POST' }),
      invalidatesTags: ['Reminder'],
    }),
  }),
});

export const {
  useGetAppointmentsQuery,
  useGetAppointmentQuery,
  useGetPatientAppointmentsQuery,
  useCreateAppointmentMutation,
  useUpdateAppointmentMutation,
  useCompleteWithInvoiceMutation,
  useCancelAppointmentMutation,
  useGetAppointmentRequestsQuery,
  useApproveAppointmentRequestMutation,
  useRejectAppointmentRequestMutation,
  useGetRecurringAppointmentsQuery,
  useCreateRecurringAppointmentMutation,
  useDeleteRecurringAppointmentMutation,
  useGetWaitlistQuery,
  useCreateWaitlistEntryMutation,
  useUpdateWaitlistEntryMutation,
  useDeleteWaitlistEntryMutation,
  useBookFromWaitlistMutation,
  useGetPendingRemindersQuery,
  useTriggerRemindersMutation,
} = appointmentApi;
