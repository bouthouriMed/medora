export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'DOCTOR' | 'NURSE' | 'STAFF' | 'ADMIN';
  clinicId: string;
  permissions?: string[];
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
  portalToken: string | null;
  createdAt: string;
  updatedAt: string;
  patientTags?: { tag: Tag }[];
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
  patient?: {
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    dateOfBirth: string | null;
    address: string | null;
    notes: string | null;
    id: string;
    clinicId: string;
    portalToken?: string | null;
    createdAt: string;
    updatedAt: string;
  };
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
  patient?: {
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    dateOfBirth: string | null;
    address: string | null;
    notes: string | null;
    id: string;
    clinicId: string;
    portalToken?: string | null;
    createdAt: string;
    updatedAt: string;
  };
  appointment?: Appointment;
}

export interface DashboardData {
  todayAppointments: Appointment[];
  upcomingAppointments: Appointment[];
  monthlyRevenue: number;
  monthlyRevenueCount: number;
  unpaidInvoices: number;
  revenueByMonth: { month: string; revenue: number }[];
  appointmentsByMonth: { month: string; total: number; completed: number; cancelled: number; noShow: number }[];
  patientsByMonth: { month: string; count: number }[];
}

export type PresetType = 'DIAGNOSIS' | 'PRESCRIPTION' | 'PROCEDURE';

export interface Preset {
  id: string;
  name: string;
  type: PresetType;
  description: string | null;
  price: number | null;
  clinicId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PortalData {
  patient: Patient;
  clinic: {
    name: string;
    address: string | null;
    phone: string | null;
    email: string | null;
  };
  upcomingAppointments: Appointment[];
  pastAppointments: Appointment[];
  outstandingInvoices: Invoice[];
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  clinicId: string;
  createdAt: string;
  patientCount?: number;
}

export interface CustomField {
  id: string;
  name: string;
  fieldType: string;
  options: string | null;
  required: boolean;
  clinicId: string;
  createdAt: string;
}

export interface NoteTemplate {
  id: string;
  name: string;
  content: string;
  type: 'APPOINTMENT' | 'INVOICE';
  clinicId: string;
  createdAt: string;
}

export interface RecurringAppointment {
  id: string;
  patientId: string;
  doctorId: string;
  clinicId: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  interval: number;
  startDate: string;
  endDate: string | null;
  lastCreatedAt: string | null;
  active: boolean;
  patient: Patient;
  doctor: User;
  createdAt: string;
}

export interface ClinicSettings {
  id: string;
  clinicId: string;
  emailNotifications: boolean;
  smtpHost: string | null;
  smtpPort: string | null;
  smtpUser: string | null;
  smtpPassword: string | null;
  fromEmail: string | null;
}

export interface LabResult {
  id: string;
  patientId: string;
  clinicId: string;
  testName: string;
  category: string | null;
  result: string | null;
  normalRange: string | null;
  status: 'PENDING' | 'COMPLETED' | 'ABNORMAL';
  notes: string | null;
  orderedBy: string | null;
  orderedAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  patient?: Patient;
}

export interface Task {
  id: string;
  clinicId: string;
  title: string;
  description: string | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate: string | null;
  patientId: string | null;
  assignedTo: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}
