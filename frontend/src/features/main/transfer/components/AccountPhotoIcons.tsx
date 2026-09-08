import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { INK, YELLOW } from '../../theme';

export function IconPhotoSearch({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Rect x={3} y={5} width={20} height={18} rx={3} fill="#fff" stroke={INK} strokeWidth={2.2} />
      <Path
        d="m6.5 19 5.2-5.2 3.6 3.5 2.2-2.1 3.2 3.1"
        stroke={INK}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={18.5} cy={10} r={2.2} fill={YELLOW} />
      <Circle cx={23.5} cy={23.5} r={5.2} fill={YELLOW} stroke={INK} strokeWidth={2.2} />
      <Path d="m27.3 27.3 2.3 2.3" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}

export function IconCamera({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Path
        d="M5 10.5h5l2-3h8l2 3h5v15H5v-15Z"
        fill="#fff"
        stroke={INK}
        strokeWidth={2.2}
        strokeLinejoin="round"
      />
      <Circle cx={16} cy={18} r={4.5} fill={YELLOW} stroke={INK} strokeWidth={2.2} />
    </Svg>
  );
}

export function IconAlbum({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Rect x={5} y={4} width={22} height={24} rx={3} fill="#fff" stroke={INK} strokeWidth={2.2} />
      <Circle cx={21.5} cy={10.5} r={2.5} fill={YELLOW} />
      <Path
        d="m8.5 23 6-7 4 4 2.5-3 3 3.5"
        stroke={INK}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IconScan({ size = 52 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      <Circle cx={28} cy={28} r={25} fill="#FFF7D5" />
      <Path
        d="M16 22v-6h6M34 16h6v6M40 34v6h-6M22 40h-6v-6"
        stroke={INK}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M14 28h28" stroke={YELLOW} strokeWidth={4} strokeLinecap="round" />
    </Svg>
  );
}
