import { createHash } from 'node:crypto';

const sha = (s) => createHash('sha256').update(String(s).trim().toLowerCase()).digest('hex');

/**
 * Meta Conversions API. Deduplicated against the browser pixel by event_id.
 * Only called when the visitor accepted tracking (tracking_consent=granted).
 */
export async function sendCapi({ eventName, eventId, url, ip, userAgent, email, phone, name, fbclid, custom }) {
  const pixel = process.env.META_PIXEL_ID;
  const token = process.env.META_CAPI_TOKEN;
  if (!pixel || !token) return false;
  const ts = Math.floor(Date.now() / 1000);
  const user = { em: [sha(email)], ph: [sha(String(phone).replace(/\D/g, ''))] };
  const first = String(name || '').split(/\s+/)[0];
  if (first) user.fn = [sha(first)];
  if (ip) user.client_ip_address = ip;
  if (userAgent) user.client_user_agent = userAgent;
  if (fbclid) user.fbc = `fb.1.${ts * 1000}.${fbclid}`;
  const body = {
    data: [{ event_name: eventName, event_time: ts, event_id: eventId, event_source_url: url, action_source: 'website', user_data: user, custom_data: custom }],
  };
  if (process.env.META_TEST_EVENT_CODE) body.test_event_code = process.env.META_TEST_EVENT_CODE;
  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${pixel}/events?access_token=${encodeURIComponent(token)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    if (!res.ok) console.error('CAPI error', res.status, await res.text());
    return res.ok;
  } catch (e) {
    console.error('CAPI error', e.message);
    return false;
  }
}
