"use client";
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';

interface HealthCheckResult {
  status: number;
  responseTime: number;
  timestamp: string;
}

export default function UrlMonitorForm() {
  const { data: session } = useSession();
  const [url, setUrl] = useState('');
  const [interval, setInterval] = useState('5');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [healthCheck, setHealthCheck] = useState<HealthCheckResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      toast.error('Please sign in to save URLs for monitoring');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/monitor/save-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, interval: parseInt(interval) }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('URL saved and monitoring started.');
        setUrl('');
        setHealthCheck(data.healthCheck);
      } else {
        throw new Error(data.error || 'Failed to save URL');
      }
    } catch (error) {
      toast.error('Failed to save URL. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700">
            Website URL
          </label>
          <input
            type="url"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="interval" className="block text-sm font-medium text-gray-700">
            Check Interval
          </label>
          <select
            id="interval"
            value={interval}
            onChange={(e) => setInterval(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="5">Every 5 minutes</option>
            <option value="10">Every 10 minutes</option>
            <option value="30">Every 30 minutes</option>
            <option value="60">Every 1 hour</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save & Monitor'}
        </button>
      </form>

      {healthCheck && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium mb-2">Initial Health Check Results</h3>
          <div className="space-y-2">
            <p>
              <span className="font-medium">Status:</span>{' '}
              <span className={healthCheck.status < 400 ? 'text-green-600' : 'text-red-600'}>
                {healthCheck.status}
              </span>
            </p>
            <p>
              <span className="font-medium">Response Time:</span>{' '}
              {healthCheck.responseTime}ms
            </p>
            <p>
              <span className="font-medium">Timestamp:</span>{' '}
              {new Date(healthCheck.timestamp).toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
