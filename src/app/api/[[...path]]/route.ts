/**
 * Next.js API proxy — forwards requests to the FastAPI backend.
 * This allows the frontend to use /api/* paths in production
 * without CORS issues.
 */

import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

async function proxyRequest(request: Request, path: string) {
  const url = `${BACKEND_URL}${path}`;
  const method = request.method;
  const headers = new Headers(request.headers);
  headers.set('host', new URL(BACKEND_URL).host);

  let body: string | undefined;
  if (method !== 'GET' && method !== 'HEAD') {
    body = await request.text();
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body,
    });

    const data = await response.text();
    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Backend unavailable', detail: String(error) },
      { status: 502 }
    );
  }
}

// Catch-all route handler for /api/*
export async function GET(request: Request) {
  const { pathname } = new URL(request.url);
  // Remove /api prefix — the rest goes to FastAPI
  const backendPath = pathname.replace(/^\/api/, '');
  return proxyRequest(request, backendPath);
}

export async function POST(request: Request) {
  const { pathname } = new URL(request.url);
  const backendPath = pathname.replace(/^\/api/, '');
  return proxyRequest(request, backendPath);
}

export async function PUT(request: Request) {
  const { pathname } = new URL(request.url);
  const backendPath = pathname.replace(/^\/api/, '');
  return proxyRequest(request, backendPath);
}

export async function DELETE(request: Request) {
  const { pathname } = new URL(request.url);
  const backendPath = pathname.replace(/^\/api/, '');
  return proxyRequest(request, backendPath);
}