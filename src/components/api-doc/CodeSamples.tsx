"use client";

import React, { useState, useMemo } from 'react';
import { generateCodeSample } from './utils';

interface CodeSamplesProps {
  path: string;
  method: string;
  parameters: any;
  requestBody: any;
}

export const CodeSamples: React.FC<CodeSamplesProps> = ({ path, method, parameters, requestBody }) => {
  const [selectedCodeLang, setSelectedCodeLang] = useState('Node / Axios');
  const codeSamples = useMemo(() => 
    generateCodeSample(path, method, parameters, requestBody),
    [path, method, parameters, requestBody]
  );

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">Code Samples</h3>
      <div className="space-y-2">
        <select
          value={selectedCodeLang}
          onChange={(e) => setSelectedCodeLang(e.target.value)}
          className="text-sm border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-2 py-1"
        >
          <option>Node / Axios</option>
          <option>Python / Requests</option>
          <option>cURL</option>
        </select>
        <pre className="text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded overflow-auto">
          {codeSamples[selectedCodeLang]}
        </pre>
      </div>
    </div>
  );
};
