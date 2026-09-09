import { StyleSheet, View } from 'react-native';

/**
 * danbi_jj onboarding.css .welcome-mascot-cloud (순수 CSS 도형) 를 RN View 로 근사.
 * 노란 구름 캐릭터: 몸통 + 위쪽 두 혹 + 눈/입/볼/팔. 픽셀 퍼펙트가 아니라 인상 유지가 목표.
 */
export function CloudMascot({ scale = 1 }: { scale?: number }) {
  return (
    <View style={[styles.glowWrap, { transform: [{ scale }] }]}>
      <View style={styles.glow} />

      <View style={styles.cloud}>
        {/* 위쪽 혹 2개 */}
        <View style={[styles.bump, styles.bumpLeft]} />
        <View style={[styles.bump, styles.bumpRight]} />

        {/* 팔 */}
        <View style={[styles.arm, styles.armLeft]} />
        <View style={[styles.arm, styles.armRight]} />

        {/* 눈 */}
        <View style={[styles.eye, styles.eyeLeft]} />
        <View style={[styles.eye, styles.eyeRight]} />

        {/* 볼 */}
        <View style={[styles.cheek, styles.cheekLeft]} />
        <View style={[styles.cheek, styles.cheekRight]} />

        {/* 입 */}
        <View style={styles.mouth} />
      </View>
    </View>
  );
}

const BODY = '#ffd42e';
const FACE = '#28251e';

const styles = StyleSheet.create({
  glowWrap: {
    width: 270,
    height: 270,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 270,
    height: 270,
    borderRadius: 135,
    backgroundColor: 'rgba(255, 211, 50, 0.18)',
  },
  cloud: {
    width: 164,
    height: 128,
    borderTopLeftRadius: 78,
    borderTopRightRadius: 78,
    borderBottomLeftRadius: 72,
    borderBottomRightRadius: 72,
    backgroundColor: BODY,
  },
  bump: {
    position: 'absolute',
    borderRadius: 44,
    backgroundColor: BODY,
  },
  bumpLeft: { width: 88, height: 88, left: 16, top: -34 },
  bumpRight: { width: 80, height: 80, right: 10, top: -20 },
  arm: {
    position: 'absolute',
    width: 30,
    height: 64,
    borderRadius: 15,
    backgroundColor: '#ffd634',
  },
  armLeft: { left: -17, bottom: 4, transform: [{ rotate: '28deg' }] },
  armRight: { right: -17, top: 8, transform: [{ rotate: '42deg' }] },
  eye: {
    position: 'absolute',
    width: 10,
    height: 18,
    borderRadius: 5,
    backgroundColor: FACE,
    top: 54,
  },
  eyeLeft: { left: 59 },
  eyeRight: { right: 52 },
  cheek: {
    position: 'absolute',
    width: 22,
    height: 13,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 132, 70, 0.35)',
    top: 76,
  },
  cheekLeft: { left: 28 },
  cheekRight: { right: 24 },
  mouth: {
    position: 'absolute',
    left: 74,
    top: 74,
    width: 28,
    height: 16,
    borderBottomWidth: 4,
    borderColor: FACE,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
});
