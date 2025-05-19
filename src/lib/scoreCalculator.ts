import { ScoreBreakdown, BusinessModel } from './businessDiscovery';

export function findTopModels(scores: ScoreBreakdown): BusinessModel[] {
  const maxScore = Math.max(...Object.values(scores));
  const result: BusinessModel[] = [];
  
  if (scores.ecom === maxScore) result.push('eCommerce');
  if (scores.copy === maxScore) result.push('Copywriting');
  if (scores.smma === maxScore) result.push('SMMA');
  if (scores.sales === maxScore) result.push('High Ticket Sales');
  if (scores.saas === maxScore) result.push('SaaS');
  
  return result;
} 