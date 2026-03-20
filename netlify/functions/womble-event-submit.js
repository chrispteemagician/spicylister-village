// womble-event-submit.js — Netlify function
// Submits a What's On event to Supabase womble_events
// fetch-only, no npm deps

const SUPABASE_URL = 'https://pdnjeynugptnavkdbmxh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkbmpleW51Z3B0bmF2a2RibXhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMTEzMDAsImV4cCI6MjA4NDU4NzMwMH0.GawisR01EykMtdauBMxenmHF2NXDMzDOJl8WgzkwFQo';

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

    const { display_name, event_type, location_name, postcode, event_date, notes, stall_slug, w3w_address } = body;

    if (!display_name || !event_type || !location_name || !event_date) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
    }

    const validTypes = ['boot_sale', 'car_boot', 'market', 'table_top', 'flea_market', 'antique_fair', 'other'];
    if (!validTypes.includes(event_type)) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid event type' }) };
    }

    // Don't accept past dates (more than 1 day ago)
    const submitted = new Date(event_date);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (submitted < yesterday) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Event date is in the past' }) };
    }

    const record = {
        display_name: display_name.trim().slice(0, 100),
        event_type,
        location_name: location_name.trim().slice(0, 200),
        postcode: postcode ? postcode.trim().toUpperCase().slice(0, 10) : null,
        event_date,
        notes: notes ? notes.trim().slice(0, 500) : null,
        stall_slug: stall_slug ? stall_slug.trim().slice(0, 100) : null,
        w3w_address: w3w_address ? w3w_address.replace(/^\/+/,'').toLowerCase().trim().slice(0, 100) : null,
    };

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/womble_events`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'apikey': SUPABASE_KEY,
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify(record)
        });

        if (!response.ok) {
            const err = await response.json();
            console.error('Supabase error:', err);
            return { statusCode: 500, body: JSON.stringify({ error: 'Could not submit event' }) };
        }

        return { statusCode: 200, body: JSON.stringify({ ok: true }) };

    } catch (err) {
        console.error('Function error:', err);
        return { statusCode: 500, body: JSON.stringify({ error: 'Server error' }) };
    }
};
