import { joinApiUrl } from './endpoints';

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL ?? '').trim();

const DEFAULT_TIMEOUT_MS = (() => {
  const raw = Number(process.env.EXPO_PUBLIC_API_TIMEOUT_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : 5_000;
})();

// 연속 실패가 쌓이면 잠시 API 호출을 건너뛰고 곧장 로컬/목 경로로 떨어진다.
// (죽은 백엔드에 화면마다 타임아웃을 반복해서 먹지 않도록)
const CIRCUIT_FAILURE_THRESHOLD = 3;
const CIRCUIT_OPEN_MS = 15_000;

let consecutiveFailures = 0;
let circuitOpenedAt = 0;

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

/** 서버 연결 자체가 안 되는 상태(타임아웃 / 네트워크 오류 / 서킷 open). 호출부는 로컬 데이터로 폴백한다. */
export class ApiUnavailableError extends Error {
  constructor(message = 'API 서버에 연결할 수 없습니다.') {
    super(message);
    this.name = 'ApiUnavailableError';
  }
}

export function isApiConfigured(): boolean {
  return API_BASE_URL.length > 0;
}

/**
 * 최근 연속 실패로 서킷이 열려 있으면 true.
 * 이 동안 API 호출은 즉시 {@link ApiUnavailableError}로 실패하므로, 호출부는 로컬/목 데이터로 안내해야 한다.
 * open 시간이 지나면 half-open 상태로 다음 한 번의 호출을 허용한다.
 */
export function isApiCircuitOpen(): boolean {
  if (circuitOpenedAt === 0) return false;
  if (Date.now() - circuitOpenedAt < CIRCUIT_OPEN_MS) return true;
  circuitOpenedAt = 0;
  consecutiveFailures = 0;
  return false;
}

function recordSuccess(): void {
  consecutiveFailures = 0;
  circuitOpenedAt = 0;
}

function recordFailure(): void {
  consecutiveFailures += 1;
  if (consecutiveFailures >= CIRCUIT_FAILURE_THRESHOLD) circuitOpenedAt = Date.now();
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
  if (isApiCircuitOpen()) {
    throw new ApiUnavailableError('API 서버 응답이 없어 잠시 저장된 정보로 안내하고 있어요.');
  }

  const isFormData = typeof FormData !== 'undefined' && init.body instanceof FormData;
  const headers = new Headers(init.headers);
  if (init.body && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const controller = new AbortController();
  const externalSignal = init.signal ?? undefined;
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener('abort', () => controller.abort(), { once: true });
  }
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(joinApiUrl(API_BASE_URL, path), {
      ...init,
      headers,
      credentials: 'include',
      signal: controller.signal,
    });
  } catch (cause) {
    recordFailure();
    if (externalSignal?.aborted) throw cause instanceof Error ? cause : new ApiUnavailableError();
    // 타임아웃(우리 controller) · 네트워크 오류(연결 거부/DNS 등) 모두 "서버에 못 닿음"으로 통일한다.
    if (controller.signal.aborted) {
      throw new ApiUnavailableError(`API 응답이 ${DEFAULT_TIMEOUT_MS}ms 안에 오지 않았습니다.`);
    }
    throw new ApiUnavailableError('API 서버에 연결하지 못했어요. 잠시 후 다시 시도해주세요.');
  } finally {
    clearTimeout(timer);
  }

  const body = await readResponseBody(response);
  if (!response.ok) {
    // 5xx는 서버 장애로 보고 서킷에 반영, 4xx는 서버가 응답은 한 것이므로 정상으로 취급한다.
    if (response.status >= 500) recordFailure();
    else recordSuccess();
    throw new ApiError(errorMessage(body, response.status), response.status, body);
  }
  recordSuccess();
  return body as T;
}
