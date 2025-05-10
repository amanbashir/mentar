import { supabase } from './supabaseClient';
import { Database } from '../../types/supabase';

type ProjectData = {
  business_idea: string;
  brief_summary: string;
  total_budget: number;
  expected_launch_date: string;
  income_goal: number;
  todo_1: string;
  todo_2: string;
  todo_3: string;
  todo_4: string;
};

export const storeProjectData = async (userId: string, data: ProjectData) => {
  const { error } = await supabase
    .from('projects')
    .upsert({
      user_id: userId,
      ...data,
    });

  if (error) {
    console.error('Error storing project data:', error);
    throw error;
  }
};

export const getProjectData = async (userId: string) => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching project data:', error);
    throw error;
  }

  return data;
}; 