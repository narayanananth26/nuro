'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import useSWR from 'swr';
import { toast } from 'react-hot-toast';
import UrlStatsDrawer from './UrlStatsDrawer';
import { usePaginationContext } from '@/contexts/PaginationContext';
import type { UrlMonitor, MonitorLog } from '@/types/monitor';

type FilterStatus = 'ALL' | 'UP' | 'DOWN';
const ITEMS_PER_PAGE = 5;
const MONITORS_KEY = '/api/user/monitors';

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Failed to fetch monitors');
  return res.json();
});

export default function MonitorsTable() {
  // All state hooks at the top
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
  const [selectedMonitor, setSelectedMonitor] = useState<UrlMonitor | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d'>('7d');
  const [editingMonitor, setEditingMonitor] = useState<UrlMonitor | null>(null);
  const [editUrl, setEditUrl] = useState('');
  const [editInterval, setEditInterval] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [drawerWidth, setDrawerWidth] = useState(600);
  
  // Get the pagination context
  const { monitorsPaginationResetTrigger } = usePaginationContext();

  const { data: monitors, error, mutate: refreshMonitors } = useSWR<UrlMonitor[]>(MONITORS_KEY, fetcher, {
    refreshInterval: 60000,
    revalidateOnFocus: true,
    revalidateOnMount: true
  });

  // Derived state using hooks
  const allLogs = useMemo(() => {
    if (!monitors) return [];
    return monitors.flatMap(monitor => 
      monitor.logs.map(log => ({
        ...log,
        url: monitor.url,
        monitorId: monitor._id
      }))
    ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [monitors]);

  const filteredLogs = useMemo(() => {
    return filterStatus === 'ALL' 
      ? allLogs 
      : allLogs.filter(log => log.status === filterStatus);
  }, [allLogs, filterStatus]);

  const totalPages = useMemo(() => 
    Math.ceil(filteredLogs.length / ITEMS_PER_PAGE),
    [filteredLogs.length]
  );

  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredLogs.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredLogs, currentPage]);

  // Pagination UI helper
  const getPageNumbers = useMemo(() => {
    const pageNumbers: (number | string)[] = [];
    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always show first page
      pageNumbers.push(1);
      
      if (currentPage <= 3) {
        // Near the start
        pageNumbers.push(2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pageNumbers.push('...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        // Middle - show current page and neighbors
        pageNumbers.push('...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pageNumbers;
  }, [currentPage, totalPages]);

  // Effects
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus]);
  
  // Reset to page 1 when a new URL is checked
  useEffect(() => {
    if (monitorsPaginationResetTrigger > 0) {
      setCurrentPage(1);
    }
  }, [monitorsPaginationResetTrigger]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [currentPage, totalPages]);

  // Event handlers
  const handleEdit = useCallback(async (monitor: UrlMonitor) => {
    try {
      const response = await fetch(`/api/monitor/save-url`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: monitor._id,
          url: editUrl,
          interval: editInterval,
        }),
      });

      if (!response.ok) throw new Error('Failed to update monitor');

      refreshMonitors();
      setEditingMonitor(null);
    } catch (error) {
      console.error('Error updating monitor:', error);
    }
  }, [editUrl, editInterval, refreshMonitors]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/user/monitors?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete monitor');

      refreshMonitors();
    } catch (error) {
      console.error('Error deleting monitor:', error);
    }
  }, [refreshMonitors]);

  if (error) return <div className="text-red-500">Failed to load monitors</div>;
  if (!monitors) return <div>Loading...</div>;

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  return (
    <div className="flex flex-col">
      <div 
        className={`flex flex-col transition-all duration-300 ${
          selectedMonitor ? 'mr-[' + drawerWidth + 'px]' : ''
        }`}
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={async () => {
                try {
                  await refreshMonitors();
                  toast.success('Monitors refreshed successfully');
                } catch (error) {
                  toast.error('Failed to refresh monitors');
                }
              }}
              className="p-2 rounded-full hover:bg-gray-100 text-blue-600"
              title="Refresh monitors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-3 py-1 rounded ${
                filterStatus === 'ALL' ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('UP')}
              className={`px-3 py-1 rounded ${
                filterStatus === 'UP' ? 'bg-green-500 text-white' : 'bg-gray-200'
              }`}
            >
              Up
            </button>
            <button
              onClick={() => setFilterStatus('DOWN')}
              className={`px-3 py-1 rounded ${
                filterStatus === 'DOWN' ? 'bg-red-500 text-white' : 'bg-gray-200'
              }`}
            >
              Down
            </button>
          </div>
        </div>

        <div className="shadow overflow-x-auto border-b border-gray-200 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Response Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interval</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedLogs.map((log, index) => (
                <tr key={`${log.monitorId}-${index}`}>
                  <td className="px-6 py-4">{log.url}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded ${
                      log.status === 'UP' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                  </td>
                  <td className="px-6 py-4">
                    {log.responseTime}ms
                  </td>
                  <td className="px-6 py-4">
                    {log.interval > 0 ? `Every ${log.interval} ${log.interval === 1 ? 'minute' : 'minutes'}` : 'Not set'}
                  </td>
                  <td className="px-6 py-4 space-x-2">
                    <button
                      onClick={() => {
                        const monitor = monitors.find(m => m._id === log.monitorId);
                        if (monitor) {
                          setEditingMonitor(monitor);
                          setEditUrl(monitor.url);
                          setEditInterval(log.interval);
                        }
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(log.monitorId)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => {
                        const monitor = monitors.find(m => m._id === log.monitorId);
                        if (monitor) setSelectedMonitor(monitor);
                      }}
                      className="text-purple-600 hover:text-purple-900"
                    >
                      Stats
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4">
          <div>
            Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, filteredLogs.length)} of {filteredLogs.length} logs
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50 hover:bg-gray-300"
            >
              Previous
            </button>
            
            <div className="flex space-x-1">
              {getPageNumbers.map((pageNum, idx) => (
                <button
                  key={idx}
                  onClick={() => typeof pageNum === 'number' && setCurrentPage(pageNum)}
                  disabled={pageNum === currentPage || typeof pageNum === 'string'}
                  className={`w-8 h-8 flex items-center justify-center rounded ${
                    pageNum === currentPage
                      ? 'bg-blue-500 text-white'
                      : typeof pageNum === 'string'
                      ? 'text-gray-500 cursor-default'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  {pageNum}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50 hover:bg-gray-300"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {selectedMonitor && (
        <UrlStatsDrawer
          monitor={selectedMonitor}
          onClose={() => setSelectedMonitor(null)}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          onWidthChange={setDrawerWidth}
          width={drawerWidth}
        />
      )}
    </div>
  );
}
