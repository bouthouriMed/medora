import { useMemo, useRef, memo, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import { EventClickArg, EventDropArg } from '@fullcalendar/core';
import type { Appointment, RecurringAppointment } from '../types';

interface CalendarViewProps {
  appointments: Appointment[];
  recurringAppointments?: RecurringAppointment[];
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  onDateClick: (date: string) => void;
  onEventClick?: (appointment: Appointment) => void;
  onEventDrop?: (appointment: Appointment, newDate: Date) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'SCHEDULED':
      return { backgroundColor: '#3b82f6', borderColor: '#2563eb', textColor: '#ffffff' };
    case 'COMPLETED':
      return { backgroundColor: '#22c55e', borderColor: '#16a34a', textColor: '#ffffff' };
    case 'CANCELLED':
      return { backgroundColor: '#ef4444', borderColor: '#dc2626', textColor: '#ffffff' };
    case 'NO_SHOW':
      return { backgroundColor: '#6b7280', borderColor: '#4b5563', textColor: '#ffffff' };
    default:
      return { backgroundColor: '#3b82f6', borderColor: '#2563eb', textColor: '#ffffff' };
  }
};

function CalendarView({ 
  appointments, 
  recurringAppointments = [],
  currentMonth, 
  onMonthChange, 
  onDateClick,
  onEventClick,
  onEventDrop 
}: CalendarViewProps) {
  const calendarRef = useRef<FullCalendar>(null);

  const events = useMemo(() => {
    const aptEvents = appointments.map((apt) => {
      const colors = getStatusColor(apt.status);
      const start = new Date(apt.dateTime);
      const end = new Date(start.getTime() + 30 * 60 * 1000);
      
      return {
        id: apt.id,
        title: `${apt.patient?.firstName} ${apt.patient?.lastName || ''}`,
        start,
        end,
        backgroundColor: colors.backgroundColor,
        borderColor: colors.borderColor,
        textColor: colors.textColor,
        extendedProps: { appointment: apt },
        allDay: false,
      };
    });

    const recurringEvents: {
      id: string;
      title: string;
      start: Date;
      end: Date;
      backgroundColor: string;
      borderColor: string;
      textColor: string;
      extendedProps: { recurringAppointment: RecurringAppointment };
      allDay: boolean;
    }[] = [];
    const now = new Date();
    const sixMonthsLater = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);

    recurringAppointments.forEach((ra) => {
      let currentDate = new Date(ra.startDate);
      const endDate = ra.endDate ? new Date(ra.endDate) : sixMonthsLater;
      const maxDate = sixMonthsLater;
      
      let occurrenceCount = 0;
      const maxOccurrences = 52;

      while (currentDate <= endDate && currentDate <= maxDate && occurrenceCount < maxOccurrences) {
        if (currentDate >= now) {
          recurringEvents.push({
            id: `recurring-${ra.id}-${occurrenceCount}`,
            title: `🔄 ${ra.patient?.firstName} ${ra.patient?.lastName || ''}`,
            start: currentDate,
            end: new Date(currentDate.getTime() + 30 * 60 * 1000),
            backgroundColor: '#8b5cf6',
            borderColor: '#7c3aed',
            textColor: '#ffffff',
            extendedProps: { recurringAppointment: ra },
            allDay: false,
          });
        }
        
        occurrenceCount++;
        switch (ra.frequency) {
          case 'DAILY':
            currentDate = new Date(currentDate.getTime() + ra.interval * 24 * 60 * 60 * 1000);
            break;
          case 'WEEKLY':
            currentDate = new Date(currentDate.getTime() + ra.interval * 7 * 24 * 60 * 60 * 1000);
            break;
          case 'MONTHLY':
            currentDate = new Date(currentDate);
            currentDate.setMonth(currentDate.getMonth() + ra.interval);
            break;
        }
      }
    });

    return [...aptEvents, ...recurringEvents];
  }, [appointments, recurringAppointments]);

  const handleDatesSet = (dateInfo: { view: { type: string; currentStart: Date } }) => {
    const currentDate = dateInfo.view.currentStart;
    if (currentDate.getMonth() !== currentMonth.getMonth() || 
        currentDate.getFullYear() !== currentMonth.getFullYear()) {
      onMonthChange(currentDate);
    }
  };

  const handleDateClick = (info: DateClickArg) => {
    onDateClick(info.dateStr);
  };

  const handleEventClick = (info: EventClickArg) => {
    if (onEventClick) {
      const apt = info.event.extendedProps.appointment as Appointment;
      onEventClick(apt);
    }
  };

  const handleEventDrop = (info: EventDropArg) => {
    if (onEventDrop) {
      const apt = info.event.extendedProps.appointment as Appointment;
      onEventDrop(apt, info.event.start!);
    }
  };

  useEffect(() => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi && currentMonth) {
      const calendarDate = calendarApi.getDate();
      if (calendarDate.getMonth() !== currentMonth.getMonth() || 
          calendarDate.getFullYear() !== currentMonth.getFullYear()) {
        calendarApi.gotoDate(currentMonth);
      }
    }
  }, [currentMonth]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-4 sm:p-6">
      <style>{`
        .fc {
          font-family: inherit;
        }
        .dark .fc {
          --fc-border-color: #4b5563;
          --fc-button-text-color: #ffffff;
          --fc-button-bg-color: #374151;
          --fc-button-border-color: #4b5563;
          --fc-button-hover-bg-color: #4b5563;
          --fc-button-hover-border-color: #6b7280;
          --fc-button-active-bg-color: #3b82f6;
          --fc-button-active-border-color: #3b82f6;
          --fc-event-bg-color: #3b82f6;
          --fc-event-border-color: #3b82f6;
          --fc-today-bg-color: rgba(59, 130, 246, 0.1);
          --fc-page-bg-color: #1f2937;
          --fc-neutral-bg-color: #374151;
          --fc-list-event-hover-bg-color: #374151;
        }
        .dark .fc .fc-toolbar-title {
          color: #f9fafb !important;
        }
        .dark .fc .fc-col-header-cell-cushion {
          color: #e5e7eb !important;
        }
        .dark .fc .fc-daygrid-day-number {
          color: #e5e7eb !important;
        }
        .dark .fc .fc-daygrid-day.fc-day-today .fc-daygrid-day-number {
          color: #3b82f6 !important;
        }
        .dark .fc .fc-timegrid-axis-cushion {
          color: #9ca3af !important;
        }
        .dark .fc .fc-scrollgrid {
          border-color: #374151 !important;
        }
        .dark .fc .fc-scrollgrid td,
        .dark .fc .fc-scrollgrid th {
          border-color: #374151 !important;
        }
        .dark .fc-theme-standard td,
        .dark .fc-theme-standard th {
          border-color: #374151 !important;
        }
        .dark .fc .fc-daygrid-day {
          background-color: #1f2937 !important;
        }
        .dark .fc .fc-daygrid-day:hover {
          background-color: #374151 !important;
        }
        .dark .fc .fc-daygrid-day.fc-day-today {
          background-color: rgba(59, 130, 246, 0.15) !important;
        }
        .dark .fc .fc-day-other {
          background-color: #111827 !important;
        }
        .dark .fc .fc-day-other .fc-daygrid-day-number {
          color: #6b7280 !important;
        }
        .dark .fc .fc-popover {
          background-color: #1f2937 !important;
          border-color: #374151 !important;
        }
        .dark .fc .fc-popover-header {
          color: #f9fafb !important;
        }
        .dark .fc .fc-more-popover .fc-popover-body {
          background-color: #1f2937 !important;
        }
        .dark .fc .fc-v-event {
          background-color: #3b82f6 !important;
          border-color: #2563eb !important;
        }
        .dark .fc .fc-timegrid-event .fc-time {
          color: #ffffff !important;
        }
        .dark .fc .fc-timegrid-event .fc-title {
          color: #ffffff !important;
        }
        .dark .fc .fc-list-event:hover td {
          background-color: #374151 !important;
        }
        .dark .fc .fc-list-day-cushion {
          color: #f9fafb !important;
          background-color: #374151 !important;
        }
        .dark .fc .fc-event-title,
        .dark .fc .fc-event-time {
          color: #ffffff !important;
        }
      `}</style>
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        events={events}
        editable={true}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={3}
        weekends={true}
        nowIndicator={true}
        slotMinTime="07:00:00"
        slotMaxTime="20:00:00"
        allDaySlot={false}
        slotDuration="00:30:00"
        height="auto"
        datesSet={handleDatesSet}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        eventDrop={handleEventDrop}
        eventTimeFormat={{
          hour: '2-digit',
          minute: '2-digit',
          meridiem: 'short'
        }}
        buttonText={{
          today: 'Today',
          month: 'Month',
          week: 'Week',
          day: 'Day'
        }}
        dayHeaderFormat={{
          weekday: 'short',
          month: 'numeric',
          day: 'numeric'
        }}
        weekNumberFormat={{
          week: 'short'
        }}
        moreLinkClick="popover"
      />
    </div>
  );
}

export default memo(CalendarView);
