import assert from 'node:assert/strict';
import { test } from 'node:test';
import { POST } from '../api/copilot/chat.js';
import { GET } from '../api/copilot/health.js';

test('Vercel function reads repository articles and streams tool events', async () => {
  const health = await GET();
  assert.equal(health.status, 200);
  const status = await health.json();
  assert.equal(status.ok, true);
  assert.equal(status.mode, 'mock');
  assert.ok(status.articles > 100);
  const response = await POST(new Request('http://localhost/api/copilot/chat', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'user', content: 'React Hooks' }] }),
  }));
  assert.equal(response.status, 200);
  const body = await response.text();
  assert.match(body, /event: tool_start/);
  assert.match(body, /event: tool_result/);
  assert.match(body, /"demo":true/);
  assert.match(body, /"reason":"completed"/);
});

test('Vercel function rejects invalid messages', async () => {
  const response = await POST(new Request('http://localhost/api/copilot/chat', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}',
  }));
  assert.equal(response.status, 400);
});
