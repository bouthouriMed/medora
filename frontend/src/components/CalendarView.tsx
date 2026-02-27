function CalendarView({ appointments, currentMonth, onMonthChange, onDateClick }: {
  appointments: any[];
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  onDateClick: (date: string) => void;
}) {
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days: (number | null)[] = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  };

  const getAppointmentsForDay = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    return appointments.filter((apt: any) => {
      const aptDate = new Date(apt.dateTime).toISOString().split('T')[0];
      return aptDate === dateStr;
    });
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const days = getDaysInMonth(currentMonth);
  const today = new Date().toISOString().split('T')[0];

  const prevMonth = () => {
    onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <button onClick={prevMonth} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">
          ← Prev
        </button>
        <h2 className="text-lg font-bold">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h2>
        <button onClick={nextMonth} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">
          Next →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}

        {days.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="h-24" />;
          }

          const year = currentMonth.getFullYear();
          const month = currentMonth.getMonth();
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayAppointments = getAppointmentsForDay(day);
          const isToday = dateStr === today;

          return (
            <div
              key={day}
              onClick={() => onDateClick(dateStr)}
              className={`h-24 border rounded p-1 cursor-pointer hover:bg-gray-50 overflow-hidden ${isToday ? 'bg-blue-50 border-blue-300' : ''}`}
            >
              <div className={`text-sm font-medium ${isToday ? 'text-blue-600' : ''}`}>{day}</div>
              <div className="space-y-1 mt-1">
                {dayAppointments.slice(0, 3).map((apt: any) => (
                  <div
                    key={apt.id}
                    className={`text-xs truncate px-1 py-0.5 rounded ${
                      apt.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      apt.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                      apt.status === 'NO_SHOW' ? 'bg-gray-100 text-gray-800' :
                      'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {new Date(apt.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} {apt.patient?.firstName?.[0]}.
                  </div>
                ))}
                {dayAppointments.length > 3 && (
                  <div className="text-xs text-gray-500">+{dayAppointments.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CalendarView;
