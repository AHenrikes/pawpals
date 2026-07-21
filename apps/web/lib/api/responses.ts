import { NextResponse } from "next/server";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0, must-revalidate",
};

/**
 * Centralized API response utilities for consistent error handling.
 * Prevents duplication and ensures uniform status codes across routes.
 */

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function notFound(message: string = "Resource not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function serverError(message: string) {
  return NextResponse.json({ error: message }, { status: 500 });
}

export function conflict(message: string) {
  return NextResponse.json({ error: message }, { status: 409 });
}

export function created<T>(data: T) {
  return NextResponse.json(data, { status: 201 });
}

export function ok<T>(data: T) {
  return NextResponse.json(data, { status: 200 });
}

export function okNoStore<T>(data: T) {
  return NextResponse.json(data, {
    status: 200,
    headers: NO_STORE_HEADERS,
  });
}
