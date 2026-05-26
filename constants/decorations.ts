// iOS system fonts available without any extra packages
export const FONTS: { id: string; label: string; fontFamily: string; preview: string }[] = [
  { id: 'font-1', label: '사랑스러운 손글씨', fontFamily: 'Bradley Hand', preview: '오늘 하루도 수고했어 🍑' },
  { id: 'font-2', label: '감성 명조체',       fontFamily: 'Georgia',       preview: '오늘 하루도 수고했어 🍑' },
  { id: 'font-3', label: '귀여운 둥근체',     fontFamily: 'Chalkboard SE', preview: '오늘 하루도 수고했어 🍑' },
];

// Sticker store item id → emoji list
export const STICKER_PACKS: Record<string, { label: string; stickers: string[] }> = {
  'sticker-4': {
    label: '꽃다발 스티커 팩',
    stickers: ['🌸', '🌺', '🌻', '🌹', '💐', '🌷', '🌼', '🍀', '🌿', '🌱'],
  },
  'sticker-5': {
    label: '별빛 무드 팩',
    stickers: ['⭐', '🌟', '✨', '💫', '🌙', '🌃', '🌠', '🎇', '🌌', '🪐'],
  },
  'sticker-6': {
    label: '고양이 일상 팩',
    stickers: ['🐱', '😺', '🐾', '🐟', '🎀', '🧶', '😸', '🐈', '🐈‍⬛', '🥛'],
  },
  'sticker-7': {
    label: '빈티지 우표 팩',
    stickers: ['📮', '✉️', '📬', '🗺️', '📝', '🏷️', '📌', '🖊️', '📖', '🔖'],
  },
};

// Store catalogue (single source of truth)
export interface StoreItem {
  id: string;
  type: 'font' | 'sticker';
  name: string;
  price: number;
  fontFamily?: string;   // for font items
  packId?: string;       // for sticker items → key into STICKER_PACKS
}

export const STORE_ITEMS: StoreItem[] = [
  { id: 'font-1', type: 'font',    name: '사랑스러운 손글씨', price: 990,  fontFamily: 'Bradley Hand' },
  { id: 'font-2', type: 'font',    name: '감성 명조체',       price: 1200, fontFamily: 'Georgia' },
  { id: 'font-3', type: 'font',    name: '귀여운 둥근체',     price: 990,  fontFamily: 'Chalkboard SE' },
  { id: 'sticker-4', type: 'sticker', name: '꽃다발 스티커 팩', price: 1500, packId: 'sticker-4' },
  { id: 'sticker-5', type: 'sticker', name: '별빛 무드 팩',     price: 1500, packId: 'sticker-5' },
  { id: 'sticker-6', type: 'sticker', name: '고양이 일상 팩',   price: 1200, packId: 'sticker-6' },
  { id: 'sticker-7', type: 'sticker', name: '빈티지 우표 팩',   price: 1500, packId: 'sticker-7' },
];
