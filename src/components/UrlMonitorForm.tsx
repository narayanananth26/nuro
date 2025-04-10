"use client";
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { mutate } from 'swr';

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
      // Validate URL
      try {
        new URL(url);
      } catch (error) {
        toast.error('Please enter a valid URL (including http:// or https://)');
        return;
      }

      const intervalNum = Number(interval);
      if (isNaN(intervalNum) || intervalNum <= 0) {
        toast.error('Please select a valid interval');
        return;
      }

      const response = await fetch('/api/monitor/save-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          interval: intervalNum
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('URL saved and monitoring started.');
        setUrl('');
        setInterval('5');
        
        // Refresh the monitors table
        await mutate('/api/user/monitors');
      } else {
        throw new Error(data.error || 'Failed to save URL');
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to save URL. Please try again.');
      }
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
    </div>
  );
}
