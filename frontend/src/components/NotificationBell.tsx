import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetNotificationsQuery, useGetNotificationUnreadCountQuery, useMarkNotificationReadMutation, useMarkAllNotificationsReadMutation } from '../api';
import { useTranslation } from 'react-i18next';
import { Icons } from '../components/Icons';

// Per-type visual config (matches the full page)
const TYPE_CONFIG: Record<string, { icon: keyof typeof Icons; iconBg: string }> = {
  APPOINTMENT_REQUEST:   { icon: 'calendarPlus',  iconBg: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
  APPOINTMENT_APPROVED:  { icon: 'calendarCheck', iconBg: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' },
  APPOINTMENT_REJECTED:  { icon: 'calendarX',     iconBg: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' },
  APPOINTMENT_CANCELLED: { icon: 'calendarX',     iconBg: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400' },
  APPOINTMENT_REMINDER:  { icon: 'clock',         iconBg: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' },
  MESSAGE:               { icon: 'mail',          iconBg: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' },
  LAB_RESULT:            { icon: 'flask',         iconBg: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400' },
  PRESCRIPTION_REQUEST:  { icon: 'pill',          iconBg: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400' },
  PRESCRIPTION_READY:    { icon: 'syringe',       iconBg: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' },
  SYSTEM_ALERT:          { icon: 'alert',         iconBg: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' },
  WAITLIST:              { icon: 'list',           iconBg: 'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400' },
  INVOICE:               { icon: 'invoice',       iconBg: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' },
  RATING:                { icon: 'star',          iconBg: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' },
};

const PRIORITY_BAR: Record<string, string> = {
  LOW: 'bg-gray-300 dark:bg-gray-600',
  NORMAL: 'bg-blue-500',
  HIGH: 'bg-orange-500',
  URGENT: 'bg-red-500 animate-pulse',
};

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { data: unreadData } = useGetNotificationUnreadCountQuery(undefined, { pollingInterval: 5000 });
  const { data: notificationsData } = useGetNotificationsQuery({ limit: 8 }, { skip: !isOpen, pollingInterval: isOpen ? 5000 : 0 });
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead] = useMarkAllNotificationsReadMutation();

  const unreadCount = unreadData?.unreadCount || 0;
  const notifications = notificationsData?.notifications || [];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification: any) => {
    if (!notification.isRead) await markRead(notification.id);
    if (notification.actionUrl) navigate(notification.actionUrl);
    setIsOpen(false);
  };

  const handleMarkAllRead = async () => {
    await markAllRead(undefined);
  };

  const getConfig = (type: string) =>
    TYPE_CONFIG[type] || { icon: 'bell' as const, iconBg: 'bg-gray-100 dark:bg-gray-800 text-gray-500' };

  const IconComponent = ({ name, ...props }: { name: keyof typeof Icons; size?: number; className?: string }) => {
    const icon = Icons[name];
    return icon ? icon(props) : null;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl transition-all ${
          isOpen
            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
      >
        <Icons.bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-900">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-[420px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 dark:text-white text-base">
                  {t('notifications.title')}
                </h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  {t('notifications.markAllRead')}
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[420px] overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center mb-3">
                    <Icons.bell className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {t('notifications.noNotifications')}
                  </p>
                </div>
              ) : (
                notifications.map((notification: any) => {
                  const config = getConfig(notification.type);
                  return (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`relative flex items-start gap-3 px-5 py-3.5 border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition-colors ${
                        !notification.isRead ? 'bg-blue-50/30 dark:bg-blue-900/5' : ''
                      }`}
                    >
                      {/* Priority bar */}
                      <div className={`absolute left-0 top-3 bottom-3 w-0.5 rounded-full ${PRIORITY_BAR[notification.priority] || PRIORITY_BAR.NORMAL}`} />

                      {/* Icon */}
                      <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${config.iconBg}`}>
                        <IconComponent name={config.icon} size={16} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-sm font-semibold truncate ${
                            notification.isRead ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'
                          }`}>
                            {notification.title}
                          </p>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {!notification.isRead && (
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            )}
                            <span className="text-[11px] text-gray-400 dark:text-gray-500">
                              {formatTime(notification.createdAt)}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5 leading-relaxed">
                          {notification.message}
                        </p>
                        {notification.actionLabel && (
                          <span className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                            {notification.actionLabel}
                            <IconComponent name="arrowRight" size={10} />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                <button
                  onClick={() => { navigate('/notifications'); setIsOpen(false); }}
                  className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors py-1"
                >
                  {t('notifications.viewAll')}
                  <IconComponent name="arrowRight" size={14} />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
