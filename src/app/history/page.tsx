'use client';

import { useState, useEffect, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import useSWR from 'swr';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

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

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

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

  if (status === 'loading') {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (error) return <div className="text-red-500">Failed to load history logs</div>;
  if (!logs) return <div>Loading logs...</div>;

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-white">URL Monitoring History</h1>
      
      <div className="flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={async () => {
                try {
                  await refreshLogs();
                  toast.success('History refreshed successfully');
                } catch (error) {
                  toast.error('Failed to refresh history');
                }
              }}
              className="p-2 rounded-full hover:bg-[#2D2D2D] text-[#E3CF20]"
              title="Refresh history"
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
                    Timestamp
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-[100px]">
                    Interval
                  </th>
                </tr>
              </thead>
              <tbody className="bg-[#121212] divide-y divide-[#333333]">
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
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4">
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
          </div>
        )}
      </div>
    </div>
  );
}
