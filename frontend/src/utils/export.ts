import type { Appointment } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const getToken = () => localStorage.getItem('token');

export const exportToCSV = async (endpoint: string, filename: string) => {
  const token = getToken();
  if (!token) {
    alert('Please log in to export data');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Export error:', error);
    alert('Failed to export data');
  }
};

export const exportPatients = () => exportToCSV('/export/patients', `patients_${new Date().toISOString().split('T')[0]}.csv`);
export const exportAppointments = (startDate?: string, endDate?: string, status?: string) => {
  const params = new URLSearchParams();
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);
  if (status) params.set('status', status);
  const query = params.toString() ? `?${params.toString()}` : '';
  exportToCSV(`/export/appointments${query}`, `appointments_${new Date().toISOString().split('T')[0]}.csv`);
};
export const exportInvoices = (status?: string, startDate?: string, endDate?: string) => {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);
  const query = params.toString() ? `?${params.toString()}` : '';
  exportToCSV(`/export/invoices${query}`, `invoices_${new Date().toISOString().split('T')[0]}.csv`);
};

export const generateICS = (appointments: Appointment[], title: string = 'Appointments') => {
  const events = appointments.map(apt => {
    const start = new Date(apt.dateTime).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const end = new Date(new Date(apt.dateTime).getTime() + 30 * 60000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    return `BEGIN:VEVENT
UID:${apt.id}
DTSTART:${start}
DTEND:${end}
SUMMARY:${apt.patient?.firstName} ${apt.patient?.lastName} - Appointment
DESCRIPTION:Status: ${apt.status}
END:VEVENT`;
  });

  const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Medora//Clinic Management//EN
${events.join('\n')}
END:VCALENDAR`;

  const blob = new Blob([ics], { type: 'text/calendar' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.ics`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};
