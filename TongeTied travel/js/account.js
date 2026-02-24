console.log('[Account] account.js loaded');

(function () {
  const Account = {};
  const TOKEN_KEY = 'tt_access_token';

  function $(id) { return document.getElementById(id); }
  function getToken() { return localStorage.getItem(TOKEN_KEY); }
  function setToken(t) { localStorage.setItem(TOKEN_KEY, t); }
  function clearToken() { localStorage.removeItem(TOKEN_KEY); }

  function initialsFromEmail(email) {
    const clean = (email || '').trim();
    return clean ? clean[0].toUpperCase() : '?';
  }

  function logMissing(ids) {
    const missing = ids.filter(id => !$(id));
    if (missing.length) console.warn('[Account] missing elements:', missing);
    return missing.length === 0;
  }

  function showDropdown(show) {
    const btn = $('accountBtn');
    const dd = $('accountDropdown');
    if (!btn || !dd) return;
    dd.classList.toggle('show', !!show);
    btn.setAttribute('aria-expanded', show ? 'true' : 'false');
  }

  function wireDropdown() {
    const btn = $('accountBtn');
    const dd = $('accountDropdown');
    if (!btn || !dd) return;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      showDropdown(!dd.classList.contains('show'));
    });

    document.addEventListener('click', (e) => {
      if (!dd.classList.contains('show')) return;
      if (dd.contains(e.target) || btn.contains(e.target)) return;
      showDropdown(false);
    });
  }

  function renderLoggedOut() {
    $('accountAvatar') && ($('accountAvatar').textContent = '?');
    $('accountLoggedOut') && ($('accountLoggedOut').style.display = '');
    $('accountLoggedIn') && ($('accountLoggedIn').style.display = 'none');
  }

  function renderLoggedIn(email) {
    $('accountAvatar') && ($('accountAvatar').textContent = initialsFromEmail(email));
    $('accountEmail') && ($('accountEmail').textContent = email || '');
    $('accountLoggedOut') && ($('accountLoggedOut').style.display = 'none');
    $('accountLoggedIn') && ($('accountLoggedIn').style.display = '');
  }

  async function apiMe() {
    const token = getToken();
    if (!token) return null;

    console.log('[Account] /me with token');
    const res = await fetch('/me', { headers: { Authorization: `Bearer ${token}` } });

    if (res.status === 401) {
      console.warn('[Account] /me 401 → clearing token');
      clearToken();
      return null;
    }
    if (!res.ok) {
      console.warn('[Account] /me failed:', res.status);
      return null;
    }
    return await res.json();
  }

  function openModal() {
    const m = $('authModal');
    if (!m) return;
    m.style.display = '';
    setTimeout(() => $('authEmail')?.focus(), 0);
  }

  function closeModal() {
    const m = $('authModal');
    if (!m) return;
    m.style.display = 'none';
  }

  async function requestMagicLink(email) {
    console.log('[Account] requesting magic link:', email);
    const res = await fetch('/auth/request-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json?.detail || 'Failed to send link');
    }
    return json;
  }

  async function exchangeToken(rawToken) {
    console.log('[Account] exchanging token');
    const res = await fetch('/auth/exchange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: rawToken })
    });
    if (!res.ok) throw new Error('Sign-in failed');
    return await res.json();
  }

  function parseHashParams() {
    const hash = (window.location.hash || '').replace(/^#/, '');
    const params = new URLSearchParams(hash);
    return { auth: params.get('auth'), token: params.get('token') };
  }

  function clearHash() {
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }

  async function handleAuthRedirect() {
    const { auth, token } = parseHashParams();
    if (auth !== 'success' || !token) return;

    console.log('[Account] auth redirect detected');
    try {
      const out = await exchangeToken(token);
      if (out?.access_token) {
        setToken(out.access_token);
        console.log('[Account] token saved');
      }
    } finally {
      clearHash();
    }
  }

  function wireModal() {
    $('openAuthModalBtn')?.addEventListener('click', () => {
      showDropdown(false);
      openModal();
    });

    $('closeAuthModalBtn')?.addEventListener('click', closeModal);

    $('authModal')?.addEventListener('click', (e) => {
      if (e.target?.id === 'authModal') closeModal();
    });

    $('sendMagicLinkBtn')?.addEventListener('click', async () => {
      const email = ($('authEmail')?.value || '').trim();
      const status = $('authStatus');

      if (!email) {
        if (status) status.textContent = 'Enter your email.';
        return;
      }

      if (status) status.textContent = 'Sending…';

      try {
        const out = await requestMagicLink(email);

        // DEV_MODE: show clickable link to test without SMTP
        if (out?.dev_verify_url) {
          if (status) status.innerHTML = `DEV: <a href="${out.dev_verify_url}">Click sign-in link</a>`;
        } else {
          if (status) status.textContent = 'Check your inbox for the sign-in link.';
        }
      } catch (e) {
        if (status) status.textContent = e?.message || 'Failed to send link.';
      }
    });
  }

  function wireLogout() {
    $('logoutBtn')?.addEventListener('click', () => {
      clearToken();
      renderLoggedOut();
      showDropdown(false);
      console.log('[Account] logged out');
    });
  }

  Account.init = async function () {
    console.log('[Account] init start');

    const ok = logMissing([
      'accountBtn','accountDropdown','accountAvatar',
      'openAuthModalBtn','logoutBtn',
      'authModal','sendMagicLinkBtn','authEmail','authStatus','closeAuthModalBtn'
    ]);
    if (!ok) return;

    wireDropdown();
    wireModal();
    wireLogout();

    await handleAuthRedirect();

    const me = await apiMe();
    if (me?.email) renderLoggedIn(me.email);
    else renderLoggedOut();

    console.log('[Account] init done');
  };

  window.Account = Account;
})();
