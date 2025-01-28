"use client";;
import React from 'react';
import { JsonEditor } from './JsonEditor';
import { TEXT_STYLES } from './styles';

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
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className={TEXT_STYLES.subheading}>Response</h3>
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
    </div>
  );
};
