import type { RiskScenarioId } from '../types';

export type ScenarioContactType = 'call' | 'message';

export type RiskScenario = {
  id: RiskScenarioId;
  title: string;
  replayTitle: string;
  contactType: ScenarioContactType;
  contactName: string;
  contactAddress: string;
  dialogueSteps: {
    id: string;
    speaker: 'scammer' | 'user';
    text: string;
    tts?: boolean;
  }[];
  transferRequest: {
    recipientName: string;
    bank: string;
    account: string;
    amount: number;
  };
  riskSignals: string[];
  learningMessage: string;
};
