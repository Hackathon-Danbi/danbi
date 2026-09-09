import { WaveBars } from '@/components/anim/WaveBars';

/** danbi_jj main/components.tsx <Waveform> 이식 (= WaveBars, bars [22,38,54,40,26]). */
export function Waveform({ active }: { active: boolean }) {
  return <WaveBars active={active} />;
}
