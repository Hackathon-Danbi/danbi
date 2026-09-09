import { getJSON, setJSON, StorageKeys } from '@/lib/storage';

/** 로그인 API가 없을 때 송금·거래 호출에 쓰는 데모 식별자. */
export type ApiIdentity = {
  userId: number;
  accountId: number;
};

const DEFAULT_IDENTITY: ApiIdentity = { userId: 1, accountId: 1 };

export async function getApiIdentity(): Promise<ApiIdentity> {
  const stored = await getJSON<Partial<ApiIdentity>>(StorageKeys.apiIdentity);
  const userId = typeof stored?.userId === 'number' && stored.userId > 0 ? stored.userId : DEFAULT_IDENTITY.userId;
  const accountId =
    typeof stored?.accountId === 'number' && stored.accountId > 0 ? stored.accountId : DEFAULT_IDENTITY.accountId;
  return { userId, accountId };
}

export async function saveApiIdentity(next: Partial<ApiIdentity>): Promise<ApiIdentity> {
  const current = await getApiIdentity();
  const merged: ApiIdentity = {
    userId: next.userId && next.userId > 0 ? next.userId : current.userId,
    accountId: next.accountId && next.accountId > 0 ? next.accountId : current.accountId,
  };
  await setJSON(StorageKeys.apiIdentity, merged);
  return merged;
}
