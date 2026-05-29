// /api/admin/invitations
// GET    — list all invitations + their RSVP status
// POST   — create new invitation { guest_name, subtitle }
// DELETE — delete invitation by id (?id=N)
// All require ?key=ADMIN_KEY

function checkAuth(request, env) {
  const url = new URL(request.url);
  const providedKey = url.searchParams.get('key');
  return providedKey && providedKey === env.ADMIN_KEY;
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

// GET: List all invitations with their latest RSVP status
export async function onRequestGet({ request, env }) {
  if (!checkAuth(request, env)) return new Response('Forbidden', { status: 403 });

  try {
    // Join with rsvps to get the latest RSVP per invitation
    const result = await env.DB.prepare(`
      SELECT
        i.id,
        i.guest_name,
        i.subtitle,
        i.views,
        i.first_viewed_at,
        i.last_viewed_at,
        i.created_at,
        r.firstname AS rsvp_firstname,
        r.lastname AS rsvp_lastname,
        r.answer AS rsvp_answer,
        r.created_at AS rsvp_at
      FROM invitations i
      LEFT JOIN (
        SELECT invitation_id, firstname, lastname, answer, created_at,
          ROW_NUMBER() OVER (PARTITION BY invitation_id ORDER BY created_at DESC) AS rn
        FROM rsvps
        WHERE invitation_id IS NOT NULL
      ) r ON r.invitation_id = i.id AND r.rn = 1
      ORDER BY i.created_at DESC
    `).all();

    // Also fetch summary counts
    const counts = { yes: 0, maybe: 0, no: 0, pending: 0, viewed: 0, total: 0 };
    for (const inv of result.results || []) {
      counts.total++;
      if (inv.views > 0) counts.viewed++;
      if (inv.rsvp_answer === 'yes') counts.yes++;
      else if (inv.rsvp_answer === 'maybe') counts.maybe++;
      else if (inv.rsvp_answer === 'no') counts.no++;
      else counts.pending++;
    }

    return jsonResponse({
      invitations: result.results || [],
      counts
    });
  } catch (err) {
    console.error('Admin list error:', err);
    return jsonResponse({ error: err.message }, 500);
  }
}

// POST: Create new invitation
export async function onRequestPost({ request, env }) {
  if (!checkAuth(request, env)) return new Response('Forbidden', { status: 403 });

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  const guest_name = (body.guest_name || '').toString().trim();
  const subtitle = (body.subtitle || '').toString().trim();

  if (guest_name.length < 1 || guest_name.length > 100) {
    return jsonResponse({ error: 'guest_name required (1-100 chars)' }, 400);
  }
  if (subtitle.length > 100) {
    return jsonResponse({ error: 'subtitle too long' }, 400);
  }

  try {
    const result = await env.DB.prepare(
      `INSERT INTO invitations (guest_name, subtitle) VALUES (?, ?) RETURNING id, guest_name, subtitle, created_at`
    ).bind(guest_name, subtitle).first();

    return jsonResponse({ ok: true, invitation: result });
  } catch (err) {
    console.error('Create invitation error:', err);
    return jsonResponse({ error: err.message }, 500);
  }
}

// DELETE: Remove invitation by ?id=N
export async function onRequestDelete({ request, env }) {
  if (!checkAuth(request, env)) return new Response('Forbidden', { status: 403 });

  const url = new URL(request.url);
  const id = parseInt(url.searchParams.get('id'), 10);

  if (!id || isNaN(id)) {
    return jsonResponse({ error: 'id parameter required' }, 400);
  }

  try {
    // Also clear invitation_id from any RSVPs that point to this invitation
    await env.DB.prepare(`UPDATE rsvps SET invitation_id = NULL WHERE invitation_id = ?`)
      .bind(id).run();

    const result = await env.DB.prepare(`DELETE FROM invitations WHERE id = ?`)
      .bind(id).run();

    return jsonResponse({ ok: true, deleted: result.meta?.changes || 0 });
  } catch (err) {
    console.error('Delete invitation error:', err);
    return jsonResponse({ error: err.message }, 500);
  }
}
