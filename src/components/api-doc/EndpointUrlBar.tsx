"use client";

import React from 'react';
import { Server } from './types';

interface EndpointUrlBarProps {
  servers: Server[];
  selectedServer: string;
  onServerChange: (url: string) => void;
  path: string;
  method: string;
}

export const EndpointUrlBar: React.FC<EndpointUrlBarProps> = ({
  servers,
  selectedServer,
  onServerChange,
  path,
  method
}) => {
  const fullUrl = `${selectedServer}${path}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(fullUrl);
  };

  return (
    <>
      <div className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-sm">
        <select
          value={selectedServer}
          onChange={(e) => onServerChange(e.target.value)}
          className="bg-transparent border-none text-gray-600 dark:text-gray-300 focus:ring-0 text-sm py-0"
        >
          {servers.map((server) => (
            <option key={server.url} value={server.url}>
              {server.description || server.url}
            </option>
          ))}
        </select>
        <div className="flex-1 flex items-center">
          <code className="text-gray-900 dark:text-gray-100 font-mono">{path}</code>
        </div>
        <button
          onClick={copyToClipboard}
          className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          title="Copy URL"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
      </div>
      <div className="text-gray-500 dark:text-gray-400 text-sm font-mono truncate mt-1">{fullUrl}</div>
    </>
  );
};
