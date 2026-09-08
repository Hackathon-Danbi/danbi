import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type KeyboardTypeOptions,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { AppText } from '@/components/ui/AppText';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Sheet } from '@/components/ui/Sheet';
import { colors, radius } from '@/theme/tokens';

// ──────────────────────────────────────────────────────────
// OnboardingIcon — danbi_jj 인라인 SVG 아이콘 세트를 react-native-svg 로 이식
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
  color = '#4d473d',
}: {
  name: string;
  size?: number;
  color?: string;
}) {
  const stroke = color;
  const common = {
    fill: 'none' as const,
    stroke,
    strokeWidth: 1.8,
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
// Header + progress
// ──────────────────────────────────────────────────────────
export function OnboardingHeader({
  eyebrow,
  title,
  progress,
  onBack,
  onExit,
  showBack = true,
}: {
  eyebrow: string;
  title: string;
  progress: number;
  onBack: () => void;
  onExit: () => void;
  showBack?: boolean;
}) {
  return (
    <View>
      <View style={s.header}>
        {showBack ? (
          <Pressable accessibilityRole="button" accessibilityLabel="이전 화면" onPress={onBack} style={s.headerBtn}>
            <AppText size={34} weight={400} color="#201e19" lineHeight={34}>
              ‹
            </AppText>
          </Pressable>
        ) : (
          <View style={s.headerBtn} />
        )}
        <View style={s.headerCenter}>
          <AppText size={16} weight={700} color="#6d685e" align="center" style={s.headerEyebrow}>
            {eyebrow}
          </AppText>
          <AppText size={22} weight={900} align="center" numberOfLines={1}>
            {title}
          </AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="가입 그만하기"
          onPress={onExit}
          style={[s.headerBtn, s.headerExit]}
        >
          <AppText size={22} weight={700} color="#4e4a43">
            ✕
          </AppText>
        </Pressable>
      </View>
      <ProgressBar value={progress} height={8} trackColor="#e9e6de" />
    </View>
  );
}

export function VoiceGuideButton({ onClick, isReading }: { onClick: () => void; isReading: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isReading }}
      onPress={onClick}
      style={[s.voiceGuide, isReading && s.voiceGuideReading]}
    >
      <OnboardingIcon name="volume" size={28} color={isReading ? '#2e2500' : '#433600'} />
      <AppText size={22} weight={900} color={isReading ? '#2e2500' : '#433600'}>
        {isReading ? '읽어주는 중 · 멈추기' : '이 화면 읽어주기'}
      </AppText>
    </Pressable>
  );
}

export function StepBadge({ icon, children }: { icon: string; children: string }) {
  return (
    <View style={s.stepBadge}>
      <OnboardingIcon name={icon} size={18} color={colors.accentText} />
      <AppText size={17} weight={850} color={colors.accentText}>
        {children}
      </AppText>
    </View>
  );
}

export function PageTitle({ children }: { children: string }) {
  return (
    <AppText size={34} weight={900} lineHeight={40} letterSpacing={-1.5} style={s.title}>
      {children}
    </AppText>
  );
}

export function GuideText({ children }: { children: string }) {
  return (
    <AppText size={21} weight={400} lineHeight={31} color="#555149" style={s.guide}>
      {children}
    </AppText>
  );
}

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
        <OnboardingIcon name={icon} size={32} color="#4d473d" />
      </View>
      <View style={s.flex1}>
        <AppText size={22} weight={700} lineHeight={30}>
          {title}
        </AppText>
        <AppText size={18} lineHeight={27} color="#625e55" style={s.mt6}>
          {description}
        </AppText>
      </View>
    </View>
  );
}

