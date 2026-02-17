
export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  ANALYZED = 'ANALYZED',
  STRATEGIZING = 'STRATEGIZING',
  STRATEGIZED = 'STRATEGIZED',
  DIVERGING = 'DIVERGING',
  DIVERGED = 'DIVERGED',
  EVALUATING = 'EVALUATING',
  EVALUATED = 'EVALUATED',
  RANKING = 'RANKING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface AnalysisData {
  subject_state: string;
  scene_conflict: string;
  hidden_details: string;
}

export interface EvaluationItem {
  candidate: string;
  scores: {
    novelty: number;
    empathy: number;
    brevity: number;
    distance: number;
    intelligence: number;
    incongruity: number;
  };
  reason: string;
}

export interface JudgementResult {
  evaluations: EvaluationItem[];
}
