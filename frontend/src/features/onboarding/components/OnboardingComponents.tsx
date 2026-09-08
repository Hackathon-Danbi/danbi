import type { ReactNode } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type KeyboardTypeOptions,
} from 'react-native';
import Svg, { Circle, Path, Polyline, Rect } from 'react-native-svg';

import { AppText } from '@/components/ui/AppText';
import { Sheet } from '@/components/ui/Sheet';
import { BORDER, CREAM, INK, YELLOW } from '@/features/main/theme';
import { getTerm, type TermId } from '../terms';

/**
 * 가입·인증 화면의 공통 부품. 크기/색/간격은 메인(홈) 화면 규격을 그대로 따른다:
 * 흰 배경 + 크림(#FFFDF8) 카드 + 금색 테두리 1.8 + radius 16, 본문 좌우 여백 18,
 * 제목 24/900, 소제목 17/900, 본문 15, 보조문구 13.
 *
 * 화면마다 배율을 다르게 축소하면 화면 간 글자 크기가 튀므로, 여기서는 고정 크기만
 * 쓰고 대신 한 화면에 담는 내용을 줄인다.
 */

// ──────────────────────────────────────────────────────────
// 아이콘
// ──────────────────────────────────────────────────────────
type IconName =
  | 'volume'
  | 'phone'
  | 'id'
  | 'face'
  | 'bank'
  | 'check'
  | 'shield'
  | 'lock'
  | 'message'
  | 'user'
  | 'sparkle';

export function OnboardingIcon({
  name,
  size = 22,
  color = INK,
}: {
  name: string;
  size?: number;
  color?: string;
}) {
  const common = {
    fill: 'none' as const,
    stroke: color,
    strokeWidth: 1.9,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  const paths: Record<IconName, ReactNode> = {
    volume: (
      <>
        <Path d="M5 10h4l5-4v12l-5-4H5z" {...common} />
        <Path d="M17 9c1.7 1.7 1.7 4.3 0 6M19.5 6.5a9 9 0 0 1 0 11" {...common} />
      </>
    ),
    phone: (
      <>
        <Rect x={7} y={3} width={10} height={18} rx={2} {...common} />
        <Path d="M10 6h4M11 18h2" {...common} />
      </>
    ),
    id: (
      <>
        <Rect x={3} y={5} width={18} height={14} rx={2} {...common} />
        <Circle cx={8} cy={11} r={2} {...common} />
        <Path d="M5.5 16c.7-2 4.3-2 5 0M13 9h5M13 13h5" {...common} />
      </>
    ),
    face: (
      <>
        <Circle cx={12} cy={12} r={7} {...common} />
        <Path d="M9 11h.01M15 11h.01M9.5 15c1.5 1 3.5 1 5 0" {...common} />
      </>
    ),
    bank: <Path d="M3 9h18L12 4zM5 10v7M9 10v7M15 10v7M19 10v7M3 20h18" {...common} />,
    check: <Path d="m5 12 4 4L19 6" {...common} />,
    shield: (
      <>
        <Path d="M12 3 5 6v5c0 4.5 3 7.5 7 10 4-2.5 7-5.5 7-10V6z" {...common} />
        <Path d="m9 12 2 2 4-4" {...common} />
      </>
    ),
    lock: (
      <>
        <Rect x={5} y={10} width={14} height={10} rx={2} {...common} />
        <Path d="M8 10V7a4 4 0 0 1 8 0v3" {...common} />
      </>
    ),
    message: <Path d="M4 5h16v11H9l-5 4z" {...common} />,
    user: (
      <>
        <Circle cx={12} cy={8} r={4} {...common} />
        <Path d="M5 21c.8-5 13.2-5 14 0" {...common} />
      </>
    ),
    sparkle: (
      <>
        <Path d="m12 3 1.3 4.2L17 9l-3.7 1.8L12 15l-1.3-4.2L7 9l3.7-1.8z" {...common} />
        <Path d="m19 15 .7 2.1L22 18l-2.3.9L19 21l-.7-2.1L16 18l2.3-.9z" {...common} />
      </>
    ),
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {paths[(name as IconName) in paths ? (name as IconName) : 'check']}
    </Svg>
  );
}

// ──────────────────────────────────────────────────────────
// 헤더 (메인 NavBar 규격 + 진행 표시)
// ──────────────────────────────────────────────────────────
export function OnboardingHeader({
  title,
  progress,
  onBack,
  onExit,
  showBack = true,
  onVoice,
  isReading,
}: {
  title: string;
  progress: number;
  onBack: () => void;
  onExit: () => void;
  showBack?: boolean;
  onVoice?: () => void;
  isReading?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, progress));
  return (
    <View>
      <View style={s.header}>
        {showBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="이전"
            onPress={onBack}
            style={s.headerBack}
            hitSlop={10}
          >
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Polyline
                points="15 18 9 12 15 6"
                stroke={INK}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </Pressable>
        ) : null}
        <AppText size={17} weight={900} color={INK}>
          {title}
        </AppText>
        {onVoice ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isReading ? '읽어주는 중, 멈추기' : '이 화면 읽어주기'}
            onPress={onVoice}
            style={s.headerVoice}
            hitSlop={10}
          >
            <OnboardingIcon name="volume" size={20} color={isReading ? INK : '#888'} />
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="가입 그만하기"
          onPress={onExit}
          style={s.headerExit}
          hitSlop={10}
        >
          <AppText size={19} weight={700} color="#999">
            ✕
          </AppText>
        </Pressable>
      </View>
      <View style={s.progressTrack}>
        <View style={[s.progressFill, { width: `${pct}%` }]} />
      </View>
    </View>
  );
}

