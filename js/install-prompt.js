/* Kurulum teklifi sayfa hazır olmadan da gelebilir: erkenden yakala ki
     "Ana ekrana ekle" her zaman tarayıcının kendi kurulum penceresini açsın. */
  window.__vespirInstall = null;
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    window.__vespirInstall = e;
  });
