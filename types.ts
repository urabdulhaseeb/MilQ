
export enum AdulterantStatus {
  PASS = 'PASS',
  DETECTED = 'DETECTED',
  BORDERLINE = 'BORDERLINE'
}

export enum OverallStatus {
  SAFE = 'SAFE',
  UNSAFE = 'UNSAFE',
  INCONCLUSIVE = 'INCONCLUSIVE'
}

export interface AdulterantResult {
  adulterant: string;
  status: AdulterantStatus;
  confidence: number;
  action: string;
  colorChange: string;
  severity: 'High' | 'Medium' | 'Low';
  recommendation: string;
  healthRisk?: string;
}

export interface TestResult {
  id: string;
  tag?: string;
  timestamp: string;
  overallScore: number;
  status: OverallStatus;
  results: AdulterantResult[];
  beforeImage?: string;
  afterImage?: string;
}

export interface AppState {
  history: TestResult[];
  settings: {
    waitTime: number;
    language: string;
    theme: 'light' | 'dark';
  };
}
