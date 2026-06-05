import { create } from 'zustand';
import {
  CanvasElement,
  DiaryBackground,
  DiaryLayout,
  DiarySentence,
  StickerElement,
  TextElement,
} from '@/types';
import { uid } from '@/utils/id';
import { colors } from '@/theme/tokens';

/** Reference canvas size all element coordinates are authored against. */
export const CANVAS_REF = { width: 1000, height: 1400 };

interface DecorationState {
  diaryId: string | null;
  background: DiaryBackground;
  elements: CanvasElement[];
  selectedId: string | null;
  editingId: string | null;
  maxZ: number;
  history: CanvasElement[][];

  init: (diaryId: string, sentences: DiarySentence[], layout: DiaryLayout | null) => void;
  select: (id: string | null) => void;
  setEditing: (id: string | null) => void;
  setBackground: (bg: DiaryBackground) => void;

  addSticker: (assetId: string) => void;
  updateTransform: (
    id: string,
    t: { x?: number; y?: number; scale?: number; rotation?: number },
  ) => void;
  bringToFront: (id: string) => void;
  remove: (id: string) => void;
  updateTextStyle: (id: string, patch: Partial<Pick<TextElement, 'color' | 'fontSize'>>) => void;
  updateTextContent: (id: string, text: string) => void;
  toggleTextHidden: (id: string) => void;

  pushHistory: () => void;
  undo: () => void;
}

/** Lay sentences out in a centered vertical stack as the starting point. */
function layoutSentences(sentences: DiarySentence[]): TextElement[] {
  const top = 220;
  const gap = 150;
  return sentences.map((s, i) => ({
    id: uid(),
    type: 'text',
    sentenceId: s.id,
    text: s.text,
    x: CANVAS_REF.width / 2,
    y: top + i * gap,
    scale: 1,
    rotation: 0,
    z: i + 1,
    color: colors.text,
    fontSize: 40,
    align: 'center',
  }));
}

export const useDecorationStore = create<DecorationState>((set, get) => ({
  diaryId: null,
  background: { type: 'color', value: colors.surface },
  elements: [],
  selectedId: null,
  editingId: null,
  maxZ: 0,
  history: [],

  init: (diaryId, sentences, layout) => {
    if (layout) {
      const maxZ = layout.elements.reduce((m, e) => Math.max(m, e.z), 0);
      set({
        diaryId,
        background: layout.background,
        elements: layout.elements,
        selectedId: null,
        editingId: null,
        maxZ,
        history: [],
      });
    } else {
      const els = layoutSentences(sentences);
      set({
        diaryId,
        background: { type: 'color', value: colors.surface },
        elements: els,
        selectedId: null,
        editingId: null,
        maxZ: els.length,
        history: [],
      });
    }
  },

  select: (id) => set({ selectedId: id }),
  setEditing: (id) => set({ editingId: id, selectedId: id ?? get().selectedId }),
  setBackground: (bg) => {
    get().pushHistory();
    set({ background: bg });
  },

  addSticker: (assetId) => {
    get().pushHistory();
    const z = get().maxZ + 1;
    const sticker: StickerElement = {
      id: uid(),
      type: 'sticker',
      assetId,
      x: CANVAS_REF.width / 2,
      y: CANVAS_REF.height / 2,
      scale: 1,
      rotation: 0,
      z,
    };
    set((s) => ({ elements: [...s.elements, sticker], maxZ: z, selectedId: sticker.id }));
  },

  updateTransform: (id, t) =>
    set((s) => ({
      elements: s.elements.map((e) =>
        e.id === id
          ? {
              ...e,
              x: t.x ?? e.x,
              y: t.y ?? e.y,
              scale: t.scale ?? e.scale,
              rotation: t.rotation ?? e.rotation,
            }
          : e,
      ),
    })),

  bringToFront: (id) =>
    set((s) => {
      const z = s.maxZ + 1;
      return {
        maxZ: z,
        elements: s.elements.map((e) => (e.id === id ? { ...e, z } : e)),
      };
    }),

  remove: (id) => {
    get().pushHistory();
    set((s) => ({
      elements: s.elements.filter((e) => e.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
    }));
  },

  updateTextStyle: (id, patch) => {
    get().pushHistory();
    set((s) => ({
      elements: s.elements.map((e) =>
        e.id === id && e.type === 'text' ? { ...e, ...patch } : e,
      ),
    }));
  },

  updateTextContent: (id, text) => {
    get().pushHistory();
    set((s) => ({
      elements: s.elements.map((e) =>
        e.id === id && e.type === 'text' ? { ...e, text } : e,
      ),
    }));
  },

  toggleTextHidden: (id) => {
    get().pushHistory();
    set((s) => ({
      elements: s.elements.map((e) =>
        e.id === id && e.type === 'text' ? { ...e, hidden: !e.hidden } : e,
      ),
    }));
  },

  pushHistory: () =>
    set((s) => ({ history: [...s.history.slice(-29), s.elements.map((e) => ({ ...e }))] })),

  undo: () =>
    set((s) => {
      if (s.history.length === 0) return s;
      const prev = s.history[s.history.length - 1];
      return { elements: prev, history: s.history.slice(0, -1), selectedId: null };
    }),
}));
