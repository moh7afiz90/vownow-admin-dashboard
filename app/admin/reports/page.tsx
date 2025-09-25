'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'react-hot-toast';
import ReportGenerator from '@/components/reports/ReportGenerator';
import ReportsList from '@/components/reports/ReportsList';
import ScheduledReports from '@/components/reports/ScheduledReports';
import {
  DocumentTextIcon,
  CalendarDaysIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

interface Report {
  id: string;
  name: string;
  description: string;
  type: 'users' | 'revenue' | 'content' | 'engagement' | 'custom';
  parameters: any;
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string;
    recipients: string[];
  };
  last_run?: string;
  created_at: string;
  created_by: string;
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'generate' | 'saved' | 'scheduled'>('generate');
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewReport, setShowNewReport] = useState(false);

  const supabase = createClientComponentClient();

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error loading reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReport = async (report: Omit<Report, 'id' | 'created_at' | 'created_by' | 'last_run'>) => {
    try {
      const user = (await supabase.auth.getUser()).data.user;

      const { error } = await supabase
        .from('reports')
        .insert({
          ...report,
          created_by: user?.id,
          created_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success('Report saved successfully');
      loadReports();
      setShowNewReport(false);
    } catch (error) {
      console.error('Error saving report:', error);
      toast.error('Failed to save report');
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;

      toast.success('Report deleted successfully');
      loadReports();
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error('Failed to delete report');
    }
  };

  const tabs = [
    { id: 'generate', name: 'Generate Report', icon: DocumentTextIcon },
    { id: 'saved', name: 'Saved Reports', icon: DocumentTextIcon },
    { id: 'scheduled', name: 'Scheduled Reports', icon: CalendarDaysIcon },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Reports & Analytics
          </h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Generate, save, and schedule analytical reports
          </p>
        </div>
        {activeTab !== 'generate' && (
          <button
            onClick={() => setShowNewReport(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Report
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2
                  ${activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }
                `}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <>
              {activeTab === 'generate' && (
                <ReportGenerator onSave={handleSaveReport} />
              )}

              {activeTab === 'saved' && (
                <ReportsList
                  reports={reports.filter(r => !r.schedule)}
                  onDelete={handleDeleteReport}
                  onRefresh={loadReports}
                />
              )}

              {activeTab === 'scheduled' && (
                <ScheduledReports
                  reports={reports.filter(r => r.schedule)}
                  onDelete={handleDeleteReport}
                  onRefresh={loadReports}
                />
              )}
            </>
          )}
        </div>
      </div>

      {showNewReport && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Create New Report
            </h3>
            <ReportGenerator onSave={handleSaveReport} />
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowNewReport(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}