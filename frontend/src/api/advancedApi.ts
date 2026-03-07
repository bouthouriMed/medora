import { baseApi } from './baseApi';

export const advancedApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Remote Patient Monitoring
    getDeviceReadings: builder.query({
      query: (params) => ({ url: '/device-readings', params }),
      providesTags: ['DeviceReading'],
    }),
    getPatientDeviceReadings: builder.query({
      query: (patientId) => `/device-readings/patient/${patientId}`,
      providesTags: ['DeviceReading'],
    }),
    getPatientAlerts: builder.query({
      query: (patientId) => `/device-readings/patient/${patientId}/alerts`,
      providesTags: ['DeviceReading'],
    }),
    createDeviceReading: builder.mutation({
      query: (body) => ({ url: '/device-readings', method: 'POST', body }),
      invalidatesTags: ['DeviceReading'],
    }),
    deleteDeviceReading: builder.mutation({
      query: (id) => ({ url: `/device-readings/${id}`, method: 'DELETE' }),
      invalidatesTags: ['DeviceReading'],
    }),
    // Video Sessions (Telemedicine)
    getVideoSessions: builder.query({
      query: (params) => ({ url: '/video-sessions', params }),
      providesTags: ['VideoSession'],
    }),
    getVideoSession: builder.query({
      query: (id) => `/video-sessions/${id}`,
      providesTags: ['VideoSession'],
    }),
    createVideoSession: builder.mutation({
      query: (body) => ({ url: '/video-sessions', method: 'POST', body }),
      invalidatesTags: ['VideoSession'],
    }),
    updateVideoSession: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/video-sessions/${id}`, method: 'PUT', body }),
      invalidatesTags: ['VideoSession'],
    }),
    // Medical Marketplace
    getMarketplaceItems: builder.query({
      query: (params) => ({ url: '/marketplace/items', params }),
      providesTags: ['Marketplace'],
    }),
    createMarketplaceItem: builder.mutation({
      query: (body) => ({ url: '/marketplace/items', method: 'POST', body }),
      invalidatesTags: ['Marketplace'],
    }),
    updateMarketplaceItem: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/marketplace/items/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Marketplace'],
    }),
    deleteMarketplaceItem: builder.mutation({
      query: (id) => ({ url: `/marketplace/items/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Marketplace'],
    }),
    getMarketplaceOrders: builder.query({
      query: (params) => ({ url: '/marketplace/orders', params }),
      providesTags: ['Marketplace'],
    }),
    createMarketplaceOrder: builder.mutation({
      query: (body) => ({ url: '/marketplace/orders', method: 'POST', body }),
      invalidatesTags: ['Marketplace'],
    }),
    updateMarketplaceOrder: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/marketplace/orders/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Marketplace'],
    }),
  }),
});

export const {
  useGetDeviceReadingsQuery,
  useGetPatientDeviceReadingsQuery,
  useGetPatientAlertsQuery,
  useCreateDeviceReadingMutation,
  useDeleteDeviceReadingMutation,
  useGetVideoSessionsQuery,
  useGetVideoSessionQuery,
  useCreateVideoSessionMutation,
  useUpdateVideoSessionMutation,
  useGetMarketplaceItemsQuery,
  useCreateMarketplaceItemMutation,
  useUpdateMarketplaceItemMutation,
  useDeleteMarketplaceItemMutation,
  useGetMarketplaceOrdersQuery,
  useCreateMarketplaceOrderMutation,
  useUpdateMarketplaceOrderMutation,
} = advancedApi;