export function OnboardingTipList({ items }: { items: string[] }) {
  return (
    <View style={s.tipList}>
      {items.slice(0, 3).map((item) => (
        <View key={item} style={s.tipRow}>
          <View style={s.tipBullet}>
            <AppText size={17} weight={900} color="#5b4a0a">
              ✓
            </AppText>
          </View>
          <AppText size={18} weight={700} lineHeight={26} color="#48443d" style={s.flex1}>
            {item}
          </AppText>
        </View>
      ))}
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
      style={[s.selectionCard, selected && s.selectionCardOn]}
    >
      {icon ? (
        <View style={[s.selectionIcon, selected && s.selectionIconOn]}>
          <OnboardingIcon name={icon} size={28} color={selected ? '#342a00' : '#4d473d'} />
        </View>
      ) : null}
      <View style={s.flex1}>
        <AppText size={23} weight={700} lineHeight={30}>
          {title}
        </AppText>
        {description ? (
          <AppText size={18} lineHeight={25} color="#69645b" style={s.mt5}>
            {description}
          </AppText>
        ) : null}
      </View>
      <View style={[s.selectionStatus, selected && s.selectionStatusOn]}>
        {selected ? (
          <AppText size={18} weight={900} color="#332900">
            ✓
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
}

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
}) {
  const showCheck = !!value && !error;
  return (
    <View style={s.textInput}>
      <AppText size={20} weight={900}>
        {label}
      </AppText>
      <View style={[s.textInputBox, error ? s.textInputBoxError : null]}>
        <TextInput
          style={s.textInputField}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#aaa59b"
          keyboardType={inputMode ? (KEYBOARD[inputMode] ?? 'default') : 'default'}
          maxLength={maxLength}
          autoFocus={autoFocus}
        />
        {showCheck ? <OnboardingIcon name="check" size={19} color="#2f8b5d" /> : null}
      </View>
      {error || support ? (
        <AppText size={17} weight={error ? 800 : 400} lineHeight={25} color={error ? '#a7372b' : '#615d55'}>
          {error || support}
        </AppText>
      ) : null}
    </View>
  );
}

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
      style={[s.agreeAll, checked && s.agreeCardOn]}
    >
      <View style={[s.agreeAllCheck, checked && s.agreeCheckOn]}>
        {checked ? <OnboardingIcon name="check" size={22} color="#302600" /> : null}
      </View>
      <AppText size={21} weight={900} lineHeight={27} style={s.flex1}>
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
    <View style={[s.agreeCard, checked && s.agreeCardOn]}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        onPress={onToggle}
        style={s.agreeToggle}
      >
        <View style={[s.agreeCheck, checked && s.agreeCheckOn]}>
          {checked ? <OnboardingIcon name="check" size={19} color="#302600" /> : null}
        </View>
        <View style={s.flex1}>
          <AppText size={19} weight={700} lineHeight={26}>
            {title}
          </AppText>
          <AppText size={17} lineHeight={24} color="#615d55" style={s.mt5}>
            {description}
          </AppText>
        </View>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={onDetail} style={s.agreeDetailBtn}>
        <AppText size={17} weight={850} color="#575147" align="center">
          내용 보기
        </AppText>
      </Pressable>
    </View>
  );
}

