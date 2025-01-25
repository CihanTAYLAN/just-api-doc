"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckIcon, ClipboardIcon } from '@heroicons/react/24/outline';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from 'next-themes';

interface CodeSamplesProps {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: any;
}

export const CodeSamples: React.FC<CodeSamplesProps> = ({
  method,
  url,
  headers = {},
  body
}) => {
  const [activeTab, setActiveTab] = useState<'node' | 'python' | 'curl' | 'go' | 'java' | 'php'>('node');
  const [copied, setCopied] = useState(false);
  const { theme } = useTheme();

  const getNodeAxiosCode = () => {
    const code = [
      "const axios = require('axios');",
      "",
      "const config = {",
      `  method: '${method.toLowerCase()}',`,
      `  url: '${url}',`,
      "  headers: {",
      ...Object.entries(headers).map(([key, value]) => `    '${key}': '${value}',`),
      "  }",
      body ? `  data: ${JSON.stringify(body, null, 2).replace(/\n/g, '\n  ')}` : "",
      "};",
      "",
      "axios(config)",
      "  .then(response => {",
      "    console.log(JSON.stringify(response.data, null, 2));",
      "  })",
      "  .catch(error => {",
      "    console.error('Error:', error.response?.data || error.message);",
      "  });"
    ].filter(Boolean).join('\n');

    return code;
  };

  const getPythonRequestsCode = () => {
    const code = [
      "import requests",
      "import json",
      "",
      `url = '${url}'`,
      "",
      "headers = {",
      ...Object.entries(headers).map(([key, value]) => `    '${key}': '${value}',`),
      "}",
      "",
      body ? `data = ${JSON.stringify(body, null, 2)}` : "",
      "",
      "try:",
      `    response = requests.${method.toLowerCase()}(url, headers=headers${body ? ', json=data' : ''})`,
      "    response.raise_for_status()",
      "    print(json.dumps(response.json(), indent=2))",
      "except requests.exceptions.RequestException as e:",
      "    print(f'Error: {e}')"
    ].filter(Boolean).join('\n');

    return code;
  };

  const getCurlCode = () => {
    const code = [
      "curl -X " + method.toUpperCase(),
      ...Object.entries(headers).map(([key, value]) => `  -H '${key}: ${value}'`),
      body ? `  -d '${JSON.stringify(body)}'` : "",
      `  '${url}'`
    ].filter(Boolean).join(' \\\n');

    return code;
  };

  const getGoCode = () => {
    const code = [
      "package main",
      "",
      "import (",
      '    "fmt"',
      '    "io/ioutil"',
      '    "net/http"',
      '    "strings"',
      '    "log"',
      ")",
      "",
      "func main() {",
      `    url := "${url}"`,
      body ? `    payload := strings.NewReader(\`${JSON.stringify(body, null, 2)}\`)` : "",
      `    req, err := http.New${method.toUpperCase()}Request(url${body ? ', payload' : ', nil'})`,
      "    if err != nil {",
      '        log.Fatal(err)',
      "    }",
      "",
      "    // Set headers",
      ...Object.entries(headers).map(([key, value]) => `    req.Header.Add("${key}", "${value}")`),
      "",
      "    client := &http.Client{}",
      "    resp, err := client.Do(req)",
      "    if err != nil {",
      '        log.Fatal(err)',
      "    }",
      "    defer resp.Body.Close()",
      "",
      "    body, err := ioutil.ReadAll(resp.Body)",
      "    if err != nil {",
      '        log.Fatal(err)',
      "    }",
      "",
      '    fmt.Println(string(body))',
      "}"
    ].filter(Boolean).join('\n');

    return code;
  };

  const getJavaCode = () => {
    const code = [
      "import okhttp3.*;",
      "import java.io.IOException;",
      "",
      "public class ApiRequest {",
      "    public static void main(String[] args) {",
      "        OkHttpClient client = new OkHttpClient();",
      "",
      body ? `        String jsonBody = ${JSON.stringify(JSON.stringify(body, null, 2))};` : "",
      body ? "        RequestBody requestBody = RequestBody.create(jsonBody, MediaType.parse(\"application/json\"));" : "",
      "",
      "        Request request = new Request.Builder()",
      `            .url("${url}")`,
      ...Object.entries(headers).map(([key, value]) => `            .addHeader("${key}", "${value}")`),
      `            .${method.toLowerCase()}(${body ? 'requestBody' : ''})`,
      "            .build();",
      "",
      "        try {",
      "            Response response = client.newCall(request).execute();",
      "            System.out.println(response.body().string());",
      "        } catch (IOException e) {",
      "            e.printStackTrace();",
      "        }",
      "    }",
      "}"
    ].filter(Boolean).join('\n');

    return code;
  };

  const getPhpCode = () => {
    const code = [
      "<?php",
      "",
      "require 'vendor/autoload.php';",
      "",
      "$client = new \\GuzzleHttp\\Client();",
      "",
      "try {",
      "    $response = $client->request(",
      `        '${method.toUpperCase()}',`,
      `        '${url}',`,
      "        [",
      "            'headers' => [",
      ...Object.entries(headers).map(([key, value]) => `                '${key}' => '${value}',`),
      "            ]" + (body ? "," : ""),
      body ? `            'json' => ${JSON.stringify(body, null, 2).replace(/\n/g, '\n            ')}` : "",
      "        ]",
      "    );",
      "",
      "    echo $response->getBody();",
      "} catch (\\GuzzleHttp\\Exception\\GuzzleException $e) {",
      "    echo 'Error: ' . $e->getMessage();",
      "}"
    ].filter(Boolean).join('\n');

    return code;
  };

  const handleCopy = async () => {
    const code = activeTab === 'node' ? getNodeAxiosCode() :
      activeTab === 'python' ? getPythonRequestsCode() :
      activeTab === 'go' ? getGoCode() :
      activeTab === 'java' ? getJavaCode() :
      activeTab === 'php' ? getPhpCode() :
        getCurlCode();
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLanguage = (tab: typeof activeTab) => {
    switch (tab) {
      case 'node': return 'javascript';
      case 'python': return 'python';
      case 'curl': return 'bash';
      case 'go': return 'go';
      case 'java': return 'java';
      case 'php': return 'php';
    }
  };

  const tabs = [
    { id: 'node', label: 'Node / Axios', icon: '⚡' },
    { id: 'python', label: 'Python / Requests', icon: '🐍' },
    { id: 'curl', label: 'cURL', icon: '🔄' },
    { id: 'go', label: 'Go', icon: '🔵' },
    { id: 'java', label: 'Java / OkHttp', icon: '☕' },
    { id: 'php', label: 'PHP / Guzzle', icon: '🐘' }
  ] as const;

  return (
    <div className="rounded-xl overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-lg">
      {/* Language Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
        {tabs.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`relative px-4 py-3 text-sm font-medium transition-all duration-200 ${activeTab === id
              ? 'text-indigo-600 dark:text-indigo-400 bg-white dark:bg-gray-900'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/50'
              }`}
          >
            <span className="flex items-center space-x-2">
              <span>{icon}</span>
              <span>{label}</span>
            </span>
            {activeTab === id && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400"
                initial={false}
              />
            )}
          </button>
        ))}
      </div>

      {/* Code Display */}
      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="relative"
          >
            <div className="dark:bg-gray-900">
              <SyntaxHighlighter
                language={getLanguage(activeTab)}
                style={theme === 'dark' ? oneDark : oneLight}
                customStyle={{
                  margin: 0,
                  padding: '1rem',
                  fontSize: '0.875rem',
                }}
              >
                {activeTab === 'node' ? getNodeAxiosCode() :
                  activeTab === 'python' ? getPythonRequestsCode() :
                  activeTab === 'go' ? getGoCode() :
                  activeTab === 'java' ? getJavaCode() :
                  activeTab === 'php' ? getPhpCode() :
                    getCurlCode()}
              </SyntaxHighlighter>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="absolute top-3 right-3 flex space-x-2">
          <button
            onClick={handleCopy}
            className="p-2 rounded-lg transition-all duration-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 group hover:scale-105 active:scale-95"
            title="Copy to clipboard"
          >
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="text-green-600 dark:text-green-400"
                >
                  <CheckIcon className="h-5 w-5" />
                </motion.div>
              ) : (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300"
                >
                  <ClipboardIcon className="h-5 w-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>
    </div>
  );
};
