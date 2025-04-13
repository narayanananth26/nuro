'use client';

import { useState, useEffect } from 'react';
import LoadingButton from './ui/LoadingButton';
import { TextSkeleton } from './ui/skeleton';
import { Globe, ArrowUpCircle, ArrowDownCircle, Timer, Clock } from 'lucide-react';

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
  const [isMobile, setIsMobile] = useState(false);

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
        <div className="mt-6">
          <h3 className="text-md font-medium mb-2 text-white text-start">Check Results</h3>
          <div className="space-y-4 font-[IBM_Plex_Mono] text-sm">
            <div className="p-4 border border-[#333333] bg-[#1E1E1E] rounded-md">
              <div className={`${isMobile ? 'flex flex-row items-center justify-between' : 'flex justify-between items-center'}`}>
                <div className="flex items-start">
                  <Globe className="text-[#E3CF20] mr-2 mt-0.5 flex-shrink-0" size={18} />
                  <div className={isMobile ? 'max-w-[70%]' : ''}>
                    <div className="font-medium text-white flex items-center flex-wrap">
                      <a 
                        href={url.startsWith('http') ? url : `https://${url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mr-2 hover:text-[#E3CF20] hover:underline"
                        title={url}
                      >
                        {isMobile 
                          ? (url.length > 24 ? `${url.substring(0, 21)}...` : url)
                          : url
                        }
                      </a>
                    </div>
                  </div>
                </div>

                <div>
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    result.status < 400
                      ? 'bg-green-900 text-green-300'
                      : 'bg-red-900 text-red-300'
                  }`}>
                    {result.status < 400 ? 'UP' : 'DOWN'}
                  </span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <Timer className="text-[#E3CF20] mr-2" size={16} />
                  <div className="text-gray-300">
                    {isMobile ? (
                      <span className="font-medium">{result.responseTime}ms</span>
                    ) : (
                      <>Response: <span className="font-medium">{result.responseTime}ms</span></>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-end">
                  <div className="text-gray-300 mr-2">
                    Status: <span className="font-medium">{result.status}</span>
                  </div>
                  {result.status < 400 ? (
                    <ArrowUpCircle className="text-green-400" size={16} />
                  ) : (
                    <ArrowDownCircle className="text-red-400" size={16} />
                  )}
                </div>
                <div className="flex items-center col-span-2">
                  <Clock className="text-[#E3CF20] mr-2" size={16} />
                  <div className="text-gray-300">
                    {isMobile ? (
                      <span className="font-medium">{new Date(result.timestamp).toLocaleTimeString()}</span>
                    ) : (
                      <>Time: <span className="font-medium">{new Date(result.timestamp).toLocaleString()}</span></>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
