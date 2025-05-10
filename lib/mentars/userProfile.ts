export interface UserProfile {
  budget: string | null;
  time: string | null;
  goalIncome: string | null;
  experience: string | null;
  skills: string | null;
  salesComfort: string | null;
  contentComfort: string | null;
  businessReason: string | null;
}

export const userProfile: UserProfile = {
  budget: null,
  time: null,
  goalIncome: null,
  experience: null,
  skills: null,
  salesComfort: null,
  contentComfort: null,
  businessReason: null
};