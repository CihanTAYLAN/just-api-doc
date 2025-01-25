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
  sending?: boolean;
}

export const ResponseSection: React.FC<ResponseSectionProps> = ({ response, sending }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Response</h3>
        <div className="flex items-center gap-2">
          {sending ? (
            <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-800/20 dark:text-blue-400">
              Sending...
            </span>
          ) : response?.status && (
            <span className={`px-3 py-1 text-sm font-medium rounded-full
              ${response?.status < 300
                ? 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400'
                : response?.status < 400
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-400'
                  : 'bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-400'
              }`}
            >
              Status: {response?.status}
            </span>
          )}
        </div>
      </div>
      <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <JsonEditor
          value={typeof response?.data === 'string' ? response?.data : JSON.stringify(response?.data, null, 2)}
          onChange={() => { }}
          height="300px"
          is_editable={false}
        />
      </div>
    </motion.div>
  );
};
