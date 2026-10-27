const API = 'https://api.resend.com/emails';

export const cfg = () => ({
  key: process.env.RESEND_API_KEY,
  from: process.env.RESEND_FROM || 'Johan de Wet <johan.dewet@propertycoza.co.za>',
  notify: process.env.NOTIFY_EMAIL || 'johan.dewet@propertycoza.co.za',
});

/** Send via Resend. Without RESEND_API_KEY it logs a dry run and returns false. */
export async function sendEmail({ to, subject, text, attachments, replyTo }) {
  const { key, from } = cfg();
  if (!key) {
    console.log('[dry-run email]', JSON.stringify({ to, subject, attachments: (attachments || []).map((a) => a.filename) }));
    return false;
  }
  const res = await fetch(API, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, text, reply_to: replyTo, attachments }),
  });
  if (!res.ok) {
    console.error('Resend error', res.status, await res.text());
    return false;
  }
  return true;
}

export async function pingWebhook(payload) {
  const url = process.env.NOTIFY_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  } catch (e) {
    console.error('Webhook error', e.message);
  }
}
