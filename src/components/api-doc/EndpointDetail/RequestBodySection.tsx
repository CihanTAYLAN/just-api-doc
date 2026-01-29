/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";;
import React, { useCallback, useMemo } from 'react';
import { ApiEndpoint, ApiSpec } from '../types';
import { TEXT_STYLES } from './styles';
import { OpenAPIV3 } from 'openapi-types';
import { generateExampleFromSchema } from '../utils/schemaToExample';
import { resolveSchema } from '../utils/resolveSchema';
import { JsonEditor } from './JsonEditor';

interface RequestBodySectionProps {
  endpoint: ApiEndpoint;
  spec: ApiSpec;
  requestBody: unknown;
  setRequestBody: (requestBody: Record<string, unknown> | null) => void;
  selectedContentType: string;
  setSelectedContentType: (contentType: string) => void;
  formData: Record<string, string>;
  onFormDataChange: (formData: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
  children?: React.ReactNode;
}

export const RequestBodySection: React.FC<RequestBodySectionProps> = ({
  endpoint,
  spec,
  requestBody,
  setRequestBody,
  selectedContentType,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setSelectedContentType,
  formData,
  onFormDataChange,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  children
}) => {
  // Handle form data changes
  const handleFormDataChange = useCallback((key: string, value: string) => {
    onFormDataChange((prev: Record<string, string>) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const renderRequestBody = useMemo(() => {
    if (!endpoint.requestBody) return null;

    // Check if it's a reference object
    if ('$ref' in endpoint.requestBody) {
      // Handle reference object if needed
      return null;
    }

    // At this point TypeScript knows it's a RequestBody
    if (!endpoint.requestBody.content || !selectedContentType) return null;

    const content = endpoint.requestBody.content[selectedContentType];
    if (!content) return null;

    switch (selectedContentType) {
      case 'application/json':
        const jsonValue = (() => {
          try {
            if (requestBody) {
              return typeof requestBody === 'string'
                ? requestBody
                : JSON.stringify(requestBody, null, 2);
            }

            // Generate example from schema if no request body
            const schema = content.schema;
            if (!schema) return '{}';

            const resolvedSchema = resolveSchema(schema, spec as any);
            const example = generateExampleFromSchema(resolvedSchema || undefined);
            if (!requestBody) {
              setRequestBody((example as Record<string, unknown>) || null);
            }
            return JSON.stringify(example, null, 2);
          } catch {
            // console.error('Error preparing JSON:', error);
          }
        })();

        return (
          <JsonEditor
            value={jsonValue ?? ''}
            onChange={(value) => {
              try {
                const parsedJson = JSON.parse(value);
                setRequestBody(parsedJson);
              } catch {
                // setRequestBody({});
              }
            }}
            height="200px"
          />
        );

      case 'multipart/form-data':
      case 'application/x-www-form-urlencoded': {
        const schema = content.schema as OpenAPIV3.SchemaObject;
        const properties = schema.properties || {};

        return (
          <div className="space-y-4">
            <div className="space-y-3">
              {Object.entries(properties).map(([key, prop]) => {
                const property = prop as OpenAPIV3.SchemaObject;
                return (
                  <div key={key} className="flex items-center gap-2 min-w-[200px] group">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1 whitespace-nowrap">
                      {key}
                      {schema.required?.includes(key) && <span className="text-red-500">*</span>}
                    </label>
                    {selectedContentType === 'multipart/form-data' && property.type === 'string' && property.format === 'binary' ? (
                      <input
                        type="file"
                        className="block w-full text-sm text-gray-500 dark:text-gray-400
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-md file:border-0
                          file:text-sm file:font-semibold
                          file:bg-blue-50 file:text-blue-700
                          dark:file:bg-blue-900/20 dark:file:text-blue-200
                          hover:file:bg-blue-100 dark:hover:file:bg-blue-900/30"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFormDataChange(key, file.name);
                          }
                        }}
                      />
                    ) : (
                      <input
                        type={property.format === 'password' ? 'password' : 'text'}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-800 text-sm"
                        value={formData[key] || ''}
                        onChange={(e) => handleFormDataChange(key, e.target.value)}
                        placeholder={property.description || `Enter ${key}`}
                      />
                    )}
                    {property.description && (
                      <div className="hidden group-hover:block absolute bg-gray-800 text-white text-xs rounded p-2 z-10 mt-1 -translate-y-12">
                        {property.description}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      default:
        return (
          <div className="space-y-4">
            <div className="relative">
              <textarea
                className="w-full h-64 rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-800 text-sm font-mono"
                value={requestBody ? JSON.stringify(requestBody, null, 2) : ''}
                onChange={(e) => {
                  try {
                    const value = e.target.value;
                    if (!value.trim()) {
                      setRequestBody(null);
                    } else {
                      const parsedJson = JSON.parse(value);
                      setRequestBody(parsedJson);
                    }
                  } catch {
                    setRequestBody({});
                  }
                }}
                placeholder={`Enter ${selectedContentType} request body`}
              />
            </div>
          </div>
        );
    }
  }, [endpoint.requestBody,
    selectedContentType,
    requestBody,
    spec,
    formData,
    handleFormDataChange,
    setRequestBody,
  ]);

  return (
    <div>
      <h3 className={TEXT_STYLES.subheading}>Request Body</h3>
      <div className="mt-2 space-y-2">
        {renderRequestBody}
      </div>
    </div>
  );
};
