'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import useSWR from 'swr';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Download, Globe, Timer, Clock, RefreshCw, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import './history.css';
import PageLoading from '@/components/ui/PageLoading';
import Skeleton, { TextSkeleton, TableRowSkeleton } from '@/components/ui/skeleton';
import LoadingButton from '@/components/ui/LoadingButton';

interface MonitorLog {
  _id: string;
  timestamp: string;
  status: string;
  responseTime: number;
  url: string;
  monitorId: string;
  monitorInterval: number;
}

type FilterStatus = 'ALL' | 'UP' | 'DOWN';
const ITEMS_PER_PAGE = 10;
const HISTORY_KEY = '/api/user/monitors/logs';

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Failed to fetch logs');
  return res.json();
});

export default function HistoryPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

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
  
  // Handle click outside to close export menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showExportMenu && 
        exportMenuRef.current && 
        !exportMenuRef.current.contains(event.target as Node)
      ) {
        setShowExportMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportMenu]);

  const { data: logs, error, mutate: refreshLogs } = useSWR<MonitorLog[]>(
    status === 'authenticated' ? HISTORY_KEY : null,
    fetcher,
    {
      refreshInterval: 60000,
      revalidateOnFocus: true,
      revalidateOnMount: true
    }
  );

  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    
    return filterStatus === 'ALL' 
      ? logs 
      : logs.filter((log: MonitorLog) => log.status === filterStatus);
  }, [logs, filterStatus]);

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

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus]);

  // Ensure current page is valid
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [currentPage, totalPages]);

  // Export functions
  const exportAsCSV = async () => {
    if (!filteredLogs || filteredLogs.length === 0) {
      toast.error('No data to export');
      return;
    }

    setIsExporting(true);
    try {
      // Create CSV header
      const headers = ['URL', 'Status', 'Response Time (ms)', 'Timestamp', 'Interval'];
      
      // Create CSV rows
      const rows = filteredLogs.map(log => [
        log.url,
        log.status,
        log.responseTime,
        new Date(log.timestamp).toISOString(),
        log.monitorInterval === 0 ? 'Once' : log.monitorInterval < 60 ? `${log.monitorInterval}m` : `${Math.floor(log.monitorInterval / 60)}h`
      ]);
      
      // Combine header and rows
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `url-monitoring-history-${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('CSV exported successfully');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Failed to export CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsJSON = async () => {
    if (!filteredLogs || filteredLogs.length === 0) {
      toast.error('No data to export');
      return;
    }

    setIsExporting(true);
    try {
      // Format the data for JSON export
      const formattedData = filteredLogs.map(log => ({
        url: log.url,
        status: log.status,
        responseTime: log.responseTime,
        timestamp: new Date(log.timestamp).toISOString(),
        interval: log.monitorInterval === 0 ? 'Once' : log.monitorInterval < 60 ? `${log.monitorInterval}m` : `${Math.floor(log.monitorInterval / 60)}h`
      }));
      
      // Create download link
      const blob = new Blob([JSON.stringify(formattedData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `url-monitoring-history-${new Date().toISOString().slice(0, 10)}.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('JSON exported successfully');
    } catch (error) {
      console.error('Error exporting JSON:', error);
      toast.error('Failed to export JSON');
    } finally {
      setIsExporting(false);
    }
  };

  if (error) return <div className="text-red-500">Failed to load history logs</div>;

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  return (
    <div className="history-container">
      <div className="history-content">
        {!logs || status === 'loading' ? (
          // Skeleton loading state
          <>
            <div className="flex justify-center mb-6 mt-8">
              <Skeleton width="280px" height="36px" className="mb-1" />
            </div>
            
            <div className={`${isMobile ? 'flex flex-col space-y-3' : 'flex justify-between'} items-center mb-4`}>
              <div className={`flex ${isMobile ? 'flex-wrap w-full justify-between' : 'justify-between w-full'} items-center`}>
                <div className="flex items-center space-x-2">
                  <Skeleton width="40px" height="40px" rounded="full" className="mr-1" />
                  <Skeleton width="50px" height="32px" rounded="md" className="mr-1" />
                  <Skeleton width="50px" height="32px" rounded="md" className="mr-1" />
                  <Skeleton width="50px" height="32px" rounded="md" className="mr-1" />
                </div>
                <div>
                  <Skeleton width={isMobile ? "100px" : "150px"} height="40px" rounded="md" />
                </div>
              </div>
            </div>
            
            <div className="my-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRowSkeleton key={i} cols={5} className="mb-3 p-4 border border-[#333333] bg-[#1E1E1E] rounded-md" />
              ))}
            </div>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-6 text-white mx-auto uppercase border-b border-[#E3CF20] w-fit mt-8">URL Monitoring History</h1>
            
            <div className="flex flex-col">
              <div className={`${isMobile ? 'flex flex-col space-y-3' : 'flex justify-between'} items-center mb-4`}>
                <div className={`flex ${isMobile ? 'flex-wrap w-full justify-between' : 'justify-between w-full'} items-center`}>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={async () => {
                        try {
                          setIsRefreshing(true);
                          await refreshLogs();
                          toast.success('History refreshed successfully');
                        } catch (error) {
                          toast.error('Failed to refresh history');
                        } finally {
                          setIsRefreshing(false);
                        }
                      }}
                      className={`p-2 rounded-full hover:bg-[#2D2D2D] text-[#E3CF20] ${isRefreshing ? 'animate-spin' : ''}`}
                      title="Refresh history"
                      disabled={isRefreshing}
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
                  
                  <div className="relative" ref={exportMenuRef}>
                    <button
                      onClick={() => setShowExportMenu(!showExportMenu)}
                      className="px-3 py-1 rounded bg-[#2D2D2D] text-white hover:bg-[#E3CF20] hover:text-[#121212] flex items-center space-x-1"
                      title="Export options"
                    >
                      <Download size={16} className="mr-1" />
                      <span className={isMobile ? 'sr-only' : ''}>Export</span>
                    </button>
                    
                    {showExportMenu && (
                      <div className="absolute right-0 top-full mt-1 bg-[#2D2D2D] rounded shadow-lg z-10 w-32">
                        <LoadingButton
                          onClick={() => {
                            exportAsCSV();
                            setShowExportMenu(false);
                          }}
                          loading={isExporting}
                          variant="secondary"
                          className="w-full text-left px-3 py-2 hover:bg-[#444] text-white flex items-center"
                        >
                          <Download size={16} className="mr-2" /> CSV
                        </LoadingButton>
                        <LoadingButton
                          onClick={() => {
                            exportAsJSON();
                            setShowExportMenu(false);
                          }}
                          loading={isExporting}
                          variant="secondary"
                          className="w-full text-left px-3 py-2 hover:bg-[#444] text-white flex items-center"
                        >
                          <Download size={16} className="mr-2" /> JSON
                        </LoadingButton>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {logs.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No history logs found.
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No logs found for the selected filter.
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
                            Timestamp
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-gray-400 uppercase tracking-wider w-[100px]">
                            Interval
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-[#121212] divide-y divide-[#333333] ">
                        {paginatedLogs.map((log: MonitorLog, index: number) => (
                          <tr key={`${log.monitorId}-${log.timestamp}-${index}`} className="hover:bg-[#1E1E1E]">
                            <td className="px-6 py-4 text-sm font-medium text-white max-w-[250px] truncate">
                              <a 
                                href={log.url.startsWith('http') ? log.url : `https://${log.url}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="hover:text-[#E3CF20] hover:underline"
                                title={log.url}
                              >
                                {log.url}
                              </a>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm w-[100px]">
                              <span className={`px-2 inline-flex text-sm leading-5 font-semibold rounded-full ${
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
                                // Get interval from the monitor
                                const interval = log.monitorInterval;
                                
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
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 font-[IBM_Plex_Mono]">
                      {paginatedLogs.map((log: MonitorLog, index: number) => (
                        <div key={`${log.monitorId}-${log.timestamp}-${index}`} className="p-4 border border-[#333333] bg-[#1E1E1E] rounded-md">
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-start">
                              <Globe className="text-[#E3CF20] mr-2 mt-0.5 flex-shrink-0" size={18} />
                              <div>
                                <a 
                                  href={log.url.startsWith('http') ? log.url : `https://${log.url}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="font-medium text-white break-all hover:text-[#E3CF20] hover:underline"
                                  title={log.url}
                                >
                                  {log.url.length > 25 ? log.url.substring(0, 25) + '...' : log.url}
                                </a>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-2 text-md flex items-center justify-between">
                            <div className="flex items-center">
                              <Timer size={16} className="text-[#E3CF20] mr-2" />
                              <div className="text-white">
                                {log.responseTime}ms
                              </div>
                            </div>
                            <div className="flex items-center">
                              <RefreshCw size={16} className="text-[#E3CF20] mr-2" />
                              <div className="text-gray-400">
                                {(() => {
                                  const interval = log.monitorInterval;
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
                                {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                              </div>
                            </div>
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              log.status === 'UP' 
                                ? 'bg-green-900 text-green-300 items-center'
                                : 'bg-red-900 text-red-300 items-center'
                            }`}>
                              {log.status === 'UP' ? <ArrowUpCircle size={14} className="mr-1" /> : <ArrowDownCircle size={14} className="mr-1" />}
                              {log.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className={`${isMobile ? 'flex flex-col space-y-3' : 'flex justify-between'} items-center mt-4`}>
                  <div className="text-sm text-gray-400">
                    Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, filteredLogs.length)} of {filteredLogs.length} logs
                  </div>
                  
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
                    {!isMobile && getPageNumbers.map(pageNum => (
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
                    
                    {isMobile && (
                      <span className="text-sm text-white mx-2">
                        Page {currentPage} of {totalPages}
                      </span>
                    )}
                    
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
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
