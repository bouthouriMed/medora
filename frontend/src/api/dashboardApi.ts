import { baseApi } from './baseApi';

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboard: builder.query({
      query: () => '/dashboard',
      providesTags: ['Dashboard'],
    }),
    getAnalytics: builder.query({
      query: () => '/dashboard/analytics',
      providesTags: ['Dashboard'],
    }),
    getSmartScheduling: builder.query({
      query: () => '/dashboard/smart-scheduling',
      providesTags: ['Dashboard', 'Waitlist', 'Appointment'],
    }),
  }),
});

export const {
  useGetDashboardQuery,
  useGetAnalyticsQuery,
  useGetSmartSchedulingQuery,
} = dashboardApi;
