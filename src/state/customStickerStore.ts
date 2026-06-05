import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { create } from 'zustand';
import { CustomStickerRepository } from '@/data/repositories/CustomStickerRepository';
import { CustomSticker } from '@/types';
import { uid } from '@/utils/id';

/** assetId prefix that marks a sticker as user-imported. */
export const CUSTOM_PREFIX = 'custom:';

const STICKER_DIR = FileSystem.documentDirectory + 'stickers/';

interface CustomStickerState {
  stickers: CustomSticker[];
  /** id -> persistent file uri, for fast lookup while rendering. */
  uriById: Record<string, string>;
  loaded: boolean;
  load: () => Promise<void>;
  /** Pick an image from the library, persist it, and return the new sticker. */
  addFromLibrary: () => Promise<CustomSticker | null>;
  remove: (id: string) => Promise<void>;
}

function indexById(stickers: CustomSticker[]): Record<string, string> {
  return stickers.reduce((acc, s) => ({ ...acc, [s.id]: s.uri }), {});
}

export const useCustomStickerStore = create<CustomStickerState>((set, get) => ({
  stickers: [],
  uriById: {},
  loaded: false,

  load: async () => {
    const stickers = await CustomStickerRepository.list();
    set({ stickers, uriById: indexById(stickers), loaded: true });
  },

  addFromLibrary: async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('권한 필요', '스티커를 추가하려면 사진 접근 권한이 필요해요.');
      return null;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });
    if (result.canceled || !result.assets?.[0]) return null;

    const srcUri = result.assets[0].uri;
    try {
      await FileSystem.makeDirectoryAsync(STICKER_DIR, { intermediates: true });
    } catch {
      // directory already exists
    }
    const ext = (srcUri.split('.').pop() || 'png').split('?')[0].slice(0, 4) || 'png';
    const dest = `${STICKER_DIR}${uid()}.${ext}`;
    await FileSystem.copyAsync({ from: srcUri, to: dest });

    const sticker = await CustomStickerRepository.add(dest);
    const stickers = [sticker, ...get().stickers];
    set({ stickers, uriById: indexById(stickers) });
    return sticker;
  },

  remove: async (id) => {
    const uri = get().uriById[id];
    await CustomStickerRepository.delete(id);
    if (uri) {
      try {
        await FileSystem.deleteAsync(uri, { idempotent: true });
      } catch {
        // best-effort
      }
    }
    const stickers = get().stickers.filter((s) => s.id !== id);
    set({ stickers, uriById: indexById(stickers) });
  },
}));

/** Resolve a sticker assetId to a custom image uri, if it is a custom sticker. */
export function resolveCustomUri(assetId: string): string | undefined {
  if (!assetId.startsWith(CUSTOM_PREFIX)) return undefined;
  const id = assetId.slice(CUSTOM_PREFIX.length);
  return useCustomStickerStore.getState().uriById[id];
}
