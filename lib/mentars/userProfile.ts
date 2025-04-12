export interface UserProfile {
  selectedModel: 'ecommerce' | 'agency' | 'saas' | 'copywriting' | null;
  budget: string | null;
  time: string | null;
  experience: string | null;
  skill: string | null;
  goalIncome: string | null;
  salesComfort: string | null;
  contentComfort: string | null;
  businessReason: string | null;
  persona: string | null;
  productIdeas: string[];
  competitorCheck: string | null;
  COGS: string | null;
  price: string | null;
  breakevenROAS: string | null;
  brandAngle: string | null;
  domain: string | null;
}

export const userProfile: UserProfile = {
  selectedModel: null,
  budget: null,
  time: null,
  experience: null,
  skill: null,
  goalIncome: null,
  salesComfort: null,
  contentComfort: null,
  businessReason: null,
  persona: null,
  productIdeas: [],
  competitorCheck: null,
  COGS: null,
  price: null,
  breakevenROAS: null,
  brandAngle: null,
  domain: null,
};