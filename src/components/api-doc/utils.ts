import { ApiDoc } from "@prisma/client";
import axios from "axios";
import { ApiSpec } from "./types";

export function generateCodeSample(path: string, method: string, parameters: any, requestBody: any) {
  const samples = {
    'Node / Axios': `const axios = require('axios');
${requestBody ? `const data = ${JSON.stringify(requestBody, null, 2)};` : ''}
const options = {
  method: '${method.toUpperCase()}',
  url: '${path}',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }${requestBody ? ',\n  data' : ''}
};

try {
  const { data } = await axios.request(options);
  console.log(data);
} catch (error) {
  console.error(error);
}`,
    'Python / Requests': `import requests

url = "${path}"
${requestBody ? `payload = ${JSON.stringify(requestBody, null, 2)}` : ''}
headers = {
    "Content-Type": "application/json",
    "Accept": "application/json"
}

try:
    response = requests.${method.toLowerCase()}(url${requestBody ? ', json=payload' : ''}, headers=headers)
    response.raise_for_status()
    print(response.json())
except requests.exceptions.RequestException as e:
    print(e)`,
    'cURL': `curl -X ${method.toUpperCase()} '${path}' \\
     -H 'Content-Type: application/json' \\
     -H 'Accept: application/json'${requestBody ? ` \\\n     -d '${JSON.stringify(requestBody)}'` : ''}`
  };

  return samples;
}

export async function fetchApiSpec(apiDoc: ApiDoc): Promise<ApiSpec> {
  try {
    if (apiDoc.jsonContent) {
      return JSON.parse(apiDoc.jsonContent);
    }

    if (apiDoc.jsonUrl) {
      const headers: Record<string, string> = {};

      switch (apiDoc.authType) {
        case "API_KEY":
          if (apiDoc.authKey) {
            headers[apiDoc.authHeader || "X-API-Key"] = apiDoc.authKey;
          }
          break;
        case "BASIC_AUTH":
          if (apiDoc.authKey && apiDoc.authSecret) {
            const credentials = btoa(`${apiDoc.authKey}:${apiDoc.authSecret}`);
            headers["Authorization"] = `Basic ${credentials}`;
          }
          break;
        case "BEARER_TOKEN":
          if (apiDoc.authKey) {
            headers["Authorization"] = `Bearer ${apiDoc.authKey}`;
          }
          break;
      }

      const { data } = await axios.post("/api/proxy", {
        url: apiDoc.jsonUrl,
        headers,
      });

      return data;
    }

    throw new Error("No JSON content or URL provided");
  } catch (error) {
    console.error("Error fetching API spec:", error);
    if (axios.isAxiosError(error)) {
      throw new Error(
        `Failed to fetch API spec: ${error.response?.data?.error || error.message}`
      );
    }
    throw error;
  }
}
