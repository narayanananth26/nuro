'use client';

import { useState } from 'react';
import LoadingButton from './ui/LoadingButton';
import { TextSkeleton } from './ui/skeleton';

interface HealthCheckResult {
  status: number;
  responseTime: number;
  timestamp: string;
}

export default function UrlHealthCheck() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HealthCheckResult | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/health-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error('Failed to check URL health');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-xl font-bold mb-6 text-white uppercase w-fit mx-auto border-b border-[#E3CF20]">Monitor Websites</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex-1 space-y-1">
          <label htmlFor="url" className="block text-md font-medium text-white">
            Website URL
          </label>
          <input
            type="url"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            required
            className="w-full hover:border-[#E3CF20]"
          />
        </div>
        <LoadingButton
          type="submit"
          loading={loading}
          variant="primary"
          size="md"
          className="w-full font-medium uppercase"
        >
          Check Health
        </LoadingButton>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-900 text-red-300 rounded-lg">
          {error}
        </div>
      )}

      {loading && !result && (
        <div className="mt-6">
          <TextSkeleton lines={3} className="p-6 bg-[#1E1E1E] border border-[#333333] rounded-lg" />
        </div>
      )}

      {result && (
        <div className="mt-6 p-6 bg-[#1E1E1E] border border-[#333333] rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-white">Health Check Results</h2>
          <div className="space-y-2">
            <p className="text-white">
              <span className="font-medium">Status:</span>{' '}
              <span className={result.status < 400 ? 'text-green-400' : 'text-red-400'}>
                {result.status}
              </span>
            </p>
            <p className="text-white">
              <span className="font-medium">Response Time:</span>{' '}
              {result.responseTime}ms
            </p>
            <p className="text-white">
              <span className="font-medium">Timestamp:</span>{' '}
              {new Date(result.timestamp).toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
