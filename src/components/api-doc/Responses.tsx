"use client";

import React from 'react';
import { ApiEndpoint } from './types';

interface ResponsesProps {
  responses: NonNullable<ApiEndpoint['responses']>;
}

export const Responses: React.FC<ResponsesProps> = ({ responses }) => {
  if (!responses) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">Responses</h3>
      {Object.entries(responses).map(([status, response]) => (
        <div key={status} className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              status.startsWith('2') ? 'bg-green-100 text-green-800' :
              status.startsWith('4') ? 'bg-yellow-100 text-yellow-800' :
              status.startsWith('5') ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {status}
            </span>
            <span className="text-sm">{response.description}</span>
          </div>
          {response.content && Object.entries(response.content).map(([contentType, content]) => (
            <div key={contentType} className="space-y-1">
              <div className="text-sm font-mono text-gray-500">{contentType}</div>
              {content.schema && (
                <pre className="text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded overflow-auto">
                  {JSON.stringify(content.schema, null, 2)}
                </pre>
              )}
              {content.example && (
                <div className="space-y-1">
                  <div className="text-sm font-medium">Example:</div>
                  <pre className="text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded overflow-auto">
                    {JSON.stringify(content.example, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
