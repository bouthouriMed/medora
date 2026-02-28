export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'DOCTOR' | 'STAFF';
  clinicId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  address: string | null;
  notes: string | null;
  clinicId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  clinicId: string;
  dateTime: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  patient?: Patient;
  doctor?: User;
}

export interface Invoice {
  id: string;
  appointmentId: string;
  patientId: string;
  clinicId: string;
  amount: number;
  status: 'PAID' | 'UNPAID';
  dueDate: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  patient?: Patient;
  appointment?: Appointment;
}

export interface DashboardData {
  todayAppointments: Appointment[];
  upcomingAppointments: Appointment[];
  monthlyRevenue: number;
  monthlyRevenueCount: number;
  unpaidInvoices: number;
}
