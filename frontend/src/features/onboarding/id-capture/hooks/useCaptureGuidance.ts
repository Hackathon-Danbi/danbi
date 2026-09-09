import { useCallback, useEffect, useRef, useState } from 'react';

import { speak as ttsSpeak, stop as ttsStop } from '@/lib/speech/tts';
import { CAPTURE_GUIDANCE } from '../constants';
import type { IdCaptureObservation, IdCaptureStatus } from '../types';
import { resolvePrimaryStatus } from '../utils';

const STATUS_STABLE_MS = 1200;
const SAME_GUIDE_COOLDOWN_MS = 6500;
const AUTO_CAPTURE_STABLE_MS = 2100;

type Options = {
  active: boolean;
  observation: IdCaptureObservation;
  onAutoCapture: () => void;
};

/**
 * danbi_jj id-capture/hooks/useCaptureGuidance.ts 이식.
 * 화면 상태 안정화 + 음성 안내(순차 재생·쿨다운) + 자동 촬영 정책.
 * 원본 window.speechSynthesis → lib/speech/tts (flush:false 로 큐 재생).
 */
export function useCaptureGuidance({ active, observation, onAutoCapture }: Options) {
  const candidate = resolvePrimaryStatus(observation.issues);
  const [stableStatus, setStableStatus] = useState<IdCaptureStatus>(candidate);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const lastSpoken = useRef<{ text: string; time: number } | null>(null);
  const pendingSpeech = useRef<{ text: string; force: boolean } | null>(null);
  const speakingRef = useRef(false);
  const capturedRef = useRef(false);
  const autoCaptureRef = useRef(onAutoCapture);

  useEffect(() => {
    autoCaptureRef.current = onAutoCapture;
  }, [onAutoCapture]);

  const stopSpeaking = useCallback(() => {
    pendingSpeech.current = null;
    speakingRef.current = false;
    ttsStop();
    setIsSpeaking(false);
  }, []);

  const speak = useCallback((text: string, force = false) => {
    const play = (message: string, bypassCooldown: boolean) => {
      const now = Date.now();
      if (
        !bypassCooldown &&
        lastSpoken.current?.text === message &&
        now - lastSpoken.current.time < SAME_GUIDE_COOLDOWN_MS
      ) {
        return;
      }
      lastSpoken.current = { text: message, time: now };
      speakingRef.current = true;
      setIsSpeaking(true);
      ttsSpeak(message, {
        rate: 0.86,
        flush: false,
        onDone: () => {
          speakingRef.current = false;
          setIsSpeaking(false);
          const pending = pendingSpeech.current;
          pendingSpeech.current = null;
          if (pending) play(pending.text, pending.force);
        },
      });
    };

    if (speakingRef.current) {
      // 재생 중에는 가장 최근 안내 하나만 남겨 순서대로 읽고, 오래된 안내는 버립니다.
      pendingSpeech.current = { text, force };
      return;
    }
    play(text, force);
  }, []);

  // 짧게 튀는 분석 결과는 무시하고 같은 결과가 유지될 때만 화면 상태를 확정합니다.
  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => setStableStatus(candidate), STATUS_STABLE_MS);
    return () => clearTimeout(timer);
  }, [active, candidate]);

  useEffect(() => {
    if (!active || stableStatus === 'CAPTURED') return;
    speak(CAPTURE_GUIDANCE[stableStatus].tts);
  }, [active, speak, stableStatus]);

  // GOOD_POSITION이 잠깐 나타난 경우에는 촬영하지 않고, 안정적으로 유지된 경우에만 한 번 촬영합니다.
  useEffect(() => {
    if (
      !active ||
      stableStatus !== 'GOOD_POSITION' ||
      candidate !== 'GOOD_POSITION' ||
      capturedRef.current
    ) {
      return;
    }
    const timer = setTimeout(() => {
      capturedRef.current = true;
      setStableStatus('CAPTURED');
      autoCaptureRef.current();
    }, AUTO_CAPTURE_STABLE_MS);
    return () => clearTimeout(timer);
  }, [active, candidate, stableStatus]);

  useEffect(() => {
    if (stableStatus !== 'CAPTURED') return;
    speak(CAPTURE_GUIDANCE.CAPTURED.tts, true);
  }, [speak, stableStatus]);

  useEffect(() => () => stopSpeaking(), [stopSpeaking]);

  const resetCapture = useCallback(() => {
    capturedRef.current = false;
    setStableStatus(resolvePrimaryStatus(observation.issues));
    stopSpeaking();
  }, [observation.issues, stopSpeaking]);

  return { stableStatus, isSpeaking, speak, stopSpeaking, resetCapture };
}
