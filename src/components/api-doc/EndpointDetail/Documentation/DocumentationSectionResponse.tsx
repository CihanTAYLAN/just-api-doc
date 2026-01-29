/* eslint-disable @typescript-eslint/no-explicit-any */
import { FC, useMemo, useState } from "react";
import { ApiEndpoint, ApiSpec } from "../../types";
import classNames from "classnames";
import { formatSchemaType } from "../../utils/resolveSchema";

interface DocumentationSectionResponseProps {
  endpoint: ApiEndpoint;
  spec: ApiSpec;
}

// Schema referanslarını çözümler
const resolveSchemaRef = (schema: any, spec: ApiSpec): any => {
  if (!schema) return null;

  if (schema.$ref) {
    const ref = schema.$ref.replace("#/", "").split("/");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let resolvedSchema: any = spec;
    for (const path of ref) {
      resolvedSchema = resolvedSchema?.[path];
    }
    return resolveSchemaRef(resolvedSchema, spec);
  }

  if (schema.type === "array" && schema.items) {
    return {
      ...schema,
      items: resolveSchemaRef(schema.items, spec),
    };
  }

  if (schema.type === "object" && schema.properties) {
    const resolvedProperties: any = {};
    for (const [key, value] of Object.entries(schema.properties)) {
      resolvedProperties[key] = resolveSchemaRef(value as any, spec);
    }
    return {
      ...schema,
      properties: resolvedProperties,
    };
  }

  return schema;
};


// Şema özelliklerini recursive olarak render eder
interface SchemaPropertiesProps {
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
      {Object.entries(schema.properties).map(
        ([propName, propSchema]: [string, any]) => {
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

              {hasNestedProperties && isExpanded && (
                <div className="mt-1 border-l-2 border-gray-200 dark:border-gray-700">
                  <SchemaProperties schema={propSchema} level={level + 1} />
                </div>
              )}
            </div>
          );
        }
      )}
    </div>
  );
};

const DocumentationSectionResponse: FC<DocumentationSectionResponseProps> = ({
  endpoint,
  spec,
}) => {
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  const resolvedResponses = useMemo(() => {
    const responses: Record<string, any> = {};
    Object.entries(endpoint.responses).forEach(([code, response]) => {
      if ("$ref" in response) {
        const resolvedResponse = resolveSchemaRef(response, spec);
        responses[code] = resolvedResponse;
      } else {
        const resolvedContent: Record<string, any> = {};
        if (response.content) {
          Object.entries(response.content).forEach(([contentType, content]) => {
            resolvedContent[contentType] = {
              ...content,
              schema: content.schema
                ? resolveSchemaRef(content.schema, spec)
                : null,
            };
          });
        }
        responses[code] = {
          ...response,
          content: resolvedContent,
        };
      }
    });
    return responses;
  }, [endpoint.responses, spec]);

  // İlk response kodunu seç
  useMemo(() => {
    if (!selectedCode && Object.keys(resolvedResponses).length > 0) {
      setSelectedCode(Object.keys(resolvedResponses)[0]);
    }
  }, [resolvedResponses, selectedCode]);

  const getStatusColor = (code: string) => {
    const codeNum = parseInt(code);
    if (codeNum >= 200 && codeNum < 300) return "success";
    if (codeNum >= 300 && codeNum < 400) return "warning";
    if (codeNum >= 400) return "error";
    return "default";
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Responses</h3>

        {/* Status Code Selector */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(resolvedResponses).map(([code]) => (
            <button
              key={code}
              onClick={() => setSelectedCode(code)}
              className={classNames(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
                {
                  "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30":
                    getStatusColor(code) === "success" && selectedCode !== code,
                  "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-900/30":
                    getStatusColor(code) === "warning" && selectedCode !== code,
                  "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30":
                    getStatusColor(code) === "error" && selectedCode !== code,
                  "bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900/30":
                    getStatusColor(code) === "default" && selectedCode !== code,
                  "ring-2 ring-offset-2 dark:ring-offset-gray-900":
                    selectedCode === code,
                  "ring-green-500/70 bg-green-100 text-green-800":
                    selectedCode === code && getStatusColor(code) === "success",
                  "ring-yellow-500/70 bg-yellow-100 text-yellow-800":
                    selectedCode === code && getStatusColor(code) === "warning",
                  "ring-red-500/70 bg-red-100 text-red-800":
                    selectedCode === code && getStatusColor(code) === "error",
                  "ring-gray-500/70 bg-gray-100 text-gray-800":
                    selectedCode === code && getStatusColor(code) === "default",
                }
              )}
            >
              {code}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Response Details */}
      {selectedCode && resolvedResponses[selectedCode] && (
        <div className="space-y-4">
          {/* Description */}
          {resolvedResponses[selectedCode].description && (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {resolvedResponses[selectedCode].description}
              </p>
            </div>
          )}

          {/* Content */}
          {resolvedResponses[selectedCode].content && (
            <div className="space-y-4">
              {Object.entries(resolvedResponses[selectedCode].content).map(
                ([contentType, content]: [string, any]) => (
                  <div key={contentType} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Content-Type: {contentType}
                      </span>
                    </div>
                    {content.schema && (
                      <div className="p-4">
                        {content.schema.type === "object" &&
                          content.schema.properties && (
                            <SchemaProperties schema={content.schema} />
                          )}
                        {content.schema.type === "array" &&
                          content.schema.items && (
                            <div className="space-y-3">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  Array of {formatSchemaType(content.schema.items)}
                                </span>
                                <div className="flex gap-2">
                                  {content.schema.minItems !== undefined && (
                                    <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md text-gray-600 dark:text-gray-400">
                                      Min: {content.schema.minItems}
                                    </span>
                                  )}
                                  {content.schema.maxItems !== undefined && (
                                    <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md text-gray-600 dark:text-gray-400">
                                      Max: {content.schema.maxItems}
                                    </span>
                                  )}
                                  {content.schema.uniqueItems && (
                                    <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md text-gray-600 dark:text-gray-400">
                                      Unique items
                                    </span>
                                  )}
                                </div>
                              </div>
                              {content.schema.items.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {content.schema.items.description}
                                </p>
                              )}
                              {content.schema.items.type === "object" &&
                                content.schema.items.properties && (
                                  <div className="mt-2">
                                    <SchemaProperties
                                      schema={content.schema.items}
                                    />
                                  </div>
                                )}
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentationSectionResponse;
