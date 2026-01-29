/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";;

import { FC, useEffect, useMemo, useState } from "react";
import { ApiEndpoint, ApiSpec } from "../../types";
import classNames from "classnames";
import { formatSchemaType, resolveSchema } from "../../utils/resolveSchema";

interface DocumentationSectionRequestProps {
  endpoint: ApiEndpoint;
  spec: ApiSpec;
}

// Schema properties component for reusability
interface SchemaPropertiesProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: any;
  level?: number;
}

const SchemaProperties = ({ schema, level = 0 }: SchemaPropertiesProps) => {
  const [expandedProps, setExpandedProps] = useState<Record<string, boolean>>({});

  const toggleProp = (propName: string) => {
    setExpandedProps(prev => ({
      ...prev,
      [propName]: !prev[propName]
    }));
  };

  if (!schema?.properties) {
    return null;
  }

  return (
    <div className={classNames("space-y-2", { "ml-4": level > 0 })}>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {Object.entries(schema.properties).map(([propName, propSchema]: [string, any]) => {
        const hasNestedProperties = propSchema.type === 'object' && propSchema.properties;
        const isExpanded = expandedProps[propName];

        return (
          <div key={propName} className="flex flex-col space-y-1">
            <div
              className={classNames(
                "flex items-center gap-1.5",
                hasNestedProperties && "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded"
              )}
              onClick={() => hasNestedProperties && toggleProp(propName)}
            >
              {hasNestedProperties && (
                <svg
                  className={classNames(
                    "w-3 h-3 transition-transform",
                    isExpanded ? "transform rotate-90" : ""
                  )}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              )}
              <div className="flex items-center gap-1.5 w-full">
                <div className="font-medium text-xs min-w-30">{propName}</div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400">
                  {formatSchemaType(propSchema)}
                </div>
                {schema.required?.includes(propName) && (
                  <div className="bg-red-100 text-red-800 text-[10px] font-medium px-1.5 py-0.5 rounded-sm dark:bg-red-900 dark:text-red-300 ml-auto">
                    Required
                  </div>
                )}
              </div>
            </div>

            {propSchema.description && (
              <div className="text-xs text-gray-600 dark:text-gray-400 ml-4">
                {propSchema.description}
                {hasNestedProperties && isExpanded && (
                  <p className="mt-1 border-l-2 border-gray-200 dark:border-gray-700">
                    <SchemaProperties schema={propSchema} level={level + 1} />
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const DocumentationSectionRequest: FC<DocumentationSectionRequestProps> = ({
  endpoint,
  spec,
}) => {
  const [activeTab, setActiveTab] = useState<'parameters' | 'body' | 'headers'>('parameters');

  const resolvedParameters = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params = (endpoint.parameters?.filter((param: any) => param.in === 'path' || param.in === 'query') || []) as any[];
    return params.map(param => {
      if ('$ref' in param) {
        return resolveSchema(param, spec as any);
      }
      return param;
    }) || [];
  }, [endpoint.parameters, spec]);

  const resolvedRequestBody = useMemo(() => {
    if (!endpoint.requestBody) return null;

    if ('$ref' in endpoint.requestBody) {
      return resolveSchema(endpoint.requestBody, spec as any);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resolvedContent: Record<string, unknown> = {};
    if (endpoint.requestBody.content) {
      Object.entries(endpoint.requestBody.content).forEach(([contentType, content]) => {
        resolvedContent[contentType] = {
          ...content,
          schema: content.schema ? resolveSchema(content.schema, spec as any) : null,
        };
      });
    }
    return {
      ...endpoint.requestBody,
      content: resolvedContent,
    };
  }, [endpoint.requestBody, spec]);

  const resolvedHeaders = useMemo(() => {
    const rslvedHdrs = (endpoint.parameters?.filter((param: any) => param.in === 'header')?.map((param: any) => {
      if ('$ref' in param) {
        return resolveSchema(param, spec as any);
      }
      return param;
    }) || []) as any[];

    endpoint.security?.forEach((securityRequirement) => {
      Object.keys(securityRequirement).forEach(schemeName => {
        const scheme = spec.components?.securitySchemes?.[schemeName];
        if ((scheme as any)?.in === 'header') {
          rslvedHdrs.push(resolveSchema(scheme as any, spec as any));
        }
      });
    });

    return rslvedHdrs;
  }, [endpoint.parameters, spec]);

  const hasParameters = resolvedParameters.length > 0;
  const hasRequestBody = !!(resolvedRequestBody as any)?.content;
  const hasHeaders = resolvedHeaders.length > 0;

  useEffect(() => {
    if (hasRequestBody) {
      setActiveTab('body');
    } else if (hasParameters) {
      setActiveTab('parameters');
    } else {
      setActiveTab('headers');
    }
  }, [endpoint, spec]);




  return (
    <>
      {(hasHeaders || hasParameters || hasRequestBody) && (
        <div className="space-y-6 mb-4">
          <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Request</h3>

            {/* Tab Selector */}
            <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700">
              {hasRequestBody && (
                <button
                  onClick={() => setActiveTab('body')}
                  className={classNames(
                    "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                    activeTab === 'body'
                      ? "border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  )}
                >
                  Body
                </button>
              )}
              {hasParameters && (
                <button
                  onClick={() => setActiveTab('parameters')}
                  className={classNames(
                    "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                    activeTab === 'parameters'
                      ? "border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  )}
                >
                  Parameters
                </button>
              )}
              {hasHeaders && (
                <button
                  onClick={() => setActiveTab('headers')}
                  className={classNames(
                    "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                    activeTab === 'headers'
                      ? "border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  )}
                >
                  Headers
                </button>
              )}
            </div>
          </div>

          {/* Parameters Tab */}
          {activeTab === 'parameters' && hasParameters && (
            <div className="space-y-4">
              {resolvedParameters
                .filter(param => param.in !== 'header')
                .map((param, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {param.name}
                          <span className="ml-2 text-xs text-gray-500">({param.in})</span>
                        </span>
                        {param.required && (
                          <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded dark:bg-red-900 dark:text-red-300">
                            Required
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-4">
                      {param.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {param.description}
                        </p>
                      )}
                      <div className="text-xs">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="font-medium">Type: </span>
                            <span className="text-gray-600 dark:text-gray-400">
                              {formatSchemaType(param.schema)}
                            </span>
                          </div>
                          {param.schema?.default !== undefined && (
                            <div>
                              <span className="font-medium">Default: </span>
                              <span className="text-gray-600 dark:text-gray-400">
                                {JSON.stringify(param.schema.default)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Request Body Tab */}
          {activeTab === 'body' && hasRequestBody && (
            <div className="space-y-4">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {Object.entries((resolvedRequestBody as any).content).map(([contentType, content]: [string, any]) => (
                <div key={contentType} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Content-Type: {contentType}
                    </span>
                  </div>
                  {content.schema && (
                    <div className="p-4">
                      {content.schema.type === "object" && content.schema.properties && (
                        <SchemaProperties schema={content.schema} />
                      )}
                      {content.schema.type === "array" && content.schema.items && (
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              Array of {formatSchemaType(content.schema.items)}
                            </span>
                          </div>
                          {content.schema.items.type === "object" && content.schema.items.properties && (
                            <div className="mt-2">
                              <SchemaProperties schema={content.schema.items} />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Headers Tab */}
          {activeTab === 'headers' && hasHeaders && (
            <div className="space-y-4">
              {resolvedHeaders
                .filter(param => param.in === 'header')
                .map((header, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {header.name}
                        </span>
                        {header.required && (
                          <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded dark:bg-red-900 dark:text-red-300">
                            Required
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-4">
                      {header.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {header.description}
                        </p>
                      )}
                      <div className="text-xs">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="font-medium">Type: </span>
                            <span className="text-gray-600 dark:text-gray-400">
                              {formatSchemaType(header.schema)}
                            </span>
                          </div>
                          {header.schema?.default !== undefined && (
                            <div>
                              <span className="font-medium">Default: </span>
                              <span className="text-gray-600 dark:text-gray-400">
                                {JSON.stringify(header.schema.default)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default DocumentationSectionRequest;
