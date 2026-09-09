import type { FaceCaptureStage } from '@/features/onboarding/face-capture/faceStages';
import type { Carrier, IdType } from '@/features/onboarding/hooks/useOnboardingState';

import { appendImage, apiJson } from './http';
import { digitsOnly, toIdCardType, toPhoneCarrier } from './map';

export type AccountVerificationMethod = 'ACCOUNT_PASSWORD' | 'ONE_WON';

export type CreateSessionResponse = {
  onboardingSessionId: string;
};

export type PhoneVerifyRequestResponse = {
  verificationSessionId: string;
};

export type StartIssuanceResponse = {
  issuanceId: string;
};

export type ScanIdCardResponse = {
  issuanceId: string;
  scanId: string;
  recognizedName?: string;
  maskedIdNumber?: string;
  issueDate?: string;
};

export type VerifyFaceResponse = {
  completedStage?: FaceCaptureStage;
  nextStage?: FaceCaptureStage | null;
  verified?: boolean;
  comparisonFailureCount?: number;
};

export type SaveAccountResponse = {
  accountVerificationTargetId: string;
  verificationMethod?: AccountVerificationMethod;
  maskedAccountNumber?: string;
};

export type RequestOneWonResponse = {
  verificationId: string;
};

export type CompleteOnboardingResponse = {
  userId: number;
  name?: string;
  certificateIssued?: boolean;
};

export function createOnboardingSession() {
  return apiJson<CreateSessionResponse>('/api/onboarding/sessions', { method: 'POST' });
}

export function saveOnboardingName(onboardingSessionId: string, name: string) {
  return apiJson('/api/onboarding/name', {
    method: 'POST',
    body: JSON.stringify({ onboardingSessionId, name: name.trim() }),
  });
}

export function requestPhoneVerification(
  onboardingSessionId: string,
  carrier: Carrier,
  phoneNumber: string,
) {
  return apiJson<PhoneVerifyRequestResponse>('/api/onboarding/phone/verify/request', {
    method: 'POST',
    body: JSON.stringify({
      onboardingSessionId,
      carrier: toPhoneCarrier(carrier ?? 'SKT'),
      phoneNumber: digitsOnly(phoneNumber),
    }),
  });
}

export function resendPhoneVerification(onboardingSessionId: string, verificationSessionId: string) {
  return apiJson('/api/onboarding/phone/verify/resend', {
    method: 'POST',
    body: JSON.stringify({ onboardingSessionId, verificationSessionId }),
  });
}

export function confirmPhoneVerification(
  onboardingSessionId: string,
  verificationSessionId: string,
  verificationCode: string,
) {
  return apiJson('/api/onboarding/phone/verify/confirm', {
    method: 'POST',
    body: JSON.stringify({ onboardingSessionId, verificationSessionId, verificationCode }),
  });
}

export function startCertificateIssuance(onboardingSessionId: string) {
  return apiJson<StartIssuanceResponse>('/api/onboarding/certificate/issuance', {
    method: 'POST',
    body: JSON.stringify({ onboardingSessionId }),
  });
}

export async function scanIdCard(
  issuanceId: string,
  idType: IdType,
  imageUri: string,
): Promise<ScanIdCardResponse> {
  const form = new FormData();
  await appendImage(form, 'image', imageUri, 'id-card.jpg');
  const query = new URLSearchParams({
    issuanceId,
    idCardType: toIdCardType(idType ?? '주민등록증'),
  });
  return apiJson<ScanIdCardResponse>(`/api/onboarding/certificate/id-card/scan?${query.toString()}`, {
    method: 'POST',
    body: form,
  });
}

export function confirmIdCard(issuanceId: string, scanId: string, confirmed: boolean) {
  return apiJson('/api/onboarding/certificate/id-card/confirm', {
    method: 'POST',
    body: JSON.stringify({ issuanceId, scanId, confirmed }),
  });
}

export async function verifyFace(
  issuanceId: string,
  scanId: string,
  captureStage: FaceCaptureStage,
  imageUri: string,
): Promise<VerifyFaceResponse> {
  const form = new FormData();
  await appendImage(form, 'faceImage', imageUri, `face-${captureStage.toLowerCase()}.jpg`);
  const query = new URLSearchParams({ issuanceId, scanId, captureStage });
  return apiJson<VerifyFaceResponse>(`/api/onboarding/certificate/face/verify?${query.toString()}`, {
    method: 'POST',
    body: form,
  });
}

export function saveAccountVerificationTarget(
  issuanceId: string,
  bankCode: string,
  accountNumber: string,
) {
  return apiJson<SaveAccountResponse>('/api/onboarding/certificate/accounts', {
    method: 'POST',
    body: JSON.stringify({
      issuanceId,
      bankCode,
      accountNumber: digitsOnly(accountNumber),
    }),
  });
}

export function verifyAccountPassword(
  accountVerificationTargetId: string,
  issuanceId: string,
  accountPassword: string,
) {
  return apiJson(`/api/onboarding/certificate/accounts/${accountVerificationTargetId}/password/verify`, {
    method: 'POST',
    body: JSON.stringify({ issuanceId, accountPassword }),
  });
}

export function requestOneWonVerification(accountVerificationTargetId: string, issuanceId: string) {
  return apiJson<RequestOneWonResponse>(
    `/api/onboarding/certificate/accounts/${accountVerificationTargetId}/one-won/request`,
    {
      method: 'POST',
      body: JSON.stringify({ issuanceId }),
    },
  );
}

export function confirmOneWonVerification(
  accountVerificationTargetId: string,
  issuanceId: string,
  verificationId: string,
  verificationCode: string,
) {
  return apiJson(`/api/onboarding/certificate/accounts/${accountVerificationTargetId}/one-won/confirm`, {
    method: 'POST',
    body: JSON.stringify({ issuanceId, verificationId, verificationCode }),
  });
}

export function setSimplePassword(issuanceId: string, password: string) {
  return apiJson('/api/onboarding/certificate/password', {
    method: 'POST',
    body: JSON.stringify({ issuanceId, password, passwordConfirm: password }),
  });
}

export function getOnboardingCompletion(onboardingSessionId: string) {
  const query = new URLSearchParams({ onboardingSessionId });
  return apiJson<CompleteOnboardingResponse>(`/api/onboarding/complete?${query.toString()}`);
}

export function formatIssueDate(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return value;
  return `${match[1]}년 ${Number(match[2])}월 ${Number(match[3])}일`;
}
