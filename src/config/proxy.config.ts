/**
 * Backend proxy configuration.
 *
 * In production the app talks ONLY to our Firebase Cloud Function, which holds
 * the Grok key server-side. These values are injected at build/publish time via
 * EXPO_PUBLIC_* environment variables (set as EAS environment variables), so no
 * secret is ever shipped — only the public function URL and a shared app key.
 */
export const PROXY_URL = process.env.EXPO_PUBLIC_GROK_PROXY_URL ?? '';

/** Shared key sent as `x-app-key` to gate casual abuse of the proxy. */
export const PROXY_APP_KEY = process.env.EXPO_PUBLIC_APP_KEY ?? '';

export const hasProxy = (): boolean => PROXY_URL.length > 0;
