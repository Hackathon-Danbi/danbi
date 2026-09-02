import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { P } from '../theme';

/** danbi_jj practice/components/PracticeProgress.tsx 이식. */
export function PracticeProgress({
  current,
  total = 4,
  label,
}: {
  current: number;
  total?: number;
  label?: string;
}) {
  return (
    <View style={styles.wrap} accessibilityLabel={`연습 진행 ${current} / ${total}${label ? `, ${label}` : ''}`}>
      <View style={styles.row}>
        <AppText size={14} color={P.muted}>
          <AppText size={14} weight={900} color={P.ink}>
            {current}
          </AppText>{' '}
          / {total}
        </AppText>
        {label ? (
          <AppText size={13} weight={700} color={P.accentText}>
            {label}
          </AppText>
        ) : null}
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${(current / total) * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  track: { height: 8, borderRadius: 999, backgroundColor: '#e5e7f5', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 999, backgroundColor: P.accent },
});
