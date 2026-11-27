/* ============================================================
   İNGİT: Uygulama içi tarayıcı tespiti ve kilit ekranı
   Instagram, Facebook, TikTok gibi in-app browser'ları engeller.
   Normal tarayıcılar ve kurulu PWA (standalone) etkilenmez.
   ============================================================ */
(function() {
  if (document.readyState !== 'complete') {
    window.addEventListener('DOMContentLoaded', runInAppCheck);
    return;
  }
  runInAppCheck();

  function runInAppCheck() {
    /* PWA veya standalone moddaysa hiçbir şey yapma */
    if (window.navigator.standalone === true) return;
    if (window.matchMedia && matchMedia('(display-mode: standalone)').matches) return;

    const ua = navigator.userAgent || '';
    const isInApp = /Instagram|FBAN|FBAV|FB_iOS|FBAB|FB4A|FB_iPad|TikTok|BytedanceWebview|Musical_ly|LinkedIn|Snapchat|Twitter|X__|WhatsApp|Line|KakaoTalk|WeChat/i.test(ua);
    const isAndroid = /Android/i.test(ua);
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    if (!isInApp) return;

    const currentUrl = window.location.href;
    const isTr = document.documentElement.dataset.lang !== 'en';

    /* Android: Direkt varsayılan tarayıcıda aç (intent://) */
    if (isAndroid) {
      const intentUrl = 'intent:#Intent;action=android.intent.action.VIEW;scheme=https;package=com.android.chrome;S.url=' + encodeURIComponent(currentUrl) + ';end;';
      try {
        window.location.replace(intentUrl);
      } catch (e) {
        window.location.href = intentUrl;
      }
      return;
    }

    /* iOS'ta dış tarayıcıya geçiş zorlanamadığı için bağlantıyı kopyalama yolu sun. */
    const lock = document.createElement('div');
    lock.id = 'inAppLock';
    lock.innerHTML = `
      <div class="badge">Vespır      </div>
      <h3 id="inAppLockTitle">${isTr ? 'Vespır’ı tarayıcıda aç' : 'Open Vespır in your browser'}</h3>
      <p id="inAppLockDescription">${isTr ? 'Bu uygulama içi tarayıcıda bazı özellikler çalışmayabilir. Paylaş menüsünden “Safari’de Aç”ı seç. Bu seçenek yoksa bağlantıyı kopyalayıp Safari’ye yapıştır.' : 'Some features may not work in this in-app browser. Choose “Open in Safari” from the share menu. If it is unavailable, copy the link and paste it into Safari.'}</p>
      <button type="button" class="btn-copy" id="btnCopyBrowserUrl">${isTr ? 'Bağlantıyı kopyala' : 'Copy link'}</button>
      <input class="browser-url" id="browserUrl" type="url" readonly hidden>
      <p class="hint" id="browserCopyStatus" role="status" aria-live="polite"></p>
    `;
    lock.setAttribute('role', 'dialog');
    lock.setAttribute('aria-modal', 'true');
    lock.setAttribute('aria-labelledby', 'inAppLockTitle');
    lock.setAttribute('aria-describedby', 'inAppLockDescription');
    document.body.appendChild(lock);
    lock.classList.add('show');

    /* Arkadaki uygulamanın etkileşimini tamamen engelle */
    document.documentElement.style.overflow = 'hidden';
    Array.from(document.body.children).forEach((child) => {
      if (child === lock) return;
      child.inert = true;
      child.setAttribute('aria-hidden', 'true');
    });
    const copyButton = lock.querySelector('#btnCopyBrowserUrl');
    const urlField = lock.querySelector('#browserUrl');
    const copyStatus = lock.querySelector('#browserCopyStatus');
    urlField.value = currentUrl;
    copyButton.addEventListener('click', async () => {
      try {
        if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error('Clipboard API unavailable');
        await navigator.clipboard.writeText(currentUrl);
        urlField.hidden = true;
        copyStatus.textContent = isTr ? 'Bağlantı kopyalandı. Safari’yi açıp yapıştır.' : 'Link copied. Open Safari and paste it.';
      } catch (e) {
        urlField.hidden = false;
        urlField.focus({ preventScroll: true });
        urlField.select();
        copyStatus.textContent = isTr
          ? 'Otomatik kopyalama kullanılamıyor. Seçili bağlantıyı kopyalayıp Safari’ye yapıştır.'
          : 'Automatic copy is unavailable. Copy the selected link and paste it into Safari.';
      }
    });
    copyButton.focus({ preventScroll: true });
  }
})();
