import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/theme/tokens';
import type { MissionId } from '../data/missions';

type Props = {
  missionId: MissionId;
  onComplete: () => void;
  onExit: () => void;
};

const CASES_CONTENT = {
  eyebrow: '실제 사례',
  title: '이런 전화가\n보이스피싱이에요',
  intro: '최근 자주 발생한 사례예요. 이런 전화가 오면 바로 끊으세요.',
  cards: [
    {
      tag: '검찰·경찰 사칭',
      heading: '"귀하 계좌가 범죄에 사용됐습니다"',
      body: '검찰이나 경찰이라며 "수사를 위해 계좌를 안전한 곳으로 옮겨야 한다"고 합니다. 실제 수사기관은 절대 전화로 계좌 이체를 요구하지 않아요.',
    },
    {
      tag: '금융감독원 사칭',
      heading: '"안전 계좌로 이동해야 합니다"',
      body: '금감원 직원을 사칭해 "대포통장 피해자"라고 속인 뒤 돈을 이체하게 합니다. 금감원은 개인에게 계좌 이체를 요구하지 않아요.',
    },
    {
      tag: '자녀 사칭',
      heading: '"엄마, 나 폰 고장났어 급해"',
      body: '문자나 카카오톡으로 자녀인 척 "급하게 돈이 필요하다"고 합니다. 낯선 번호로 자녀라 하면 먼저 전화로 직접 확인하세요.',
    },
    {
      tag: '대출 사기',
      heading: '"낮은 금리로 바꿔드립니다, 수수료만 먼저"',
      body: '저금리 대출로 갈아탈 수 있다며 수수료나 보증금 명목으로 먼저 돈을 보내라고 합니다. 정상 금융사는 선입금을 요구하지 않아요.',
    },
  ],
};

const PREVENTION_CONTENT = {
  eyebrow: '예방법',
  title: '이렇게 하면\n피해를 막을 수 있어요',
  intro: '간단한 습관 4가지가 내 돈을 지켜줘요.',
  cards: [
    {
      tag: '원칙 1',
      heading: '전화로 계좌 이체 요구 → 무조건 의심',
      body: '정부기관·금융사·가족을 사칭해도 전화로 돈을 보내라고 하면 무조건 의심하고 끊으세요. 먼저 끊고 공식 번호로 확인하세요.',
    },
    {
      tag: '원칙 2',
      heading: '모르는 번호로 "기관" 사칭 → 공식 번호로 확인',
      body: '낯선 번호로 경찰·검찰·금감원이라고 해도 믿지 마세요. 직접 114에 문의하거나 공식 홈페이지에서 번호를 찾아 다시 전화하세요.',
    },
    {
      tag: '원칙 3',
      heading: '링크 클릭·앱 설치 유도 → 절대 따르지 않기',
      body: '문자로 보낸 링크를 클릭하거나 "원격 제어 앱"을 설치하면 개인정보와 돈이 모두 빠져나갈 수 있어요.',
    },
    {
      tag: '원칙 4',
      heading: '의심되면 즉시 신고: 112 또는 1332',
      body: '보이스피싱이 의심되거나 이미 피해를 입었다면 112(경찰) 또는 1332(금융감독원)로 바로 신고하세요. 빠를수록 피해를 줄일 수 있어요.',
    },
  ],
};

/** danbi_jj missions/phishing/PhishingLearnScreen.tsx 이식. */
export function PhishingLearnScreen({ missionId, onComplete, onExit }: Props) {
  const content = missionId === 'phishing-cases' ? CASES_CONTENT : PREVENTION_CONTENT;

  return (
    <View style={styles.root}>
      <Pressable accessibilityRole="button" onPress={onExit} style={styles.exit}>
        <AppText size={14} weight={700} color={colors.muted}>
          연습 그만하기
        </AppText>
      </Pressable>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.eyebrow}>
          <AppText size={13} weight={900} color={colors.accentText}>
            {content.eyebrow}
          </AppText>
        </View>
        <AppText size={26} weight={900} color={colors.ink} lineHeight={33} letterSpacing={-1} style={styles.title}>
          {content.title}
        </AppText>
        <AppText size={14} color={colors.muted} lineHeight={21} style={styles.intro}>
          {content.intro}
        </AppText>

        <View style={styles.cardList}>
          {content.cards.map((card) => (
            <View key={card.tag} style={styles.card}>
              <View style={styles.cardTag}>
                <AppText size={12} weight={900} color={colors.accentText}>
                  {card.tag}
                </AppText>
              </View>
              <AppText size={16} weight={900} color={colors.ink} lineHeight={22} style={styles.cardHeading}>
                &quot;{card.heading}&quot;
              </AppText>
              <AppText size={14} color="#555" lineHeight={22}>
                {card.body}
              </AppText>
            </View>
          ))}
        </View>

        <Pressable accessibilityRole="button" onPress={onComplete} style={styles.cta}>
          <AppText size={18} weight={850} color="#241d08">
            다 읽었어요, 완료하기
          </AppText>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper },
  exit: { alignSelf: 'flex-end', paddingVertical: 10, paddingHorizontal: 16 },
  scroll: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 28 },
  eyebrow: {
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: colors.yellowSoft,
    marginBottom: 8,
  },
  title: { marginBottom: 8 },
  intro: { marginBottom: 14 },
  cardList: { gap: 10, marginBottom: 20 },
  card: {
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: 18,
    backgroundColor: '#fff',
  },
  cardTag: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: colors.accentSurface,
    marginBottom: 8,
  },
  cardHeading: { marginBottom: 7 },
  cta: {
    width: '100%',
    minHeight: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: colors.yellow,
  },
});
