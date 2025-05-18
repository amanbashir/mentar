export interface Project {
  id: string;
  user_id: string;
  business_type: string;
  created_at: string;
  is_deleted: boolean;
  selected_model: string | null;
  current_stage: string | null;
  current_step: string | null;
  completed_stages: string[];
  outputs: Record<string, any>;
  notes: Record<string, any>;
  tasks_in_progress: string[];
  business_idea: string | null;
  brief_summary: string | null;
  total_budget: string | null;
  expected_launch_date: string | null;
  income_goal: number | null;
  business_overview_summary: string | null;
  todos: TodoItem[];
}

export interface TodoItem {
  task: string;
  completed: boolean;
}

export type StageKey = 
  | 'preStartFitCheck'
  | 'preStartEvaluation'
  | 'preQualification'
  | 'stage_1'
  | 'stage_2'
  | 'stage_3'
  | 'stage_4'
  | 'stage_5'
  | 'stage_6'
  | 'stage_7'
  | 'stage_8'
  | 'stage_9'
  | 'stage_10'
  | 'scaling'; 