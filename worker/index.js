// Cloudflare Worker: Daily RSVP Summary Email
// Triggered by cron schedule (configured in wrangler.toml)
// Sends a summary email if there are new RSVPs in the last 24h.

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(sendDailySummary(env));
  },

  // Allow manual trigger for testing: visit https://your-worker.workers.dev/?key=YOUR_ADMIN_KEY
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.searchParams.get('key') !== env.ADMIN_KEY) {
      return new Response('Forbidden', { status: 403 });
    }
    await sendDailySummary(env);
    return new Response('Summary triggered. Check email.', { status: 200 });
  }
};

async function sendDailySummary(env) {
  // Fetch RSVPs from last 24h
  const recentResult = await env.DB.prepare(
    `SELECT firstname, lastname, answer, country, created_at
     FROM rsvps
     WHERE created_at > datetime('now', '-24 hours')
     ORDER BY created_at DESC`
  ).all();

  const recent = recentResult.results || [];

  // Fetch totals
  const totalsResult = await env.DB.prepare(
    `SELECT answer, COUNT(*) as count FROM rsvps GROUP BY answer`
  ).all();

  const totals = { yes: 0, maybe: 0, no: 0 };
  for (const row of (totalsResult.results || [])) {
    if (totals[row.answer] !== undefined) totals[row.answer] = row.count;
  }
  const totalAll = totals.yes + totals.maybe + totals.no;

  // If nothing happened in last 24h, skip
  if (recent.length === 0) {
    console.log('No new RSVPs in last 24h, skipping email.');
    return;
  }

  // Build email HTML
  const html = buildEmailHtml(recent, totals, totalAll);
  const text = buildEmailText(recent, totals, totalAll);

  // Send via Resend API
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: env.FROM_EMAIL,
      to: env.TO_EMAIL,
      subject: `${recent.length} konfirmim${recent.length > 1 ? 'e' : ''} të reja · Lirim & Elira`,
      html,
      text
    })
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('Resend error:', response.status, err);
    throw new Error(`Email send failed: ${response.status}`);
  }

  console.log(`Sent summary for ${recent.length} new RSVPs.`);
}

function buildEmailHtml(recent, totals, totalAll) {
  const rows = recent.map(r => `
    <tr>
      <td style="padding:10px 14px;border-bottom:1px solid #eee;">${escapeHtml(r.firstname)} ${escapeHtml(r.lastname)}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #eee;">${answerLabel(r.answer)}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #eee;color:#999;font-size:13px;">${formatDate(r.created_at)}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f3e8d8;padding:30px;margin:0;color:#2a221b;">
  <div style="max-width:600px;margin:0 auto;background:white;border-radius:8px;padding:32px;">
    <h1 style="margin:0 0 4px;font-size:24px;color:#b85f70;">Lirim &amp; Elira</h1>
    <p style="margin:0 0 24px;color:#6b5d50;font-size:14px;">Përmbledhje ditore e konfirmimeve</p>

    <div style="background:#fbeae3;padding:18px;border-radius:6px;margin-bottom:24px;">
      <p style="margin:0 0 8px;font-size:15px;"><strong>${recent.length} konfirmim${recent.length > 1 ? 'e' : ''} të reja</strong> në 24 orët e fundit</p>
      <p style="margin:0;color:#6b5d50;font-size:14px;">
        Gjithsej deri tani: <strong>${totalAll}</strong> ·
        <span style="color:#3d4e30;">${totals.yes} Po</span> ·
        <span style="color:#6e5020;">${totals.maybe} Ndoshta</span> ·
        <span style="color:#6e2030;">${totals.no} Jo</span>
      </p>
    </div>

    <h2 style="font-size:16px;margin:0 0 12px;color:#4a3d30;">Konfirmimet më të reja</h2>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <thead>
        <tr style="background:#ead8c0;">
          <th style="text-align:left;padding:10px 14px;font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:#4a3d30;">Emri</th>
          <th style="text-align:left;padding:10px 14px;font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:#4a3d30;">Përgjigjja</th>
          <th style="text-align:left;padding:10px 14px;font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:#4a3d30;">Koha</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <p style="margin:28px 0 0;color:#8e7d6f;font-size:13px;">
      Shih listën e plotë në panelin admin.
    </p>
  </div>
</body></html>`;
}

function buildEmailText(recent, totals, totalAll) {
  const lines = recent.map(r => `  • ${r.firstname} ${r.lastname} — ${answerLabel(r.answer)} (${formatDate(r.created_at)})`);
  return `Lirim & Elira — Përmbledhje ditore

${recent.length} konfirmime të reja në 24 orët e fundit.

Gjithsej: ${totalAll} (${totals.yes} Po, ${totals.maybe} Ndoshta, ${totals.no} Jo)

Konfirmimet më të reja:
${lines.join('\n')}
`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function answerLabel(a) {
  return { yes: '✓ Po', maybe: '? Ndoshta', no: '✗ Jo' }[a] || a;
}

function formatDate(s) {
  if (!s) return '—';
  const d = new Date(s.replace(' ', 'T') + 'Z');
  return d.toLocaleString('sq-AL', {
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });
}
