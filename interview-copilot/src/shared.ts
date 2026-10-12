export type Citation = { title: string; path: string; url: string; heading?: string };
export type AgentEvent = (
  | { type: 'stream_start'; textDeltas: boolean; demo: boolean; provider?: string }
  | { type: 'message_delta'; text: string }
  | { type: 'message'; text: string; demo: boolean; provider?: string; citations: Citation[] }
  | { type: 'tool_start'; name: string; arguments: unknown; callId?: string }
  | { type: 'tool_result'; name: string; result: unknown; callId?: string }
  | { type: 'error'; message: string }
  | { type: 'done'; reason: 'completed' | 'cancelled' | 'limit' | 'error' }
) & { requestId?: string; eventId?: string };

export type ChatTurn = { role: 'user' | 'assistant'; content: string };
