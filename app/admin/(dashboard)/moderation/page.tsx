'use client';

import { useState, useEffect } from 'react';
import { Filter, Clock, CheckCircle, XCircle, AlertTriangle, Eye } from 'lucide-react';

interface ContentItem {
  id: string;
  type: 'questionnaire' | 'email' | 'feedback' | 'report';
  userId: string;
  userName: string;
  userEmail: string;
  content: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  priority: 'low' | 'medium' | 'high';
  reason?: string;
}

export default function ModerationPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('pending');

  useEffect(() => {
    fetchModerationItems();
  }, [filterType, filterStatus]);

  const fetchModerationItems = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      setTimeout(() => {
        setItems([
          {
            id: '1',
            type: 'questionnaire',
            userId: '1',
            userName: 'John Doe',
            userEmail: 'john@example.com',
            content: 'Sample questionnaire response that might contain inappropriate content...',
            submittedAt: new Date().toISOString(),
            status: 'pending',
            priority: 'medium',
          },
          {
            id: '2',
            type: 'feedback',
            userId: '2',
            userName: 'Jane Smith',
            userEmail: 'jane@example.com',
            content: 'User feedback about the platform experience...',
            submittedAt: new Date(Date.now() - 3600000).toISOString(),
            status: 'pending',
            priority: 'low',
          },
        ]);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error fetching moderation items:', error);
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    // TODO: API call to approve content
    setItems(items.map(item =>
      item.id === id ? { ...item, status: 'approved' as const } : item
    ));
  };

  const handleReject = async (id: string) => {
    // TODO: API call to reject content
    setItems(items.map(item =>
      item.id === id ? { ...item, status: 'rejected' as const } : item
    ));
  };

  const handleFlag = async (id: string) => {
    // TODO: API call to flag content
    setItems(items.map(item =>
      item.id === id ? { ...item, status: 'flagged' as const } : item
    ));
  };

  const getTypeColor = (type: ContentItem['type']) => {
    const colors = {
      questionnaire: 'bg-blue-500',
      email: 'bg-purple-500',
      feedback: 'bg-green-500',
      report: 'bg-red-500',
    };
    return colors[type];
  };

  const getPriorityColor = (priority: ContentItem['priority']) => {
    const colors = {
      low: 'text-gray-400',
      medium: 'text-yellow-400',
      high: 'text-red-400',
    };
    return colors[priority];
  };

  const getStatusIcon = (status: ContentItem['status']) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-400" />;
      case 'flagged':
        return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const filteredItems = items.filter(item => {
    if (filterType !== 'all' && item.type !== filterType) return false;
    if (filterStatus !== 'all' && item.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Content Moderation</h1>
        <p className="text-gray-400 mt-1">Review and moderate user-generated content</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Types</option>
          <option value="questionnaire">Questionnaires</option>
          <option value="email">Emails</option>
          <option value="feedback">Feedback</option>
          <option value="report">Reports</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="flagged">Flagged</option>
        </select>
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <Filter className="h-4 w-4" />
          <span>{filteredItems.length} items to review</span>
        </div>
      </div>

      {/* Content Cards */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 text-center">
          <h3 className="text-lg font-semibold text-white mb-2">No Content to Review</h3>
          <p className="text-gray-400">
            {filterStatus === 'pending'
              ? 'No content requires moderation at this time.'
              : `No ${filterStatus} content found with current filters.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-3">
                  <div className={`h-2 w-2 rounded-full mt-2 ${getTypeColor(item.type)}`} />
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-white font-medium">{item.userName}</h3>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-400 text-sm">{item.userEmail}</span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                      </span>
                      <span className="text-gray-500">•</span>
                      <span className={`text-xs ${getPriorityColor(item.priority)}`}>
                        {item.priority.toUpperCase()} Priority
                      </span>
                      <span className="text-gray-500">•</span>
                      <span className="text-xs text-gray-500">
                        {new Date(item.submittedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(item.status)}
                  <span className="text-sm text-gray-400 capitalize">{item.status}</span>
                </div>
              </div>

              <div className="bg-gray-900/50 rounded-lg p-4 mb-4">
                <p className="text-gray-300 text-sm">{item.content}</p>
              </div>

              {item.status === 'pending' && (
                <div className="flex items-center justify-between">
                  <button className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center space-x-1">
                    <Eye className="h-4 w-4" />
                    <span>View Full Content</span>
                  </button>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleApprove(item.id)}
                      className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleFlag(item.id)}
                      className="px-3 py-1.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
                    >
                      Flag
                    </button>
                    <button
                      onClick={() => handleReject(item.id)}
                      className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )}

              {item.reason && (
                <div className="mt-4 p-3 bg-gray-900/50 rounded-lg">
                  <p className="text-xs text-gray-500">Moderation Note:</p>
                  <p className="text-sm text-gray-400">{item.reason}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}