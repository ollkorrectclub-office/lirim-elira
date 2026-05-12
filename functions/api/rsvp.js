// POST /api/rsvp
// Receives RSVP submission, validates, stores in D1 database

export async function onRequestPost({ request, env }) {
  try {
    // Parse JSON body
    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: 'Të dhëna të pavlefshme.' }, 400);
    }

    // Extract & validate
    const firstname = (body.firstname || '').toString().trim();
    const lastname = (body.lastname || '').toString().trim();
    const answer = (body.answer || '').toString().trim();

    if (firstname.length < 2 || firstname.length > 50) {
      return jsonResponse({ error: 'Emri është i pavlefshëm.' }, 400);
    }
    if (lastname.length < 2 || lastname.length > 50) {
      return jsonResponse({ error: 'Mbiemri është i pavlefshëm.' }, 400);
    }
    if (!['yes', 'maybe', 'no'].includes(answer)) {
      return jsonResponse({ error: 'Përgjigje e pavlefshme.' }, 400);
    }

    // Light spam protection — basic character check (no URLs, no emojis in names)
    const nameRegex = /^[\p{L}\p{M}\s\-'.]+$/u;
    if (!nameRegex.test(firstname) || !nameRegex.test(lastname)) {
      return jsonResponse({ error: 'Ju lutem shkruani vetëm shkronja.' }, 400);
    }

    // Get client metadata
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const userAgent = request.headers.get('User-Agent') || '';
    const country = request.cf?.country || null;

    // Rate-limiting: max 5 submissions from same IP in last hour
    const recentCount = await env.DB.prepare(
      `SELECT COUNT(*) as count FROM rsvps
       WHERE ip = ? AND created_at > datetime('now', '-1 hour')`
    ).bind(ip).first();

    if (recentCount && recentCount.count >= 5) {
      return jsonResponse({
        error: 'Shumë përpjekje. Provoni më vonë.'
      }, 429);
    }

    // Insert into database
    const result = await env.DB.prepare(
      `INSERT INTO rsvps (firstname, lastname, answer, ip, user_agent, country, created_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
    ).bind(
      firstname,
      lastname,
      answer,
      ip,
      userAgent.substring(0, 500),  // truncate long UAs
      country
    ).run();

    if (!result.success) {
      throw new Error('Database insertion failed');
    }

    return jsonResponse({ ok: true });
  } catch (err) {
    console.error('RSVP error:', err);
    return jsonResponse({
      error: 'Gabim i papritur. Ju lutemi provoni më vonë.'
    }, 500);
  }
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
