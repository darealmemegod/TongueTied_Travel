(function () {
  function attachGlobalGuards() {
    window.addEventListener('error', (event) => {
      const msg = event?.error?.message || event?.message || 'Неизвестная ошибка';
      console.error('Global error:', msg, event);
    });

    window.addEventListener('offline', () => {
      if (document.querySelector('.offline-notification')) return;
      const el = document.createElement('div');
      el.className = 'offline-notification';
      el.style.cssText = `
        position:fixed;top:20px;right:20px;z-index:99999;
        background:var(--warning);color:white;padding:12px 18px;
        border-radius:var(--radius-lg);box-shadow:var(--shadow-xl);
        display:flex;gap:10px;align-items:center;
      `;
      el.innerHTML = `<i class="fas fa-wifi-slash"></i><span>Нет подключения к интернету</span>`;
      document.body.appendChild(el);
    });

    window.addEventListener('online', () => {
      document.querySelector('.offline-notification')?.remove();
    });
  }

  async function onPartialsLoaded() {
    const lang = localStorage.getItem('language') || 'ru';
    await window.preloadTranslations(['ru', 'en']);
    await window.updateInterfaceLanguage(lang);

    if (window.MapSearch?.init) window.MapSearch.init();
    if (window.Accessibility?.init) window.Accessibility.init();
  }

  function boot() {
    attachGlobalGuards();
    document.addEventListener('partialsLoaded', onPartialsLoaded, { once: true });
    window.IncludeComponents.loadAll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();

document.addEventListener('partialsLoaded', () => {
  window.Account?.init?.();
}, { once: true });

