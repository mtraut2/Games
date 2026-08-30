"use client";

import { useEffect } from "react";

/**
 * next-pwa's `register: true` auto-injects a registration script, but only
 * for the Pages Router — it doesn't hook into the App Router, so the
 * generated public/sw.js otherwise sits there unregistered. Registering it
 * manually here is what actually makes the app installable.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.error("Service worker registration failed:", err);
    });
  }, []);

  return null;
}
