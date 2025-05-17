export interface StageData {
  objective: string;
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
} 