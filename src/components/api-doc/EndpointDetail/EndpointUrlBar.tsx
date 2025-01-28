"use client";

import React from 'react';
import { Server } from '../types';
import { MethodBadge } from '../MethodBadge';

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
  const fullUrl = `${selectedServer || 'http://localhost'}${path}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(fullUrl);
  };

  return (
    <div>
      <div className="flex items-center gap-1.5 p-1.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-xs">
        <MethodBadge method={method} />
        {servers.length > 1 && (
          <div className="relative">
            <select
              value={selectedServer}
              onChange={(e) => onServerChange(e.target.value)}
              className="block rounded-md border-0 py-0.5 pl-1.5 pr-5 text-gray-900 dark:text-gray-100
                bg-transparent
                text-xs leading-4
                cursor-pointer
                appearance-none
                focus:outline-none
                min-w-[120px]"
            >
              {servers.map((server) => (
                <option
                  key={server.url}
                  value={server.url}
                  className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
                >
                  {server.description || server.url}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1">
              <svg
                className="h-3 w-3 text-gray-400 dark:text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        )}
        <div className="flex-1 flex items-center">
          <code className="text-gray-900 dark:text-gray-100 font-mono text-xs">{decodeURIComponent(path)}</code>
        </div>
        <button
          onClick={copyToClipboard}
          className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 
                   focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 dark:focus:ring-indigo-400
                   rounded-md transition-colors duration-200"
          title="Copy URL"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
      </div>
      <div className="text-gray-500 dark:text-gray-400 text-xs font-mono truncate mt-1">
        {decodeURIComponent(fullUrl)}
      </div>
    </div>
  );
};

export default EndpointUrlBar;
