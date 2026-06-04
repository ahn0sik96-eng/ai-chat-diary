import * as SecureStore from 'expo-secure-store';
import { GROK_API_KEY_STORE } from '@/config/grok.config';

/** Read/write the Grok API key in the device secure store. */
export const apiKeyStore = {
  async get(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(GROK_API_KEY_STORE);
    } catch {
      return null;
    }
  },
  async set(key: string): Promise<void> {
    await SecureStore.setItemAsync(GROK_API_KEY_STORE, key.trim());
  },
  async clear(): Promise<void> {
    await SecureStore.deleteItemAsync(GROK_API_KEY_STORE);
  },
};
