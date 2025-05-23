import { StageData } from "./stage";

export interface SaasStrategy {
  stage_1: StageData;
  stage_2: StageData;
  stage_3: StageData;
  stage_4: StageData;
  stage_5: StageData;
  scaling: StageData;
} 