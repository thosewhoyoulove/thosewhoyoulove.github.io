import { randomUUID } from 'node:crypto';
import type { AgentEvent } from '../shared.js';

/** Correlation belongs to the HTTP request, not a model's or SDK's session. */
export function createEventStream(write: (frame: string) => void, requestId: string = randomUUID()) {
  let sequence = 0;
  return (event: AgentEvent) => {
    const eventId = `${requestId}:${++sequence}`;
    const data = { ...event, requestId, eventId };
    write(`id: ${eventId}\nevent: ${event.type}\ndata: ${JSON.stringify(data)}\n\n`);
  };
}
