import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { colors } from '@/theme/tokens';

type ScreenProps = {
  children: ReactNode;
  /** 안전영역 패딩을 적용할 가장자리. 기본 전체. */
  edges?: readonly Edge[];
  /** 배경색. 기본 --paper. */
  background?: string;
  style?: ViewStyle | ViewStyle[];
  /** SafeAreaView 대신 일반 View 로 감싼다(내부에서 자체 처리하는 화면용). */
  unsafe?: boolean;
};

/** 화면 최상위 래퍼. 원본 .app-stage / .phone-shell 프레임은 기기 뷰포트로 대체. */
export function Screen({
  children,
  edges = ['top', 'right', 'bottom', 'left'],
  background = colors.paper,
  style,
  unsafe = false,
}: ScreenProps) {
  const Container = unsafe ? View : SafeAreaView;
  return (
    <Container
      style={[styles.root, { backgroundColor: background }, style as ViewStyle]}
      {...(unsafe ? {} : { edges })}
    >
      {children}
    </Container>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    minHeight: 0,
  },
});
