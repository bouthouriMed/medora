interface AppointmentsFiltersProps {
  selectedDate: string;
  startDate?: string;
  endDate?: string;
  onDateChange: (field: 'startDate' | 'endDate', value: string) => void;
  onFilterChange: (filter: string | null) => void;
  currentFilter: string | null;
  viewMode: 'list' | 'calendar';
  onViewModeChange: (mode: 'list' | 'calendar') => void;
  t: (key: string) => string;
}

export default function AppointmentsFilters({
  selectedDate,
  startDate,
  endDate,
  onDateChange,
  onFilterChange,
  currentFilter,
  viewMode,
  onViewModeChange,
  t,
}: AppointmentsFiltersProps) {
  const today = new Date().toISOString().split('T')[0];
  
  const isTodayActive = currentFilter === 'today';
  const isUpcomingActive = currentFilter === 'upcoming';
  const isAllActive = !currentFilter || currentFilter === 'all';

  const displayStartDate = isTodayActive || isUpcomingActive ? today : (startDate || '');
  const displayEndDate = isTodayActive ? today : (endDate || '');

  return (
    <div className="flex flex-wrap gap-3 sm:gap-4 items-center">
      <div className="flex gap-2 items-center flex-1 min-w-[280px]">
        <input
          type="date"
          value={displayStartDate}
          onChange={(e) => onDateChange('startDate', e.target.value)}
          className="flex-1 min-w-[130px] px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
        <span className="text-gray-400">→</span>
        <input
          type="date"
          value={displayEndDate}
          onChange={(e) => onDateChange('endDate', e.target.value)}
          className="flex-1 min-w-[130px] px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
      </div>
      <div className="flex gap-2">
        <FilterButton
          active={isTodayActive}
          onClick={() => onFilterChange(isTodayActive ? null : 'today')}
        >
          {t('appointments.today')}
        </FilterButton>
        <FilterButton
          active={isUpcomingActive}
          onClick={() => onFilterChange(isUpcomingActive ? null : 'upcoming')}
        >
          {t('appointments.upcoming')}
        </FilterButton>
        <FilterButton
          active={isAllActive}
          onClick={() => onFilterChange(null)}
        >
          {t('appointments.showAll')}
        </FilterButton>
      </div>
      <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm ml-auto">
        <ViewToggleButton
          active={viewMode === 'list'}
          onClick={() => onViewModeChange('list')}
          label={t('other.list')}
          icon="📋"
        />
        <ViewToggleButton
          active={viewMode === 'calendar'}
          onClick={() => onViewModeChange('calendar')}
          label={t('other.calendar')}
          icon="📅"
        />
      </div>
    </div>
  );
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl font-medium transition-colors ${
        active 
          ? 'bg-blue-600 text-white' 
          : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
      }`}
    >
      {children}
    </button>
  );
}

function ViewToggleButton({ active, onClick, label, icon }: { active: boolean; onClick: () => void; label: string; icon: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 font-medium transition-all ${
        active 
          ? 'bg-blue-600 text-white' 
          : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
      }`}
    >
      <span className="sm:hidden">{icon}</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
