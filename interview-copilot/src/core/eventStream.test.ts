import { expect, it } from 'vitest';
import { createEventStream } from './eventStream.js';
import { AgentEventAdapter, AgentStreamParser } from '../widget/agent/stream.js';
it('publishes unique event IDs scoped to the request and permits actual replay deduplication', () => {
  const wire: string[] = [];
  const emit = createEventStream(frame => wire.push(frame), 'request-a');
  emit({ type: 'message_delta', text: 'x' }); emit({ type: 'message_delta', text: 'x' });
  const parser = new AgentStreamParser(), adapter = new AgentEventAdapter('request-a');
  const frames = parser.push(wire.join(''));
  expect(frames.map(frame => frame.id)).toEqual(['request-a:1', 'request-a:2']);
  expect(adapter.adapt(frames[0])).toMatchObject({ text: 'x', requestId: 'request-a', eventId: 'request-a:1' });
  expect(adapter.adapt(frames[0])).toBeUndefined(); expect(adapter.adapt(frames[1])).toBeDefined();
});
