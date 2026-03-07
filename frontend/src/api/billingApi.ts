import { baseApi } from './baseApi';

export const billingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getInvoices: builder.query({
      query: (status) => ({ url: '/invoices', params: status ? { status } : undefined }),
      providesTags: ['Invoice'],
    }),
    getUnpaidInvoices: builder.query({
      query: () => '/invoices/unpaid',
      providesTags: ['Invoice'],
    }),
    getInvoice: builder.query({
      query: (id) => `/invoices/${id}`,
      providesTags: (_result: any, _err: any, id: string) => [{ type: 'Invoice' as const, id }],
    }),
    createInvoice: builder.mutation({
      query: (body) => ({ url: '/invoices', method: 'POST', body }),
      invalidatesTags: ['Invoice', 'Dashboard'],
    }),
    markInvoiceAsPaid: builder.mutation({
      query: (id) => ({ url: `/invoices/${id}/pay`, method: 'PUT' }),
      invalidatesTags: ['Invoice', 'Dashboard'],
    }),
    markInvoiceAsUnpaid: builder.mutation({
      query: (id) => ({ url: `/invoices/${id}/unpay`, method: 'PUT' }),
      invalidatesTags: ['Invoice', 'Dashboard'],
    }),
    // Payments
    getPayments: builder.query({
      query: () => '/payments',
      providesTags: ['Payment'],
    }),
    createCheckoutSession: builder.mutation({
      query: (body) => ({ url: '/payments/checkout', method: 'POST', body }),
    }),
    recordManualPayment: builder.mutation({
      query: (body) => ({ url: '/payments/manual', method: 'POST', body }),
      invalidatesTags: ['Payment', 'Invoice'],
    }),
    // Insurance Claims
    getInsuranceClaims: builder.query({
      query: (params) => ({ url: '/insurance', params }),
      providesTags: ['Insurance'],
    }),
    getInsuranceStats: builder.query({
      query: () => '/insurance/stats',
      providesTags: ['Insurance'],
    }),
    createInsuranceClaim: builder.mutation({
      query: (body) => ({ url: '/insurance', method: 'POST', body }),
      invalidatesTags: ['Insurance'],
    }),
    updateInsuranceClaim: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/insurance/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Insurance'],
    }),
    deleteInsuranceClaim: builder.mutation({
      query: (id) => ({ url: `/insurance/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Insurance'],
    }),
  }),
});

export const {
  useGetInvoicesQuery,
  useGetUnpaidInvoicesQuery,
  useGetInvoiceQuery,
  useCreateInvoiceMutation,
  useMarkInvoiceAsPaidMutation,
  useMarkInvoiceAsUnpaidMutation,
  useGetPaymentsQuery,
  useCreateCheckoutSessionMutation,
  useRecordManualPaymentMutation,
  useGetInsuranceClaimsQuery,
  useGetInsuranceStatsQuery,
  useCreateInsuranceClaimMutation,
  useUpdateInsuranceClaimMutation,
  useDeleteInsuranceClaimMutation,
} = billingApi;
