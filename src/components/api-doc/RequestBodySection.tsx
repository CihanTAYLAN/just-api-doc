"use client";

import React from 'react';
import { ApiEndpoint } from './types';

interface RequestBodySectionProps {
  requestBody: NonNullable<ApiEndpoint['requestBody']>;
  children: React.ReactNode;
}

export const RequestBodySection: React.FC<RequestBodySectionProps> = ({
  requestBody,
  children
}) => {
  if (!requestBody) return null;

  return (
    <div>
      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
        {children}
      </h3>
    </div>
  );
};
