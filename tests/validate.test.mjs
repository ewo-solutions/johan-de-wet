import test from 'node:test';
import assert from 'node:assert/strict';
import { normaliseMobile, validateLead } from '../src/lib/validate.js';

test('normalises SA mobiles to +27', () => {
  for (const s of ['082 123 4567', '0821234567', '+27 82 123 4567', '27821234567', '0027821234567', '(082) 123-4567'])
    assert.equal(normaliseMobile(s), '+27821234567');
  for (const s of ['', '12345', '0211234567', '+4412345678'])
    assert.equal(normaliseMobile(s), null);
});

test('report form validation', () => {
  const ok = { name: 'Ann Smith', email: 'A@B.co.za', mobile: '0821234567', complex: 'The Jade', consent: 'on' };
  assert.deepEqual(validateLead('report', ok).errors, {});
  const bad = validateLead('report', { ...ok, email: 'x', complex: 'Nope', consent: undefined });
  assert.deepEqual(Object.keys(bad.errors).sort(), ['complex', 'consent', 'email']);
});

test('valuation requires other text and when', () => {
  const r = validateLead('valuation', { name: 'Ann', email: 'a@b.co', mobile: '0821234567', complex: 'Other', when: '', consent: true });
  assert.deepEqual(Object.keys(r.errors).sort(), ['complex_other', 'when']);
});
