// GET /api/admin?key=SECRET
// Returns all RSVPs as HTML table (protected by ADMIN_KEY env variable)

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const providedKey = url.searchParams.get('key');

  if (!providedKey || providedKey !== env.ADMIN_KEY) {
    return new Response('Forbidden', { status: 403 });
  }

  // Fetch all RSVPs ordered by latest first
  const result = await env.DB.prepare(
    `SELECT id, firstname, lastname, answer, country, created_at
     FROM rsvps
     ORDER BY created_at DESC`
  ).all();

  const rsvps = result.results || [];

  // Counts by answer
  const counts = { yes: 0, maybe: 0, no: 0 };
  for (const r of rsvps) {
    if (counts[r.answer] !== undefined) counts[r.answer]++;
  }

  const html = `<!DOCTYPE html>
<html lang="sq">
<head>
<meta charset="UTF-8">
<title>RSVPs · Lirim & Elira</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #f3e8d8;
    color: #2a221b;
    padding: 28px 20px;
    max-width: 1000px;
    margin: 0 auto;
    line-height: 1.5;
  }
  h1 { font-weight: 600; margin: 0 0 6px; font-size: 28px; }
  .subtitle { color: #6b5d50; margin-bottom: 28px; font-size: 14px; }
  .stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 12px;
    margin-bottom: 32px;
  }
  .stat {
    background: white;
    padding: 18px;
    border-radius: 6px;
    border: 1px solid rgba(58,40,32,0.1);
  }
  .stat-num { font-size: 32px; font-weight: 600; }
  .stat-label { color: #6b5d50; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; }
  .yes { color: #5e6e54; }
  .maybe { color: #b89060; }
  .no { color: #a8364a; }
  table {
    width: 100%;
    border-collapse: collapse;
    background: white;
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid rgba(58,40,32,0.1);
  }
  th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid rgba(58,40,32,0.08); }
  th { background: #ead8c0; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #4a3d30; }
  tr:last-child td { border-bottom: none; }
  td { font-size: 15px; }
  .pill { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; }
  .pill-yes { background: #d4e1c8; color: #3d4e30; }
  .pill-maybe { background: #f0dcb0; color: #6e5020; }
  .pill-no { background: #f0c8c8; color: #6e2030; }
  .empty { text-align: center; padding: 60px 20px; color: #6b5d50; }
  .meta { color: #8e7d6f; font-size: 13px; }
  @media (max-width: 600px) {
    table { font-size: 14px; }
    th, td { padding: 10px 12px; }
    th.col-country, td.col-country { display: none; }
  }
</style>
</head>
<body>
  <h1>RSVP Dashboard</h1>
  <div class="subtitle">Lirim &amp; Elira · 1 Gusht 2026 · Gjithsej ${rsvps.length}</div>

  <div class="stats">
    <div class="stat"><div class="stat-num yes">${counts.yes}</div><div class="stat-label">Po, do vijnë</div></div>
    <div class="stat"><div class="stat-num maybe">${counts.maybe}</div><div class="stat-label">Ndoshta</div></div>
    <div class="stat"><div class="stat-num no">${counts.no}</div><div class="stat-label">Nuk vijnë</div></div>
  </div>

  ${rsvps.length === 0 ? `<div class="empty">Asnjë konfirmim ende.</div>` : `
  <table>
    <thead>
      <tr>
        <th>Emri</th>
        <th>Përgjigjja</th>
        <th class="col-country">Vendi</th>
        <th>Koha</th>
      </tr>
    </thead>
    <tbody>
      ${rsvps.map(r => `
        <tr>
          <td>${escapeHtml(r.firstname)} ${escapeHtml(r.lastname)}</td>
          <td><span class="pill pill-${r.answer}">${answerLabel(r.answer)}</span></td>
          <td class="col-country meta">${r.country || '—'}</td>
          <td class="meta">${formatDate(r.created_at)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  `}
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function answerLabel(a) {
  return { yes: 'Po', maybe: 'Ndoshta', no: 'Jo' }[a] || a;
}

function formatDate(s) {
  if (!s) return '—';
  // SQLite UTC datetime → readable
  const d = new Date(s.replace(' ', 'T') + 'Z');
  return d.toLocaleString('sq-AL', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}
