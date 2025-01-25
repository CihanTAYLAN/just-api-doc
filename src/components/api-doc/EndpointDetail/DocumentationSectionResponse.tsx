import { FC, useMemo, useState } from "react";
import { ApiEndpoint, ApiSpec } from "../types";
import classNames from "classnames";

interface DocumentationSectionResponseProps {
  endpoint: ApiEndpoint;
  spec: ApiSpec;
}

// Schema referanslarını çözümler
const resolveSchemaRef = (schema: any, spec: ApiSpec): any => {
  if (!schema) return null;

  if (schema.$ref) {
    const ref = schema.$ref.replace("#/", "").split("/");
    let resolvedSchema = spec;
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

// Şema tipini formatlı gösterir
const formatSchemaType = (schema: any): string => {
  if (!schema) return "unknown";

  if (schema.type === "array") {
    const itemType = formatSchemaType(schema.items);
    return `array<${itemType}>`;
  }

  if (schema.type === "object" && schema.additionalProperties) {
    const valueType = formatSchemaType(schema.additionalProperties);
    return `Record<string, ${valueType}>`;
  }

  let type = schema.type || "any";
  if (schema.enum) {
    type = `enum(${schema.enum.join(" | ")})`;
  }
  if (schema.format) {
    type += ` (${schema.format})`;
  }
  if (schema.nullable) {
    type += " | null";
  }

  return type;
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
                  hasNestedProperties && "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded px-1"
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
                <span className="font-medium text-xs">{propName}</span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400">
                  {formatSchemaType(propSchema)}
                </span>
                {schema.required?.includes(propName) && (
                  <span className="bg-red-100 text-red-800 text-[10px] font-medium px-1.5 py-0.5 rounded-sm dark:bg-red-900 dark:text-red-300">
                    Required
                  </span>
                )}
              </div>

              {propSchema.description && (
                <p className="text-xs text-gray-600 dark:text-gray-400 ml-4">
                  {propSchema.description}
                </p>
              )}

              {propSchema.enum && (
                <div className="ml-4 text-[10px] text-gray-500 dark:text-gray-400">
                  Allowed values: {propSchema.enum.join(", ")}
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
    <div className="p-2 space-y-2">
      <h3 className="text-lg font-medium">Responses</h3>

      {/* Status Code Selector */}
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(resolvedResponses).map(([code, response]) => (
          <button
            key={code}
            onClick={() => setSelectedCode(code)}
            className={classNames(
              "px-2 py-0.5 rounded-lg text-xs font-medium transition-all duration-200",
              {
                "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300":
                  getStatusColor(code) === "success" && selectedCode !== code,
                "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300":
                  getStatusColor(code) === "warning" && selectedCode !== code,
                "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300":
                  getStatusColor(code) === "error" && selectedCode !== code,
                "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300":
                  getStatusColor(code) === "default" && selectedCode !== code,
                "ring-2 ring-offset-1 dark:ring-offset-gray-900":
                  selectedCode === code,
                "ring-green-500":
                  selectedCode === code && getStatusColor(code) === "success",
                "ring-yellow-500":
                  selectedCode === code && getStatusColor(code) === "warning",
                "ring-red-500":
                  selectedCode === code && getStatusColor(code) === "error",
                "ring-gray-500":
                  selectedCode === code && getStatusColor(code) === "default",
              }
            )}
          >
            {code}
          </button>
        ))}
      </div>

      {/* Selected Response Details */}
      {selectedCode && resolvedResponses[selectedCode] && (
        <div className="space-y-2">
          {/* Description */}
          {resolvedResponses[selectedCode].description && (
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {resolvedResponses[selectedCode].description}
            </p>
          )}

          {/* Content */}
          {resolvedResponses[selectedCode].content && (
            <div className="space-y-2">
              {Object.entries(resolvedResponses[selectedCode].content).map(
                ([contentType, content]: [string, any]) => (
                  <div key={contentType} className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="bg-gray-100 text-gray-800 text-xs font-medium px-1.5 py-0.5 rounded-sm dark:bg-gray-700 dark:text-gray-300">
                        {contentType}
                      </span>
                    </div>

                    {content.schema && (
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                        {content.schema.type === "object" &&
                          content.schema.properties && (
                            <SchemaProperties schema={content.schema} />
                          )}
                        {content.schema.type === "array" &&
                          content.schema.items && (
                            <div className="space-y-1.5">
                              <div className="text-xs font-medium">
                                Array of{" "}
                                {formatSchemaType(content.schema.items)}
                              </div>
                              {content.schema.items.description && (
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  {content.schema.items.description}
                                </p>
                              )}
                              <div className="flex flex-wrap gap-2">
                                {content.schema.minItems !== undefined && (
                                  <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                    Min items: {content.schema.minItems}
                                  </span>
                                )}
                                {content.schema.maxItems !== undefined && (
                                  <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                    Max items: {content.schema.maxItems}
                                  </span>
                                )}
                                {content.schema.uniqueItems && (
                                  <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                    Unique items
                                  </span>
                                )}
                              </div>
                              {/* Array içindeki tipleri göster */}
                              {content.schema.items.type === "object" &&
                                content.schema.items.properties && (
                                  <SchemaProperties
                                    schema={content.schema.items}
                                  />
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
