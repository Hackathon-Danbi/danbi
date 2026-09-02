import Svg, { Line, Path, Rect } from 'react-native-svg';

import { INK } from '../theme';

/** danbi_jj main/components.tsx <MicIcon> 이식. */
export function MicIcon({ size = 50, color = INK }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 52 64" fill="none">
      <Rect x={14} y={1} width={24} height={36} rx={12} fill={color} />
      <Path
        d="M4 28C4 40.15 13.85 50 26 50C38.15 50 48 40.15 48 28"
        stroke={color}
        strokeWidth={6}
        strokeLinecap="round"
      />
      <Line x1={26} y1={50} x2={26} y2={62} stroke={color} strokeWidth={6} strokeLinecap="round" />
      <Line x1={14} y1={62} x2={38} y2={62} stroke={color} strokeWidth={6} strokeLinecap="round" />
    </Svg>
  );
}
