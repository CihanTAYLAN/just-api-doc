"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { JsonEditor } from './JsonEditor';

interface ResponseSectionProps {
  response: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    data: unknown;
  };
}

export const ResponseSection: React.FC<ResponseSectionProps> = ({ response }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Response</h3>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 text-sm font-medium rounded-full
            ${response.status < 300
              ? 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400'
              : response.status < 400
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-400'
                : 'bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-400'
            }`}
          >
            Status: {response.status}
          </span>
          <button
            onClick={() => {
              const responseData = typeof response.data === 'string'
                ? response.data
                : JSON.stringify(response.data, null, 2);
              navigator.clipboard.writeText(responseData);
            }}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200
                     bg-gray-100 dark:bg-gray-800 rounded-lg transition-colors duration-200"
            title="Copy Response"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>
      <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <JsonEditor
          value={typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2)}
          onChange={() => { }}
          height="300px"
        />
      </div>
    </motion.div>
  );
};
