import { extractAccountNumberCandidates, type AccountNumberCandidate } from './ocrAccountNumber';

/** 선택한 로컬 이미지를 기기 안에서 OCR하고, 확정 전 후보만 반환한다. */
export async function findAccountNumbersInImage(uri: string): Promise<AccountNumberCandidate[]> {
  const { extractTextFromImage, isSupported } = await import('expo-text-extractor');
  if (!isSupported) return [];

  const recognizedTexts = await extractTextFromImage(uri);
  return extractAccountNumberCandidates(recognizedTexts);
}
