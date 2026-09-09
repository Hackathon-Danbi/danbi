import { useLocalSearchParams } from 'expo-router';

import { MissionMode } from '@/features/missions/MissionMode';
import { isReviewableTransferStep } from '@/features/missions/transferDifficulty';
import type { ReviewableTransferStep } from '@/features/missions/transferDifficulty';

function reviewParam(value: string | string[] | undefined): ReviewableTransferStep | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw && isReviewableTransferStep(raw) ? raw : undefined;
}

/** 원본 /practice = "나의 금융독립" = MissionMode. */
export default function PracticeRoute() {
  const { review } = useLocalSearchParams<{ review?: string | string[] }>();
  return <MissionMode startReviewStep={reviewParam(review)} />;
}
