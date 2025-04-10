'use client';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import useSWR, { mutate } from 'swr';

interface Monitor {
  _id: string;
  url: string;
  status: string;
  lastChecked: string;
  responseTime: number;
  interval: number;
}

type FilterStatus = 'ALL' | 'UP' | 'DOWN';

const fetcher = (url: string) => fetch(url).then(res => res.json());
const MONITORS_KEY = '/api/user/monitors';

export default function MonitorsTable() {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
  const { data: monitors, error, mutate: refreshMonitors } = useSWR<Monitor[]>(MONITORS_KEY, fetcher, {
    refreshInterval: 60000 // Refresh every minute
  });

  const [editingMonitor, setEditingMonitor] = useState<Monitor | null>(null);
  const [editUrl, setEditUrl] = useState('');
  const [editInterval, setEditInterval] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (error) return <div className="text-red-500">Failed to load monitors</div>;
  if (!monitors) return <div>Loading...</div>;

  const filteredMonitors = monitors.filter(monitor => {
    if (filterStatus === 'ALL') return true;
    return monitor.status === filterStatus;
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshMonitors();
    setIsRefreshing(false);
  };

  const handleEdit = async (monitor: Monitor) => {
    try {
      const response = await fetch(MONITORS_KEY, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: monitor._id,
          url: editUrl,
          interval: editInterval
        })
      });

      if (!response.ok) throw new Error('Failed to update monitor');
      
      await refreshMonitors();
      setEditingMonitor(null);
    } catch (error) {
      console.error('Error updating monitor:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this monitor?')) return;

    try {
      const response = await fetch(`${MONITORS_KEY}?id=${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete monitor');
      
      await refreshMonitors();
    } catch (error) {
      console.error('Error deleting monitor:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {(['ALL', 'UP', 'DOWN'] as FilterStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded ${
                filterStatus === status
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={`px-4 py-2 rounded-md flex items-center gap-2 ${
            isRefreshing 
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          <svg
            className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg shadow">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Checked</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Response Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interval</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredMonitors.map((monitor) => (
              <tr key={monitor._id}>
                {editingMonitor?._id === monitor._id ? (
                  <>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={editUrl}
                        onChange={(e) => setEditUrl(e.target.value)}
                        className="border rounded px-2 py-1 w-full"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded ${
                        monitor.status === 'UP' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {monitor.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {monitor.lastChecked ? 
                        formatDistanceToNow(new Date(monitor.lastChecked), { addSuffix: true }) :
                        'Never'
                      }
                    </td>
                    <td className="px-6 py-4">
                      {monitor.responseTime ? `${monitor.responseTime}ms` : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        value={editInterval}
                        onChange={(e) => setEditInterval(Number(e.target.value))}
                        className="border rounded px-2 py-1 w-24"
                      />
                    </td>
                    <td className="px-6 py-4 space-x-2">
                      <button
                        onClick={() => handleEdit(monitor)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingMonitor(null)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        Cancel
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-4">{monitor.url}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded ${
                        monitor.status === 'UP' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {monitor.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {monitor.lastChecked ? 
                        formatDistanceToNow(new Date(monitor.lastChecked), { addSuffix: true }) :
                        'Never'
                      }
                    </td>
                    <td className="px-6 py-4">
                      {monitor.responseTime ? `${monitor.responseTime}ms` : '-'}
                    </td>
                    <td className="px-6 py-4">{monitor.interval}m</td>
                    <td className="px-6 py-4 space-x-2">
                      <button
                        onClick={() => {
                          setEditingMonitor(monitor);
                          setEditUrl(monitor.url);
                          setEditInterval(monitor.interval);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(monitor._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
