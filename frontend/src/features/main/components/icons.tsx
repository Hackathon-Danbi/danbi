import Svg, { Circle, Ellipse, Line, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';

import { INK, YELLOW } from '../theme';

/** danbi_jj main/components.tsx 의 인라인 SVG 아이콘 세트 이식. */

export function IconHistory() {
  return (
    <Svg width={54} height={54} viewBox="0 0 56 56" fill="none">
      <Rect x={6} y={4} width={32} height={40} rx={4} fill="white" stroke={INK} strokeWidth={3} />
      <Line x1={13} y1={14} x2={31} y2={14} stroke={INK} strokeWidth={3} strokeLinecap="round" />
      <Line x1={13} y1={22} x2={31} y2={22} stroke={INK} strokeWidth={3} strokeLinecap="round" />
      <Line x1={13} y1={30} x2={24} y2={30} stroke={INK} strokeWidth={3} strokeLinecap="round" />
      <Circle cx={40} cy={42} r={10} fill={YELLOW} stroke={INK} strokeWidth={3} />
      <Path d="M36 42h8M40 38v8" stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}

export function IconSend() {
  return (
    <Svg width={58} height={50} viewBox="0 0 60 52" fill="none">
      <Path d="M8 4l44 22L8 48V32l28-8L8 20V4z" fill="white" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <Circle cx={44} cy={38} r={12} fill={YELLOW} stroke={INK} strokeWidth={3} />
      <SvgText x={44} y={43} textAnchor="middle" fontSize={13} fontWeight="900" fill={INK}>
        ₩
      </SvgText>
    </Svg>
  );
}

export function IconPractice() {
  return (
    <Svg width={60} height={52} viewBox="0 0 62 54" fill="none">
      <Path
        d="M6 8C6 8 18 2 31 8C44 2 56 8 56 8V46C56 46 44 40 31 46C18 40 6 46 6 46V8Z"
        fill="white"
        stroke={INK}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <Line x1={31} y1={8} x2={31} y2={46} stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
      <Circle cx={20} cy={20} r={8} fill={YELLOW} stroke={INK} strokeWidth={3} />
      <Path d="M17 20l2.5 2.5L25 17" stroke={INK} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconSavings() {
  return (
    <Svg width={60} height={54} viewBox="0 0 62 56" fill="none">
      <Path d="M10 22C10 12 18 6 31 6C44 6 52 12 52 22V40C52 46 44 50 31 50C18 50 10 46 10 40V22Z" fill="white" stroke={INK} strokeWidth={3} />
      <Ellipse cx={31} cy={22} rx={21} ry={10} fill={YELLOW} stroke={INK} strokeWidth={3} />
      <Line x1={41} y1={10} x2={48} y2={4} stroke={INK} strokeWidth={3} strokeLinecap="round" />
      <Circle cx={51} cy={3} r={3} fill={INK} />
      <Ellipse cx={24} cy={36} rx={3} ry={2} fill={INK} />
    </Svg>
  );
}

export function IconBell({ size = 15, color = INK }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <Path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}

export function IconMenu({ color = INK }: { color?: string }) {
  return (
    <Svg width={22} height={16} viewBox="0 0 24 18" fill="none">
      <Path d="M1 1h22M1 9h22M1 17h22" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}

export function IconCard({ color = INK }: { color?: string }) {
  return (
    <Svg width={24} height={20} viewBox="0 0 28 24" fill="none">
      <Rect x={1} y={1} width={26} height={22} rx={4} stroke={color} strokeWidth={2.5} />
      <Line x1={1} y1={8} x2={27} y2={8} stroke={color} strokeWidth={2.5} />
      <Line x1={6} y1={15} x2={14} y2={15} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}

/** 거래내역 월 이동에 쓰는 달력. 홈 타일 아이콘과 같은 노란 머리 + 검은 테두리. */
export function IconCalendar({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={5} width={18} height={16} rx={3} fill="#fff" stroke={INK} strokeWidth={2} />
      <Path d="M3 9V8c0-1.7 1.3-3 3-3h12c1.7 0 3 1.3 3 3v1H3Z" fill={YELLOW} stroke={INK} strokeWidth={2} />
      <Line x1={8} y1={3} x2={8} y2={7.5} stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
      <Line x1={16} y1={3} x2={16} y2={7.5} stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
      <Rect x={7} y={13} width={4} height={4} rx={1} fill={YELLOW} />
      <Rect x={13} y={13} width={4} height={4} rx={1} fill={INK} opacity={0.12} />
    </Svg>
  );
}

export function IconChevronRight({ size = 18, color = '#CCC' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function TabIconSend({ active }: { active: boolean }) {
  const c = active ? YELLOW : '#999';
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M22 2L11 13" stroke={c} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      <Polygon points="22 2 15 22 11 13 2 9 22 2" stroke={c} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

export function TabIconHome({ active }: { active: boolean }) {
  return (
    <Svg width={22} height={25} viewBox="0 0 22 25" fill="none">
      <Path d="M0 9L11 0L22 9V25H15V16H7V25H0V9Z" fill={active ? '#FFCC00' : '#BBBBBB'} />
    </Svg>
  );
}

export function TabIconList({ active }: { active: boolean }) {
  const c = active ? YELLOW : '#999';
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={3} width={18} height={18} rx={2} stroke={c} strokeWidth={2.5} />
      <Line x1={7} y1={8} x2={17} y2={8} stroke={c} strokeWidth={2.5} strokeLinecap="round" />
      <Line x1={7} y1={12} x2={17} y2={12} stroke={c} strokeWidth={2.5} strokeLinecap="round" />
      <Line x1={7} y1={16} x2={13} y2={16} stroke={c} strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}
