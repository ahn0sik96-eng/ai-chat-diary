import { readAsStringAsync, writeAsStringAsync, cacheDirectory } from 'expo-file-system/legacy';

/**
 * Remove background from an image using remove.bg API.
 * Requires EXPO_PUBLIC_REMOVEBG_API_KEY in .env.local
 * Free tier: 50 calls/month — https://www.remove.bg/api
 *
 * Returns a local file URI of the PNG cutout, or null on failure.
 */
export async function removeBackground(imageUri: string): Promise<string | null> {
  const apiKey = process.env.EXPO_PUBLIC_REMOVEBG_API_KEY;
  if (!apiKey) return null;

  try {
    // Read source image as base64
    const base64Input = await readAsStringAsync(imageUri, { encoding: 'base64' });

    // remove.bg accepts base64 input via form field
    const formBody = `image_file_b64=${encodeURIComponent(base64Input)}&size=auto`;

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formBody,
    });

    if (!response.ok) return null;

    // Parse binary PNG response → base64 → save to cache
    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let base64Output = '';
    const CHUNK = 1024;
    for (let i = 0; i < bytes.length; i += CHUNK) {
      const chunk = Array.from(bytes.slice(i, Math.min(i + CHUNK, bytes.length)));
      base64Output += btoa(String.fromCharCode(...chunk));
    }

    const outputUri = `${cacheDirectory}sticker_${Date.now()}.png`;
    await writeAsStringAsync(outputUri, base64Output, { encoding: 'base64' });
    return outputUri;
  } catch {
    return null;
  }
}
