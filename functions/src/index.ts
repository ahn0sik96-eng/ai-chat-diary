import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as logger from 'firebase-functions/logger';

/**
 * Grok AI proxy.
 *
 * The app calls THIS function — never xAI directly — so the Grok API key lives
 * only on the server (as a Firebase secret). The request body is forwarded
 * verbatim to xAI's OpenAI-compatible /chat/completions endpoint, and the
 * response (including SSE streams) is piped straight back.
 *
 * Minimal abuse gate: a shared app key (APP_SHARED_KEY) must be sent in the
 * `x-app-key` header. NOTE: a client-embedded shared key only deters casual
 * abuse — before a public launch, add Firebase App Check (device attestation).
 */

const GROK_API_KEY = defineSecret('GROK_API_KEY');
const APP_SHARED_KEY = defineSecret('APP_SHARED_KEY');

const XAI_URL = 'https://api.x.ai/v1/chat/completions';

export const grok = onRequest(
  {
    secrets: [GROK_API_KEY, APP_SHARED_KEY],
    cors: true,
    timeoutSeconds: 120,
    memory: '256MiB',
    region: 'us-central1',
    // Keep one instance warm-ish but cap fan-out to limit runaway cost.
    maxInstances: 10,
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }
    if (req.get('x-app-key') !== APP_SHARED_KEY.value()) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    let upstream: Response;
    try {
      upstream = await fetch(XAI_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GROK_API_KEY.value()}`,
        },
        body: JSON.stringify(req.body ?? {}),
      });
    } catch (err) {
      logger.error('Upstream request failed', err);
      res.status(502).json({ error: 'Upstream request failed' });
      return;
    }

    const contentType = upstream.headers.get('content-type') ?? 'application/json';
    res.status(upstream.status);
    res.setHeader('Content-Type', contentType);

    // Stream Server-Sent Events straight through for chat.
    if (upstream.body && contentType.includes('text/event-stream')) {
      res.setHeader('Cache-Control', 'no-cache');
      const reader = upstream.body.getReader();
      const decoder = new TextDecoder();
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(decoder.decode(value, { stream: true }));
        }
      } catch (err) {
        logger.error('Stream relay error', err);
      }
      res.end();
      return;
    }

    // Non-streaming (e.g. diary summary JSON).
    const text = await upstream.text();
    res.send(text);
  },
);
