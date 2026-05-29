// GET /i/[id]
// Serves the main invitation page with personalized data injected
// Fetches the invitation by ID, increments view count, and serves index.html with placeholders replaced

export async function onRequestGet({ params, env, request }) {
  const id = parseInt(params.id, 10);

  if (!id || isNaN(id) || id < 1) {
    // Invalid ID — redirect to main page
    return Response.redirect(new URL('/', request.url).toString(), 302);
  }

  try {
    // Fetch the invitation
    const invitation = await env.DB.prepare(
      `SELECT id, guest_name, subtitle FROM invitations WHERE id = ?`
    ).bind(id).first();

    if (!invitation) {
      // Not found — redirect to main page
      return Response.redirect(new URL('/', request.url).toString(), 302);
    }

    // Increment view count (fire and forget)
    env.DB.prepare(
      `UPDATE invitations
       SET views = views + 1,
           last_viewed_at = datetime('now'),
           first_viewed_at = COALESCE(first_viewed_at, datetime('now'))
       WHERE id = ?`
    ).bind(id).run().catch(err => console.error('View update failed:', err));

    // Fetch the index.html from the same origin (asset)
    const originUrl = new URL('/', request.url);
    const assetResponse = await env.ASSETS.fetch(originUrl);
    let html = await assetResponse.text();

    // Inject invitation data as meta tags so client JS can read them
    const injection = `
<meta name="invitation-id" content="${invitation.id}">
<meta name="invitation-guest-name" content="${escapeAttr(invitation.guest_name)}">
<meta name="invitation-subtitle" content="${escapeAttr(invitation.subtitle || '')}">
`;
    html = html.replace('</head>', injection + '</head>');

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store'
      }
    });
  } catch (err) {
    console.error('Invitation route error:', err);
    // On error, just serve the main page
    return Response.redirect(new URL('/', request.url).toString(), 302);
  }
}

function escapeAttr(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}
