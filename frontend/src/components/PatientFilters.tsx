import type { Tag } from '../types';

interface PatientFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  showArchived: boolean;
  onArchivedToggle: () => void;
  showFilters: boolean;
  onFiltersToggle: () => void;
  filters: {
    tag: string;
    dateFrom: string;
    dateTo: string;
  };
  onFiltersChange: (filters: { tag: string; dateFrom: string; dateTo: string }) => void;
  allTags: Tag[];
  t: (key: string) => string;
}

export default function PatientFilters({
  search,
  onSearchChange,
  showArchived,
  onArchivedToggle,
  showFilters,
  onFiltersToggle,
  filters,
  onFiltersChange,
  allTags,
  t,
}: PatientFiltersProps) {
  return (
    <>
      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder={t('patients.searchPlaceholder')}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-4 py-3 pl-12 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 shadow-sm transition-all text-gray-900 dark:text-white placeholder-gray-400"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        </div>
        <button
          onClick={onArchivedToggle}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl border font-medium text-sm transition-all whitespace-nowrap ${
            showArchived
              ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
          {showArchived ? 'Showing Archived' : 'Show Archived'}
        </button>
        <button
          onClick={onFiltersToggle}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl border font-medium text-sm transition-all whitespace-nowrap ${
            showFilters
              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          {t('common.filter')}
        </button>
      </div>

      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 p-4">
          <button
            onClick={onFiltersToggle}
            className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium hover:text-gray-900 dark:text-white transition-colors"
          >
            <svg className={`w-5 h-5 transition-transform ${showFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {t('common.filter')}
            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
              {[filters.tag, filters.dateFrom, filters.dateTo].filter(Boolean).length || t('common.all')}
            </span>
          </button>
          
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[150px]">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('other.tagName')}</label>
                <select
                  value={filters.tag}
                  onChange={(e) => onFiltersChange({ ...filters, tag: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">{t('common.all')} {t('other.tags')}</option>
                  {allTags?.map((tag: Tag) => (
                    <option key={tag.id} value={tag.id}>{tag.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('patients.registeredFrom')}</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('patients.registeredTo')}</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <button
                onClick={() => onFiltersChange({ tag: '', dateFrom: '', dateTo: '' })}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {t('common.clear')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
