import { fetch as expoFetch } from 'expo/fetch';
import { GROK } from '@/config/grok.config';
import { PROXY_APP_KEY, PROXY_URL, hasProxy } from '@/config/proxy.config';
import { apiKeyStore } from './apiKey';
import {
  AuthError,
  GrokApiError,
  MissingApiKeyError,
  NetworkError,
  RateLimitError,
} from './errors';

export interface GrokMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  messages: GrokMessage[];
  model?: string;
  temperature?: number;
  /** Force a JSON object response (used for diary summarization). */
  jsonMode?: boolean;
  /** Reasoning effort for reasoning models (lower = faster replies). */
  reasoningEffort?: 'low' | 'high';
  signal?: AbortSignal;
}

interface Endpoint {
  url: string;
  headers: Record<string, string>;
}

/**
 * Whether the app can reach Grok at all:
 *  - production: a backend proxy URL is configured (key lives on the server), OR
 *  - dev: a local key was entered in the hidden developer screen.
 * When false, callers fall back to mock responses.
 */
export async function hasBackend(): Promise<boolean> {
  if (hasProxy()) return true;
  return !!(await apiKeyStore.get());
}

/**
 * Resolve where to send requests. Prefer the backend proxy (no key on device);
 * otherwise fall back to calling xAI directly with a developer key.
 */
async function resolveEndpoint(): Promise<Endpoint> {
  if (hasProxy()) {
    return {
      url: PROXY_URL,
      headers: {
        'Content-Type': 'application/json',
        'x-app-key': PROXY_APP_KEY,
      },
    };
  }
  const devKey = await apiKeyStore.get();
  if (!devKey) throw new MissingApiKeyError();
  return {
    url: `${GROK.baseUrl}/chat/completions`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${devKey}`,
    },
  };
}

function buildBody(opts: ChatOptions, stream: boolean) {
  const body: Record<string, unknown> = {
    model: opts.model ?? GROK.chatModel,
    messages: opts.messages,
    temperature: opts.temperature ?? GROK.chatTemperature,
    stream,
  };
  if (opts.jsonMode) body.response_format = { type: 'json_object' };
  if (opts.reasoningEffort) body.reasoning_effort = opts.reasoningEffort;
  return body;
}

function throwForStatus(status: number): never {
  if (status === 401 || status === 403) throw new AuthError();
  if (status === 429) throw new RateLimitError();
  throw new GrokApiError(status);
}

/** Non-streaming chat completion. Returns the full assistant text. */
export async function grokChat(opts: ChatOptions): Promise<string> {
  const endpoint = await resolveEndpoint();
  let res: Response;
  try {
    res = (await expoFetch(endpoint.url, {
      method: 'POST',
      headers: endpoint.headers,
      body: JSON.stringify(buildBody(opts, false)),
      signal: opts.signal,
    })) as unknown as Response;
  } catch {
    throw new NetworkError();
  }
  if (!res.ok) throwForStatus(res.status);
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content ?? '';
}

/**
 * Streaming chat completion. Calls onDelta with each text chunk as it arrives.
 * Returns the full accumulated text.
 */
export async function grokChatStream(
  opts: ChatOptions,
  onDelta: (chunk: string, full: string) => void,
): Promise<string> {
  const endpoint = await resolveEndpoint();
  let res: Awaited<ReturnType<typeof expoFetch>>;
  try {
    res = await expoFetch(endpoint.url, {
      method: 'POST',
      headers: endpoint.headers,
      body: JSON.stringify(buildBody(opts, true)),
      signal: opts.signal,
    });
  } catch {
    throw new NetworkError();
  }
  if (!res.ok) throwForStatus(res.status);
  if (!res.body) {
    // Fallback: no streamable body, do a normal request.
    return grokChat(opts);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE frames are separated by newlines.
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const raw of lines) {
      const line = raw.trim();
      if (!line.startsWith('data:')) continue;
      const payload = line.slice(5).trim();
      if (payload === '[DONE]') continue;
      try {
        const json = JSON.parse(payload) as {
          choices?: { delta?: { content?: string } }[];
        };
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) {
          full += delta;
          onDelta(delta, full);
        }
      } catch {
        // ignore keep-alive / partial frames
      }
    }
  }
  return full;
}
