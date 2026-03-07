import { baseApi } from './baseApi';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
    }),
    login: builder.mutation({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    me: builder.query({
      query: () => '/auth/me',
    }),
    getUsers: builder.query({
      query: () => '/auth/users',
    }),
    createUser: builder.mutation({
      query: (body) => ({ url: '/auth/users', method: 'POST', body }),
    }),
    updateUser: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/auth/users/${id}`, method: 'PUT', body }),
    }),
    deleteUser: builder.mutation({
      query: (id) => ({ url: `/auth/users/${id}`, method: 'DELETE' }),
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
} = authApi;
