// patreon.js — Shared Patreon session manager for Wombles Village
// Include this on every page. Exposes:
//   window.womblePatreon.session  — null or { tier, fullName, expires }
//   window.womblePatreon.signIn() — redirects to Patreon OAuth
//   window.womblePatreon.signOut()
//   window.womblePatreon.renderNav(containerId) — renders sign-in/out into an element

(function () {
    const CLIENT_ID = 'A-K7cVCZBl7mQZDlrq0obIq7Jm0RPYAMGstfBsUyEeX-5e6WvU24ZWMTGBuypxot';
    const REDIRECT_URI = 'https://spicylister.co.uk/auth/patreon';
    const SESSION_KEY = 'womble_patreon_session';
    const SESSION_TTL = 24 * 60 * 60 * 1000; // 24 hours

    const TIER_LABELS = { villager: '🏠 Villager', elder: '⚔️ Elder', founder: '🏛️ Founder' };
    const TIER_COLOURS = { villager: '#f97316', elder: '#a78bfa', founder: '#f59e0b' };

    const OAUTH_URL =
        `https://www.patreon.com/oauth2/authorize` +
        `?response_type=code` +
        `&client_id=${CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
        `&scope=identity%20identity.memberships`;

    // ── Session ──────────────────────────────────────────────────────────────

    function loadSession() {
        try {
            const raw = localStorage.getItem(SESSION_KEY);
            if (!raw) return null;
            const s = JSON.parse(raw);
            if (!s.expires || Date.now() > s.expires) {
                localStorage.removeItem(SESSION_KEY);
                return null;
            }
            return s;
        } catch { return null; }
    }

    function saveSession(data) {
        const s = { ...data, expires: Date.now() + SESSION_TTL };
        localStorage.setItem(SESSION_KEY, JSON.stringify(s));
        return s;
    }

    function clearSession() {
        localStorage.removeItem(SESSION_KEY);
    }

    // ── OAuth callback (called from index.html on ?code=) ────────────────────

    async function handleCallback(code) {
        const res = await fetch(`/.netlify/functions/patreon-auth?code=${encodeURIComponent(code)}`);
        if (!res.ok) throw new Error('Auth failed');
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        return saveSession({ tier: data.tier, isPro: data.isPro, fullName: data.fullName });
    }

    // ── Nav renderer ─────────────────────────────────────────────────────────

    function renderNav(containerId) {
        const el = document.getElementById(containerId);
        if (!el) return;

        const session = loadSession();

        if (session && session.isPro) {
            const colour = TIER_COLOURS[session.tier] || '#f59e0b';
            const label = TIER_LABELS[session.tier] || 'Member';
            el.innerHTML = `
                <span style="display:inline-flex;align-items:center;gap:8px;background:rgba(0,0,0,0.3);padding:6px 14px;border-radius:50px;font-size:0.85rem;">
                    <span style="color:${colour};font-weight:700;">${label}</span>
                    <span style="color:rgba(255,255,255,0.55);font-size:0.8rem;">${session.fullName ? session.fullName.split(' ')[0] : 'Member'}</span>
                    <button onclick="window.womblePatreon.signOut()" style="background:none;border:none;color:rgba(255,255,255,0.35);cursor:pointer;font-size:0.75rem;padding:0 0 0 4px;">sign out</button>
                </span>`;
        } else {
            el.innerHTML = `
                <button onclick="window.womblePatreon.signIn()" style="background:linear-gradient(135deg,#ea580c,#c2410c);border:none;color:white;padding:7px 16px;border-radius:50px;font-family:'Outfit',sans-serif;font-size:0.85rem;font-weight:700;cursor:pointer;transition:opacity 0.2s;" onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">
                    🎨 Patreon Sign In
                </button>`;
        }
    }

    // ── Public API ────────────────────────────────────────────────────────────

    window.womblePatreon = {
        session: loadSession(),

        signIn() {
            // Store the current page so we can return after auth
            sessionStorage.setItem('patreon_return', window.location.pathname);
            window.location.href = OAUTH_URL;
        },

        signOut() {
            clearSession();
            window.womblePatreon.session = null;
            window.location.reload();
        },

        handleCallback,
        renderNav,
        loadSession,
        TIER_LABELS,
        TIER_COLOURS
    };

})();
