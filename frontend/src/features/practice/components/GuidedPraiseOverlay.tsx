import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { P } from '../theme';
import { usePracticeApp } from '../PracticeContext';

/** danbi_jj practice/components/GuidedPraiseOverlay.tsx 이식. */
export function GuidedPraiseOverlay() {
  const { praise } = usePracticeApp();
  if (!praise) return null;
  return (
    <View style={styles.wrap} pointerEvents="none">
      <View style={styles.card}>
        <AppText size={22} weight={900} color={P.accentText} align="center">
          잘했어요!
        </AppText>
        <AppText size={16} color={P.ink} align="center" lineHeight={24} style={styles.mt6}>
          {praise.text}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20,24,40,0.5)',
    paddingHorizontal: 32,
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 22,
    paddingVertical: 28,
    paddingHorizontal: 24,
  },
  mt6: { marginTop: 6 },
});
