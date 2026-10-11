import { Cursor } from '@cursor/sdk';

const apiKey = process.env.CURSOR_API_KEY?.trim();
if (!apiKey) throw new Error('Set CURSOR_API_KEY in the server .env first');
try {
  const models = await Cursor.models.list({ apiKey });
  console.log(JSON.stringify(models.filter(model => model.id.includes('composer')).map(model => ({ id: model.id, name: model.displayName })), null, 2));
} catch {
  console.error('Cursor model discovery failed. Check API Key, account access and network.');
  process.exitCode = 1;
}
