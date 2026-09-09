import { Platform } from 'react-native';
import Constants from 'expo-constants';

/** 백엔드 origin. 끝에 슬래시 없음. */
export function getApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  const hostUri = Constants.expoConfig?.hostUri ?? '';
  const host = hostUri.replace(/^[a-z]+:\/\//i, '').split('/')[0]?.split(':')[0];
  let hostname = host && host.length > 0 ? host : 'localhost';
  if (Platform.OS === 'android' && (hostname === 'localhost' || hostname === '127.0.0.1')) {
    hostname = '10.0.2.2';
  }
  return `http://${hostname}:8080`;
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
