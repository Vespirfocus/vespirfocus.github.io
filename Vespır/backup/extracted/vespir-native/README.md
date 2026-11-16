# Vespır — Capacitor ile yerel paketleme (Android + iOS)

Bu paket, Vespır web uygulamasını (`www/`) **Capacitor 8** ile yerel bir kabuğa sarar; aynı
`index.html` Android ve iOS'ta yerel uygulama olarak çalışır. Ana ekran widget sistemi bu paketten
kaldırılmıştır; içerik yalnızca standart Capacitor kabuğu ve iki isteğe bağlı şablon dosyadan oluşur.

## Paket içeriği
- `www/` → uygulamanın web dosyaları. `capacitor.config.json` içinde `webDir: "www"` tanımlıdır ve
  Capacitor bu klasörü paketler. Paketlemeden önce en güncel web sürümünü buraya kopyala
  (`index.html` klasörün kökünde olmalı).
- `capacitor.config.json` → `appId: app.vespir.focus`, `appName: Vespır`, `webDir: www`,
  `server.androidScheme: https`.
- `package.json` → Capacitor 8.6.0 bağımlılıkları ve kısayol betikleri:
  `npm run sync`, `npm run android`, `npm run ios`.
- `native-templates/` → isteğe bağlı şablon dosyalar (aşağıya bak). Bunlar gerçek platform projeleri
  değildir; `npx cap add` gerçek `android/` ve `ios/` projelerini oluşturur. (Şablonları `android/` /
  `ios/` adıyla bırakmak `cap add`'ın "klasör zaten var" hatası vermesine yol açar.)

## Gereksinimler (Capacitor 8)
- **Node.js 22+**
- **Android:** güncel Android Studio, Android SDK 36
- **iOS:** Mac + Xcode 26+, iOS deployment target 15.0

## Kurulum
1. Güncel web dosyalarını `www/` içine kopyala.
2. Bu klasörde bağımlılıkları kur ve platformları ekle:
   ```bash
   npm install
   npx cap add android      # gerçek android/ projesini oluşturur
   npx cap add ios          # gerçek ios/ projesini oluşturur (sadece Mac'te)
   npx cap sync             # www/ içeriğini platform projelerine kopyalar
   ```
3. IDE'de aç ve çalıştır:
   ```bash
   npx cap open android     # Android Studio'da açar
   npx cap open ios         # Xcode'da açar (sadece Mac'te)
   ```
`www/` her değiştiğinde `npx cap sync` (veya `npm run sync`) çalıştırmayı unutma.

## Şablon dosyaları (isteğe bağlı)
`npx cap add` zaten standart dosyaları üretir; bu şablonlar aynı standart içeriği taşır ve yalnızca
elle kurulum veya dosya sıfırlama gerektiğinde kullanılır.
- `native-templates/android/MainActivity.java.txt` →
  `android/app/src/main/java/app/vespir/focus/MainActivity.java` dosyasının tamamı. Standart
  `public class MainActivity extends BridgeActivity {}` şablonudur; özel eklenti kaydı içermez.
- `native-templates/ios/App/MyViewController.swift` → boş `CAPBridgeViewController` alt sınıfı.
  App hedefine eklersen `Main.storyboard` içindeki görünüm denetleyicisinin Custom Class alanını
  `MyViewController` (Module: App) yap; eklemezsen varsayılan `CAPBridgeViewController` geçerli kalır.

## Notlar
- `appId` (`app.vespir.focus`) değiştirilirse Java `package` satırını ve iOS bundle identifier'ını da
  aynı şekilde değiştir.
- Mağazaya yüklemek için Apple Developer (yıllık ücretli) ve Google Play hesabı gerekir. Android'de
  kendi telefonuna APK ile kurmak için ücretli hesap gerekmez.
