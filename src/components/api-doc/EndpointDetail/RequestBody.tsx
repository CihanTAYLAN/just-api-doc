"use client";

import React from 'react';
import { ApiEndpoint, RequestBody as RequestBodyType, MediaType, Reference } from '../types';

interface RequestBodyProps {
  requestBody: NonNullable<ApiEndpoint['requestBody']>;
  onDataChange?: (data: any) => void;
  value?: any;
}

export const RequestBody: React.FC<RequestBodyProps> = ({ requestBody, onDataChange, value }) => {
  if (!requestBody) return null;

  const isRequestBody = (obj: any): obj is RequestBodyType => {
    return obj && 'content' in obj;
  };

  if (!isRequestBody(requestBody)) {
    // Handle reference case
    return null;
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">Request Body</h3>
      {onDataChange ? (
        <textarea
          value={JSON.stringify(value, null, 2)}
          onChange={(e) => {
            try {
              onDataChange(JSON.parse(e.target.value));
            } catch (error) {
              // Invalid JSON, ignore
            }
          }}
          className="w-full h-20 text-sm font-mono border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2"
        />
      ) : (
        Object.entries(requestBody.content || {}).map(([contentType, content]) => (
          <div key={contentType} className="space-y-2">
            <div className="text-sm font-mono text-gray-500">{contentType}</div>
            {(content as MediaType).schema && (
              <pre className="text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded overflow-auto">
                {JSON.stringify((content as MediaType).schema, null, 2)}
              </pre>
            )}
            {(content as MediaType).example && (
              <div className="space-y-1">
                <div className="text-sm font-medium">Example:</div>
                <pre className="text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded overflow-auto">
                  {JSON.stringify((content as MediaType).example, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};
