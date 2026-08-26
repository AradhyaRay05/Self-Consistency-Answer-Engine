export type ModelId = "openai" | "anthropic" | "gemini";

export type ResponseStatus = "success" | "error" | "mock";

export interface ModelResponse {
  modelId: ModelId;
  displayName: string;
  status: ResponseStatus;
  answer: string;
  latencyMs: number;
  error?: string;
}

export interface SynthesisResult {
  evaluator: string;
  answer: string;
  reasoning: string;
}

export interface AskResponse {
  responses: ModelResponse[];
  error?: string;
}

export interface Conversation {
  id: string;
  createdAt: number;
  question: string;
  responses: ModelResponse[];
  synthesis: SynthesisResult | null;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
