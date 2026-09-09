import type { IdCaptureStatus } from './types';

/** 동시에 여러 문제가 감지되면 먼저 해결해야 하는 순서. */
const PRIORITY: IdCaptureStatus[] = [
  'CROPPED',
  'TOO_CLOSE',
  'TOO_FAR',
  'GLARE',
  'BLURRY',
  'GOOD_POSITION',
  'CAPTURED',
];

/** 감지된 문제들 중 지금 안내할 하나를 우선순위로 고른다. */
export function resolvePrimaryStatus(issues: IdCaptureStatus[]): IdCaptureStatus {
  return PRIORITY.find((status) => issues.includes(status)) ?? 'GOOD_POSITION';
}
