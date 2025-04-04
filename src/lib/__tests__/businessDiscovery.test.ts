import {
  startBusinessDiscoveryFlow,
  calculateRecommendation,
  questions,
  INITIAL_MESSAGE
} from '../businessDiscovery';

import {
  createQuestionnaireState,
  updateQuestionnaireState
} from '../questionnaireState';

describe('Business Discovery System', () => {
  describe('startBusinessDiscoveryFlow', () => {
    it('should recognize known business models', () => {
      expect(startBusinessDiscoveryFlow('I want to start an ecommerce business'))
        .toBe("Great choice! Let's start your business journey with some planning.");
    });

    it('should start questionnaire for unsure responses', () => {
      expect(startBusinessDiscoveryFlow("I'm not sure"))
        .toBe(questions[0]);
    });

    it('should ask for clarification on unclear responses', () => {
      expect(startBusinessDiscoveryFlow("I like business"))
        .toBe("Could you please clarify if you have a specific business model in mind, or would you like help discovering the best fit for you?");
    });
  });

  describe('Questionnaire Flow', () => {
    it('should properly track questionnaire state', () => {
      let state = createQuestionnaireState();
      expect(state.currentQuestionIndex).toBe(0);
      expect(state.isComplete).toBe(false);

      // Answer first question
      state = updateQuestionnaireState(state, '$2000+');
      expect(state.currentQuestionIndex).toBe(1);
      expect(state.userAnswers.capital).toBe('$2000+');

      // Complete all questions
      const answers = [
        '20+ hours',
        '5k+',
        'technical',
        'yes',
        'yes',
        'no',
        'yes',
        'products',
        'team'
      ];

      answers.forEach(answer => {
        state = updateQuestionnaireState(state, answer);
      });

      expect(state.isComplete).toBe(true);
    });
  });

  describe('calculateRecommendation', () => {
    it('should recommend SaaS for technical people with capital', () => {
      const recommendation = calculateRecommendation({
        capital: '$2000+',
        timePerWeek: '20+ hours',
        targetProfit: '5k+',
        naturalSkill: 'technical',
        openToSales: 'no',
        contentCreation: 'no',
        enjoyWriting: 'no',
        techProblemSolving: 'yes',
        clientPreference: 'products',
        teamPreference: 'team'
      });

      expect(recommendation.recommendedModel).toBe('SaaS');
    });

    it('should recommend Copywriting for writers with low capital', () => {
      const recommendation = calculateRecommendation({
        capital: '$0-500',
        timePerWeek: '10-20 hours',
        targetProfit: '1-2k',
        naturalSkill: 'writing',
        openToSales: 'no',
        contentCreation: 'yes',
        enjoyWriting: 'yes',
        techProblemSolving: 'no',
        clientPreference: 'clients',
        teamPreference: 'solo'
      });

      expect(recommendation.recommendedModel).toBe('Copywriting');
    });
  });
}); 