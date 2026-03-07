import { baseApi } from './baseApi';

export const communicationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Messages
    getMessages: builder.query({
      query: (patientId) => ({ url: '/messages', params: patientId ? { patientId } : undefined }),
      providesTags: ['Message'],
    }),
    getConversation: builder.query({
      query: (otherId) => `/messages/${otherId}`,
      providesTags: ['Message'],
    }),
    sendMessage: builder.mutation({
      query: (body) => ({ url: '/messages', method: 'POST', body }),
      invalidatesTags: ['Message'],
    }),
    getUnreadCount: builder.query({
      query: () => '/messages/unread',
    }),
    // Tasks
    getTasks: builder.query({
      query: (params) => ({ url: '/tasks', params }),
      providesTags: ['Task'],
    }),
    createTask: builder.mutation({
      query: (body) => ({ url: '/tasks', method: 'POST', body }),
      invalidatesTags: ['Task'],
    }),
    updateTask: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/tasks/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Task'],
    }),
    deleteTask: builder.mutation({
      query: (id) => ({ url: `/tasks/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Task'],
    }),
    // Notifications
    getNotifications: builder.query({
      query: (params) => ({ url: '/notifications', params: params || {} }),
      providesTags: ['Notification'],
    }),
    getNotificationUnreadCount: builder.query({
      query: () => '/notifications/unread-count',
      providesTags: ['Notification'],
    }),
    markNotificationRead: builder.mutation({
      query: (id) => ({ url: `/notifications/${id}/read`, method: 'PUT' }),
      invalidatesTags: ['Notification'],
    }),
    markAllNotificationsRead: builder.mutation({
      query: () => ({ url: '/notifications/read-all', method: 'PUT' }),
      invalidatesTags: ['Notification'],
    }),
    deleteNotification: builder.mutation({
      query: (id) => ({ url: `/notifications/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Notification'],
    }),
    // Prescription Requests
    getPrescriptionRequests: builder.query({
      query: (params) => ({ url: '/prescription-requests', params }),
      providesTags: ['PrescriptionRequest'],
    }),
    reviewPrescriptionRequest: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/prescription-requests/${id}`, method: 'PUT', body }),
      invalidatesTags: ['PrescriptionRequest'],
    }),
  }),
});

export const {
  useGetMessagesQuery,
  useGetConversationQuery,
  useSendMessageMutation,
  useGetUnreadCountQuery,
  useGetTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useGetNotificationsQuery,
  useGetNotificationUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteNotificationMutation,
  useGetPrescriptionRequestsQuery,
  useReviewPrescriptionRequestMutation,
} = communicationApi;
