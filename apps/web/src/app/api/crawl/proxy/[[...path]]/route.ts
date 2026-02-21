import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const CRAWL4AI_API_URL = process.env.NEXT_PUBLIC_CRAWL4AI_API_URL;

async function handleProxy(req: NextRequest) {
    if (!CRAWL4AI_API_URL) {
        return NextResponse.json(
            { message: "NEXT_PUBLIC_CRAWL4AI_API_URL is not configured" },
            { status: 500 }
        );
    }

    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/api\/crawl\/proxy/, "");
    const targetUrl = new URL(CRAWL4AI_API_URL);
    targetUrl.pathname = (targetUrl.pathname + path).replace(/\/+/g, "/");
    targetUrl.search = url.search;

    console.log(`Proxying ${req.method} request to: ${targetUrl.toString()}`);

    const headers = new Headers();
    req.headers.forEach((value, key) => {
        if (key.toLowerCase() !== "host") {
            headers.set(key, value);
        }
    });

    try {
        const response = await fetch(targetUrl.toString(), {
            method: req.method,
            headers,
            body: req.method !== "GET" && req.method !== "HEAD" ? await req.blob() : undefined,
        });

        const data = await response.blob();

        const responseHeaders = new Headers();
        response.headers.forEach((value, key) => {
            responseHeaders.set(key, value);
        });

        return new NextResponse(data, {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
        });
    } catch (error: any) {
        console.error("Crawl4AI Proxy Error:", error);
        return NextResponse.json(
            { message: "Proxy request failed", error: error.message },
            { status: 502 }
        );
    }
}

export async function GET(req: NextRequest) { return handleProxy(req); }
export async function POST(req: NextRequest) { return handleProxy(req); }
export async function PUT(req: NextRequest) { return handleProxy(req); }
export async function DELETE(req: NextRequest) { return handleProxy(req); }
export async function PATCH(req: NextRequest) { return handleProxy(req); }
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
