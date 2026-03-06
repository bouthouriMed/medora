import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useGetNotificationsQuery,
  useGetNotificationUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteNotificationMutation,
} from '../api';
import { useTranslation } from 'react-i18next';
import { Icons } from '../components/Icons';

// ---------------------------------------------------------------------------
// Type-safe category system — every notification type maps to one category
// ---------------------------------------------------------------------------
type NotificationType =
  | 'APPOINTMENT_REQUEST' | 'APPOINTMENT_APPROVED' | 'APPOINTMENT_REJECTED'
  | 'APPOINTMENT_CANCELLED' | 'APPOINTMENT_REMINDER'
  | 'MESSAGE'
  | 'LAB_RESULT'
  | 'PRESCRIPTION_REQUEST' | 'PRESCRIPTION_READY'
  | 'SYSTEM_ALERT'
  | 'WAITLIST'
  | 'INVOICE'
  | 'RATING';

type Category = 'all' | 'clinical' | 'communication' | 'billing' | 'system';

const CATEGORY_MAP: Record<NotificationType, Category> = {
  APPOINTMENT_REQUEST: 'clinical',
  APPOINTMENT_APPROVED: 'clinical',
  APPOINTMENT_REJECTED: 'clinical',
  APPOINTMENT_CANCELLED: 'clinical',
  APPOINTMENT_REMINDER: 'clinical',
  WAITLIST: 'clinical',
  LAB_RESULT: 'clinical',
  PRESCRIPTION_REQUEST: 'clinical',
  PRESCRIPTION_READY: 'clinical',
  MESSAGE: 'communication',
  RATING: 'communication',
  INVOICE: 'billing',
  SYSTEM_ALERT: 'system',
};

