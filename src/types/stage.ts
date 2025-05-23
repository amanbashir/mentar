export interface StageData {
  objective: string;
  steps: any[];
  checklist?: string[];
  levers?: string[];
  delegation?: {
    phase1: string[];
    phase2: string[];
  };
  aiSupport: string[];
  resources: {
    tools: string[];
    templates: string[];
  };
  metrics?: {
    CPA: string;
    retention: string;
    profitMargin: string;
    weeklyCalls: string;
    ROAS: string;
  };
  retentionLevers?: string[];
} 