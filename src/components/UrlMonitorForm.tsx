"use client";
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { usePaginationContext } from '@/contexts/PaginationContext';
import { mutate } from 'swr';
import { Trash2 } from 'lucide-react';

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
          
          // Then save it if user is logged in
          if (session) {
            // Convert interval format from "5m" to numeric minutes for API
            // Handle 'once' option or regular intervals
            let intervalMinutes = 0; // 0 means check once, don't monitor
            
            console.log('Processing interval:', urlData.interval);
            
            if (urlData.interval !== 'once') {
              const intervalMatch = urlData.interval.match(/^(\d+)([m|h])$/);
              if (!intervalMatch) {
                throw new Error(`Invalid interval format for ${urlData.url}`);
              }
              
              const intervalNum = parseInt(intervalMatch[1]);
              const intervalUnit = intervalMatch[2];
              intervalMinutes = intervalUnit === 'h' ? intervalNum * 60 : intervalNum;
              console.log('Converted interval to minutes:', intervalMinutes);
            } else {
              console.log('"Once" option selected, setting interval to 0');
            }
            const normalizedUrl = normalizeUrl(urlData.url);
            
            const requestBody = {
              url: normalizedUrl,
              interval: intervalMinutes
            };
            
            console.log('Sending request to API:', requestBody);
            
            const response = await fetch('/api/monitor/save-url', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(requestBody),
            });
            
            const responseData = await response.json();
            console.log('API response:', responseData);
            
            if (response.ok) {
              successCount++;
              // Reset pagination to page 1 when a new URL is saved
              resetMonitorsPagination();
              
              // Refresh the monitors list
              mutate('/api/user/monitors');
            } else {
              // Check if the error is because the URL is already being monitored
              if (response.status === 409) {
                toast.error(`URL ${urlData.url} is already being monitored`);
                errorCount++;
              } else {
                throw new Error(responseData.error || 'Failed to save URL');
              }
            }
          } else {
            // For non-logged in users, just count the successful health check
            successCount++;
          }
          
          // Update progress toast
          toast.loading(
            `Processed ${successCount + errorCount}/${urls.length} URLs (${successCount} successful, ${errorCount} failed)`,
            { id: toastId }
          );
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
      
      // Update the final toast based on results
      if (errorCount === 0) {
        toast.success(`Successfully processed ${successCount} URL${successCount !== 1 ? 's' : ''}`, { id: toastId });
      } else if (successCount === 0) {
        toast.error(`Failed to process all ${errorCount} URL${errorCount !== 1 ? 's' : ''}`, { id: toastId });
      } else {
        toast.success(`Processed ${successCount + errorCount} URL${successCount + errorCount !== 1 ? 's' : ''} (${successCount} successful, ${errorCount} failed)`, { id: toastId });
      }
      
      // Reset the form if all URLs were successful
      if (errorCount === 0) {
        setUrls([{ url: '', interval: '5m' }]);
      }
    } catch (error) {
      console.error('Error submitting URLs:', error);
      toast.error('An unexpected error occurred', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4 text-md">
        {urls.map((url, index) => (
          <div key={index} className="flex gap-4 items-end">
            <div className="flex-1">
              <label htmlFor={`url-${index}`} className="block font-medium text-white text-start">
                Website URL
              </label>
              <input
                type="url"
                id={`url-${index}`}
                value={url.url}
                onChange={(e) => handleUrlChange(index, 'url', e.target.value)}
                placeholder="https://example.com"
                required
                className="mt-1 block w-full hover:border-[#E3CF20]"
              />
            </div>

            <div className="flex-1">
              <label htmlFor={`interval-${index}`} className="block font-medium text-white text-start">
                Check Interval
              </label>
              <select
                id={`interval-${index}`}
                value={url.interval}
                onChange={(e) => handleUrlChange(index, 'interval', e.target.value)}
                className="mt-1 block w-full hover:border-[#E3CF20] custom-select min-w-[200px]"
              >
                <option value="once">Once (no monitoring)</option>
                <option value="5m">5 minutes</option>
                <option value="10m">10 minutes</option>
                <option value="30m">30 minutes</option>
                <option value="1h">1 hour</option>
              </select>
            </div>

            <div className="flex items-center h-10">
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => handleRemoveUrl(index)}
                  className="text-red-400 hover:text-red-300 rounded-md flex items-center justify-center w-10 h-10"
                  aria-label="Remove URL"
                >
                  <Trash2 size={20} strokeWidth={1.5} />
                </button>
              )}
              {index === 0 && <div className="w-10 h-10"></div>}
            </div>
          </div>
        ))}

        <div className="flex gap-4">
          <button
            type="button"
            onClick={handleAddUrl}
            className="px-4 py-2 text-md font-medium text-[#E3CF20] hover:text-[#d4c01c] border border-[#E3CF20] rounded-md hover:bg-[#2D2D2D] flex items-center justify-between"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <line x1="12" y1="5" x2="12" y2="19" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" />
  <line x1="5" y1="12" x2="19" y2="12" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" />
</svg> Add another URL
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 text-md font-medium text-[#121212] uppercase bg-[#E3CF20] rounded-md hover:bg-[#d4c01c] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {session ? 'Save & Monitor' : 'Check Now'}
          </button>
        </div>
      </form>

      {Object.entries(healthCheckResults).length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2 text-white">Check Results</h3>
          <div className="space-y-4">
            {Object.entries(healthCheckResults).map(([url, result]) => (
              <div key={url} className="p-4 border border-[#333333] bg-[#1E1E1E] rounded-md">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium text-white">{result.originalUrl || url}</h4>
                    <p className={`mt-1 text-md ${
                      result.status < 400 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      Status: {result.status < 400 ? 'UP' : 'DOWN'}
                    </p>
                  </div>
                  <div className="text-md text-white">
                    Response Time: {result.responseTime}ms
                  </div>
                </div>
                <p className="mt-2 text-md text-gray-400">
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
