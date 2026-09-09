import { joinApiUrl } from './endpoints';

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL ?? '').trim();

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ApiConfigurationError extends Error {
  constructor() {
    super('EXPO_PUBLIC_API_BASE_URL이 설정되지 않았습니다.');
    this.name = 'ApiConfigurationError';
  }
}

export function isApiConfigured(): boolean {
  return API_BASE_URL.length > 0;
}

export function resolveApiUrl(url: string): string {
  if (/^(?:https?:|data:|blob:|file:)/i.test(url) || !isApiConfigured()) return url;
  return joinApiUrl(API_BASE_URL, url);
}

async function readResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function errorMessage(body: unknown, status: number): string {
  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>;
    const message = record.message ?? record.error;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return `API 요청에 실패했습니다. (${status})`;
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  if (!isApiConfigured()) throw new ApiConfigurationError();

  const isFormData = typeof FormData !== 'undefined' && init.body instanceof FormData;
  const headers = new Headers(init.headers);
  if (init.body && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(joinApiUrl(API_BASE_URL, path), {
    ...init,
    headers,
    credentials: 'include',
  });
  const body = await readResponseBody(response);
  if (!response.ok) throw new ApiError(errorMessage(body, response.status), response.status, body);
  return body as T;
}
