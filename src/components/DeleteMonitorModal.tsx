'use client';
import React, { useState } from 'react';
import Modal from './Modal';
import { UrlMonitor } from '@/types/monitor';

interface DeleteMonitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  monitor: UrlMonitor | null;
  onDelete: () => Promise<void>;
}

export default function DeleteMonitorModal({ isOpen, onClose, monitor, onDelete }: DeleteMonitorModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!monitor) return;
    
    setIsDeleting(true);
    try {
      await onDelete();
      onClose();
    } catch (error) {
      console.error('Error deleting monitor:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Monitor">
      <div className="space-y-4">
        <p className="text-white">
          Are you sure you want to delete the monitor for:
        </p>
        <p className="text-[#E3CF20] font-medium break-all">
          {monitor?.url}
        </p>
        <p className="text-gray-400 text-sm">
          This action cannot be undone.
        </p>
        
        <div className="flex justify-end space-x-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#2D2D2D] text-white rounded-md hover:bg-[#3D3D3D] focus:outline-none"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
