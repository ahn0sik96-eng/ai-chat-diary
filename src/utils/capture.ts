import type { View } from 'react-native';

/**
 * Lazily capture a view as a PNG. react-native-view-shot is a native module that
 * isn't present in Expo Go, so we require it on demand and return null when it's
 * unavailable — this keeps the decoration screen working in Expo Go (just without
 * image export) while real builds get full capture support.
 */
export async function captureViewAsPng(ref: React.RefObject<View | null>): Promise<string | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('react-native-view-shot');
    const captureRef = mod.captureRef ?? mod.default?.captureRef;
    if (!captureRef) return null;
    return await captureRef(ref, { format: 'png', quality: 1 });
  } catch {
    return null;
  }
}
