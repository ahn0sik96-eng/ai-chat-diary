import { create } from 'zustand';
import { apiKeyStore } from '@/api/apiKey';
import { PersonaId } from '@/types';

interface SettingsState {
  hasKey: boolean;
  lastPersonaId: PersonaId | null;
  ready: boolean;
  refreshKey: () => Promise<void>;
  saveKey: (key: string) => Promise<void>;
  clearKey: () => Promise<void>;
  setLastPersona: (id: PersonaId) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  hasKey: false,
  lastPersonaId: null,
  ready: false,
  refreshKey: async () => {
    const key = await apiKeyStore.get();
    set({ hasKey: !!key, ready: true });
  },
  saveKey: async (key: string) => {
    await apiKeyStore.set(key);
    set({ hasKey: !!key.trim() });
  },
  clearKey: async () => {
    await apiKeyStore.clear();
    set({ hasKey: false });
  },
  setLastPersona: (id) => set({ lastPersonaId: id }),
}));
