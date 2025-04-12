import { UserAnswers, questions } from './businessDiscovery';

export interface QuestionnaireState {
  currentQuestionIndex: number;
  userAnswers: UserAnswers;
  isComplete: boolean;
}

export function createQuestionnaireState(): QuestionnaireState {
  return {
    currentQuestionIndex: 0,
    userAnswers: {},
    isComplete: false
  };
}

export function updateQuestionnaireState(
  state: QuestionnaireState,
  answer: string
): QuestionnaireState {
  const questionKeys: (keyof UserAnswers)[] = [
    'capital',
    'timePerWeek',
    'targetProfit',
    'naturalSkill',
    'openToSales',
    'contentCreation',
    'enjoyWriting',
    'techProblemSolving',
    'clientPreference',
    'teamPreference'
  ];

  const newState = {
    ...state,
    userAnswers: {
      ...state.userAnswers,
      [questionKeys[state.currentQuestionIndex]]: normalizeAnswer(answer, state.currentQuestionIndex)
    }
  };

  // Move to next question or complete
  if (state.currentQuestionIndex < questions.length - 1) {
    newState.currentQuestionIndex = state.currentQuestionIndex + 1;
  } else {
    newState.isComplete = true;
  }

  return newState;
}

function normalizeAnswer(answer: string, questionIndex: number): string {
  const normalizedAnswer = answer.toLowerCase().trim();

  switch (questionIndex) {
    case 0: // Capital
      if (normalizedAnswer.includes('0') || normalizedAnswer.includes('500') || normalizedAnswer.includes('less')) return '$0-500';
      if (normalizedAnswer.includes('2000') || normalizedAnswer.includes('2k') || normalizedAnswer.includes('more')) return '$2000+';
      return '$500-2000';

    case 1: // Time
      if (normalizedAnswer.includes('0-10') || normalizedAnswer.includes('less') || normalizedAnswer.includes('<10')) return '0-10 hours';
      if (normalizedAnswer.includes('20') || normalizedAnswer.includes('more') || normalizedAnswer.includes('>20')) return '20+ hours';
      return '10-20 hours';

    case 2: // Profit
      if (normalizedAnswer.includes('1') || normalizedAnswer.includes('2') || normalizedAnswer.includes('less')) return '1-2k';
      if (normalizedAnswer.includes('5') || normalizedAnswer.includes('more')) return '5k+';
      return '2-5k';

    case 3: // Natural skill
      if (normalizedAnswer.includes('writ')) return 'writing';
      if (normalizedAnswer.includes('sell')) return 'selling';
      if (normalizedAnswer.includes('tool') || normalizedAnswer.includes('system')) return 'technical';
      if (normalizedAnswer.includes('ad') || normalizedAnswer.includes('store')) return 'marketing';
      if (normalizedAnswer.includes('content')) return 'content';
      return 'marketing';

    case 4: // Sales
    case 5: // Content
    case 6: // Writing
    case 7: // Tech
      if (normalizedAnswer.includes('yes') || normalizedAnswer.includes('yeah') || normalizedAnswer.includes('sure')) return 'yes';
      return 'no';

    case 8: // Client preference
      if (normalizedAnswer.includes('client')) return 'clients';
      return 'products';

    case 9: // Team preference
      if (normalizedAnswer.includes('team') || normalizedAnswer.includes('manage')) return 'team';
      return 'solo';

    default:
      return normalizedAnswer;
  }
} 