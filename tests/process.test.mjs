import test from 'node:test';
import assert from 'node:assert/strict';
import { processSubmission } from '../netlify/lib/process.mjs';

delete process.env.RESEND_API_KEY;
const base = { name: 'Ann Smith', email: 'a@b.co.za', mobile: '0821234567', consent: 'on', track: 'A', event_id: 'e1' };

test('honeypot ignored', async () => {
  assert.match(await processSubmission({ form_name: 'report-request', data: { ...base, complex: 'The Jade', 'bot-field': 'x' } }), /honeypot/);
});
test('invalid rejected', async () => {
  assert.match(await processSubmission({ form_name: 'report-request', data: { ...base, email: 'bad', complex: 'The Jade' } }), /validation/);
});
test('valid report request processes (dry run)', async () => {
  assert.equal(await processSubmission({ form_name: 'report-request', ip: '1.1.1.1', data: { ...base, complex: 'The Jade' } }), 'ok');
});
test('rate limit per IP', async () => {
  process.env.RATE_LIMIT_PER_HOUR = '2';
  const run = () => processSubmission({ form_name: 'suburb-interest', ip: '9.9.9.9', data: { ...base, suburb: 'Strand' } });
  assert.equal(await run(), 'ok');
  assert.equal(await run(), 'ok');
  assert.match(await run(), /rate limit/);
});
