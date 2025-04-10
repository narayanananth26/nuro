"use client";
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { usePaginationContext } from '@/contexts/PaginationContext';
import { mutate } from 'swr';

interface HealthCheckResult {
  status: number;
  responseTime: number;
  timestamp: string;
  originalUrl?: string;
}

interface UrlInput {
  url: string;
  interval: string;
}

export default function UrlMonitorForm() {
  const { data: session } = useSession();
  const [urls, setUrls] = useState<UrlInput[]>([{ url: '', interval: '5m' }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [healthCheckResults, setHealthCheckResults] = useState<Record<string, HealthCheckResult>>({});
  
  // Get the pagination context
  const { resetMonitorsPagination } = usePaginationContext();

  const handleAddUrl = () => {
    setUrls([...urls, { url: '', interval: '5m' }]);
  };

  const handleRemoveUrl = (index: number) => {
    if (urls.length > 1) {
      setUrls(urls.filter((_, i) => i !== index));
    }
  };

  const handleUrlChange = (index: number, field: 'url' | 'interval', value: string) => {
    setUrls(prev => prev.map((url, i) => 
      i === index ? { ...url, [field]: value } : url
    ));
  };

  // Function to normalize URLs to prevent duplicates
  const normalizeUrl = (inputUrl: string): string => {
    try {
      const url = new URL(inputUrl);
      // Remove trailing slash
      let normalized = url.origin + url.pathname.replace(/\/$/, '');
      // Add query parameters if they exist
      if (url.search) {
        normalized += url.search;
      }
      return normalized;
    } catch {
      return inputUrl; // Return original if parsing fails
    }
  };

  const checkUrl = async (urlData: UrlInput) => {
    try {
      const normalizedUrl = normalizeUrl(urlData.url);
      
      const response = await fetch('/api/monitor/check-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: urlData.url }),
      });

      const result = await response.json();
      setHealthCheckResults(prev => ({
        ...prev,
        [normalizedUrl]: {
          status: result.status,
          responseTime: result.responseTime,
          timestamp: result.timestamp,
          originalUrl: urlData.url
        }
      }));
      return result;
    } catch (error) {
      console.error(`Error checking URL ${urlData.url}:`, error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all URLs
    const invalidUrls = urls.some(url => {
      try {
        new URL(url.url);
        return false;
      } catch {
        return true;
      }
    });

    if (invalidUrls) {
      toast.error('Please enter valid URLs (including http:// or https://)');
      return;
    }
    
    // Check for duplicate URLs after normalization
    const normalizedUrls = urls.map(url => normalizeUrl(url.url));
    const uniqueUrls = new Set(normalizedUrls);
    
    if (uniqueUrls.size < normalizedUrls.length) {
      toast.success('Duplicate URLs detected and will be treated as the same URL');
    }

    // Clear previous results
    setHealthCheckResults({});
    setIsSubmitting(true);
    
    // Create a single toast for the entire operation
    const toastId = toast.loading(
      `Processing ${urls.length} URL${urls.length > 1 ? 's' : ''}...`
    );
    
    try {
      // Process URLs one by one
      let successCount = 0;
      let errorCount = 0;
      
      for (const urlData of urls) {
        try {
          // First check the URL
          await checkUrl(urlData);
          successCount++;
          
          // Update progress toast
          toast.loading(
            `Processed ${successCount + errorCount}/${urls.length} URLs (${successCount} successful, ${errorCount} failed)`,
            { id: toastId }
          );
          
          // Then save it if user is logged in
          if (session) {
            // Convert interval format from "5m" to numeric minutes for API
            const intervalMatch = urlData.interval.match(/^(\d+)([m|h])$/);
            if (!intervalMatch) {
              throw new Error(`Invalid interval format for ${urlData.url}`);
            }
            
            const intervalNum = parseInt(intervalMatch[1]);
            const intervalUnit = intervalMatch[2];
            const intervalMinutes = intervalUnit === 'h' ? intervalNum * 60 : intervalNum;
            const normalizedUrl = normalizeUrl(urlData.url);
            
            const response = await fetch('/api/monitor/save-url', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                url: normalizedUrl,
                interval: intervalMinutes
              }),
            });
            
            if (response.ok) {
              // Reset pagination to page 1 when a new URL is saved
              resetMonitorsPagination();
              
              // Refresh the monitors list
              mutate('/api/user/monitors');
            }
          }
        } catch (error) {
          console.error(`Error processing URL ${urlData.url}:`, error);
          errorCount++;
          
          // Update progress toast
          toast.loading(
            `Processed ${successCount + errorCount}/${urls.length} URLs (${successCount} successful, ${errorCount} failed)`,
            { id: toastId }
          );
        }
      }
      
      // Show final success/error toast
      if (errorCount === 0) {
        toast.success(
          `Successfully processed ${urls.length >  1 ? 'all' : 'the'} ${urls.length > 1 ? urls.length : ''} URL${urls.length > 1 ? 's' : ''}${session ? ' and saved to your account' : ''}`,
          { id: toastId, duration: 5000 }
        );
      } else if (successCount === 0) {
        toast.error(
          `Failed to process all URLs. Please try again.`,
          { id: toastId, duration: 5000 }
        );
      } else {
        toast.success(
          `Processed ${urls.length} URL${urls.length > 1 ? 's' : ''}: ${successCount} successful, ${errorCount} failed`,
          { id: toastId, duration: 5000 }
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {urls.map((url, index) => (
          <div key={index} className="flex gap-4 items-center">
            <div className="flex-1">
              <label htmlFor={`url-${index}`} className="block text-sm font-medium text-gray-700">
                Website URL
              </label>
              <input
                type="url"
                id={`url-${index}`}
                value={url.url}
                onChange={(e) => handleUrlChange(index, 'url', e.target.value)}
                placeholder="https://example.com"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="flex-1">
              <label htmlFor={`interval-${index}`} className="block text-sm font-medium text-gray-700">
                Check Interval
              </label>
              <select
                id={`interval-${index}`}
                value={url.interval}
                onChange={(e) => handleUrlChange(index, 'interval', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="5m">5 minutes</option>
                <option value="10m">10 minutes</option>
                <option value="30m">30 minutes</option>
                <option value="1h">1 hour</option>
              </select>
            </div>

            {index > 0 && (
              <button
                type="button"
                onClick={() => handleRemoveUrl(index)}
                className="text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            )}
          </div>
        ))}

        <div className="flex gap-4">
          <button
            type="button"
            onClick={handleAddUrl}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            ➕ Add another URL
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {session ? 'Save & Monitor' : 'Check Now'}
          </button>
        </div>
      </form>

      {Object.entries(healthCheckResults).length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2">Check Results</h3>
          <div className="space-y-4">
            {Object.entries(healthCheckResults).map(([url, result]) => (
              <div key={url} className="p-4 border rounded-md">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">{result.originalUrl || url}</h4>
                    <p className={`mt-1 text-sm ${
                      result.status < 400 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      Status: {result.status < 400 ? 'UP' : 'DOWN'}
                    </p>
                  </div>
                  <div className="text-sm">
                    Response Time: {result.responseTime}ms
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  Last checked: {new Date(result.timestamp).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
