
export type Language = 'Tamil' | 'English' | 'Hindi' | 'Malayalam' | 'Telugu';

export enum Classification {
  HUMAN = 'HUMAN',
  AI = 'AI_GENERATED',
  INCONCLUSIVE = 'INCONCLUSIVE'
}

export interface AnalysisResult {
  classification: Classification;
  confidenceScore: number;
  explanation: string;
  detectedLanguage: string;
  artifacts?: string[];
}

export interface AudioSample {
  base64: string;
  mimeType: string;
  fileName: string;
}
