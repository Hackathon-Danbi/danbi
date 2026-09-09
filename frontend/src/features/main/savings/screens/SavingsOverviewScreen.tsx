import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { INK, YELLOW } from '../../theme';
import { AskDanbiButton, HomeBar, SavingsHeader } from '../../imports/_shared';
import { DepositOverviewCard } from '../../imports/DepositOverview';
import { SavingsOverviewCard } from '../../imports/SavingsOverview';
import type { SavingsProductSummary } from '@/api';

/** danbi_jj main/screens/savings.tsx <SavingsOverviewScreen> 이식 (적금 ↔ 예금 carousel). */
export function SavingsOverviewScreen({
  onBack,
  onSavingsDetail,
  onDepositDetail,
  onHome,
  products,
  error,
  onAskDanbi,
}: {
  onBack: () => void;
  onSavingsDetail: (product: SavingsProductSummary) => void;
  onDepositDetail: (product: SavingsProductSummary) => void;
  onHome: () => void;
  products: SavingsProductSummary[];
  error?: string;
  onAskDanbi: (product: SavingsProductSummary) => void;
}) {
  const [cardIndex, setCardIndex] = useState(0);
  const safeCardIndex = Math.min(cardIndex, Math.max(0, products.length - 1));
  const product = products[safeCardIndex] ?? products[0];
  const isSavings = product?.productType !== 'TIME_DEPOSIT';

  if (!product) return null;

  return (
    <View style={styles.root}>
      <SavingsHeader title="나의 예금 · 적금" onBack={onBack} />

      <ScrollView contentContainerStyle={styles.body}>
        {error ? (
          <View style={styles.errorCard}>
            <AppText size={15} weight={700} color="#a7372b" lineHeight={21}>{error}</AppText>
          </View>
        ) : null}
        {isSavings
          ? <SavingsOverviewCard product={product} />
          : <DepositOverviewCard product={product} />}

        <Pressable
          accessibilityRole="button"
          onPress={() => isSavings ? onSavingsDetail(product) : onDepositDetail(product)}
          style={styles.detailBtn}
        >
          <AppText size={17} weight={900} color={INK}>
            자세히 보기
          </AppText>
        </Pressable>

        <View style={styles.nav}>
          <Pressable
            accessibilityRole="button"
            disabled={safeCardIndex === 0}
            onPress={() => setCardIndex((current) => Math.max(0, current - 1))}
            style={[styles.navBtn, safeCardIndex === 0 && styles.navBtnOff]}
          >
            <AppText size={18} weight={900} color={safeCardIndex === 0 ? '#a8a39b' : '#2d2926'}>
              ‹ 이전
            </AppText>
          </Pressable>
          <View style={styles.dots}>
            {products.map((item, index) => (
              <View key={item.accountId} style={[styles.dot, index === safeCardIndex && styles.dotOn]} />
            ))}
          </View>
          <Pressable
            accessibilityRole="button"
            disabled={safeCardIndex === products.length - 1}
            onPress={() => setCardIndex((current) => Math.min(products.length - 1, current + 1))}
            style={[styles.navBtn, safeCardIndex === products.length - 1 && styles.navBtnOff]}
          >
            <AppText size={18} weight={900} color={safeCardIndex === products.length - 1 ? '#a8a39b' : '#2d2926'}>
              다음 ›
            </AppText>
          </Pressable>
        </View>

        <AppText size={18} weight={900} color={INK} align="center" style={styles.ask}>
          궁금한 점이 있으신가요?
        </AppText>
        <AskDanbiButton
          onPress={() => onAskDanbi(product)}
        />
      </ScrollView>

      <HomeBar onHome={onHome} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FBFAF7' },
  body: { padding: 18, gap: 14 },
  detailBtn: {
    width: '100%',
    paddingVertical: 15,
    alignItems: 'center',
    backgroundColor: YELLOW,
    borderRadius: 16,
  },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navBtn: {
    borderWidth: 1.5,
    borderColor: '#D8D3C9',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  navBtnOff: { backgroundColor: '#F7F4ED', borderColor: '#E3DFD6' },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#DDD9D1' },
  dotOn: { backgroundColor: YELLOW },
  ask: { marginTop: 6 },
  errorCard: { padding: 12, borderRadius: 12, backgroundColor: '#fff0ed' },
});
