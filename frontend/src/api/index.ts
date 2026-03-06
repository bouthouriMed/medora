import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Patient', 'Appointment', 'Invoice', 'Dashboard', 'Preset', 'Tag', 'CustomField', 'NoteTemplate', 'RecurringAppointment', 'LabResult', 'Task', 'PatientMedicalHistory', 'Waitlist', 'Rating', 'Message', 'Insurance', 'PrescriptionRequest', 'Payment', 'DeviceReading', 'VideoSession', 'Marketplace', 'Reminder', 'Notification', 'AppointmentRequest'],
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
    restorePatient: builder.mutation({
      query: (id) => ({
        url: `/patients/${id}/restore`,
        method: 'POST',
      }),
      invalidatesTags: ['Patient', 'Dashboard'],
    }),
    regeneratePatientToken: builder.mutation({
      query: (id) => ({
        url: `/patients/${id}/regenerate-token`,
        method: 'POST',
      }),
      invalidatesTags: ['Patient'],
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
    getAppointmentRequests: builder.query({
      query: (status) => ({
        url: '/appointment-requests',
        params: status ? { status } : undefined,
      }),
      providesTags: ['AppointmentRequest'],
    }),
    approveAppointmentRequest: builder.mutation({
      query: (id) => ({
        url: `/appointment-requests/${id}/approve`,
        method: 'POST',
      }),
      invalidatesTags: ['AppointmentRequest', 'Appointment', 'Patient', 'Dashboard'],
    }),
    rejectAppointmentRequest: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/appointment-requests/${id}/reject`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['AppointmentRequest'],
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
    getPresets: builder.query({
      query: (type) => ({
        url: '/presets',
        params: type ? { type } : undefined,
      }),
      providesTags: ['Preset'],
    }),
    createPreset: builder.mutation({
      query: (body) => ({
        url: '/presets',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Preset'],
    }),
    createPresetsBulk: builder.mutation({
      query: (body) => ({
        url: '/presets/bulk',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Preset'],
    }),
    deletePreset: builder.mutation({
      query: (id) => ({
        url: `/presets/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Preset'],
    }),
    getPortalData: builder.query({
      query: (token) => `/public/patient/${token}`,
    }),
    portalChat: builder.mutation({
      query: ({ token, message, history }) => ({
        url: `/public/patient/${token}/chat`,
        method: 'POST',
        body: { message, history },
      }),
    }),
    getTags: builder.query({
      query: () => '/tags',
    }),
    createTag: builder.mutation({
      query: (body) => ({
        url: '/tags',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Tag'],
    }),
    deleteTag: builder.mutation({
      query: (id) => ({
        url: `/tags/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Tag'],
    }),
    getPatientTags: builder.query({
      query: (patientId) => `/patients/${patientId}/tags`,
    }),
    addTagToPatient: builder.mutation({
      query: (body) => ({
        url: '/patients/tags',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Patient'],
    }),
    removeTagFromPatient: builder.mutation({
      query: (args) => ({
        url: `/patients/${args.patientId}/tags/${args.tagId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Patient'],
    }),
    getCustomFields: builder.query({
      query: () => '/custom-fields',
    }),
    createCustomField: builder.mutation({
      query: (body) => ({
        url: '/custom-fields',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['CustomField'],
    }),
    deleteCustomField: builder.mutation({
      query: (id) => ({
        url: `/custom-fields/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['CustomField'],
    }),
    getPatientCustomFields: builder.query({
      query: (patientId) => `/patients/${patientId}/custom-fields`,
    }),
    savePatientCustomField: builder.mutation({
      query: ({ patientId, ...body }) => ({
        url: `/patients/${patientId}/custom-fields`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Patient'],
    }),
    getNoteTemplates: builder.query({
      query: (type) => ({
        url: '/note-templates',
        params: type ? { type } : undefined,
      }),
    }),
    createNoteTemplate: builder.mutation({
      query: (body) => ({
        url: '/note-templates',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['NoteTemplate'],
    }),
    deleteNoteTemplate: builder.mutation({
      query: (id) => ({
        url: `/note-templates/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['NoteTemplate'],
    }),
    getRecurringAppointments: builder.query({
      query: () => '/recurring-appointments',
      providesTags: ['RecurringAppointment'],
    }),
    createRecurringAppointment: builder.mutation({
      query: (body) => ({
        url: '/recurring-appointments',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['RecurringAppointment', 'Appointment'],
    }),
    deleteRecurringAppointment: builder.mutation({
      query: (id) => ({
        url: `/recurring-appointments/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['RecurringAppointment', 'Appointment'],
    }),
    getClinicSettings: builder.query({
      query: () => '/settings',
    }),
    updateClinicSettings: builder.mutation({
      query: (body) => ({
        url: '/settings',
        method: 'PUT',
        body,
      }),
    }),
    sendTestEmail: builder.mutation({
      query: (body) => ({
        url: '/settings/test-email',
        method: 'POST',
        body,
      }),
    }),
    getLabResults: builder.query({
      query: (params) => ({
        url: '/lab-results',
        params,
      }),
      providesTags: ['LabResult'],
    }),
    getLabResult: builder.query({
      query: (id) => `/lab-results/${id}`,
    }),
    createLabResult: builder.mutation({
      query: (body) => ({
        url: '/lab-results',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['LabResult'],
    }),
    updateLabResult: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/lab-results/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['LabResult'],
    }),
    deleteLabResult: builder.mutation({
      query: (id) => ({
        url: `/lab-results/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['LabResult'],
    }),
    getTasks: builder.query({
      query: (params) => ({
        url: '/tasks',
        params,
      }),
      providesTags: ['Task'],
    }),
    createTask: builder.mutation({
      query: (body) => ({
        url: '/tasks',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Task'],
    }),
    updateTask: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/tasks/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Task'],
    }),
    deleteTask: builder.mutation({
      query: (id) => ({
        url: `/tasks/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Task'],
    }),
    getPatientMedicalHistory: builder.query({
      query: (patientId) => `/patients/${patientId}/medical-history`,
      providesTags: (result, error, patientId) => [{ type: 'PatientMedicalHistory', id: patientId }],
    }),
    createVital: builder.mutation({
      query: ({ patientId, ...body }) => ({
        url: `/patients/${patientId}/vitals`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { patientId }) => [
        'Patient',
        { type: 'PatientMedicalHistory', id: patientId },
      ],
    }),
    createDiagnosis: builder.mutation({
      query: ({ patientId, ...body }) => ({
        url: `/patients/${patientId}/diagnoses`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { patientId }) => [
        'Patient',
        { type: 'PatientMedicalHistory', id: patientId },
      ],
    }),
    updateDiagnosis: builder.mutation({
      query: ({ id, patientId, ...body }) => ({
        url: `/diagnoses/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { patientId }) => [
        'Patient',
        { type: 'PatientMedicalHistory', id: patientId },
      ],
    }),
    deleteDiagnosis: builder.mutation({
      query: ({ id, patientId }) => ({
        url: `/diagnoses/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { patientId }) => [
        'Patient',
        { type: 'PatientMedicalHistory', id: patientId },
      ],
    }),
    createPrescription: builder.mutation({
      query: ({ patientId, ...body }) => ({
        url: `/patients/${patientId}/prescriptions`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { patientId }) => [
        'Patient',
        { type: 'PatientMedicalHistory', id: patientId },
      ],
    }),
    updatePrescription: builder.mutation({
      query: ({ id, patientId, ...body }) => ({
        url: `/prescriptions/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { patientId }) => [
        'Patient',
        { type: 'PatientMedicalHistory', id: patientId },
      ],
    }),
    deletePrescription: builder.mutation({
      query: ({ id, patientId }) => ({
        url: `/prescriptions/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { patientId }) => [
        'Patient',
        { type: 'PatientMedicalHistory', id: patientId },
      ],
    }),
    createAllergy: builder.mutation({
      query: ({ patientId, ...body }) => ({
        url: `/patients/${patientId}/allergies`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { patientId }) => [
        'Patient',
        { type: 'PatientMedicalHistory', id: patientId },
      ],
    }),
    deleteAllergy: builder.mutation({
      query: ({ id, patientId }) => ({
        url: `/allergies/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { patientId }) => [
        'Patient',
        { type: 'PatientMedicalHistory', id: patientId },
      ],
    }),
    createCondition: builder.mutation({
      query: ({ patientId, ...body }) => ({
        url: `/patients/${patientId}/conditions`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { patientId }) => [
        'Patient',
        { type: 'PatientMedicalHistory', id: patientId },
      ],
    }),
    deleteCondition: builder.mutation({
      query: ({ id, patientId }) => ({
        url: `/conditions/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { patientId }) => [
        'Patient',
        { type: 'PatientMedicalHistory', id: patientId },
      ],
    }),
    generateVisitNote: builder.mutation({
      query: ({ id }) => ({
        url: `/appointments/${id}/generate-note`,
        method: 'POST',
      }),
    }),
    generatePatientSummary: builder.mutation({
      query: ({ patientId }) => ({
        url: `/patients/${patientId}/generate-summary`,
        method: 'POST',
      }),
    }),
    createMedicalRecord: builder.mutation({
      query: ({ patientId, ...body }) => ({
        url: `/patients/${patientId}/medical-records`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { patientId }) => [
        { type: 'PatientMedicalHistory', id: patientId },
      ],
    }),
    updateMedicalRecord: builder.mutation({
      query: ({ id, patientId, ...body }) => ({
        url: `/medical-records/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { patientId }) => [
        { type: 'PatientMedicalHistory', id: patientId },
      ],
    }),

    // Analytics
    getAnalytics: builder.query({
      query: () => '/dashboard/analytics',
      providesTags: ['Dashboard'],
    }),
    getSmartScheduling: builder.query({
      query: () => '/dashboard/smart-scheduling',
      providesTags: ['Dashboard', 'Waitlist', 'Appointment'],
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

    // Prescription Requests
    getPrescriptionRequests: builder.query({
      query: (params) => ({ url: '/prescription-requests', params }),
      providesTags: ['PrescriptionRequest'],
    }),
    reviewPrescriptionRequest: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/prescription-requests/${id}`, method: 'PUT', body }),
      invalidatesTags: ['PrescriptionRequest'],
    }),

    // Clinical Decision Support
    checkDrugInteractions: builder.mutation({
      query: (body) => ({ url: '/clinical/drug-interactions', method: 'POST', body }),
    }),
    checkAllergyConflict: builder.mutation({
      query: (body) => ({ url: '/clinical/allergy-check', method: 'POST', body }),
    }),
    getDoctorBriefing: builder.query({
      query: ({ patientId, reason }) => ({ url: `/clinical/briefing/${patientId}`, params: reason ? { reason } : undefined }),
    }),

    // Portal Messages & Prescription Requests
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

    // Reminders
    getPendingReminders: builder.query({
      query: () => '/reminders',
      providesTags: ['Reminder'],
    }),
    triggerReminders: builder.mutation({
      query: () => ({ url: '/reminders/send', method: 'POST' }),
      invalidatesTags: ['Reminder'],
    }),

    // Notifications
    getNotifications: builder.query({
      query: (params) => ({
        url: '/notifications',
        params: params || {},
      }),
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
  useRestorePatientMutation,
  useRegeneratePatientTokenMutation,
  useGetAppointmentsQuery,
  useGetAppointmentQuery,
  useGetPatientAppointmentsQuery,
  useCreateAppointmentMutation,
  useUpdateAppointmentMutation,
  useCancelAppointmentMutation,
  // Appointment Requests
  useGetAppointmentRequestsQuery,
  useApproveAppointmentRequestMutation,
  useRejectAppointmentRequestMutation,
  useGetInvoicesQuery,
  useGetUnpaidInvoicesQuery,
  useGetInvoiceQuery,
  useCreateInvoiceMutation,
  useMarkInvoiceAsPaidMutation,
  useMarkInvoiceAsUnpaidMutation,
  useGetPresetsQuery,
  useCreatePresetMutation,
  useCreatePresetsBulkMutation,
  useDeletePresetMutation,
  useGetPortalDataQuery,
  usePortalChatMutation,
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
  useGetNoteTemplatesQuery,
  useCreateNoteTemplateMutation,
  useDeleteNoteTemplateMutation,
  useGetRecurringAppointmentsQuery,
  useCreateRecurringAppointmentMutation,
  useDeleteRecurringAppointmentMutation,
  useGetClinicSettingsQuery,
  useUpdateClinicSettingsMutation,
  useSendTestEmailMutation,
  useGetLabResultsQuery,
  useGetLabResultQuery,
  useCreateLabResultMutation,
  useUpdateLabResultMutation,
  useDeleteLabResultMutation,
  useGetTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useGetPatientMedicalHistoryQuery,
  useCreateVitalMutation,
  useCreateDiagnosisMutation,
  useUpdateDiagnosisMutation,
  useDeleteDiagnosisMutation,
  useCreatePrescriptionMutation,
  useUpdatePrescriptionMutation,
  useDeletePrescriptionMutation,
  useCreateAllergyMutation,
  useDeleteAllergyMutation,
  useCreateConditionMutation,
  useDeleteConditionMutation,
  useGenerateVisitNoteMutation,
  useGeneratePatientSummaryMutation,
  useCreateMedicalRecordMutation,
  useUpdateMedicalRecordMutation,
  // Analytics
  useGetAnalyticsQuery,
  useGetSmartSchedulingQuery,
  // Waitlist
  useGetWaitlistQuery,
  useCreateWaitlistEntryMutation,
  useUpdateWaitlistEntryMutation,
  useDeleteWaitlistEntryMutation,
  useBookFromWaitlistMutation,
  // Doctor Ratings
  useGetDoctorRatingSummariesQuery,
  useGetDoctorRatingsQuery,
  useCreateRatingMutation,
  // Messages
  useGetMessagesQuery,
  useGetConversationQuery,
  useSendMessageMutation,
  useGetUnreadCountQuery,
  // Insurance
  useGetInsuranceClaimsQuery,
  useGetInsuranceStatsQuery,
  useCreateInsuranceClaimMutation,
  useUpdateInsuranceClaimMutation,
  useDeleteInsuranceClaimMutation,
  // Prescription Requests
  useGetPrescriptionRequestsQuery,
  useReviewPrescriptionRequestMutation,
  // Clinical Decision Support
  useCheckDrugInteractionsMutation,
  useCheckAllergyConflictMutation,
  useGetDoctorBriefingQuery,
  // Portal extensions
  useGetPortalMessagesQuery,
  useSendPortalMessageMutation,
  useCreatePortalPrescriptionRequestMutation,
  useCreatePublicRatingMutation,
  // Public Booking
  useGetClinicDoctorsQuery,
  useGetAvailableSlotsQuery,
  useRequestAppointmentMutation,
  useTriageSymptomsMutation,
  // Payments
  useGetPaymentsQuery,
  useCreateCheckoutSessionMutation,
  useRecordManualPaymentMutation,
  // Clinic Groups
  useGetClinicGroupQuery,
  useCreateClinicGroupMutation,
  useAddClinicToGroupMutation,
  useGetGroupAnalyticsQuery,
  // Remote Patient Monitoring
  useGetDeviceReadingsQuery,
  useGetPatientDeviceReadingsQuery,
  useGetPatientAlertsQuery,
  useCreateDeviceReadingMutation,
  useDeleteDeviceReadingMutation,
  // Video Sessions
  useGetVideoSessionsQuery,
  useGetVideoSessionQuery,
  useCreateVideoSessionMutation,
  useUpdateVideoSessionMutation,
  // Marketplace
  useGetMarketplaceItemsQuery,
  useCreateMarketplaceItemMutation,
  useUpdateMarketplaceItemMutation,
  useDeleteMarketplaceItemMutation,
  useGetMarketplaceOrdersQuery,
  useCreateMarketplaceOrderMutation,
  useUpdateMarketplaceOrderMutation,
  // Reminders
  useGetPendingRemindersQuery,
  useTriggerRemindersMutation,
  // Notifications
  useGetNotificationsQuery,
  useGetNotificationUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteNotificationMutation,
} = api;
