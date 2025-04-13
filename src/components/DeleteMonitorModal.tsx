'use client';
import React, { useState } from 'react';
import Modal from './Modal';
import { UrlMonitor } from '@/types/monitor';
import LoadingButton from './ui/LoadingButton';

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
      <div className="space-y-4 font-[Fira_Sans]">
        <p className="text-white text-start">
          Are you sure you want to delete the monitor for:
        </p>
        <p className="text-[#E3CF20] font-medium break-all">
          {monitor?.url}
        </p>
        <p className="text-gray-400 text-sm text-start">
          This action cannot be undone.
        </p>
        
        <div className="flex justify-end space-x-3 pt-2">
          <LoadingButton
            onClick={onClose}
            variant="secondary"
            size="md"
          >
            Cancel
          </LoadingButton>
          <LoadingButton
            onClick={handleDelete}
            loading={isDeleting}
            variant="danger"
            size="md"
          >
            Delete
          </LoadingButton>
        </div>
      </div>
    </Modal>
  );
}
