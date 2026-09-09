import { Platform } from 'react-native';
import Constants from 'expo-constants';

function isLoopbackHost(host: string) {
  return host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '[::1]';
}

/** 백엔드 origin. 끝에 슬래시 없음. */
export function getApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL?.trim().replace(/\/$/, '') ?? '';
  const envMatch = fromEnv.match(/^(https?):\/\/([^/:]+)(?::(\d+))?/i);
  const protocol = envMatch?.[1] ?? 'http';
  const envHost = envMatch?.[2] ?? '';
  const port = envMatch?.[3] ?? '8080';

  // 웹만 .env 의 localhost 를 그대로 쓴다. 폰·시뮬레이터에서 localhost 는
  // 개발 PC가 아니라 기기 자신이라 "서버에 연결하지 못했어요"가 난다.
  if (Platform.OS === 'web') {
    return fromEnv || `${protocol}://localhost:${port}`;
  }

  const hostUri = Constants.expoConfig?.hostUri ?? '';
  const expoHost = hostUri.replace(/^[a-z]+:\/\//i, '').split('/')[0]?.split(':')[0];
  let hostname = envHost && !isLoopbackHost(envHost) ? envHost : expoHost || '127.0.0.1';
  if (Platform.OS === 'android' && isLoopbackHost(hostname)) {
    hostname = '10.0.2.2';
  }
  return `${protocol}://${hostname}:${port}`;
}

export function newFlowSessionId(): string {
  const cryptoObj = globalThis.crypto;
  if (cryptoObj && typeof cryptoObj.randomUUID === 'function') {
    return cryptoObj.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const n = (Math.random() * 16) | 0;
    const v = char === 'x' ? n : (n & 0x3) | 0x8;
    return v.toString(16);
  });
}
