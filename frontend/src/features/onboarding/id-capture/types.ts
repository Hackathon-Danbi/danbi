/** 신분증 촬영 경험의 도메인 타입. */

export type IdCaptureStatus =
  | 'TOO_CLOSE'
  | 'TOO_FAR'
  | 'CROPPED'
  | 'BLURRY'
  | 'GLARE'
  | 'GOOD_POSITION'
  | 'CAPTURED';

export type CropDirection = 'left' | 'right' | 'up' | 'down';
export type GlareDirection = 'left' | 'right';

export type IdCaptureObservation = {
  issues: IdCaptureStatus[];
  cropDirection?: CropDirection;
  glareDirection?: GlareDirection;
};
