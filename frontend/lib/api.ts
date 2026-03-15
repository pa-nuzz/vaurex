"use client";

import { createClient } from "@/lib/supabase/client";

const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000").trim();

function buildUrl(path: string): string {
  const base = BACKEND_URL.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

function errorMessageForStatus(status: number, fallback: string): string {
  switch (status) {
    case 400:
      return "The request could not be completed.";
    case 401:
      return "Your session has expired. Please sign in again.";
    case 403:
      return "You are not allowed to perform this action.";
    case 404:
      return "The requested resource was not found.";
    case 408:
      return "The request timed out. Please try again.";
    case 429:
      return "Too many requests. Please wait and try again.";
    default:
      return fallback;
  }
}

async function handleUnauthorized(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
  if (typeof window !== "undefined") {
    window.location.assign("/");
  }
}

export async function getAccessToken(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

export async function apiFetch(
  path: string,
  init: RequestInit = {},
  options: { auth?: boolean; timeoutMs?: number } = {},
): Promise<Response> {
  const { auth = false, timeoutMs = 30000 } = options;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers = new Headers(init.headers ?? {});
    if (!headers.has("Accept")) {
      headers.set("Accept", "application/json");
    }
    if (auth) {
      const token = await getAccessToken();
      if (!token) {
        await handleUnauthorized();
        throw new Error("Unauthorized");
      }
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(buildUrl(path), {
      ...init,
      headers,
      signal: controller.signal,
    });

    if (response.status === 401) {
      await handleUnauthorized();
    }

    return response;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Request timeout");
    }
    if (error instanceof TypeError && (error.message === "Failed to fetch" || error.message === "Load failed")) {
      throw new Error("Unable to connect. Please check your connection and that the server is running.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function apiJson<T>(
  path: string,
  init: RequestInit = {},
  options: { auth?: boolean; timeoutMs?: number; fallbackMessage?: string } = {},
): Promise<T> {
  const { fallbackMessage = "Request failed" } = options;
  const response = await apiFetch(path, init, options);

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    throw new Error(errorMessageForStatus(response.status, fallbackMessage));
  }

  return body as T;
}

export function safeUiError(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    if (error.message === "Request timeout") {
      return "The request timed out. Please try again.";
    }
    if (error.message === "Failed to fetch" || error.message === "Load failed") {
      return "Unable to connect. Please check your connection and that the server is running.";
    }
    return error.message;
  }
  return fallback;
}