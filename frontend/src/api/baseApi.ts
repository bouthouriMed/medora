import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const baseApi = createApi({
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
  tagTypes: [
    'Patient', 'Appointment', 'Invoice', 'Dashboard', 'Preset',
    'Tag', 'CustomField', 'NoteTemplate', 'RecurringAppointment',
    'LabResult', 'Task', 'PatientMedicalHistory', 'Waitlist',
    'Rating', 'Message', 'Insurance', 'PrescriptionRequest',
    'Payment', 'DeviceReading', 'VideoSession', 'Marketplace',
    'Reminder', 'Notification', 'AppointmentRequest',
  ],
  endpoints: () => ({}),
});
