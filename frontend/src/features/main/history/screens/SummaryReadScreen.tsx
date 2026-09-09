import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path, Polygon, Rect } from 'react-native-svg';

import { AppText } from '@/components/ui/AppText';
import { speakResponse, stop as stopTts } from '@/lib/speech/tts';
import { INK, YELLOW } from '../../theme';
import { NavBar } from '../../components/NavBar';
import { RealTxBadge } from '../components/RealTxBadge';

type Status = 'reading' | 'paused' | 'done';

const TICK_MS = 200;
/** 한글은 rate 0.88 기준 대략 글자당 0.34초. 화면의 진행 막대·남은 시간 추정에만 쓴다. */
const estimateSec = (text: string) => Math.max(1.4, text.replace(/\s/g, '').length * 0.34);

/**
 * 미확인 거래 요약을 TTS 로 읽어준다.
 *
 * expo-speech 는 Android 에서 pause/resume 을 지원하지 않으므로, "잠시 멈춤"은
 * 재생을 끊고 현재 줄 시작 지점을 기억했다가 재개할 때 그 줄부터 다시 읽는 방식으로
 * 모든 플랫폼(Expo Go 포함)에서 동일하게 동작시킨다.
 */
export function SummaryReadScreen({
  total,
  lines,
  onDetail,
  onBack,
  summaryText,
  audioUrl,
}: {
  total: number;
  /** 통장별 요약 줄. 예: ["생활비 통장 2건", "연금 통장 1건"] */
  lines: string[];
  onDetail: () => void;
  onBack: () => void;
  summaryText?: string;
  audioUrl?: string | null;
}) {
  const spoken = useMemo(
    () => summaryText
      ? [summaryText]
      : [`최근 7일 동안 확인하지 않은 거래는 모두 ${total}건이에요.`, ...lines],
    [total, lines, summaryText],
  );
  const lineSecs = useMemo(() => spoken.map(estimateSec), [spoken]);
  const totalSec = useMemo(() => lineSecs.reduce((a, b) => a + b, 0), [lineSecs]);
  /** 각 줄이 끝나는 누적 시간(초). */
  const cumSec = useMemo(() => {
    let acc = 0;
    return lineSecs.map((s) => (acc += s));
  }, [lineSecs]);

  const [status, setStatus] = useState<Status>('reading');
  const [elapsed, setElapsed] = useState(0);
  const runId = useRef(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    timer.current = setInterval(() => {
      setElapsed((e) => Math.min(e + TICK_MS / 1000, totalSec));
    }, TICK_MS);
  }, [clearTimer, totalSec]);

  const speakFrom = useCallback(
    (startLine: number) => {
      const myRun = ++runId.current;
      setStatus('reading');
      startTimer();

      const next = (i: number) => {
        if (runId.current !== myRun) return;
        if (i >= spoken.length) {
          clearTimer();
          setElapsed(totalSec);
          setStatus('done');
          return;
        }
        // 진행 막대가 앞선 줄보다 뒤로 가지 않게 이 줄 시작 지점으로 맞춘다.
        setElapsed((e) => Math.max(e, i === 0 ? 0 : cumSec[i - 1]));
        void speakResponse(spoken[i], i === 0 ? audioUrl : null, {
          onDone: () => {
            if (runId.current === myRun) next(i + 1);
          },
        });
      };

      next(startLine);
    },
    [startTimer, clearTimer, spoken, totalSec, cumSec, audioUrl],
  );

  // 화면 전환이 한 박자 지난 뒤 읽기 시작하고, 나갈 때 정리한다.
  useEffect(() => {
    const kickoff = setTimeout(() => speakFrom(0), 250);
    return () => {
      clearTimeout(kickoff);
      runId.current += 1;
      clearTimer();
      stopTts();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pause = useCallback(() => {
    runId.current++;
    clearTimer();
    stopTts();
    setStatus('paused');
  }, [clearTimer]);

  const resume = useCallback(() => {
    const line = cumSec.findIndex((c) => elapsed < c);
    const from = line < 0 ? 0 : line;
    setElapsed(from === 0 ? 0 : cumSec[from - 1]);
    speakFrom(from);
  }, [cumSec, elapsed, speakFrom]);

  const replay = useCallback(() => {
    setElapsed(0);
    speakFrom(0);
  }, [speakFrom]);

  const onToggle = () => {
    if (status === 'reading') pause();
    else if (status === 'paused') resume();
    else replay();
  };

  const progress = totalSec ? Math.min(elapsed / totalSec, 1) : 0;
  const statusText =
    status === 'reading'
      ? '거래내역을 읽고 있어요'
      : status === 'paused'
        ? '잠시 멈췄어요'
        : '다 읽었어요';

  return (
    <View style={styles.root}>
      <NavBar title="요약 읽어주기" onBack={onBack} />

      <View style={styles.body}>
        <RealTxBadge />

        <View style={[styles.orb, status === 'paused' && styles.orbPaused]}>
          <Svg width={54} height={54} viewBox="0 0 24 24" fill="none">
            <Path
              d="M4 9v6h4l5 4V5L8 9H4z"
              fill={INK}
              stroke={INK}
              strokeWidth={1.5}
              strokeLinejoin="round"
            />
            {status !== 'paused' ? (
              <Path
                d="M16 9c1.2 1 1.2 5 0 6M18.5 7c2.2 1.8 2.2 8.2 0 10"
                stroke={INK}
                strokeWidth={2}
                strokeLinecap="round"
                fill="none"
              />
            ) : null}
          </Svg>
        </View>

        <AppText size={22} weight={900} color={INK} align="center" style={styles.status}>
          {statusText}
        </AppText>

        <View style={styles.card}>
          <AppText size={16} color={INK} lineHeight={26}>
            {'“'}{summaryText ?? `최근 7일 동안 확인하지 않은 거래는 모두 ${total}건이에요.`}{'”'}
          </AppText>
          <View style={styles.cardLines}>
            {lines.map((line) => (
              <AppText key={line} size={16} weight={800} color="#444" lineHeight={26}>
                · {line}
              </AppText>
            ))}
          </View>
        </View>

        <View style={styles.progressWrap}>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]} />
          </View>
          <View style={styles.timeRow}>
            <AppText size={12} weight={700} color="#999">
              {Math.round(elapsed)}초
            </AppText>
            <AppText size={12} weight={700} color="#999">
              {Math.round(totalSec)}초
            </AppText>
          </View>
        </View>

        <View style={styles.controls}>
          <Pressable accessibilityRole="button" onPress={replay} style={styles.sideBtn}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path
                d="M4 12a8 8 0 1 1 2.3 5.6M4 12V7M4 12h5"
                stroke={INK}
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </Svg>
            <AppText size={13} weight={800} color={INK}>
              다시 듣기
            </AppText>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={status === 'reading' ? '잠시 멈춤' : '다시 재생'}
            onPress={onToggle}
            style={styles.playBtn}
          >
            <Svg width={30} height={30} viewBox="0 0 24 24" fill="none">
              {status === 'reading' ? (
                <>
                  <Rect x={6} y={5} width={4} height={14} rx={1} fill={INK} />
                  <Rect x={14} y={5} width={4} height={14} rx={1} fill={INK} />
                </>
              ) : (
                <Polygon points="7,4 20,12 7,20" fill={INK} />
              )}
            </Svg>
          </Pressable>

          <Pressable accessibilityRole="button" onPress={onDetail} style={styles.sideBtn}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path
                d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"
                stroke={INK}
                strokeWidth={2.4}
                strokeLinecap="round"
              />
            </Svg>
            <AppText size={13} weight={800} color={INK}>
              자세히 보기
            </AppText>
          </Pressable>
        </View>

        <AppText size={13} color="#999" align="center" style={styles.hint}>
          가운데 버튼으로 재생과 잠시 멈춤을 할 수 있어요.
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  body: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  orb: {
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: YELLOW,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    marginBottom: 18,
  },
  orbPaused: { backgroundColor: '#FFE9A8' },
  status: { marginBottom: 16 },
  card: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1.6,
    borderColor: '#EFEAD9',
    backgroundColor: '#FCFBF6',
    padding: 18,
  },
  cardLines: { marginTop: 8, gap: 2 },
  progressWrap: { width: '100%', marginTop: 22 },
  track: {
    width: '100%',
    height: 8,
    borderRadius: 6,
    backgroundColor: '#EDEAE0',
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 6, backgroundColor: YELLOW },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 'auto',
  },
  sideBtn: { alignItems: 'center', gap: 6, width: 96, paddingVertical: 8 },
  playBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: YELLOW,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: { marginTop: 16 },
});
