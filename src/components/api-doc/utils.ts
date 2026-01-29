import { ApiDoc } from "@prisma/client";
import axios from "axios";
import { ApiSpec, HttpMethod, RequestBody } from "./types";

export function generateCodeSample(path: string, method: HttpMethod, parameters: unknown, requestBody: RequestBody) {
	const samples = {
		"Node / Axios": `const axios = require('axios');
${requestBody ? `const data = ${JSON.stringify(requestBody, null, 2)};` : ""}
const options = {
  method: '${method.toUpperCase()}',
  url: '${path}',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }${requestBody ? ",\n  data" : ""}
};

try {
  const { data } = await axios.request(options);
  console.log(data);
} catch (error) {
  console.error(error);
}`,
		"Python / Requests": `import requests

url = "${path}"
${requestBody ? `payload = ${JSON.stringify(requestBody, null, 2)}` : ""}
headers = {
    "Content-Type": "application/json",
    "Accept": "application/json"
}

try:
    response = requests.${method.toLowerCase()}(url${requestBody ? ", json=payload" : ""}, headers=headers)
    response.raise_for_status()
    print(response.json())
except requests.exceptions.RequestException as e:
    print(e)`,
		cURL: `curl -X ${method.toUpperCase()} '${path}' \\
     -H 'Content-Type: application/json' \\
     -H 'Accept: application/json'${requestBody ? ` \\\n     -d '${JSON.stringify(requestBody)}'` : ""}`,
	};

	return samples;
}

export async function fetchApiSpec(apiDoc: ApiDoc): Promise<ApiSpec | null> {
	try {
		if (!apiDoc.jsonUrl && !apiDoc.jsonContent) {
			throw new Error("No JSON content or URL provided");
		}
		if (apiDoc.jsonContent) {
			return JSON.parse(apiDoc.jsonContent);
		} else {
			const headers: Record<string, string> = {};

			switch (apiDoc.authType) {
				case "API_KEY":
					if (apiDoc.authKey) {
						headers[apiDoc.authHeader ?? "X-API-Key"] = apiDoc.authKey;
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
	} catch {
		// Error handling without console logging in production
	}
	return null;
}
