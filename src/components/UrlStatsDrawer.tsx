'use client';
import { useEffect, useState, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';
import type { UrlMonitor, MonitorLog } from '@/types/monitor';
import { Download, ChevronDown, ChevronUp } from 'lucide-react';
import './urlstats.css'; // Import the custom CSS file

interface UrlStatsDrawerProps {
  monitor: UrlMonitor;
  onClose: () => void;
  timeRange: '7d' | '30d';
  onTimeRangeChange: (range: '7d' | '30d') => void;
  onWidthChange: (width: number) => void;
  width: number;
}

export default function UrlStatsDrawer({ monitor, onClose, timeRange, onTimeRangeChange, onWidthChange, width: initialWidth }: UrlStatsDrawerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [width, setWidth] = useState(initialWidth || 600);
  const [drawerHeight, setDrawerHeight] = useState(500);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  
  // Mobile detection
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const isMobile = windowWidth < 768;

  // Update window width on resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Animation delay
  useEffect(() => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        setIsVisible(true);
      }, 50);
    });
    
    return () => setIsVisible(false);
  }, [monitor._id]);

  // Update width from props
  useEffect(() => {
    setWidth(initialWidth || 600);
  }, [initialWidth]);
  
  // Handle click outside to close drawer
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
        onClose();
      }
      
      // Close export menu when clicking outside
      if (showExportMenu && 
          exportMenuRef.current && 
          !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose, showExportMenu]);

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(0);
  const [isExporting, setIsExporting] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isMobile) {
      dragStartY.current = e.clientY;
      dragStartHeight.current = drawerHeight;
      document.body.style.cursor = 'row-resize';
    } else {
      dragStartX.current = e.clientX;
      dragStartWidth.current = width;
      document.body.style.cursor = 'col-resize';
    }
    
    setIsDragging(true);
    document.body.classList.add('no-select');
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 0) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    if (isMobile) {
      dragStartY.current = touch.clientY;
      dragStartHeight.current = drawerHeight;
    } else {
      dragStartX.current = touch.clientX;
      dragStartWidth.current = width;
    }
    
    setIsDragging(true);
    document.body.classList.add('no-select');
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      
      if (isMobile) {
        const delta = dragStartY.current - e.clientY;
        const newHeight = Math.min(
          Math.max(dragStartHeight.current + delta, 300), 
          window.innerHeight * 0.9
        );
        setDrawerHeight(newHeight);
      } else {
        const delta = dragStartX.current - e.clientX;
        const newWidth = Math.min(
          Math.max(dragStartWidth.current + delta, 300), 
          window.innerWidth * 0.7
        );
        setWidth(newWidth);
        onWidthChange(newWidth);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length === 0) return;
      
      const touch = e.touches[0];
      if (isMobile) {
        const delta = dragStartY.current - touch.clientY;
        const newHeight = Math.min(
          Math.max(dragStartHeight.current + delta, 300), 
          window.innerHeight * 0.9
        );
        setDrawerHeight(newHeight);
      } else {
        const delta = dragStartX.current - touch.clientX;
        const newWidth = Math.min(
          Math.max(dragStartWidth.current + delta, 300), 
          window.innerWidth * 0.7
        );
        setWidth(newWidth);
        onWidthChange(newWidth);
      }
    };

    const handleEnd = () => {
      setIsDragging(false);
      document.body.style.cursor = '';
      document.body.classList.remove('no-select');
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleEnd);
      document.addEventListener('touchcancel', handleEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
      document.removeEventListener('touchcancel', handleEnd);
      document.body.classList.remove('no-select');
    };
  }, [isDragging, onWidthChange, isMobile]);

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      setIsExporting(true);
      setShowExportMenu(false);
      const res = await fetch('/api/monitor/export-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monitorId: monitor._id, format })
      });

      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `logs-${monitor._id}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export logs. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const days = timeRange === '7d' ? 7 : 30;
  const cutoffDate = subDays(new Date(), days);

  // Filter and process logs
  const recentLogs = monitor.logs
    .filter(log => new Date(log.timestamp) > cutoffDate)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Calculate uptime percentage
  const uptimePercentage = recentLogs.length > 0
    ? ((recentLogs.filter(log => log.status === 'UP').length / recentLogs.length) * 100).toFixed(2)
    : '0';

  // Calculate average response time
  const avgResponseTime = recentLogs.length > 0
    ? (recentLogs.reduce((acc, log) => acc + log.responseTime, 0) / recentLogs.length).toFixed(2)
    : '0';

  // Prepare data for charts
  const chartData = recentLogs.map(log => ({
    timestamp: format(new Date(log.timestamp), 'MM/dd HH:mm'),
    responseTime: log.responseTime,
    status: log.status === 'UP' ? 1 : 0,
  }));
  
  // Dynamic chart width
  const [chartWidth, setChartWidth] = useState(300);

  useEffect(() => {
    const updateChartWidth = () => {
      if (chartContainerRef.current) {
        const containerWidth = chartContainerRef.current.clientWidth || 250;
        setChartWidth(containerWidth - 20);
      } else if (isMobile) {
        const containerWidth = drawerRef.current?.clientWidth || window.innerWidth;
        setChartWidth(Math.max(containerWidth - 40, 250));
      } else {
        setChartWidth(width - 80);
      }
    };

    updateChartWidth();
    
    const resizeObserver = new ResizeObserver(updateChartWidth);
    if (chartContainerRef.current) {
      resizeObserver.observe(chartContainerRef.current);
    }
    
    window.addEventListener('resize', updateChartWidth);
    
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateChartWidth);
    };
  }, [isMobile, width, drawerRef]);

  // Mobile drawer styles
  const mobileDrawerStyles = {
    position: 'fixed',
    left: 0,
    right: 0,
    bottom: 0,
    height: `${drawerHeight}px`,
    transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
    transition: 'transform 300ms ease-in-out',
  } as React.CSSProperties;

  // Desktop drawer styles
  const desktopDrawerStyles = {
    position: 'fixed',
    top: '65px',
    right: 0,
    bottom: 0,
    width: `${width}px`,
    transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
    transition: 'transform 300ms ease-in-out',
  } as React.CSSProperties;

  return (
    <div 
      ref={drawerRef}
      className={`
        font-[Fira_Sans] bg-[#171717] shadow-xl overflow-hidden z-50 
        ${isMobile ? 'border-t' : 'border-l'} border-[#E3CF20]
      `}
      style={isMobile ? mobileDrawerStyles : desktopDrawerStyles}
    >
      {isMobile ? (
        <div 
          className="absolute top-0 left-0 right-0 h-6 bg-[#212121] flex items-center justify-center cursor-row-resize touch-action-none"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <div className="w-10 h-1 bg-[#E3CF20] rounded-full opacity-50" />
        </div>
      ) : (
        <div 
          className="drag-handle"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <div className="absolute inset-y-0 left-0 w-8 -translate-x-4" />
        </div>
      )}

      <div className={`h-full flex flex-col ${isMobile ? 'py-4 pt-8' : 'p-6'} overflow-hidden`}>
        <div className="flex justify-center items-center mb-4 px-4 relative">
          <h2 className="text-xl font-semibold text-white uppercase border-b border-[#E3CF20] text-center">
            Monitor Stats
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white absolute right-4"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto overflow-x-hidden flex-grow px-4 urlstats-container">
          <div className="mb-4">
            <h3 className="font-medium mb-1 text-white">URL</h3>
            <a 
              href={monitor.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-300 break-all hover:text-[#E3CF20] hover:underline url-link"
            >
              {monitor.url}
            </a>
          </div>

          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4 mb-4`}>
            <div className="bg-[#121212] border border-[#333333] p-3 rounded">
              <h4 className="text-sm text-gray-400 mb-1">Uptime</h4>
              <p className="text-xl font-semibold text-[#E3CF20]">{uptimePercentage}%</p>
            </div>
            <div className="bg-[#121212] border border-[#333333] p-3 rounded">
              <h4 className="text-sm text-gray-400 mb-1">Avg Response</h4>
              <p className="text-xl font-semibold text-[#E3CF20]">{avgResponseTime}ms</p>
            </div>
          </div>

          <div className={`flex ${isMobile ? 'flex-row justify-between items-center' : 'items-center justify-between'} mb-4 ${isMobile ? 'flex-wrap' : ''}`}>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onTimeRangeChange('7d')}
                className={`px-2 sm:px-3 py-1 text-sm sm:text-base rounded ${timeRange === '7d' ? 'bg-[#E3CF20] text-[#121212]' : 'bg-[#2D2D2D] text-white'}`}
              >
                7 Days
              </button>
              <button
                onClick={() => onTimeRangeChange('30d')}
                className={`px-2 sm:px-3 py-1 text-sm sm:text-base rounded ${timeRange === '30d' ? 'bg-[#E3CF20] text-[#121212]' : 'bg-[#2D2D2D] text-white'}`}
              >
                30 Days
              </button>
            </div>
            
            {isMobile ? (
              <div className="relative" ref={exportMenuRef}>
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="p-2 rounded bg-[#E3CF20] text-[#121212] hover:bg-[#d4c01c] disabled:opacity-50 flex items-center justify-center"
                  disabled={isExporting}
                  aria-label="Export options"
                >
                  <Download size={18} />
                </button>
                
                {showExportMenu && (
                  <div className="absolute top-full right-0 mt-1 bg-[#2D2D2D] rounded shadow-lg z-10 w-24">
                    <button
                      onClick={() => handleExport('csv')}
                      disabled={isExporting}
                      className="w-full text-left px-3 py-2 hover:bg-[#444] text-white"
                    >
                      CSV
                    </button>
                    <button
                      onClick={() => handleExport('json')}
                      disabled={isExporting}
                      className="w-full text-left px-3 py-2 hover:bg-[#444] text-white"
                    >
                      JSON
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleExport('csv')}
                  disabled={isExporting}
                  className="px-3 py-1 rounded bg-[#E3CF20] text-[#121212] hover:bg-[#d4c01c] disabled:opacity-50"
                >
                  Export CSV
                </button>
                <button
                  onClick={() => handleExport('json')}
                  disabled={isExporting}
                  className="px-3 py-1 rounded bg-[#E3CF20] text-[#121212] hover:bg-[#d4c01c] disabled:opacity-50"
                >
                  Export JSON
                </button>
              </div>
            )}
          </div>

          <div className="mb-4">
            <h3 className="font-medium mb-2 text-white">Response Time</h3>
            <div ref={chartContainerRef} className="w-full overflow-hidden">
              <ResponsiveContainer width="100%" height={160}>
                <LineChart 
                  data={chartData}
                  margin={{ top: 5, right: 0, bottom: 5, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp" 
                    hide={true}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    width={20} 
                    hide={true}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="responseTime" 
                    stroke="#8884d8" 
                    name="Response Time (ms)"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-medium mb-2 text-white">Status</h3>
            <div className="w-full overflow-hidden">
              <ResponsiveContainer width="100%" height={160}>
                <LineChart 
                  data={chartData}
                  margin={{ top: 5, right: 0, bottom: 5, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp" 
                    hide={true}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    domain={[0, 1]} 
                    ticks={[0, 1]} 
                    width={20}
                    hide={true}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="stepAfter" 
                    dataKey="status" 
                    stroke="#82ca9d" 
                    name="Status (Up/Down)"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}