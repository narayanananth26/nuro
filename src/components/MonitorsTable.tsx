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
    const pageNumbers: number[] = [];
    const maxVisiblePages = 5; // Maximum number of page buttons to show
    
    // For small number of pages, show all page numbers
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
      return pageNumbers;
    }
    
    // For larger number of pages, show a sliding window of pages
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = startPage + maxVisiblePages - 1;
    
    // Adjust if we're near the end
    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // Generate the page numbers
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
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
              className="p-2 rounded-full hover:bg-[#2D2D2D] text-[#E3CF20]"
              title="Refresh monitors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-3 py-1 rounded ${
                filterStatus === 'ALL' ? 'bg-[#E3CF20] text-[#121212]' : 'bg-[#2D2D2D] text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('UP')}
              className={`px-3 py-1 rounded ${
                filterStatus === 'UP' ? 'bg-green-500 text-[#121212]' : 'bg-[#2D2D2D] text-white'
              }`}
            >
              Up
            </button>
            <button
              onClick={() => setFilterStatus('DOWN')}
              className={`px-3 py-1 rounded ${
                filterStatus === 'DOWN' ? 'bg-red-500 text-[#121212]' : 'bg-[#2D2D2D] text-white'
              }`}
            >
              Down
            </button>
          </div>
        </div>

        {monitors.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No monitors found. Add a URL to start monitoring.
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No logs found for the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#333333] table-fixed">
              <thead className="bg-[#1E1E1E]">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-[250px]">
                    URL
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-[100px]">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-[160px] whitespace-nowrap">
                    Response Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-[150px]">
                    Last Checked
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-[100px]">
                    Interval
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-[#121212] divide-y divide-[#333333]">
                {paginatedLogs.map((log, index) => {
                  const monitor = monitors.find(m => m._id === log.monitorId);
                  if (!monitor) return null;
                  
                  return (
                    <tr key={`${log.monitorId}-${log.timestamp}`} className="hover:bg-[#1E1E1E]">
                      <td className="px-6 py-4 text-sm font-medium text-white max-w-[250px] truncate">
                        <a 
                          href={monitor.url.startsWith('http') ? monitor.url : `https://${monitor.url}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:text-[#E3CF20] hover:underline"
                          title={monitor.url}
                        >
                          {monitor.url}
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm w-[100px]">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          log.status === 'UP' 
                            ? 'bg-green-900 text-green-300'
                            : 'bg-red-900 text-red-300'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 w-[160px]">
                        {log.responseTime}ms
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 w-[150px]">
                        {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 w-[100px]">
                        {(() => {
                          // Ensure interval is a valid number
                          // Force conversion to number to handle string values from API
                          const intervalValue = monitor.interval;
                          const interval = Number(intervalValue);
                          
                          // Special case for 'once' (interval = 0)
                          // Use strict equality with 0 after conversion
                          if (interval === 0) {
                            return 'Once';
                          }
                          
                          if (isNaN(interval) || interval < 0) {
                            return '5m'; // Default fallback
                          }
                          
                          // Format based on minutes
                          return interval < 60 
                            ? `${interval}m` 
                            : `${Math.floor(interval / 60)}h`;
                        })()} 
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => setSelectedMonitor(monitor)}
                          className="text-[#E3CF20] border border-[#E3CF20] px-3 py-1 rounded-md hover:text-[#F0E867] hover:bg-[#8F8412] mr-4 cursor-pointer"
                        >
                          View Stats
                        </button>
                        {editingMonitor?._id === monitor._id ? (
                          <div className="flex items-center space-x-2">
                            <input 
                              type="url" 
                              value={editUrl} 
                              onChange={(e) => setEditUrl(e.target.value)}
                              className="w-40 text-sm hover:border-[#E3CF20]"
                              placeholder="URL"
                            />
                            <select 
                              value={editInterval} 
                              onChange={(e) => setEditInterval(Number(e.target.value))}
                              className="text-sm hover:border-[#E3CF20] custom-select min-w-[100px] w-[100px]"
                            >
                              <option value="5">5m</option>
                              <option value="10">10m</option>
                              <option value="30">30m</option>
                              <option value="60">1h</option>
                            </select>
                            <button 
                              onClick={() => handleEdit(monitor)}
                              className="text-green-400 hover:text-green-300 px-2 py-1 rounded-md border border-green-400 hover:bg-green-900 cursor-pointer"
                            >
                              Save
                            </button>
                            <button 
                              onClick={() => setEditingMonitor(null)}
                              className="text-gray-400 hover:text-gray-300 px-2 py-1 rounded-md border border-gray-400 hover:bg-gray-700 ml-2 cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <button 
                              onClick={() => {
                                setEditingMonitor(monitor);
                                setEditUrl(monitor.url);
                                setEditInterval(monitor.interval);
                              }}
                              className="text-green-400 hover:text-green-300 px-2 py-1 rounded-md border border-green-400 hover:bg-green-900 mr-4 cursor-pointer"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete ${monitor.url}?`)) {
                                  handleDelete(monitor._id);
                                }
                              }}
                              className="text-red-400 hover:text-red-300 px-2 py-1 rounded-md border border-red-400 hover:bg-red-900 cursor-pointer"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-400">
            Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, filteredLogs.length)} of {filteredLogs.length} logs
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center space-x-2">
              {/* Left Arrow */}
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center rounded bg-[#1E1E1E] disabled:opacity-50 hover:bg-[#333333] transition-colors"
                aria-label="Previous Page"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              {/* Page Numbers */}
              <div className="flex space-x-1">
                {getPageNumbers.map((pageNum, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPage(pageNum)}
                    disabled={pageNum === currentPage}
                    className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
                      pageNum === currentPage
                        ? 'bg-[#E3CF20] text-[#121212] font-medium'
                        : 'bg-[#1E1E1E] hover:bg-[#333333] text-gray-300'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              {/* Right Arrow */}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="w-8 h-8 flex items-center justify-center rounded bg-[#1E1E1E] disabled:opacity-50 hover:bg-[#333333] transition-colors"
                aria-label="Next Page"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
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
