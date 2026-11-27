/* Güncelleme ekranı: sürüm değiştiğinde bir kez gösterilir.
   İlk ziyarette (kayıtlı sürüm yokken) açılmaz. */
(function() {
  const overlay = document.getElementById('updateOverlay');
  const list = document.getElementById('newsList');
  const verEl = document.getElementById('updateVer');
  const btn = document.getElementById('updateContinueBtn');
  if (!overlay || !list || !btn) return;
  const KEY = 'vespir.seenVersion';
  const NEWS = {
    v28: {
      tr: [
        'Arka plandaki hava kontrolünün izi düzeltildi: tercihler yeniden yazıldığında silinmiyor, böylece “son üç saatte bakıldı” kuralı gerçekten uygulanıyor.',
        'Bildirim davranışı aynı: hava uyarısı günde en fazla bir kez, 23.00–05.00 arası sessiz.'
      ],
      en: [
        'Fixed the bookkeeping of the background weather check: it is no longer dropped when preferences are rewritten, so the “checked within the last three hours” rule now really applies.',
        'Notification behaviour is unchanged: at most one weather alert a day, quiet between 23:00 and 05:00.'
      ]
    },
    v27: {
      tr: [
        'Uygulama tek dev dosya olmaktan çıktı: stil ve betikler ayrı dosyalarda; her açılışta indirilen HTML 955 KB’den 75 KB’ye indi.',
        'Güvenlik: sayfaya Content-Security-Policy eklendi; artık yalnızca izin verilen kaynaklardan kod ve veri yüklenebiliyor.',
        'Google ile girişte sessiz başarısızlık giderildi: yönlendirme tamamlanmazsa nedeni ve çözümü ekranda yazıyor.',
        'Hakkında bölümündeki görsel yüklenemezse bozuk resim simgesi yerine kutu gizleniyor.',
      ],
      en: [
        'The app is no longer one giant file: styles and scripts live in separate files; the HTML fetched on every open dropped from 955 KB to 75 KB.',
        'Security: a Content-Security-Policy now limits which sources may load code and data.',
        'Google sign-in no longer fails silently: if a redirect doesn’t complete, the reason and the fix are shown on screen.',
        'If the image in the About section fails to load, the box hides instead of showing a broken-image icon.',
      ]
    },
    v26: {
      tr: [
        'Sayaç üstünde biriken kar artık dökülmüyor: çığ ve kenar taşması kaldırıldı, kar yalnızca birikiyor.',
        'Kar yoğunluğu ve tuval çözünürlüğü azaltıldı; kar aynı görünüyor, kare maliyeti düştü.',
        'Kedi başını silkeleyince kopan kar parçaları ve toz bulutu yarıya indirildi; o an artık daha akıcı.'
      ],
      en: [
        'Snow piled on the timer no longer falls off: the avalanche and edge spill are gone, the snow just settles.',
        'Snow density and canvas resolution were lowered; the snow looks the same with a lighter frame cost.',
        'The snow clumps and dust burst from the cat shaking its head are halved, so that moment runs smoother.'
      ]
    },
    v25: {
      tr: [
        'Her temanın süsü mobil ve masaüstünde tek tek kontrol edildi; açık modda kaybolan yıldız, bulut ve baloncuk motifleri koyulaştırıldı.',
        'Ekran açılırken arayüzün aşırı saydam görünmesi giderildi: paneller artık saydamlıktan gelmiyor, arkalarındaki perde daha koyu.',
        'Uygulama simgesi, favicon ve Apple simgesi yuvarlak üretildi; Android için maskelenebilir sürüm korundu.',
        'Ana ekrana eklenen Vespır simgesi artık her yerde yuvarlak görünüyor.'
      ],
      en: [
        'Every theme ornament was checked one by one on mobile and desktop; the stars, clouds and bubbles that disappeared in light mode are now deeper in tone.',
        'Screens no longer look almost see-through while opening: panels slide in without fading from transparent and their backdrops are darker.',
        'The app icon, favicon and Apple icon are now round; the maskable Android version is kept.',
        'The Vespır icon on your home screen now looks round everywhere.'
      ]
    },
    v24: {
      tr: [
        '"Vespır Nedir?" satırındaki görsel, verdiğin yuvarlak Noel kedi resmiyle değiştirildi; arayüzdeki tüm görseller yuvarlak.',
        'Her tema sayacın üstünde kendi süsünü taşıyor: Sakura çiçekleri, Gece Mavisi yıldızları, Orman yaprakları, Okyanus baloncukları, Kakao çekirdekleri, balkabakları…',
        'Odak sahnesine girerken sayacı gerip rakamları aşağı kaydıran geçiş düzeltildi; süre artık dairenin tam ortasında.',
        'Uygulama artık karanlık Noel temasıyla açılıyor; temayı istediğin zaman değiştirebilirsin.',
        'Widget ve kullanılmayan dosyalar kaldırıldı; kurulum daha hafif.'
      ],
      en: [
        'The image on the "What is Vespır?" row is now the round Christmas cat picture you gave me, and every image in the interface is round.',
        'Every theme carries its own ornament above the timer: Sakura blossoms, Midnight stars, Forest leaves, Ocean bubbles, Cocoa beans, pumpkins…',
        'The transition into focus mode no longer stretches the timer and pushes the digits down; the time sits dead centre of the ring.',
        'The app now opens in the dark Christmas theme; you can change the theme whenever you like.',
        'The widget and unused files were removed; the install is lighter.'
      ]
    },
    v23: {
      tr: [
        'Hakkımızda sayfasındaki büyük kış görseli kaldırıldı; aynı görsel artık "Vespır Nedir?" satırındaki logo yerinde duruyor.',
        'Okunurluk düzeltmesi: güncelleme ekranı, nokta paneli, Ayarlar, Hakkımızda, İletişim ve Gizlilik yüzeyleri neredeyse opak zemine taşındı.',
        'Yazılar artık arkadaki hareketli zeminden ve cam katmanlardan etkilenmiyor; 8 temanın hepsinde aynı kontrast.',
        'Ayarlar paneli ve büyük kartlar daha hızlı açılıyor; bulanık katman sayısı azaldı.'
      ],
      en: [
        'The large winter illustration was removed from the What is Vespır page; the same image now sits where the logo was on the "What is Vespır?" row.',
        'Readability fix: the update screen, the dot panel, Settings, About, Contact and Privacy surfaces now use near-opaque backgrounds.',
        'Text is no longer washed out by the animated background or glass layers, with the same contrast across all 8 themes.',
        'The settings panel and large cards open faster; fewer blur layers are composited.'
      ]
    },
    v22: {
      tr: [
        'Sayaç halkasının içi yeniden dengelendi: "Bugün X dk odak" etiketi halkanın altına taşındı, rakamlar tam ortada.',
        'Apple cihazlarda Liquid Glass alt bar: Odaklan · Tema · Ayarlar · Hesap; ikonlar artık Vespır’a özel.',
        'Google ile giriş sayfa yenilense de sürüyor; oturum bu tarayıcıda saklanıyor. iPhone/Safari’de yönlendirmeli giriş.',
        'Hakkımızda sayfasına yeni kış (Noel) görseli eklendi.',
        'Güncelleme ekranındaki "Yenilikler" listesi gerçek sürüm notlarını gösteriyor.',
        'Çevrimdışı açılışta eski sürüm yerine güncel arayüz yükleniyor; mum artık bal kabağının içinde değil.'
      ],
      en: [
        'The inside of the timer ring is balanced again: "Today X min focus" moved under the ring and the digits sit dead centre.',
        'Liquid Glass bottom bar on Apple devices: Focus · Theme · Settings · Account, now with Vespır’s own icons.',
        'Google sign-in survives a page refresh; your session is kept in this browser, with redirect sign-in on iPhone/Safari.',
        'A new winter (Christmas) illustration was added to the What is Vespır page.',
        'The "What’s new" list on the update screen now shows real release notes.',
        'Offline starts load the current interface instead of an old version; the candle is no longer inside the pumpkin.'
      ]
    }
  };
  const lang = () => (document.documentElement.dataset.lang === 'en' ? 'en' : 'tr');
  function paint(version) {
    const pack = NEWS[version];
    if (verEl) verEl.textContent = version || '';
    list.innerHTML = '';
    if (!pack) return;
    (pack[lang()] || pack.tr).forEach((line) => {
      const li = document.createElement('li');
      li.textContent = line;
      list.appendChild(li);
    });
  }
  function close() {
    overlay.hidden = true;
    document.body.classList.remove('update-open');
    try { localStorage.setItem(KEY, document.getElementById('appVersion') ? document.getElementById('appVersion').textContent : ''); } catch (e) {}
  }
  btn.addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay || e.target.classList.contains('update-backdrop')) close(); });
  const version = (document.getElementById('appVersion') || {}).textContent || '';
  let seen = '';
  try { seen = localStorage.getItem(KEY) || ''; } catch (e) {}
  if (!version) return;
  if (!seen) {
    /* Daha önce Vespır kullanılmışsa (yerel ayar kaydı varsa) bu bir güncelleme:
       yenilikler bir kez gösterilir. İlk ziyarette ekran açılmaz. */
    let usedBefore = false;
    try { usedBefore = !!localStorage.getItem('vespir.v1'); } catch (e) {}
    if (!usedBefore) { try { localStorage.setItem(KEY, version); } catch (e) {} return; }
    seen = 'v0';
  }
  if (seen === version) return;
  paint(version);
  overlay.hidden = false;
  document.body.classList.add('update-open');
  setTimeout(() => { try { btn.focus({ preventScroll: true }); } catch (e) {} }, 260);
})();
