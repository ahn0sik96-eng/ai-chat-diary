import * as Crypto from 'expo-crypto';

/** Generate a unique id (UUID v4). */
export function uid(): string {
  return Crypto.randomUUID();
}

export function now(): number {
  return Date.now();
}
