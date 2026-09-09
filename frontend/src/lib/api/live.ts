import { isOffline } from './http';

/** 세션 생성으로 서버 연결 여부를 기억한다. null 은 아직 모름. */
let reachable: boolean | null = null;

export function setBackendReachable(value: boolean): void {
  reachable = value;
}

export function isBackendReachable(): boolean {
  return reachable === true;
}

export function isBackendKnownOffline(): boolean {
  return reachable === false;
}

/**
 * 서버가 꺼진 줄 알면 호출하지 않는다.
 * 네트워크 실패면 offline 으로 기억하고 null.
 * 그 외 4xx/5xx 는 그대로 던진다.
 */
export async function tryBackend<T>(fn: () => Promise<T>): Promise<T | null> {
  if (reachable === false) return null;
  try {
    const result = await fn();
    reachable = true;
    return result;
  } catch (error) {
    if (isOffline(error)) {
      reachable = false;
      return null;
    }
    throw error;
  }
}
