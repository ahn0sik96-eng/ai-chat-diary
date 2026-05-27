import { useMemo } from 'react';
import { PlacedSticker } from '../utils/storage';

export interface TextSegment {
  text: string;
  x: number;
  y: number;
  maxWidth: number;
}

interface StickerBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

function stickerToBox(s: PlacedSticker, canvasW: number, canvasH: number): StickerBox {
  const angle = s.rotation ?? 0;
  const aabb = s.size * (Math.abs(Math.cos(angle)) + Math.abs(Math.sin(angle)));
  const cx = (s.xPct / 100) * canvasW;
  const cy = (s.yPct / 100) * canvasH;
  const half = aabb / 2 + 10; // 10px clearance
  return { left: cx - half, top: cy - half, right: cx + half, bottom: cy + half };
}

// Returns the available [x, maxWidth] on a horizontal line at `lineY`
function getAvailableRange(
  lineY: number,
  lineH: number,
  paddingX: number,
  contentRight: number,
  boxes: StickerBox[],
): { x: number; maxWidth: number } {
  let left = paddingX;
  let right = contentRight;

  for (const b of boxes) {
    if (b.bottom < lineY || b.top > lineY + lineH) continue;
    // Sticker overlaps this line
    const stickerMidX = (b.left + b.right) / 2;
    const canvasMidX = (paddingX + contentRight) / 2;
    if (stickerMidX <= canvasMidX) {
      // Sticker on left side → push text right
      left = Math.max(left, b.right + 4);
    } else {
      // Sticker on right side → limit text width
      right = Math.min(right, b.left - 4);
    }
  }

  const x = Math.max(paddingX, left);
  const maxWidth = Math.max(40, right - x);
  return { x, maxWidth };
}

export function useTextLayout(
  text: string,
  fontSize: number,
  lineHeight: number,
  canvasWidth: number,
  paddingX: number,
  contentStartY: number,
  stickers: PlacedSticker[],
  canvasHeight: number,
): TextSegment[] {
  return useMemo(() => {
    if (!text.trim()) return [];

    const contentRight = canvasWidth - paddingX;
    const charW = fontSize * 0.54; // average char width estimate

    const boxes = stickers
      .filter(s => s.imageUri || s.emoji)
      .map(s => stickerToBox(s, canvasWidth, canvasHeight));

    const segments: TextSegment[] = [];
    const words = text.split(/\s+/).filter(Boolean);

    let y = contentStartY;
    let lineWords: string[] = [];
    let lineCharCount = 0;

    function flush() {
      if (lineWords.length === 0) return;
      const { x, maxWidth } = getAvailableRange(y, lineHeight, paddingX, contentRight, boxes);
      segments.push({ text: lineWords.join(' '), x, y, maxWidth });
      lineWords = [];
      lineCharCount = 0;
    }

    for (const word of words) {
      const { maxWidth } = getAvailableRange(y, lineHeight, paddingX, contentRight, boxes);
      const maxChars = Math.floor(maxWidth / charW);

      if (lineCharCount + word.length + (lineWords.length > 0 ? 1 : 0) > maxChars && lineWords.length > 0) {
        flush();
        y += lineHeight;
      }

      lineWords.push(word);
      lineCharCount += word.length + (lineWords.length > 1 ? 1 : 0);
    }

    flush();
    return segments;
  }, [text, fontSize, lineHeight, canvasWidth, paddingX, contentStartY, stickers, canvasHeight]);
}
