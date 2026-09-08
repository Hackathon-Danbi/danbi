import type { ApiMethod } from './endpoints';

type QueryValue = string | number | boolean | null | undefined;

export type ApiRequestOptions = {
  method: ApiMethod;
  path: string;
  query?: object;
  body?: unknown;
  accessToken?: string;
  signal?: AbortSignal;
};

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly payload: unknown,
  ) {
    super(`API request failed with status ${status}`);
    this.name = 'ApiError';
  }
}

function buildUrl(path: string, query?: object): string {
  const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (!baseUrl) throw new Error('EXPO_PUBLIC_API_BASE_URL is not configured');

  const url = new URL(path, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
  Object.entries(query ?? {}).forEach(([key, value]: [string, QueryValue]) => {
    if (value !== null && value !== undefined) url.searchParams.set(key, String(value));
  });
  return url.toString();
}

/**
 * 요청 함수 자체는 준비되어 있지만 현재 어떤 화면에서도 import하지 않는다.
 * 실제 연결 시 `requests.ts`의 주석 블록을 해제한 뒤 feature에서 호출한다.
 */
export async function apiRequest<T>({
  method,
  path,
  query,
  body,
  accessToken,
  signal,
}: ApiRequestOptions): Promise<T> {
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const response = await fetch(buildUrl(path, query), {
    method,
    headers: {
      Accept: 'application/json',
      ...(isFormData ? {} : body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
    signal,
  });

  const text = await response.text();
  let payload: unknown;
  try {
    payload = text ? JSON.parse(text) : undefined;
  } catch {
    payload = text;
  }
  if (!response.ok) throw new ApiError(response.status, payload);
  return payload as T;
}
