// womble-signup.js — Netlify function
// Creates a stall in Supabase womble_stalls
// fetch-only, no npm deps

const SUPABASE_URL = 'https://pdnjeynugptnavkdbmxh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkbmpleW51Z3B0bmF2a2RibXhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMTEzMDAsImV4cCI6MjA4NDU4NzMwMH0.GawisR01EykMtdauBMxenmHF2NXDMzDOJl8WgzkwFQo';

function makeSlug(ebayUsername) {
  return ebayUsername
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { display_name, ebay_username, tribe, bio, location, website, bluesky, mastodon, email } = body;

  if (!display_name || !ebay_username || !tribe) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
  }

  const validTribes = ['bootsaler', 'thrifter', 'flipper', 'neurospicy'];
  if (!validTribes.includes(tribe)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid tribe' }) };
  }

  const slug = makeSlug(ebay_username);

  const stall = {
    display_name: display_name.trim().slice(0, 100),
    slug,
    ebay_username: ebay_username.trim().slice(0, 100),
    tribe,
    bio: bio ? bio.trim().slice(0, 500) : null,
    location: location ? location.trim().slice(0, 100) : null,
    website: website ? website.trim().slice(0, 200) : null,
    bluesky: bluesky ? bluesky.trim().slice(0, 100) : null,
    mastodon: mastodon ? mastodon.trim().slice(0, 100) : null,
    email: email ? email.trim().slice(0, 200) : null,
  };

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/womble_stalls`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(stall)
    });

    if (!response.ok) {
      const err = await response.json();
      // Duplicate slug = already registered
      if (err.code === '23505') {
        return {
          statusCode: 409,
          body: JSON.stringify({ error: 'That eBay username already has a stall.', slug })
        };
      }
      console.error('Supabase error:', err);
      return { statusCode: 500, body: JSON.stringify({ error: 'Could not create stall' }) };
    }

    const data = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify({ slug: data[0].slug, display_name: data[0].display_name })
    };

  } catch (err) {
    console.error('Function error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error' }) };
  }
};
