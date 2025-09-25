'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface Activity {
  id: string;
  user: string;
  action: string;
  timestamp: string;
  details: string;
}

export default function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentActivity();
  }, []);

  const fetchRecentActivity = async () => {
    try {
      const response = await fetch('/api/admin/analytics/activity');
      if (response.ok) {
        const data = await response.json();
        setActivities(data);
      }
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (action: string) => {
    if (action.toLowerCase().includes('signup') || action.toLowerCase().includes('created')) {
      return 'bg-green-500';
    } else if (action.toLowerCase().includes('questionnaire')) {
      return 'bg-blue-500';
    } else if (action.toLowerCase().includes('email') || action.toLowerCase().includes('waitlist')) {
      return 'bg-purple-500';
    } else {
      return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
        <button className="text-sm text-indigo-400 hover:text-indigo-300">View all</button>
      </div>
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
        </div>
      ) : activities.length === 0 ? (
        <p className="text-gray-400 text-center py-8">No recent activity</p>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-700/50 transition-colors">
              <div className={`h-2 w-2 rounded-full mt-2 ${getTypeColor(activity.action)}`} />
              <div className="flex-1">
                <p className="text-white text-sm font-medium">{activity.user}</p>
                <p className="text-gray-400 text-sm">{activity.action}</p>
                {activity.details && (
                  <p className="text-gray-500 text-xs mt-1">{activity.details}</p>
                )}
              </div>
              <div className="flex items-center text-gray-500 text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {activity.timestamp}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}