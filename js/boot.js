(function () {
    try {
      var isAppleTouch = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      document.documentElement.classList.toggle('ios-glass', isAppleTouch);
    } catch (eG) {}
    /* Performans modu: html[data-lowfx="1"] ağır arka plan süslemelerini
       kapatır. Varsayılan kapalıdır, kullanıcı isterse açar. */
    try {
      var forced = '';
      try { forced = localStorage.getItem('vespir.lowfx') || ''; } catch (eF) {}
      /* Performans modu varsayılan olarak KAPALI. Yalnızca kullanıcı kendisi
         açtıysa ('1') devreye girer; cihaz gücüne göre kendiliğinden açılmaz. */
      document.documentElement.dataset.lowfx = forced === '1' ? '1' : '0';
    } catch (eL) {}
    try {
      var raw = localStorage.getItem('vespir.v1');
      if (!raw) return;
      var d = JSON.parse(raw);
      var html = document.documentElement;
      if (d.theme) html.dataset.theme = d.theme;
      if (d.mode && d.mode !== 'auto') html.dataset.mode = d.mode;
      else if (d.mode === 'auto' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) html.dataset.mode = 'dark';
      if (d.lang === 'en') { html.lang = 'en'; html.dataset.lang = 'en'; }
      else { html.lang = 'tr'; html.dataset.lang = 'tr'; }
      if (d.cat) {
        var vars = { fur: d.cat.fur, belly: d.cat.belly, eyes: d.cat.eyes, collar: d.cat.collar, patch: d.cat.patch, patch2: d.cat.patch2 };
        for (var k in vars) if (vars[k]) html.style.setProperty('--' + k, vars[k]);
        var sc = Number(d.cat.scale);
        if (sc >= .8 && sc <= 1.2) html.style.setProperty('--cat-scale', sc);
      }
    } catch (e) {}
  })();
