"use client";

import React from 'react';

interface MethodBadgeProps {
  method: string;
}

export const MethodBadge: React.FC<MethodBadgeProps> = ({ method }) => {
  const methodColors = {
    get: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    post: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    put: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    delete: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300'
  };

  const colorClass = methodColors[method.toLowerCase() as keyof typeof methodColors] || methodColors.default;

  return (
    <span className={`inline-flex justify-center items-center w-12 px-2 py-1 rounded text-xs font-medium uppercase ${colorClass}`}>
      {method}
    </span>
  );
};
