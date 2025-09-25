'use client';

import { useState } from 'react';
import {
  CheckIcon,
  XMarkIcon,
  FlagIcon,
  PlayIcon,
  ChatBubbleLeftIcon,
  UserIcon,
  MusicalNoteIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';

interface ContentReviewCardProps {
  content: {
    id: string;
    type: 'video' | 'comment' | 'profile' | 'audio';
    status: 'pending' | 'approved' | 'rejected' | 'flagged';
    title: string;
    description: string;
    author: {
      id: string;
      name: string;
      email: string;
      avatar: string;
    };
    content: {
      url?: string;
      text?: string;
      duration?: number;
      thumbnail?: string;
    };
    reports: number;
    created_at: string;
    reported_at?: string;
    moderation_history: Array<{
      id: string;
      action: string;
      moderator: string;
      timestamp: string;
      reason?: string;
    }>;
  };
  onApprove: (reason?: string) => void;
  onReject: (reason?: string) => void;
  onFlag: (reason?: string) => void;
}

export default function ContentReviewCard({
  content,
  onApprove,
  onReject,
  onFlag
}: ContentReviewCardProps) {
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [currentAction, setCurrentAction] = useState<'approve' | 'reject' | 'flag' | null>(null);
  const [reason, setReason] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const handleAction = (action: 'approve' | 'reject' | 'flag') => {
    if (action === 'approve') {
      onApprove();
    } else {
      setCurrentAction(action);
      setShowReasonModal(true);
    }
  };

  const submitWithReason = () => {
    if (currentAction === 'reject') {
      onReject(reason);
    } else if (currentAction === 'flag') {
      onFlag(reason);
    }
    setShowReasonModal(false);
    setReason('');
    setCurrentAction(null);
  };

  const getTypeIcon = () => {
    switch (content.type) {
      case 'video':
        return <PlayIcon className="h-5 w-5" />;
      case 'comment':
        return <ChatBubbleLeftIcon className="h-5 w-5" />;
      case 'profile':
        return <UserIcon className="h-5 w-5" />;
      case 'audio':
        return <MusicalNoteIcon className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (content.status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'flagged':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              {content.content.thumbnail ? (
                <div className="relative w-32 h-24 rounded-lg overflow-hidden">
                  <Image
                    src={content.content.thumbnail}
                    alt={content.title}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-32 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  {getTypeIcon()}
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor()}`}>
                  {content.status}
                </span>
                <span className="inline-flex items-center space-x-1 text-xs text-gray-500">
                  {getTypeIcon()}
                  <span>{content.type}</span>
                </span>
                {content.reports > 0 && (
                  <span className="inline-flex items-center space-x-1 text-xs text-red-600 dark:text-red-400">
                    <ExclamationTriangleIcon className="h-4 w-4" />
                    <span>{content.reports} reports</span>
                  </span>
                )}
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                {content.title}
              </h3>
              {content.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {content.description}
                </p>
              )}
              {content.content.text && (
                <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-3 rounded-md mb-2">
                  {content.content.text}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <img
                src={content.author.avatar}
                alt={content.author.name}
                className="h-8 w-8 rounded-full"
              />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {content.author.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {content.author.email}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center space-x-1">
                <ClockIcon className="h-4 w-4" />
                <span>{formatDistanceToNow(new Date(content.created_at), { addSuffix: true })}</span>
              </span>
              {content.reported_at && (
                <span className="flex items-center space-x-1 text-red-600 dark:text-red-400">
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  <span>Reported {formatDistanceToNow(new Date(content.reported_at), { addSuffix: true })}</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {content.moderation_history.length > 0 && (
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
              >
                History ({content.moderation_history.length})
              </button>
            )}
            <button
              onClick={() => handleAction('approve')}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <CheckIcon className="h-4 w-4 mr-1" />
              Approve
            </button>
            <button
              onClick={() => handleAction('reject')}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <XMarkIcon className="h-4 w-4 mr-1" />
              Reject
            </button>
            <button
              onClick={() => handleAction('flag')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <FlagIcon className="h-4 w-4 mr-1" />
              Flag
            </button>
          </div>
        </div>

        {showHistory && content.moderation_history.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Moderation History
            </h4>
            <div className="space-y-2">
              {content.moderation_history.map((entry) => (
                <div key={entry.id} className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">{entry.action}</span> by {entry.moderator}
                  {' '}{formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                  {entry.reason && (
                    <p className="text-xs mt-1 pl-4">Reason: {entry.reason}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showReasonModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Provide a reason for {currentAction}
            </h3>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              rows={4}
              placeholder="Enter reason..."
              required
            />
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowReasonModal(false);
                  setReason('');
                  setCurrentAction(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={submitWithReason}
                disabled={!reason.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}