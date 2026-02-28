import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:3000/api',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Patient', 'Appointment', 'Invoice', 'Dashboard'],
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
} = api;
