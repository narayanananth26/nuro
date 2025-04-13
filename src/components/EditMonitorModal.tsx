'use client';
import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { UrlMonitor } from '@/types/monitor';
import LoadingButton from './ui/LoadingButton';

interface EditMonitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  monitor: UrlMonitor | null;
  onSave: (url: string, interval: number) => Promise<void>;
}

export default function EditMonitorModal({ isOpen, onClose, monitor, onSave }: EditMonitorModalProps) {
  const [url, setUrl] = useState('');
  const [interval, setInterval] = useState<number>(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when monitor changes
  useEffect(() => {
    if (monitor) {
      setUrl(monitor.url);
      
      // Get interval from the most recent log or use monitor.interval
      if (monitor.logs && monitor.logs.length > 0) {
        const latestLog = monitor.logs[monitor.logs.length - 1];
        setInterval(latestLog.interval);
      } else if (typeof monitor.interval === 'number') {
        setInterval(monitor.interval);
      } else {
        setInterval(5); // Default fallback
      }
    }
  }, [monitor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!monitor) return;
    
    setIsSubmitting(true);
    try {
      await onSave(url, interval);
      onClose();
    } catch (error) {
      console.error('Error saving monitor:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Monitor">
      <form onSubmit={handleSubmit} className="space-y-4 font-[Fira_Sans]">
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-300 mb-1 text-start">
            URL
          </label>
          <input
            type="url"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full px-3 py-2 bg-[#121212] border border-[#333333] rounded-md text-white focus:outline-none focus:ring-1 focus:ring-[#E3CF20] focus:border-[#E3CF20]"
            placeholder="https://example.com"
            required
          />
        </div>
        
        <div>
          <label htmlFor="interval" className="block text-sm font-medium text-gray-300 mb-1 text-start">
            Check Interval
          </label>
          <select
            id="interval"
            value={interval}
            onChange={(e) => setInterval(Number(e.target.value))}
            className="w-full px-3 py-2 bg-[#121212] border border-[#333333] rounded-md text-white focus:outline-none focus:ring-1 focus:ring-[#E3CF20] focus:border-[#E3CF20]"
            required
          >
            <option value="0">Once (no monitoring)</option>
            <option value="5">5 minutes</option>
            <option value="10">10 minutes</option>
            <option value="30">30 minutes</option>
            <option value="60">1 hour</option>
            <option value="120">2 hours</option>
            <option value="360">6 hours</option>
            <option value="720">12 hours</option>
            <option value="1440">24 hours</option>
          </select>
        </div>
        
        <div className="flex justify-end space-x-3 pt-2">
          <LoadingButton
            type="button"
            onClick={onClose}
            variant="secondary"
            size="md"
          >
            Cancel
          </LoadingButton>
          <LoadingButton
            type="submit"
            loading={isSubmitting}
            variant="primary"
            size="md"
          >
            Save Changes
          </LoadingButton>
        </div>
      </form>
    </Modal>
  );
}
