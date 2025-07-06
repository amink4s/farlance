// components/ui/Modal.tsx
"use client";

import React from 'react';

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export default function Modal({ isOpen, onClose, children }: ModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
      onClick={onClose} // Close modal when clicking outside content
    >
      <div
        className="bg-[var(--app-card-bg)] rounded-xl shadow-2xl overflow-hidden max-w-md w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()} // Prevent click inside modal from closing it
      >
        {/* Modal Header with Close Button */}
        <div className="flex justify-end p-3 border-b border-[var(--app-card-border)]">
          <button
            onClick={onClose}
            className="text-[var(--app-foreground-muted)] hover:text-[var(--app-foreground)] text-xl font-bold"
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>
        {/* Modal Content */}
        <div className="p-5 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}