import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetPatientsQuery, useGetAppointmentsQuery, useGetUsersQuery } from '../api';
import { useTranslation } from 'react-i18next';
import { Search, User, Calendar, FileText, ChevronRight } from 'lucide-react';

type SearchResult = {
  id: string;
  type: 'patient' | 'appointment' | 'user';
  title: string;
  subtitle: string;
  path: string;
};

export default function QuickSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { data: patients } = useGetPatientsQuery(query.length >= 2 ? query : '', { skip: query.length < 2 });
  const { data: appointments } = useGetAppointmentsQuery(
    { filter: 'upcoming' },
    { skip: query.length < 2 }
  );
  const { data: users } = useGetUsersQuery(undefined, { skip: query.length < 2 });

  const results = useMemo<SearchResult[]>(() => {
    if (query.length < 2) return [];

    const items: SearchResult[] = [];

    patients?.slice(0, 5).forEach((p: any) => {
      items.push({
        id: p.id,
        type: 'patient',
        title: `${p.firstName} ${p.lastName}`,
        subtitle: p.phone || p.email || t('other.noContactInfo'),
        path: `/patients/${p.id}`,
      });
    });

    appointments?.slice(0, 3).forEach((a: any) => {
      items.push({
        id: a.id,
        type: 'appointment',
        title: `${a.patient?.firstName} ${a.patient?.lastName}`,
        subtitle: `${new Date(a.dateTime).toLocaleDateString()} - ${a.doctor?.firstName} ${a.doctor?.lastName}`,
        path: '/appointments',
      });
    });

    users?.slice(0, 3).forEach((u: any) => {
      items.push({
        id: u.id,
        type: 'user',
        title: `${u.firstName} ${u.lastName}`,
        subtitle: u.role,
        path: '/users',
      });
    });

    return items;
  }, [patients, appointments, users, query, t]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setQuery('');
        setSelectedIndex(0);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    navigate(result.path);
    setIsOpen(false);
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'patient':
        return <User className="w-4 h-4" />;
      case 'appointment':
        return <Calendar className="w-4 h-4" />;
      case 'user':
        return <FileText className="w-4 h-4" />;
      default:
        return <Search className="w-4 h-4" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
      <div className="relative w-full max-w-xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('other.quickSearchPlaceholder')}
            className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 outline-none text-base"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-700 rounded-md">
            ESC
          </kbd>
        </div>

        {results.length > 0 && (
          <div className="max-h-[400px] overflow-y-auto py-2">
            {results.map((result, index) => (
              <button
                key={`${result.type}-${result.id}`}
                onClick={() => handleSelect(result)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                  index === selectedIndex
                    ? 'bg-blue-50 dark:bg-blue-900/30'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  result.type === 'patient' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' :
                  result.type === 'appointment' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                  'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                }`}>
                  {getIcon(result.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{result.title}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{result.subtitle}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            ))}
          </div>
        )}

        {query.length >= 2 && results.length === 0 && (
          <div className="px-4 py-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">{t('other.noResultsFound')}</p>
          </div>
        )}

        {query.length < 2 && (
          <div className="px-4 py-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('other.typeAtLeast2Chars')}</p>
          </div>
        )}

        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">↓</kbd>
                <span>{t('other.navigate')}</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">↵</kbd>
                <span>{t('other.select')}</span>
              </span>
            </div>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">⌘K</kbd>
              <span>{t('other.toOpen')}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
