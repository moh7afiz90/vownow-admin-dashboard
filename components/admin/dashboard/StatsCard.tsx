import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
}

export default function StatsCard({ title, value, icon: Icon, trend, trendUp }: StatsCardProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {trend && (
            <p className={`text-sm mt-2 ${trendUp ? 'text-green-400' : 'text-gray-400'}`}>
              {trend} from last month
            </p>
          )}
        </div>
        <div className="p-3 bg-gray-700 rounded-lg">
          <Icon className="h-6 w-6 text-indigo-400" />
        </div>
      </div>
    </div>
  );
}