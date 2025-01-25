"use client";

import React, { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { useTheme } from 'next-themes';
import { DocumentDuplicateIcon } from '@heroicons/react/24/outline';

import * as Monaco from 'monaco-editor';

interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: string;
}

export const JsonEditor: React.FC<JsonEditorProps> = ({
  value,
  onChange,
  height = "100px"
}) => {
  const { theme, systemTheme } = useTheme();
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Determine the actual theme based on system preference and user preference
  const currentTheme = theme === 'system' ? systemTheme : theme;

  const handleEditorDidMount = (editor: Monaco.editor.IStandaloneCodeEditor, monaco: typeof Monaco) => {
    editorRef.current = editor;

    // Define themes when editor is mounted
    monaco.editor.defineTheme('custom-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'string.key.json', foreground: '9CDCFE' },
        { token: 'string.value.json', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'keyword.json', foreground: '569CD6' },
      ],
      colors: {
        'editor.background': '#111827',
        'editor.foreground': '#D1D5DB',
        'editorLineNumber.foreground': '#4B5563',
        'editorLineNumber.activeForeground': '#9CA3AF',
        'editor.selectionBackground': '#374151',
        'editor.inactiveSelectionBackground': '#1F2937',
        'editor.lineHighlightBackground': '#1F2937',
        'editorCursor.foreground': '#60A5FA',
        'editorBracketMatch.background': '#374151',
        'editorBracketMatch.border': '#4B5563',
      },
    });

    monaco.editor.defineTheme('custom-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'string.key.json', foreground: '0451A5' },
        { token: 'string.value.json', foreground: '0451A5' },
        { token: 'number', foreground: '098658' },
        { token: 'keyword.json', foreground: '0000FF' },
      ],
      colors: {
        'editor.background': '#FFFFFF',
        'editor.foreground': '#111827',
        'editorLineNumber.foreground': '#6B7280',
        'editorLineNumber.activeForeground': '#374151',
        'editor.selectionBackground': '#E5E7EB',
        'editor.inactiveSelectionBackground': '#F3F4F6',
        'editor.lineHighlightBackground': '#F9FAFB',
        'editorCursor.foreground': '#2563EB',
        'editorBracketMatch.background': '#E5E7EB',
        'editorBracketMatch.border': '#D1D5DB',
      },
    });

    // Set initial theme
    editor.updateOptions({
      theme: currentTheme === 'dark' ? 'custom-dark' : 'custom-light'
    });
  };

  // Update theme when it changes
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({
        theme: currentTheme === 'dark' ? 'custom-dark' : 'custom-light'
      });
    }
  }, [currentTheme]);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      onChange(value);
    }
  };

  const handleFormat = () => {
    if (editorRef?.current) {
      editorRef?.current?.getAction('editor.action.formatDocument')?.run();
    } else {
      console.warn('Editor reference is not set.');
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <div className="relative rounded-md overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="absolute right-2 top-2 z-10 flex items-center space-x-2">
        <button
          onClick={handleFormat}
          className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center"
        >
          Format
        </button>
        <button
          onClick={handleCopy}
          className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center gap-1"
          title={copySuccess ? 'Copied!' : 'Copy to clipboard'}
        >
          <DocumentDuplicateIcon className="h-3.5 w-3.5" />
          {copySuccess ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <Editor
        height={height}
        defaultLanguage="json"
        value={value}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          lineNumbers: 'on',
          lineNumbersMinChars: 3,
          lineDecorationsWidth: 0,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          formatOnPaste: true,
          formatOnType: true,
          tabSize: 4,
          wordWrap: 'on',
          renderWhitespace: 'selection',
          bracketPairColorization: { enabled: true },
          guides: {
            bracketPairs: true,
            indentation: true
          },
          padding: { top: 8, bottom: 8 },
          folding: true,
          foldingStrategy: 'indentation',
          showFoldingControls: 'always',
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          roundedSelection: true,
          renderLineHighlight: 'all',
          occurrencesHighlight: 'singleFile',
          colorDecorators: true,
        }}
      />
    </div>
  );
};
