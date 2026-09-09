import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { P } from '../theme';

/**
 * danbi_jj practice/components/AppHeader.tsx 이식.
 * 브랜드 + 배지를 왼쪽에 묶어, 오른쪽은 상위(PracticeMode)의 "연습 그만하기" 버튼 자리로 비워둔다.
 */
export function AppHeader({ badge }: { badge?: string }) {
  return (
    <View style={styles.header}>
      <AppText size={20} weight={900} color={P.accentText}>
        단비
      </AppText>
      {badge ? (
        <View style={styles.badge}>
          <AppText size={15} weight={800} color={P.accentText}>
            {badge}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    // 오른쪽 상단 "연습 그만하기" 버튼과 겹치지 않도록 오른쪽 여백 확보
    paddingLeft: 20,
    paddingRight: 130,
    paddingVertical: 14,
    backgroundColor: P.accentSoft,
  },
  badge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.accentBorder,
  },
});