export function VoiceGuideButton({ onClick, isReading }: { onClick: () => void; isReading: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isReading }}
      onPress={onClick}
      style={[s.voiceGuide, isReading && s.voiceGuideOn]}
    >
      <OnboardingIcon name="volume" size={19} color={INK} />
      <AppText size={14} weight={800} color={INK}>
        {isReading ? '읽어주는 중 · 멈추기' : '이 화면 읽어주기'}
      </AppText>
    </Pressable>
  );
}

// ──────────────────────────────────────────────────────────
// 본문 타이포 (홈 화면 스케일)
// ──────────────────────────────────────────────────────────
export function StepBadge({ icon, children }: { icon: string; children: string }) {
  return (
    <View style={s.stepBadge}>
      <OnboardingIcon name={icon} size={14} color={INK} />
      <AppText size={12} weight={700} color={INK}>
        {children}
      </AppText>
    </View>
  );
}

export function PageTitle({ children }: { children: string }) {
  return (
    <AppText size={24} weight={900} color={INK} lineHeight={33} style={s.title}>
      {children}
    </AppText>
  );
}

export function GuideText({ children }: { children: string }) {
  return (
    <AppText size={15} weight={400} color="#888" lineHeight={22} style={s.guide}>
      {children}
    </AppText>
  );
}

const CERT_STEPS = ['신분증', '얼굴', '계좌', '비밀번호'] as const;

