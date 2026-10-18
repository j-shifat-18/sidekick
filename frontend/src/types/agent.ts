export interface ToolCallItem {
  id: string;
  name: string;
  args: Record<string, unknown>;
  output?: string;
  cycle: number;
  status: 'running' | 'completed' | 'failed';
  timestamp: string;
}

export interface EvaluatorReview {
  feedback: string;
  success_criteria_met: boolean;
  user_input_needed: boolean;
  cycle: number;
  timestamp: string;
}

export interface TimelineEntry {
  id: string;
  type: 'user' | 'thought' | 'tool' | 'evaluator' | 'clarification_request' | 'done' | 'error';
  content?: string;
  title?: string;
  toolData?: ToolCallItem;
  evaluatorData?: EvaluatorReview;
  metadata?: {
    success_criteria?: string;
    cycle?: number;
    thread_id?: string;
    is_question?: boolean;
    error?: string;
  };
  timestamp: string;
}

export interface SandboxFileItem {
  name: string;
  path: string;
  size: number;
  modified: number;
  extension: string;
}

export interface SystemHealth {
  status: string;
  agent_ready: boolean;
  tools_count: number;
  tools: string[];
  env: {
    openai: boolean;
    serper: boolean;
    pushover: boolean;
    langsmith: boolean;
  };
}
