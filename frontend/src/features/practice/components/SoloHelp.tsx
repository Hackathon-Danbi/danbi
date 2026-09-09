import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { P } from '../theme';

/** danbi_jj practice/components/SoloHelp.tsx 이식. 6초 뒤 나타나는 도움 카드. */
export function SoloHelp({ hint }: { hint: string }) {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const idle = setTimeout(() => setVisible(true), 6000);
    return () => clearTimeout(idle);
  }, []);

  if (!visible) return null;

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.qMark}>
          <AppText size={15} weight={900} color={P.accentText}>
            ?
          </AppText>
        </View>
        <AppText size={15} weight={800} color={P.ink}>
          어려우신가요?
        </AppText>
      </View>
      {expanded ? (
        <AppText size={14} color={P.muted} lineHeight={21} style={styles.hint}>
          {hint}
        </AppText>
      ) : null}
      <Pressable
        accessibilityRole="button"
        disabled={expanded}
        onPress={() => setExpanded(true)}
        style={styles.btn}
      >
        <AppText size={14} weight={700} color={expanded ? P.muted : P.accentText}>
          {expanded ? '도움말을 확인했어요' : '도움받기'}
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 16,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: P.accentBorder,
    backgroundColor: P.accentSurface,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qMark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: P.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: { marginTop: 8 },
  btn: { marginTop: 10, alignSelf: 'flex-start' },
});
