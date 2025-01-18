"use client";

import React, { useState, useEffect } from 'react';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Header {
  key: string;
  value: string;
}

interface HeaderManagerProps {
  headers: Header[];
  onChange: (headers: Header[]) => void;
  defaultHeaders?: Header[];
}

export const HeaderManager: React.FC<HeaderManagerProps> = ({
  headers,
  onChange,
  defaultHeaders = []
}) => {
  const [newHeaderKey, setNewHeaderKey] = useState('');
  const [newHeaderValue, setNewHeaderValue] = useState('');

  // Load headers from localStorage on mount
  useEffect(() => {
    const savedHeaders = localStorage.getItem('api-headers');
    if (savedHeaders) {
      try {
        const parsedHeaders = JSON.parse(savedHeaders);
        // Merge saved headers with current headers
        const mergedHeaders = [...headers];
        parsedHeaders.forEach((savedHeader: Header) => {
          const exists = mergedHeaders.some(h => h.key.toLowerCase() === savedHeader.key.toLowerCase());
          if (!exists) {
            mergedHeaders.push(savedHeader);
          }
        });
        onChange(mergedHeaders);
      } catch (error) {
        console.error('Error parsing saved headers:', error);
      }
    }
  }, []);

  const addHeader = () => {
    if (newHeaderKey.trim()) {
      const newHeaders = [...headers, { key: newHeaderKey.trim(), value: newHeaderValue.trim() }];
      localStorage.setItem('api-headers', JSON.stringify(newHeaders));
      onChange(newHeaders);
      setNewHeaderKey('');
      setNewHeaderValue('');
    }
  };

  const removeHeader = (index: number) => {
    const newHeaders = [...headers];
    newHeaders.splice(index, 1);
    localStorage.setItem('api-headers', JSON.stringify(newHeaders));
    onChange(newHeaders);
  };

  const updateHeader = (index: number, field: 'key' | 'value', value: string) => {
    const newHeaders = [...headers];
    newHeaders[index] = { ...newHeaders[index], [field]: value };
    localStorage.setItem('api-headers', JSON.stringify(newHeaders));
    onChange(newHeaders);
  };

  const resetToDefault = () => {
    localStorage.setItem('api-headers', JSON.stringify(defaultHeaders));
    onChange(defaultHeaders);
  };

  return (
    <div className="space-y-2">
      {/* Existing Headers */}
      <div className="space-y-2">
        {headers.map((header, index) => (
          <div key={index} className="flex items-center space-x-2">
            <input
              type="text"
              value={header.key}
              onChange={(e) => updateHeader(index, 'key', e.target.value)}
              placeholder="Header Key"
              className="flex-1 min-w-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-sm"
            />
            <input
              type="text"
              value={header.value}
              onChange={(e) => updateHeader(index, 'value', e.target.value)}
              placeholder="Value"
              className="flex-1 min-w-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-sm"
            />
            <button
              onClick={() => removeHeader(index)}
              className="p-1 text-gray-500 hover:text-red-500 dark:text-gray-400"
              title="Remove Header"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Add New Header */}
      <div className="flex items-center space-x-2">
        <input
          type="text"
          value={newHeaderKey}
          onChange={(e) => setNewHeaderKey(e.target.value)}
          placeholder="New Header Key"
          className="flex-1 min-w-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-sm"
        />
        <input
          type="text"
          value={newHeaderValue}
          onChange={(e) => setNewHeaderValue(e.target.value)}
          placeholder="Value"
          className="flex-1 min-w-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-sm"
        />
        <button
          onClick={addHeader}
          disabled={!newHeaderKey.trim()}
          className="p-1 text-blue-500 hover:text-blue-600 disabled:text-gray-400"
          title="Add Header"
        >
          <PlusIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Actions */}
      {defaultHeaders.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={resetToDefault}
            className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400"
          >
            Reset to Default Headers
          </button>
        </div>
      )}
    </div>
  );
};
