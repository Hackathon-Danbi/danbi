import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { P } from '../theme';
import { usePracticeApp } from '../PracticeContext';
import { AppHeader } from '../components/AppHeader';
import { SafetyNote } from './shared';

/** danbi_jj practice/screens/PracticeHubScreen.tsx 이식. */
export function PracticeHubScreen() {
  const { practiceStyle, choosePracticeStyle } = usePracticeApp();

  return (
    <View style={styles.root}>
      <AppHeader badge="연습 전용 화면" />
      <ScrollView contentContainerStyle={styles.content}>
        <AppText size={14} weight={800} color={P.accentText}>
          안전하게 미리 해보세요
        </AppText>
        <AppText size={30} weight={900} color={P.ink} lineHeight={38} style={styles.title}>
          {'어떻게\n연습해볼까요?'}
        </AppText>

        <View style={styles.list}>
          <Choice
            icon="①"
            title="단계별로 따라하기"
            sub={'단비가 하나씩 알려드려요\n처음이라면 이 방법을 추천해요'}
            selected={practiceStyle === 'guided'}
            onPress={() => choosePracticeStyle('guided')}
          />
          <Choice
            icon="✓"
            title="혼자 해보기"
            sub={'안내 없이 실제처럼 해봐요\n이미 한 번 연습했다면 도전해보세요'}
            selected={practiceStyle === 'solo'}
            onPress={() => choosePracticeStyle('solo')}
          />
        </View>

        <SafetyNote text="연습 중에는 실제 돈이 움직이지 않아요." />
      </ScrollView>
    </View>
  );
}

function Choice({
  icon,
  title,
  sub,
  selected,
  onPress,
}: {
  icon: string;
  title: string;
  sub: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.card, selected && styles.cardSelected]}
    >
      <View style={styles.icon}>
        <AppText size={20} weight={900} color={P.accentText}>
          {icon}
        </AppText>
      </View>
      <View style={styles.flex1}>
        <AppText size={19} weight={900} color={P.ink}>
          {title}
        </AppText>
        <AppText size={14} color={P.muted} lineHeight={20} style={styles.mt4}>
          {sub}
        </AppText>
      </View>
      <AppText size={20} weight={900} color="#bbb">
        ›
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: P.paper },
  content: { paddingHorizontal: 22, paddingTop: 20, paddingBottom: 24, gap: 12 },
  flex1: { flex: 1 },
  mt4: { marginTop: 4 },
  title: { marginBottom: 8 },
  list: { gap: 14, marginTop: 8 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    minHeight: 92,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#dedbd2',
    backgroundColor: '#fff',
  },
  cardSelected: { borderColor: P.accentBorder, backgroundColor: P.accentSurface },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: P.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
