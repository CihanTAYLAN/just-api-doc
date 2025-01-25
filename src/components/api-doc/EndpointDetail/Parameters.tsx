"use client";

import React from 'react';
import { ApiEndpoint } from '../types';

interface ParametersProps {
  parameters: ApiEndpoint['parameters'];
  onPathParamsChange?: (params: Record<string, string>) => void;
  onQueryParamsChange?: (params: Record<string, string>) => void;
  pathParams?: Record<string, string>;
  queryParams?: Record<string, string>;
}

const ParameterGroup: React.FC<{
  title: string;
  parameters: any[];
  values: Record<string, string>;
  onChange: (name: string, value: string) => void;
}> = ({ title, parameters, values, onChange }) => (
  <div className="space-y-1.5">
    <h4 className="text-xs font-medium">{title}</h4>
    <div className="grid gap-2">
      {parameters.map((param, index) => !('$ref' in param) && (
        <div key={index} className="flex items-center gap-2">
          <div className="flex-shrink-0 w-24">
            <label 
              htmlFor={`param-${param.name}`}
              className="block text-xs font-mono text-gray-700 dark:text-gray-300"
            >
              {param.name}
            </label>
          </div>
          <div className="flex-grow">
            <input
              type="text"
              id={`param-${param.name}`}
              value={values[param.name] || ''}
              onChange={(e) => onChange(param.name, e.target.value)}
              placeholder={param.description || param.name}
              className="block w-full text-xs rounded-md border-0 py-1 px-2
                bg-white dark:bg-gray-800
                text-gray-900 dark:text-gray-100
                shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700
                placeholder:text-gray-400 dark:placeholder:text-gray-500
                focus:ring-2 focus:ring-inset focus:ring-indigo-500 dark:focus:ring-indigo-400"
            />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const Parameters: React.FC<ParametersProps> = ({ 
  parameters,
  onPathParamsChange,
  onQueryParamsChange,
  pathParams = {},
  queryParams = {}
}) => {
  if (!parameters?.length) return null;

  const pathParameters = parameters.filter(param => !('$ref' in param) && param.in === 'path');
  const queryParameters = parameters.filter(param => !('$ref' in param) && param.in === 'query');

  if (!pathParameters.length && !queryParameters.length) return null;

  const handlePathParamChange = (name: string, value: string) => {
    if (onPathParamsChange) {
      onPathParamsChange({
        ...pathParams,
        [name]: value
      });
    }
  };

  const handleQueryParamChange = (name: string, value: string) => {
    if (onQueryParamsChange) {
      onQueryParamsChange({
        ...queryParams,
        [name]: value
      });
    }
  };

  return (
    <div className="space-y-4">
      {pathParameters.length > 0 && (
        <ParameterGroup
          title="Path Parameters"
          parameters={pathParameters}
          values={pathParams}
          onChange={handlePathParamChange}
        />
      )}
      {queryParameters.length > 0 && (
        <ParameterGroup
          title="Query Parameters"
          parameters={queryParameters}
          values={queryParams}
          onChange={handleQueryParamChange}
        />
      )}
    </div>
  );
};
