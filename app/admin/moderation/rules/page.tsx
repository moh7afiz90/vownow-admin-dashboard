'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'react-hot-toast';
import {
  PlusIcon,
  TrashIcon,
  PencilIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface ModerationRule {
  id: string;
  name: string;
  description: string;
  type: 'keyword' | 'regex' | 'ai' | 'threshold';
  conditions: {
    field?: string;
    operator?: string;
    value?: string | number;
    keywords?: string[];
    regex?: string;
    threshold?: number;
  };
  actions: {
    action: 'approve' | 'reject' | 'flag' | 'escalate';
    reason?: string;
    notify?: boolean;
  };
  priority: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
  matches_count: number;
}

export default function ModerationRulesPage() {
  const [rules, setRules] = useState<ModerationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState<ModerationRule | null>(null);

  const supabase = createClientComponentClient();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'keyword' as ModerationRule['type'],
    conditions: {
      keywords: [] as string[],
      regex: '',
      threshold: 0,
    },
    actions: {
      action: 'flag' as 'approve' | 'reject' | 'flag' | 'escalate',
      reason: '',
      notify: false,
    },
    priority: 1,
    enabled: true,
  });

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('moderation_rules')
        .select('*')
        .order('priority', { ascending: true });

      if (error) throw error;
      setRules(data || []);
    } catch (error) {
      console.error('Error loading rules:', error);
      toast.error('Failed to load moderation rules');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRule = async () => {
    try {
      if (editingRule) {
        const { error } = await supabase
          .from('moderation_rules')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingRule.id);

        if (error) throw error;
        toast.success('Rule updated successfully');
      } else {
        const { error } = await supabase
          .from('moderation_rules')
          .insert({
            ...formData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            matches_count: 0,
          });

        if (error) throw error;
        toast.success('Rule created successfully');
      }

      setShowRuleModal(false);
      resetForm();
      loadRules();
    } catch (error) {
      console.error('Error saving rule:', error);
      toast.error('Failed to save rule');
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;

    try {
      const { error } = await supabase
        .from('moderation_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;
      toast.success('Rule deleted successfully');
      loadRules();
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast.error('Failed to delete rule');
    }
  };

  const handleToggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('moderation_rules')
        .update({ enabled })
        .eq('id', ruleId);

      if (error) throw error;
      toast.success(`Rule ${enabled ? 'enabled' : 'disabled'} successfully`);
      loadRules();
    } catch (error) {
      console.error('Error toggling rule:', error);
      toast.error('Failed to update rule');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'keyword',
      conditions: {
        keywords: [],
        regex: '',
        threshold: 0,
      },
      actions: {
        action: 'flag',
        reason: '',
        notify: false,
      },
      priority: 1,
      enabled: true,
    });
    setEditingRule(null);
  };

  const openEditModal = (rule: ModerationRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description,
      type: rule.type,
      conditions: rule.conditions,
      actions: rule.actions,
      priority: rule.priority,
      enabled: rule.enabled,
    });
    setShowRuleModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Moderation Rules
          </h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Configure automated content moderation rules
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowRuleModal(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Rule
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {loading ? (
            <li className="p-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            </li>
          ) : rules.length === 0 ? (
            <li className="p-6 text-center text-gray-500 dark:text-gray-400">
              No moderation rules configured
            </li>
          ) : (
            rules.map((rule) => (
              <li key={rule.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {rule.name}
                      </h3>
                      <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                        rule.enabled
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {rule.enabled ? 'Active' : 'Inactive'}
                      </span>
                      <span className="ml-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                        {rule.type}
                      </span>
                      <span className="ml-2 px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded-full">
                        Priority: {rule.priority}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {rule.description}
                    </p>
                    <div className="mt-2 flex items-center space-x-4 text-sm">
                      <span className="text-gray-500 dark:text-gray-400">
                        Action: <span className="font-medium text-gray-900 dark:text-white">{rule.actions.action}</span>
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        Matches: <span className="font-medium text-gray-900 dark:text-white">{rule.matches_count}</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleRule(rule.id, !rule.enabled)}
                      className={`p-2 rounded-md ${
                        rule.enabled
                          ? 'text-green-600 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/20'
                          : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <ShieldCheckIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => openEditModal(rule)}
                      className="p-2 text-indigo-600 hover:bg-indigo-100 dark:text-indigo-400 dark:hover:bg-indigo-900/20 rounded-md"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="p-2 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/20 rounded-md"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      {showRuleModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {editingRule ? 'Edit Rule' : 'Create New Rule'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Rule Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Rule Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as ModerationRule['type'] })}
                  className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                >
                  <option value="keyword">Keyword Matching</option>
                  <option value="regex">Regular Expression</option>
                  <option value="ai">AI Detection</option>
                  <option value="threshold">Threshold Based</option>
                </select>
              </div>

              {formData.type === 'keyword' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Keywords (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.conditions.keywords?.join(', ')}
                    onChange={(e) => setFormData({
                      ...formData,
                      conditions: {
                        ...formData.conditions,
                        keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k)
                      }
                    })}
                    className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                    placeholder="spam, inappropriate, offensive"
                  />
                </div>
              )}

              {formData.type === 'regex' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Regular Expression
                  </label>
                  <input
                    type="text"
                    value={formData.conditions.regex}
                    onChange={(e) => setFormData({
                      ...formData,
                      conditions: {
                        ...formData.conditions,
                        regex: e.target.value
                      }
                    })}
                    className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white font-mono"
                  />
                </div>
              )}

              {formData.type === 'threshold' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Report Threshold
                  </label>
                  <input
                    type="number"
                    value={formData.conditions.threshold}
                    onChange={(e) => setFormData({
                      ...formData,
                      conditions: {
                        ...formData.conditions,
                        threshold: parseInt(e.target.value)
                      }
                    })}
                    className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Action
                </label>
                <select
                  value={formData.actions.action}
                  onChange={(e) => setFormData({
                    ...formData,
                    actions: {
                      ...formData.actions,
                      action: e.target.value as 'approve' | 'reject' | 'flag' | 'escalate'
                    }
                  })}
                  className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                >
                  <option value="approve">Auto-Approve</option>
                  <option value="reject">Auto-Reject</option>
                  <option value="flag">Flag for Review</option>
                  <option value="escalate">Escalate to Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Action Reason
                </label>
                <input
                  type="text"
                  value={formData.actions.reason}
                  onChange={(e) => setFormData({
                    ...formData,
                    actions: {
                      ...formData.actions,
                      reason: e.target.value
                    }
                  })}
                  className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                  placeholder="Violated community guidelines"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Priority (1-10)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                  className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={formData.enabled}
                  onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="enabled" className="ml-2 block text-sm text-gray-900 dark:text-white">
                  Enable rule immediately
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="notify"
                  checked={formData.actions.notify}
                  onChange={(e) => setFormData({
                    ...formData,
                    actions: {
                      ...formData.actions,
                      notify: e.target.checked
                    }
                  })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="notify" className="ml-2 block text-sm text-gray-900 dark:text-white">
                  Notify moderators when rule triggers
                </label>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowRuleModal(false);
                  resetForm();
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRule}
                disabled={!formData.name || !formData.description}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingRule ? 'Update Rule' : 'Create Rule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}