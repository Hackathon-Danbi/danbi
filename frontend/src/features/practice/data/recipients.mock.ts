import type { SavedRecipient } from '../types';

export const savedRecipients = [
  {
    id: 'minsu',
    name: '김민수',
    bank: 'KB국민은행',
    account: '123456789012',
    initials: '김',
  },
  {
    id: 'younghee',
    name: '이영희',
    bank: '신한은행',
    account: '110234567890',
    initials: '이',
  },
] as const satisfies readonly SavedRecipient[];
