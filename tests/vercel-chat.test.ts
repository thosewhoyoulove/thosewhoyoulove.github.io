import assert from 'node:assert/strict';
import { test } from 'node:test';
import { POST, OPTIONS } from '../api/copilot/chat.js';
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

test('GitHub Pages can preflight and read chat errors; unconfigured origins are rejected', async () => {
  const url = 'https://omen-blog.vercel.app/api/copilot/chat';
  const origin = 'https://thosewhoyoulove.github.io';
  const preflight = OPTIONS(new Request(url, { method: 'OPTIONS', headers: { origin } }));
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('access-control-allow-origin'), origin);
  const invalid = await POST(new Request(url, { method: 'POST', headers: { origin }, body: '{}' }));
  assert.equal(invalid.status, 400);
  assert.equal(invalid.headers.get('access-control-allow-origin'), origin);
  assert.equal(OPTIONS(new Request(url, { method: 'OPTIONS', headers: { origin: 'https://unconfigured.example' } })).status, 403);
  assert.equal((await POST(new Request(url, { method: 'POST', headers: { origin: 'https://unconfigured.example' }, body: '{}' }))).status, 403);
  assert.equal((await GET(new Request('https://omen-blog.vercel.app/api/copilot/health', { headers: { origin } }))).headers.get('access-control-allow-origin'), origin);
});
