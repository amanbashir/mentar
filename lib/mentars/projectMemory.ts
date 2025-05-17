export interface ProjectMemory {
  projectName: string;
  selectedModel: 'ecommerce' | 'agency' | 'saas' | 'copywriting';
  currentStage: string;
  currentStep: string;
  completedStages: string[];
  outputs: {
    productIdeas?: string[];
    personas?: string[];
    hooks?: string[];
    copySnippets?: string[];
    sopLinks?: string[];
    offerStack?: string;
    competitorSummary?: string;
  };
  notes: Record<string, string>;
  tasksInProgress: string[];
}

export const projectMemory: ProjectMemory = {
  projectName: '',
  selectedModel: 'ecommerce',
  currentStage: 'stage_1',
  currentStep: '',
  completedStages: [],
  outputs: {},
  notes: {},
  tasksInProgress: []
};