"use client";;
import React, { useEffect, useState } from 'react';
import { ApiEndpoint, ApiSpec } from '../types';

interface DocumentationSectionProps {
    endpoint: ApiEndpoint;
    spec: ApiSpec;
}

// schema resolver
const resolveSchemaFromSpec = (schema: any, spec: ApiSpec): any => {
    if (!schema) return null;

    if (schema.$ref) {
        const ref = schema.$ref.replace('#/', '').split('/');
        let resolvedSchema = spec;
        for (const path of ref) {
            resolvedSchema = resolvedSchema?.[path];
        }
        return resolveSchemaFromSpec(resolvedSchema, spec);
    }

    // Handle array type
    if (schema.type === 'array' && schema.items) {
        return {
            ...schema,
            items: resolveSchemaFromSpec(schema.items, spec)
        };
    }

    // Handle object type with properties
    if (schema.type === 'object' && schema.properties) {
        const resolvedProperties: any = {};
        for (const [key, value] of Object.entries(schema.properties)) {
            resolvedProperties[key] = resolveSchemaFromSpec(value as any, spec);
        }
        return {
            ...schema,
            properties: resolvedProperties
        };
    }
    return schema;
};

export const DocumentationSection: React.FC<DocumentationSectionProps> = ({
    endpoint,
    spec
}) => {
    const [resolvedSchemaObject, setResolvedSchemaObject] = useState<any>({});



    useEffect(() => {
        setResolvedSchemaObject(resolveSchemaFromSpec(endpoint, spec));
    }, []);

    return (
        <div className="h-full">
            {/* Parameters Section */}
            {endpoint.parameters && endpoint.parameters.length > 0 && (
                <div className="p-4 space-y-4">
                    <h3 className="text-lg font-semibold mb-4">Parameters</h3>
                    <div className="space-y-4">
                        {endpoint.parameters.map((param, index) => {
                            const parameter = 'name' in param ? param : null;
                            if (!parameter) return null;

                            return (
                                <div key={index} className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{parameter.name}</span>
                                        <span className="bg-gray-100 text-gray-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded-sm dark:bg-gray-700 dark:text-gray-300">{parameter.in}</span>
                                        {parameter.required && (
                                            <span className="bg-red-100 text-red-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded-sm dark:bg-red-900 dark:text-red-300">Required</span>
                                        )}
                                    </div>
                                    {parameter.description && (
                                        <p className="text-sm text-muted-foreground">{parameter.description}</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Request Body Section */}
            {endpoint.requestBody && 'content' in endpoint.requestBody && (
                <div className="p-4 space-y-4">
                    <h3 className="text-lg font-semibold">Request Body</h3>
                    <div className="space-y-2">
                        {endpoint.requestBody.description && (
                            <p className="text-sm text-muted-foreground">{endpoint.requestBody.description}</p>
                        )}
                        {Object.entries(endpoint.requestBody.content).map(([contentType, content]) => (
                            <div key={contentType} className="mt-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-sm dark:bg-gray-700 dark:text-gray-300">
                                        {contentType}
                                    </span>
                                </div>
                                {content.schema && (
                                    <pre className="text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded overflow-auto">
                                        {JSON.stringify(resolvedSchemaObject, null, 2)}
                                    </pre>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Responses Section */}
            <div className="p-4 space-y-4">
                <h3 className="text-lg font-semibold mb-4">Responses</h3>
                <div className="space-y-4">
                    {Object.entries(endpoint.responses).map(([code, response]) => {
                        const resp = 'description' in response ? response : null;
                        if (!resp) return null;

                        return (
                            <div key={code} className="space-y-2 border p-2">
                                <div className="flex items-center gap-2">
                                    <span
                                        className={
                                            'font-medium ' +
                                            (code.startsWith('2') ? 'text-green-500' :
                                                code.startsWith('4') ? 'text-yellow-500' :
                                                    'text-red-500')
                                        }
                                    >
                                        {code}
                                    </span>
                                    <pre className="font-medium">{JSON.stringify(resp.content, null, 2)}</pre>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Additional Information */}
            {(endpoint.externalDocs || endpoint.servers) && (
                <div className="p-4 space-y-4">
                    <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
                    <div className="space-y-4">
                        {endpoint.externalDocs && (
                            <div>
                                <h4 className="font-medium mb-2">External Documentation</h4>
                                <a
                                    href={endpoint.externalDocs.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:underline"
                                >
                                    {endpoint.externalDocs.description || endpoint.externalDocs.url}
                                </a>
                            </div>
                        )}
                        {endpoint.servers && endpoint.servers.length > 0 && (
                            <div>
                                <h4 className="font-medium mb-2">Servers</h4>
                                <div className="space-y-2">
                                    {endpoint.servers.map((server, index) => (
                                        <div key={index}>
                                            <p className="font-mono text-sm">{server.url}</p>
                                            {server.description && (
                                                <p className="text-sm text-muted-foreground">{server.description}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
