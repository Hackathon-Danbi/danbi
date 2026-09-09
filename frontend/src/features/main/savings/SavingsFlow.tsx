import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';

import { Screen } from '@/components/ui/Screen';
import { ScreenIn } from '@/components/anim/ScreenIn';
import { useAndroidBack } from '@/lib/useAndroidBack';
import { SavingsOverviewScreen } from './screens/SavingsOverviewScreen';
import { SavingsDetailScreen } from './screens/SavingsDetailScreen';
import { DepositDetailScreen } from './screens/DepositDetailScreen';
import { isApiConfigured, savingsApi } from '@/api';
import type {
  SavingsDepositDetail,
  SavingsInstallmentDetail,
  SavingsProductSummary,
} from '@/api';
import { speakResponse } from '@/lib/speech/tts';

type FlowScreen = 'savings' | 'savingsdetail' | 'depositdetail';

const FALLBACK_PRODUCTS: SavingsProductSummary[] = [
  {
    accountId: 10,
    productName: 'KB 국민행복적금',
    productType: 'FIXED_SAVINGS',
    balance: 3_600_000,
    appliedInterestRate: 3.2,
    maturityAt: '2027-08-25',
    remainingMonths: 11,
    currentMonthPayment: {
      paymentDate: '2026-09-25',
      scheduledAmount: 300_000,
      amount: 300_000,
      status: 'PAID',
    },
  },
  {
    accountId: 20,
    productName: 'KB 국민수퍼정기예금',
    productType: 'TIME_DEPOSIT',
    balance: 10_000_000,
    appliedInterestRate: 3.2,
    maturityAt: '2027-02-12',
    remainingMonths: 5,
    currentMonthPayment: null,
  },
];

function fallbackInstallment(product: SavingsProductSummary): SavingsInstallmentDetail {
  return {
    accountId: product.accountId,
    contractId: product.accountId,
    productName: product.productName,
    productType: product.productType === 'FREE_SAVINGS' ? 'FREE_SAVINGS' : 'FIXED_SAVINGS',
    balance: product.balance,
    appliedInterestRate: product.appliedInterestRate,
    expectedMaturityAmount: 7_120_000,
    maturityAt: product.maturityAt,
    currentMonthPayment: product.currentMonthPayment,
  };
}

function fallbackDeposit(product: SavingsProductSummary): SavingsDepositDetail {
  return {
    accountId: product.accountId,
    contractId: product.accountId,
    productName: product.productName,
    productType: 'TIME_DEPOSIT',
    balance: product.balance,
    appliedInterestRate: product.appliedInterestRate,
    expectedMaturityAmount: 10_134_000,
    openedAt: '2026-02-12',
    maturityAt: product.maturityAt,
    additionalPaymentAllowed: false,
  };
}

/**
 * danbi_jj main/MainBankingApp.tsx 의 예적금 화면(savings/savingsdetail/depositdetail)을
 * 하나의 내부 상태 머신으로 이식. 상세에서 뒤로가기는 개요로, 개요에서만 상위 라우트로.
 */
export function SavingsFlow() {
  const router = useRouter();
  const [screen, setScreen] = useState<FlowScreen>('savings');
  const [products, setProducts] = useState(FALLBACK_PRODUCTS);
  const [selectedProduct, setSelectedProduct] = useState<SavingsProductSummary>(FALLBACK_PRODUCTS[0]);
  const [installmentDetail, setInstallmentDetail] = useState<SavingsInstallmentDetail>(
    fallbackInstallment(FALLBACK_PRODUCTS[0]),
  );
  const [depositDetail, setDepositDetail] = useState<SavingsDepositDetail>(
    fallbackDeposit(FALLBACK_PRODUCTS[1]),
  );
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    if (!isApiConfigured()) return;
    let active = true;
    void savingsApi.getAll().then((items) => {
      if (!active || items.length === 0) return;
      setProducts(items);
      setSelectedProduct(items[0]);
      setApiError('');
    }).catch((cause) => {
      if (active) setApiError(cause instanceof Error ? cause.message : '예금·적금 목록을 불러오지 못했어요.');
    });
    return () => {
      active = false;
    };
  }, []);

  const goHome = () => router.dismissTo('/(app)/home');
  const goOverview = () => setScreen('savings');

  const openInstallment = (product: SavingsProductSummary) => {
    setSelectedProduct(product);
    setInstallmentDetail(fallbackInstallment(product));
    setScreen('savingsdetail');
    if (!isApiConfigured()) return;
    void savingsApi.getInstallment(product.accountId).then((detail) => {
      setInstallmentDetail(detail);
      setApiError('');
    }).catch((cause) => {
      setApiError(cause instanceof Error ? cause.message : '적금 상세를 불러오지 못했어요.');
    });
  };

  const openDeposit = (product: SavingsProductSummary) => {
    setSelectedProduct(product);
    setDepositDetail(fallbackDeposit(product));
    setScreen('depositdetail');
    if (!isApiConfigured()) return;
    void savingsApi.getDeposit(product.accountId).then((detail) => {
      setDepositDetail(detail);
      setApiError('');
    }).catch((cause) => {
      setApiError(cause instanceof Error ? cause.message : '예금 상세를 불러오지 못했어요.');
    });
  };

  const askDanbi = async (product: SavingsProductSummary) => {
    const localAnswer = product.productType === 'TIME_DEPOSIT'
      ? '예금은 목돈을 일정 기간 맡기는 상품이에요. 금리와 만기 정보를 확인해보세요.'
      : '적금은 매달 돈을 모으는 상품이에요. 납입 일정과 예상 만기 금액을 확인해보세요.';
    if (!isApiConfigured()) {
      void speakResponse(localAnswer);
      return;
    }
    try {
      const answer = await savingsApi.ask(product.accountId, `${product.productName}의 금리와 만기 정보를 알려줘`);
      setApiError('');
      void speakResponse(answer.answerText, answer.audioUrl);
    } catch (cause) {
      setApiError(cause instanceof Error ? cause.message : '음성 답변을 불러오지 못했어요.');
    }
  };

  useAndroidBack(() => {
    if (screen !== 'savings') {
      goOverview();
      return true;
    }
    return false;
  });

  return (
    <Screen background="#FBFAF7" edges={['top', 'bottom']}>
      <ScreenIn key={screen}>
        {screen === 'savings' && (
          <SavingsOverviewScreen
            onBack={goHome}
            products={products}
            error={apiError}
            onSavingsDetail={openInstallment}
            onDepositDetail={openDeposit}
            onAskDanbi={(product) => void askDanbi(product)}
            onHome={goHome}
          />
        )}
        {screen === 'savingsdetail' && (
          <SavingsDetailScreen
            onBack={goOverview}
            onHome={goHome}
            detail={installmentDetail}
            onAskDanbi={() => void askDanbi(selectedProduct)}
          />
        )}
        {screen === 'depositdetail' && (
          <DepositDetailScreen
            onBack={goOverview}
            onHome={goHome}
            detail={depositDetail}
            onAskDanbi={() => void askDanbi(selectedProduct)}
          />
        )}
      </ScreenIn>
    </Screen>
  );
}
