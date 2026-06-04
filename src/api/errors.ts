/** Typed errors surfaced by the Grok client, each with a Korean-friendly message. */

export class MissingApiKeyError extends Error {
  constructor() {
    super('API 키가 없어요. 설정에서 Grok 키를 입력해 주세요.');
    this.name = 'MissingApiKeyError';
  }
}

export class AuthError extends Error {
  constructor() {
    super('API 키가 올바르지 않아요. 설정에서 키를 다시 확인해 주세요.');
    this.name = 'AuthError';
  }
}

export class RateLimitError extends Error {
  constructor() {
    super('요청이 너무 많아요. 잠시 후 다시 시도해 주세요.');
    this.name = 'RateLimitError';
  }
}

export class NetworkError extends Error {
  constructor() {
    super('네트워크 연결을 확인해 주세요.');
    this.name = 'NetworkError';
  }
}

export class GrokApiError extends Error {
  status: number;
  constructor(status: number, message?: string) {
    super(message ?? `요청에 실패했어요 (${status}).`);
    this.name = 'GrokApiError';
    this.status = status;
  }
}

export class ParseError extends Error {
  constructor(message = '응답을 이해하지 못했어요.') {
    super(message);
    this.name = 'ParseError';
  }
}
