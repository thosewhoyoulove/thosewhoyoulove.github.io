export type Citation = { title: string; path: string; url: string; heading?: string };
export type AgentEvent =
  | { type: 'message'; text: string; demo: boolean; provider?: string; citations: Citation[] }
  | { type: 'tool_start'; name: string; arguments: unknown }
  | { type: 'tool_result'; name: string; result: unknown }
  | { type: 'error'; message: string }
  | { type: 'done'; reason: 'completed' | 'cancelled' | 'limit' | 'error' };

export type ChatTurn = { role: 'user' | 'assistant'; content: string };