/** 국민인증서 4단계를 모든 발급 화면에서 같은 위치에 보여 준다. */
export function CertProgress({ current }: { current: 0 | 1 | 2 | 3 | 4 }) {
  return (
    <View style={s.certProgress}>
      {CERT_STEPS.map((label, i) => {
        const n = (i + 1) as 1 | 2 | 3 | 4;
        const done = current > n;
        const active = current === n;
        return (
          <View
            key={label}
            style={[s.certChip, (done || active) && s.certChipOn, active && s.certChipActive]}
          >
            <AppText size={12} weight={800} color={INK}>
              {label}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

export function HeroMark({ icon }: { icon: string }) {
  return (
    <View style={s.heroMark}>
      <OnboardingIcon name={icon} size={34} color={INK} />
    </View>
  );
}

// ──────────────────────────────────────────────────────────
// 카드 / 목록
// ──────────────────────────────────────────────────────────
export function OnboardingInfoCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <View style={s.infoCard}>
      <View style={s.infoIcon}>
        <OnboardingIcon name={icon} size={24} color={INK} />
      </View>
      <View style={s.flex1}>
        <AppText size={17} weight={900} color={INK}>
          {title}
        </AppText>
        <AppText size={13} color="#888" lineHeight={19} style={s.mt3}>
          {description}
        </AppText>
      </View>
    </View>
  );
}

export function LargeSelectionCard({
  title,
  description,
  selected,
  onClick,
  icon,
}: {
  title: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
  icon?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onClick}
      style={[s.selectCard, selected && s.selectCardOn]}
    >
      {icon ? (
        <View style={[s.selectIcon, selected && s.selectIconOn]}>
          <OnboardingIcon name={icon} size={20} color={INK} />
        </View>
      ) : null}
      <View style={s.flex1}>
        <AppText size={17} weight={900} color={INK}>
          {title}
        </AppText>
        {description ? (
          <AppText size={13} color="#888" lineHeight={19} style={s.mt3}>
            {description}
          </AppText>
        ) : null}
      </View>
      <View style={[s.radio, selected && s.radioOn]}>
        {selected ? <OnboardingIcon name="check" size={14} color={INK} /> : null}
      </View>
    </Pressable>
  );
}

// ──────────────────────────────────────────────────────────
// 입력
// ──────────────────────────────────────────────────────────
const KEYBOARD: Record<string, KeyboardTypeOptions> = {
  numeric: 'number-pad',
  tel: 'phone-pad',
};

export function SeniorTextInput({
  label,
  support,
  error,
  value,
  onChangeText,
  placeholder,
  inputMode,
  maxLength,
  autoFocus,
  secure,
}: {
  label: string;
  support?: string;
  error?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  inputMode?: 'numeric' | 'tel' | 'text';
  maxLength?: number;
  autoFocus?: boolean;
  secure?: boolean;
}) {
  return (
    <View style={s.field}>
      <AppText size={13} weight={700} color="#888">
        {label}
      </AppText>
      <View style={[s.fieldBox, error ? s.fieldBoxError : null]}>
        <TextInput
          style={s.fieldInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#BBB"
          keyboardType={inputMode ? (KEYBOARD[inputMode] ?? 'default') : 'default'}
          maxLength={maxLength}
          autoFocus={autoFocus}
          secureTextEntry={secure}
        />
        {value && !error ? <OnboardingIcon name="check" size={17} color="#2F8B5D" /> : null}
      </View>
      {error || support ? (
        <AppText size={13} weight={error ? 700 : 400} lineHeight={19} color={error ? '#E05050' : '#AAA'}>
          {error || support}
        </AppText>
      ) : null}
    </View>
  );
}

// ──────────────────────────────────────────────────────────
// 약관
// ──────────────────────────────────────────────────────────
export function AgreementAllToggle({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={onToggle}
      style={[s.agreeAll, checked && s.agreeAllOn]}
    >
      <View style={[s.check, s.checkLarge, checked && s.checkOn]}>
        {checked ? <OnboardingIcon name="check" size={17} color={INK} /> : null}
      </View>
      <AppText size={17} weight={900} color={INK} style={s.flex1}>
        {label}
      </AppText>
    </Pressable>
  );
}

export function AgreementCard({
  title,
  description,
  checked,
  onToggle,
  onDetail,
}: {
  title: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
  onDetail: () => void;
}) {
  return (
    <View style={s.agreeRow}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        onPress={onToggle}
        style={s.agreeToggle}
      >
        <View style={[s.check, checked && s.checkOn]}>
          {checked ? <OnboardingIcon name="check" size={15} color={INK} /> : null}
        </View>
        <View style={s.flex1}>
          <AppText size={15} weight={800} color={INK}>
            {title}
          </AppText>
          <AppText size={12} color="#AAA" lineHeight={17} style={s.mt2}>
            {description}
          </AppText>
        </View>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={onDetail} style={s.agreeDetail} hitSlop={6}>
        <AppText size={13} weight={700} color="#888">
          보기 ›
        </AppText>
      </Pressable>
    </View>
  );
}

/** 메인 WarningBar 규격의 안내 상자. */
export function GuideBox({
  title,
  description,
  tone = 'neutral',
}: {
  title: string;
  description?: string;
  tone?: 'neutral' | 'success' | 'error';
}) {
  const box =
    tone === 'success' ? s.noticeSuccess : tone === 'error' ? s.noticeError : s.noticeNeutral;
  const fg = tone === 'success' ? '#20674A' : tone === 'error' ? '#A33B2E' : '#7A6000';
  return (
    <View style={[s.notice, box]}>
      <AppText size={14} weight={600} color={fg} lineHeight={21}>
        {title}
      </AppText>
      {description ? (
        <AppText size={13} weight={400} color={fg} lineHeight={19} style={s.mt3}>
          {description}
        </AppText>
      ) : null}
    </View>
  );
}

// ──────────────────────────────────────────────────────────
// 하단 버튼 (메인 앱 기본 버튼 규격)
// ──────────────────────────────────────────────────────────
export function BottomActionArea({
  primary,
  onPrimary,
  primaryDisabled,
  secondary,
  onSecondary,
  quiet,
  onQuiet,
}: {
  primary: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  secondary?: string;
  onSecondary?: () => void;
  quiet?: string;
  onQuiet?: () => void;
}) {
  return (
    <View style={s.actions}>
      <Pressable
        accessibilityRole="button"
        disabled={primaryDisabled}
        onPress={onPrimary}
        style={({ pressed }) => [
          s.primaryBtn,
          primaryDisabled && s.primaryBtnOff,
          pressed && !primaryDisabled && s.pressed,
        ]}
      >
        <AppText size={17} weight={900} color={primaryDisabled ? '#AAA' : INK}>
          {primary}
        </AppText>
      </Pressable>
      {secondary && onSecondary ? (
        <Pressable
          accessibilityRole="button"
          onPress={onSecondary}
          style={({ pressed }) => [s.secondaryBtn, pressed && s.pressed]}
        >
          <AppText size={17} weight={900} color={INK}>
            {secondary}
          </AppText>
        </Pressable>
      ) : null}
      {quiet && onQuiet ? (
        <Pressable accessibilityRole="button" onPress={onQuiet} style={s.quietBtn}>
          <AppText size={14} weight={700} color="#888" style={s.underline}>
            {quiet}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

export function AgreementDetail({
  termId,
  visible,
  onClose,
}: {
  termId: TermId | '';
  visible: boolean;
  onClose: () => void;
}) {
  const term = termId ? getTerm(termId) : null;
  const title = term?.title ?? '';
  return (
    <Sheet visible={visible} onClose={onClose} title={title} a11yLabel={`${title} 상세 내용`} tall>
      <ScrollView
        style={[s.detailScroll, Platform.OS === 'web' ? s.detailScrollWeb : null]}
        contentContainerStyle={s.detailScrollContent}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator
        bounces
      >
        <AppText size={15} lineHeight={24} color={INK}>
          {term?.body ?? ''}
        </AppText>
      </ScrollView>
      <View style={s.detailFooter}>
        <View style={[s.notice, s.noticeNeutral, s.mb16, s.mt3]}>
          <AppText size={13} lineHeight={19} color="#7A6000">
            동의하기 전에 내용을 천천히 읽어보세요. 궁금한 점은 직원에게 물어볼 수 있어요.
          </AppText>
        </View>
        <Pressable accessibilityRole="button" onPress={onClose} style={s.primaryBtn}>
          <AppText size={17} weight={900} color={INK}>
            확인했어요
          </AppText>
        </Pressable>
      </View>
    </Sheet>
  );
}

const s = StyleSheet.create({
  flex1: { flex: 1 },
  mt2: { marginTop: 2 },
  mt3: { marginTop: 3 },
  mb16: { marginBottom: 16 },
  underline: { textDecorationLine: 'underline' as const },

  // 헤더
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: '#fff',
  },
  headerBack: { position: 'absolute', left: 16, padding: 6 },
  headerVoice: { position: 'absolute', right: 48, padding: 6 },
  headerExit: { position: 'absolute', right: 16, padding: 6 },
  certProgress: { flexDirection: 'row', gap: 6, marginTop: 4, marginBottom: 4 },
  certChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#EBEBEB',
    backgroundColor: '#fff',
  },
  certChipOn: { borderColor: BORDER, backgroundColor: CREAM },
  certChipActive: { borderColor: YELLOW, backgroundColor: YELLOW },
  heroMark: {
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: YELLOW,
  },
  progressTrack: { height: 4, backgroundColor: '#F1F1F1' },
  progressFill: { height: '100%', backgroundColor: YELLOW },

  voiceGuide: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: BORDER,
    backgroundColor: CREAM,
  },
  voiceGuideOn: { backgroundColor: YELLOW },

  // 타이포
  stepBadge: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingLeft: 8,
    paddingRight: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: BORDER,
    backgroundColor: CREAM,
  },
  title: { marginTop: 12 },
  guide: { marginTop: 8 },

  // 카드
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 16,
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1.8,
    borderColor: BORDER,
    backgroundColor: CREAM,
  },
  infoIcon: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: YELLOW,
  },

  selectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 62,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.8,
    borderColor: '#EBEBEB',
    backgroundColor: '#fff',
  },
  selectCardOn: { borderColor: BORDER, backgroundColor: CREAM },
  selectIcon: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: '#F5F5F5',
  },
  selectIconOn: { backgroundColor: YELLOW },
  radio: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#DDD',
    borderRadius: 13,
  },
  radioOn: { borderColor: YELLOW, backgroundColor: YELLOW },

  // 입력
  field: { gap: 7, marginTop: 18 },
  fieldBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 56,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#EBEBEB',
    backgroundColor: '#fff',
  },
  fieldBoxError: { borderColor: '#E05050' },
  fieldInput: {
    flex: 1,
    minWidth: 0,
    color: INK,
    fontSize: 20,
    fontWeight: '800',
    paddingVertical: 10,
  },

  // 약관
  agreeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.8,
    borderColor: '#EBEBEB',
    backgroundColor: '#fff',
  },
  agreeAllOn: { borderColor: BORDER, backgroundColor: CREAM },
  agreeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
    borderRadius: 14,
    backgroundColor: '#fff',
  },
  agreeToggle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingLeft: 4,
  },
  agreeDetail: { paddingVertical: 8, paddingLeft: 8 },
  check: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#DDD',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  checkLarge: { width: 28, height: 28, borderRadius: 9 },
  checkOn: { borderColor: YELLOW, backgroundColor: YELLOW },

  // 안내 상자
  notice: {
    marginTop: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  noticeNeutral: { borderColor: YELLOW, backgroundColor: '#FFF8D0' },
  noticeSuccess: { borderColor: '#A8DCC0', backgroundColor: '#EFF9F3' },
  noticeError: { borderColor: '#F0B4AC', backgroundColor: '#FDF0EE' },

  // 하단 버튼
  actions: {
    gap: 8,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: '#fff',
  },
  primaryBtn: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: YELLOW,
  },
  primaryBtnOff: { backgroundColor: '#F0F0F0' },
  secondaryBtn: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#EBEBEB',
    backgroundColor: '#fff',
  },
  quietBtn: { alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  pressed: { opacity: 0.85 },

  detailScroll: { flex: 1, minHeight: 0, marginTop: 10, marginBottom: 8 },
  detailScrollWeb: { height: 0, flexGrow: 1 },
  detailScrollContent: { paddingBottom: 16, flexGrow: 0 },
  detailFooter: { flexShrink: 0 },
});
