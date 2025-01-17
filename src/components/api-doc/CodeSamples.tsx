"use client";

import React, { useState } from 'react';

interface CodeSamplesProps {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: any;
}

export const CodeSamples: React.FC<CodeSamplesProps> = ({
  method,
  url,
  headers = {},
  body
}) => {
  const [activeTab, setActiveTab] = useState<'node' | 'python' | 'curl'>('node');

  const getNodeAxiosCode = () => {
    const code = [
      "const axios = require('axios');",
      "",
      "const config = {",
      `  method: '${method.toLowerCase()}',`,
      `  url: '${url}',`,
      "  headers: {",
      ...Object.entries(headers).map(([key, value]) => `    '${key}': '${value}',`),
      "  }",
      body ? `  data: ${JSON.stringify(body, null, 2).replace(/\n/g, '\n  ')}` : "",
      "};",
      "",
      "axios(config)",
      "  .then(response => {",
      "    console.log(JSON.stringify(response.data, null, 2));",
      "  })",
      "  .catch(error => {",
      "    console.error('Error:', error.response?.data || error.message);",
      "  });"
    ].filter(Boolean).join('\n');

    return code;
  };

  const getPythonRequestsCode = () => {
    const code = [
      "import requests",
      "import json",
      "",
      `url = '${url}'`,
      "",
      "headers = {",
      ...Object.entries(headers).map(([key, value]) => `    '${key}': '${value}',`),
      "}",
      "",
      body ? `data = ${JSON.stringify(body, null, 2)}` : "",
      "",
      "try:",
      `    response = requests.${method.toLowerCase()}(url, headers=headers${body ? ', json=data' : ''})`,
      "    response.raise_for_status()",
      "    print(json.dumps(response.json(), indent=2))",
      "except requests.exceptions.RequestException as e:",
      "    print(f'Error: {e}')"
    ].filter(Boolean).join('\n');

    return code;
  };

  const getCurlCode = () => {
    const code = [
      "curl -X " + method.toUpperCase(),
      ...Object.entries(headers).map(([key, value]) => `  -H '${key}: ${value}'`),
      body ? `  -d '${JSON.stringify(body)}'` : "",
      `  '${url}'`
    ].filter(Boolean).join(' \\\n');

    return code;
  };

  return (
    <div>
      {/* Language Tabs */}
      <div className="flex space-x-4 mb-4">
        <button
          onClick={() => setActiveTab('node')}
          className={`px-3 py-1.5 text-sm font-medium rounded ${
            activeTab === 'node'
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          Node / Axios
        </button>
        <button
          onClick={() => setActiveTab('python')}
          className={`px-3 py-1.5 text-sm font-medium rounded ${
            activeTab === 'python'
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          Python / Requests
        </button>
        <button
          onClick={() => setActiveTab('curl')}
          className={`px-3 py-1.5 text-sm font-medium rounded ${
            activeTab === 'curl'
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          cURL
        </button>
      </div>

      {/* Code Display */}
      <div className="relative">
        <pre className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 overflow-x-auto">
          <code className="text-sm font-mono">
            {activeTab === 'node' && getNodeAxiosCode()}
            {activeTab === 'python' && getPythonRequestsCode()}
            {activeTab === 'curl' && getCurlCode()}
          </code>
        </pre>
        <button
          onClick={() => {
            const code = activeTab === 'node' ? getNodeAxiosCode() :
                        activeTab === 'python' ? getPythonRequestsCode() :
                        getCurlCode();
            navigator.clipboard.writeText(code);
          }}
          className="absolute top-2 right-2 p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          title="Copy to clipboard"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
};
