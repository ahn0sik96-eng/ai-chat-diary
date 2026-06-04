/** Shared domain types for the whole app. */

export type PersonaId =
  | 'caring_friend' // 다정한 친구
  | 'psychiatrist' // 정신과 의사
  | 'funny_friend' // 재밌는 친구
  | 'cool_senior' // 멋있는 선배
  | 'warm_parent'; // 따뜻한 부모님

export interface Persona {
  id: PersonaId;
  displayName: string;
  emoji: string;
  tagline: string; // short one-liner shown in the picker
  accent: string; // accent color for the persona
  /** System prompt — the heart of the "feels human" chat. Edit freely. */
  systemPrompt: string;
  /** Opening line the AI "sends" first when a session starts. */
  greeting: string;
}

export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: ChatRole;
  content: string;
  createdAt: number;
  /** True while a streaming assistant message is still arriving (UI-only). */
  pending?: boolean;
}

export interface ChatSession {
  id: string;
  personaId: PersonaId;
  title: string;
  createdAt: number;
  updatedAt: number;
  /** Set once a diary has been generated from this conversation. */
  diaryId?: string;
}

export type DiaryStyle = 'normal' | 'emotional' | 'poetic'; // 일반 / 감정 / 시적

export interface DiarySentence {
  id: string;
  text: string;
  order: number;
}

export type DiaryVisibility = 'private' | 'public';

export interface Diary {
  id: string;
  sessionId: string;
  personaId: PersonaId;
  style: DiaryStyle;
  title: string;
  /** The sentence-split summary — each becomes a movable element on the canvas. */
  sentences: DiarySentence[];
  /** Full raw summary text kept as a fallback. */
  rawSummary: string;
  mood?: string; // optional one-word mood, e.g. "설렘"
  createdAt: number;
  updatedAt: number;
  /** URI of the exported decorated image, if the user saved one. */
  coverImageUri?: string;
  visibility: DiaryVisibility;
}

/* ----------------------------- Decoration canvas ---------------------------- */

export type CanvasElementType = 'text' | 'sticker';

/** A 2D transform. (x, y) is the element CENTER in canvas reference coordinates. */
export interface CanvasTransform {
  x: number;
  y: number;
  scale: number;
  rotation: number; // radians
  z: number; // z-order (higher = front)
}

export interface TextElement extends CanvasTransform {
  id: string;
  type: 'text';
  sentenceId: string;
  text: string;
  color: string;
  fontSize: number;
  align: 'left' | 'center' | 'right';
  hidden?: boolean;
}

export interface StickerElement extends CanvasTransform {
  id: string;
  type: 'sticker';
  assetId: string; // -> src/assets/stickers/manifest.ts
}

export type CanvasElement = TextElement | StickerElement;

export interface DiaryBackground {
  type: 'color' | 'image';
  value: string; // hex color or image uri
}

export interface DiaryLayout {
  id: string;
  diaryId: string;
  /** Reference canvas size used when the layout was authored (for device scaling). */
  canvasWidth: number;
  canvasHeight: number;
  background: DiaryBackground;
  elements: CanvasElement[];
  updatedAt: number;
}
