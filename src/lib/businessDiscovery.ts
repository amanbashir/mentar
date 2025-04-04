export type BusinessModel = 'eCommerce' | 'Copywriting' | 'SMMA' | 'High Ticket Sales' | 'SaaS';

export interface UserAnswers {
  capital?: string;
  timePerWeek?: string;
  targetProfit?: string;
  naturalSkill?: string;
  openToSales?: string;
  contentCreation?: string;
  enjoyWriting?: string;
  techProblemSolving?: string;
  clientPreference?: string;
  teamPreference?: string;
}

export interface ScoreBreakdown {
  ecom: number;
  copy: number;
  smma: number;
  sales: number;
  saas: number;
}

export interface BusinessRecommendation {
  recommendedModel: BusinessModel | BusinessModel[];
  scoreBreakdown: ScoreBreakdown;
}

export const INITIAL_MESSAGE = "My name is Mentar. I am here, specialised and ready, to help you start your online business journey. I have a range of different business experts that can train, guide and help you launch your own business. Do you know what business you want to start? If yes, tell me!";

export const KNOWN_BUSINESS_MODELS = [
  'ecommerce',
  'smma',
  'saas',
  'copywriting',
  'high ticket sales'
];

export const questions: string[] = [
  "How much money can you realistically invest into your business upfront?",
  "How much free time do you have per week to focus on building this?",
  "What's your ideal profit per month in 6–12 months?",
  "Which of these feels most natural to you? (Writing compelling words, Reaching out and selling, Building tools or systems, Running ads or a store, Creating content online)",
  "Are you open to doing sales — cold outreach, calls, closing deals?",
  "Would you ever want to make content (like short videos, tweets, or tutorials) to grow?",
  "Do you enjoy writing — like storytelling, persuasion, or research?",
  "Do you like solving problems using tools, systems, or automation?",
  "What's more exciting: helping clients directly or selling products at scale?",
  "Would you prefer to run this solo, or eventually manage a small team?"
];

export const scoreMatrix = {
  capital: {
    "$0-500": { ecom: 0, copy: 3, smma: 2, sales: 2, saas: 0 },
    "$500-2000": { ecom: 2, copy: 3, smma: 3, sales: 3, saas: 1 },
    "$2000+": { ecom: 4, copy: 2, smma: 3, sales: 3, saas: 4 }
  },
  timePerWeek: {
    "0-10 hours": { ecom: 1, copy: 2, smma: 0, sales: 0, saas: 1 },
    "10-20 hours": { ecom: 2, copy: 3, smma: 2, sales: 2, saas: 2 },
    "20+ hours": { ecom: 3, copy: 3, smma: 4, sales: 4, saas: 3 }
  },
  targetProfit: {
    "1-2k": { ecom: 2, copy: 3, smma: 1, sales: 1, saas: 1 },
    "2-5k": { ecom: 3, copy: 2, smma: 3, sales: 3, saas: 2 },
    "5k+": { ecom: 3, copy: 1, smma: 4, sales: 4, saas: 4 }
  },
  naturalSkill: {
    "writing": { ecom: 1, copy: 4, smma: 2, sales: 2, saas: 1 },
    "selling": { ecom: 2, copy: 2, smma: 3, sales: 4, saas: 1 },
    "technical": { ecom: 2, copy: 1, smma: 2, sales: 1, saas: 4 },
    "marketing": { ecom: 4, copy: 2, smma: 4, sales: 2, saas: 1 },
    "content": { ecom: 2, copy: 3, smma: 3, sales: 2, saas: 1 }
  },
  openToSales: {
    "yes": { ecom: 2, copy: 2, smma: 4, sales: 4, saas: 2 },
    "no": { ecom: 3, copy: 3, smma: 0, sales: 0, saas: 3 }
  },
  contentCreation: {
    "yes": { ecom: 3, copy: 3, smma: 4, sales: 2, saas: 2 },
    "no": { ecom: 2, copy: 2, smma: 1, sales: 3, saas: 3 }
  },
  enjoyWriting: {
    "yes": { ecom: 2, copy: 4, smma: 2, sales: 2, saas: 2 },
    "no": { ecom: 3, copy: 0, smma: 3, sales: 3, saas: 3 }
  },
  techProblemSolving: {
    "yes": { ecom: 2, copy: 1, smma: 2, sales: 1, saas: 4 },
    "no": { ecom: 3, copy: 3, smma: 3, sales: 3, saas: 0 }
  },
  clientPreference: {
    "clients": { ecom: 1, copy: 3, smma: 4, sales: 4, saas: 2 },
    "products": { ecom: 4, copy: 2, smma: 1, sales: 1, saas: 4 }
  },
  teamPreference: {
    "solo": { ecom: 3, copy: 4, smma: 2, sales: 3, saas: 2 },
    "team": { ecom: 2, copy: 1, smma: 4, sales: 3, saas: 4 }
  }
};

export function calculateRecommendation(userAnswers: UserAnswers): BusinessRecommendation {
  const scores: ScoreBreakdown = {
    ecom: 0,
    copy: 0,
    smma: 0,
    sales: 0,
    saas: 0
  };

  // Calculate scores based on user answers
  Object.entries(userAnswers).forEach(([question, answer]) => {
    const category = scoreMatrix[question as keyof typeof scoreMatrix];
    if (category && category[answer as keyof typeof category]) {
      const answerScores = category[answer as keyof typeof category];
      Object.entries(answerScores).forEach(([model, score]) => {
        scores[model as keyof ScoreBreakdown] += score;
      });
    }
  });

  // Find highest score
  const maxScore = Math.max(...Object.values(scores));
  
  // Get all models with the highest score
  const topModels = Object.entries(scores)
    .filter(([_, score]) => score === maxScore)
    .map(([model, _]) => {
      switch(model) {
        case 'ecom': return 'eCommerce';
        case 'copy': return 'Copywriting';
        case 'smma': return 'SMMA';
        case 'sales': return 'High Ticket Sales';
        case 'saas': return 'SaaS';
        default: return 'eCommerce';
      }
    }) as BusinessModel[];

  return {
    recommendedModel: topModels.length === 1 ? topModels[0] : topModels,
    scoreBreakdown: scores
  };
}

export function startBusinessDiscoveryFlow(userInput: string): string | null {
  const normalizedInput = userInput.toLowerCase().trim();
  
  // Check if user mentioned a known business model
  const mentionedModel = KNOWN_BUSINESS_MODELS.find(model => 
    normalizedInput.includes(model)
  );

  if (mentionedModel) {
    return "Great choice! Let's start your business journey with some planning.";
  }

  // Check if user is unsure
  const unsurePatterns = ['no', 'not sure', 'dont know', "don't know", 'unsure', 'maybe'];
  const isUnsure = unsurePatterns.some(pattern => 
    normalizedInput.includes(pattern)
  );

  if (isUnsure) {
    return questions[0]; // Start the questionnaire
  }

  // If response is unclear, ask for clarification
  return "Could you please clarify if you have a specific business model in mind, or would you like help discovering the best fit for you?";
} 