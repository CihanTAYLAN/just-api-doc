"use client";

import React, { useState, useCallback } from 'react';
import { useTheme } from 'next-themes';
import axios from 'axios';
import { ApiEndpoint, ApiSpec } from './types';
import { MethodBadge } from './MethodBadge';
import { Parameters } from './Parameters';
import { RequestBody } from './RequestBody';
import { Responses } from './Responses';
import { CodeSamples } from './CodeSamples';

interface EndpointDetailProps {
  path: string;
  method: string;
  endpoint: ApiEndpoint;
  spec: ApiSpec;
}

export const EndpointDetail: React.FC<EndpointDetailProps> = ({
  path,
  method,
  endpoint,
  spec
}) => {
  const { theme } = useTheme();
  const [selectedTab, setSelectedTab] = useState<'docs' | 'try'>('docs');
  const [selectedServer, setSelectedServer] = useState<string>(spec.servers?.[0]?.url || '');
  const [requestData, setRequestData] = useState<any>({});
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fullUrl = `${selectedServer}${path}`;

  const handleSendRequest = useCallback(async () => {
    setLoading(true);
    try {
      const requestConfig = {
        url: fullUrl,
        method: method.toLowerCase(),
        data: requestData,
        headers: {
          'Content-Type': 'application/json',
        }
      };

      const { data } = await axios(requestConfig).catch(async (error) => {
        console.log('Direct request failed, trying proxy:', error.message);
        return await axios.post("/api/proxy", requestConfig);
      });

      setResponse(data);
      setSelectedTab('try');
    } catch (error) {
      console.error('Request failed:', error);
      if (axios.isAxiosError(error)) {
        setResponse({
          error: error.response?.data?.error || error.message
        });
      } else {
        setResponse({
          error: 'An unexpected error occurred'
        });
      }
    } finally {
      setLoading(false);
    }
  }, [fullUrl, method, requestData]);

  return (
    <div className="h-full flex flex-col">
      {/* Compact Header */}
      <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center space-x-2">
          <MethodBadge method={method} />
          <code className="text-sm font-mono text-gray-900 dark:text-gray-100">{path}</code>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <select
            value={selectedTab}
            onChange={(e) => setSelectedTab(e.target.value as 'docs' | 'try')}
            className="text-xs border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-2 py-1"
          >
            <option value="docs">Documentation</option>
            <option value="try">Try It</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {selectedTab === 'docs' ? (
          <div className="p-4 space-y-4">
            {/* Description */}
            {endpoint.description && (
              <div className="text-sm text-gray-700 dark:text-gray-300">
                {endpoint.description}
              </div>
            )}

            {/* Authentication */}
            {endpoint.security && endpoint.security.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Authentication</h3>
                <div className="text-sm space-y-1">
                  {endpoint.security.map((security, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <span className="text-gray-500">•</span>
                      <span>{Object.keys(security)[0]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Parameters parameters={endpoint.parameters} />
            <RequestBody requestBody={endpoint.requestBody} />
            <Responses responses={endpoint.responses} />
            <CodeSamples
              path={path}
              method={method}
              parameters={endpoint.parameters}
              requestBody={endpoint.requestBody?.content?.['application/json']?.schema}
            />
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Try It Form */}
            <div className="space-y-4">
              {/* Server Selection */}
              <div className="space-y-1">
                <label className="text-sm font-medium">Server</label>
                <select
                  value={selectedServer}
                  onChange={(e) => setSelectedServer(e.target.value)}
                  className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2"
                >
                  {spec.servers?.map((server, index) => (
                    <option key={index} value={server.url}>
                      {server.description || server.url}
                    </option>
                  ))}
                </select>
                <div className="text-xs text-gray-500">
                  Request URL: <code className="font-mono">{fullUrl}</code>
                </div>
              </div>

              <Parameters parameters={endpoint.parameters} />
              <RequestBody
                requestBody={endpoint.requestBody}
                onDataChange={setRequestData}
                value={requestData}
              />

              <button
                onClick={handleSendRequest}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Request'}
              </button>

              {/* Response */}
              {response && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Response</h3>
                  <pre className="text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded overflow-auto">
                    {JSON.stringify(response, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
