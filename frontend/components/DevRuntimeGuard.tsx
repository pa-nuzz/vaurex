"use client";

import { useEffect } from "react";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const CACHE_PREFIXES = ["vaurex-", "workbox-"];

function isLocalDevelopmentHost(hostname: string) {
  return LOCAL_HOSTS.has(hostname) || hostname.endsWith(".local");
}

export function DevRuntimeGuard() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    if (!isLocalDevelopmentHost(window.location.hostname)) {
      return;
    }

    const cleanup = async () => {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
      }

      if ("caches" in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames
            .filter((cacheName) => CACHE_PREFIXES.some((prefix) => cacheName.startsWith(prefix)))
            .map((cacheName) => caches.delete(cacheName))
        );
      }
    };

    void cleanup();
  }, []);

  return null;
}