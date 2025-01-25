"use client";

import React from 'react';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Header {
  key: string;
  value: string;
  required?: boolean;
}

interface HeadersProps {
  headers: Header[];
  onHeaderChange: (headers: Header[]) => void;
}

export const Headers: React.FC<HeadersProps> = ({
  headers,
  onHeaderChange
}) => {
  const handleAddHeader = () => {
    onHeaderChange([...headers, { key: '', value: '', required: false }]);
  };

  const handleRemoveHeader = (index: number) => {
    const header = headers[index];
    // Don't allow removing content-type or required headers
    if (header.key.toLowerCase() === 'content-type' || header.required) {
      return;
    }
    const newHeaders = [...headers];
    newHeaders.splice(index, 1);
    onHeaderChange(newHeaders);
  };

  const handleHeaderChange = (index: number, field: 'key' | 'value', value: string) => {
    const header = headers[index];
    // Don't allow changing content-type header key or required header keys
    if (field === 'key' && (header.key.toLowerCase() === 'content-type' || header.required)) {
      return;
    }

    const newHeaders = headers.map((h, i) => {
      if (i === index) {
        return { ...h, [field]: value };
      }
      return h;
    });
    onHeaderChange(newHeaders);
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Headers</h3>

      </div>

      <div className="space-y-2">
        {headers.map((header, index) => {
          const isContentType = header.key.toLowerCase() === 'content-type';
          const isRequired = header.required;
          const isReadOnly = isContentType || isRequired;

          return (
            <div key={index} className="flex gap-2 items-center group">
              <div className="relative flex-1 flex gap-2">
                <input
                  type="text"
                  value={header.key}
                  onChange={(e) => handleHeaderChange(index, 'key', e.target.value)}
                  placeholder="Header Name"
                  className={`block w-1/3 rounded-md border-gray-300 dark:border-gray-700 shadow-sm 
                           focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm
                           dark:bg-gray-800 dark:text-gray-100
                           ${isReadOnly ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''}`}
                  disabled={isReadOnly}
                />
                <input
                  type="text"
                  value={header.value}
                  onChange={(e) => handleHeaderChange(index, 'value', e.target.value)}
                  placeholder="Value"
                  className={`block w-2/3 rounded-md border-gray-300 dark:border-gray-700 shadow-sm 
                           focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm
                           dark:bg-gray-800 dark:text-gray-100
                           ${isContentType ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''}`}
                  disabled={isContentType}
                />

                {isRequired ? (
                  <div className="w-[64px] text-center">
                    <span className="text-xs text-red-500">*</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleRemoveHeader(index)}
                    type="button"
                    disabled={isReadOnly}
                    className={`inline-flex items-center p-1 border border-transparent rounded-full 
                       ${isReadOnly
                        ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                        : 'text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30'}
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between items-center">
        <button
          onClick={handleAddHeader}
          type="button"
          className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded 
                   text-indigo-700 bg-indigo-100 hover:bg-indigo-200 dark:text-indigo-100 dark:bg-indigo-900 
                   dark:hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          Add Header
        </button>
      </div>

    </div>
  );
};
