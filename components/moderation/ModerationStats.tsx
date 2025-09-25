'use client';

import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  FlagIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

interface ModerationStatsProps {
  stats: {
    pending: number;
    approved: number;
    rejected: number;
    flagged: number;
    todayReviewed: number;
    avgReviewTime: string;
  };
}

export default function ModerationStats({ stats }: ModerationStatsProps) {
  const statItems = [
    {
      name: 'Pending Review',
      value: stats.pending,
      icon: ClockIcon,
      color: 'text-yellow-600 bg-yellow-100',
      darkColor: 'dark:text-yellow-400 dark:bg-yellow-900/20',
    },
    {
      name: 'Approved',
      value: stats.approved,
      icon: CheckCircleIcon,
      color: 'text-green-600 bg-green-100',
      darkColor: 'dark:text-green-400 dark:bg-green-900/20',
    },
    {
      name: 'Rejected',
      value: stats.rejected,
      icon: XCircleIcon,
      color: 'text-red-600 bg-red-100',
      darkColor: 'dark:text-red-400 dark:bg-red-900/20',
    },
    {
      name: 'Flagged',
      value: stats.flagged,
      icon: FlagIcon,
      color: 'text-orange-600 bg-orange-100',
      darkColor: 'dark:text-orange-400 dark:bg-orange-900/20',
    },
    {
      name: 'Today Reviewed',
      value: stats.todayReviewed,
      icon: ChartBarIcon,
      color: 'text-indigo-600 bg-indigo-100',
      darkColor: 'dark:text-indigo-400 dark:bg-indigo-900/20',
    },
    {
      name: 'Avg Review Time',
      value: stats.avgReviewTime,
      icon: ClockIcon,
      color: 'text-purple-600 bg-purple-100',
      darkColor: 'dark:text-purple-400 dark:bg-purple-900/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {statItems.map((item) => (
        <div
          key={item.name}
          className="relative bg-white dark:bg-gray-800 pt-5 px-4 pb-4 overflow-hidden rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <dt>
            <div className={`absolute rounded-md p-3 ${item.color} ${item.darkColor}`}>
              <item.icon className="h-6 w-6" aria-hidden="true" />
            </div>
            <p className="ml-16 text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
              {item.name}
            </p>
          </dt>
          <dd className="ml-16 flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">
              {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
            </p>
          </dd>
        </div>
      ))}
    </div>
  );
}