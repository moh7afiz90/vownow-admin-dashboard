'use client';

import { useState, useEffect } from 'react';
import ContentReviewCard from '@/components/moderation/ContentReviewCard';
import ContentFilters from '@/components/moderation/ContentFilters';
import ModerationStats from '@/components/moderation/ModerationStats';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'react-hot-toast';

interface ContentItem {
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
}

export default function ModerationPage() {
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'pending',
    sortBy: 'reports',
  });
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    flagged: 0,
    todayReviewed: 0,
    avgReviewTime: '0m',
  });

  const supabase = createClientComponentClient();

  useEffect(() => {
    loadContent();
    loadStats();
  }, [filters]);

  const loadContent = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('content_moderation')
        .select(`
          *,
          author:user_id(id, name, email, avatar_url),
          moderation_history(*)
        `);

      if (filters.type !== 'all') {
        query = query.eq('type', filters.type);
      }

      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.sortBy === 'reports') {
        query = query.order('reports_count', { ascending: false });
      } else if (filters.sortBy === 'date') {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query.limit(20);

      if (error) throw error;

      setContentItems(data || []);
    } catch (error) {
      console.error('Error loading content:', error);
      toast.error('Failed to load content for moderation');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_moderation_stats');

      if (error) throw error;

      setStats(data || stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleModeration = async (
    itemId: string,
    action: 'approve' | 'reject' | 'flag',
    reason?: string
  ) => {
    try {
      const { error } = await supabase
        .from('content_moderation')
        .update({
          status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'flagged',
          moderated_at: new Date().toISOString(),
          moderated_by: (await supabase.auth.getUser()).data.user?.id,
          moderation_reason: reason
        })
        .eq('id', itemId);

      if (error) throw error;

      await supabase
        .from('moderation_history')
        .insert({
          content_id: itemId,
          action,
          moderator_id: (await supabase.auth.getUser()).data.user?.id,
          reason,
          timestamp: new Date().toISOString(),
        });

      toast.success(`Content ${action}ed successfully`);

      setContentItems(prev => prev.filter(item => item.id !== itemId));
      loadStats();
    } catch (error) {
      console.error('Error moderating content:', error);
      toast.error(`Failed to ${action} content`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Content Moderation
        </h1>
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
          Review and moderate user-generated content
        </p>
      </div>

      <ModerationStats stats={stats} />

      <ContentFilters
        filters={filters}
        onFilterChange={setFilters}
      />

      <div className="grid gap-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : contentItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              No content to moderate with current filters
            </p>
          </div>
        ) : (
          contentItems.map((item) => (
            <ContentReviewCard
              key={item.id}
              content={item}
              onApprove={(reason) => handleModeration(item.id, 'approve', reason)}
              onReject={(reason) => handleModeration(item.id, 'reject', reason)}
              onFlag={(reason) => handleModeration(item.id, 'flag', reason)}
            />
          ))
        )}
      </div>
    </div>
  );
}