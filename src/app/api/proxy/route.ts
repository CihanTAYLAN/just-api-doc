import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { url, method = "get", headers = {}, data } = body;

		if (!url) {
			return NextResponse.json({ error: "URL is required" }, { status: 400 });
		}

		const response = await axios({
			url,
			method,
			headers,
			data,
		});

		return NextResponse.json(response.data);
	} catch (error) {
		if (axios.isAxiosError(error)) {
			return NextResponse.json({ error: error.message, details: error.response?.data }, { status: error.response?.status ?? 500 });
		}
		return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
	}
}
