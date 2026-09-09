import { Platform } from 'react-native';

import { getApiBaseUrl } from './config';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function apiMessage(status: number, body: unknown): string {
  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>;
    if (typeof record.message === 'string' && record.message.trim()) return record.message;
    if (typeof record.detail === 'string' && record.detail.trim()) return record.detail;
  }
  if (status === 0) return '서버에 연결하지 못했어요.';
  if (status === 400) return '입력한 내용을 다시 확인해주세요.';
  return '요청을 처리하지 못했어요.';
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export async function apiJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  const isJsonBody = typeof init.body === 'string';
  if (isJsonBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, { ...init, headers });
  } catch {
    throw new ApiError('서버에 연결하지 못했어요.', 0);
  }

  const body = await parseBody(response);
  if (!response.ok) {
    throw new ApiError(apiMessage(response.status, body), response.status);
  }
  return body as T;
}

export async function appendImage(
  form: FormData,
  field: string,
  uri: string,
  filename: string,
): Promise<void> {
  if (Platform.OS === 'web') {
    const blobResponse = await fetch(uri);
    const blob = await blobResponse.blob();
    form.append(field, blob, filename);
    return;
  }
  form.append(field, {
    uri,
    name: filename,
    type: 'image/jpeg',
  } as unknown as Blob);
}

export function isOffline(error: unknown): boolean {
  return error instanceof ApiError && error.status === 0;
}

export function errorMessage(error: unknown, fallback = '잠시 후 다시 시도해주세요.'): string {
  if (error instanceof ApiError && error.message) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
