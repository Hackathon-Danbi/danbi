import { getString, remove, setString, StorageKeys } from '@/lib/storage';

export const PIN_LENGTH = 6;

/**
 * 가입 때 정한 간편 비밀번호를 저장하고, 로그인·재인증에서 확인한다.
 *
 * 프로토타입이라 안전한 해시(예: 서버 검증, SecureStore)를 쓰지 않고 AsyncStorage 에
 * 그대로 둔다. 실제 서비스라면 기기 보안 저장소와 서버 검증으로 바꿔야 한다.
 */

export function isValidPin(pin: string) {
  return new RegExp(`^\\d{${PIN_LENGTH}}$`).test(pin);
}

export async function savePin(pin: string): Promise<void> {
  if (!isValidPin(pin)) return;
  await setString(StorageKeys.authPin, pin);
}

export async function hasPin(): Promise<boolean> {
  return (await getString(StorageKeys.authPin)) != null;
}

export async function verifyPin(pin: string): Promise<boolean> {
  const stored = await getString(StorageKeys.authPin);
  return stored != null && stored === pin;
}

export async function clearPin(): Promise<void> {
  await remove(StorageKeys.authPin);
}
