import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import CalendarView from '../components/CalendarView';

const mockAppointments = [
  {
    id: '1',
    patientId: 'p1',
    doctorId: 'd1',
    clinicId: 'c1',
    dateTime: '2026-02-15T10:00:00Z',
    status: 'SCHEDULED' as const,
    notes: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    patient: { firstName: 'John', lastName: 'Doe', email: null, phone: null, dateOfBirth: null, address: null, notes: null, id: 'p1', clinicId: 'c1', createdAt: '', updatedAt: '' },
    doctor: { firstName: 'Dr', lastName: 'Smith', email: '', role: 'DOCTOR' as const, id: 'd1', clinicId: 'c1', createdAt: '', updatedAt: '' },
  },
  {
    id: '2',
    patientId: 'p2',
    doctorId: 'd1',
    clinicId: 'c1',
    dateTime: '2026-02-15T14:00:00Z',
    status: 'COMPLETED' as const,
    notes: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    patient: { firstName: 'Jane', lastName: 'Smith', email: null, phone: null, dateOfBirth: null, address: null, notes: null, id: 'p2', clinicId: 'c1', createdAt: '', updatedAt: '' },
    doctor: { firstName: 'Dr', lastName: 'Smith', email: '', role: 'DOCTOR' as const, id: 'd1', clinicId: 'c1', createdAt: '', updatedAt: '' },
  },
  {
    id: '3',
    patientId: 'p3',
    doctorId: 'd1',
    clinicId: 'c1',
    dateTime: '2026-02-20T09:00:00Z',
    status: 'CANCELLED' as const,
    notes: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    patient: { firstName: 'Bob', lastName: 'Wilson', email: null, phone: null, dateOfBirth: null, address: null, notes: null, id: 'p3', clinicId: 'c1', createdAt: '', updatedAt: '' },
    doctor: { firstName: 'Dr', lastName: 'Smith', email: '', role: 'DOCTOR' as const, id: 'd1', clinicId: 'c1', createdAt: '', updatedAt: '' },
  },
];

describe('CalendarView Component', () => {
  const defaultProps = {
    appointments: mockAppointments,
    currentMonth: new Date('2026-02-15'),
    onMonthChange: () => {},
    onDateClick: () => {},
  };

  it('should render calendar with month and year', () => {
    render(<CalendarView {...defaultProps} />);
    expect(screen.getByText('February 2026')).toBeInTheDocument();
  });

  it('should render day headers', () => {
    render(<CalendarView {...defaultProps} />);
    expect(screen.getByText('Sun')).toBeInTheDocument();
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Sat')).toBeInTheDocument();
  });

  it('should render navigation buttons', () => {
    render(<CalendarView {...defaultProps} />);
    expect(screen.getByText('← Prev')).toBeInTheDocument();
    expect(screen.getByText('Next →')).toBeInTheDocument();
  });

  it('should display appointments on correct days', () => {
    render(<CalendarView {...defaultProps} />);
    expect(screen.getByText(/10:00/)).toBeInTheDocument();
  });

  it('should render with empty appointments array', () => {
    render(<CalendarView {...{ ...defaultProps, appointments: [] }} />);
    expect(screen.getByText('February 2026')).toBeInTheDocument();
  });
});