export function GuideBox({
  icon = 'shield',
  title,
  description,
  tone = 'neutral',
}: {
  icon?: string;
  title: string;
  description?: string;
  tone?: 'neutral' | 'success' | 'error';
}) {
  const toneStyle =
    tone === 'success' ? s.guideBoxSuccess : tone === 'error' ? s.guideBoxError : null;
  const fg = tone === 'success' ? '#215a3e' : tone === 'error' ? '#8f3025' : '#514a3a';
  return (
    <View style={[s.guideBox, toneStyle]}>
      <OnboardingIcon name={icon} size={20} color={fg} />
      <View style={s.flex1}>
        <AppText size={18} weight={700} lineHeight={25} color={fg}>
          {title}
        </AppText>
        {description ? (
          <AppText size={17} lineHeight={26} color={fg} style={s.mt5}>
            {description}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

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
          s.actionPrimary,
          primaryDisabled && s.actionPrimaryDisabled,
          pressed && !primaryDisabled && s.actionPressed,
        ]}
      >
        <AppText size={22} weight={850} color={primaryDisabled ? '#8a857a' : '#241d08'} align="center">
          {primary}
        </AppText>
      </Pressable>
      {secondary && onSecondary ? (
        <Pressable
          accessibilityRole="button"
          onPress={onSecondary}
          style={({ pressed }) => [s.actionSecondary, pressed && s.actionPressed]}
        >
          <AppText size={22} weight={850} color="#292721" align="center">
            {secondary}
          </AppText>
        </Pressable>
      ) : null}
      {quiet && onQuiet ? (
        <Pressable accessibilityRole="button" onPress={onQuiet} style={s.actionQuiet}>
          <AppText size={18} weight={700} color="#4e4a43" style={s.underline}>
            {quiet}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

export function AgreementDetail({
  title,
  visible,
  onClose,
}: {
  title: string;
  visible: boolean;
  onClose: () => void;
}) {
  return (
    <Sheet visible={visible} onClose={onClose} title={title} a11yLabel={`${title} 상세 내용`}>
      <AppText size={17} lineHeight={26} color="#5d584f" style={s.detailBody}>
        서비스 가입과 안전한 본인 확인을 위해 필요한 내용을 안내해요. 입력한 정보는 정해진 목적에만
        사용하고 안전하게 보호합니다.
      </AppText>
      <View style={s.helpBox}>
        <View style={s.helpBoxBadge}>
          <AppText size={12} weight={900} color="#3b3000">
            안심
          </AppText>
        </View>
        <AppText size={16} lineHeight={24} color="#514a3a" style={s.flex1}>
          동의하기 전에 내용을 천천히 읽어보세요. 궁금한 점은 직원에게 물어볼 수 있어요.
        </AppText>
      </View>
      <Pressable accessibilityRole="button" onPress={onClose} style={s.detailBtn}>
        <AppText size={20} weight={850} color="#241d08" align="center">
          확인했어요
        </AppText>
      </Pressable>
    </Sheet>
  );
}

const s = StyleSheet.create({
  flex1: { flex: 1 },
  mt5: { marginTop: 5 },
  mt6: { marginTop: 6 },
  underline: { textDecorationLine: 'underline' as const },

  header: {
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingTop: 5,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: 'rgba(255,254,249,0.98)',
  },
  headerBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerExit: { alignItems: 'flex-end' },
  headerCenter: { flex: 1, minWidth: 0 },
  headerEyebrow: { marginBottom: 3 },

  voiceGuide: {
    flexDirection: 'row',
    width: '100%',
    minHeight: 68,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 30,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 2,
    borderColor: '#d8b523',
    borderRadius: radius.lg,
    backgroundColor: colors.yellowSoft,
  },
  voiceGuideReading: {
    borderColor: '#b58e00',
    backgroundColor: colors.yellow,
  },

  stepBadge: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    minHeight: 42,
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#dfc760',
    borderRadius: radius.pill,
    backgroundColor: colors.yellowSoft,
  },
  title: { marginTop: 18 },
  guide: { marginTop: 13 },

  infoCard: {
    flexDirection: 'row',
    minHeight: 108,
    alignItems: 'center',
    gap: 16,
    marginTop: 26,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
  },
  infoIcon: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    backgroundColor: '#f1eee6',
  },

  tipList: {
    gap: 12,
    marginTop: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
  },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 42 },
  tipBullet: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#f0ede5',
  },

  selectionCard: {
    flexDirection: 'row',
    width: '100%',
    minHeight: 92,
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#dedbd2',
    borderRadius: radius.lg,
    backgroundColor: colors.white,
  },
  selectionCardOn: {
    borderColor: colors.accentBorder,
    backgroundColor: colors.accentSurface,
  },
  selectionIcon: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: '#f0ede5',
  },
  selectionIconOn: { backgroundColor: colors.yellow },
  selectionStatus: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#c7c2b7',
    borderRadius: 17,
  },
  selectionStatusOn: { borderColor: colors.yellow, backgroundColor: colors.yellow },

  textInput: { gap: 9, marginTop: 28 },
  textInputBox: {
    flexDirection: 'row',
    minHeight: 68,
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    borderWidth: 2,
    borderColor: '#b8b2a7',
    borderRadius: radius.lg,
    backgroundColor: colors.white,
  },
  textInputBoxError: { borderColor: '#b94a3b' },
  textInputField: {
    flex: 1,
    minWidth: 0,
    color: colors.ink,
    fontSize: 24,
    fontWeight: '800',
    paddingVertical: 12,
  },

  agreeAll: {
    flexDirection: 'row',
    width: '100%',
    minHeight: 72,
    alignItems: 'center',
    gap: 14,
    marginTop: 26,
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderWidth: 2,
    borderColor: '#d7d3c9',
    borderRadius: radius.lg,
    backgroundColor: colors.white,
  },
  agreeAllCheck: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#aaa59b',
    borderRadius: 12,
    backgroundColor: colors.white,
  },
  agreeCard: {
    flexDirection: 'row',
    minHeight: 96,
    alignItems: 'stretch',
    borderWidth: 2,
    borderColor: '#dedbd2',
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  agreeCardOn: { borderColor: colors.accentBorder, backgroundColor: colors.accentSurface },
  agreeToggle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingLeft: 14,
    paddingRight: 10,
  },
  agreeCheck: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#aaa59b',
    borderRadius: 9,
  },
  agreeCheckOn: { borderColor: colors.yellow, backgroundColor: colors.yellow },
  agreeDetailBtn: {
    minWidth: 88,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: colors.line,
    backgroundColor: '#faf9f5',
  },

  guideBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 13,
    marginTop: 20,
    paddingVertical: 16,
    paddingHorizontal: 17,
    borderRadius: radius.md + 2,
    backgroundColor: '#f7f2e5',
  },
  guideBoxSuccess: { backgroundColor: '#eaf7ef' },
  guideBoxError: { backgroundColor: '#fff0ed' },

  actions: {
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 15,
    backgroundColor: 'rgba(255,254,249,0.98)',
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  actionPrimary: {
    width: '100%',
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    backgroundColor: colors.yellow,
  },
  actionPrimaryDisabled: { backgroundColor: '#ddd9cf' },
  actionSecondary: {
    width: '100%',
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: '#c8c2b4',
    backgroundColor: colors.white,
  },
  actionQuiet: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPressed: { opacity: 0.85, transform: [{ translateY: 1 }] },

  detailBody: { marginTop: 12, marginBottom: 16 },
  helpBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: '#f7f2e5',
    marginBottom: 16,
  },
  helpBoxBadge: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 7,
    backgroundColor: colors.yellow,
  },
  detailBtn: {
    width: '100%',
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md + 1,
    backgroundColor: colors.yellow,
  },
});
