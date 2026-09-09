import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { accounts as ALL_ACCOUNTS, defaultAccount, type Account } from '@/features/shared/data';

/**
 * "지금 보고 있는 / 돈을 보낼 통장" 하나를 앱 전역에서 공유한다.
 * 거래내역과 돈 보내기가 같은 선택을 쓰도록 (app) 레이아웃에 한 번만 올린다.
 * 별도 스토어/영속화는 두지 않는다 — 화면을 다시 열면 첫 통장으로 돌아간다.
 */
type SelectedAccountContextValue = {
  accounts: Account[];
  selectedAccount: Account;
  selectAccount: (account: Account) => void;
};

const SelectedAccountContext = createContext<SelectedAccountContextValue | null>(null);

export function SelectedAccountProvider({ children }: { children: ReactNode }) {
  const [selectedId, setSelectedId] = useState(defaultAccount.accountId);

  const value = useMemo<SelectedAccountContextValue>(
    () => ({
      accounts: ALL_ACCOUNTS,
      selectedAccount:
        ALL_ACCOUNTS.find((account) => account.accountId === selectedId) ?? defaultAccount,
      selectAccount: (account: Account) => setSelectedId(account.accountId),
    }),
    [selectedId],
  );

  return (
    <SelectedAccountContext.Provider value={value}>{children}</SelectedAccountContext.Provider>
  );
}

export function useSelectedAccount(): SelectedAccountContextValue {
  const value = useContext(SelectedAccountContext);
  if (!value) {
    throw new Error('useSelectedAccount must be used inside <SelectedAccountProvider>');
  }
  return value;
}
