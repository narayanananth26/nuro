  'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import useSWR from 'swr';
import { toast } from 'react-hot-toast';
import UrlStatsDrawer from './UrlStatsDrawer';
import { usePaginationContext } from '@/contexts/PaginationContext';
import type { UrlMonitor, MonitorLog } from '@/types/monitor';
import EditMonitorModal from './EditMonitorModal';
import DeleteMonitorModal from './DeleteMonitorModal';
import { BarChart2, Edit2, Trash2, RefreshCw, MoreVertical, Globe, ArrowUpCircle, ArrowDownCircle, Timer, Clock } from 'lucide-react';
import PageLoading from './ui/PageLoading';
import LoadingButton from './ui/LoadingButton';

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
  const [deleteMonitor, setDeleteMonitor] = useState<UrlMonitor | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [drawerWidth, setDrawerWidth] = useState(600);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileActionMenu, setMobileActionMenu] = useState<string | null>(null);
  const [checkingUrl, setCheckingUrl] = useState<string | null>(null);
  
  // Get the pagination context
  const { monitorsPaginationResetTrigger } = usePaginationContext();

  const { data: monitors, error, mutate: refreshMonitors } = useSWR<UrlMonitor[]>(MONITORS_KEY, fetcher, {
    refreshInterval: 60000,
    revalidateOnFocus: true,
    revalidateOnMount: true
  });

  // Filter monitors based on status
  const filteredMonitors = useMemo(() => {
    if (!monitors) return [];
    
    // First filter out monitors with interval=0 (once)
    const filteredByInterval = monitors.filter(monitor => monitor.interval !== 0);
    
    return filterStatus === 'ALL' 
      ? filteredByInterval 
      : filteredByInterval.filter(monitor => monitor.status === filterStatus);
  }, [monitors, filterStatus]);

  const totalPages = useMemo(() => 
    Math.ceil(filteredMonitors.length / ITEMS_PER_PAGE),
    [filteredMonitors.length]
  );

  const paginatedMonitors = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredMonitors.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredMonitors, currentPage]);

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

  // Check if mobile view on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Handle closing the mobile action menu when clicking outside
  useEffect(() => {
    if (!mobileActionMenu) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mobileActionMenu && 
        !(event.target as Element).closest('.mobile-action-button') && 
        !(event.target as Element).closest('.mobile-action-menu')
      ) {
        setMobileActionMenu(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileActionMenu]);

  // Event handlers
  const handleEdit = useCallback(async (url: string, interval: number) => {
    if (!editingMonitor) return;
    
    try {
      const response = await fetch(`/api/user/monitors`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingMonitor._id,
          url,
          interval,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.error || 'Failed to update monitor';
        throw new Error(errorMessage);
      }

      await refreshMonitors();
      toast.success('Monitor updated successfully');
      setEditingMonitor(null);
    } catch (error) {
      console.error('Error updating monitor:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update monitor');
    }
  }, [editingMonitor, refreshMonitors]);

  const handleDelete = useCallback(async () => {
    if (!deleteMonitor) return;
    try {
      const response = await fetch(`/api/user/monitors?id=${deleteMonitor._id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete monitor');
      }
      
      toast.success('Monitor deleted successfully');
      refreshMonitors();
      setDeleteMonitor(null);
    } catch (error) {
      console.error('Error deleting monitor:', error);
      toast.error('Failed to delete monitor');
    }
  }, [refreshMonitors, deleteMonitor]);

  const handleCheckAgain = useCallback(async (monitor: UrlMonitor) => {
    try {
      setCheckingUrl(monitor._id);
      toast.loading(`Checking ${monitor.url}...`);
      
      // First check the URL
      const checkResponse = await fetch('/api/monitor/check-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: monitor.url }),
      });
      
      if (!checkResponse.ok) {
        throw new Error('Failed to check URL');
      }
      
      const checkResult = await checkResponse.json();
      
      // Now update the monitor with the check result
      const updateResponse = await fetch(`/api/user/monitors/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          monitorId: monitor._id,
          status: checkResult.status >= 200 && checkResult.status < 400 ? 'UP' : 'DOWN',
          responseTime: checkResult.responseTime,
          timestamp: checkResult.timestamp,
        }),
      });
      
      if (!updateResponse.ok) {
        throw new Error('Failed to update monitor logs');
      }
      
      toast.dismiss();
      toast.success(`${monitor.url} checked successfully`);
      refreshMonitors();
    } catch (error) {
      console.error('Error checking URL:', error);
      toast.dismiss();
      toast.error('Failed to check URL');
    } finally {
      setCheckingUrl(null);
    }
  }, [refreshMonitors]);

  // Handle opening the stats drawer without page refresh
  const openStatsDrawer = useCallback((monitor: UrlMonitor) => {
    // Clear selection first to ensure animation reset
    setSelectedMonitor(null);
    
    // Use a short timeout to ensure state has updated before setting new monitor
    setTimeout(() => {
      setSelectedMonitor(monitor);
    }, 10);
  }, []);

  if (error) return <div className="text-red-500">Failed to load monitors</div>;
  if (!monitors) return <PageLoading type="table" className="p-4" />;

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  return (
    <div className="flex flex-col">
      <div 
        className={`flex flex-col transition-all duration-300 ${
          selectedMonitor && !isMobile ? 'mr-[' + drawerWidth + 'px]' : ''
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
        ) : filteredMonitors.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No monitors found for the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            {!isMobile ? (
              <table className="min-w-full divide-y divide-[#333333] table-fixed">
                <thead className="bg-[#1E1E1E]">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-gray-400 uppercase tracking-wider w-[250px]">
                      URL
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-gray-400 uppercase tracking-wider w-[100px]">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-gray-400 uppercase tracking-wider w-[160px] whitespace-nowrap">
                      Response Time
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-gray-400 uppercase tracking-wider w-[150px]">
                      Last Checked
                    </th>
                    <th scope="col" className="px-6 py-3 text-left left-sm font-medium text-gray-400 uppercase tracking-wider w-[100px]">
                      Interval
                    </th>
                    <th scope="col" className="px-6 py-3 text-sm font-medium text-gray-400 uppercase tracking-wider w-[80px] text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-[#121212] divide-y divide-[#333333] font-[IBM_Plex_Mono]">
                  {paginatedMonitors.map((monitor) => (
                    <tr key={monitor._id} className="hover:bg-[#1E1E1E]">
                      <td className="px-6 py-4 text-sm font-medium text-white max-w-[250px] truncate text-start">
                        <a 
                          href={monitor.url.startsWith('http') ? monitor.url : `https://${monitor.url}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-white hover:text-[#E3CF20] hover:underline font-medium text-sm max-w-[240px] truncate"
                          title={monitor.url}
                        >
                          {monitor.url.length > 25 ? monitor.url.substring(0, 25) + '...' : monitor.url}
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm w-[100px] text-left">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          monitor.status === 'UP' 
                            ? 'bg-green-900 text-green-300'
                            : 'bg-red-900 text-red-300'
                        }`}>
                          {monitor.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 w-[160px] text-left">
                        {monitor.responseTime ? `${monitor.responseTime}ms` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 w-[150px] text-left">
                        {monitor.lastChecked 
                          ? formatDistanceToNow(new Date(monitor.lastChecked), { addSuffix: true })
                          : 'Never'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 w-[100px] text-left">
                        {(() => {
                          // Get interval from the monitor
                          const interval = monitor.interval;
                          
                          // Special case for 'once' (interval = 0)
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
                        <div className="flex flex-row items-center justify-end space-x-4">
                        <LoadingButton
                            onClick={() => handleCheckAgain(monitor)}
                            loading={checkingUrl === monitor._id}
                            variant="secondary"
                            size="sm"
                            className="mr-3"
                            title="Check again"
                          >
                            <RefreshCw size={16} />
                          </LoadingButton>
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              openStatsDrawer(monitor);
                            }}
                            className="text-gray-400 hover:text-[#E3CF20] cursor-pointer font-[Fira_Sans] flex items-center justify-center"
                            title="View Stats"
                          >
                            <BarChart2 size={20} strokeWidth={1.5} />
                          </button>
                          
                          <button
                            onClick={() => {
                              setEditingMonitor(monitor);
                            }}
                            className="text-gray-400 hover:text-green-500 cursor-pointer font-[Fira_Sans] flex items-center justify-center"
                            title="Edit Monitor"
                          >
                            <Edit2 size={20} strokeWidth={1.5} />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteMonitor(monitor);
                            }}
                            className="text-gray-400 hover:text-red-500 cursor-pointer font-[Fira_Sans] flex items-center justify-center"
                            title="Delete Monitor"
                          >
                            <Trash2 size={20} strokeWidth={1.5} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="grid grid-cols-1 gap-4 font-[IBM_Plex_Mono]">
                {paginatedMonitors.map((monitor) => (
                  <div key={monitor._id} className="p-4 border border-[#333333] bg-[#1E1E1E] rounded-md">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-start">
                        <Globe className="text-[#E3CF20] mr-2 mt-0.5 flex-shrink-0" size={18} />
                        <div className={`text-start ${isMobile ? 'max-w-[80%] truncate' : 'w-full'}`}>
                          <a 
                            href={monitor.url.startsWith('http') ? monitor.url : `https://${monitor.url}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className={`font-medium text-white hover:text-[#E3CF20] hover:underline ${isMobile ? 'whitespace-nowrap overflow-hidden text-ellipsis block' : 'break-all w-full'}`}
                            title={monitor.url}
                          >
                            {isMobile 
                              ? (monitor.url.length > 24 
                                ? `${monitor.url.substring(0, 21)}...` 
                                : monitor.url)
                              : (monitor.url.length > 25 
                                ? `${monitor.url.substring(0, 25)}...` 
                                : monitor.url)
                            }
                          </a>
                          <div className="flex items-center">
                            {!isMobile && (
                              <span className={`mr-3 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                monitor.status === 'UP' 
                                  ? 'bg-green-900 text-green-300'
                                  : 'bg-red-900 text-red-300'
                              }`}>
                                {monitor.status}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="relative">
                        <button
                          onClick={() => setMobileActionMenu(mobileActionMenu === monitor._id ? null : monitor._id)}
                          className="text-gray-400 hover:text-[#E3CF20] p-1 mobile-action-button"
                          aria-label="Monitor actions"
                        >
                          <MoreVertical size={20} strokeWidth={1.5} />
                        </button>
                        
                        {mobileActionMenu === monitor._id && (
                          <div className="absolute right-0 top-full mt-1 bg-[#1E1E1E] border border-[#333333] rounded-md shadow-lg z-10 w-40 mobile-action-menu">
                            <button
                              onClick={() => {
                                handleCheckAgain(monitor);
                                setMobileActionMenu(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-white hover:bg-[#333333] flex items-center"
                            >
                              <RefreshCw size={16} className="mr-2" /> Check Again
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                openStatsDrawer(monitor);
                                setMobileActionMenu(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-white hover:bg-[#333333] flex items-center"
                            >
                              <BarChart2 size={16} className="mr-2" /> View Stats
                            </button>
                            
                            <button
                              onClick={() => {
                                setEditingMonitor(monitor);
                                setMobileActionMenu(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-white hover:bg-[#333333] flex items-center"
                            >
                              <Edit2 size={16} className="mr-2" /> Edit
                            </button>
                            <button
                              onClick={() => {
                                setDeleteMonitor(monitor);
                                setMobileActionMenu(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-white hover:bg-[#333333] flex items-center"
                            >
                              <Trash2 size={16} className="mr-2" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-2 text-md flex items-center justify-between">
                      <div className="flex items-center">
                        <Timer size={16} className="text-[#E3CF20] mr-2" />
                        <div className="text-white">
                          {monitor.responseTime ? `${monitor.responseTime}ms` : 'N/A'}
                        </div>
                      </div>
                      <div className="flex items-center">
                        <RefreshCw size={16} className="text-[#E3CF20] mr-2" />
                        <div className="text-gray-400">
                          {(() => {
                            const interval = monitor.interval;
                            if (interval === 0) return 'Once';
                            if (isNaN(interval) || interval < 0) return '5m';
                            return interval < 60 
                              ? `${interval}m` 
                              : `${Math.floor(interval / 60)}h`;
                          })()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-2 text-md text-gray-400 flex items-center justify-between">
                      <div className="flex items-center">
                        <Clock size={16} className="text-[#E3CF20] mr-2" />
                        <div className="text-start">
                          {monitor.lastChecked 
                            ? formatDistanceToNow(new Date(monitor.lastChecked), { addSuffix: true })
                            : 'Never'
                          }
                        </div>
                      </div>
                      {isMobile && (
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          monitor.status === 'UP' 
                            ? 'bg-green-900 text-green-300'
                            : 'bg-red-900 text-red-300'
                        }`}>
                          {monitor.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-400">
            Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, filteredMonitors.length)} of {filteredMonitors.length} monitors
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center space-x-2">
              {/* Left Arrow */}
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`px-2 py-1 rounded ${
                  currentPage === 1 
                    ? 'text-gray-600 cursor-not-allowed' 
                    : 'text-[#E3CF20] hover:bg-[#2D2D2D]'
                }`}
                aria-label="Previous page"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              {/* Page Numbers */}
              {getPageNumbers.map(pageNum => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1 rounded transition-colors duration-200 ${
                    currentPage === pageNum
                      ? 'bg-[#E3CF20] text-[#121212]'
                      : 'text-white hover:bg-[#2D2D2D]'
                  }`}
                >
                  {pageNum}
                </button>
              ))}
              
              {/* Right Arrow */}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={`px-2 py-1 rounded ${
                  currentPage === totalPages 
                    ? 'text-gray-600 cursor-not-allowed' 
                    : 'text-[#E3CF20] hover:bg-[#2D2D2D]'
                }`}
                aria-label="Next page"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* URL Stats Drawer */}
      {selectedMonitor && (
        <UrlStatsDrawer 
          monitor={selectedMonitor} 
          onClose={() => setSelectedMonitor(null)}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          width={drawerWidth}
          onWidthChange={setDrawerWidth}
        />
      )}

      {/* Edit Monitor Modal */}
      {editingMonitor && (
        <EditMonitorModal
          isOpen={true}
          monitor={editingMonitor}
          onClose={() => setEditingMonitor(null)}
          onSave={handleEdit}
        />
      )}

      {/* Delete Monitor Modal */}
      {deleteMonitor && (
        <DeleteMonitorModal
          isOpen={true}
          monitor={deleteMonitor}
          onClose={() => setDeleteMonitor(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
