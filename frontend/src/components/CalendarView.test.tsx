import { render, screen } from '@testing-library/react';
import CalendarView from '../components/CalendarView';

const mockAppointments = [
  {
    id: '1',
    dateTime: '2026-02-15T10:00:00Z',
    status: 'SCHEDULED',
    patient: { firstName: 'John', lastName: 'Doe' },
    doctor: { firstName: 'Dr', lastName: 'Smith' },
  },
  {
    id: '2',
    dateTime: '2026-02-15T14:00:00Z',
    status: 'COMPLETED',
    patient: { firstName: 'Jane', lastName: 'Smith' },
    doctor: { firstName: 'Dr', lastName: 'Smith' },
  },
  {
    id: '3',
    dateTime: '2026-02-20T09:00:00Z',
    status: 'CANCELLED',
    patient: { firstName: 'Bob', lastName: 'Wilson' },
    doctor: { firstName: 'Dr', lastName: 'Smith' },
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
