export interface StageData {
  objective: string;
  steps?: Array<{
    title: string;
    [key: string]: any;
  }>;
  checklist?: string[];
  aiSupport?: string[];
  deliverables?: string[];
  pitfalls?: string[];
  [key: string]: any;
}

export interface BusinessStrategy {
  preStartFitCheck?: {
    description: string;
    questions: string[];
    guidance?: string;
  };
  preStartEvaluation?: {
    description: string;
    questions: string[];
    actions?: string[];
  };
  preQualification?: {
    description: string;
    questions: string[];
    actions?: string[];
  };
  stage_1: StageData;
  stage_2: StageData;
  stage_3: StageData;
  stage_4: StageData;
  stage_5: StageData;
  scaling?: StageData;
  [key: string]: any;
}

export type StageKey = Extract<keyof BusinessStrategy, 'stage_1' | 'stage_2' | 'stage_3' | 'stage_4' | 'stage_5' | 'scaling' | 'preStartFitCheck' | 'preStartEvaluation' | 'preQualification'>; 