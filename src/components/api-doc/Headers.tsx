"use client";

import React from 'react';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';

interface Header {
  key: string;
  value: string;
}

interface HeadersProps {
  headers: Header[];
  onHeaderChange: (headers: Header[]) => void;
}

export const Headers: React.FC<HeadersProps> = ({
  headers,
  onHeaderChange
}) => {
  return (
    <>
      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Headers</h3>
      <div className="mt-2 space-y-2">
        {headers.map((header, index) => {
          const isContentType = header.key.toLowerCase() === 'content-type';
          return (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                value={header.key}
                onChange={(e) => onHeaderChange(headers.map((h, i) => i === index ? { ...h, key: e.target.value } : h))}
                placeholder="Key"
                className={`block w-1/2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 py-1 ${isContentType ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''}`}
                disabled={isContentType}
                readOnly={isContentType}
              />
              <input
                type="text"
                value={header.value}
                onChange={(e) => onHeaderChange(headers.map((h, i) => i === index ? { ...h, value: e.target.value } : h))}
                placeholder="Value"
                className={`block w-1/2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 py-1 ${isContentType ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''}`}
                disabled={isContentType}
                readOnly={isContentType}
              />
              {isContentType ? (
                <div className="w-[58px]"></div>
              ) : (
                <button
                  onClick={() => onHeaderChange(headers.filter((h, i) => i !== index))}
                  className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Header Button */}
      <button
        onClick={() => {
          const newKey = '';
          if (newKey.toLowerCase() === 'content-type' &&
            headers.some(h => h.key.toLowerCase() === 'content-type')) {
            return;
          }
          onHeaderChange([...headers, { key: '', value: '' }]);
        }}
        className="mt-1.5 inline-flex items-center px-2 py-1 text-xs font-medium rounded text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
      >
        <PlusIcon className="h-4 w-4 mr-1" />
        Add Header
      </button>
    </>
  );
};
