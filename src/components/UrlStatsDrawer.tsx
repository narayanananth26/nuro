'use client';
import { useEffect, useState, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { format, subDays } from 'date-fns';
import type { UrlMonitor, MonitorLog } from '@/types/monitor';

interface UrlStatsDrawerProps {
  monitor: UrlMonitor;
  onClose: () => void;
  timeRange: '7d' | '30d';
  onTimeRangeChange: (range: '7d' | '30d') => void;
  onWidthChange: (width: number) => void;
  width: number;
}

export default function UrlStatsDrawer({ monitor, onClose, timeRange, onTimeRangeChange, onWidthChange, width: initialWidth }: UrlStatsDrawerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [width, setWidth] = useState(initialWidth || 600);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsVisible(true);
    return () => setIsVisible(false);
  }, [monitor._id]);

  useEffect(() => {
    setWidth(initialWidth || 600);
  }, [initialWidth]);
  
  // Handle click outside to close drawer
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);
  const [isExporting, setIsExporting] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent text selection
    setIsDragging(true);
    dragStartX.current = e.clientX;
    dragStartWidth.current = width;
    document.body.style.cursor = 'col-resize';
    document.body.classList.add('no-select');
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault(); // Prevent text selection during drag
      const delta = dragStartX.current - e.clientX;
      const newWidth = Math.min(Math.max(dragStartWidth.current + delta, 300), window.innerWidth * 0.7);
      setWidth(newWidth);
      onWidthChange(newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = '';
      document.body.classList.remove('no-select');
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      // Clean up in case component unmounts during drag
      document.body.classList.remove('no-select');
    };
  }, [isDragging, onWidthChange]);

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      setIsExporting(true);
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

  const chartWidth = width - 80; // Account for padding

  return (
    <div 
      ref={drawerRef}
      className={`fixed top-[65px] bottom-0 right-0 bg-[#1E1E1E] shadow-xl transform transition-transform duration-300 border-l border-[#333333] ${
        isVisible ? 'translate-x-0' : 'translate-x-full'
      }`}
      style={{ width: `${width}px` }}
    >
      {/* Drag handle with invisible wider area for better interaction */}
      <div 
        className="drag-handle"
        onMouseDown={handleMouseDown}
      >
        {/* Visual indicator */}
        <div className="absolute inset-y-0 left-0 w-8 -translate-x-4" />
      </div>

      <div className="h-full flex flex-col p-6 overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Monitor Stats</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="mb-6">
          <h3 className="font-medium mb-2 text-white">URL</h3>
          <p className="text-gray-300 break-all">{monitor.url}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-[#121212] border border-[#333333] p-4 rounded">
            <h4 className="text-sm text-gray-400 mb-1">Uptime</h4>
            <p className="text-2xl font-semibold text-[#E3CF20]">{uptimePercentage}%</p>
          </div>
          <div className="bg-[#121212] border border-[#333333] p-4 rounded">
            <h4 className="text-sm text-gray-400 mb-1">Avg Response</h4>
            <p className="text-2xl font-semibold text-[#E3CF20]">{avgResponseTime}ms</p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => onTimeRangeChange('7d')}
              className={`px-3 py-1 rounded ${timeRange === '7d' ? 'bg-[#E3CF20] text-[#121212]' : 'bg-[#2D2D2D] text-white'}`}
            >
              7 Days
            </button>
            <button
              onClick={() => onTimeRangeChange('30d')}
              className={`px-3 py-1 rounded ${timeRange === '30d' ? 'bg-[#E3CF20] text-[#121212]' : 'bg-[#2D2D2D] text-white'}`}
            >
              30 Days
            </button>
          </div>
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
        </div>

        <div className="flex-grow overflow-auto">
          <div className="mb-6">
            <h3 className="font-medium mb-2">Response Time</h3>
            <LineChart width={chartWidth} height={200} data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="responseTime" stroke="#8884d8" name="Response Time (ms)" />
            </LineChart>
          </div>

          <div>
            <h3 className="font-medium mb-2">Status</h3>
            <LineChart width={chartWidth} height={200} data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis domain={[0, 1]} ticks={[0, 1]} />
              <Tooltip />
              <Legend />
              <Line type="stepAfter" dataKey="status" stroke="#82ca9d" name="Status (Up/Down)" />
            </LineChart>
          </div>
        </div>
      </div>
    </div>
  );
}
