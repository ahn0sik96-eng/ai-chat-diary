import { ImageSourcePropType } from 'react-native';

/**
 * ── 스티커 매니페스트 ────────────────────────────────────────────────────────
 * 지금은 이모지 스티커로 바로 동작합니다(에셋 불필요).
 * 이미지 스티커를 추가하려면:
 *   1) PNG 파일을 src/assets/stickers/ 에 넣고
 *   2) 아래에 { id, type: 'image', category, source: require('./파일.png') } 추가
 * StickerElement.assetId 가 여기 id 와 연결됩니다.
 */

export type StickerCategory = 'cute' | 'love' | 'nature' | 'food' | 'deco' | 'face';

interface EmojiSticker {
  id: string;
  type: 'emoji';
  category: StickerCategory;
  value: string;
}

interface ImageSticker {
  id: string;
  type: 'image';
  category: StickerCategory;
  source: ImageSourcePropType;
}

export type StickerAsset = EmojiSticker | ImageSticker;

const emoji = (id: string, category: StickerCategory, value: string): EmojiSticker => ({
  id,
  type: 'emoji',
  category,
  value,
});

export const STICKERS: StickerAsset[] = [
  // cute
  emoji('cute_bear', 'cute', '🧸'),
  emoji('cute_rabbit', 'cute', '🐰'),
  emoji('cute_cat', 'cute', '🐱'),
  emoji('cute_chick', 'cute', '🐥'),
  emoji('cute_paw', 'cute', '🐾'),
  emoji('cute_ribbon', 'cute', '🎀'),
  // love
  emoji('love_heart', 'love', '💗'),
  emoji('love_heart2', 'love', '❤️'),
  emoji('love_sparkleheart', 'love', '💖'),
  emoji('love_letter', 'love', '💌'),
  emoji('love_kiss', 'love', '💋'),
  // nature
  emoji('nature_flower', 'nature', '🌷'),
  emoji('nature_blossom', 'nature', '🌸'),
  emoji('nature_sun', 'nature', '☀️'),
  emoji('nature_moon', 'nature', '🌙'),
  emoji('nature_star', 'nature', '⭐'),
  emoji('nature_rainbow', 'nature', '🌈'),
  emoji('nature_cloud', 'nature', '☁️'),
  // food
  emoji('food_cake', 'food', '🍰'),
  emoji('food_coffee', 'food', '☕'),
  emoji('food_strawberry', 'food', '🍓'),
  emoji('food_icecream', 'food', '🍦'),
  emoji('food_donut', 'food', '🍩'),
  // deco
  emoji('deco_sparkle', 'deco', '✨'),
  emoji('deco_pin', 'deco', '📌'),
  emoji('deco_clip', 'deco', '🖇️'),
  emoji('deco_check', 'deco', '✔️'),
  emoji('deco_music', 'deco', '🎵'),
  emoji('deco_balloon', 'deco', '🎈'),
  // face
  emoji('face_smile', 'face', '😊'),
  emoji('face_love', 'face', '🥰'),
  emoji('face_cry', 'face', '🥺'),
  emoji('face_laugh', 'face', '😆'),
  emoji('face_think', 'face', '🤔'),
  emoji('face_sleepy', 'face', '😴'),
];

export const STICKER_MAP: Record<string, StickerAsset> = STICKERS.reduce(
  (acc, s) => ({ ...acc, [s.id]: s }),
  {} as Record<string, StickerAsset>,
);

export const STICKER_CATEGORIES: { id: StickerCategory; label: string }[] = [
  { id: 'cute', label: '귀여움' },
  { id: 'love', label: '사랑' },
  { id: 'face', label: '표정' },
  { id: 'nature', label: '자연' },
  { id: 'food', label: '음식' },
  { id: 'deco', label: '데코' },
];

export function getSticker(id: string): StickerAsset | undefined {
  return STICKER_MAP[id];
}
