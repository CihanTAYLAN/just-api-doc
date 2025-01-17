"use client";

import React from 'react';
import { ApiEndpoint } from './types';

interface ParametersProps {
  parameters: ApiEndpoint['parameters'];
}

export const Parameters: React.FC<ParametersProps> = ({ parameters }) => {
  if (!parameters?.length) return null;
  
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">Parameters</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800">
              <th className="px-2 py-1 text-left">Name</th>
              <th className="px-2 py-1 text-left">In</th>
              <th className="px-2 py-1 text-left">Type</th>
              <th className="px-2 py-1 text-left">Required</th>
              <th className="px-2 py-1 text-left">Description</th>
            </tr>
          </thead>
          <tbody>
            {parameters.map((param, index) => (
              <tr key={index} className="border-t border-gray-200 dark:border-gray-700">
                <td className="px-2 py-1 font-mono">{param.name}</td>
                <td className="px-2 py-1">{param.in}</td>
                <td className="px-2 py-1">{param.schema?.type}</td>
                <td className="px-2 py-1">{param.required ? 'Yes' : 'No'}</td>
                <td className="px-2 py-1">{param.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
