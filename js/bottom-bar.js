/* Alt bar - yalnızca iOS/Apple cihazlarda görünür.
   Sıra: Odaklan · Tema (karanlık/aydınlık) · Ayarlar · Hesap */
(function() {
  const nav = document.getElementById('bottomNav');
  if (!nav) return;
  if (!document.documentElement.classList.contains('ios-glass')) { nav.remove(); return; }
  const items = Array.from(nav.querySelectorAll('.item'));
  const setActive = (id) => items.forEach((i) => {
    const on = i.id === id;
    i.classList.toggle('active', on);
    if (on) i.setAttribute('aria-current', 'page');
    else i.removeAttribute('aria-current');
  });
  const closeAll = () => {
    ['about', 'contact', 'privacy', 'account'].forEach((key) => {
      const el = document.getElementById(key);
      if (!el || !el.classList.contains('open')) return;
      const closer = { about: 'closeAbout', contact: 'closeContact', privacy: 'closePrivacy', account: 'closeAccount' }[key];
      try { if (typeof window[closer] === 'function') window[closer](); } catch (e) {}
    });
  };
  nav.addEventListener('click', (e) => {
    const btn = e.target.closest('.item');
    if (!btn) return;
    if (btn.id === 'navOdak') {
      setActive(btn.id);
      closeAll();
      if (typeof closeSettings === 'function') closeSettings();
      const card = document.getElementById('timerCard');
      if (card && card.scrollIntoView) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (btn.id === 'navTema') {
      if (typeof toggleScheme === 'function') toggleScheme();
      btn.classList.add('active');
      setTimeout(() => setActive('navOdak'), 480);
    } else {
      setActive(btn.id);
      if (btn.id === 'navAyarlar' && typeof openSettings === 'function') openSettings('cat');
      if (btn.id === 'navHesap' && typeof openAccount === 'function') openAccount();
    }
  });
  /* Dil değişince etiketler sözlükten gelir; burada yalnızca durum tazelenir. */
  document.addEventListener('vespir:lang', () => setActive(nav.querySelector('.item.active') ? nav.querySelector('.item.active').id : 'navOdak'));
})();