const CATEGORY_META: Record<Category, { label: string; icon: keyof typeof Icons; color: string; bg: string; ring: string }> = {
  all:           { label: 'All',           icon: 'bell',        color: 'text-gray-600 dark:text-gray-300',   bg: 'bg-gray-100 dark:bg-gray-800',           ring: 'ring-gray-200 dark:ring-gray-700' },
  clinical:      { label: 'Clinical',      icon: 'activity',    color: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-50 dark:bg-blue-900/20',         ring: 'ring-blue-200 dark:ring-blue-800' },
  communication: { label: 'Communication', icon: 'mail',        color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20',   ring: 'ring-purple-200 dark:ring-purple-800' },
  billing:       { label: 'Billing',       icon: 'dollar',      color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', ring: 'ring-emerald-200 dark:ring-emerald-800' },
  system:        { label: 'System',        icon: 'shield',      color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20',   ring: 'ring-orange-200 dark:ring-orange-800' },
};

// ---------------------------------------------------------------------------
// Visual config per notification type
// ---------------------------------------------------------------------------
interface TypeConfig {
  icon: keyof typeof Icons;
  gradient: string;
  iconBg: string;
}

const TYPE_CONFIG: Record<string, TypeConfig> = {
  APPOINTMENT_REQUEST:   { icon: 'calendarPlus',  gradient: 'from-blue-500 to-cyan-500',      iconBg: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
  APPOINTMENT_APPROVED:  { icon: 'calendarCheck', gradient: 'from-green-500 to-emerald-500',  iconBg: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' },
  APPOINTMENT_REJECTED:  { icon: 'calendarX',     gradient: 'from-red-500 to-rose-500',       iconBg: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' },
  APPOINTMENT_CANCELLED: { icon: 'calendarX',     gradient: 'from-gray-500 to-slate-500',     iconBg: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400' },
  APPOINTMENT_REMINDER:  { icon: 'clock',         gradient: 'from-amber-500 to-orange-500',   iconBg: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' },
  MESSAGE:               { icon: 'mail',          gradient: 'from-purple-500 to-violet-500',  iconBg: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' },
  LAB_RESULT:            { icon: 'flask',         gradient: 'from-teal-500 to-cyan-500',      iconBg: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400' },
  PRESCRIPTION_REQUEST:  { icon: 'pill',          gradient: 'from-pink-500 to-rose-500',      iconBg: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400' },
  PRESCRIPTION_READY:    { icon: 'syringe',       gradient: 'from-indigo-500 to-blue-500',    iconBg: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' },
  SYSTEM_ALERT:          { icon: 'alert',         gradient: 'from-orange-500 to-red-500',     iconBg: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' },
  WAITLIST:              { icon: 'list',           gradient: 'from-sky-500 to-blue-500',       iconBg: 'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400' },
  INVOICE:               { icon: 'invoice',       gradient: 'from-emerald-500 to-green-500',  iconBg: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' },
  RATING:                { icon: 'star',          gradient: 'from-yellow-500 to-amber-500',   iconBg: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' },
};

const PRIORITY_INDICATOR: Record<string, string> = {
  LOW: 'bg-gray-300 dark:bg-gray-600',
  NORMAL: 'bg-blue-500',
  HIGH: 'bg-orange-500',
  URGENT: 'bg-red-500 animate-pulse',
};

// ---------------------------------------------------------------------------
// Time grouping helpers
// ---------------------------------------------------------------------------
function getTimeGroup(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / 3600000);
    if (diffHours === 0) return 'Just now';
    return 'Today';
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return 'This week';
  if (diffDays < 30) return 'This month';
  return 'Older';
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// ---------------------------------------------------------------------------
// Notification interface
// ---------------------------------------------------------------------------
interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: string;
  isRead: boolean;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  readAt?: string;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function Notifications() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [filterMode, setFilterMode] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const limit = 30;

  const { data, isLoading, isFetching } = useGetNotificationsQuery({
    page,
    limit,
    ...(filterMode === 'unread' ? { unreadOnly: 'true' } : {}),
    ...(activeCategory !== 'all' ? {} : {}), // category filtering done client-side
  });

  const { data: unreadData } = useGetNotificationUnreadCountQuery(undefined, { pollingInterval: 30000 });
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead] = useMarkAllNotificationsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();

  const notifications: Notification[] = data?.notifications || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;
  const unreadCount = unreadData?.unreadCount || 0;

  // ---------------------------------------------------------------------------
  // Client-side category + read filter
  // ---------------------------------------------------------------------------
  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      if (activeCategory !== 'all' && CATEGORY_MAP[n.type] !== activeCategory) return false;
      if (filterMode === 'read' && !n.isRead) return false;
      return true;
    });
  }, [notifications, activeCategory, filterMode]);

  // Category counts (from current page data)
  const categoryCounts = useMemo(() => {
    const counts: Record<Category, number> = { all: 0, clinical: 0, communication: 0, billing: 0, system: 0 };
    notifications.forEach((n) => {
      counts.all++;
      const cat = CATEGORY_MAP[n.type];
      if (cat) counts[cat]++;
    });
    return counts;
  }, [notifications]);

  // Group by time
  const grouped = useMemo(() => {
    const groups: { label: string; items: Notification[] }[] = [];
    const groupMap = new Map<string, Notification[]>();
    const order = ['Just now', 'Today', 'Yesterday', 'This week', 'This month', 'Older'];

    filtered.forEach((n) => {
      const group = getTimeGroup(n.createdAt);
      if (!groupMap.has(group)) groupMap.set(group, []);
      groupMap.get(group)!.push(n);
    });

    order.forEach((label) => {
      const items = groupMap.get(label);
      if (items?.length) groups.push({ label, items });
    });

    return groups;
  }, [filtered]);

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------
  const handleClick = async (n: Notification) => {
    if (!n.isRead) await markRead(n.id);
    if (n.actionUrl) navigate(n.actionUrl);
  };

  const handleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((n) => n.id)));
    }
  };

  const handleBulkMarkRead = async () => {
    await Promise.all(Array.from(selectedIds).map((id) => markRead(id)));
    setSelectedIds(new Set());
  };

  const handleBulkDelete = async () => {
    await Promise.all(Array.from(selectedIds).map((id) => deleteNotification(id)));
    setSelectedIds(new Set());
  };

  const handleMarkAllRead = async () => {
    await markAllRead(undefined);
  };

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------
  const getConfig = (type: string): TypeConfig =>
    TYPE_CONFIG[type] || { icon: 'bell', gradient: 'from-gray-500 to-gray-600', iconBg: 'bg-gray-100 dark:bg-gray-800 text-gray-500' };

  const IconComponent = ({ name, ...props }: { name: keyof typeof Icons; size?: number; className?: string }) => {
    const icon = Icons[name];
    return icon ? icon(props) : null;
  };

  // ---------------------------------------------------------------------------
  // JSX
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {t('notifications.title')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {unreadCount > 0
              ? t('notifications.unreadSummary', { count: unreadCount })
              : t('notifications.allCaughtUp')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <IconComponent name="check" size={16} />
              {t('notifications.markAllRead')}
            </button>
          )}
          <button
            onClick={() => setPage(1)}
            className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Refresh"
          >
            <IconComponent name="refresh" size={18} className={isFetching ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ─── Stats Cards ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {(Object.keys(CATEGORY_META) as Category[]).map((cat) => {
          const meta = CATEGORY_META[cat];
          const isActive = activeCategory === cat;
          const count = cat === 'all' ? total : categoryCounts[cat];

          return (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setPage(1); setSelectedIds(new Set()); }}
              className={`relative flex flex-col items-center gap-1.5 p-4 rounded-2xl border transition-all duration-200 ${
                isActive
                  ? `${meta.bg} border-transparent ring-2 ${meta.ring} shadow-sm`
                  : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-sm'
              }`}
            >
              <div className={`p-2 rounded-xl ${isActive ? meta.bg : 'bg-gray-50 dark:bg-gray-700/50'}`}>
                <IconComponent name={meta.icon} size={18} className={isActive ? meta.color : 'text-gray-400 dark:text-gray-500'} />
              </div>
              <span className={`text-xs font-medium ${isActive ? meta.color : 'text-gray-500 dark:text-gray-400'}`}>
                {meta.label}
              </span>
              <span className={`text-lg font-bold ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ─── Toolbar ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-gray-800 px-4 py-3 rounded-2xl border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3">
          {/* Select all checkbox */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filtered.length > 0 && selectedIds.size === filtered.length}
              onChange={handleSelectAll}
              className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {selectedIds.size > 0
                ? `${selectedIds.size} selected`
                : t('common.all')}
            </span>
          </label>

          {/* Bulk actions */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-1 pl-3 border-l border-gray-200 dark:border-gray-700">
              <button
                onClick={handleBulkMarkRead}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
              >
                <IconComponent name="eye" size={14} />
                Mark read
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              >
                <IconComponent name="trash" size={14} />
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Read/Unread filter pills */}
        <div className="flex items-center bg-gray-100 dark:bg-gray-700/50 rounded-xl p-1">
          {(['all', 'unread', 'read'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => { setFilterMode(mode); setPage(1); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                filterMode === mode
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {mode === 'all' ? 'All' : mode === 'unread' ? `Unread (${unreadCount})` : 'Read'}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Notification Feed ─── */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-start gap-4 p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
              <div className="w-11 h-11 rounded-xl skeleton flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 skeleton rounded-lg" />
                <div className="h-3 w-72 skeleton rounded-lg" />
              </div>
              <div className="h-3 w-12 skeleton rounded-lg" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center mb-4">
            <IconComponent name="bell" size={32} className="text-gray-300 dark:text-gray-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            {t('notifications.noNotifications')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            {filterMode === 'unread'
              ? t('notifications.allCaughtUp')
              : t('notifications.emptyDescription')}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.label}>
              {/* Time group header */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  {group.label}
                </span>
                <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
                <span className="text-xs text-gray-400 dark:text-gray-500">{group.items.length}</span>
              </div>

              {/* Notification cards */}
              <div className="space-y-2">
                {group.items.map((n) => {
                  const config = getConfig(n.type);
                  const isSelected = selectedIds.has(n.id);
                  const category = CATEGORY_MAP[n.type];
                  const catMeta = CATEGORY_META[category];

                  return (
                    <div
                      key={n.id}
                      className={`group relative flex items-start gap-4 p-4 rounded-2xl border transition-all duration-200 cursor-pointer hover:shadow-md ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800 ring-1 ring-blue-200 dark:ring-blue-800'
                          : n.isRead
                            ? 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'
                            : 'bg-gradient-to-r from-white to-blue-50/50 dark:from-gray-800 dark:to-blue-900/5 border-blue-100 dark:border-blue-900/30 hover:border-blue-200 dark:hover:border-blue-800'
                      }`}
                      onClick={() => handleClick(n)}
                    >
                      {/* Priority indicator bar */}
                      <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-full ${PRIORITY_INDICATOR[n.priority] || PRIORITY_INDICATOR.NORMAL}`} />

                      {/* Checkbox */}
                      <div className="flex-shrink-0 pl-2 pt-0.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelect(n.id)}
                          className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </div>

                      {/* Type icon */}
                      <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${config.iconBg}`}>
                        <IconComponent name={config.icon} size={20} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h4 className={`text-sm font-semibold truncate ${
                                n.isRead ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-white'
                              }`}>
                                {n.title}
                              </h4>
                              {!n.isRead && (
                                <span className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500" />
                              )}
                            </div>
                            <p className={`text-sm line-clamp-2 ${
                              n.isRead ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-300'
                            }`}>
                              {n.message}
                            </p>
                          </div>

                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                              {formatRelativeTime(n.createdAt)}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${catMeta.bg} ${catMeta.color}`}>
                              <IconComponent name={catMeta.icon} size={10} />
                              {catMeta.label}
                            </span>
                          </div>
                        </div>

                        {/* Action row */}
                        <div className="flex items-center gap-3 mt-2">
                          {n.actionLabel && n.actionUrl && (
                            <button
                              onClick={(e) => { e.stopPropagation(); navigate(n.actionUrl!); }}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r ${config.gradient} text-white shadow-sm hover:shadow-md transition-all hover:scale-[1.02]`}
                            >
                              {n.actionLabel}
                              <IconComponent name="arrowRight" size={12} />
                            </button>
                          )}

                          {n.priority === 'URGENT' && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                              <IconComponent name="alert" size={10} />
                              Urgent
                            </span>
                          )}
                          {n.priority === 'HIGH' && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                              High priority
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quick actions (visible on hover) */}
                      <div className="flex-shrink-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        {!n.isRead && (
                          <button
                            onClick={() => markRead(n.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                            title="Mark as read"
                          >
                            <IconComponent name="eye" size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(n.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Delete"
                        >
                          <IconComponent name="trash" size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Pagination ─── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 px-4 py-3 rounded-2xl border border-gray-100 dark:border-gray-700">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <IconComponent name="chevronLeft" size={16} />
            {t('common.previous')}
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pageNum = totalPages <= 5
                ? i + 1
                : page <= 3
                  ? i + 1
                  : page >= totalPages - 2
                    ? totalPages - 4 + i
                    : page - 2 + i;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-9 h-9 rounded-xl text-sm font-medium transition-all ${
                    page === pageNum
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t('common.next')}
            <IconComponent name="chevronRight" size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
