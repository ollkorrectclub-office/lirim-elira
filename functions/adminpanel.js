// GET /adminpanel
// Serves the admin panel UI (HTML page)
// Authentication happens client-side: user enters ADMIN_KEY which is then sent with every API request

export async function onRequestGet({ env }) {
  const html = `<!DOCTYPE html>
<html lang="sq">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Admin · Lirim &amp; Elira</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --ink: #3a2820;
    --ink-soft: #6b5d50;
    --bg: #f5ebe0;
    --bg-warm: #fbeae3;
    --card: #ffffff;
    --rose: #b85f70;
    --rose-deep: #a04858;
    --gold: #b89060;
    --sage: #95a583;
    --red: #c44141;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: linear-gradient(180deg, #f5ebe0 0%, #fbeae3 100%);
    color: var(--ink);
    min-height: 100vh;
    padding: 24px 16px 60px;
    line-height: 1.5;
  }
  .container { max-width: 1100px; margin: 0 auto; }

  header { margin-bottom: 28px; text-align: center; }
  h1 { font-size: 28px; font-weight: 700; margin-bottom: 4px; color: var(--rose-deep); }
  .subtitle { color: var(--ink-soft); font-size: 14px; }

  /* Login screen */
  .login-screen {
    max-width: 360px; margin: 80px auto; background: var(--card);
    padding: 32px 28px; border-radius: 12px;
    box-shadow: 0 8px 30px rgba(58,40,32,0.1);
  }
  .login-screen h2 { font-size: 20px; margin-bottom: 6px; }
  .login-screen p { color: var(--ink-soft); font-size: 14px; margin-bottom: 20px; }
  .login-screen input {
    width: 100%; padding: 12px 14px; font-size: 15px;
    border: 1px solid rgba(58,40,32,0.2); border-radius: 6px; margin-bottom: 12px;
    font-family: inherit;
  }
  .login-screen input:focus { outline: none; border-color: var(--rose); }
  .login-screen button {
    width: 100%; padding: 12px; background: var(--rose-deep); color: white;
    border: none; border-radius: 6px; font-size: 14px; font-weight: 600;
    cursor: pointer; letter-spacing: 0.05em; text-transform: uppercase;
  }
  .login-screen button:hover { background: var(--ink); }
  .login-error { color: var(--red); font-size: 13px; margin-top: 8px; min-height: 16px; }

  /* Stats row */
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 10px; margin-bottom: 24px; }
  .stat { background: var(--card); padding: 14px; border-radius: 8px; text-align: center; }
  .stat-num { font-size: 26px; font-weight: 700; line-height: 1.1; }
  .stat-label { font-size: 11px; color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.06em; margin-top: 3px; }
  .stat.yes .stat-num { color: var(--sage); }
  .stat.maybe .stat-num { color: var(--gold); }
  .stat.no .stat-num { color: var(--red); }
  .stat.pending .stat-num { color: var(--ink-soft); }

  /* Create form */
  .create-card {
    background: var(--card); padding: 18px 20px; border-radius: 10px;
    margin-bottom: 20px; display: grid;
    grid-template-columns: 1fr 1fr auto; gap: 10px;
    align-items: end;
  }
  .create-card .field label {
    display: block; font-size: 11px; color: var(--ink-soft);
    text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; font-weight: 600;
  }
  .create-card input {
    width: 100%; padding: 10px 12px; font-size: 14px;
    border: 1px solid rgba(58,40,32,0.2); border-radius: 6px; font-family: inherit;
  }
  .create-card input:focus { outline: none; border-color: var(--rose); }
  .create-card button {
    padding: 10px 18px; background: var(--rose-deep); color: white;
    border: none; border-radius: 6px; font-size: 13px; font-weight: 600;
    cursor: pointer; white-space: nowrap; letter-spacing: 0.04em;
  }
  .create-card button:hover { background: var(--ink); }
  .create-card button:disabled { opacity: 0.6; cursor: wait; }

  /* Toolbar */
  .toolbar {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 12px; gap: 12px; flex-wrap: wrap;
  }
  .toolbar-status { font-size: 13px; color: var(--ink-soft); }
  .toolbar-status .dot {
    display: inline-block; width: 7px; height: 7px; background: var(--sage);
    border-radius: 50%; margin-right: 5px; vertical-align: middle;
    animation: pulse 2s ease-in-out infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 1; }
  }
  .btn-refresh, .btn-logout {
    background: transparent; border: 1px solid rgba(58,40,32,0.2);
    padding: 6px 12px; border-radius: 6px; font-size: 12px;
    color: var(--ink-soft); cursor: pointer; font-family: inherit;
  }
  .btn-refresh:hover, .btn-logout:hover { background: rgba(58,40,32,0.04); }

  /* Table */
  .table-wrap { background: var(--card); border-radius: 10px; overflow: hidden; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #f0e0c8; padding: 12px 14px; text-align: left; font-size: 11px;
       font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--ink); }
  td { padding: 14px; border-bottom: 1px solid rgba(58,40,32,0.06); font-size: 14px; vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  tr:hover { background: rgba(184, 95, 112, 0.03); }

  .guest-name { font-weight: 600; }
  .guest-sub { font-size: 12px; color: var(--ink-soft); margin-top: 2px; }
  .views-cell { font-size: 13px; color: var(--ink-soft); }
  .views-cell.viewed { color: var(--sage); font-weight: 600; }

  .pill {
    display: inline-block; padding: 3px 10px; border-radius: 999px;
    font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;
  }
  .pill.yes { background: #d4e1c8; color: #3d4e30; }
  .pill.maybe { background: #f0dcb0; color: #6e5020; }
  .pill.no { background: #f0c8c8; color: #6e2030; }
  .pill.pending { background: #ece4d8; color: #6b5d50; }

  .rsvp-name { font-size: 12px; color: var(--ink-soft); margin-top: 3px; }

  .url-cell {
    font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
    font-size: 12px; color: var(--ink-soft);
  }
  .actions { display: flex; gap: 6px; }
  .btn-icon {
    width: 30px; height: 30px; border: 1px solid rgba(58,40,32,0.15);
    border-radius: 6px; background: white; cursor: pointer; padding: 0;
    display: flex; align-items: center; justify-content: center;
    color: var(--ink-soft); transition: all 0.15s;
  }
  .btn-icon:hover { background: var(--bg-warm); color: var(--ink); border-color: var(--rose); }
  .btn-icon.delete:hover { color: var(--red); border-color: var(--red); }
  .btn-icon svg { width: 14px; height: 14px; }
  .btn-icon.copied { background: var(--sage); color: white; border-color: var(--sage); }

  .empty {
    padding: 60px 20px; text-align: center; color: var(--ink-soft); font-size: 14px;
  }
  .empty-icon { font-size: 38px; margin-bottom: 8px; opacity: 0.6; }

  /* Toast */
  .toast {
    position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(80px);
    background: var(--ink); color: white; padding: 12px 20px; border-radius: 8px;
    font-size: 14px; box-shadow: 0 8px 24px rgba(0,0,0,0.2);
    transition: transform 0.3s ease-out; pointer-events: none; z-index: 100;
  }
  .toast.show { transform: translateX(-50%) translateY(0); }

  /* Mobile */
  @media (max-width: 700px) {
    .create-card { grid-template-columns: 1fr; }
    th, td { padding: 10px 8px; font-size: 13px; }
    .col-views, .col-created { display: none; }
    .url-cell { font-size: 11px; }
  }

  .hidden { display: none !important; }
</style>
</head>
<body>

<!-- LOGIN SCREEN -->
<div id="login-screen" class="login-screen">
  <h2>Admin Panel</h2>
  <p>Lirim &amp; Elira · Wedding RSVP</p>
  <form id="login-form">
    <input type="password" id="login-key" placeholder="Admin key" autocomplete="off" autofocus>
    <button type="submit">Hyr</button>
    <div class="login-error" id="login-error"></div>
  </form>
</div>

<!-- MAIN APP -->
<div id="app" class="container hidden">
  <header>
    <h1>Admin Panel</h1>
    <div class="subtitle">Lirim &amp; Elira · 1 Gusht 2026</div>
  </header>

  <div class="stats" id="stats">
    <div class="stat"><div class="stat-num" id="stat-total">0</div><div class="stat-label">Ftesa</div></div>
    <div class="stat yes"><div class="stat-num" id="stat-yes">0</div><div class="stat-label">Po</div></div>
    <div class="stat maybe"><div class="stat-num" id="stat-maybe">0</div><div class="stat-label">Ndoshta</div></div>
    <div class="stat no"><div class="stat-num" id="stat-no">0</div><div class="stat-label">Jo</div></div>
    <div class="stat pending"><div class="stat-num" id="stat-pending">0</div><div class="stat-label">Pa përgjigje</div></div>
    <div class="stat"><div class="stat-num" id="stat-viewed">0</div><div class="stat-label">Hapur</div></div>
  </div>

  <div class="create-card">
    <div class="field">
      <label>Emri</label>
      <input type="text" id="new-name" placeholder="Familja Berisha" autocomplete="off">
    </div>
    <div class="field">
      <label>Përshkrim (opsionale)</label>
      <input type="text" id="new-subtitle" placeholder="me familje" autocomplete="off">
    </div>
    <button id="btn-create">+ Krijo ftesë</button>
  </div>

  <div class="toolbar">
    <div class="toolbar-status">
      <span class="dot"></span><span id="last-update">Live</span>
    </div>
    <div style="display:flex; gap: 8px;">
      <button class="btn-refresh" id="btn-refresh">↻ Rifresko</button>
      <button class="btn-logout" id="btn-logout">Dil</button>
    </div>
  </div>

  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Mysafiri</th>
          <th>URL</th>
          <th class="col-views">Hapur</th>
          <th>Statusi</th>
          <th></th>
        </tr>
      </thead>
      <tbody id="tbody"></tbody>
    </table>
    <div class="empty hidden" id="empty">
      <div class="empty-icon">📭</div>
      <div>Asnjë ftesë ende. Krijoje të parën më lart.</div>
    </div>
  </div>
</div>

<div class="toast" id="toast"></div>

<script>
let adminKey = sessionStorage.getItem('admin_key') || '';
let pollTimer = null;
let baseUrl = window.location.origin;

const loginScreen = document.getElementById('login-screen');
const app = document.getElementById('app');
const loginForm = document.getElementById('login-form');
const loginKey = document.getElementById('login-key');
const loginError = document.getElementById('login-error');
const tbody = document.getElementById('tbody');
const emptyEl = document.getElementById('empty');
const toast = document.getElementById('toast');

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2400);
}

function showLogin() {
  loginScreen.classList.remove('hidden');
  app.classList.add('hidden');
  if (pollTimer) clearInterval(pollTimer);
}
function showApp() {
  loginScreen.classList.add('hidden');
  app.classList.remove('hidden');
  loadData();
  pollTimer = setInterval(loadData, 10000);
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const key = loginKey.value.trim();
  loginError.textContent = '';
  if (!key) { loginError.textContent = 'Shkruani key'; return; }
  // Verify by attempting a fetch
  try {
    const r = await fetch(\`/api/admin/invitations?key=\${encodeURIComponent(key)}\`);
    if (r.status === 403) { loginError.textContent = 'Key i gabuar'; return; }
    if (!r.ok) { loginError.textContent = 'Gabim: ' + r.status; return; }
    adminKey = key;
    sessionStorage.setItem('admin_key', key);
    showApp();
  } catch (err) {
    loginError.textContent = 'Lidhja dështoi';
  }
});

document.getElementById('btn-logout').addEventListener('click', () => {
  sessionStorage.removeItem('admin_key');
  adminKey = '';
  showLogin();
});

document.getElementById('btn-refresh').addEventListener('click', loadData);

document.getElementById('btn-create').addEventListener('click', async () => {
  const name = document.getElementById('new-name').value.trim();
  const subtitle = document.getElementById('new-subtitle').value.trim();
  const btn = document.getElementById('btn-create');

  if (!name) { showToast('Shkruani emrin e mysafirit'); return; }

  btn.disabled = true;
  try {
    const r = await fetch(\`/api/admin/invitations?key=\${encodeURIComponent(adminKey)}\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guest_name: name, subtitle })
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Gabim');

    document.getElementById('new-name').value = '';
    document.getElementById('new-subtitle').value = '';
    showToast(\`✓ Krijuar: ID #\${data.invitation.id}\`);
    loadData();
  } catch (err) {
    showToast('Gabim: ' + err.message);
  } finally {
    btn.disabled = false;
  }
});

async function loadData() {
  try {
    const r = await fetch(\`/api/admin/invitations?key=\${encodeURIComponent(adminKey)}\`);
    if (r.status === 403) { showLogin(); return; }
    if (!r.ok) throw new Error('Failed to load');
    const data = await r.json();
    renderInvitations(data.invitations || []);
    renderStats(data.counts || {});
    document.getElementById('last-update').textContent =
      'Përditësuar ' + new Date().toLocaleTimeString('sq-AL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch (err) {
    console.error('Load error:', err);
  }
}

function renderStats(counts) {
  document.getElementById('stat-total').textContent = counts.total || 0;
  document.getElementById('stat-yes').textContent = counts.yes || 0;
  document.getElementById('stat-maybe').textContent = counts.maybe || 0;
  document.getElementById('stat-no').textContent = counts.no || 0;
  document.getElementById('stat-pending').textContent = counts.pending || 0;
  document.getElementById('stat-viewed').textContent = counts.viewed || 0;
}

function renderInvitations(list) {
  if (list.length === 0) {
    tbody.innerHTML = '';
    emptyEl.classList.remove('hidden');
    return;
  }
  emptyEl.classList.add('hidden');

  tbody.innerHTML = list.map(inv => {
    const url = \`\${baseUrl}/i/\${inv.id}\`;
    const status = statusPill(inv.rsvp_answer);
    const rsvpInfo = inv.rsvp_firstname
      ? \`<div class="rsvp-name">\${escapeHtml(inv.rsvp_firstname)} \${escapeHtml(inv.rsvp_lastname || '')}</div>\`
      : '';
    const views = inv.views || 0;
    return \`
      <tr data-id="\${inv.id}">
        <td>
          <div class="guest-name">\${escapeHtml(inv.guest_name)}</div>
          \${inv.subtitle ? \`<div class="guest-sub">\${escapeHtml(inv.subtitle)}</div>\` : ''}
        </td>
        <td class="url-cell">/i/\${inv.id}</td>
        <td class="col-views views-cell \${views > 0 ? 'viewed' : ''}">
          \${views > 0 ? \`\${views}x\` : '—'}
        </td>
        <td>
          \${status}
          \${rsvpInfo}
        </td>
        <td>
          <div class="actions">
            <button class="btn-icon" onclick="copyUrl(\${inv.id}, this)" title="Kopjo URL">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            </button>
            <button class="btn-icon" onclick="shareWhatsApp(\${inv.id}, '\${escapeJs(inv.guest_name)}')" title="Dërgo në WhatsApp">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.6-.8-1.9-.9-.3-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1-.7-.3-1.4-.7-2-1.4-.5-.5-.9-1.1-1.3-1.7-.1-.2 0-.4.1-.5.1-.1.2-.2.4-.4.1-.1.2-.3.2-.4.1-.1 0-.3 0-.4-.1-.1-.6-1.4-.8-1.9-.1-.4-.3-.4-.5-.4-.1 0-.3 0-.4 0-.2 0-.4.1-.5.3-.6.6-1 1.4-1 2.3.1 1.1.5 2.1 1.2 3 1.3 1.9 3.1 3.4 5.2 4.1.7.3 1.3.3 1.9.2.7-.1 1.3-.6 1.7-1.2.2-.4.2-.8.1-1.1z"/><path d="M19.4 4.6C15-.1 8 0 3.5 4.5c-3.7 3.8-3.7 9.8 0 13.6L2 24l6-1.5c1.4.8 3 1.2 4.6 1.2 5.9 0 10.6-4.8 10.6-10.7 0-2.8-1.1-5.5-3.1-7.5"/></svg>
            </button>
            <button class="btn-icon" onclick="openPreview(\${inv.id})" title="Hap parapamje">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </button>
            <button class="btn-icon delete" onclick="deleteInvitation(\${inv.id}, '\${escapeJs(inv.guest_name)}')" title="Fshi">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/></svg>
            </button>
          </div>
        </td>
      </tr>
    \`;
  }).join('');
}

function statusPill(answer) {
  if (answer === 'yes') return '<span class="pill yes">Po</span>';
  if (answer === 'maybe') return '<span class="pill maybe">Ndoshta</span>';
  if (answer === 'no') return '<span class="pill no">Jo</span>';
  return '<span class="pill pending">Pa përgjigje</span>';
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}
function escapeJs(s) {
  return String(s || '').replace(/'/g, "\\\\'").replace(/"/g, '\\\\"');
}

window.copyUrl = async function(id, btn) {
  const url = \`\${baseUrl}/i/\${id}\`;
  try {
    await navigator.clipboard.writeText(url);
    btn.classList.add('copied');
    showToast('URL u kopjua');
    setTimeout(() => btn.classList.remove('copied'), 1500);
  } catch {
    showToast('Kopjimi dështoi');
  }
};

window.shareWhatsApp = function(id, name) {
  const url = \`\${baseUrl}/i/\${id}\`;
  const text = \`Përshëndetje! Lirim & Elira ju ftojnë në martesën e tyre.\\n\\nFtesa juaj personale:\\n\${url}\`;
  window.open(\`https://wa.me/?text=\${encodeURIComponent(text)}\`, '_blank');
};

window.openPreview = function(id) {
  window.open(\`/i/\${id}\`, '_blank');
};

window.deleteInvitation = async function(id, name) {
  if (!confirm(\`Fshi ftesën për "\${name}"? Kjo veprim nuk mund të zhbëhet.\`)) return;
  try {
    const r = await fetch(\`/api/admin/invitations?key=\${encodeURIComponent(adminKey)}&id=\${id}\`, {
      method: 'DELETE'
    });
    if (!r.ok) throw new Error('Failed');
    showToast('Ftesa u fshi');
    loadData();
  } catch (err) {
    showToast('Gabim: ' + err.message);
  }
};

// Boot
if (adminKey) {
  // Try the saved key — if it works, show app; otherwise show login
  fetch(\`/api/admin/invitations?key=\${encodeURIComponent(adminKey)}\`)
    .then(r => {
      if (r.ok) showApp();
      else showLogin();
    })
    .catch(() => showLogin());
} else {
  showLogin();
}
</script>

</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}
