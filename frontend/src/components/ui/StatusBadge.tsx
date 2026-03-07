interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

const statusColors: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  CONFIRMED: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  CHECKED_IN: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  IN_PROGRESS: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
  COMPLETED: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  CANCELLED: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  NO_SHOW: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
  PAID: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  UNPAID: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  PENDING: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  APPROVED: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  DENIED: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  SUBMITTED: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  ACTIVE: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  CHRONIC: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
  RESOLVED: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const colorClass = statusColors[status] || 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
  const label = status.replace(/_/g, ' ');
  return (
    <span className={`${sizeClasses[size]} ${colorClass} rounded-full font-medium whitespace-nowrap`}>
      {label}
    </span>
  );
}
