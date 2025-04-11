'use client';

import { useState } from 'react';

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
      <h1 className="text-3xl font-bold mb-6 text-white">URL Health Monitor</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="url" className="block text-sm font-medium mb-2 text-white">
            Enter URL to check
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
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#E3CF20] text-[#121212] py-2 px-4 rounded-lg hover:bg-[#d4c01c] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Checking...' : 'Check Health'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-900 text-red-300 rounded-lg">
          {error}
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
