'use strict';
/* ============================================================
   Vespır — tek dosya, sıfır bağımlılık
   ============================================================ */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
/* Sayaç ve göz takibi gibi sıcak yollarda aynı öğe kare başına yeniden
   sorgulanmasın: seçici bir kez çözülür, öğe DOM'dan düşerse yenilenir. */
const elCache = new Map();
const cachedEl = (sel) => {
  let el = elCache.get(sel);
  if (!el || !el.isConnected) {
    el = document.querySelector(sel);
    elCache.set(sel, el);
  }
  return el;
};
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
const pad2 = (n) => String(n).padStart(2, '0');
const rand = (a, b) => a + Math.random() * (b - a);
const randInt = (a, b) => Math.floor(rand(a, b + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const todayKey = (at = Date.now()) => {
  const d = new Date(at);
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
};
/* Uygulama gece yarısını açık geçirse de istatistikler yeni güne sıfırlanır. */
function rollStatsDay() {
  const key = todayKey();
  if (!S.stats || S.stats.day !== key) {
    S.stats = { day: key, sec: 0, sessions: 0, hourMark: 0 };
    return true;
  }
  return false;
}
/* Seri (streak): gün içinde en az bir odak seansı bitince o gün sayılır.
   Dün sayılmışsa seri artar, bir gün atlanırsa 1'den başlar. */
function dayKeyOffset(n, at = Date.now()) {
  const d = new Date(at);
  d.setDate(d.getDate() + n);
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
}
function bumpStreak(at = Date.now()) {
  const st = S.streak && typeof S.streak === 'object' ? S.streak : { count: 0, last: '' };
  const today = todayKey(at);
  if (st.last >= today) { S.streak = st; return; }
  st.count = st.last === dayKeyOffset(-1, at) ? (st.count | 0) + 1 : 1;
  st.last = today;
  S.streak = st;
}
const fmtClock = (sec) => {
  const s = Math.max(0, Math.round(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return h > 0 ? `${h}:${pad2(m)}:${pad2(ss)}` : `${pad2(m)}:${pad2(ss)}`;
};
const fmtDuration = (min) => {
  const en = typeof S !== 'undefined' && S.lang === 'en';
  if (min < 60) return en ? `${min} min` : `${min} dk`;
  const h = Math.floor(min / 60), m = min % 60;
  if (en) return m ? `${h} hr ${m} min` : `${h} hr`;
  return m ? `${h} sa ${m} dk` : `${h} saat`;
};
const THEMES = {
  sakura:   { label: 'Sakura',      tag: 'tatlı & kalpli',   particle: 'heart', metaLight: '#fdf3f7', metaDark: '#150c18' },
  midnight: { label: 'Gece Mavisi', tag: 'sakin & neon',     particle: 'star',  metaLight: '#eef5ff', metaDark: '#040a16' },
  forest:   { label: 'Orman',       tag: 'doğal & yumuşak',  particle: 'leaf',  metaLight: '#f1f7ee', metaDark: '#06110c' },
  sunset:   { label: 'Gün Batımı',  tag: 'sıcak & cesur',    particle: 'dot',   metaLight: '#fff5ec', metaDark: '#130b0a' },
  lavender: { label: 'Lavanta',     tag: 'rüya gibi & sakin', particle: 'star', metaLight: '#f8f4ff', metaDark: '#0c0817' },
  ocean:    { label: 'Okyanus',     tag: 'ferah & derin',    particle: 'dot',   metaLight: '#eefbff', metaDark: '#030d14' },
  peach:    { label: 'Şeftali',     tag: 'yumuşak & tatlı',  particle: 'heart', metaLight: '#fff8f4', metaDark: '#170d0a' },
  mint:     { label: 'Nane',        tag: 'taze & huzurlu',   particle: 'leaf',  metaLight: '#f1fdf8', metaDark: '#04110d' },
  cocoa:    { label: 'Kakao',       tag: 'sıcak & kitap kokulu', particle: 'leaf', metaLight: '#fbf6f1', metaDark: '#120d0a' },
  galaxy:   { label: 'Galaksi',     tag: 'derin & büyülü',   particle: 'star',  metaLight: '#f3f1ff', metaDark: '#07040f' },
  noel:     { label: 'Noel',        tag: 'kar & sıcak ışık', particle: 'snow',  metaLight: '#eef6fb', metaDark: '#050e16' },
  halloween:{ label: 'Cadılar Bayramı', tag: 'kanlı ay & gölgeler',  particle: 'bat',   metaLight: '#f1ecef', metaDark: '#07050a' }
};
/* Tüm temalar, kıyafetler ve aksesuarlar her zaman seçilebilir. */
const GENDERS = { kiz: 'Dişi', erkek: 'Erkek' };
const BREEDS = {
  tekir:   { label: 'Tekir',           fur: '#a59482', belly: '#f3ebe0', eyes: '#9cc45c', patch: '#6f6153', patch2: '#423a33' },
  sarman:  { label: 'Sarman',          fur: '#eaa04a', belly: '#fff2dc', eyes: '#e3a83a', patch: '#c1762c', patch2: '#7a4a21' },
  british: { label: 'Britanya Kısa Tüylü', fur: '#9aa6b8', belly: '#eef2f7', eyes: '#e39a34', patch: '#7f8a9c', patch2: '#59616e' },
  siyam:   { label: 'Siyam',           fur: '#f4e8d6', belly: '#fffaf1', eyes: '#56a9e8', patch: '#4f3a2d', patch2: '#32241b' },
  van:     { label: 'Van Kedisi',      fur: '#ffffff', belly: '#ffffff', eyes: '#74c7d4', patch: '#d98b4a', patch2: '#a55f2b' },
  calico:  { label: 'Üç Renkli',       fur: '#fff9f1', belly: '#ffffff', eyes: '#b9d45a', patch: '#e29a52', patch2: '#3b302a' },
  bombay:  { label: 'Bombay',          fur: '#17151b', belly: '#26232b', eyes: '#e9a83c', patch: '#0d0c11', patch2: '#39343f' },
  rus:     { label: 'Rus Mavisi',      fur: '#8c9aa8', belly: '#dbe4ea', eyes: '#66c877', patch: '#6f7d8b', patch2: '#4d5966' },
  bengal:  { label: 'Bengal',          fur: '#d9a15f', belly: '#fff2dc', eyes: '#a3c95c', patch: '#6a3f1a', patch2: '#3c240e' },
  tuxedo:  { label: 'Smokin',          fur: '#232129', belly: '#faf7f0', eyes: '#e5b34a', patch: '#121116', patch2: '#57525f' },
  angora:  { label: 'Ankara Kedisi',   fur: '#fffdf8', belly: '#ffffff', eyes: '#66b9df', eyes2: '#d9a544', patch: '#efe6d8', patch2: '#d6c7b4' },
  persian: { label: 'İran Kedisi',     fur: '#e8d6c0', belly: '#fff6e8', eyes: '#d59a3e', patch: '#cfb28f', patch2: '#9c7d5c' }
};
const ACCESSORIES = {
  bell: 'Zil', bow: 'Fiyonk', flower: 'Çiçek', bandana: 'Bandana', tie: 'Kravat',
  crown: 'Taç', glasses: 'Gözlük', headphones: 'Kulaklık', scarf: 'Atkı', bowtie: 'Papyon', star: 'Yıldız',
  santa: 'Noel Şapkası', antlers: 'Geyik Boynuzu', nose: 'Kırmızı Burun',
  witchhat: 'Cadı Şapkası', pumpkin: 'Balkabağı', none: 'Yok'
};
/* Kıyafet dolabı: her parça tek başına giyilir, aksesuarlardan bağımsızdır. */
const OUTFITS = {
  none:      { label: 'Kıyafetsiz',        kind: 'none' },
  suit:      { label: 'Takım Elbise',      kind: 'suit',      a: '#31496f', b: '#1a2742', t: '#f4f7ff', d: '#d8b45a', thin: true },
  tuxedo:    { label: 'Smokin',            kind: 'tuxedo',    a: '#23262f', b: '#101218', t: '#f6f7fb', d: '#cfd6e6', thin: true },
  shirt:     { label: 'Gömlek',            kind: 'shirt',     a: '#dde6f4', b: '#bccbe1', t: '#ffffff', d: '#5d7392', thin: true },
  sweater:   { label: 'Triko Kazak',       kind: 'sweater',   a: '#ead9bd', b: '#cbb591', t: '#f7ecd9', d: '#8a6f4c' },
  vest:      { label: 'Yelek',             kind: 'vest',      a: '#b8874a', b: '#8d6030', t: '#f6f1e6', d: '#e8dcc7', thin: true },
  hoodie:    { label: 'Kapüşonlu',         kind: 'hoodie',    a: '#6b7684', b: '#4a535f', t: '#9aa5b2', d: '#e8edf3' },
  raincoat:  { label: 'Yağmurluk',         kind: 'raincoat',  a: '#e8c34a', b: '#c79d25', t: '#f7e9a8', d: '#4a3c1a' },
  trench:    { label: 'Trençkot',          kind: 'trench',    a: '#cbb392', b: '#a98f6a', t: '#e8dcc4', d: '#e6c36a' },
  denim:     { label: 'Denim Ceket',       kind: 'denim',     a: '#5d7fa6', b: '#3f5f82', t: '#dbe6f2', d: '#e0a94a' },
  leather:   { label: 'Deri Ceket',        kind: 'leather',   a: '#3a3a42', b: '#1d1d22', t: '#55555f', d: '#c9ccd4' },
  overalls:  { label: 'Tulum',             kind: 'overalls',  a: '#5f80a3', b: '#40607f', t: '#f2f5f8', d: '#e2b64f' },
  apron:     { label: 'Önlük',             kind: 'apron',     a: '#f4f1ea', b: '#dfd8ca', t: '#fffdf8', d: '#8c6a4c', thin: true },
  chef:      { label: 'Şef Ceketi',        kind: 'chef',      a: '#f7f5ef', b: '#e2ded3', t: '#ffffff', d: '#7a7264', thin: true },
  kimono:    { label: 'Kimono',            kind: 'kimono',    a: '#c94f5d', b: '#992c3a', t: '#f6dfc6', d: '#e8b75a', thin: true },
  wizard:    { label: 'Büyücü Cübbesi',    kind: 'wizard',    a: '#5b3f86', b: '#38245c', t: '#cdb3ef', d: '#f0cf6a' },
  cloak:     { label: 'Pelerin',           kind: 'cloak',     a: '#2f5145', b: '#1a342c', t: '#cbe3d8', d: '#d6bc7a' },
  pirate:    { label: 'Korsan Ceketi',     kind: 'pirate',    a: '#6e2730', b: '#45161d', t: '#e8c98a', d: '#e2b357' },
  astronaut: { label: 'Astronot',          kind: 'astronaut', a: '#e8ecf2', b: '#c4ccd8', t: '#fbfcfe', d: '#e2743a' },
  hero:      { label: 'Süper Kahraman',    kind: 'hero',      a: '#3b6fd4', b: '#244a9e', t: '#f7f9ff', d: '#e8c23a' },
  jersey:    { label: 'Spor Forma',        kind: 'jersey',    a: '#d64a4a', b: '#a92e2e', t: '#ffffff', d: '#f4e9d8', thin: true },
  polo:      { label: 'Tenis Polosu',      kind: 'polo',      a: '#f2f4f2', b: '#d6ded9', t: '#ffffff', d: '#3f8a62', thin: true },
  hawaii:    { label: 'Hawaii Gömleği',    kind: 'hawaii',    a: '#3a8d8a', b: '#22625f', t: '#f4e6c8', d: '#e8a0a8', thin: true },
  pajama:    { label: 'Pijama',            kind: 'pajama',    a: '#8fa6c4', b: '#6d86a8', t: '#eef3fa', d: '#f2f5fa', thin: true },
  bathrobe:  { label: 'Bornoz',            kind: 'bathrobe',  a: '#f4f1ec', b: '#ddd5ca', t: '#fffdfa', d: '#b7a58e' },
  santa:     { label: 'Noel Ceketi',       kind: 'santa',     a: '#c8353f', b: '#951f28', t: '#fdfdfd', d: '#f4d06a' },
  witch:     { label: 'Cadı Pelerini',     kind: 'witch',     a: '#3a2a4a', b: '#221632', t: '#e0a04a', d: '#e0a04a' },
  skeleton:  { label: 'İskelet Kedi',      kind: 'skeleton',  a: '#24212a', b: '#100e15', t: '#e7e1cf', d: '#9b9482' },
  toga:      { label: 'Toga',              kind: 'toga',      a: '#f2eee4', b: '#d9d2c2', t: '#faf7ef', d: '#c9a85c', thin: true },
  labcoat:   { label: 'Laboratuvar',       kind: 'lab',       a: '#f4f5f7', b: '#dde0e6', t: '#ffffff', d: '#4a6f9c', thin: true },
  varsity:   { label: 'Kolej Ceketi',      kind: 'varsity',   a: '#eee6d2', b: '#d6c9a9', t: '#f8f3e6', d: '#a8343c' },
  dress:     { label: 'Fırfırlı Elbise',   kind: 'dress',     a: '#e884a8', b: '#c85c83', t: '#ffe3ef', d: '#ffd0e2', thin: true },
  noelKazak: { label: 'Noel Kazağı',       kind: 'noelKazak', a: '#b93a44', b: '#8d222c', t: '#f6efe4', d: '#f4e9d8' }
};
const OLD_BREED_COLORS = {
  tekir: ['#d99a5b', '#fff4e6', '#8cc65a', '#a8672e', '#4b3a30'],
  sarman: ['#f0a24a', '#fff1dc', '#e8b84a', '#c97728', '#6d4a30'],
  british: ['#9aa6b8', '#f2f5f9', '#f0b34f', '#7a8394', '#4f5866'],
  siyam: ['#f4e7d3', '#fffaf1', '#5fb7f2', '#5b4637', '#3f3027'],
  van: ['#ffffff', '#ffffff', '#7fc8c4', '#e8a05f', '#b87435'],
  calico: ['#fff8ef', '#ffffff', '#b9d45a', '#eaa45c', '#4b3a30'],
  bombay: ['#1c191f', '#2b272f', '#f2b543', '#0e0c11', '#4b4552'],
  rus: ['#8c9aa8', '#dbe4ea', '#6fcf7f', '#6f7d8b', '#4d5966'],
  bengal: ['#d9a15f', '#fff2dc', '#8cc65a', '#6a3f1a', '#3c240e'],
  tuxedo: ['#25232a', '#faf7f0', '#e8b84a', '#131217', '#5a5562'],
  angora: ['#fffdf7', '#ffffff', '#77c8e8', '#f0e6d6', '#d8c9b6'],
  persian: ['#e8d6c0', '#fff6e8', '#8cc65a', '#cfb28f', '#9c7d5c']
};
const SOUND_OPTIONS = [
  { id: 'chime', label: 'Çam' },
  { id: 'meow', label: 'Miyav' },
  { id: 'drop', label: 'Su damlası' },
  { id: 'breath', label: 'Nefes' },
  { id: 'none', label: 'Sessiz' }
];
const FUR_SWATCHES = ['#ffffff', '#f4e7d3', '#e8d6c0', '#d99a5b', '#f0a24a', '#d9a15f', '#c98a52', '#9aa6b8', '#8c9aa8', '#25232a', '#1c191f', '#6f5847'];
const BELLY_SWATCHES = ['#ffffff', '#fff6e9', '#fffdf8', '#ffe9d2', '#f4e4cf', '#e9eef5', '#ffdfe8'];
const EYE_SWATCHES = ['#8cc65a', '#63b7ff', '#e8b84a', '#7fc8c4', '#f2b543', '#c78cff', '#ff94b8'];
const COLLAR_SWATCHES = ['#ff5f9e', '#ff6b6b', '#a87bff', '#4da3ff', '#43b98b', '#f5b942', '#3a3340'];
const BOOK_LINES = [
  'bir sayfa daha…',
  '“patilerimi ısıtan güneş…”',
  'mrrp. güzel bir cümle.',
  'sayfa 42: mırnav teorisi.',
  '“ve kedi usulca uyudu…”',
  'bu paragraf çok sıcak.',
  'miyav! altını çizdim.',
  '“sessizlik de bir ses.”',
  'bir çay kaşığı huzur…',
  'mrrp… bu bölüm güzeldi.',
  'kulaklarımı dikleştiren bir cümle.',
  '“pati izleri asla yalan söylemez.”',
  'sayfayı çeviriyorum…',
  'miyav. bunu ezberleyeceğim.'
];
const BOOK_LINES_EN = [
  'just one more page…',
  '“the sun warming my paws…”',
  'mrrp. what a lovely sentence.',
  'page 42: the theory of purring.',
  '“and the cat softly fell asleep…”',
  'this paragraph feels so warm.',
  'meow! I underlined it.',
  '“silence is a sound too.”',
  'a teaspoon of calm…',
  'mrrp… that chapter was good.',
  'a line that made my ears perk up.',
  '“paw prints never lie.”',
  'turning the page…',
  'meow. I’ll memorize this one.'
];
const BOOK_LINES_NOEL = [
  '“kar usulca yağarken…”',
  'sayfa 12: sıcak çikolata tarifi.',
  '“ve kedi şöminenin yanında uyudu…”',
  'mrrp. bu bölüm içimi ısıttı.',
  '“kar taneleri gibi küçük adımlar…”',
  'bir tutam tarçın, bir tutam sabır.',
  'miyav! altını çizdim.',
  '“kış geceleri uzun, dostluk sıcak.”',
  'sayfayı çeviriyorum…',
  'prr… bu masal güzel bitiyor.'
];
const BOOK_LINES_NOEL_EN = [
  '“as the snow falls softly…”',
  'page 12: a hot cocoa recipe.',
  '“and the cat slept by the fireplace…”',
  'mrrp. this chapter warmed me up.',
  '“small steps, like snowflakes…”',
  'a pinch of cinnamon, a pinch of patience.',
  'meow! I underlined it.',
  '“winter nights are long, friendship is warm.”',
  'turning the page…',
  'prr… this tale ends well.'
];
const BOOK_LINES_HALLOWEEN = [
  '“ay kanarken gölgeler adını fısıldıyor…”',
  'sayfa XIII: kazanın altındaki gölge.',
  '“ve kedi ölülerin fısıltısını duydu…”',
  'mrrp… bu satır tüylerimi diken diken etti.',
  '“mezarlıkta bir adım sesi, sonra bir tane daha…”',
  'bir tutam ölü gece, bir tutam cesaret.',
  'miyav! bu cümle beni ürküttü.',
  '“gölge senden önce oradaydı.”',
  'sayfa kendi kendine çevriliyor…',
  'prr… bu büyü hâlâ sürüyor.',
  '“mum söndü ama gözler açık.”',
  'hırr… bu bölümü yüksek sesle okumayacağım.'
];
const BOOK_LINES_HALLOWEEN_EN = [
  '“when the moon bleeds, the shadows whisper your name…”',
  'page XIII: the shadow beneath the cauldron.',
  '“and the cat heard the whispers of the dead…”',
  'mrrp… this line raised every fur on my back.',
  '“a footstep in the graveyard, then another…”',
  'a pinch of dead night, a pinch of courage.',
  'meow! this sentence frightened me.',
  '“the shadow was there before you.”',
  'the page turns by itself…',
  'prr… the spell is still going.',
  '“the candle went out, but the eyes stayed open.”',
  'hiss… I will not read this chapter out loud.'
];
const BOOK_WORLDS = {
  classic: {
    tr: { kicker: 'pati masalları', title: 'Sıcak Sayfalar', chapter: 'sayfa 42', left: '“Güneş patilerimi ısıtırken...”', right: 'mırnav teorisi üzerine kısa bir not.' },
    en: { kicker: 'paw tales', title: 'Warm Pages', chapter: 'page 42', left: '“As the sun warms my paws...”', right: 'a short note on the theory of purring.' }
  },
  noel: {
    tr: { kicker: 'kış defteri', title: 'Kış Masalları', chapter: 'bölüm 12', left: '“Kar usulca yağarken...”', right: 'sıcak çikolata ve sabır tarifi.' },
    en: { kicker: 'winter journal', title: 'Winter Tales', chapter: 'chapter 12', left: '“As the snow falls softly...”', right: 'a recipe for hot cocoa and patience.' }
  },
  halloween: {
    tr: { kicker: 'yasak bölüm', title: 'Nekronomikon', chapter: 'bölüm XIII', left: '“Ay kanarken gölgeler adını fısıldıyor...”', right: 'ölülerin diliyle yazılmış bir dua.' },
    en: { kicker: 'forbidden chapter', title: 'Necronomicon', chapter: 'chapter XIII', left: '“When the moon bleeds, the shadows whisper your name...”', right: 'a prayer written in the tongue of the dead.' }
  }
};
function bookWorldKey() {
  return S.theme === 'noel' || S.theme === 'halloween' ? S.theme : 'classic';
}
function bookWorld() {
  return BOOK_WORLDS[bookWorldKey()][S.lang === 'en' ? 'en' : 'tr'];
}
function bookLines() {
  const key = bookWorldKey();
  const en = S.lang === 'en';
  if (key === 'noel') return en ? BOOK_LINES_NOEL_EN : BOOK_LINES_NOEL;
  if (key === 'halloween') return en ? BOOK_LINES_HALLOWEEN_EN : BOOK_LINES_HALLOWEEN;
  return en ? BOOK_LINES_EN : BOOK_LINES;
}
function bookMeows() {
  const en = S.lang === 'en';
  if (bookWorldKey() === 'halloween') return en ? ['mrrp…', 'meow?', 'prr!', 'hiss…'] : ['mrrp…', 'miyav?', 'prr!', 'hırr…'];
  return en ? ['meow.', 'mrrp…', 'prr!', 'meow?', 'mrr.'] : ['miyav.', 'mrrp…', 'prr!', 'miyav?', 'mırnav.'];
}
function readingBubbleTitle() {
  return S.cat.name + ' · ' + bookWorld().title;
}
function updateBookIdentity() {
  const key = bookWorldKey();
  const world = bookWorld();
  $$('.book').forEach((book) => {
    book.dataset.book = key;
    const left = $('.book-page.left', book);
    const right = $('.book-page.right', book);
    const set = (el, sel, val) => {
      const node = el && $(sel, el);
      if (node && node.textContent !== val) node.textContent = val;
    };
    set(left, '.book-kicker', world.kicker);
    set(left, '.book-title', world.title);
    set(left, '.book-copy', world.left);
    set(right, '.book-kicker', world.chapter);
    set(right, '.book-copy', world.right);
  });
}
const DEFAULTS = () => ({
  v: 4,
  theme: 'noel',
  mode: 'dark',
  lang: 'tr',
  motion: 'high',
  particles: true,
  reflections: true,
  haptic: true,
  perf: null,
  cat: {
    name: 'Vespır', gender: 'kiz', breed: 'tekir', scale: 1,
    fur: '#a59482', belly: '#f3ebe0', eyes: '#9cc45c', patch: '#6f6153', patch2: '#423a33',
    collarOn: true, collar: '#ff5f9e', accessories: ['bell'], outfit: 'none'
  },
  focusMin: 25,
  breakMin: 5,
  sessionName: 'Derin Odak',
  autoStart: false,
  autoFocus: false,
  dailyGoal: 120,
  catRhythm: 'normal',
  hourlyChime: true,
  notify: false,
  catMessages: true,
  lastMsgAt: 0,
  volume: 0.7,
  chimeVolume: 0.35,
  startSound: 'chime',
  endSound: 'meow',
  welcomed: false,
  stats: { day: todayKey(), sec: 0, sessions: 0, hourMark: 0 },
  streak: { count: 0, last: '' },
  timer: null
});
function loadSettings() {
  const base = DEFAULTS();
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem('vespir.v1') || '{}') || {}; } catch (e) { saved = {}; }
  const wasOld = !saved.v || Number(saved.v) < 2;
  const s = Object.assign({}, base, saved);
  s.cat = Object.assign({}, base.cat, saved.cat || {});
  s.stats = Object.assign({}, base.stats, saved.stats || {});
  if (!THEMES[s.theme]) s.theme = base.theme;
  if (!['light', 'dark', 'auto'].includes(s.mode)) s.mode = base.mode;
  /* v3: uygulama karanlık Noel temasıyla açılır. Bu kural yalnızca bir kez
     uygulanır; kullanıcı sonradan temasını/modunu değiştirirse tercihi korunur. */
  if (!saved.v || Number(saved.v) < 4) {
    s.theme = base.theme;
    s.mode = base.mode;
  }
  if (!['tr', 'en'].includes(s.lang)) s.lang = base.lang;
  s.motion = 'high';
  s.particles = true;
  s.reflections = true;
  s.haptic = s.haptic !== false;
  if (s.perf !== true && s.perf !== false) s.perf = null;
  if (s.cat.gender === 'notr' || !GENDERS[s.cat.gender]) s.cat.gender = 'kiz';
  if (!BREEDS[s.cat.breed]) s.cat.breed = 'tekir';
  if (!OUTFITS[s.cat.outfit]) s.cat.outfit = 'none';
  const savedCat = saved.cat || {};
  if (Array.isArray(savedCat.accessories)) {
    s.cat.accessories = Array.from(new Set(savedCat.accessories.filter((k) => k !== 'none' && ACCESSORIES[k])));
  } else if (typeof savedCat.accessory === 'string') {
    s.cat.accessories = savedCat.accessory !== 'none' && ACCESSORIES[savedCat.accessory] ? [savedCat.accessory] : [];
  } else if (!Array.isArray(s.cat.accessories)) {
    s.cat.accessories = ['bell'];
  }
  delete s.cat.accessory;
  const oldPalette = OLD_BREED_COLORS[s.cat.breed];
  if (oldPalette && ['fur', 'belly', 'eyes', 'patch', 'patch2'].every((k, i) => String(s.cat[k]).toLowerCase() === oldPalette[i])) {
    const fresh = BREEDS[s.cat.breed];
    s.cat.fur = fresh.fur;
    s.cat.belly = fresh.belly;
    s.cat.eyes = fresh.eyes;
    s.cat.patch = fresh.patch;
    s.cat.patch2 = fresh.patch2;
  }
  if (!['calm', 'normal', 'curious'].includes(s.catRhythm)) s.catRhythm = 'normal';
  delete s.catSide;
  delete s.persistSounds;
  s.autoStart = !!s.autoStart;
  s.autoFocus = !!s.autoFocus;
  s.catMessages = s.catMessages !== false;
  delete s.weather;
  s.lastMsgAt = Math.max(0, Number(s.lastMsgAt) || 0);
  s.dailyGoal = clamp(Math.round(Number(s.dailyGoal) || 120), 15, 720);
  s.focusMin = clamp(Math.round(Number(s.focusMin) || 25), 1, 240);
  s.breakMin = clamp(Math.round(Number(s.breakMin) || 5), 1, 30);
  s.volume = clamp(Number(s.volume), 0, 1);
  if (!Number.isFinite(s.volume)) s.volume = 0.7;
  s.chimeVolume = clamp(Number(s.chimeVolume), 0, 1);
  if (!Number.isFinite(s.chimeVolume)) s.chimeVolume = 0.35;
  delete s.cat.size;
  s.cat.scale = clamp(Number(s.cat.scale) || 1, 0.8, 1.2);
  if (wasOld) {
    const b = BREEDS[s.cat.breed];
    s.cat.fur = b.fur;
    s.cat.belly = b.belly;
    s.cat.eyes = b.eyes;
    s.cat.patch = b.patch;
    s.cat.patch2 = b.patch2;
  }
  ['fur', 'belly', 'eyes', 'patch', 'patch2', 'collar'].forEach((k) => {
    if (!/^#[0-9a-f]{6}$/i.test(s.cat[k] || '')) s.cat[k] = base.cat[k];
  });
  s.v = 4;
  s.stats.sec = Number.isFinite(Number(s.stats.sec)) ? Math.max(0, Number(s.stats.sec)) : 0;
  s.stats.sessions = Number.isFinite(Number(s.stats.sessions)) ? Math.max(0, Math.round(Number(s.stats.sessions))) : 0;
  s.stats.hourMark = Number.isFinite(Number(s.stats.hourMark)) ? Math.max(0, Math.floor(Number(s.stats.hourMark))) : 0;
  const streak = s.streak && typeof s.streak === 'object' ? s.streak : {};
  s.streak = { count: Math.max(0, Math.min(100000, Number(streak.count) || 0)),
    last: /^\d{4}-\d{2}-\d{2}$/.test(streak.last || '') ? streak.last : '' };
  s.completedSessions = Array.isArray(s.completedSessions)
    ? s.completedSessions.filter((id) => typeof id === 'string' && id.length <= 160).slice(-64) : [];
  if (s.stats.day !== todayKey()) {
    s.stats = { day: todayKey(), sec: 0, sessions: 0, hourMark: 0 };
  }
  if (typeof s.sessionName === 'string') {
    s.sessionName = s.sessionName.trim().slice(0, 28) || 'Derin Odak';
  } else s.sessionName = 'Derin Odak';
  if (!s.cat.name || typeof s.cat.name !== 'string') s.cat.name = 'Vespır';
  s.cat.name = s.cat.name.trim().slice(0, 16) || 'Vespır';
  return s;
}
let S = loadSettings();
/* ============================================================
   DİL — Türkçe varsayılan, İngilizce isteğe bağlı
   Statik metinler sözlükten, canlı metinler t() üzerinden çevrilir.
   ============================================================ */
const EN = {
  /* üst bar ve ana ekran */
  'en iyi dostun': 'your best friend',
  'Vespır ayarlarını aç': 'Open Vespır settings',
  'Aydınlık ve karanlık mod arasında geçiş yap': 'Switch between light and dark mode',
  'Tema seç': 'Choose a theme',
  'Ses ayarlarını aç': 'Open sound settings',
  'Ayarları aç': 'Open settings',
  'Vespır odak zamanlayıcısı': 'Vespır focus timer',
  'Seans ritmi': 'Session rhythm',
  'Seans adı': 'Session name',
  'Odak ve mola süreleri': 'Focus and break lengths',
  'Odak süresini azalt': 'Decrease focus time',
  'Odak süresini artır': 'Increase focus time',
  'Mola süresini azalt': 'Decrease break time',
  'Mola süresini artır': 'Increase break time',
  'Odak': 'Focus',
  'Mola': 'Break',
  'dk': 'min',
  'Vespır başlamaya hazır': 'Vespır is ready to start',
  'Zamanlayıcıyı sıfırla': 'Reset the timer',
  'Sıfırla': 'Reset',
  'Başla': 'Start',
  'Duraklat': 'Pause',
  'Devam et': 'Resume',
  'Molaya başla': 'Start break',
  'Molayı atla': 'Skip the break',
  'Bugünün özeti': "Today's summary",
  'dk odak': 'min focus',
  'seans': 'sessions',
  'tur': 'cycles',
  'Boşluk': 'Space',
  'başlat / duraklat': 'start / pause',
  'Kısa bir mola, sonra yeni odak.': 'A short break, then a fresh focus.',
  'Vespır, senin odak arkadaşın': 'Vespır, your focus companion',
  'uyuyor · odakta': 'sleeping · focusing',
  'Tekir · meraklı': 'Tabby · curious',
  'odak tamam': 'focus complete',
  'mola tamam': 'break complete',
  'Harikasın!': "You're amazing!",
  'Vespır seninle gurur duyuyor.': 'Vespır is proud of you.',
  'Vespır’ı uygulama olarak ekleyelim mi?': 'Add Vespır as an app?',
  'Vespır’ı telefonunun ana ekranına veya bilgisayarının uygulamalarına ekleyebilirsin. Böylece siteyi her seferinde aramadan açarsın.': 'Add Vespır to your phone’s home screen or your computer’s apps. Then you can open it without searching for the site every time.',
  'Vespır simgesine bas, hemen aç.': 'Tap the Vespır icon and it opens right away.',
  'Sekmeler ve adres çubuğu olmadan odaklan.': 'Focus without tabs and an address bar.',
  'Destekleyen cihazlarda, izin verirsen odak bitince bildirim al.': 'On supported devices, get a notification when focus ends if you allow it.',
  'Tamam, yapalım': "Yes, let's do it",
  'Hayır, şimdi değil': 'Not now',
  '“Tamam, yapalım” ile kurulum seçeneklerini gör. “Hayır, şimdi değil” ile kurmadan odaklan.': 'Choose “Yes, let’s do it” to see install options. Choose “Not now” to focus without installing.',
  'Kapat': 'Close',
  'miyav · hoş geldin': 'meow · welcome',
  'Ben': 'I’m',
  'Sen odaklanırken ben uyurum. Arada uyanıp kitap okur, miyavlarım. Hazırsan patileri ısıtalım.': 'I sleep while you focus. Now and then I wake up, read a book and meow. If you’re ready, let’s warm up our paws.',
  'Birlikte başlayalım': 'Let’s start together',
  'Önce beni tasarla': 'Customize me first',
  'Adımı, tüyümü, tasmamı ve cinsimi birlikte seçebiliriz. İlk selam, bir daha göstermem.': 'We can choose my name, fur, collar and breed together. First greeting only, I won’t show it again.',
  'Vespır’ı kurulum seçenekleriyle cebine al.': 'Put Vespır in your pocket with the install options.',
  /* ayarlar */
  "Vespır'ı şekillendir": 'Shape Vespır',
  'Ayarlar': 'Settings',
  'Odak ayarların bu tarayıcıda saklanır. Hesap verileri gizlilik sayfasında açıklanır.': 'Your focus settings are stored in this browser. Account data is explained on the privacy page.',
  'Ayar bölümleri': 'Settings sections',
  'Hesap': 'Account',
  'Google ile giriş': 'Sign in with Google',
  'Kedi': 'Cat',
  'Görünüm': 'Appearance',
  'Zaman': 'Time',
  'Ses': 'Sound',
  'Hakkımızda': 'About',
  'Sürpriz görünüm': 'Surprise look',
  'Adı': 'Name',
  'tasmada da görünür': 'also shown on the collar',
  'Cinsiyet': 'Gender',
  'Dişi': 'Female',
  'Erkek': 'Male',
  'Boyut': 'Size',
  'sahnede kapladığı alan': 'space on stage',
  'Kedi boyu': 'Cat size',
  'Kedi boyu yüzdesi': 'Cat size percentage',
  'Cinsi': 'Breed',
  'Tekir, Sarman, Üç Renkli ve Smokin birer tüy desenidir; diğerleri kedi ırkıdır. Her görünüm, ırkın gerçek tüy ve göz rengine göre hazırlandı.': 'Tabby, Orange, Calico and Tuxedo are coat patterns; the others are breeds. Every look is based on the breed’s real fur and eye colors.',
  'Tüy rengi': 'Fur color',
  'Göbek ve patiler': 'Belly & paws',
  'Göz rengi': 'Eye color',
  'Tasma': 'Collar',
  'Tasma takılı': 'Collar on',
  'İsmini ve zilini taşısın.': 'Let her carry her name and bell.',
  'Kıyafet': 'Outfit',
  'dolabından bir parça': 'a piece from the wardrobe',
  'Tek seferde bir kıyafet giyer; aksesuarlarla birlikte takılabilir. Kıyafet seçimi de bu tarayıcıda saklanır.': 'She wears one outfit at a time; accessories can be added too. Her outfit choice is also saved in this browser.',
  'Aksesuarlar': 'Accessories',
  'birden fazla seçebilirsin': 'pick more than one',
  'Noel şapkası, geyik boynuzu, cadı şapkası ve balkabağı burada her zaman seçilebilir. Tema değişse de kıyafet ve aksesuarların korunur.': 'The Santa hat, reindeer antlers, witch hat and pumpkin are always available here. Your outfit and accessories stay the same when the theme changes.',
  'Uygulama': 'App',
  "Vespır'ı cebine al": 'put Vespır in your pocket',
  "Vespır'ı cebine koy": 'Put Vespır in your pocket',
  'Ana ekrana ekle': 'Add to home screen',
  'Kurulu': 'Installed',
  'Dil': 'Language',
  'Aydınlık / karanlık': 'Light / dark',
  'Özel renk seç': 'Choose a custom color',
  'Renk': 'Color',
  'Uygulama dili': 'App language',
  'Dil değişince arayüz ve bildirimler aynı dili konuşur.': 'When you change the language, the interface and notifications speak the same language.',
  'veya üstteki güneşe dokun': 'or tap the sun above',
  'Temalar': 'Themes',
  'her biri ayrı bir dünya': 'each a different world',
  "Tema değişince Vespır'ın dünyası yumuşak bir ışık dalgasıyla yenilenir. Kedi renkleri ayrı kalır.": 'When the theme changes, Vespır’s world refreshes with a soft wave of light. Cat colors stay the same.',
  'Kısayollar': 'Shortcuts',
  'hızlı kontrol': 'quick control',
  'Başlat / duraklat': 'Start / pause',
  'Paneli kapat': 'Close panel',
  'Bittiğinde titret': 'Vibrate when done',
  'Telefon sessizdeyken patiyle haber versin.': 'Let a paw tap tell you when your phone is silent.',
  'Günlük hedef': 'Daily goal',
  'kendine nazik bir hedef': 'a gentle goal for yourself',
  'tamamlandı': 'complete',
  'kaldı': 'left',
  'Hedef tamam!': 'Goal complete!',
  '1 saat': '1 hour',
  '2 saat': '2 hours',
  '3 saat': '3 hours',
  '4 saat': '4 hours',
  '6 saat': '6 hours',
  '8 saat': '8 hours',
  '10 saat': '10 hours',
  'Akış': 'Flow',
  'kendi ritmini kur': 'set your own rhythm',
  'Molayı otomatik başlat': 'Auto-start breaks',
  'Odak bitince mola kendi kendine başlar.': 'When focus ends, the break starts by itself.',
  'Yeni odağı otomatik başlat': 'Auto-start the next focus',
  'Mola bitince sıradaki odak hemen başlar.': 'When the break ends, the next focus starts right away.',
  'Saatlik kısa zil': 'Soft hourly chime',
  'Odak sürerken her 60 dakikada minik bir çan.': 'A tiny bell every 60 minutes while focus runs.',
  'Bildirimler': 'Notifications',
  'başka sekmedeyken de haber ver': 'get notified in other tabs',
  'Bildirim gönder': 'Send notifications',
  'Odak veya mola bitince cihazına haber gelsin.': 'Get a notification on your device when focus or a break ends.',
  'Durum kontrol ediliyor…': 'Checking status…',
  'Test bildirimi gönder': 'Send a test notification',
  "Vespır'dan mesajlar": 'Messages from Vespır',
  'ara sıra tatlı bir not': 'a sweet note now and then',
  'Vespır mesaj göndersin': 'Let Vespır send messages',
  '“Bugün ne yapıyorsun, çalışalım mı?” gibi notlar yazar. Sen uzaktayken seni özlediğini bildirimle söyler.': 'She writes notes like “What are you doing today? Shall we work?” When you’re away, she tells you she misses you with a notification.',
  'Genel ses': 'Master volume',
  'cihaz sesinin üzerine eklenir': 'added on top of device volume',
  'Ses düzeyi': 'Volume level',
  'Başlangıç sesi': 'Start sound',
  'Odak başlarken': 'When focus starts',
  'Dinle': 'Preview',
  'Kendi sesin · seçilmedi': 'Your sound · none selected',
  'Dosya': 'File',
  'Seans biterken': 'When the session ends',
  'Saatlik zil sesi': 'Hourly chime sound',
  'Odak sürdükçe her saatte bir çalar.': 'Plays once every hour while focus continues.',
  'Zil sesi': 'Chime volume',
  "Vespır'ı miyavlat": 'Make Vespır meow',
  'Saatlik zili dinle': 'Preview the hourly chime',
  'Özel sesler cihazda sıkıştırılarak saklanır: en fazla 30 saniye, birkaç yüz kilobayt. Cihazından ayrılmaz.': 'Custom sounds are compressed and stored on your device: at most 30 seconds, a few hundred kilobytes. They never leave your device.',
  'Sesler tarayıcında üretilir; hiçbir müzik indirilmez. Kendi ses dosyanı seçebilirsin.': 'Sounds are generated in your browser; no music is downloaded. You can choose your own sound file.',
  "Vespır'ın hikâyesi ve sözleşmeler": 'Vespır’s story and policies',
  'Vespır Nedir?': 'What is Vespır?',
  'Hikâyesi, karakteri ve onu hayata geçiren tek kişi': 'Her story, character and the one person who built her',
  'İletişim': 'Contact',
  'Instagram, e-posta ve geri bildirim': 'Instagram, email and feedback',
  'Gizlilik ve Güvenlik': 'Privacy & Security',
  'Yerel veriler, hesaplar ve izinler': 'Local data, accounts and permissions',
  'Odak ayarların ve istatistiklerin bu tarayıcıda saklanır. İsteğe bağlı hesap girişi Google/Firebase tarafından sağlanır; veri kullanımı ve izinler gizlilik metninde açıklanır.': 'Your focus settings and stats are stored in this browser. Optional account sign-in is provided by Google/Firebase; data use and permissions are explained in the privacy text.',
  'Her şeyi sıfırla': 'Reset everything',
  'Vespır · yerel · minik': 'Vespır · local · tiny',
  /* seçenek etiketleri */
  'Sakura': 'Sakura', 'Gece Mavisi': 'Midnight Blue', 'Orman': 'Forest', 'Gün Batımı': 'Sunset',
  'Lavanta': 'Lavender', 'Okyanus': 'Ocean', 'Şeftali': 'Peach', 'Nane': 'Mint', 'Kakao': 'Cocoa',
  'Galaksi': 'Galaxy', 'Noel': 'Christmas', 'Cadılar Bayramı': 'Halloween',
  'tatlı & kalpli': 'sweet & heartfelt', 'sakin & neon': 'calm & neon', 'doğal & yumuşak': 'natural & soft',
  'sıcak & cesur': 'warm & bold', 'rüya gibi & sakin': 'dreamy & calm', 'ferah & derin': 'airy & deep',
  'yumuşak & tatlı': 'soft & sweet', 'taze & huzurlu': 'fresh & peaceful', 'sıcak & kitap kokulu': 'warm & book-scented',
  'derin & büyülü': 'deep & magical', 'kar & sıcak ışık': 'snow & warm light', 'kanlı ay & gölgeler': 'blood moon & shadows',
  'Aydınlık': 'Light', 'Karanlık': 'Dark', 'Otomatik': 'Auto',
  'Tekir': 'Tabby', 'Sarman': 'Orange Tabby', 'Britanya Kısa Tüylü': 'British Shorthair', 'Siyam': 'Siamese',
  'Van Kedisi': 'Turkish Van', 'Üç Renkli': 'Calico', 'Bombay': 'Bombay', 'Rus Mavisi': 'Russian Blue',
  'Bengal': 'Bengal', 'Smokin': 'Tuxedo', 'Ankara Kedisi': 'Angora', 'İran Kedisi': 'Persian',
  'Zil': 'Bell', 'Fiyonk': 'Bow', 'Çiçek': 'Flower', 'Bandana': 'Bandana', 'Kravat': 'Tie', 'Taç': 'Crown',
  'Gözlük': 'Glasses', 'Kulaklık': 'Headphones', 'Atkı': 'Scarf', 'Papyon': 'Bow tie', 'Yıldız': 'Star',
  'Noel Şapkası': 'Santa hat', 'Geyik Boynuzu': 'Reindeer antlers', 'Kırmızı Burun': 'Red nose',
  'Cadı Şapkası': 'Witch hat', 'Balkabağı': 'Pumpkin', 'Yok': 'None',
  'Kıyafetsiz': 'No outfit', 'Takım Elbise': 'Suit', 'Gömlek': 'Shirt', 'Triko Kazak': 'Knit sweater',
  'Yelek': 'Vest', 'Kapüşonlu': 'Hoodie', 'Yağmurluk': 'Raincoat', 'Trençkot': 'Trench coat',
  'Denim Ceket': 'Denim jacket', 'Deri Ceket': 'Leather jacket', 'Tulum': 'Overalls', 'Önlük': 'Apron',
  'Şef Ceketi': 'Chef jacket', 'Kimono': 'Kimono', 'Büyücü Cübbesi': 'Wizard robe', 'Pelerin': 'Cloak',
  'Korsan Ceketi': 'Pirate coat', 'Astronot': 'Astronaut', 'Süper Kahraman': 'Superhero',
  'Spor Forma': 'Sports jersey', 'Tenis Polosu': 'Tennis polo', 'Hawaii Gömleği': 'Hawaiian shirt',
  'Pijama': 'Pajamas', 'Bornoz': 'Bathrobe', 'Noel Ceketi': 'Christmas coat', 'Cadı Pelerini': 'Witch cloak',
  'İskelet Kedi': 'Skeleton cat', 'Toga': 'Toga', 'Laboratuvar': 'Lab coat', 'Kolej Ceketi': 'Varsity jacket',
  'Fırfırlı Elbise': 'Ruffled dress', 'Noel Kazağı': 'Christmas sweater',
  'Çam': 'Chime', 'Miyav': 'Meow', 'Su damlası': 'Water drop', 'Nefes': 'Breath', 'Sessiz': 'Silent',
  'Özel renk seç': 'Pick a custom color', 'Renk': 'Color', 'Tasma rengi': 'Collar color',
  'meraklı': 'curious', 'uyuyor': 'sleeping', 'okuyor': 'reading', 'mutlu': 'happy',
  'selam veriyor': 'waving', 'geriniyor': 'stretching', 'tüy yumağıyla oynuyor': 'playing with yarn',
  'seni bekliyor': 'waiting for you', 'mama yiyor': 'eating', 'içiyor': 'drinking', 'yiyor': 'eating',
  'ikram topluyor': 'collecting treats', 'aksesuarsız': 'no accessories',
  'Fırtınalı': 'Stormy', 'Karlı': 'Snowy', 'Yağmurlu': 'Rainy', 'Çiseliyor': 'Drizzling',
  'Sisli': 'Foggy', 'Bulutlu': 'Cloudy', 'Açık': 'Clear',
  'odak zamanı': 'focus time',
  'odak hazır': 'focus ready',
  'nefes zamanı': 'breathing time',
  'mola hazır': 'break ready',
  /* kedi baloncukları ve anlık notlar */
  'Kafamda kar birikmiş… bir silkeleyeyim!': 'There’s snow piled on my head… let me shake it off!',
  'Bak, kardan şapkam vardı. Temizlendi!': 'Look, I had a snow hat. All clean now!',
  'Tepemdeki karı silkeleyip attım.': 'I shook the snow off my head.',
  'Kardan şapkamı silkeledim. Şimdi odaklanabiliriz.': 'I shook off my snow hat. Now we can focus.',
  'kendini temizliyor': 'is cleaning up',
  'kar tanesi yakalıyor': 'catches a snowflake',
  'not alıyor': 'is taking notes',
  'üşüyor': 'is cold',
  'bayramı kutluyor': 'is celebrating',
  'Yakaladım! Bu kar tanesi sana şans getirsin.': 'Got it! May this snowflake bring you luck.',
  'Bir tane daha… hop! Neredeyse kaçıyordu.': 'One more… hop! It almost got away.',
  'Buz gibi! Ama yakalamayı başardım.': 'Ice cold! But I caught it.',
  'Sana bir kar tanesi sakladım, avucumda eridi.': 'I saved you a snowflake, but it melted in my paw.',
  'Kaçtı… Bir dahaki sefere yakalayacağım.': 'It got away… I’ll catch the next one.',
  'Derin bir nefes al, ben buradayım.': 'Take a deep breath, I’m right here.',
  'Tek bir küçük adımla başlayalım. Ben yanındayım.': 'Let’s start with one small step. I’m beside you.',
  'Şimdi sadece bu ana odaklan. Gerisi biraz bekleyebilir.': 'Just focus on this moment. The rest can wait a little.',
  'Omuzlarını gevşet, nefesini bırak. Birlikte başlayalım.': 'Relax your shoulders, let out your breath. Let’s begin together.',
  'bunu not alacağım.': 'I’ll note this down.',
  'bunu not aldım.': 'I noted it down.',
  'miyav! altını çizdim.': 'meow! I underlined it.',
  'sayfa kenarına yazdım.': 'I wrote it in the margin.',
  'bu bölüm güzeldi.': 'that chapter was lovely.',
  'prr… kitap kokusu.': 'prr… the smell of books.',
  'bir sayfa daha.': 'one more page.',
  'miyav!': 'meow!',
  'mrrp… seni gördüm.': 'mrrp… I see you.',
  'pat pat!': 'pat pat!',
  'prr. kulağımın arkası lütfen.': 'prr. behind my ears, please.',
  'miyav? oyun mu?': 'meow? are we playing?',
  'mrrp? uyuyordum…': 'mrrp? I was sleeping…',
  'pat pat… sen de çalış.': 'pat pat… you work too.',
  'miyav! buradayım.': 'meow! I’m here.',
  'mrrr. güzel odak.': 'mrrr. good focus.',
  'mola mı? patiler hazır.': 'a break? paws are ready.',
  'mrrp… devam edince uyurum.': 'mrrp… I’ll sleep when you continue.',
  'kısa bir nefes. iyi geldi.': 'a short breath. that felt good.',
  'temiz bir sayfa. miyav!': 'a clean page. meow!',
  'hazırım. yeniden başlayalım.': 'I’m ready. Let’s begin again.',
  'prr… patiler taze.': 'prr… fresh paws.',
  'miyav! yeni odak?': 'meow! a new focus?',
  'mola bitti sayılır. hazırım.': 'the break is basically over. I’m ready.',
  'prr… yeniden çalışalım.': 'prr… let’s work again.',
  'miyav! harikaydın.': 'meow! you were amazing.',
  'prr… gurur duyuyorum.': 'prr… I’m proud.',
  'mola! patilerim uyuştu.': 'break! my paws went numb.',
  'miyav! yeni odağa hazırım.': 'meow! ready for the next focus.',
  'prr… taze patiler.': 'prr… fresh paws.',
  'hazırım. başlayalım mı?': 'I’m ready. Shall we start?',
  'bu bana çok yakıştı.': 'this suits me so well.',
  'miyav! yeni kıyafet.': 'meow! new outfit.',
  'prr… aynaya bakmalıyım.': 'prr… I should check the mirror.',
  'tüylerim daha rahat.': 'my fur feels comfier.',
  'kar yağdı! şapkamı taktım.': 'it’s snowing! I put on my hat.',
  'tepede kar birikti, birazdan silkerim.': 'snow is piling up on my head; I’ll shake it off soon.',
  'beyaz bir dünya. hadi odaklanalım.': 'a white world. let’s focus.',
  'bu dünya güzelmiş.': 'this world is lovely.',
  'miyav! renkler değişti.': 'meow! the colors changed.',
  'prr… yeni bir köşe.': 'prr… a new corner.',
  'Kar yağdı!': 'It’s snowing!',
  'kaldığımız yerden devam. miyav.': 'continuing where we left off. meow.',
  'bunu senin için sakladım.': 'I saved this for you.',
  'Üşüyorum… daha kalın bir şey giydirir misin?': 'I’m cold… could you put something warmer on me?',
  /* kutlama ve bildirim başlıkları */
  'odak tamam': 'focus complete',
  'mola tamam': 'break complete',
  'Harikasın!': 'You’re amazing!',
  'Muhteşem odak!': 'Magnificent focus!',
  'Patiler havada!': 'Paws in the air!',
  'Nefes aldın!': 'You breathed!',
  'Yeni tura hazırız.': 'Ready for a new round.',
  /* kısa bildirimler */
  'Tarayıcı hafızası dolu; ayarların bir kısmı saklanamıyor.': 'Browser storage is full; some of your settings cannot be saved.',
  'Bu tarayıcı bildirimleri desteklemiyor.': 'This browser doesn’t support notifications.',
  'Bildirimler için sayfayı http(s) üzerinden açmalısın.': 'Open the page over http(s) to use notifications.',
  'Bildirim izni kapalı. Tarayıcı ayarlarından açabilirsin.': 'Notification permission is off. You can enable it in your browser settings.',
  'Bildirim izni alınamadı. Zil ve kedi baloncukları çalışmaya devam eder.': 'Notification permission could not be granted. The chime and cat bubbles keep working.',
  'Test bildirimi gönderildi.': 'Test notification sent.',
  'Bildirim gösterilemedi. Tarayıcı iznini kontrol et.': 'The notification could not be shown. Check the browser permission.',
  'Konum izni verilmedi. Vespır hava mesajları olmadan konuşmaya devam eder.': 'Location permission was not granted. Vespır will keep chatting without weather messages.',
  'Bu bir ses dosyası gibi görünmüyor.': 'This doesn’t look like an audio file.',
  'Ses dosyası en fazla 2 MB olabilir. Kısaltıp tekrar dene.': 'Audio files can be at most 2 MB. Trim it and try again.',
  'Bu ses dosyası çalınamadı. Başka bir dosya dene.': 'This audio file could not be played. Try another file.',
  'Ses yüklenemedi. Tarayıcı bu biçimi desteklemiyor olabilir.': 'The sound could not be loaded. Your browser may not support this format.',
  'Cihazda yeterli boş alan yok; ses bu oturumda çalınacak, diske yazılmadı.': 'Not enough free space on the device; the sound will play this session but was not written to disk.',
  'Ses diske yazılamadı. Bu oturumda çalınacak.': 'The sound could not be written to disk. It will play this session.',
  'Özel ses ve cihazdaki kopyası silindi.': 'The custom sound and its device copy were deleted.',
  'Özel ses kaldırıldı; cihazdaki kopyası temizlenemedi.': 'The custom sound was removed; its device copy could not be cleaned up.',
  'Mola atlandı. Yeni odak hazır.': 'Break skipped. A new focus is ready.',
  'Vespır zaten kurulu.': 'Vespır is already installed.',
  'Vespır kuruluyor. Patiler hazır!': 'Installing Vespır. Paws ready!',
  'Vespır artık uygulama olarak kurulu.': 'Vespır is now installed as an app.',
  'Yeni bir Vespır doğdu.': 'A new Vespır was born.',
  'Kaldığın yerden devam ediyoruz.': 'Picking up where you left off.',
  'Başlangıç sesin hazır.': 'Your start sound is ready.',
  'Bitiş sesin hazır.': 'Your end sound is ready.',
  'Şimdi başlıyoruz.': 'Starting now.',
  'Bildirimler açık.': 'Notifications are on.',
  'Bildirimler kapalı.': 'Notifications are off.',
  'Dosyadan açıldığı için bildirim izni verilemedi. Zil ve kedi baloncukları çalışmaya devam eder.': 'Notification permission could not be granted because the page is open from a file. The chime and cat bubbles keep working.',
  'Bildirim izni verilmedi. Tarayıcı ayarlarından izin verebilirsin.': 'Notification permission was not granted. You can allow it in your browser settings.',
  /* hakkında, iletişim, hesap ve gizlilik başlıkları */
  "Vespır'ın hikâyesi": 'Vespır’s story',
  "VESPIR'IN ARKASINDA KİM VAR?": 'WHO IS BEHIND VESPIR?',
  'Patileri birleştirelim': 'Let’s join paws',
  'Sayfaya git': 'Visit page',
  'Kopyala': 'Copy',
  'E-posta': 'Email',
  'Resmi sosyal medya': 'Official social media',
  'mırnav': 'mrrp',
  '· odak arkadaşın': '· your focus friend',
  'Dilek ve öneriler': 'Wishes & suggestions',
  'Hata bildirimi': 'Bug report',
  'Partnerlik': 'Partnership',
  'Basın ve medya': 'Press & media',
  'Tek kişilik bir ekip, her mesajı okuyor.': 'A one-person team reads every message.',
  'Vespır hesabı': 'Vespır account',
  'Giriş': 'Sign in',
  'Hesabın': 'Your account',
  'Hoş geldin': 'Welcome',
  'Çıkış Yap': 'Sign out',
  'Google ile devam et': 'Continue with Google',
  'Google açılıyor…': 'Opening Google…',
  'Giriş servisi henüz hazır değil. Birkaç saniye sonra tekrar dene.': 'The sign-in service isn’t ready yet. Try again in a few seconds.',
  'Açılan pencereden Google hesabını seç.': 'Choose your Google account in the window that opens.',
  'Google hesabınla giriş yaptın. Hoş geldin!': 'You signed in with your Google account. Welcome!',
  'Çıkış yapıldı.': 'Signed out.',
  'Verilerin, hesabın ve tercihlerin': 'Your data, account and choices',
  'Vespır Nedir sayfasını kapat': 'Close the What is Vespır page',
  'İletişim sayfasını kapat': 'Close the contact page',
  'Hesap sayfasını kapat': 'Close the account page',
  'Gizlilik ve Güvenlik sayfasını kapat': 'Close the Privacy & Security page',
  'Yeni sekmede aç': 'Open in a new tab',
  'E-posta adresini panoya kopyala': 'Copy the email address to the clipboard',
  'Vespır Instagram sayfasını yeni sekmede aç': 'Open the Vespır Instagram page in a new tab',
  'Vespır Nedir?': 'What is Vespır?',
  'patileri birleştirelim': 'let’s join paws',
  'Düzenle': 'Edit',
  'Kaydet': 'Save',
  'Vazgeç': 'Cancel',
  'Saat': 'Hours',
  'Dakika': 'Minutes',
  /* v22: kış görseli ve yeni sürüm notları */
  /* v21: eksik kalan arayüz metinleri */
  'Yeni sürüm hazır': 'New version ready',
  'Vespır için yeni bir güncelleme yayınlandı. Devam et diyerek güncellemeyi tamamlayabilir ve yeni sürüme geçebilirsin.': 'A new update for Vespır has been released. Choose continue to finish the update and switch to the new version.',
  'Yenilikler': "What's new",
  'Performans': 'Performance',
  'tüm efektleri kapat': 'turn off all effects',
  'Performans Modu': 'Performance mode',
  'Tüm efektleri kapatır: animasyon, geçiş, cam bulanıklığı, kar/parçacık ve parıltılar durur. Sayaç, kedi ve ödül akışı aynen çalışır.': 'Turns every effect off: animations, transitions, glass blur, snow/particles and glows stop. The timer, the cat and the reward flow keep working exactly the same.',
  '25 dakika odak': '25 min focus',
  'Bugün 0 dk odak': 'Today 0 min focus',
  '/120 dk': '/120 min',
  '120 dk kaldı': '120 min left',
  '0 seans': '0 sessions',
  'Hedef: 2 sa': 'Goal: 2 hr',
  'odak arkadaşın': 'your focus friend',
  'Tekir · Dişi · Zil': 'Tabby · Female · Bell',
  'Tema': 'Theme',
  'Odaklan': 'Focus',
  'Derin Odak': 'Deep Focus',
  'Saati azalt': 'Decrease hours',
  'Saati artır': 'Increase hours',
  'Dakikayı azalt': 'Decrease minutes',
  'Dakikayı artır': 'Increase minutes',
  'Ayarları kapat': 'Close settings',
  'Ana gezinme': 'Main navigation',
  'Karanlık ve aydınlık tema arasında geçiş yap': 'Switch between light and dark mode',
  'Özel başlangıç sesini kaldır': 'Remove the custom start sound',
  'Özel bitiş sesini kaldır': 'Remove the custom end sound',
  'Giriş için internet gerekir.': 'Signing in requires internet.',
  'içiyor…': 'is drinking…',
  'ikram topluyor…': 'is collecting treats…',
  'yiyor…': 'is eating…',
  'Hedef saat': 'Goal hours',
  'Hedef dakika': 'Goal minutes'
};
function t(text) {
  if (text == null || S.lang !== 'en') return text;
  const str = String(text);
  return EN[str] || str;
}
/* DOM çevirisi: her düğümün Türkçe aslı saklanır, dil değişince geri yüklenir.
   Yalnızca tam eşleşen metinler çevrilir; kullanıcı adları ve sayılar dokunulmaz. */
const domTextOrig = new WeakMap();
const domAttrOrig = new WeakMap();
const domBlockOrig = new WeakMap();
const TR_SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE', 'TEXTAREA']);
const TR_ATTRS = ['placeholder', 'aria-label', 'title', 'alt'];
/* Hukuk/iletişim gibi uzun paragraflar: tam metnin başlangıcına göre eşlenir.
   Eşleşen paragrafın iç HTML'i saklanır, dil değişince birebir geri konur. */
const EN_BLOCKS = [
  ['Vespır, pomodoro tekniğiyle çalışan bir odak uygulaması', 'Vespır is a focus app built on the pomodoro technique, with a lovely cat companion living on top of your screen. 😺 While you work she keeps busy: she reads, takes notes and plays with a colourful yarn ball; during breaks she stretches, and after a good session she earns a treat. Now and then she writes to you: “What are you doing today? Shall we work?” Her messages change with the time of day, the weekend and, if you allow it, the weather where you are, so you’re never alone; when you’re away she tells you she misses you. You can dress up the cat, themes and sounds your way, and follow your daily goal and stats. You can install the app on your device and optionally sign in with Google; your data stays on your device. 🤩 Come on, stop putting it off; focus with Vespır!'],
  ['Vespır kolay bir yoldan gelmedi', 'Vespır didn’t come from an easy road. There was no big team behind her and no big budget; a single independent developer brought her to life. Yes, just one person. The first code had bugs; so did the second, and the third… But nobody gave up. After attempts, fixes and sleepless nights, Vespır was born. She wasn’t perfect, but she was real. Maybe that’s what matters: perfection is cold, reality is warm. Right?'],
  ['Bir fikrin, bir hatan ya da iş birliği teklifin mi var?', 'Do you have an idea, a bug report or a collaboration offer? They all reach the same door.'],
  ['Vespır\'da görmek istediğin özellikleri', 'Write the features, themes and cat ideas you’d like to see in Vespır. We read every message, one by one, and queue the most requested ones.'],
  ['Bir şey ters gittiyse cihazını', 'If something went wrong, include your device, browser and when it happened. A short screenshot speeds things up a lot.'],
  ['Marka iş birlikleri, topluluk projeleri', 'Brand collaborations, community projects and co-created content are welcome. Starting with a small idea is enough.'],
  ['Vespır\'ı yazmak, tanıtmak veya röportaj', 'If you’d like to write about Vespır, feature her or do an interview, the same address has the press kit and visuals.'],
  ['Tek kişilik bir ekip, her mesajı okuyor.', 'A one-person team reads every message.'],
  ['Google hesabınla tek dokunuşla giriş yap.', 'Sign in with one tap using your Google account. You don’t need a separate Vespır password.'],
  ['Giriş isteğe bağlıdır ve Firebase Authentication ile sağlanır.', 'Signing in is optional and handled by Firebase Authentication. Your settings and focus stats are not uploaded to your account. <b>Signing in requires internet.</b>'],
  ['Bu metin, Vespır kullanılırken', 'This text explains which data is stored on your device while using <b>Vespır</b>, how optional account sign-in works and your security choices. Local focus data and account data processed by Google/Firebase are separate.'],
  ['Hesap açmadan odaklanabilirsin.', 'You can focus without creating an account. Signing in does not back up your settings or stats to the cloud.'],
  ['Vespır, odak ve mola sürelerini yönetmeye yardımcı olan bir tarayıcı uygulamasıdır.', 'Vespır is a browser app that helps you manage focus and break times. This policy covers the app’s current features. Google, Firebase, the hosting service and external links have their own data-processing rules. You can send privacy questions through the Vespır contact channels below.'],
  ['Kişiselleştirme:', 'Personalization: Theme, appearance, motion preferences, cat name and look, sound and vibration settings are stored to remember your choices.'],
  ['Odak bilgileri:', 'Focus data: Focus/break lengths, session name, daily goal, completed sessions and focus time are used for the timer and daily stats.'],
  ['Devamlılık:', 'Continuity: The timer phase, remaining time and end time help restore the current state when the page is reopened.'],
  ['Arayüz durumu:', 'Interface state: Whether the intro has been shown and whether the app was opened as an installed PWA are stored so the same things aren’t shown twice.'],
  ['Bu ayar ve istatistikler uygulama tarafından', 'These settings and stats are not uploaded to a user account or a remote database by the app.'],
  ['Ayarlar ve sayaç bilgileri tarayıcının yerel depolamasında', 'Settings and timer information are kept in the browser’s local storage (localStorage), and your custom sounds in the local file database (IndexedDB). The sound file’s name, type and content are stored on your device so they can play at the start or end of a session; there is no feature that uploads these files to a server.'],
  ['Vespır mesajları açıksa, uygulama kapalıyken', 'If Vespır messages are on, a small preference record (cat name, message texts and last message time) is kept in the browser’s Cache Storage so notifications can appear while the app is closed. If you grant location permission, the record also contains coordinates rounded to 0.1° (about 10 km) so weather-based alerts can be sent. The record is kept in your device’s cache; its rounded approximate coordinates are sent to Open-Meteo to get weather information. The record is cleared by “Reset everything”.'],
  ['Depolama tarayıcı profiline ve uygulamanın açıldığı adrese bağlıdır.', 'Storage depends on the browser profile and the address the app is opened from. A different browser, device, site address or private window may not access the same data. Browser cleanup or storage limits can cause data loss.'],
  ['Google düğmesi bir hesap seçme penceresi açar.', 'The Google button opens an account chooser. Authentication happens through Google and Firebase Authentication; your Google password is never requested or stored by Vespır.'],
  ['Hesap bilgileri:', 'Account information: Account ID, email address and basic profile information provided by the provider (such as name and profile photo) may be processed by Google/Firebase. Vespır’s current account screen shows the email address.'],
  ['Sınırlı erişim:', 'Limited access: The app does not request extra access to Google Drive, contacts or calendar.'],
  ['İsteğe bağlı kullanım:', 'Optional use: You don’t have to sign in; you can use all focus features without an account.'],
  ['Firebase, tarayıcı desteklediği ölçüde', 'Firebase may store local session information so your session is remembered on later visits, as far as the browser supports it. On a shared device, use the “Sign out” button on the account screen when you’re done.'],
  ['Çıkış yapmak bu uygulamadaki Firebase oturumunu kapatır', 'Signing out ends the Firebase session in this app; it may not sign you out of your Google account in other browser tabs. Your local focus settings and stats are kept when you sign out.'],
  ['“Vespır mesaj göndersin” açıksa', 'If “Let Vespır send messages” is on, the cat occasionally writes invitations and reminders while the timer is stopped. If notifications are allowed, a missing-you message may arrive while you’re in another tab; these messages come at most every three hours, never between 23:00 and 05:00, and never interrupt a running focus timer. Weather alerts (umbrella, coat, sunglasses, etc.) arrive at most once a day (never between 23:00 and 05:00); they need location permission, and location is used only for these alerts and weather messages. Background messages work only in browsers that support them (usually Chromium-based, installed apps); on iPhone/Safari messages appear while the app is open.'],
  ['Hava mesajları:', 'Weather messages: Vespır talking about the weather is a natural part of the app and has no separate switch. <b>Why is location permission requested?</b> For two reasons only: so Vespır can make weather-appropriate remarks, and so she can send reminders such as an umbrella, coat or sunglasses during the day (outside 23:00–05:00) if messages are on. It is never used for anything else.'],
  ['Konumun işlenmesi:', 'Processing your location: When you allow it, your location is rounded to 0.1° and sent to Open-Meteo only to get the current weather. Your location is not used for advertising or profiling and is not stored on Vespır’s own server. It is kept only as rounded coordinates in your device’s browser cache for background weather alerts; it is deleted when messages are turned off or with “Reset everything”. The weather result is kept only briefly in memory. If you decline, the app works without anything breaking, only weather messages are silent.'],
  ['Uygulama kapalıyken:', 'While the app is closed: In the installed PWA version, the browser may show an occasional message through periodic background sync if supported. The browser decides the frequency; the preference record stays in the device cache and is cleared by reset.'],
  ['Kontrol sende:', 'You’re in control: The message switch can be turned off in Settings → Time; you can always revoke notification and location permissions in your browser settings.'],
  ['Web sürümü yüklenirken barındırma hizmetine', 'When the web version loads, network requests are made to the hosting service; when sign-in components load, to Google’s Firebase resources. If location permission is granted, a request with approximate coordinates is made to Open-Meteo for weather messages. Service providers may therefore process technical data such as IP address, browser information and request headers. Authentication and weather queries require an internet connection.'],
  ['Vespır’ın mevcut kodunda analitik SDK’sı', 'Vespır’s current code does not run an analytics SDK, ad tracking or a feature that sends focus stats to a server. This does not mean hosting and authentication services don’t keep their own operational and security records.'],
  ['Bildirimler:', 'Notifications: Used, with your browser permission, to notify you when a timer finishes and for Vespır messages. You can revoke permission in browser settings.'],
  ['Yaklaşık konum:', 'Approximate location: Requested with browser permission only for weather messages and alerts; before the permission prompt appears, Vespır explains why with an info card; choosing “Not now” stops it asking again for 3 days. Rounded approximate coordinates (0.1°) are sent to Open-Meteo to get weather information; high-accuracy location is not requested. If messages are on, these rounded coordinates are stored only in your device’s browser cache for background weather alerts. You can always revoke permission in browser settings.'],
  ['Dosya seçimi:', 'File selection: Only the sound file you choose is read. The app does not request access to all your files.'],
  ['Pano ve titreşim:', 'Clipboard and vibration: Copy buttons may use clipboard write, and if enabled, small feedback may use device vibration.'],
  ['İstenmeyen izinler:', 'Unrequested permissions: The current app does not request camera or microphone access.'],
  ['PWA kurulumu uygulamaya ana ekrandan erişim sağlar', 'Installing the PWA gives you home-screen access; it does not back up your data to your account. After the app opens online for the first time, the interface and core focus features are kept in the browser cache, so the timer, cat and settings can open without internet. Weather, Google sign-in and external links require internet. If the browser clears storage or site data, the cache is removed and the app may need to reconnect.'],
  ['Doğrudan HTML dosyasında Google girişi kullanılamaz.', 'Google sign-in cannot be used directly from an HTML file. Signing in requires HTTPS or a local development environment and an authorized domain in Firebase. On embedded pages, browser storage and popup restrictions may block sign-in or installation; opening the app in a separate tab may be necessary.'],
  ['Yerel tercihler, bunları sıfırlayana', 'Local preferences may be kept until you reset them or the browser clears site data. Daily stats refresh when a new day starts. Weather information is kept in memory only briefly; message preferences remain in the cache until reset or browser cleanup. The browser’s storage management may clear these records earlier.'],
  ['Firebase hesap ve teknik kayıtlarının saklanması', 'How long Firebase account and technical records are kept depends on the provider’s terms and project configuration; clearing local data does not automatically delete those records. Vespır does not guarantee permanent storage of local data or recovery of lost data.'],
  ['“Her şeyi sıfırla”:', '“Reset everything”: Clears the app’s main local settings/stats record, chosen custom sounds and the message preference cache; turns off the background message record. It does not delete your Firebase account or session; the PWA installation record is not part of this action.'],
  ['“Çıkış yap”:', '“Sign out”: Ends the session in the app; it does not delete your account or local focus data.'],
  ['Site verilerini temizleme:', 'Clearing site data: You can clear the storage for this site in browser settings. This may affect your session and local records on the device; it does not delete your provider account.'],
  ['Hesap silme talebi:', 'Account deletion request: The current interface has no delete-account button. For deletion or information requests about account data, contact the email below; account ownership verification may be required.'],
  ['Google/Firebase kimlik doğrulama, site barındırma hizmeti', 'Google/Firebase authentication is used to sign in, and the hosting service is used to serve the page. If location permission is granted, Open-Meteo provides current weather with rounded approximate coordinates (for weather messages while the app is open, and for weather alerts while it is closed if messages are on); no account identity is added to this request and location is not shared with anyone else. These providers may process data under their own policies and on infrastructure in different countries; no guarantee is made that all data stays only on your device or in a particular country.'],
  ['İletişim ve sosyal medya bağlantılarını açtığında', 'When you open contact and social media links, that service’s terms apply. The content of a support message and your contact details are processed through the relevant communication service to evaluate your request. Do not include passwords or session information in your message.'],
  ['Güvenli bağlantı:', 'Secure connection: Use the web version over HTTPS and from an app address you trust. Verify your Google account only in the provider’s real sign-in window.'],
  ['Kimlik doğrulama:', 'Authentication: Account operations are delegated to Firebase Authentication; the app does not keep a separate password database.'],
  ['Cihaz güvenliği:', 'Device security: Local settings and sounds are not additionally end-to-end encrypted by the app. Anyone with access to your device or browser profile may access this data.'],
  ['Kullanıcı önlemleri:', 'User precautions: Keep your browser up to date, sign out on shared devices and avoid writing sensitive personal information as the session name.'],
  ['Hiçbir yazılım veya aktarım yöntemi', 'No software or transmission method offers a hundred percent security guarantee. If you notice suspicious activity or a vulnerability, report the details privately by email; don’t share your passwords or session tokens.'],
  ['Hesap girişini kullanmama, uygulamadaki tercihleri değiştirme', 'You can choose not to sign in, change the app’s preferences, revoke browser permissions and clear local data. You can manage the access you granted to Vespır from your Google account settings.'],
  ['Hesap verilerine erişim, düzeltme veya silme taleplerini', 'You can send access, correction or deletion requests for account data by email. The scope of your request and the process depend on the relevant service and applicable law; this text does not promise that every request will be completed instantly or unconditionally.'],
  ['Özellikler veya veri işleme süreçleri değiştiğinde', 'These explanations may be updated when features or data-processing processes change. The current version and last update date are shown on this page. This text is for information; opening the page alone does not mean separate consent was given for all data processing.'],
  ['Son güncelleme:', '<b>Last updated: <time datetime="2026-11-14">November 14, 2026</time>.</b> You can focus without creating an account. Signing in does not back up your settings or stats to the cloud.'],
  ['1Kapsam ve Uygulamanın Amacı', '1. Scope and Purpose of the App'],
  ['2Yerel Veriler ve Kullanım Amaçları', '2. Local Data and Its Purposes'],
  ['3Tarayıcı Depolaması ve Ses Dosyaları', '3. Browser Storage and Audio Files'],
  ['4Google ile Oturum Açma', '4. Signing In with Google'],
  ['5Oturumun Hatırlanması', '5. Remembering Your Session'],
  ['6Vespır Mesajları, Bildirimler ve Hava Durumu', '6. Vespır Messages, Notifications and Weather'],
  ['7Ağ İstekleri ve Teknik Veriler', '7. Network Requests and Technical Data'],
  ['8İzinler ve Cihaz Özellikleri', '8. Permissions and Device Features'],
  ['9PWA, Çevrimdışı Kullanım ve Gömülü Sayfalar', '9. PWA, Offline Use and Embedded Pages'],
  ['10Saklama Süreleri ve Veri Kaybı', '10. Retention Periods and Data Loss'],
  ['11Sıfırlama, Çıkış ve Hesap Silme Ayrımı', '11. Reset, Sign Out and Account Deletion'],
  ['12Üçüncü Taraf Hizmetleri ve Dış Bağlantılar', '12. Third-Party Services and External Links'],
  ['13Güvenlik Önlemleri ve Sınırları', '13. Security Measures and Limits'],
  ['14Tercihlerin ve Başvuru Yolları', '14. Your Choices and How to Contact Us'],
  ['15Metnin Güncellenmesi', '15. Updates to This Text'],
  ['16İletişim ve Güvenlik Bildirimleri', '16. Contact and Security Notices'],
  ['Gizlilik soruların, hesap taleplerin ve güvenlik bildirimlerin', 'For privacy questions, account requests and security notices, use the email channel. The social media account is for general contact; don’t share sensitive account details in public messages.']
];
function canTranslateNode(node) {
  const el = node.nodeType === 1 ? node : node.parentElement;
  if (!el) return false;
  if (el.closest('[data-no-i18n]')) return false;
  if (TR_SKIP_TAGS.has(el.tagName)) return false;
  if (el.closest('svg') && !el.closest('text, foreignObject')) return false;
  return true;
}
function blockTranslationFor(el) {
  if (!/^(P|LI|H3)$/.test(el.tagName)) return '';
  if (!el.closest('#aboutScroll, #contactScroll, #privacyScroll, #accountBody')) return '';
  if (el.querySelector('a, button, input, textarea, select, svg')) return '';
  const key = (el.textContent || '').replace(/\s+/g, ' ').trim();
  for (let i = 0; i < EN_BLOCKS.length; i++) {
    if (key.indexOf(EN_BLOCKS[i][0]) === 0) return EN_BLOCKS[i][1];
  }
  return '';
}
function applyLanguageDom(root) {
  if (!root || typeof document === 'undefined') return;
  const en = S.lang === 'en';
  const walk = (node) => {
    if (node.nodeType === 3) {
      if (!canTranslateNode(node)) return;
      const raw = node.nodeValue;
      const key = raw ? raw.trim() : '';
      if (!key) return;
      if (en) {
        const hit = EN[key];
        if (!hit) return;
        if (!domTextOrig.has(node)) domTextOrig.set(node, raw);
        const next = raw.replace(key, hit);
        if (node.nodeValue !== next) node.nodeValue = next;
      } else if (domTextOrig.has(node)) {
        const orig = domTextOrig.get(node);
        if (node.nodeValue !== orig) node.nodeValue = orig;
        domTextOrig.delete(node);
      }
      return;
    }
    if (node.nodeType !== 1) return;
    if (!canTranslateNode(node)) return;
    if (en) {
      const block = blockTranslationFor(node);
      if (block) {
        if (!domBlockOrig.has(node)) domBlockOrig.set(node, node.innerHTML);
        if (node.innerHTML !== block) node.innerHTML = block;
        return;
      }
    } else if (domBlockOrig.has(node)) {
      const orig = domBlockOrig.get(node);
      if (node.innerHTML !== orig) node.innerHTML = orig;
      domBlockOrig.delete(node);
      return;
    }
    const attrs = domAttrOrig.get(node) || {};
    for (const attr of TR_ATTRS) {
      if (!node.hasAttribute(attr)) continue;
      const raw = node.getAttribute(attr);
      if (!raw) continue;
      if (en) {
        const hit = EN[raw] || EN[raw.trim()];
        if (!hit) continue;
        if (!(attr in attrs)) attrs[attr] = raw;
        if (raw !== hit) node.setAttribute(attr, hit);
      } else if (attr in attrs) {
        if (node.getAttribute(attr) !== attrs[attr]) node.setAttribute(attr, attrs[attr]);
        delete attrs[attr];
      }
    }
    if (Object.keys(attrs).length) domAttrOrig.set(node, attrs);
    else domAttrOrig.delete(node);
    for (let child = node.firstChild; child; child = child.nextSibling) walk(child);
  };
  walk(root);
  if (root === document.body) {
    const desc = document.querySelector('meta[name="description"]');
    if (desc) {
      if (en) {
        if (!desc.dataset.trOrig) desc.dataset.trOrig = desc.content;
        desc.content = 'Vespır: a focus companion with a 3D cat and a Liquid Glass design. The cat sleeps, reads and meows; you focus.';
      } else if (desc.dataset.trOrig) {
        desc.content = desc.dataset.trOrig;
        delete desc.dataset.trOrig;
      }
    }
  }
}
function syncLangButtons() {
  $$('#langGroup [data-lang]').forEach((b) => {
    const on = b.dataset.lang === S.lang;
    b.classList.toggle('active', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
}
function refreshLanguageChrome() {
  document.documentElement.lang = S.lang;
  document.documentElement.dataset.lang = S.lang;
  syncLangButtons();
  applyLanguageDom(document.body);
  if (typeof relabelSwatches === 'function') relabelSwatches();
  updateDocumentTitle();
  syncTimerChrome();
  updateTimerDisplay(true);
  updateSessionUI();
  updateGoalUI();
  updateNotifyStatus();
  updateMsgStatus();
  updateStatsUI();
  updatePwaUI();
  updateStageMeta();
  updateCatSummary();
  updateBookIdentity();
  updatePerch();
  if ($('#focusInvite').classList.contains('open')) syncFocusInviteCopy();
  applyLanguageDom(document.body);
}
function setLanguage(lang, opts = {}) {
  const next = lang === 'en' ? 'en' : 'tr';
  if (S.lang === next) return;
  S.lang = next;
  /* Varsayılan seans adı da dille birlikte dönsün; kullanıcı adı değiştiyse korunur. */
  if (next === 'en' && S.sessionName === 'Derin Odak') S.sessionName = 'Deep Focus';
  else if (next === 'tr' && S.sessionName === 'Deep Focus') S.sessionName = 'Derin Odak';
  saveNow();
  refreshLanguageChrome();
  try { document.dispatchEvent(new CustomEvent('vespir:lang')); } catch (e) {}
  /* Arka plan bildirimleri de yeni dilde mesaj üretsin. */
  try { writeMessagePrefs(); } catch (e) {}
  if (!opts.quiet) toast(next === 'en' ? 'Language switched to English.' : 'Dil Türkçeye döndü.');
}
const html = document.documentElement;
let saveTimer = 0;
let storageWarned = false;
let resetting = false;
const SAVE_KEYS = ['v', 'theme', 'mode', 'lang', 'cat', 'focusMin', 'breakMin', 'sessionName', 'autoStart',
  'autoFocus', 'dailyGoal', 'catRhythm', 'hourlyChime', 'notify', 'catMessages', 'lastMsgAt', 'volume', 'chimeVolume',
  'startSound', 'endSound', 'perf', 'welcomed', 'stats', 'streak', 'timer', 'completedSessions'];
const copyState = (value) => JSON.parse(JSON.stringify(value));
const sameState = (a, b) => JSON.stringify(a) === JSON.stringify(b);
let savedBaseline = copyState(S);
let stateSyncTimer = 0;
/* Üç yönlü birleştirme: bu sekmede dokunulmayan alanı eski bellekten yazma.
   Kedi alt alanları ayrı birleştirilir; tema değişimi başka sekmenin adını ezmez. */
function mergeStoredState(local, base, remote) {
  const merged = { ...local };
  SAVE_KEYS.forEach((key) => {
    if (key === 'cat') {
      merged.cat = { ...local.cat };
      Object.keys(DEFAULTS().cat).forEach((part) => {
        if (sameState(local.cat[part], base.cat[part])) merged.cat[part] = remote.cat[part];
      });
    } else if (key === 'completedSessions') {
      merged[key] = Array.from(new Set([...(remote[key] || []), ...(local[key] || [])])).slice(-64);
    } else if (sameState(local[key], base[key])) {
      merged[key] = remote[key];
    }
  });
  return merged;
}
function paintStoredState(previous) {
  if (!sameState(previous.timer, S.timer)) {
    stopAutoStart();
    stopFocusCatch();
    if (rewardActive) stopFocusReward();
    cancelAnimationFrame(timer.interval);
    timer.interval = 0;
    stopFinishTimer();
    catReset();
    clearBubbleTimers();
    hideBubble();
    const running = restoreTimer();
    if (running) { if (timer.phase === 'focus') beginFocusCat(); else beginBreakCat(); }
    else { setCatState('idle'); scheduleIdleCat(); }
    syncTimerChrome();
    updateTimerDisplay(true);
  }
  if (!sameState(previous.cat, S.cat)) { renderCats(); updateCatVisuals(); }
  if (previous.theme !== S.theme || previous.mode !== S.mode) applyTheme(false);
  if (previous.lang !== S.lang) {
    refreshLanguageChrome();
    document.dispatchEvent(new CustomEvent('vespir:lang'));
  }
  setMasterVolume();
  updateSessionUI();
  updateStatsUI();
  syncSettingsUI();
  syncMessageSchedule();
}
function syncStoredState() {
  if (resetting || !window.Vespir) return;
  const previous = copyState(S);
  const remote = loadSettings();
  S = mergeStoredState(S, savedBaseline, remote);
  savedBaseline = copyState(remote);
  if (!sameState(previous, S)) paintStoredState(previous);
}
window.addEventListener('storage', (event) => {
  if (event.key !== 'vespir.v1' && event.key !== null) return;
  clearTimeout(stateSyncTimer);
  stateSyncTimer = setTimeout(syncStoredState, 0);
});
function saveNow() {
  clearTimeout(saveTimer);
  saveTimer = 0;
  if (resetting) return;
  try {
    const previous = copyState(S);
    const merged = mergeStoredState(S, savedBaseline, loadSettings());
    localStorage.setItem('vespir.v1', JSON.stringify(merged));
    S = merged;
    savedBaseline = copyState(S);
    if (!sameState(previous, S)) setTimeout(() => paintStoredState(previous), 0);
  } catch (e) {
    /* Kota dolarsa uygulama durmasın: yalnızca bilinen alanlar yazılır,
       eski sürümlerden kalan şişkin anahtarlar localStorage'a taşınmaz. */
    try {
      const slim = {};
      SAVE_KEYS.forEach((k) => { if (k in S) slim[k] = S[k]; });
      localStorage.setItem('vespir.v1', JSON.stringify(slim));
      savedBaseline = copyState(S);
    } catch (e2) {
      if (!storageWarned) {
        storageWarned = true;
        setTimeout(() => toast('Tarayıcı hafızası dolu; ayarların bir kısmı saklanamıyor.'), 0);
      }
    }
  }
}
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveNow, 260);
}
function resolveMode() {
  if (S.mode === 'auto') return (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  return S.mode;
}
/* ---------- theme ---------- */
function schemeIconSVG() {
  return resolveMode() === 'dark'
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4"/></svg>'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20 15.2A8.3 8.3 0 0 1 8.8 4a8.3 8.3 0 1 0 11.2 11.2Z"/><path d="M16.5 4.5v2M15.5 5.5h2" opacity=".6"/></svg>';
}
function updateSchemeIcon() {
  const el = $('#schemeIcon');
  if (el) el.innerHTML = schemeIconSVG();
}
let rippleBusy = false;
/* Dalganın rengi için o anki temanın renklerini oku. dataset'e dokunmayız:
   tema attribute'unu bir ileri bir geri almak tüm sayfayı iki kez baştan hesaplattırıyordu. */
function themePaletteNow() {
  const cs = getComputedStyle(html);
  const get = (name, fb) => (cs.getPropertyValue(name) || '').trim() || fb;
  return { a: get('--bg-1', '#ffd4e6'), b: get('--bg-2', '#e2d6ff'), c: get('--accent', '#ff5f9e') };
}
function setRippleColors(ripple, pal) {
  ripple.style.setProperty('--rp-a', pal.a);
  ripple.style.setProperty('--rp-b', pal.b);
  ripple.style.setProperty('--rp-c', pal.c);
}
function applyTheme(animate = false, sourceEl = null) {
  /* Renkleri değiştiren çekirdek: tek bir stil hesabında bitsin diye birlikte uygulanır. */
  const runCore = () => {
    const mode = resolveMode();
    html.dataset.theme = S.theme;
    html.dataset.mode = mode;
    html.dataset.motion = 'high';
    html.style.colorScheme = mode;
    updatePawColor();
    /* Kitap teması renklerle aynı anda değişsin: tema geçişi animasyonlu
       yoldan gelse de Vespır doğru kitabı okur. */
    updateBookIdentity();
  };
  /* Küçük yardımcı güncellemeler: ayrı karede çalışır, swap karesini şişirmez. */
  const runChrome = () => {
    const mode = resolveMode();
    const meta = $('#metaTheme');
    if (meta) meta.content = mode === 'dark' ? THEMES[S.theme].metaDark : THEMES[S.theme].metaLight;
    updateSchemeIcon();
    $$('.theme-card').forEach((el) => el.classList.toggle('active', el.dataset.themeCard === S.theme));
    $$('#modeGroup [data-mode]').forEach((el) => el.classList.toggle('active', el.dataset.mode === S.mode));
  };
  const run = () => { runCore(); runChrome(); };
  const after = () => {
    buildParticles();
    scheduleAtmosphere();
    updateCatVisuals();
    syncSnow();
    /* Tema değişince Vespır'ın okuduğu kitap da o dünyaya geçer:
       Noel → kış masalları, Cadılar Bayramı → Nekronomikon. */
    updateBookIdentity();
    /* Uygulama kapalıyken gelen bildirimler de yeni temanın simgesini taşısın. */
    if (typeof S !== 'undefined' && S.catMessages) writeMessagePrefs();
  };
  const ripple = $('#themeRipple');
  if (!animate || !ripple || rippleBusy) { run(); after(); return; }
  rippleBusy = true;
  setRippleColors(ripple, themePaletteNow());
  let x = window.innerWidth / 2, y = window.innerHeight / 2;
  if (sourceEl) {
    const r = sourceEl.getBoundingClientRect();
    x = r.left + r.width / 2; y = r.top + r.height / 2;
  }
  ripple.style.setProperty('--rp-x', Math.round(x) + 'px');
  ripple.style.setProperty('--rp-y', Math.round(y) + 'px');
  ripple.classList.remove('out');
  ripple.classList.add('in');
  /* Örtü opak olunca temayı tek karede değiştir: ne ekran görüntüsü kopyalanır
     ne de yüzlerce eleman aynı anda renk geçişi oynatır.
     no-trans, örtü tamamen sönene kadar kalır: geçişler bir kez bastırılmazsa
     tema değişiminden sonra ~1 saniye boyunca her kare tüm sayfayı yeniden boyar. */
  setTimeout(() => {
    html.classList.add('no-trans');
    runCore();
    /* Örtü artık yeni temanın renginde sönsün (bu okuma zaten yapılacak stil hesabını öne alır). */
    setRippleColors(ripple, themePaletteNow());
    ripple.classList.remove('in');
    ripple.classList.add('out');
    /* Partiküller, atmosfer ve küçük güncellemeler ayrı karede kurulsun: hepsi renk
       değişimiyle aynı kareye binince tek bir uzun blok oluşuyordu. */
    requestAnimationFrame(() => { runChrome(); after(); });
    setTimeout(() => {
      ripple.classList.remove('out');
      html.classList.remove('no-trans');
      rippleBusy = false;
    }, 640);
  }, 200);
}
let atmosphereState = '';
/* Performans modu tek bir bayrakla yönetilir: html[data-lowfx="1"] hem CSS
   katmanını hem aşağıdaki efekt sistemlerini kapatır. */
function perfModeOn() {
  return document.documentElement.dataset.lowfx === '1';
}
function applyPerfMode() {
  const on = S.perf === true;
  document.documentElement.dataset.lowfx = on ? '1' : '0';
  try { localStorage.setItem('vespir.lowfx', on ? '1' : '0'); } catch (e) {}
  buildParticles(true);
  applyAtmosphere();
  scheduleAtmosphere();
  syncSnow();
  syncSceneEffects();
  syncSettingsUI();
  syncTimerChrome();
  updateTimerDisplay(true);
  toast(on
    ? 'Performans modu açık: tüm efektler kapandı.'
    : 'Performans modu kapalı: efektler geri geldi.');
}

function applyAtmosphere() {
  const key = (S.particles ? 'p1' : 'p0') + (S.reflections ? 'r1' : 'r0') + (perfModeOn() ? 'f1' : 'f0');
  if (key === atmosphereState) return;
  atmosphereState = key;
  const p = document.getElementById('particles');
  if (p) p.style.display = (S.particles && !perfModeOn()) ? '' : 'none';
  html.dataset.reflections = S.reflections ? 'on' : 'off';
  const sheens = $$('.card-sheen, .preview-shine');
  sheens.forEach((el) => { el.style.display = (S.reflections && !perfModeOn()) ? '' : 'none'; });
}
let atmosphereTimer = 0;
function scheduleAtmosphere() {
  clearTimeout(atmosphereTimer);
  atmosphereTimer = setTimeout(applyAtmosphere, 30);
}
/* ---------- ambient particles ---------- */
let particleShape = null, particleCount = -1;
let particleKeyStyle = null;
/* Her taneciğin keyframe'i sayısal değerlerle pişirilir: var() içeren
   keyframe compositor'da çalışmaz ve her kare ana iş parçacığında stil
   hesabı doğururdu. Pişmiş sürüm aynı hareketi compositor'a taşır. */
function bakedParticleKeys(shape, i, drift, o) {
  const d = parseFloat(drift);
  const n = 'pk' + i;
  if (shape === 'snow') {
    return '@keyframes ' + n + '{0%{opacity:0;transform:translate3d(0,0,0) rotate(0deg) scale(.65)}8%{opacity:' + o + '}50%{transform:translate3d(' + drift + ',54vh,0) rotate(160deg) scale(1)}92%{opacity:' + o + '}100%{opacity:0;transform:translate3d(' + (d * -.7).toFixed(2) + 'vh,110vh,0) rotate(300deg) scale(.8)}}';
  }
  if (shape === 'bat') {
    return '@keyframes ' + n + '{0%{opacity:0;transform:translate3d(0,0,0) rotate(-7deg) scale(.78)}6%{opacity:' + o + '}23%{transform:translate3d(30vw,-4.5vh,0) rotate(5deg) scale(1)}48%{opacity:' + o + ';transform:translate3d(62vw,' + drift + ',0) rotate(-4deg) scale(.94)}74%{transform:translate3d(94vw,5vh,0) rotate(6deg) scale(1.03)}94%{opacity:' + o + '}100%{opacity:0;transform:translate3d(132vw,8vh,0) rotate(-5deg) scale(.82)}}';
  }
  return '@keyframes ' + n + '{0%{opacity:0;transform:translate3d(0,0,0) rotate(0deg) scale(.7)}8%{opacity:' + o + '}50%{transform:translate3d(' + drift + ',-54vh,0) rotate(140deg) scale(1)}92%{opacity:' + o + '}100%{opacity:0;transform:translate3d(' + (-d).toFixed(2) + 'vh,-112vh,0) rotate(320deg) scale(.8)}}';
}
function buildParticles(force = false) {
  const box = $('#particles');
  if (!box) return;
  if (!particleKeyStyle) {
    particleKeyStyle = document.createElement('style');
    particleKeyStyle.id = 'particleKeys';
    document.head.appendChild(particleKeyStyle);
  }
  if (!S.particles || perfModeOn()) {
    if (box.childElementCount) box.innerHTML = '';
    particleKeyStyle.textContent = '';
    particleShape = null; particleCount = -1;
    return;
  }
  const theme = THEMES[S.theme] || THEMES.sakura;
  const shape = theme.particle;
  const smallScreen = window.innerWidth < 700;
  const count = smallScreen ? 8 : 10;
  /* Parçacıklar tema rengini CSS değişkeninden alır; sadece şekil/sayı değişince yeniden kur. */
  if (!force && shape === particleShape && count === particleCount && box.childElementCount === count) return;
  particleShape = shape; particleCount = count;
  box.innerHTML = '';
  const frag = document.createDocumentFragment();
  const keyCss = [];
  for (let i = 0; i < count; i++) {
    const el = document.createElement('span');
    el.className = 'particle ' + shape;
    const size = randInt(5, 13);
    if (shape === 'bat') {
      /* Kanatlar soldan girer; her yarasa farklı yükseklikte süzülür. */
      el.style.left = '-10vw';
      el.style.setProperty('--bat-top', rand(6, 58).toFixed(1) + 'vh');
    } else {
      el.style.left = rand(0, 100).toFixed(2) + '%';
    }
    el.style.setProperty('--s', size + 'px');
    el.style.setProperty('--dur', rand(shape === 'bat' ? 24 : 18, shape === 'bat' ? 46 : 42).toFixed(1) + 's');
    el.style.setProperty('--delay', (-rand(0, 34)).toFixed(1) + 's');
    const drift = rand(shape === 'bat' ? -6 : -7, shape === 'bat' ? 6 : 7).toFixed(1) + 'vh';
    const o = rand(.22, .62).toFixed(2);
    el.style.opacity = '0';
    /* nth-child kuralı, hareket kilidi bloğundaki !important bildirimlerden
       daha yüksek özgüllüklüdür; kilit açıkken de doğru yön akıyor. */
    keyCss.push('#particles>.particle:nth-child(' + (i + 1) + '){animation-name:pk' + i + ' !important}');
    keyCss.push(bakedParticleKeys(shape, i, drift, o));
    frag.appendChild(el);
  }
  particleKeyStyle.textContent = keyCss.join('');
  box.appendChild(frag);
}
/* ---------- noel: fizikli kar + sayaç üstünde birikim ---------- */
const snow = {
  canvas: null, ctx: null, w: 0, h: 0, dpr: 1,
  flakes: [], clumps: [], piles: new Map(), surfaces: [], surfaceDirty: true, surfaceRect: null,
  surfaceAnimatingUntil: performance.now() + 1600,
  raf: 0, running: false, last: 0, drawnAt: 0, t: 0, quality: 1, slow: 0
};
const SNOW_PILE_MAX = 15;
function initSnow() {
  if (snow.canvas) return;
  snow.canvas = document.getElementById('snowCanvas');
  if (!snow.canvas) return;
  snow.ctx = snow.canvas.getContext('2d');
  resizeSnow();
  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { if (snow.running) resizeSnow(); }, 160);
  }, { passive: true });
}
function resizeSnow() {
  const canvas = snow.canvas;
  if (!canvas) return;
  /* Kar taneleri 1-4 px yumuşak beyaz noktalar. Büyük ekranlarda tam çözünürlük
     her karede milyonlarca pikseli temizliyor; 0.7-1.0 arası bir tampon
     görüntüyü bozmadan maliyeti ciddi biçimde düşürüyor. */
  const area = Math.max(1, window.innerWidth * window.innerHeight);
  snow.dpr = Math.min(1, Math.max(.7, Math.sqrt(1500000 / area)));
  snow.w = window.innerWidth;
  snow.h = window.innerHeight;
  canvas.width = Math.max(1, Math.floor(snow.w * snow.dpr));
  canvas.height = Math.max(1, Math.floor(snow.h * snow.dpr));
  snow.surfaces = [];
  snow.surfaceDirty = true;
  snow.piles.clear();
  buildSnowFlakes();
}
function makeSnowFlake(initial = false) {
  const r = rand(1.1, 3.5);
  return {
    x: rand(-16, snow.w + 16),
    y: initial ? rand(-snow.h, snow.h) : rand(-34, -6),
    r,
    vy: rand(22, 52) + r * 9,
    vx: rand(-7, 7),
    phase: rand(0, Math.PI * 2),
    sway: rand(8, 24),
    spin: rand(-.5, .5),
    rot: rand(0, Math.PI * 2),
    alpha: rand(.42, .96)
  };
}
function buildSnowFlakes() {
  /* Yoğunluk ekran alanına göre ölçeklenir ama üst sınır düşük tutulur:
     90+ tanenin her karede çizilmesi zayıf cihazlarda ana iş parçacığını
     dolduruyordu. 50 civarı tane aynı kar hissini verir, yarı maliyetle. */
  /* 2560 px geniş ekranda 56 tane tek tek yay çiziminde kare atlaması
     yapıyordu; 48 tane aynı yoğunluk hissini koruyup akıcı kalıyor. */
  /* Düşük bellekli telefonda tane sayısı yarıya iner; kar hissi aynı kalır. */
  const cap = perfModeOn() ? 0 : 40;
  const count = Math.round(Math.min(cap, Math.max(20, (snow.w * snow.h) / 34000)));
  snow.flakes = [];
  for (let i = 0; i < count; i++) snow.flakes.push(makeSnowFlake(true));
}
/* Kartın üst konturu: köşeler yuvarlak olduğu için kar çizgisi düz değil,
   önce köşe yayını takip eder, sonra düz kenara oturur. */
function snowSurfaceY(surface, x) {
  const rad = surface.radius || 0;
  if (rad > 0) {
    if (x < surface.left + rad) {
      const dx = surface.left + rad - x;
      return surface.top + rad - Math.sqrt(Math.max(0, rad * rad - dx * dx));
    }
    if (x > surface.right - rad) {
      const dx = x - (surface.right - rad);
      return surface.top + rad - Math.sqrt(Math.max(0, rad * rad - dx * dx));
    }
  }
  return surface.top;
}
/* Kenarlarda kar kalınlığı sıfıra iner: birikim kartın siluetini sarar. */
function snowEdgeFade(surface, x) {
  const rad = Math.max(10, surface.radius || 10);
  const d = Math.min(x - surface.left, surface.right - x);
  return clamp(d / (rad * 1.12), 0, 1);
}
function invalidateSnowSurface() { snow.surfaceDirty = true; }
window.addEventListener('scroll', invalidateSnowSurface, { passive: true, capture: true });
window.addEventListener('resize', invalidateSnowSurface, { passive: true });
if (window.visualViewport) {
  visualViewport.addEventListener('resize', invalidateSnowSurface, { passive: true });
  visualViewport.addEventListener('scroll', invalidateSnowSurface, { passive: true });
}
function snowSurfaces(now) {
  const list = snow.surfaces;
  const card = snow.cardEl || (snow.cardEl = document.getElementById('timerCard'));
  const focusActive = document.body.classList.contains('focus-active');
  const mobileFocusCard = focusActive && innerWidth <= 768 && innerHeight >= innerWidth;
  /* Dikey telefon odağında kart görünür; diğer odak görünümlerinde kar kartta birikmesin. */
  const blocked = !card
    || (focusActive && !mobileFocusCard)
    || card.classList.contains('is-scene-moving');
  let r = null;
  if (!blocked) {
    if (snow.surfaceDirty || now < snow.surfaceAnimatingUntil) {
      snow.surfaceRect = card.getBoundingClientRect();
      snow.surfaceDirty = false;
    }
    r = snow.surfaceRect;
    if (r && (r.width <= 120 || r.height <= 120)) r = null;
  } else {
    snow.surfaceDirty = true;
  }
  if (!r) {
    if (list.length) list.length = 0;
    if (snow.piles.has('timer')) snow.piles.delete('timer');
    return list;
  }
  /* Konum yalnız yerleşim/kaydırma değişince okunur. İlk giriş animasyonu
     boyunca takip sürer; durağan kart her karede zorunlu layout üretmez. */
  let surface = list[0];
  if (!surface) { surface = { key: 'timer' }; list.push(surface); }
  surface.left = r.left + 2;
  surface.right = r.right - 2;
  surface.top = r.top;
  surface.bottom = r.bottom;
  const widthChanged = !snow.lastCardW || Math.abs(r.width - snow.lastCardW) > 2;
  if (widthChanged) {
    /* getComputedStyle yalnızca kartın ölçüsü değiştiğinde çağrılır. */
    let radius = 0;
    try {
      const cs = getComputedStyle(card);
      radius = parseFloat(cs.borderTopLeftRadius) || 0;
      const scale = card.offsetWidth ? r.width / card.offsetWidth : 1;
      radius *= scale;
    } catch (e) {}
    snow.lastRadius = clamp(radius || 30, 8, Math.min(54, r.width * .28));
    snow.lastCardW = r.width;
  }
  if (!snow.lastRadius) snow.lastRadius = 30;
  surface.radius = snow.lastRadius;
  if (!snow.piles.has('timer') || widthChanged) {
    snow.piles.delete('timer');
    const span = Math.max(40, surface.right - surface.left);
    const cols = Math.max(22, Math.min(170, Math.ceil(span / 3)));
    const heights = new Float32Array(cols);
    const ceil = new Float32Array(cols);
    const sparkles = [];
    const seed = Math.random() * Math.PI * 2;
    const bumps = [];
    for (let b = 0; b < 3; b++) {
      bumps.push({
        p: rand(.16, .84),
        w: rand(.055, .13),
        a: rand(1.6, 4.4)
      });
    }
    for (let i = 0; i < cols; i++) {
      const t = cols > 1 ? i / (cols - 1) : .5;
      const x = surface.left + (i + .5) / cols * span;
      const fade = snowEdgeFade(surface, x);
      let h = 3.9 + Math.sin(t * 11 + seed) * 1.15 + Math.sin(t * 23 + seed * 2.3) * .7 + Math.sin(t * 5.4 + seed * .7) * 1.4;
      for (let b = 0; b < bumps.length; b++) {
        const q = (t - bumps[b].p) / bumps[b].w;
        h += bumps[b].a * Math.exp(-q * q);
      }
      ceil[i] = Math.max(0, Math.min(SNOW_PILE_MAX, h * fade));
      /* Başlangıçta ince ama düzensiz bir toz tabakası: düz çizgi yok. */
      heights[i] = ceil[i] * rand(.29, .55);
    }
    for (let k = 0; k < 7; k++) {
      sparkles.push({ i: randInt(2, cols - 3), dx: rand(-1.1, 1.1), ph: rand(0, 6.28), r: rand(.55, 1.25) });
    }
    snow.piles.set('timer', { heights, ceil, cols, sparkles, settle: 0, dirty: true });
  }
  return list;
}
function snowPileHit(surface, x, y, r) {
  const pile = snow.piles.get(surface.key);
  if (!pile) return false;
  const span = surface.right - surface.left;
  if (span <= 0) return false;
  const ci = Math.floor(((x - surface.left) / span) * pile.cols);
  if (ci < 0 || ci >= pile.cols) return false;
  const fade = snowEdgeFade(surface, x);
  if (fade < .03) return false;
  const baseY = snowSurfaceY(surface, x);
  const h = pile.heights[ci];
  const topY = baseY - h;
  if (y + r * .3 < topY - 2.5) return false;
  if (y > baseY + 14) return true; /* kartın içine düşen tane emilir */
  if (h < pile.ceil[ci]) {
    const add = Math.min(pile.ceil[ci] - h, (0.26 + r * .16) * (.78 + Math.random() * .58));
    pile.heights[ci] = h + add;
    const side = add * .34;
    if (ci > 0) pile.heights[ci - 1] = Math.min(pile.ceil[ci - 1], pile.heights[ci - 1] + side);
    if (ci < pile.cols - 1) pile.heights[ci + 1] = Math.min(pile.ceil[ci + 1], pile.heights[ci + 1] + side);
    /* Komşusundan çok yükselen sütun usulca yayılır: keskin kuleler oluşmaz. */
    const l = ci > 0 ? pile.heights[ci - 1] : pile.heights[ci];
    const rr = ci < pile.cols - 1 ? pile.heights[ci + 1] : pile.heights[ci];
    const limit = (l + rr) * .5 + 2.6;
    if (pile.heights[ci] > limit) {
      const spill = Math.min(1.1, pile.heights[ci] - limit);
      pile.heights[ci] -= spill;
      if (ci > 0) pile.heights[ci - 1] = Math.min(pile.ceil[ci - 1], pile.heights[ci - 1] + spill * .5);
      if (ci < pile.cols - 1) pile.heights[ci + 1] = Math.min(pile.ceil[ci + 1], pile.heights[ci + 1] + spill * .5);
    }
    pile.dirty = true;
  }
  return true;
}
function renderPileCache(pile, surface) {
  const span = surface.right - surface.left;
  const H = SNOW_PILE_MAX + (surface.radius || 0) + 24;
  const OFF = SNOW_PILE_MAX + 10;
  if (!pile.cache) pile.cache = document.createElement('canvas');
  const s = snow.dpr;
  const cw = Math.max(2, Math.ceil(span * s));
  const ch = Math.max(2, Math.ceil(H * s));
  if (pile.cache.width !== cw || pile.cache.height !== ch) {
    pile.cache.width = cw;
    pile.cache.height = ch;
  }
  const c = pile.cache.getContext('2d');
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, cw, ch);
  c.scale(s, s);
  c.translate(0, OFF);
  const n = pile.cols;
  const step = span / n;
  const baseAt = (lx) => snowSurfaceY(surface, surface.left + lx) - surface.top;
  const firstX = step * .5;
  let prevX = firstX;
  let prevY = baseAt(firstX) - pile.heights[0];
  c.beginPath();
  c.moveTo(0, baseAt(0));
  c.lineTo(firstX, prevY);
  for (let i = 1; i < n; i++) {
    const x = (i + .5) * step;
    const y = baseAt(x) - pile.heights[i];
    const mx = (prevX + x) * .5;
    const my = (prevY + y) * .5;
    c.quadraticCurveTo(prevX, prevY, mx, my);
    prevX = x; prevY = y;
  }
  const lastX = (n - .5) * step;
  c.lineTo(lastX, prevY);
  c.lineTo(span, baseAt(span));
  c.lineTo(lastX, baseAt(lastX) + 1.1);
  for (let i = n - 2; i >= 0; i--) {
    const x = (i + .5) * step;
    c.lineTo(x, baseAt(x) + 1.1);
  }
  c.lineTo(0, baseAt(0) + 1.1);
  c.closePath();
  const grad = c.createLinearGradient(0, -16, 0, (surface.radius || 0) + 8);
  grad.addColorStop(0, 'rgba(255,255,255,.99)');
  grad.addColorStop(.55, 'rgba(247,252,255,.96)');
  grad.addColorStop(1, 'rgba(202,226,247,.9)');
  c.fillStyle = grad;
  c.shadowColor = 'rgba(118, 162, 204, .4)';
  c.shadowBlur = 5;
  c.shadowOffsetY = 2;
  c.fill();
  pile.cacheH = H;
  pile.cacheOff = OFF;
}
function drawSnowPile(ctx, surface) {
  const pile = snow.piles.get(surface.key);
  if (!pile) return;
  /* Siluet yalnızca kar gerçekten biriktiğinde yeniden çizilir; her karede
     shadowBlur ile yüzlerce eğri çizmek ana kare düşüşüydü. Büyük ekranlarda
     her tane düşüşünde yeniden çizmek yerine saniyede ~8 kez tazelenir. */
  const tNow = performance.now();
  if (!pile.cache || (pile.dirty && tNow - (pile.renderedAt || 0) > 200)) {
    renderPileCache(pile, surface);
    pile.dirty = false;
    pile.renderedAt = tNow;
  }
  ctx.drawImage(pile.cache, surface.left, surface.top - pile.cacheOff, surface.right - surface.left, pile.cacheH);
  /* Karın üstünde seyrek, hafif parıltılar. */
  const n = pile.cols;
  const step = (surface.right - surface.left) / n;
  ctx.fillStyle = '#fff';
  for (let k = 0; k < pile.sparkles.length; k++) {
    const sp = pile.sparkles[k];
    if (sp.i < 0 || sp.i >= n) continue;
    const x = surface.left + (sp.i + .5) * step + sp.dx;
    const y = snowSurfaceY(surface, x) - pile.heights[sp.i] + 1.1;
    ctx.globalAlpha = .38 + .34 * (0.5 + 0.5 * Math.sin(snow.t * 2.1 + sp.ph));
    ctx.beginPath();
    ctx.arc(x, y, sp.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
function resetSnowFlake(f) {
  /* Aynı taneyi yerinde diriltiyoruz; her inişte yeni nesne üretmek zayıf
     cihazlarda çöp toplama dalgalanması (mikro takılma) yapıyordu. */
  const r = rand(1.1, 3.5);
  f.x = rand(-16, snow.w + 16);
  f.y = rand(-34, -6);
  f.r = r;
  f.vy = rand(22, 52) + r * 9;
  f.vx = rand(-7, 7);
  f.phase = rand(0, Math.PI * 2);
  f.sway = rand(8, 24);
  f.spin = rand(-.5, .5);
  f.alpha = rand(.42, .96);
}
function sceneEffectsVisible() {
  if (perfModeOn()) return false;
  return !document.hidden && !document.body.classList.contains('focus-active')
    && !document.body.classList.contains('install-invite-open');
}
function syncSceneEffects() {
  const visible = sceneEffectsVisible();
  document.documentElement.classList.toggle('page-hidden', document.hidden);
  if (!visible) {
    cancelAnimationFrame(snow.raf);
    snow.raf = 0;
    cancelAnimationFrame(fx.raf);
    fx.raf = 0;
  } else {
    if (snow.running && !snow.raf) {
      snow.last = performance.now();
      invalidateSnowSurface();
      snow.raf = requestAnimationFrame(stepSnow);
    }
    if (fx.parts.length && !fx.raf) {
      fx.last = performance.now();
      fx.raf = requestAnimationFrame(stepFx);
    }
  }
}
function stepSnow(now) {
  snow.raf = 0;
  if (!snow.running || !sceneEffectsVisible()) return;
  const ctx = snow.ctx;
  const canvas = snow.canvas;
  if (!ctx || !canvas) return;
  /* Kar 60 karede bir yeniden çizilmek zorunda değil: 30 kare gözle
     ayırt edilmiyor ama tam ekran tuvalin temizleme + dolgu maliyetini
     yarıya indiriyor. */
  if (snow.drawnAt && now - snow.drawnAt < 30) { snow.raf = requestAnimationFrame(stepSnow); return; }
  snow.drawnAt = now;
  const dt = Math.min(.05, Math.max(.001, (now - (snow.last || now)) / 1000));
  snow.last = now;
  snow.t += dt;
  /* Cihaz zorlanıyorsa önce en pahalı süslemeleri (halo) kıs, animasyon
     akmaya devam etsin; düzeldiğinde kalite kendiliğinden geri gelir. */
  if (dt > .023) snow.slow = Math.min(150, snow.slow + 1);
  else snow.slow = Math.max(0, snow.slow - 1);
  if (snow.slow > 48) { snow.quality = .55; snow.slow = 20; }
  else if (snow.slow === 0 && snow.quality < 1) snow.quality = 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.scale(snow.dpr, snow.dpr);
  const surfaces = snowSurfaces(now);
  const wind = Math.sin(snow.t * .52) * 15 + Math.sin(snow.t * .19 + 1.7) * 9;
  /* Tek dolgu rengi + globalAlpha: her tane için yeniden rgba() metni
     üretmek çöp toplayıcıyı sürekli meşgul ediyordu. */
  ctx.fillStyle = '#fff';
  /* Taneleri alfa kovalarında topla: ~90 ayrı fill() yerine 6 toplu fill().
     Her tane için ayrı çizim yapmak kar yağarken ana iş parçacığını yoruyordu. */
  const buckets = snow._buckets || (snow._buckets = Array.from({ length: 6 }, () => []));
  const halos = snow._halos || (snow._halos = Array.from({ length: 6 }, () => []));
  for (let b = 0; b < 6; b++) { buckets[b].length = 0; halos[b].length = 0; }
  for (let i = 0; i < snow.flakes.length; i++) {
    const f = snow.flakes[i];
    f.x += (f.vx + wind * (f.sway / 22) + Math.sin(snow.t * 1.15 + f.phase) * 9) * dt;
    f.y += f.vy * dt;
    f.rot += f.spin * dt;
    if (f.x < -14) f.x = snow.w + 14;
    else if (f.x > snow.w + 14) f.x = -14;
    let landed = false;
    if (f.vy > 0) {
      for (let s = 0; s < surfaces.length; s++) {
        const surf = surfaces[s];
        if (f.x <= surf.left || f.x >= surf.right) continue;
        if (snowPileHit(surf, f.x, f.y, f.r)) { landed = true; break; }
      }
    }
    if (landed || f.y > snow.h + 24) resetSnowFlake(f);
    const bi = Math.min(5, (f.alpha * 6) | 0);
    buckets[bi].push(f.x, f.y, f.r);
    /* Halo yalnızca iri tanelere: her taneye yumuşak halka çizmek gereksiz
       dolgu maliyeti getiriyordu. */
    if (f.r > 2.9 && snow.quality > .7) halos[bi].push(f.x, f.y, f.r * 1.75);
  }
  const TAU = Math.PI * 2;
  for (let b = 0; b < 6; b++) {
    const h = halos[b];
    if (!h.length) continue;
    ctx.globalAlpha = (b + .5) / 6 * .14;
    ctx.beginPath();
    for (let i = 0; i < h.length; i += 3) {
      ctx.moveTo(h[i] + h[i + 2], h[i + 1]);
      ctx.arc(h[i], h[i + 1], h[i + 2], 0, TAU);
    }
    ctx.fill();
  }
  for (let b = 0; b < 6; b++) {
    const arr = buckets[b];
    if (!arr.length) continue;
    ctx.globalAlpha = (b + .5) / 6;
    ctx.beginPath();
    for (let i = 0; i < arr.length; i += 3) {
      ctx.moveTo(arr[i] + arr[i + 2], arr[i + 1]);
      ctx.arc(arr[i], arr[i + 1], arr[i + 2], 0, TAU);
    }
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (let s = 0; s < surfaces.length; s++) drawSnowPile(ctx, surfaces[s]);
  snow.raf = requestAnimationFrame(stepSnow);
}
function syncSnow() {
  const on = S.theme === 'noel' && !perfModeOn();
  if (on) {
    initSnow();
    if (!snow.canvas) return;
    if (!snow.running) {
      resizeSnow();
      snow.running = true;
      snow.last = performance.now();
      if (sceneEffectsVisible()) snow.raf = requestAnimationFrame(stepSnow);
    }
    startHeadSnow();
  } else {
    stopHeadSnow();
    resetHeadSnow();
    if (snow.running) {
      snow.running = false;
      cancelAnimationFrame(snow.raf);
      snow.flakes = [];
      snow.piles.clear();
      snow.surfaces = [];
      if (snow.ctx) {
        snow.ctx.setTransform(1, 0, 0, 1, 0, 0);
        snow.ctx.clearRect(0, 0, snow.canvas.width, snow.canvas.height);
      }
    }
  }
}
/* ---------- kafada kar birikimi ---------- */
let headSnowLevel = 0;
let headSnowTimer = 0;
/* Kar hemen değil, sayfa açıldıktan 5–10 dakika sonra birikmeye başlar.
   Temizlikten sonra da aynı süre yeniden beklenir; şapka sürekli tekrar etmez. */
let headSnowNextAt = 0;
let headSnowNextStepAt = 0;
const HEAD_SNOW_DELAY_MIN = 5 * 60 * 1000;
const HEAD_SNOW_DELAY_MAX = 10 * 60 * 1000;
const HEAD_SNOW_STEP_MIN = 8000;
const HEAD_SNOW_STEP_MAX = 12000;
function scheduleHeadSnow(delay) {
  headSnowNextAt = Date.now() + (delay || rand(HEAD_SNOW_DELAY_MIN, HEAD_SNOW_DELAY_MAX));
  headSnowNextStepAt = 0;
}
function setHeadSnowLevel(value) {
  headSnowLevel = clamp(value, 0, 1);
  const wrap = document.querySelector('#catMount .cat-wrap');
  if (wrap) wrap.style.setProperty('--head-snow', headSnowLevel.toFixed(2));
}
function resetHeadSnow() {
  setHeadSnowLevel(0);
  headSnowNextAt = 0;
  headSnowNextStepAt = 0;
}
function startHeadSnow() {
  if (headSnowTimer) return;
  if (!headSnowNextAt) scheduleHeadSnow();
  headSnowTimer = setInterval(() => {
    if (S.theme !== 'noel' || !snow.running) { stopHeadSnow(); return; }
    if (document.visibilityState !== 'visible') return;
    if (rewardActive) return;
    /* Odak sırasında kar birikmez: kedi başını temiz tutar. */
    if (timer && timer.running && timer.phase === 'focus') return;
    const now = Date.now();
    if (now < headSnowNextAt) return;
    /* Kar görünür biçimde birikince kedi yalnızca başını sallayarak silkeliyor.
       Eşik: şapka kafayı kaplayacak kadar dolduğunda. */
    if (headSnowLevel >= .46) {
      const wrap = document.querySelector('#catMount .cat-wrap');
      if (wrap && !wrap.classList.contains('is-snowcatch') && !wrap.classList.contains('is-feeding') && !wrap.classList.contains('is-cleaning-snow')) {
        cleanHeadSnow({ quiet: Math.random() < .35 });
      }
      return;
    }
    if (now < headSnowNextStepAt) return;
    /* Katman katman biriksin: tek karede dolu şapka belirmesin. */
    setHeadSnowLevel(headSnowLevel + rand(.055, .085));
    headSnowNextStepAt = now + rand(HEAD_SNOW_STEP_MIN, HEAD_SNOW_STEP_MAX);
  }, 1000);
}
function stopHeadSnow() {
  if (headSnowTimer) clearInterval(headSnowTimer);
  headSnowTimer = 0;
}
function cleanHeadSnow(opts = {}) {
  const wrap = document.querySelector('#catMount .cat-wrap');
  if (!wrap) { setHeadSnowLevel(0); return false; }
  if (headSnowLevel < .06) return false;
  /* Aynı sırada ikinci bir silkeleme başlamasın. */
  if (Date.now() < (cleanHeadSnow.until || 0)) return false;
  cleanHeadSnow.until = Date.now() + 1750;
  scheduleHeadSnow();
  /* Zorunlu senkron yerleştirme (void offsetWidth) yerine bir sonraki kare:
     silkeleme animasyonu aynı şekilde yeniden başlar, düzen hesaplatılmaz. */
  if (wrap.classList.contains('is-cleaning-snow')) {
    wrap.classList.remove('is-cleaning-snow');
    requestAnimationFrame(() => { if (wrap.isConnected) wrap.classList.add('is-cleaning-snow'); });
  } else {
    wrap.classList.add('is-cleaning-snow');
  }
  const r = wrap.getBoundingClientRect();
  /* Baş önce silkelensin; kar ancak hareketin hızlandığı anda kopsun. */
  const scatter = () => {
    spawnBurst(r.left + r.width * .5, r.top + r.height * .24, 12, {
      colors: ['#ffffff', '#eaf7ff', '#d8ecfb', '#ffffff'],
      speed: 5.4, gravity: .1, spread: Math.PI * 1.15, angle: -Math.PI / 2, lift: 1.6
    });
    /* Kafadan kopan iri kümeler gerçekten düşsün: toz bulutunun yanında
       yerçekimiyle dönen, birbirinden farklı boyutlarda kar parçaları. */
    const clumps = [];
    for (let i = 0; i < 6; i++) {
      const clump = document.createElement('b');
      clump.className = 'snow-clump';
      clump.setAttribute('aria-hidden', 'true');
      clump.style.left = (r.width * rand(.34, .66) - 11) + 'px';
      /* Kümeler kafanın tepesinden (kardan şapka hizasından) kopsun. */
      clump.style.top = rand(22, 52) + 'px';
      clump.style.setProperty('--sz', rand(11, 20).toFixed(1) + 'px');
      clump.style.setProperty('--dx', rand(-30, 30).toFixed(1) + 'px');
      clump.style.setProperty('--fall', rand(180, 272).toFixed(0) + 'px');
      clump.style.setProperty('--rot', (Math.random() < .5 ? -1 : 1) * rand(80, 240).toFixed(0) + 'deg');
      clump.style.setProperty('--delay', rand(.03, .5).toFixed(2) + 's');
      clump.style.setProperty('--dur', rand(.9, 1.35).toFixed(2) + 's');
      wrap.appendChild(clump);
      clumps.push(clump);
    }
    setTimeout(() => clumps.forEach((c) => c.remove()), 2400);
  };
  if (cleanHeadSnow.scatterTimer) clearTimeout(cleanHeadSnow.scatterTimer);
  cleanHeadSnow.scatterTimer = setTimeout(scatter, 360);
  /* Şapka, sallamanın ilk belirgin vuruşuyla birlikte dağılsın. */
  if (cleanHeadSnow.capTimer) clearTimeout(cleanHeadSnow.capTimer);
  cleanHeadSnow.capTimer = setTimeout(() => setHeadSnowLevel(0), 430);
  if (!opts.quiet) {
    showBubble(pick([
      'Kafamda kar birikmiş… bir silkeleyeyim!',
      'Bak, kardan şapkam vardı. Temizlendi!',
      'Tepemdeki karı silkeleyip attım.',
      'Kardan şapkamı silkeledim. Şimdi odaklanabiliriz.'
    ]), { title: S.cat.name + ' kendini temizliyor', duration: 3200 });
  }
  if (cleanHeadSnow.timer) clearTimeout(cleanHeadSnow.timer);
  cleanHeadSnow.timer = setTimeout(() => wrap.classList.remove('is-cleaning-snow'), 1750);
  return true;
}
/* ---------- odakta kar tanesi yakalama ---------- */
let focusCatchTimer = 0;
function stopFocusCatch() {
  if (focusCatchTimer) clearTimeout(focusCatchTimer);
  focusCatchTimer = 0;
}
function scheduleFocusCatch() {
  stopFocusCatch();
  focusCatchTimer = setTimeout(() => {
    focusCatchTimer = 0;
    if (!timer || !timer.running || timer.phase !== 'focus') return;
    if (S.theme !== 'noel' || rewardActive || document.visibilityState !== 'visible') { scheduleFocusCatch(); return; }
    if (Math.random() < .6) playSnowCatch();
    scheduleFocusCatch();
  }, rand(38000, 76000));
}
function playSnowCatch() {
  const wrap = document.querySelector('#catMount .cat-wrap');
  if (!wrap || rewardActive) return false;
  if (!timer || !timer.running || timer.phase !== 'focus') return false;
  if (wrap.classList.contains('is-snowcatch')) return false;
  /* is-snowcatch zaten yok (yukarıda korundu); doğrudan eklemek animasyonu
     başlatır. Eskiden burada gereksiz bir zorunlu yerleştirme vardı. */
  wrap.classList.remove('is-cleaning-snow');
  wrap.classList.add('is-snowcatch');
  setCatState('wave', { force: true });
  showBubble(pick([
    'Yakaladım! Bu kar tanesi sana şans getirsin.',
    'Bir tane daha… hop! Neredeyse kaçıyordu.',
    'Buz gibi! Ama yakalamayı başardım.',
    'Sana bir kar tanesi sakladım, avucumda eridi.',
    'Kaçtı… Bir dahaki sefere yakalayacağım.'
  ]), { title: S.cat.name + ' kar tanesi yakalıyor', duration: 3000 });
  catAfter('state', 2600, () => {
    wrap.classList.remove('is-snowcatch');
    if (!timer || !timer.running || timer.phase !== 'focus' || rewardActive) return;
    setCatState('sleep');
    scheduleFocusCat();
  });
  return true;
}
/* ---------- toast ---------- */
function toast(message, ms = 3800) {
  const stack = $('#toastStack');
  if (!stack) return;
  const el = document.createElement('div');
  el.className = 'toast';
  const dot = document.createElement('i');
  const span = document.createElement('span');
  span.textContent = t(message);
  el.append(dot, span);
  stack.appendChild(el);
  while (stack.children.length > 3) stack.firstElementChild.remove();
  setTimeout(() => el.remove(), ms + 500);
}
/* ---------- confetti & hearts ---------- */
const fx = { canvas: null, ctx: null, parts: [], raf: 0, dpr: 1, last: 0 };
function initFx() {
  fx.canvas = $('#fxCanvas');
  if (!fx.canvas) return;
  fx.ctx = fx.canvas.getContext('2d');
  resizeFx();
  window.addEventListener('resize', resizeFx, { passive: true });
}
function resizeFx() {
  if (!fx.canvas) return;
  fx.dpr = Math.min(document.documentElement.dataset.lowfx === '1' ? 1 : 1.5, window.devicePixelRatio || 1);
  fx.canvas.width = Math.floor(window.innerWidth * fx.dpr);
  fx.canvas.height = Math.floor(window.innerHeight * fx.dpr);
}
function themeColors() {
  const cs = getComputedStyle(document.documentElement);
  return [
    cs.getPropertyValue('--accent').trim() || '#ff5f9e',
    cs.getPropertyValue('--accent-2').trim() || '#a87bff',
    cs.getPropertyValue('--accent-3').trim() || '#ffb27a',
    cs.getPropertyValue('--particle').trim() || '#ff8abb',
    '#fff6fb'
  ];
}
function drawHeart(ctx, x, y, s, rot, color, alpha) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, s * .32);
  ctx.bezierCurveTo(-s * .1, s * .12, -s * .55, -s * .16, -s * .28, -s * .42);
  ctx.bezierCurveTo(-s * .08, -s * .6, 0, -s * .36, 0, -s * .22);
  ctx.bezierCurveTo(0, -s * .36, s * .08, -s * .6, s * .28, -s * .42);
  ctx.bezierCurveTo(s * .55, -s * .16, s * .1, s * .12, 0, s * .32);
  ctx.fill();
  ctx.restore();
}
function spawnBurst(x, y, count = 42, opts = {}) {
  if (!fx.ctx || perfModeOn()) return;
  const colors = Array.isArray(opts.colors) && opts.colors.length ? opts.colors : themeColors();
  const spread = opts.spread || Math.PI * 2;
  const angle0 = opts.angle != null ? opts.angle : -Math.PI / 2;
  for (let i = 0; i < count; i++) {
    const angle = angle0 + rand(-spread / 2, spread / 2);
    const speed = opts.speed ? rand(opts.speed * .4, opts.speed) : rand(4, 11);
    const shape = Math.random() < (opts.heartsOnly ? 1 : .34) ? 'heart' : (Math.random() < .25 ? 'star' : 'dot');
    fx.parts.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - (opts.lift || 0),
      g: opts.gravity != null ? opts.gravity : .16,
      size: rand(4, opts.big ? 13 : 9),
      color: pick(colors),
      shape,
      rot: rand(0, Math.PI * 2),
      vr: rand(-.18, .18),
      life: 0,
      maxLife: rand(45, 95),
      fade: rand(.012, .022)
    });
  }
  if (!fx.raf && sceneEffectsVisible()) {
    fx.last = performance.now();
    fx.raf = requestAnimationFrame(stepFx);
  }
}
function stepFx(now) {
  fx.raf = 0;
  if (!sceneEffectsVisible()) return;
  const ctx = fx.ctx;
  if (!ctx) return;
  const dt = clamp((now - fx.last) / 16.67, .4, 2.4);
  fx.last = now;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, fx.canvas.width, fx.canvas.height);
  ctx.scale(fx.dpr, fx.dpr);
  for (let i = fx.parts.length - 1; i >= 0; i--) {
    const p = fx.parts[i];
    p.vy += p.g * dt;
    p.vx *= .992;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rot += p.vr * dt;
    p.life += dt;
    const alpha = clamp(1 - Math.max(0, p.life - p.maxLife * .55) / (p.maxLife * .45), 0, 1);
    if (p.shape === 'heart') drawHeart(ctx, p.x, p.y, p.size, p.rot, p.color, alpha);
    else if (p.shape === 'star') {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.globalAlpha = alpha; ctx.fillStyle = p.color;
      ctx.beginPath();
      for (let k = 0; k < 8; k++) {
        const rr = k % 2 ? p.size * .34 : p.size;
        const a = k * Math.PI / 4 - Math.PI / 2;
        const px = Math.cos(a) * rr, py = Math.sin(a) * rr;
        if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.fill(); ctx.restore();
    } else {
      ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * .45, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    if (p.life > p.maxLife || p.y > window.innerHeight + 80 || p.x < -100 || p.x > window.innerWidth + 100) {
      fx.parts.splice(i, 1);
    }
  }
  if (fx.parts.length) fx.raf = requestAnimationFrame(stepFx);
  else { fx.raf = 0; ctx.clearRect(0, 0, fx.canvas.width, fx.canvas.height); }
}
function celebrateBurst() {
  const cx = window.innerWidth / 2;
  spawnBurst(cx, window.innerHeight * .28, 70, { speed: 12, gravity: .18, spread: Math.PI * 1.6, lift: 2 });
  setTimeout(() => {
    spawnBurst(innerWidth * .2, innerHeight * .45, 34, { speed: 8, gravity: .1, spread: Math.PI, angle: -Math.PI / 2 });
    spawnBurst(innerWidth * .8, innerHeight * .45, 34, { speed: 8, gravity: .1, spread: Math.PI, angle: -Math.PI / 2 });
  }, 180);
}
function heartBurst(x, y, n = 10) {
  spawnBurst(x, y, n, { speed: 5, gravity: -.03, spread: Math.PI * 1.25, heartsOnly: true, big: false });
}
/* ============================================================
   KEDİ — görünüm, ruh hali, miyav baloncukları
   ============================================================ */
function catAccessoryList() {
  /* Yalnızca kullanıcının seçtikleri. Tema artık kendiliğinden şapka eklemez;
     "Yok" seçiliyken kedide hiçbir aksesuar görünmez. Temaya özel şapkalar
     aksesuar çekmecesinde duruyor, isteyen oradan takabilir. */
  return (S.cat.accessories || []);
}
function catMarkup(state = 'idle', interactive = false) {
  const outfit = OUTFITS[S.cat.outfit] || OUTFITS.none;
  return `
  <div class="cat-wrap" data-state="${state}"${interactive ? ` role="button" tabindex="0" aria-label="${S.lang === 'en' ? 'Give ' + escapeHTML(S.cat.name) + ' a hug' : escapeHTML(S.cat.name) + '’ı sev'}"` : ' aria-hidden="true"'}>
    <div class="cat-halo">      </div>
    <div class="cat-shadow">      </div>
    <div class="cat3d${S.cat.collarOn ? '' : ' collar-off'}" data-breed="${S.cat.breed}" data-gender="${S.cat.gender}" data-acc="${catAccessoryList().join(' ')}" data-outfit="${escapeHTML(S.cat.outfit)}">
      <div class="cat-tilt">
        <div class="tail">      </div>
        <div class="body">
          <div class="body-pattern">      </div>
          <div class="belly">      </div>
              </div>
        <div class="outfit" data-kind="${outfit.kind}" aria-hidden="true">
          <i class="of-body"></i>
          <i class="of-collar"></i>
          <b class="of-badge"></b>
          <span class="of-extra"></span>
          <span class="of-extra2"></span>
              </div>
        <div class="head">
          <div class="ear left"><i></i>      </div>
          <div class="ear right"><i></i>      </div>
          <div class="head-base">
            <div class="face-pattern">      </div>
            <div class="forehead">      </div>
            <div class="eye left"><span class="iris"><span class="pupil"></span><span class="shine"></span></span><span class="lid"></span><span class="shut"></span><span class="lash"></span>      </div>
            <div class="eye right"><span class="iris"><span class="pupil"></span><span class="shine"></span></span><span class="lid"></span><span class="shut"></span><span class="lash"></span>      </div>
            <div class="muzzle"><span class="nose"></span><span class="mouth"></span><span class="jaw"></span><span class="lick"></span>      </div>
            <div class="cheek left">      </div>
            <div class="cheek right">      </div>
            <div class="whiskers left"><i></i><i></i><i></i>      </div>
            <div class="whiskers right"><i></i><i></i><i></i>      </div>
                </div>
          <div class="head-snow" aria-hidden="true"><i></i><i></i><i></i><i></i>      </div>
          <div class="acc acc-bow"><i></i><i></i><b></b>      </div>
          <div class="acc acc-flower"><i></i><i></i><i></i><i></i><i></i><b></b>      </div>
          <div class="acc acc-crown">      </div>
          <div class="acc acc-glasses"><i></i><b></b><s></s>      </div>
          <div class="acc acc-headphones"><i></i><b></b>      </div>
          <div class="acc acc-star">      </div>
          <div class="acc acc-santa"><b></b>      </div>
          <div class="acc acc-antlers" aria-hidden="true">
            <svg viewBox="0 0 176 86" fill="none">
              <g stroke="#8a5a34" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">
                <path d="M70 84c-5-16-9-27-18-38"/>
                <path d="M62 58c-9-3-16-10-19-20"/>
                <path d="M55 44c4-8 5-16 3-24"/>
                <path d="M52 34c-4-6-5-13-3-20"/>
                <path d="M106 84c5-16 9-27 18-38"/>
                <path d="M114 58c9-3 16-10 19-20"/>
                <path d="M121 44c-4-8-5-16-3-24"/>
                <path d="M124 34c4-6 5-13 3-20"/>
              </g>
              <g stroke="#c8945c" stroke-width="2" stroke-linecap="round" opacity=".55">
                <path d="M70 84c-5-16-9-27-18-38"/>
                <path d="M106 84c5-16 9-27 18-38"/>
              </g>
              <circle cx="63" cy="36" r="3" fill="#f4d06a"/>
              <circle cx="113" cy="36" r="3" fill="#f4d06a"/>
            </svg>
                </div>
          <div class="acc acc-nose">      </div>
          <div class="acc acc-witchhat"><i></i><b></b>      </div>
              </div>
        <div class="catch-flake f1" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
            <path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7"/>
            <path d="M9 4l3 3 3-3M9 20l3-3 3 3M5 9l4 1-1 4M19 15l-4-1 1-4M19 9l-4 1 1 4M5 15l4-1-1-4"/>
          </svg>
              </div>
        <div class="catch-flake f2" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
            <path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7"/>
            <path d="M9 4l3 3 3-3M9 20l3-3 3 3M5 9l4 1-1 4M19 15l-4-1 1-4M19 9l-4 1 1 4M5 15l4-1-1-4"/>
          </svg>
              </div>
        <div class="catch-flake f3" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
            <path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7"/>
            <path d="M9 4l3 3 3-3M9 20l3-3 3 3M5 9l4 1-1 4M19 15l-4-1 1-4M19 9l-4 1 1 4M5 15l4-1-1-4"/>
          </svg>
              </div>
        <div class="paw left"><i></i><i></i><i></i>      </div>
        <div class="paw right"><i></i><i></i><i></i><b class="paw-pen"></b>      </div>
        <div class="book" aria-hidden="true">
          <div class="book-page left"><span class="book-kicker"></span><strong class="book-title"></strong><span class="book-copy"></span>      </div>
          <div class="book-page right"><span class="book-kicker"></span><span class="book-copy"></span>      </div>
          <div class="page-flip">      </div>
          <div class="hl-line">      </div>
          <div class="book-spine">      </div>
          <i class="book-ribbon"></i>
              </div>
        <div class="yarn-toy" aria-hidden="true"><div class="yarn-ball"><i></i><i></i><i></i>      </div>      </div>
        <div class="acc acc-pumpkin" aria-hidden="true"><i></i>      </div>
        <div class="reward-bowl" aria-hidden="true">
          <div class="bowl-glow">      </div>
          <div class="bowl-shadow">      </div>
          <div class="bowl-shell">      </div>
          <div class="bowl-food">
            <i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>
            <b class="bowl-fish treat-1"></b>
            <b class="bowl-fish treat-2"></b>
            <b class="bowl-fish treat-3"></b>
                </div>
          <div class="bowl-rim">      </div>
              </div>
        <div class="reward-cocoa" aria-hidden="true">
          <div class="cocoa-shadow">      </div>
          <div class="cocoa-steam"><i></i><i></i><i></i>      </div>
          <div class="cocoa-mug"><i></i><b>♥</b>      </div>
              </div>
        <div class="reward-cauldron" aria-hidden="true">
          <div class="cauldron-glow">      </div>
          <div class="cauldron-shadow">      </div>
          <div class="cauldron-steam"><i></i><i></i><i></i>      </div>
          <div class="cauldron-pot">      </div>
          <div class="cauldron-brew"><i></i><i></i><i></i>      </div>
          <div class="cauldron-rim">      </div>
          <b class="cauldron-candy c1"></b><b class="cauldron-candy c2"></b><b class="cauldron-candy c3"></b>
              </div>
        <div class="collar">      </div>
        <div class="cat-tag"><span class="cat-name-text">${escapeHTML(S.cat.name)}</span>      </div>
        <span class="bell" aria-hidden="true"></span>
        <div class="acc acc-bandana">      </div>
        <div class="acc acc-tie"><i></i><b></b>      </div>
        <div class="acc acc-scarf"><i></i>      </div>
        <div class="acc acc-bowtie"><i></i>      </div>
        <div class="zzz" aria-hidden="true"><i>Z</i><i>z</i><i>z</i>      </div>
            </div>
          </div>
        </div>`;
}
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}
function renderCats() {
  clearCatPlay();
  const mount = $('#catMount');
  if (mount) mount.innerHTML = catMarkup(timer && timer.running && timer.phase === 'focus' ? 'sleep' : 'idle', true);
  /* Önizleme ve karşılama kedileri ilk anda görünmüyor; açıldıkları anda
     kurulur. Böylece açılışta üç ayrı kedi DOM'u yerine yalnızca biri çizilir. */
  updateCatVisuals();
  bindCatEvents();
  scheduleBlink();
  if (typeof setHeadSnowLevel === 'function') setHeadSnowLevel(headSnowLevel);
}
function ensurePreviewCat() {
  const preview = $('#previewCat');
  if (!preview || preview.firstElementChild) return;
  preview.innerHTML = catMarkup('idle', false);
  updateCatVisuals();
}
function ensureIntroCat() {
  const intro = $('#introCat');
  if (!intro || intro.firstElementChild) return;
  intro.innerHTML = catMarkup('wave', false);
  updateCatVisuals();
}
function updateCatVisuals() {
  const c = S.cat;
  const root = document.documentElement;
  root.style.setProperty('--fur', c.fur);
  root.style.setProperty('--belly', c.belly);
  root.style.setProperty('--eyes', c.eyes);
  root.style.setProperty('--patch', c.patch);
  root.style.setProperty('--patch2', c.patch2);
  root.style.setProperty('--collar', c.collar);
  root.style.setProperty('--cat-scale', c.scale.toFixed(2));
  updatePawColor();
  const previewCat = $('#previewCat .cat-wrap');
  if (previewCat) previewCat.style.transform = `translateY(5px) scale(${(0.46 + (c.scale - 0.8) * 0.2).toFixed(3)})`;
  const outfit = OUTFITS[c.outfit] || OUTFITS.none;
  $$('.cat3d').forEach((el) => {
    el.dataset.breed = c.breed;
    el.dataset.gender = c.gender;
    el.dataset.acc = catAccessoryList().join(' ');
    el.dataset.outfit = c.outfit;
    el.style.setProperty('--of-a', outfit.a || '#5b6474');
    el.style.setProperty('--of-b', outfit.b || '#3c4350');
    el.style.setProperty('--of-t', outfit.t || '#f4f6fa');
    el.style.setProperty('--of-d', outfit.d || '#d7b45e');
    el.style.setProperty('--of-pattern', outfit.pattern || 'none');
    const outfitEl = el.querySelector('.outfit');
    if (outfitEl) outfitEl.dataset.kind = outfit.kind || 'none';
    if (c.collarOn) el.classList.remove('collar-off'); else el.classList.add('collar-off');
  });
  $$('.cat-name-text').forEach((el) => { el.textContent = c.name; });
  const stageName = $('#stageName');
  const perchName = $('#perchName');
  const previewName = $('#previewName');
  if (stageName) stageName.textContent = c.name;
  if (perchName) perchName.textContent = c.name;
  if (previewName) previewName.textContent = c.name;
  const brandName = $('#brandName');
  if (brandName) brandName.textContent = c.name;
  const introName = $('#introName');
  if (introName) introName.textContent = c.name;
  const brandKey = [c.breed, c.fur, c.belly, c.eyes, c.patch, c.patch2, c.collar, c.collarOn].join('|');
  if (brandKey !== lastBrandFaceKey) {
    lastBrandFaceKey = brandKey;
    const face = $('#brandFace');
    if (face) face.innerHTML = brandFaceSVG();
  }
  updateBookIdentity();
  const b = $('#catBubble');
  const bubbleTitle = $('#bubbleTitle');
  if (bubbleTitle && b) {
    const wrap = $('#catMount .cat-wrap');
    const reading = wrap && wrap.dataset.state === 'read' && b.dataset.mode === 'read';
    bubbleTitle.textContent = reading ? readingBubbleTitle() : c.name;
  }
  updateCatSummary();
  updateStageMeta();
  const nameInput = $('#catNameInput');
  if (nameInput && document.activeElement !== nameInput) nameInput.value = c.name;
  const scaleRange = $('#catScaleRange');
  if (scaleRange) {
    const pct = Math.round(c.scale * 100);
    if (document.activeElement !== scaleRange) scaleRange.value = String(pct);
    scaleRange.style.setProperty('--fill', ((pct - 80) / 40 * 100).toFixed(1) + '%');
    const scaleVal = $('#catScaleVal');
    if (scaleVal) scaleVal.textContent = pct + '%';
  }
  if (typeof updateDocumentTitle === 'function') updateDocumentTitle();
}
let lastBrandFaceKey = '';
/* Kedi özeti ve marka etiketi dil değişince de tazelenir. */
function updateCatSummary() {
  const c = S.cat;
  const previewMeta = $('#previewMeta');
  if (previewMeta) previewMeta.textContent = `${t(BREEDS[c.breed].label)} · ${t(GENDERS[c.gender])} · ${accessorySummary(1)}`;
  const brand = $('#brandBtn');
  if (brand) brand.setAttribute('aria-label', S.lang === 'en' ? `Open ${c.name} settings` : `${c.name} ayarlarını aç`);
}
function accessorySummary(limit = 0) {
  const list = S.cat.accessories || [];
  if (!list.length) return t('aksesuarsız');
  const labels = list.map((k) => t(ACCESSORIES[k])).filter(Boolean);
  if (limit && labels.length > limit) return labels.slice(0, limit).join(' · ') + ` +${labels.length - limit}`;
  return labels.join(' · ');
}
function brandFaceSVG() {
  const c = S.cat;
  const fur = c.fur, belly = c.belly, eyes = c.eyes, patch = c.patch, patch2 = c.patch2;
  const whisker = relativeLuminance(fur) > .65 ? 'rgba(60,42,50,.55)' : 'rgba(255,255,255,.6)';
  let marks = '';
  if (['tekir', 'sarman', 'bengal'].includes(c.breed)) {
    marks = `<g stroke="${patch2}" stroke-width="2" stroke-linecap="round" opacity=".55"><path d="M24 13.6v6"/><path d="M17.4 16.4 19 22"/><path d="M30.6 16.4 29 22"/></g>`;
  } else if (c.breed === 'siyam') {
    marks = `<ellipse cx="24" cy="30" rx="9" ry="7.5" fill="${patch}" opacity=".92"/>`;
  } else if (c.breed === 'van') {
    marks = `<path d="M24 13.4c4 0 6.4 2.2 6.4 4.6 0 1.8-2 2.6-6.4 2.6s-6.4-.8-6.4-2.6c0-2.4 2.4-4.6 6.4-4.6Z" fill="${patch}" opacity=".85"/>`;
  } else if (c.breed === 'calico') {
    marks = `<path d="M16 16.5c2.5-3 6-3.6 8 0-2 3-5 3.5-8 0Z" fill="${patch}" opacity=".9"/><path d="M32 16.5c-2.5-3-6-3.6-8 0 2 3 5 3.5 8 0Z" fill="${patch2}" opacity=".9"/>`;
  } else if (c.breed === 'tuxedo') {
    marks = `<path d="M24 13.4c2.6 0 4.2 2.4 4.2 5.2 0 2.6-1.6 4.6-4.2 6.6-2.6-2-4.2-4-4.2-6.6 0-2.8 1.6-5.2 4.2-5.2Z" fill="${belly}" opacity=".95"/>`;
  } else if (c.breed === 'bombay') {
    marks = `<ellipse cx="24" cy="36" rx="10" ry="7" fill="#000" opacity=".2"/>`;
  } else if (c.breed === 'rus') {
    marks = `<ellipse cx="24" cy="36" rx="10" ry="7" fill="#fff" opacity=".09"/>`;
  } else if (c.breed === 'angora' || c.breed === 'persian') {
    marks = `<path d="M12 37c2-2 4-2 6 0M30 37c2-2 4-2 6 0" stroke="${patch}" stroke-width="2" opacity=".35" stroke-linecap="round"/>`;
  }
  const collar = c.collarOn
    ? `<path d="M12 39c4 2.4 20 2.4 24 0" stroke="${c.collar}" stroke-width="3.2" stroke-linecap="round"/><circle cx="24" cy="41.6" r="2.2" fill="#ffd45e" stroke="#b57a1c" stroke-width=".6"/>`
    : '';
  return `<svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
    <defs><clipPath id="brandFaceClip"><path d="M24 46c-10.5 0-17.6-7.4-17.6-17.2C6.4 18.6 14.4 11 24 11s17.6 7.6 17.6 17.8C41.6 38.6 34.5 46 24 46Z"/></clipPath></defs>
    <path d="M8.6 21 6 6.8 19 14.6Z" fill="${fur}"/>
    <path d="M39.4 21 42 6.8 29 14.6Z" fill="${fur}"/>
    <path d="M10.8 17.2 9.4 10.2 15.8 14.2Z" fill="${patch}" opacity=".55"/>
    <path d="M37.2 17.2 38.6 10.2 32.2 14.2Z" fill="${patch}" opacity=".55"/>
    <path d="M24 46c-10.5 0-17.6-7.4-17.6-17.2C6.4 18.6 14.4 11 24 11s17.6 7.6 17.6 17.8C41.6 38.6 34.5 46 24 46Z" fill="${fur}"/>
    <g clip-path="url(#brandFaceClip)">${marks}</g>
    <ellipse cx="24" cy="35.4" rx="9.2" ry="6.8" fill="${belly}" opacity=".92"/>
    <ellipse cx="18.1" cy="28.2" rx="3.5" ry="4" fill="${eyes}"/>
    <ellipse cx="29.9" cy="28.2" rx="3.5" ry="4" fill="${eyes}"/>
    <ellipse cx="18.1" cy="28.4" rx="1.25" ry="3.1" fill="#221b20"/>
    <ellipse cx="29.9" cy="28.4" rx="1.25" ry="3.1" fill="#221b20"/>
    <circle cx="17.2" cy="26.8" r=".9" fill="#fff" opacity=".9"/>
    <circle cx="29" cy="26.8" r=".9" fill="#fff" opacity=".9"/>
    <path d="M22.6 33.2h2.8L24 34.8Z" fill="#d97c96"/>
    <path d="M24 34.8v1.1M24 35.9c-.9.9-2.1.9-3 0M24 35.9c.9.9 2.1.9 3 0" stroke="#5a3b45" stroke-width=".9" stroke-linecap="round"/>
    <path d="M12.5 32.2 4.8 30.4M12.8 34.4 5 35.8M35.5 32.2l7.7-1.8M35.2 34.4l7.8 1.4" stroke="${whisker}" stroke-width=".9" stroke-linecap="round"/>
    ${collar}
  </svg>`;
}
function relativeLuminance(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || ''));
  if (!m) return .5;
  const n = parseInt(m[1], 16);
  const channel = (v) => {
    const s = v / 255;
    return s <= .03928 ? s / 12.92 : Math.pow((s + .055) / 1.055, 2.4);
  };
  return .2126 * channel((n >> 16) & 255) + .7152 * channel((n >> 8) & 255) + .0722 * channel(n & 255);
}
function updatePawColor() {
  const c = S.cat;
  const base = c.breed === 'siyam' ? c.patch : c.belly;
  const lum = relativeLuminance(base);
  const darkMode = resolveMode() === 'dark';
  let paw = base;
  if (darkMode && lum < .3) paw = '#f4efe8';
  else if (!darkMode && lum > .74) paw = '#30282d';
  const root = document.documentElement;
  root.style.setProperty('--paw', paw);
  root.style.setProperty('--paw-line', relativeLuminance(paw) > .6 ? 'rgba(48,34,40,.42)' : 'rgba(255,255,255,.5)');
}
function moodLabel(state) {
  const mood = { idle: 'meraklı', sleep: 'uyuyor', read: 'okuyor', happy: 'mutlu', wave: 'selam veriyor', stretch: 'geriniyor', play: 'tüy yumağıyla oynuyor', lonely: 'seni bekliyor' };
  return t(mood[state] || 'meraklı');
}
function currentCatState() {
  const wrap = cachedEl('#catMount .cat-wrap');
  return wrap ? wrap.dataset.state : 'idle';
}
function updateStageMeta() {
  const stageMeta = $('#stageMeta');
  if (stageMeta) {
    stageMeta.textContent = rewardActive
      ? `${t(BREEDS[S.cat.breed].label)} · ${t(rewardLabel())}`
      : `${t(BREEDS[S.cat.breed].label)} · ${moodLabel(currentCatState())}`;
  }
}
let blinkTimer = 0;
function scheduleBlink() {
  clearTimeout(blinkTimer);
  blinkTimer = setTimeout(() => {
    const wrap = cachedEl('#catMount .cat-wrap');
    if (wrap && !['sleep', 'happy'].includes(wrap.dataset.state) && document.visibilityState === 'visible') {
      wrap.classList.add('is-blinking');
      setTimeout(() => wrap.classList.remove('is-blinking'), 150);
      /* Kediler sık sık iki kez üst üste kırpar; tek kırpma robotik duruyordu. */
      if (Math.random() < .38) {
        setTimeout(() => {
          if (wrap.isConnected && !['sleep', 'happy'].includes(wrap.dataset.state) && document.visibilityState === 'visible') {
            wrap.classList.add('is-blinking');
            setTimeout(() => wrap.classList.remove('is-blinking'), 130);
          }
        }, 300);
      }
    }
    scheduleBlink();
  }, rand(2900, 6600));
}
/* eye / head follow — fare olan her cihazda çalışır, ~30 fps ile hafif kalır */
let lookRaf = 0, lookLast = 0, lookTimer = 0;
let lookX = window.innerWidth / 2, lookY = window.innerHeight / 2;
let lookRect = null, lookRectAt = 0;
let lookCat = null, lookTilt = null, lookIris = null;
function refreshLookRect() {
  const cat = $('#catMount .cat3d');
  lookRect = cat ? cat.getBoundingClientRect() : null;
  lookRectAt = performance.now();
  if (cat !== lookCat || !lookTilt) {
    lookCat = cat || null;
    lookTilt = cat ? cat.querySelector('.cat-tilt') : null;
    lookIris = cat ? cat.querySelectorAll('.iris') : null;
  }
}
function resetCatLook() {
  cancelAnimationFrame(lookRaf);
  clearTimeout(lookTimer);
  lookRaf = lookTimer = 0;
  lookRect = null;
  const tilt = $('#catMount .cat-tilt');
  if (tilt) tilt.style.removeProperty('transform');
  for (const iris of $$('#catMount .iris')) {
    iris.style.removeProperty('--ex');
    iris.style.removeProperty('--ey');
  }
}
/* Kedi herhangi bir eylem yaparken (ödül, kar yakalama, dürtülme, mırlama, uyku, okuma, dalga...) imleci takip etmez. */
const LOOK_BUSY = ['is-reward', 'is-dropping', 'is-feeding', 'is-sipping', 'is-stirring', 'is-closing', 'is-snowcatch', 'is-cleaning-snow', 'is-cold', 'is-poked', 'is-purring', 'is-noting'];
let lookDirty = false;
function catBusy() {
  if (rewardActive) return true;
  const wrap = cachedEl('#catMount .cat-wrap');
  if (!wrap) return false;
  if (wrap.dataset.state && wrap.dataset.state !== 'idle') return true;
  for (let i = 0; i < LOOK_BUSY.length; i++) if (wrap.classList.contains(LOOK_BUSY[i])) return true;
  return false;
}
function applyLook() {
  if (catBusy()) { if (lookDirty) { lookDirty = false; resetCatLook(); } return; }
  const now = performance.now();
  lookLast = now;
  if (!lookRect || now - lookRectAt > 400) refreshLookRect();
  const r = lookRect;
  if (!lookCat || !r || !r.width) return;
  const nx = clamp((lookX - (r.left + r.width / 2)) / (r.width * .9), -1, 1);
  const ny = clamp((lookY - (r.top + r.height * .35)) / (r.height * .8), -1, 1);
  /* Eskiden bu değerler kedinin köküne yazılıyordu: her karede tüm kedi alt ağacı (~60 eleman)
     yeniden hesaplanıyordu. Artık yalnızca gerçekten kullanan elemanlar değişiyor. */
  lookDirty = true;
  if (lookTilt) lookTilt.style.transform = 'rotateY(' + (nx * 5.2).toFixed(2) + 'deg) rotateX(' + (-ny * 4.2).toFixed(2) + 'deg)';
  if (lookIris) {
    const ex = (nx * 3.4).toFixed(2), ey = (ny * 2.6).toFixed(2);
    for (let i = 0; i < lookIris.length; i++) {
      lookIris[i].style.setProperty('--ex', ex);
      lookIris[i].style.setProperty('--ey', ey);
    }
  }
}
window.addEventListener('pointermove', (e) => {
  if (e.pointerType === 'touch') return;
  if (catBusy()) { if (lookDirty) { lookDirty = false; resetCatLook(); } return; }
  /* Panel veya karşılama açıkken kedi zaten örtülü: boşuna katman
     dönüşümü yazıp arka planda boyama tetiklemesin. */
  const introEl = cachedEl('#intro');
  if (document.body.classList.contains('sheet-open') || document.body.classList.contains('about-open') || document.body.classList.contains('contact-open') || document.body.classList.contains('account-open') || document.body.classList.contains('privacy-open') || (introEl && introEl.classList.contains('open'))) return;
  lookX = e.clientX; lookY = e.clientY;
  if (lookRaf) return;
  lookRaf = requestAnimationFrame(() => {
    lookRaf = 0;
    const now = performance.now();
    /* Göz takibi için ~25 fps yeterli; aradaki fark .25s/.5s geçişler zaten yumuşatıyor. */
    if (now - lookLast < 40) {
      clearTimeout(lookTimer);
      lookTimer = setTimeout(applyLook, 45);
      return;
    }
    applyLook();
  });
}, { passive: true });
window.addEventListener('resize', () => { lookRect = null; }, { passive: true });
window.addEventListener('scroll', () => { lookRect = null; }, { passive: true });
/* ---------- bubble ---------- */
let bubbleTimer = 0, typedTimer = 0, wordTimer = 0, caretTimer = 0, bubbleEpoch = 0;
const bubble = () => $('#catBubble');
function clearBubbleTimers() {
  /* Her temizlemede sürüm artar: bekleyen rAF geri çağırmaları
     eski balonun .show durumunu yanlışlıkla geri getiremez. */
  bubbleEpoch++;
  clearTimeout(bubbleTimer);
  clearInterval(typedTimer);
  clearInterval(wordTimer);
  clearTimeout(caretTimer);
}
function hideBubble() {
  clearBubbleTimers();
  const b = bubble();
  if (b) b.classList.remove('show');
}
function showBubble(text, opts = {}) {
  const b = bubble();
  if (!b) return;
  clearBubbleTimers();
  b.dataset.mode = opts.mode || 'text';
  const msg = t(text);
  const title = $('#bubbleTitle');
  if (title) {
    if (!opts.title) title.textContent = S.cat.name;
    else {
      /* "Vespır kendini temizliyor" gibi başlıklarda yalnızca eki çevir;
         kullanıcının kediye verdiği ad olduğu gibi kalsın. */
      const raw = String(opts.title);
      if (S.lang === 'en' && raw.indexOf(S.cat.name + ' ') === 0) {
        const rest = raw.slice(S.cat.name.length + 1).trim();
        title.textContent = S.cat.name + (rest ? ' ' + t(rest) : '');
      } else {
        title.textContent = t(raw);
      }
    }
  }
  const txt = $('#bubbleText');
  if (!txt) return;
  b.classList.add('show');
  if (opts.typing && !perfModeOn()) {
    txt.textContent = '';
    let i = 0;
    const caret = document.createElement('span');
    caret.className = 'caret';
    txt.appendChild(caret);
    typedTimer = setInterval(() => {
      i++;
      caret.remove();
      txt.textContent = msg.slice(0, i);
      txt.appendChild(caret);
      if (i >= msg.length) {
        clearInterval(typedTimer);
        caretTimer = setTimeout(() => { const c = $('.caret', txt); if (c) c.remove(); }, 1600);
      }
    }, 23);
  } else {
    txt.textContent = msg;
  }
  /* Kimse okumadan balon kapanmasın: metin uzunluğuna göre en az süre. */
  const readable = Math.min(9000, 2800 + String(msg).length * 62);
  bubbleTimer = setTimeout(hideBubble, Math.max(opts.duration || 4600, readable));
}
function showReadingBubble(duration = 14000) {
  const b = bubble();
  if (!b) return;
  clearBubbleTimers();
  b.dataset.mode = 'read';
  const title = $('#bubbleTitle');
  if (title) title.textContent = readingBubbleTitle();
  const words = $('#bubbleWords');
  if (!words) return;
  const spans = $$('span', words);
  let lastLine = '';
  const nextLine = () => {
    let text = '';
    for (let i = 0; i < 6; i++) {
      text = Math.random() < .24
        ? pick(bookMeows())
        : pick(bookLines());
      if (text !== lastLine) break;
    }
    lastLine = text;
    return text;
  };
  const paint = (el, text) => {
    const shown = t(text);
    el.textContent = shown;
    const meow = /^(miyav|mrrp|prr|mırnav|meow|mrr|purr|hiss|hırr)/i.test(shown);
    el.classList.toggle('meow-line', meow);
    el.classList.toggle('read-line', !meow);
  };
  spans.forEach((sp) => paint(sp, nextLine()));
  b.classList.add('show');
  wordTimer = setInterval(() => {
    const last = spans[spans.length - 1];
    for (let i = 0; i < spans.length - 1; i++) {
      spans[i].textContent = spans[i + 1].textContent;
      spans[i].className = spans[i + 1].className.replace(' pop', '');
    }
    paint(last, nextLine());
    last.classList.remove('pop');
    const ep = bubbleEpoch;
    requestAnimationFrame(() => { if (ep === bubbleEpoch) last.classList.add('pop'); });
  }, rand(3300, 4800));
  bubbleTimer = setTimeout(hideBubble, duration);
  b.classList.remove('show');
  const ep = bubbleEpoch;
  requestAnimationFrame(() => {
    if (ep !== bubbleEpoch || !b.isConnected) return;
    b.classList.add('show');
  });
}
/* ============================================================
   ODAK ÖDÜLÜ — 5 saniyelik mama sahnesi
   0.00–0.50  kase yukarıdan süzülür
   0.50–2.50  “Sen olmasaydın ben aç kalırdım”
   1.50–4.50  kafa eğilir, mama ve balıklar azalır
   4.50–5.00  kase ve balon kapanır, kedi normal duruşuna döner
   Zaman çizelgesi tek yerde; kedi FSM'iyle çakışmaması için ayrı
   zamanlayıcılar kullanılır ve her adım bir sürüm numarasıyla korunur.
   ============================================================ */
const REWARD_MS = 5000;
let rewardActive = false;
let rewardEpoch = 0;
const rewardTimers = [];
function clearRewardTimers() {
  while (rewardTimers.length) clearTimeout(rewardTimers.pop());
}
function rewardAfter(delay, fn) {
  const epoch = rewardEpoch;
  rewardTimers.push(setTimeout(() => {
    if (!rewardActive || epoch !== rewardEpoch) return;
    fn();
  }, Math.max(0, delay)));
}
/* Temaya göre ödül sahnesi: Noel'de sıcak çikolata, Cadılar Bayramı'nda
   şeker kazanı, diğer temalarda mama kabı. */
function rewardMode() {
  if (S.theme === 'noel') return 'cocoa';
  if (S.theme === 'halloween') return 'cauldron';
  return 'bowl';
}
function rewardLabel() {
  const mode = rewardMode();
  if (mode === 'cocoa') return 'sıcak çikolata içiyor';
  if (mode === 'cauldron') return 'ikramları topluyor';
  return 'mama yiyor';
}
function stopFocusReward() {
  rewardActive = false;
  rewardEpoch++;
  clearRewardTimers();
  const wrap = $('#catMount .cat-wrap');
  if (wrap) {
    wrap.classList.remove('is-reward', 'is-dropping', 'is-feeding', 'is-sipping', 'is-stirring', 'is-closing', 'bite-1', 'bite-2', 'bite-3');
    wrap.removeAttribute('data-reward');
    const b = $('#catBubble');
    if (b && b.dataset.mode === 'reward') hideBubble();
  }
  const btn = $('#startBtn');
  if (btn) { btn.disabled = false; btn.removeAttribute('aria-busy'); }
  if (typeof syncTimerChrome === 'function') syncTimerChrome();
  /* Ödül iptal edilirse (sıfırla/sekme değişimi) notlar eski hâline döner. */
  if (typeof updatePerch === 'function') updatePerch();
  if (typeof updateStageMeta === 'function') updateStageMeta();
}
function playFocusReward(onDone) {
  if (perfModeOn()) return false;
  const wrap = $('#catMount .cat-wrap');
  if (!wrap) return false;
  if (rewardActive) stopFocusReward();
  rewardActive = true;
  resetCatLook();
  rewardEpoch++;
  clearRewardTimers();
  stopFocusCatch();
  wrap.classList.remove('is-dropping', 'is-feeding', 'is-sipping', 'is-stirring', 'is-closing', 'bite-1', 'bite-2', 'bite-3', 'is-snowcatch', 'is-cleaning-snow');
  const mode = rewardMode();
  wrap.dataset.reward = mode;
  wrap.classList.add('is-reward');
  /* Fısıltıyla uyuyan kediyi sahne başlarken uyandır; mutlu yüz 0.46'da gelir. */
  setCatState('idle', { force: true });
  /* Beş saniyelik sahne boyunca başlat düğmesi beklemede olduğunu söyler. */
  syncTimerChrome();
  updatePerch();
  updateStageMeta();
  /* Mobilde sahne yukarı kaydıysa kutlama görünür kalsın diye başa dön. */
  if (window.matchMedia('(max-width: 900px)').matches) {
    const stage = $('#catStage');
    if (stage && stage.getBoundingClientRect().top < 40) {
      try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { window.scrollTo(0, 0); }
    }
  }
  const happyLine = mode === 'cocoa'
    ? 'Bu sıcak çikolata senin sayende!'
    : mode === 'cauldron'
      ? 'Cadılar Bayramı ikramları! Hepsi benim.'
      : 'Sen olmasaydın ben aç kalırdım';
  const happyTitle = mode === 'cocoa'
    ? S.cat.name + ' sıcak çikolata içiyor'
    : mode === 'cauldron'
      ? S.cat.name + ' ikramları topluyor'
      : S.cat.name + ' çok mutlu';
  rewardAfter(460, () => {
    setCatState('happy', { force: true });
    showBubble(happyLine, {
      title: happyTitle,
      duration: 2000,
      mode: 'reward'
    });
  });
  if (mode === 'bowl') {
    rewardAfter(1500, () => wrap.classList.add('is-feeding'));
    rewardAfter(2200, () => wrap.classList.add('bite-1'));
    rewardAfter(3100, () => wrap.classList.add('bite-2'));
    rewardAfter(3900, () => wrap.classList.add('bite-3'));
  } else if (mode === 'cocoa') {
    rewardAfter(1300, () => wrap.classList.add('is-sipping'));
  } else {
    rewardAfter(1300, () => wrap.classList.add('is-stirring'));
  }
  rewardAfter(2500, hideBubble);
  rewardAfter(4500, () => {
    wrap.classList.remove('is-feeding', 'is-sipping', 'is-stirring');
    wrap.classList.add('is-closing');
  });
  rewardAfter(REWARD_MS, () => {
    stopFocusReward();
    setCatState('idle', { force: true });
    updatePerch();
    if (typeof onDone === 'function') onDone();
  });
  return true;
}
function catContextLines(now = new Date()) {
  const hour = now.getHours();
  if (S.lang === 'en') {
    const out = [];
    if (hour >= 5 && hour < 8) out.push('Waking up before sunrise takes courage, well done!', 'Even a small step in the morning quiet is precious.', 'We’re early today. I’m warming my paws along with yours.', 'The city hasn’t woken up yet; this calm is our advantage.');
    else if (hour >= 8 && hour < 12) out.push('Good morning! A new page, a new beginning.', 'Morning is here and our corner is ready. So are you.', 'I imagined the smell of coffee; now it’s your plan’s turn.', 'Morning hours are your mind’s golden age; let’s not waste them.');
    else if (hour >= 12 && hour < 18) out.push('A little breathing break in the middle of the day feels good.', 'The day keeps going outside; here we have a calm corner.', 'The afternoon weight sets in, but one round will scatter it.', 'Unfinished tasks are waiting for you; shall we take a look together?');
    else if (hour >= 18 && hour < 21) out.push('Evening has come, and we have a warm corner inside.', 'Let the day’s rush stay behind. Now let’s make some time for ourselves.', 'The lights are soft and the pace has slowed; evening focus is precious.', 'Before the day ends, you owe yourself a little round of thanks.');
    else out.push('It’s dark outside, and we have a warm corner inside.', 'The night has gone quiet. No rush, I’m right here.', 'The city has fallen asleep; our little goal is still awake.', 'Night workers share a quiet kinship; welcome.');
    if (hour >= 21 || hour < 5) out.push('The stars are shining, and so are you.', 'In the quiet of night, paws are soft and dreams are big.', 'Even in the dark, your small steps glisten.', 'Midnight goals grow quietly; so will yours.');
    else if (html.dataset.mode === 'dark') out.push('Dark theme, bright ideas… A lovely pair.', 'The screen is dim, the mind is clear. Focusing in this light feels special.');
    if (now.getDay() === 0 || now.getDay() === 6) out.push('It’s the weekend; we can slow down a little.', 'Paws rest on weekends too. Leave yourself some space.', 'No rush today. One small step, then a lovely break.', 'The taste of the weekend hides in well-earned breaks.');
    return out;
  }
  const lines = [];
  if (hour >= 5 && hour < 8) {
    lines.push('Güneş doğmadan uyanmak cesaret ister, tebrikler!', 'Sabahın sessizliğinde küçük bir adım bile çok kıymetli.', 'Erkenciyiz bugün. Patilerimi seninle birlikte ısıtıyorum.', 'Şehir daha uyanmadı; bu sakinlik bizim avantajımız.');
  } else if (hour >= 8 && hour < 12) {
    lines.push('Günaydın! Yeni bir sayfa, yeni bir başlangıç.', 'Sabah olmuş, köşemiz güne hazır. Sen de hazırsın.', 'Kahve kokusu hayal ettim; şimdi sıra senin planında.', 'Sabah saatleri zihnin altın çağıdır; boşa harcamayalım.');
  } else if (hour >= 12 && hour < 18) {
    lines.push('Günün ortasında küçük bir nefes molası iyi gelir.', 'Dışarıda gün devam ediyor; burada sakin bir köşemiz var.', 'Öğle sonu ağırlığı çöker ama bir tur onu dağıtır.', 'Yarım kalan işler seni bekliyor; birlikte göz atalım mı?');
  } else if (hour >= 18 && hour < 21) {
    lines.push('Akşam olmuş, içeride sıcak bir köşemiz var.', 'Günün telaşı geride kalsın. Şimdi biraz kendimize zaman ayıralım.', 'Işıklar yumuşadı, tempo yavaşladı; akşam odakları kıymetlidir.', 'Günü bitirmeden kendine bir teşekkür turu borçlusun.');
  } else {
    lines.push('Dışarıda hava kararmış, içeride sıcak bir köşemiz var.', 'Gece sessizleşti. Acelemiz yok, ben yanındayım.', 'Şehir uykuya daldı; bizim küçük hedefimiz hâlâ uyanık.', 'Gece çalışanların sessiz bir kardeşliği vardır; hoş geldin.');
  }
  if (hour >= 21 || hour < 5) {
    lines.push('Yıldızlar parlıyor, sen de parlıyorsun.', 'Gecenin sessizliğinde patiler yumuşak, hayaller kocaman.', 'Karanlıkta bile attığın küçük adımlar ışıldıyor.', 'Gece yarısı hedefleri sessizce büyür; seninki de öyle.');
  } else if (html.dataset.mode === 'dark') {
    lines.push('Karanlık tema, aydınlık fikirler... Güzel bir ikili.', 'Ekran loş, zihin berrak. Bu ışıkta çalışmak ayrı keyif.');
  }
  if (now.getDay() === 0 || now.getDay() === 6) {
    lines.push('Bugün hafta sonu, biraz daha yavaşlayabiliriz.', 'Hafta sonu patiler de dinlenir. Kendine biraz alan bırak.', 'Bugün acelemiz yok. Küçük bir adım, sonra güzel bir mola.', 'Hafta sonunun tadı, hak edilmiş molalarda saklı.');
  }
  return lines;
}
function catRhythmProfile() {
  /* Okuma sahnesi ~30 saniye sürer: kitap açık kalır, balon satır satır akar. */
  return { read: [28000, 32000], first: 14000 };
}
/* Bir sonraki dakika başına kalan süre. Kedi her dakikada bir uyanıp okur;
   sayaç gibi duvar saatine hizalanır, sekme arkada kalsa bile kaymaz. */
function msToNextMinute() {
  return Math.max(1200, 60000 - (Date.now() % 60000) + 90);
}
/* ---------- kedi davranışı: animasyon durum makinesi ----------
   Her durum değişikliği tek kapıdan (setCatState) geçer. Gecikmeli işler
   bir "nesil" (epoch) damgası taşır: faz değişince eski işler kendiliğinden
   düşer; uyuma, uyanma, okuma ve miyavlama animasyonları üst üste binmez.
   Durumlar en az CAT_MIN_HOLD kadar ekranda kalır; CSS geçişi bitmeden
   yeni durum yazılmaz, kedi parçaları bozulmaz. Kullanıcı eylemleri
   (sevme, miyavlat) bu bekleme kuyruğunu atlar, anında yanıt verir. */
const CAT_MIN_HOLD = 620;
let catEpoch = 0;
let catStateAt = -1e9;
let lastMeowAt = 0;
const catTimers = { sleep: 0, read: 0, play: 0, idle: 0, greet: 0, state: 0, note: 0 };
const catPlayAnimations = [];
let lastCatPlay = -1;
let lastYarnColor = -1;
const YARN_COLORS = [
  { name: 'Krem', hi: '#fff1de', mid: '#dfa978', lo: '#a96d53', thread: 'rgba(224,185,145,.75)', shade: 'rgba(87,47,33,.22)' },
  { name: 'Pembe', hi: '#ffe3ee', mid: '#f08bb0', lo: '#b84b78', thread: 'rgba(246,160,195,.78)', shade: 'rgba(110,30,62,.24)' },
  { name: 'Nane yeşili', hi: '#e6fff4', mid: '#7fd4ad', lo: '#3f8f6d', thread: 'rgba(140,220,185,.78)', shade: 'rgba(25,80,58,.24)' },
  { name: 'Lavanta', hi: '#f1e9ff', mid: '#ad92e8', lo: '#6f54aa', thread: 'rgba(190,170,240,.78)', shade: 'rgba(55,35,100,.24)' },
  { name: 'Gök mavisi', hi: '#e5f4ff', mid: '#77b6ea', lo: '#3d74a8', thread: 'rgba(140,195,240,.78)', shade: 'rgba(25,60,100,.24)' },
  { name: 'Limon sarısı', hi: '#fffbe0', mid: '#f1d35c', lo: '#b28d22', thread: 'rgba(245,220,120,.8)', shade: 'rgba(100,75,10,.22)' },
  { name: 'Mercan', hi: '#ffe8e0', mid: '#f3866b', lo: '#b04b36', thread: 'rgba(248,160,135,.78)', shade: 'rgba(110,40,25,.24)' },
  { name: 'Turkuaz', hi: '#e0fbfb', mid: '#5cc8c6', lo: '#2b8584', thread: 'rgba(120,215,212,.78)', shade: 'rgba(15,75,75,.24)' },
  { name: 'Kiraz', hi: '#ffe1e4', mid: '#e35d6e', lo: '#9c2a3c', thread: 'rgba(240,130,145,.78)', shade: 'rgba(95,15,30,.26)' },
  { name: 'Mandalina', hi: '#fff0dc', mid: '#f6a54a', lo: '#b8661a', thread: 'rgba(250,190,120,.8)', shade: 'rgba(110,55,10,.24)' }
];
function paintYarnColor(wrap) {
  const ball = $('.yarn-ball', wrap);
  if (!ball) return YARN_COLORS[0];
  const index = lastYarnColor < 0 ? randInt(0, YARN_COLORS.length - 1) : (lastYarnColor + randInt(1, YARN_COLORS.length - 1)) % YARN_COLORS.length;
  lastYarnColor = index;
  const color = YARN_COLORS[index];
  ball.style.setProperty('--yarn-hi', color.hi);
  ball.style.setProperty('--yarn-mid', color.mid);
  ball.style.setProperty('--yarn-lo', color.lo);
  ball.style.setProperty('--yarn-thread', color.thread);
  ball.style.setProperty('--yarn-shade', color.shade);
  return color;
}
function clearCatPlay() {
  while (catPlayAnimations.length) catPlayAnimations.pop().cancel();
  const wrap = $('#catMount .cat-wrap');
  if (wrap && wrap.hasAttribute('data-play')) wrap.removeAttribute('data-play');
}
function clearCatSchedules() {
  for (const key in catTimers) {
    if (catTimers[key]) clearTimeout(catTimers[key]);
    catTimers[key] = 0;
  }
}
function catReset() {
  clearCatPlay();
  catEpoch++;
  clearCatSchedules();
  const wrap = $('#catMount .cat-wrap');
  if (wrap) wrap.classList.remove('is-cleaning-snow', 'is-snowcatch');
}
function catAfter(slot, delay, fn) {
  if (catTimers[slot]) clearTimeout(catTimers[slot]);
  const epoch = catEpoch;
  catTimers[slot] = setTimeout(() => {
    catTimers[slot] = 0;
    if (epoch !== catEpoch) return;
    fn();
  }, Math.max(0, delay));
}
function setCatState(state, opts = {}) {
  const wrap = $('#catMount .cat-wrap');
  if (!wrap) return;
  if (state !== 'play') clearCatPlay();
  if (wrap.dataset.state === state) {
    return;
  }
  const now = performance.now();
  const wait = CAT_MIN_HOLD - (now - catStateAt);
  if (!opts.force && wait > 0) {
    /* Bekleme bitince uygula; arada yeni istek gelirse son istek kazanır. */
    catAfter('state', wait, () => setCatState(state, { ...opts, force: true }));
    return;
  }
  if (catTimers.state) { clearTimeout(catTimers.state); catTimers.state = 0; }
  wrap.dataset.state = state;
  if (['sleep', 'read', 'play'].includes(state)) resetCatLook();
  if (state !== 'read') clearHighlight();
  catStateAt = now;
  updateStageMeta();
  updateCatSummary();
  updatePerch();
}
/* Fosforlu kalem: her seferinde başka bir renk seçilir, çizgi patinin
   altında soldan sağa doğru ilerler. Yalnızca transform/opacity oynar. */
const HIGHLIGHT_COLORS = ['#ffe066', '#8ee6a8', '#ff9ec4', '#8fd4ff', '#c9a7ff', '#ffb36b'];
/* Fosforlu kalem rengi de temaya uyar: Cadılar Bayramı'nda zehirli yeşil/kan/kehribar,
   Noel'de şenlikli kırmızı/yeşil/altın. Diğer temalarda özgün palet korunur. */
const HIGHLIGHT_THEMED = {
  halloween: ['#7ee23f', '#e02b2b', '#ff9422', '#b6f24a', '#ff5a3c'],
  noel: ['#ff6b6b', '#6fd39a', '#ffd166', '#ff8f9e', '#8fe3b0']
};
let lastHighlight = -1;
function nextHighlightColor() {
  const pool = (typeof S !== 'undefined' && HIGHLIGHT_THEMED[S.theme]) || HIGHLIGHT_COLORS;
  let i = Math.floor(Math.random() * pool.length);
  if (i === lastHighlight) i = (i + 1 + Math.floor(Math.random() * (pool.length - 1))) % pool.length;
  lastHighlight = i;
  return pool[i];
}
function clearHighlight() {
  if (catTimers.note) { clearTimeout(catTimers.note); catTimers.note = 0; }
  const wrap = $('#catMount .cat-wrap');
  const book = $('#catMount .book');
  if (wrap) {
    wrap.classList.remove('is-noting');
    wrap.style.removeProperty('--hl');
  }
  if (!book) return;
  book.classList.remove('is-noting', 'has-note');
  book.style.removeProperty('--hl');
}
function preparePenColor() {
  const wrap = $('#catMount .cat-wrap');
  if (!wrap) return;
  /* Okumaya başlarken kalemin rengi belli olsun; çizerken renk atlamasın.
     Her okumada yeni renk seçilir, bir öncekiyle aynı olmaz. */
  wrap.style.setProperty('--hl', nextHighlightColor());
}
function startHighlighting() {
  const wrap = $('#catMount .cat-wrap');
  const book = $('#catMount .book');
  if (!wrap || !book) return;
  const prepared = wrap.style.getPropertyValue('--hl').trim();
  const color = prepared || nextHighlightColor();
  /* Renk hem kitap çizgisine hem patideki kalemin gövdesine geçer. */
  wrap.style.setProperty('--hl', color);
  book.style.setProperty('--hl', color);
  wrap.classList.remove('is-noting');
  book.classList.remove('is-noting', 'has-note');
  /* Zorla yerleşim hesaplamak yerine bir kare bekleyip animasyonu yeniden başlat. */
  const epoch = catEpoch;
  requestAnimationFrame(() => {
    if (!wrap.isConnected || epoch !== catEpoch || currentCatState() !== 'read') return;
    wrap.classList.add('is-noting');
    book.classList.add('is-noting');
  });
  catAfter('note', 1200, () => {
    wrap.classList.remove('is-noting');
    book.classList.remove('is-noting');
    book.classList.add('has-note');
  });
}
/* Ses, animasyonla aynı görevde başlar: bekleyen çözme/indirme yok. */
function catMeow(level = .9) {
  const now = performance.now();
  if (now - lastMeowAt < 650) return;
  lastMeowAt = now;
  synthMeow(level);
}
function updatePerch() {
  const time = cachedEl('#perchTime');
  const status = cachedEl('#perchStatus');
  /* Her saniye aynı metni yazmak gereksiz stil geçersizleştirmesi üretiyordu. */
  if (time && timer) {
    const label = fmtClock(timer.remaining);
    if (time.textContent !== label) time.textContent = label;
  }
  if (status) {
    let nextStatus = '';
    if (rewardActive) {
      nextStatus = t(rewardLabel());
    } else {
      const state = currentCatState();
      const en = S.lang === 'en';
      const word = en
        ? (state === 'play' ? 'playing' : state === 'lonely' ? 'waiting for you' : state === 'read' ? 'reading' : state === 'stretch' ? 'stretching' : state === 'happy' ? 'happy' : 'sleeping')
        : (state === 'play' ? 'oynuyor' : state === 'lonely' ? 'seni bekliyor' : state === 'read' ? 'kitap okuyor' : state === 'stretch' ? 'geriniyor' : state === 'happy' ? 'mutlu' : 'uyuyor');
      nextStatus = (en ? 'focusing · ' : 'odakta ') + word;
    }
    if (status.textContent !== nextStatus) status.textContent = nextStatus;
  }
}
function beginFocusCat() {
  catReset();
  clearBubbleTimers();
  hideBubble();
  stopFocusCatch();
  const p = catRhythmProfile();
  /* Kafasında kar birikmişse önce tatlı bir silkeleme, sonra odak uykusu. */
  const cleaning = S.theme === 'noel' && headSnowLevel > .06;
  /* Odak boyunca kar birikmez; sayaç yeni kar için 5–10 dakikayı baştan sayar. */
  if (S.theme === 'noel') scheduleHeadSnow();
  if (cleaning) {
    setCatState('idle', { force: true });
    cleanHeadSnow();
    catAfter('greet', 2150, () => {
      if (!timer || !timer.running || timer.phase !== 'focus') return;
      setCatState('sleep', { force: true });
      scheduleFocusCat();
    });
  } else {
    setCatState('sleep', { force: true });
    catAfter('greet', 1500, () => {
      if (!timer || !timer.running || timer.phase !== 'focus') return;
      const w = S.catMessages ? weatherLines(true) : [];
      const greet = S.lang === 'en'
        ? ['Take a deep breath, I’m right here.', 'Let’s start with one small step. I’m beside you.', 'Just focus on this moment. The rest can wait a little.', 'Relax your shoulders, let out your breath. Let’s begin together.']
        : ['Derin bir nefes al, ben buradayım.', 'Tek bir küçük adımla başlayalım. Ben yanındayım.', 'Şimdi sadece bu ana odaklan. Gerisi biraz bekleyebilir.', 'Omuzlarını gevşet, nefesini bırak. Birlikte başlayalım.'];
      showBubble(pick(w.length && Math.random() < .35 ? w : greet), { duration: 3800 });
    });
    scheduleFocusCat(p.first);
  }
  scheduleFocusCatch();
}
/* Kitap ve yumak eşit sıklıkta seçilir: uzun vadede yarı yarıya.
   Art arda aynı etkinlik gelme ihtimali biraz kırılır, böylece ritim dengeli kalır. */
let lastFocusActivity = '';
function pickFocusActivity() {
  const pPlay = lastFocusActivity === 'read' ? .6 : lastFocusActivity === 'play' ? .4 : .5;
  lastFocusActivity = Math.random() < pPlay ? 'play' : 'read';
  return lastFocusActivity;
}
function scheduleFocusCat(delay) {
  if (!timer || !timer.running || timer.phase !== 'focus') return;
  /* Her dakika başında bir etkinlik: kedi ya kitap okur ya yumakla oynar.
     Sayaç duvar saatine hizalı, sekme arkada kalsa bile kaymaz. */
  catAfter('sleep', delay || msToNextMinute(), () => {
    if (!timer || !timer.running || timer.phase !== 'focus') return;
    if (pickFocusActivity() === 'play') beginFocusPlay();
    else maybeWakeAndRead();
  });
}
function beginFocusPlay() {
  if (!timer || !timer.running || timer.phase !== 'focus' || rewardActive) return;
  if (stillAway()) { scheduleFocusCat(); return; }
  clearCatSchedules();
  clearBubbleTimers();
  clearCatPlay();
  setCatState('play', { force: true });
  const wrap = $('#catMount .cat-wrap');
  const plays = ['bat', 'chase', 'catch', 'pounce', 'toss', 'dribble', 'hug', 'stalk'];
  const variant = lastCatPlay < 0 ? randInt(0, plays.length - 1) : (lastCatPlay + randInt(1, plays.length - 1)) % plays.length;
  lastCatPlay = variant;
  wrap.dataset.play = plays[variant];
  const yarnColor = paintYarnColor(wrap);
  const motions = [
    {
      toy: ['0px 0px', '0px 0px', '-24px 0px', '-24px 0px', '22px 0px', '22px 0px', '0px 0px'],
      right: ['0px 0px', '-14px 2px', '0px 0px', '0px 0px', '0px 0px', '0px 0px', '0px 0px'],
      left: ['0px 0px', '0px 0px', '0px 0px', '16px 2px', '0px 0px', '0px 0px', '0px 0px'],
      body: ['0px 0px', '-2px 0px', '-3px 0px', '-1px 0px', '3px 0px', '2px 0px', '0px 0px'],
      head: ['0deg', '-2deg', '-2deg', '0deg', '2deg', '2deg', '0deg'],
      roll: ['0deg', '0deg', '-60deg', '-60deg', '55deg', '55deg', '0deg']
    },
    {
      toy: ['0px 0px', '0px 0px', '28px 0px', '28px 0px', '10px 0px', '-20px 0px', '0px 0px'],
      right: ['0px 0px', '0px 0px', '4px 0px', '-8px 2px', '0px 0px', '0px 0px', '0px 0px'],
      left: ['0px 0px', '14px 2px', '0px 0px', '0px 0px', '0px 0px', '5px 1px', '0px 0px'],
      body: ['0px 0px', '2px 1px', '5px 0px', '5px 1px', '2px 0px', '-4px 0px', '0px 0px'],
      head: ['0deg', '1deg', '2deg', '2deg', '0deg', '-2deg', '0deg'],
      roll: ['0deg', '0deg', '70deg', '70deg', '25deg', '-50deg', '0deg']
    },
    {
      toy: ['0px 0px', '0px 0px', '18px 0px', '6px -2px', '0px 0px', '0px 0px', '0px 0px'],
      right: ['0px 0px', '0px 0px', '0px 0px', '-12px 3px', '-13px 3px', '-13px 3px', '0px 0px'],
      left: ['0px 0px', '12px 2px', '0px 0px', '10px 3px', '13px 3px', '13px 3px', '0px 0px'],
      body: ['0px 0px', '1px 0px', '3px 0px', '1px 2px', '0px 2px', '0px 2px', '0px 0px'],
      head: ['0deg', '1deg', '2deg', '0deg', '-1deg', '-1deg', '0deg'],
      roll: ['0deg', '0deg', '45deg', '15deg', '0deg', '0deg', '0deg']
    },
    {
      /* Pusu: geri çekilip kalçayı sallar, sonra iki patiyle üstüne atlar. */
      toy: ['0px 0px', '0px 0px', '0px 0px', '0px 0px', '0px 1px', '0px 2px', '0px 0px'],
      right: ['0px 0px', '0px 0px', '0px 0px', '0px 0px', '-10px -4px', '-12px 3px', '0px 0px'],
      left: ['0px 0px', '0px 0px', '0px 0px', '0px 0px', '10px -4px', '12px 3px', '0px 0px'],
      body: ['0px 0px', '-3px 3px', '-1px 3px', '-4px 3px', '2px -7px', '1px 2px', '0px 0px'],
      head: ['0deg', '-1deg', '1deg', '-1deg', '0deg', '0deg', '0deg'],
      roll: ['0deg', '0deg', '0deg', '0deg', '10deg', '20deg', '0deg'],
      tail: ['0deg', '-6deg', '6deg', '-6deg', '3deg', '0deg', '0deg']
    },
    {
      /* Havaya at, gözüyle takip et, iki patiyle yakala. */
      toy: ['0px 0px', '0px 0px', '-6px -34px', '4px -42px', '2px -6px', '0px 0px', '0px 0px'],
      right: ['0px 0px', '-10px 3px', '-4px -6px', '0px 0px', '-8px 0px', '-10px 2px', '0px 0px'],
      left: ['0px 0px', '0px 0px', '0px 0px', '0px 0px', '8px 0px', '10px 2px', '0px 0px'],
      body: ['0px 0px', '1px 1px', '0px -3px', '0px -4px', '0px 1px', '0px 1px', '0px 0px'],
      head: ['0deg', '1deg', '-4deg', '-5deg', '2deg', '1deg', '0deg'],
      roll: ['0deg', '0deg', '-120deg', '-200deg', '-240deg', '-240deg', '0deg']
    },
    {
      /* Pıt pıt: iki pati sırayla minik vuruşlar yapar. */
      toy: ['0px 0px', '-6px 0px', '6px 0px', '-7px 0px', '7px 0px', '-4px 0px', '0px 0px'],
      right: ['0px 0px', '-11px 2px', '0px 0px', '-11px 2px', '0px 0px', '-8px 2px', '0px 0px'],
      left: ['0px 0px', '0px 0px', '11px 2px', '0px 0px', '11px 2px', '0px 0px', '0px 0px'],
      body: ['0px 0px', '-1px 0px', '1px 0px', '-1px 0px', '1px 0px', '0px 0px', '0px 0px'],
      head: ['0deg', '-2deg', '2deg', '-2deg', '2deg', '-1deg', '0deg'],
      roll: ['0deg', '-25deg', '25deg', '-30deg', '30deg', '-15deg', '0deg']
    },
    {
      /* Sarılma: yumağı göğsüne alır, geriye yaslanıp hafifçe tekmeler. */
      toy: ['0px 0px', '0px -4px', '0px -6px', '1px -5px', '-1px -6px', '0px -4px', '0px 0px'],
      right: ['0px 0px', '-12px -2px', '-13px -4px', '-12px -3px', '-13px -4px', '-12px -2px', '0px 0px'],
      left: ['0px 0px', '12px -2px', '13px -4px', '12px -3px', '13px -4px', '12px -2px', '0px 0px'],
      body: ['0px 0px', '0px 1px', '-1px 3px', '1px 2px', '-1px 3px', '0px 1px', '0px 0px'],
      head: ['0deg', '-3deg', '-5deg', '-3deg', '-5deg', '-2deg', '0deg'],
      roll: ['0deg', '0deg', '12deg', '-12deg', '12deg', '-8deg', '0deg'],
      tail: ['0deg', '3deg', '-3deg', '3deg', '-3deg', '2deg', '0deg']
    },
    {
      /* Gözetleme: yumak uzaklaşır, kedi sinsice yaklaşıp patisiyle geri çeker. */
      toy: ['0px 0px', '26px 0px', '26px 0px', '26px 0px', '26px 0px', '4px 0px', '0px 0px'],
      right: ['0px 0px', '0px 0px', '0px 0px', '0px 0px', '8px 1px', '-6px 2px', '0px 0px'],
      left: ['0px 0px', '12px 2px', '0px 0px', '0px 0px', '0px 0px', '0px 0px', '0px 0px'],
      body: ['0px 0px', '0px 0px', '2px 3px', '4px 3px', '6px 2px', '2px 0px', '0px 0px'],
      head: ['0deg', '2deg', '4deg', '4deg', '3deg', '0deg', '0deg'],
      roll: ['0deg', '80deg', '80deg', '80deg', '80deg', '10deg', '0deg'],
      tail: ['0deg', '-1deg', '-5deg', '5deg', '-5deg', '1deg', '0deg']
    }
  ][variant];
  const offsets = [0, .12, .27, .42, .57, .74, 1];
  /* Aynı süre içinde daha geniş ve daha hızlı hareketler: yumak canlansın. */
  const amplify = (values, k) => values.map((v) => v.replace(/(-?\d+(?:\.\d+)?)(px|deg)/g, (m, n, u) => (parseFloat(n) * k) + u));
  const animate = (selector, values, property, k = 1.5) => {
    const el = $(selector, wrap);
    if (!el || typeof el.animate !== 'function') return;
    catPlayAnimations.push(el.animate(amplify(values, k).map((value, i) => ({
      [property]: value, offset: offsets[i]
        })), { duration: 3200, iterations: 9, easing: 'ease-in-out', composite: 'add' }));
};
  /* Yumak sahnesi ~29 saniye sürer (3200 ms x 9 tur); ardından kedi uykuya döner. */
  animate('.yarn-toy', motions.toy, 'translate', 1.55);
  animate('.yarn-ball', motions.roll, 'rotate', 1.4);
  animate('.paw.right', motions.right, 'translate', 1.55);
  animate('.paw.left', motions.left, 'translate', 1.55);
  animate('.cat3d', motions.body, 'translate', 1.65);
  animate('.head', motions.head, 'rotate', 1.55);
  animate('.tail', motions.tail || ['0deg', '-2deg', '0deg', '2deg', '0deg', '-2deg', '0deg'], 'rotate', 1.5);
  /* Yumak her zıplamada hafifçe ezilip gerilir. */
  const yarnBall = $('.yarn-ball', wrap);
  if (yarnBall && typeof yarnBall.animate === 'function') {
    catPlayAnimations.push(yarnBall.animate(['1', '1.09', '.94', '1.06', '1', '1.1', '1'].map((scaleValue, i) => ({
      scale: scaleValue, offset: offsets[i]
    })), { duration: 3200, iterations: 9, easing: 'ease-in-out', composite: 'add' }));
  }
  const playRows = [
    ['Bir dokunuş… yumak usulca yuvarlandı.', 'Pat! Biraz sola, biraz sağa. Sen çalışmaya devam et.'],
    ['Bir pati sağa, bir pati sola. Sen çalış, ben bunu hallederim.', 'Kaçıyor! Ama benden kaçamaz.'],
    ['İki patimin arasına aldım. Şimdi kaçamazsın, minik yumak.', 'Yakaladım! Bugün avcı modundayım.'],
    ['Pusudayım… Kuyruğum hazır, patilerim hazır. Hop!', 'Kalçamı salladım, hedefi gördüm. Atlıyorum!'],
    ['Havaya attım, havada yakaladım. Bunu sen de gördün mü?', 'Yukarı uçtu, gözüm üstünde. Hop, yakaladım!'],
    ['Pıt pıt pıt! Minik vuruşlar, büyük eğlence.', 'Bir sağ pati, bir sol pati. Ritmi tutturdum.'],
    ['Yumağa sarıldım. Bırakmam, o artık benim.', 'Arka patilerle tekme, ön patilerle sıkı sarılma. Kedi işi!'],
    ['Yumak kaçtı… Sessizce yaklaşıyorum. Şşş!', 'Gözüm onda. Bir adım daha, şimdi pati!']
  ];
  const playLines = S.lang === 'en' ? PLAY_LINES_EN[variant] : playRows[variant];
  const yarnName = S.lang === 'en' ? (YARN_EN_NAMES[yarnColor.name] || 'soft') : yarnColor.name.toLocaleLowerCase('tr');
  showBubble(Math.random() < .3
    ? (S.lang === 'en'
      ? `Today I’m playing with the ${yarnName} yarn. You focus, I’ll have fun.`
      : `Bugün ${yarnName} yumakla oynuyorum. Sen odaklan, ben eğleneyim.`)
    : pick(playLines), { duration: 4500 });
  catAfter('play', 30000, () => {
    if (!timer || !timer.running || timer.phase !== 'focus' || currentCatState() !== 'play') return;
    hideBubble();
    setCatState('sleep', { force: true });
    scheduleFocusCat();
  });
}
function focusFaceTarget() {
  return (timer && timer.running && timer.phase === 'focus') ? 'sleep' : 'idle';
}
function maybeWakeAndRead() {
  if (!timer || !timer.running || timer.phase !== 'focus') return;
  const p = catRhythmProfile();
  const readFor = rand(p.read[0], p.read[1]);
  clearBubbleTimers();
  /* Dakika başı: uyan, kitabı aç, oku. Gerinme ve bakınma yok ki
     kullanıcı her dakikada gerçekten kitap görsün. */
  setCatState('idle', { force: true });
  catAfter('read', CAT_MIN_HOLD, () => {
    if (!timer || !timer.running || timer.phase !== 'focus') return;
    setCatState('read');
    preparePenColor();
    const readEndAt = Date.now() + readFor;
    /* Her okumada fosforlu kalemle çizgi çekilir; kullanıcı bu anı kaçırmasın. */
    showReadingBubble(readFor);
    catAfter('note', rand(Math.round(readFor * .15), Math.round(readFor * .35)), () => {
      if (!timer || !timer.running || timer.phase !== 'focus') return;
      if (currentCatState() !== 'read') return;
      startHighlighting();
      /* Not cümlesi de okunan kitabın dünyasından gelsin. */
      const noteLine = bookWorldKey() === 'halloween'
        ? 'bu satırı kanla işaretledim.'
        : bookWorldKey() === 'noel'
          ? 'bu satırın altını sıcak çikolatayla çizdim.'
          : 'bunu not alacağım.';
      showBubble(noteLine, { title: S.cat.name + ' not alıyor', duration: 4800 });
      catMeow(.55);
      catAfter('greet', 4800, () => {
        if (!timer || !timer.running || timer.phase !== 'focus') return;
        if (currentCatState() !== 'read') return;
        /* Kalan süre balonun gösterildiği anda hesaplanır; 4.8 sn önce
           hesaplanan eski değer okuma bitişinden sonra da açık kalırdı. */
        showReadingBubble(Math.max(2200, readEndAt - Date.now()));
      });
    });
    catAfter('read', readFor, () => {
      if (!timer || !timer.running || timer.phase !== 'focus') return;
      hideBubble();
      clearHighlight();
      if (Math.random() < .5) {
        setCatState('happy', { force: true });
        const world = bookWorldKey();
        const doneLines = world === 'halloween'
          ? ['bu bölümü fener ışığında okudum.', 'sayfada ince bir gölge kaldı…', 'hırr… kitap bana bakıyor gibiydi.']
          : world === 'noel'
            ? ['bu bölüm içimi ısıttı.', 'kar tanesi kadar hafif bir cümle.', 'sayfa kenarına sıcak çikolata lekesi bıraktım.']
            : ['bunu not aldım.', 'miyav! altını çizdim.', 'sayfa kenarına yazdım.'];
        showBubble(pick([...doneLines, ...catContextLines()]), { duration: 3800 });
        catAfter('read', 3000, () => {
          if (!timer || !timer.running || timer.phase !== 'focus') return;
          setCatState('sleep');
          scheduleFocusCat();
        });
      } else {
        setCatState('sleep');
        scheduleFocusCat();
      }
    });
  });
}
const CAT_BREAK_LINES = [
  'Bu kitabın bu sayfası çok komikti, gülmemek elde değil!',
  'Kitaptaki kedi bütün gün uyumuş. Bence çok gerçekçi bir karakter.',
  'Sayfayı çevirdim, kahraman yine çay içiyor. Biz de su içelim mi?',
  'Bu bölümde patilerimden daha çok macera var!',
  'Biraz gerinelim. Kitap kaçmıyor, ben de buradayım.',
  'Mola da emeğinin bir parçası. Biraz dinlenmeyi hak ettin.'
];
const CAT_BREAK_LINES_EN = [
  'This page of the book was so funny I almost laughed out loud!',
  'The cat in this book slept all day. Very realistic character, if you ask me.',
  'I turned the page and the hero is drinking tea again. Shall we get some water too?',
  'This chapter has more adventure than my paws can handle!',
  'Let’s stretch a little. The book isn’t going anywhere, and neither am I.',
  'Breaks are part of the work too. You’ve earned a little rest.'
];
const PLAY_LINES_EN = [
  ['One touch… the yarn rolled away softly.', 'Pat! A little left, a little right. You keep working.'],
  ['One paw right, one paw left. You work, I’ll handle this.', 'It’s running! But it can’t escape me.'],
  ['I’ve got it between my paws. Now you can’t run, little yarn.', 'Got it! I’m in hunter mode today.'],
  ['I’m in ambush… Tail ready, paws ready. Hop!', 'I wiggled my hips, spotted the target. Jumping!'],
  ['Threw it up, caught it mid-air. Did you see that too?', 'It flew up and I kept my eyes on it. Hop, caught it!'],
  ['Pit pit pit! Tiny taps, big fun.', 'One right paw, one left paw. I found the rhythm.'],
  ['I’m hugging the yarn. Not letting go, it’s mine now.', 'Kicks with the back paws, tight hug with the front. Cat business!'],
  ['The yarn escaped… I’m approaching quietly. Shh!', 'Eyes on it. One more step, now the paw!']
];
const YARN_EN_NAMES = {
  'Krem': 'cream', 'Pembe': 'pink', 'Nane yeşili': 'mint green', 'Lavanta': 'lavender',
  'Gök mavisi': 'sky blue', 'Limon sarısı': 'lemon yellow', 'Mercan': 'coral', 'Turkuaz': 'turquoise',
  'Kiraz': 'cherry', 'Mandalina': 'tangerine'
};
function beginBreakCat() {
  catReset();
  stopFocusCatch();
  clearBubbleTimers();
  hideBubble();
  setCatState('idle', { force: true });
  catAfter('greet', 1500, () => {
    if (!timer || !timer.running || timer.phase !== 'break') return;
    showBubble(pick(S.lang === 'en' ? CAT_BREAK_LINES_EN : CAT_BREAK_LINES), { duration: 4500 });
  });
  scheduleIdleCat(12000);
}
function scheduleIdleCat(delay) {
  catAfter('idle', delay || rand(20000, 42000), () => {
    if (timer && timer.running && timer.phase === 'focus') return;
    const available = !rewardActive && !$('#intro').classList.contains('open') && !$('#settings').classList.contains('open') && !$('#focusInvite').classList.contains('open');
    if (available && currentCatState() === 'idle' && Math.random() < .55) {
      const onBreak = timer && timer.running && timer.phase === 'break';
      setCatState(onBreak && Math.random() < .5 ? 'stretch' : 'idle', { force: true });
      showBubble(pick(onBreak ? [...(S.lang === 'en' ? CAT_BREAK_LINES_EN : CAT_BREAK_LINES), ...catContextLines()] : idleCatLines()), { duration: 4500 });
      catAfter('state', 3500, () => {
        if (!timer || !timer.running || timer.phase === 'break') setCatState('idle');
      });
    }
    scheduleIdleCat();
  });
}
function catWaveHello(message) {
  const wrap = $('#catMount .cat-wrap');
  if (!wrap || (timer && timer.running)) return;
  /* Bekleyen eski kedi işleri selamı bölmesin. */
  catReset();
  setCatState('wave', { force: true });
  showBubble(message || (S.lang === 'en' ? `meow! I’m ${S.cat.name}.` : `miyav! ben ${S.cat.name}.`), { duration: 3400 });
  catAfter('state', 3060, () => {
    if (!timer || !timer.running) {
      setCatState('idle');
      scheduleIdleCat();
    }
  });
}
/* “Vespır’ı miyavlat”: ses ve pati animasyonu tek görevde tetiklenir. */
function catMeowNow() {
  const wrap = $('#catMount .cat-wrap');
  if (!wrap || rewardActive) return;
  catReset();
  catMeow(1);
  clearBubbleTimers();
  setCatState('wave', { force: true });
  showBubble(pick(['miyav!', 'mrrp!', 'miyavv…', 'prr!', 'mırnav?']), { duration: 2000 });
  catAfter('state', 3060, () => {
    if (timer && timer.running && timer.phase === 'focus') {
      setCatState('sleep');
      scheduleFocusCat();
    } else {
      setCatState('idle');
      scheduleIdleCat(timer && timer.running && timer.phase === 'break' ? 2600 : undefined);
    }
  });
}
function petVespir(event) {
  const wrap = $('#catMount .cat-wrap');
  if (!wrap) return;
  /* Ödül sahnesi yarıda kesilmesin: beş saniye boyunca dokunuş beklemede. */
  if (rewardActive) return;
  /* Kafasında kar birikmişse dokunuş onu silkeleyerek temizler: pati kalkar,
     baş sallanır, kar kümeleri düşer. Kullanıcı animasyonu beklemek zorunda kalmaz. */
  if (S.theme === 'noel' && headSnowLevel >= .18 && cleanHeadSnow()) {
    const rc = wrap.getBoundingClientRect();
    heartBurst(rc.left + rc.width / 2, rc.top + rc.height * .3, 6);
    return;
  }
  /* Dokunuşta ses yok: sadece sevgi animasyonu ve kalpler. Miyav, ses
     sekmesindeki “Vespır’ı miyavlat” düğmesine ve seans bitişine saklı. */
  clearTimeout(wrap._pokeTimer);
  clearTimeout(wrap._purrTimer);
  if (wrap.classList.contains('is-poked')) {
    wrap.classList.remove('is-poked', 'is-purring');
    requestAnimationFrame(() => {
      if (wrap.isConnected) wrap.classList.add('is-poked', 'is-purring');
    });
  } else {
    wrap.classList.add('is-poked', 'is-purring');
  }
  wrap._pokeTimer = setTimeout(() => wrap.classList.remove('is-poked'), 600);
  wrap._purrTimer = setTimeout(() => wrap.classList.remove('is-purring'), 950);
  const r = wrap.getBoundingClientRect();
  heartBurst(r.left + r.width / 2, r.top + r.height * .32, 12);
  const isFocus = timer && timer.running && timer.phase === 'focus';
  /* Kullanıcı dokunduysa sıradaki otomatik uyku/okuma işi beklemede kalır;
     böylece sevgi animasyonu yarıda kesilmez. */
  catReset();
  clearBubbleTimers();
  if (isFocus) {
    setCatState('idle', { force: true });
    showBubble(pick(['mrrp? uyuyordum…', 'pat pat… sen de çalış.', 'miyav! buradayım.', 'mrrr. güzel odak.']), { duration: 2600 });
    catAfter('read', 2600, () => {
      if (!timer || !timer.running || timer.phase !== 'focus') return;
      const readFor = rand(8000, 13000);
      setCatState('read');
      showReadingBubble(readFor - 250);
      catAfter('read', readFor, () => {
        if (!timer || !timer.running || timer.phase !== 'focus') return;
        hideBubble();
        setCatState('sleep');
        scheduleFocusCat();
      });
    });
  } else {
    setCatState('wave', { force: true });
    showBubble(pick(['miyav!', 'mrrp… seni gördüm.', 'pat pat!', 'prr. kulağımın arkası lütfen.', 'miyav? oyun mu?']), { duration: 3600 });
    catAfter('state', 3060, () => {
      setCatState(focusFaceTarget());
      if (timer && timer.running && timer.phase === 'focus') scheduleFocusCat();
      else scheduleIdleCat(timer && timer.running && timer.phase === 'break' ? 2600 : undefined);
    });
  }
}
function bindCatEvents() {
  const wrap = $('#catMount .cat-wrap');
  if (!wrap) return;
  wrap.addEventListener('click', petVespir);
  wrap.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); petVespir(e); }
  });
}
/* ============================================================
   UZAKLAŞMA — 5 dakika sonra yalnızlık, dönüşte sıcak karşılama
   ============================================================ */
const AWAY_LIMIT = 5 * 60 * 1000;
const LONELY_RETURN_TEXT = 'Neredeydin bu kadar süre? Çok uzun sürdü, seni özledim... Hadi odaklanmaya geri dönelim! 🐾❤️';
let awaySince = 0;
let awayTimer = 0;
let awayBlurred = false;
let lonelyActive = false;
let missedYou = false;
let lonelyReturnTimer = 0;
function canBeLonely() {
  return !!(timer && timer.running && timer.phase === 'focus');
}
function stillAway() {
  return document.visibilityState === 'hidden' || awayBlurred;
}
function clearAwayTimer() {
  if (awayTimer) { clearTimeout(awayTimer); awayTimer = 0; }
}
function resetAwayState() {
  awaySince = 0;
  clearAwayTimer();
}
function setLonelyTitle(on) {
  if (lonelyTitleOn === on) return;
  lonelyTitleOn = on;
  updateDocumentTitle();
}
function enterLoneliness() {
  if (lonelyActive) return;
  lonelyActive = true;
  missedYou = true;
  setLonelyTitle(true);
  /* Arka planda kalan okuma/uyku zamanlayıcıları dönüşte kediyi bölmesin. */
  catReset();
  clearBubbleTimers();
  hideBubble();
  setCatState('lonely', { force: true });
}
function checkAway() {
  awayTimer = 0;
  if (!awaySince) return;
  if (!stillAway()) { resetAwayState(); return; }
  if (!canBeLonely()) { resetAwayState(); return; }
  const elapsed = Date.now() - awaySince;
  if (elapsed < AWAY_LIMIT - 120) {
    awayTimer = setTimeout(checkAway, Math.max(250, AWAY_LIMIT - elapsed + 60));
    return;
  }
  awaySince = 0;
  enterLoneliness();
}
function armAwayWatch() {
  if (lonelyActive || awaySince) return;
  if (!canBeLonely()) return;
  awaySince = Date.now();
  clearAwayTimer();
  /* Tarayıcı arka planda zamanlayıcıyı kıssa bile hedef anı Date.now ile doğrularız. */
  awayTimer = setTimeout(checkAway, AWAY_LIMIT + 60);
}
function noteAway() {
  awayBlurred = true;
  armAwayWatch();
}
function showLonelyReturn() {
  missedYou = false;
  lonelyActive = false;
  setLonelyTitle(false);
  resetAwayState();
  catReset();
  clearBubbleTimers();
  hideBubble();
  setCatState('lonely', { force: true });
  showBubble(S.lang === 'en'
    ? 'Where were you all this time? It felt so long, I missed you… Come on, let’s get back to focusing! 🐾❤️'
    : LONELY_RETURN_TEXT, { duration: 9000 });
  if (lonelyReturnTimer) clearTimeout(lonelyReturnTimer);
  lonelyReturnTimer = setTimeout(() => {
    lonelyReturnTimer = 0;
    /* Kullanıcı bu arada kediyi sevdiyse veya yeni bir durum başlattıysa
       mesaj sonrası uyku onun üstüne yazılmasın. */
    if (currentCatState() !== 'lonely') return;
    if (!timer || !timer.running) { setCatState('idle'); return; }
    if (timer.phase === 'break') { setCatState('idle'); scheduleIdleCat(2600); return; }
    /* Mesaj bittikten sonra kedi yumuşakça uykuya döner. */
    setCatState('sleep');
    scheduleFocusCat();
  }, 9400);
}
function backFromAway() {
  const elapsed = awaySince ? Date.now() - awaySince : 0;
  const complain = missedYou || lonelyActive || (elapsed >= AWAY_LIMIT && canBeLonely());
  if (!complain) { resetAwayState(); return; }
  showLonelyReturn();
}
/* Kullanıcı bilerek başlat/durdur/sıfırladığında yalnızlık izi kalmaz. */
function endLoneliness() {
  if (lonelyReturnTimer) { clearTimeout(lonelyReturnTimer); lonelyReturnTimer = 0; }
  missedYou = false;
  lonelyActive = false;
  setLonelyTitle(false);
  resetAwayState();
}
window.addEventListener('blur', () => { awayBlurred = true; noteAway(); });
window.addEventListener('focus', () => { awayBlurred = false; backFromAway(); });
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') { noteAway(); return; }
  awayBlurred = false;
  backFromAway();
});
/* ---------- intro ---------- */
let introTyping = 0;
const introLine = () => `Miyav! Ben ${S.cat.name}. Sen odaklanırken yukarıda uyurum, arada uyanıp kitap okur ve miyavlarım. Hazırsan patileri ısıtalım.`;
function typeIntro() {
  const lead = $('#introLead');
  if (!lead) return;
  clearInterval(introTyping);
  lead.textContent = '';
  const text = introLine();
  let i = 0;
  const caret = document.createElement('span');
  caret.className = 'caret';
  lead.appendChild(caret);
  introTyping = setInterval(() => {
    i++;
    caret.remove();
    lead.textContent = text.slice(0, i);
    lead.appendChild(caret);
    if (i >= text.length) {
      clearInterval(introTyping);
      setTimeout(() => { const c = $('.caret', lead); if (c) c.remove(); }, 1700);
    }
  }, 20);
}
let introReadyTimer = 0;
let introLastFocus = null;
function openIntro() {
  const el = $('#intro');
  if (!el || el.classList.contains('open')) return;
  introLastFocus = document.activeElement;
  ensureIntroCat();
  el.removeAttribute('inert');
  el.classList.remove('card-ready');
  el.classList.add('open');
  el.setAttribute('aria-hidden', 'false');
  const introName = $('#introName');
  if (introName) introName.textContent = S.cat.name;
  /* Kart süzülürken kedi animasyonları ve daktilo aynı karede başlamasın;
     ikisi de kart yerine oturunca devreye girer. */
  clearTimeout(introReadyTimer);
  const lead = $('#introLead');
  if (lead) lead.textContent = '';
  introReadyTimer = setTimeout(() => {
    if (!el.classList.contains('open')) return;
    el.classList.add('card-ready');
    typeIntro();
  }, 780);
  const first = el.querySelector('button:not([disabled])');
  if (first && !$('.geo-ask')) { try { first.focus({ preventScroll: true }); } catch (e) {} }
}
/* “Birlikte başlayalım” girişi kapatır; gizlilik metni artık zorunlu onay istemez,
   sadece Ayarlar → Hakkımızda'dan okunabilir. */
function finishIntro(customize) {
  clearTimeout(introReadyTimer);
  clearInterval(introTyping);
  const el = $('#intro');
  if (el) { el.classList.remove('open'); el.setAttribute('aria-hidden', 'true'); el.setAttribute('inert', ''); }
  const returnFocus = $('.geo-ask [data-geo="yes"]') || introLastFocus;
  introLastFocus = null;
  if (returnFocus && returnFocus.isConnected && typeof returnFocus.focus === 'function') {
    try { returnFocus.focus({ preventScroll: true }); } catch (e) {}
  }
  const firstTime = !S.welcomed;
  S.welcomed = true;
  save();
  if (firstTime) celebrateBurst();
  initAudio();
  playSoftChime(.5);
  setTimeout(() => {
    if (customize) openSettings('cat');
    else {
      catWaveHello(S.lang === 'en'
        ? `meow! ${S.cat.name} is ready. I warmed up my paws for ${S.sessionName}.`
        : `miyav! ${S.cat.name} hazır. ${S.sessionName} için patileri ısıttım.`);
    }
  }, 420);
}
function maybeIntro() {
  if (!S.welcomed) {
    setTimeout(openIntro, 650);
  } else if (!timer || !timer.running) {
    setTimeout(() => {
      if (!timer || !timer.running) catWaveHello(pick(S.lang === 'en'
        ? [`meow! welcome back.`, `mrrp… I was waiting for you.`, `meow! ${S.cat.name} is here.`, ...catContextLines()]
        : [`miyav! tekrar hoş geldin.`, `mrrp… seni bekliyordum.`, `miyav! ${S.cat.name} burada.`, ...catContextLines()]));
    }, 1100);
  }
}
/* ---------- celebration & notification ---------- */
let celebrateTimer = 0;
function showCelebrate(eyebrow, title, sub) {
  const el = $('#celebrate');
  if (!el) return;
  $('#celebrateEyebrow').textContent = t(eyebrow);
  $('#celebrateTitle').textContent = t(title);
  $('#celebrateSub').textContent = t(sub);
  el.classList.add('show');
  celebrateBurst();
  clearTimeout(celebrateTimer);
  celebrateTimer = setTimeout(() => el.classList.remove('show'), 6200);
}
/* İzin istemi: yeni tarayıcılar Promise, eski Safari/WebView callback döndürür; ikisini de destekle. */
function requestNotifyPermission() {
  return new Promise((resolve) => {
    let settled = false;
    const done = (p) => { if (settled) return; settled = true; resolve(typeof p === 'string' ? p : Notification.permission); };
    try {
      const ret = Notification.requestPermission(done);
      if (ret && typeof ret.then === 'function') ret.then(done, () => done(Notification.permission));
      else if (typeof ret === 'string') done(ret);
    } catch (e) { done(Notification.permission); }
  });
}
async function ensureNotifyPermission() {
  if (!('Notification' in window)) { toast('Bu tarayıcı bildirimleri desteklemiyor.'); return false; }
  if (!window.isSecureContext) { toast('Bildirimler için sayfayı http(s) üzerinden açmalısın.'); return false; }
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') { toast('Bildirim izni kapalı. Tarayıcı ayarlarından açabilirsin.'); return false; }
  try {
    const p = await requestNotifyPermission();
    if (p !== 'granted') {
      toast(location.protocol === 'file:'
        ? 'Dosyadan açıldığı için bildirim izni verilemedi. Zil ve kedi baloncukları çalışmaya devam eder.'
        : 'Bildirim izni verilmedi. Tarayıcı ayarlarından izin verebilirsin.');
    }
    return p === 'granted';
  } catch (e) {
    toast('Bildirim izni alınamadı. Zil ve kedi baloncukları çalışmaya devam eder.');
    return false;
  }
}
function updateNotifyStatus() {
  const el = $('#notifyStatus');
  if (!el) return;
  const en = S.lang === 'en';
  let tone = '', text = '';
  if (!('Notification' in window)) {
    tone = 'warn'; text = en ? '<b>Not supported.</b> This browser does not provide the Notification API.' : '<b>Desteklenmiyor.</b> Bu tarayıcı bildirim API’si sunmuyor.';
  } else if (!window.isSecureContext) {
    tone = 'warn'; text = en ? '<b>http(s) required.</b> Open the page over http(s) for notifications.' : '<b>http(s) gerekli.</b> Bildirimler için sayfayı http(s) üzerinden aç.';
  } else if (Notification.permission === 'granted') {
    tone = 'ok'; text = en
      ? (S.notify ? '<b>On.</b> You’ll be notified when focus and breaks end.' : '<b>Permission ready.</b> Turn on the switch to enable notifications.')
      : (S.notify ? '<b>Açık.</b> Odak ve mola bitince cihazına haber gelecek.' : '<b>İzin hazır.</b> Bildirimleri açmak için anahtarı aç.');
  } else if (location.protocol === 'file:') {
    tone = 'warn'; text = en ? '<b>Opened from a file.</b> The browser will not grant notification permission; Vespır keeps using chimes and bubbles.' : '<b>Dosyadan açık.</b> Tarayıcı bildirim izni vermiyor; Vespır zil ve baloncuklarla haber vermeye devam eder.';
  } else if (Notification.permission === 'denied') {
    tone = 'warn'; text = en ? '<b>Permission blocked.</b> Allow notifications from your browser’s site settings.' : '<b>İzin kapalı.</b> Tarayıcı site ayarlarından bildirimlere izin ver.';
  } else {
    tone = ''; text = en ? '<b>Waiting for permission.</b> Turning on the switch will ask the browser.' : '<b>İzin bekliyor.</b> Anahtarı açınca tarayıcı izin soracak.';
  }
  el.className = 'notify-status' + (tone ? ' ' + tone : '');
  el.innerHTML = text;
}
function buzz(pattern) {
  if (!S.haptic || !navigator.vibrate) return;
  try { navigator.vibrate(pattern); } catch (e) {}
}
/* Bildirim görselleri sade PNG'dir: tek zemin, tek kedi başı, temanın şapkası.
   Android SVG bildirim simgesini göstermediği için PNG kullanılır; rozet tek renkli silüettir. */
const THEME_NOTIFY_ICONS = { noel: 'data:image/png;base64,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', halloween: 'data:image/png;base64,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' };
const notifyIcon = () => THEME_NOTIFY_ICONS[document.documentElement.dataset.theme] || new URL('./icon-192.png', location.href).href;
const NOTIFY_BADGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAAIYklEQVR42u1dW4id1RX+1j8n1sRLmtRLrBeCxgRvaLxFShsQQZCiKNiHQmkfGqh9HHwpiH0RRESDIKj0ofrgS1NFhGJKa1DRKlOsQXDw2ok6WmtmNJmEIerM/38+nLXMcnPmzDn/2Wf+ff75FxzOfZ2117due+/17wM01FBDDTXUUEMNNdRQQw011FBDDTXUUEMNNdRQQw31QCTHVuOYSUpKAmVJCVR3gzMhSP6O5B2rwRu8kZG8ieQ9JIVkVpZnNoA8Zu1HATxK8hGSG0QkJ9mqofJbIlIAyEj+AcBzAE4WEQ6ox4E9YCfJRbbpPZI/09cHsoyEFP/dOEhuJfmCjrUg+XsDpxJ31PttKtACj9Pd7v3WCCt/zD3+Nck5Hd8xvb81BQA2OcEW1TJI8l8ktyVZMfRm9S19vJHkX5xx+TH+tLK855LRCSSnVaA88IY5krtGKUEHifZGkgc6KN7oQm+MVQmbkXzNCckOj/9KcpO5a6re4Kx+DcndTn4fXs3IZkiu98ZYZRj6WwelW6Ky1z4k+fMUvcEMSR9vJznh5M+DMdnzD0iuqRoAs5iHO1gKl7Cg3STXppKgvQwkx0nOLzMWM6gXY4SfWLHr8DLvtwAUehsH8ArJa0Rk0VtfBYl2TGU4l+SzAHYDWAcgV5m70VwwH6oUgKkefysDsAjgSgAvkRwXkUJEipX0BlU8ddL4CwATAG5R2QigW3ik3n+UAgAmzGd98DNvWAtgN8nnSG5WSxx6uaoz2pzkqSQfA7AHwFnO6nv9/emU1oO2u6TVKxUuzs6QvL2fBK0h5Hu3PsrLn5B8q0t52Y1M5l9VnsfcgM50k7F+BhNWTo+TPNWXq6q4MX3e1UMsrutnW+FsXN//o/vNBfZP1U/COgCwnuTBkgCE5eq7NrhlfntDcGst8/kLSL7YpbzsR9ac5BUxAJBYIADYD+ByjaVlhVrUOJwDuA/APQDOAHAtgIsAXAzgQs0fPw6+O6vV2DSAtwG8A+B1LRB+A+B+AD90v1E25wmAIwC2iMgMSdEV0coAyLSKeR7ADQMCAE3Qlsw/BHA6gJNK8sq1WjnfPY8h2zSAi0RkflAAYiSQTAX7JKiMBuFH5bnZKY7OaKSD8dB9xix1TJVfuOcxqr6DMZQfCwAEdXEMMmX1ozhZQmExN0xM2Z84Y8lTAWB2CHk+iwDkMOYVX8YK4VlEq/g4llAjQAdSsbDQA7hKADiYEgA+Li64JFpH8tVZjIIjKgBH9FZnEp1HzCbjAVaGicghl5zq6AEWXgsA/0/JA/ymxEyNAfAV0NGkAHCJ9/OaewAAHBKRI977UwJgqsaWX/hJWKxdvNhbgQdRf5qJOd+JDcDUKpiM/TdFAHwpWncADsdk1ooMwPSAwNoqqJV8WQQwY/GUYBKGFD1gFsChkpWQX/ls6b245Fc2ccbimfkkHKvSi+UBogKdAGBNSUVlAI4B2KuDPAfATWjvfhUljCU2T/OgtekVyMc3ve8osdlte7P/ILkl4LtFX2efe7jD4GljesyPORUArPvg+SV6RJfriHiV5Ik2MLvp8xP1/V75DoOnB+tj11opKSl/k+urLPoY1CLJHcpjTcDbml936OfyiniGIOxUHkldrHdzSeuf6DazdABP9MB/GDw7haG7YoWhLFICBoCr+6wO7HOT6spLyWIdbZM98B8Gz050TUqLcSbEpatgGcL0tU1DWZECACbEuX3Ogu1zl+iq4lKDKfT9S3rgPwyenfifCWCdiLDSROxaE9eRnCpZLo5SErYC41jl14cFAGws2Zw7SmVo2Jy7o/JKyAGwgeQXJZtzR2UiFgJwVQwAZFAANA5u1KXo9SjXmjIKSxHhksQOEfm3Xm2TVw3AKWh3JJ89wMCW+l5ZfsPiSbQ7I7aLyKQ1J1dSBVkVICJHMXingPUT5TpAa8gdRMbYPM365wH8L8ZcIFZ3dI44G/IxOpiHydMA+FJD28Ab8zFnwpOrYCJmoeZ9EfkqRgkas4Z9I0ZeGRHaH0t/MWfCEwC+UXeve2/oy8msBenlSSIiBwC8GYBSJ7Lk/QWAV2ONM1YIsiT3dCzLSJCsgvqniBy2q+1TAcAs4Vl9XMeD++xqmz0xc10UADQMjYnIOwD+ri8v1qz6yXS2v1eXYPJkAAjoYQzv2qwqARAAfxKRrwBECT/RS0atiwlgH4DrMfh1uSnV/p8CuAzt1nTGAiC2B9h1s3cG1UMdws9dIjIHIIul/OgA6DEwYyKyH8BDav35CCvfjrDZB+BJO+ApdmaPWyy3E5QA+AGA/6B9xsMohiK7yHsewBVoX5oqg6x8rkgSVvcUETkG4JcAvsbx1sVRs/4MwC4RmdLQE32COZT9TBeK3gTwWwUgHyEQFjT03Csie+yUrdGbux/fAL/TNTaVOU9oJekbvX9CZR/tg8gdCPe6TfA8QcUXTvlP6eGtyR4y2y8I1r64a4mzRKum3HnmfVZM1OoPKRwIt5KcTSgkLTjPHLcJZS3/DcT15VxAcl+ghJUGwvcDTfpD+Gr9VyzBmfzjzhtWAogi+I0Fkg+SPLkWCbefNSPX1LVZ//5kPrDOxUhg2ImMYc55iuTVnQxj1VDgDVtJPkDysw4JckFvliyLJRRduN7QhQ5th0dI/pnkdV6GKkOOpOANOnPO9fmPANwI4DZdUT2ty1JBL2M5CuA1AM8A2CsiH7nfxTBmtyMFQABE5he7tOVxO4Cduqa0FcB5aF+NGR5l+bWu23wO4AMA7wJ4BcDrIvJp4HWsWvHJARAs5pl15h3e34DvH9xqzVKzaB8pPxcq18BF+7qApBoGki63HBiiVpv3+L0xtwBYxFy/X1UAdAGl00Lidwe3pqzwhhpqqKGE6FtOynfqVkWP2wAAAABJRU5ErkJggg==';
async function notifyUser(title, body) {
  if (!S.notify || !('Notification' in window) || Notification.permission !== 'granted') return;
  const opts = { body, icon: notifyIcon(), badge: NOTIFY_BADGE, tag: 'vespir-timer', renotify: true, data: { url: location.href } };
  try {
    if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && reg.active) await reg.showNotification(title, opts);
      else new Notification(title, opts);
    } else {
      new Notification(title, opts);
    }
  } catch (e) {
    try { new Notification(title, opts); } catch (err) {}
  }
}
async function testNotification() {
  const ok = await ensureNotifyPermission();
  if (!ok) { updateNotifyStatus(); return; }
  if (!S.notify) {
    S.notify = true;
    save();
    syncSettingsUI();
  }
  const title = S.lang === 'en' ? `${S.cat.name} is here` : `${S.cat.name} burada`;
  const themedTest = S.lang === 'en'
    ? (S.theme === 'noel'
      ? 'Notifications are working. I’ll let you know as quietly as a snowflake.'
      : S.theme === 'halloween'
        ? 'Notifications are working. I’ll knock even at midnight.'
        : 'Notifications are working. I’ll let you know like this when focus ends too.')
    : (S.theme === 'noel'
      ? 'Bildirimler çalışıyor. Kar taneleri gibi sessizce haber vereceğim.'
      : S.theme === 'halloween'
        ? 'Bildirimler çalışıyor. Gece yarısı bile kapını çalarım.'
        : 'Bildirimler çalışıyor. Odak bitince de böyle haber vereceğim.');
  const body = themedTest;
  try {
    if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && reg.active) await reg.showNotification(title, { body, icon: notifyIcon(), badge: NOTIFY_BADGE, tag: 'vespir-test' });
      else new Notification(title, { body, icon: notifyIcon() });
    } else {
      new Notification(title, { body, icon: notifyIcon() });
    }
    toast('Test bildirimi gönderildi.');
  } catch (e) {
    toast('Bildirim gösterilemedi. Tarayıcı iznini kontrol et.');
  }
  updateNotifyStatus();
}
/* ---------- Vespır'dan mesajlar: davet, özlem ve hava durumu ----------
   Mesajlar yalnızca sayaç dururken gelir; odak sırasında kimse rahatsız edilmez.
   Konum sadece hava için okunur ve 0,1°'ye yuvarlanır; mesajlar açıksa yalnızca cihazdaki tercih kaydına (arka plan hava uyarısı için) yazılır. */
const MSG_GAP = 3 * 3600 * 1000;
const MSG_RETURN_AFTER = 20 * 60 * 1000;
const MSG_INAPP_GAP = 3 * 60 * 1000;
const WEATHER_TTL = 10 * 60 * 1000;
const WEATHER_MAX_AGE = 45 * 60 * 1000;
const MSG_PREFS_CACHE = 'vespir-prefs';
const MSG_PREFS_PATH = './__vespir-message-prefs';
const WEATHER_LABELS = { storm: 'Fırtınalı', snow: 'Karlı', rain: 'Yağmurlu', drizzle: 'Çiseliyor', fog: 'Sisli', cloud: 'Bulutlu', sun: 'Açık', night: 'Açık' };
let weatherNow = null;
let weatherBusy = null;
let weatherDenied = false;
let msgAwayTimer = 0;
let msgHiddenAt = 0;
let lastInviteAt = 0;
let lastWeatherLineAt = 0;
let weatherGeo = null; /* yaklaşık (0,1°) koordinat; yalnızca SW'nin hava uyarısı sorgusu için tercih kaydına yazılır */
function quietHours(now = new Date()) {
  const h = now.getHours();
  return h >= 23 || h < 5;
}
function weatherKind(code, day) {
  if (code >= 95) return 'storm';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
  if (code >= 51 && code <= 57) return 'drizzle';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 1 && code <= 3) return 'cloud';
  return day ? 'sun' : 'night';
}
/* Yağmurlu havada şemsiye hatırlatması için: 'rain' | 'drizzle' | 'storm' | ''. */
function wetKind(w) {
  const k = weatherKind(w.code, w.day);
  return (k === 'rain' || k === 'drizzle' || k === 'storm') ? k : '';
}
/* Service worker'ın WEATHER_ALERTS havuzuyla birebir eşleşen uyarı türü:
   fırtına > kar > sis > yağmur > çisenti > rüzgâr > sıcak güneş. */
function weatherAlertKind(w) {
  const k = weatherKind(w.code, w.day);
  if (k === 'storm') return 'storm';
  if (k === 'snow') return 'snow';
  if (k === 'fog') return 'fog';
  if (k === 'rain') return 'rain';
  if (k === 'drizzle') return 'drizzle';
  if (Number.isFinite(w.wind) && w.wind >= 30) return 'windy';
  if (k === 'sun' && Number.isFinite(w.temp) && w.temp >= 28) return 'clear_hot';
  return '';
}
function freshWeather() {
  return weatherNow && Date.now() - weatherNow.at < WEATHER_MAX_AGE ? weatherNow : null;
}
/* focus=true: odak sırasında soru sormayan, sadece eşlik eden cümleler. */
function weatherLines(focus) {
  const w = freshWeather();
  if (!w) return [];
  if (S.lang === 'en') return weatherLinesEN(w, focus);
  const t = Math.round(w.temp);
  const pool = {
    rain: [
      'Yağmur cama vuruyor; bu sesle odaklanmak başka bir keyif.',
      'Böyle yağmurlu bir günde sıcak köşemizden çıkmayalım, çalışalım.',
      'Damla damla yağan yağmur bile küçük adımların değerini anlatıyor.',
      'Şemsiyeye gerek yok: bugün planımız içeride, kitapların arasında.',
      'Yağmurun ritmini duydun mu? Sayacımız da aynı sakinlikte işleyecek.'
    ],
    drizzle: [
      'İnce ince bir çisenti var; tam kitap ve sıcak içecek havası.',
      'Çisenti başlayınca dünya yavaşlıyor. Biz de acele etmeden ilerleyelim.',
      'Hafif bir çisenti, sakin bir zihin... Bugün şartlar bizden yana.'
    ],
    storm: [
      'Gök gürültüsü uzakta kalsın; bizim köşemiz güvenli ve sakin.',
      'Fırtına dışarıda, huzur içeride. Sen yanımdaysan hiçbir şey korkutmaz.',
      'Şimşekler gökyüzünü aydınlatıyor; sen de hedefini aydınlat.'
    ],
    snow: [
      'Kar yağıyor! Pencere kenarında çalışmak bugün ayrıcalığımız.',
      'Her kar tanesi farklı, her odak turu da öyle. Bugünkünü başlatalım.',
      'Beyaz bir örtü serildi şehre; sayfamızı da temiz bir başlangıçla açalım.',
      'Lapa lapa düşen karı izlemek güzel ama hedefin seni bekliyor.'
    ],
    fog: [
      'Sis çökmüş, şehir sessizleşmiş. Zihnimiz ise berrak kalsın.',
      'Sisli havada yolunu ışıklar bulur; seninkini de küçük adımlar bulacak.',
      'Bugün her şey biraz puslu. Net olan tek şey: birlikte çalışabiliriz.'
    ],
    cloud: [
      'Bulutlar gökyüzünü kaplamış; düşünmek için mükemmel bir perde.',
      'Gri bir gökyüzü, renkli fikirler... İçerisi bize yeter.',
      'Güneş bulutların arkasında saklanıyor; sen parlamak için buradasın.'
    ],
    sun: [
      'Güneş yüzünü göstermiş! Hak edilmiş bir mola sonra seni bekliyor.',
      'Pırıl pırıl bir gün; enerjini bir odak turuna yatırmaya ne dersin?',
      'Işık içeri doluyor, kediler mutlu. Sıradaki mutluluk: biten bir iş.',
      'Güneşli havada bile köşemizi seçtik; önce iş, sonra keyif.'
    ],
    night: [
      'Yıldızlar tek tek yanıyor; senin küçük zaferlerin de öyle parlayacak.',
      'Berrak bir gece, sessiz bir oda... Derin odak için ideal.',
      'Ay ışığı pencereden süzülüyor. Bu sakinlikte çalışmak kolaylaşır.'
    ]
  };
  const lines = (pool[weatherKind(w.code, w.day)] || []).slice();
  if (Number.isFinite(t) && t >= 30) lines.push(`${t} derecelik sıcakta su şişen yanında olsun; serin köşemiz seni bekliyor.`, 'Sıcaklık epey yükselmiş. Ağır işleri şimdi, serin molaları sonra yapalım.');
  else if (Number.isFinite(t) && t <= 3) lines.push(`Hava ${t} dereceye düşmüş; battaniyeni kap gel, içerisi sıcacık.`, 'Soğuk günlerde çalışmak içimizi ısıtır. Patilerim hazır.');
  return focus ? lines.filter((l) => !l.includes('?')) : lines;
}
/* İngilizce hava cümleleri: aynı WMO sınıflandırması, aynı ton. */
function weatherLinesEN(w, focus) {
  const temp = Math.round(w.temp);
  const pool = {
    rain: [
      'Rain is tapping on the window; focusing to that sound is a different kind of joy.',
      'On a rainy day like this, let’s stay in our warm corner and work.',
      'Even raindrops, one by one, show how much small steps matter.',
      'No umbrella needed: today’s plan is indoors, between the books.',
      'Did you hear the rhythm of the rain? Our timer will keep the same calm pace.'
    ],
    drizzle: [
      'A light drizzle outside — perfect weather for a book and a warm drink.',
      'When the drizzle starts, the world slows down. Let’s move forward without rushing.',
      'A little drizzle, a calm mind… The odds are on our side today.'
    ],
    storm: [
      'Let the thunder stay far away; our corner is safe and quiet.',
      'Storm outside, peace inside. With you beside me, nothing is scary.',
      'Lightning lights up the sky; now light up your goal.'
    ],
    snow: [
      'It’s snowing! Working by the window is our little privilege today.',
      'Every snowflake is different, and so is every focus round. Let’s start today’s.',
      'A white blanket covers the city; let’s open our page with a clean start too.',
      'Watching the snow fall is lovely, but your goal is waiting for you.'
    ],
    fog: [
      'Fog has settled and the city has gone quiet. Let’s keep our minds clear.',
      'Lights find the way in fog; small steps will find yours too.',
      'Everything is a little blurry today. One thing is clear: we can work together.'
    ],
    cloud: [
      'Clouds have covered the sky; a perfect curtain for thinking.',
      'A grey sky, colourful ideas… Inside is all we need.',
      'The sun is hiding behind the clouds; you’re here to shine.'
    ],
    sun: [
      'The sun is out! A well-earned break is waiting for you afterwards.',
      'A bright, sparkling day; how about investing your energy in a focus round?',
      'Light is pouring in and the cats are happy. Next happiness: a finished task.',
      'Even on a sunny day we chose our corner; work first, then fun.'
    ],
    night: [
      'The stars are lighting up one by one; your small victories will shine too.',
      'A clear night, a quiet room… Ideal for deep focus.',
      'Moonlight slips through the window. Focusing feels easier in this calm.'
    ]
  };
  const lines = (pool[weatherKind(w.code, w.day)] || []).slice();
  if (Number.isFinite(temp) && temp >= 30) lines.push(`It’s ${temp}°C outside; keep your water bottle close and let our cool corner wait for you.`, 'It’s really warmed up. Let’s do the heavy tasks now and save the cool breaks for later.');
  else if (Number.isFinite(temp) && temp <= 3) lines.push(`It’s down to ${temp}°C; grab your blanket, it’s cosy in here.`, 'Working on cold days warms us up from the inside. My paws are ready.');
  return focus ? lines.filter((l) => !l.includes('?')) : lines;
}
function catInviteLines(now = new Date()) {
  const h = now.getHours();
  const name = S.cat.name;
  if (S.lang === 'en') {
    const out = [
      'What are you up to today? Shall we work together?',
      'I had an idea: you work, I’ll read my book.',
      'I pressed a dry leaf between my book’s pages for luck. Shall we start?',
      'Is your desk ready? I’m already in my corner.',
      `Just ${S.focusMin} minutes; we’ll handle the rest together.`,
      'Pick a small goal, the rest will follow. I’m right here.',
      'Procrastinating is tiring; starting is a relief. Which shall we choose?',
      'A cup of coffee, a timer, and me… The team is complete.',
      'Do yourself a favour today: one focus round. Promise you won’t regret it.',
      'My paws are warm and my tail is fluffy; your turn now.'
    ];
    if (S.theme === 'noel') {
      out.unshift(
        `${name} put on the snow hat; the hot chocolate is ready. Shall we start?`,
        'It’s snowing outside. Inside: a warm cup and a focus round…',
        'I’m counting snowflakes; we’ll count them together when you come.',
        'The window seat is warm and so are my paws. How about one round?'
      );
    } else if (S.theme === 'halloween') {
      out.unshift(
        `${name} is waiting by the cauldron. Shall we cast a focus spell?`,
        'My bat friends brought news: you still haven’t started working.',
        'The pumpkin lantern is lit; another shadow fell across your desk.',
        'My tail is stirring in the shadows… Shall we work together?'
      );
    }
    if (h >= 5 && h < 12) out.push('Good morning! Clear the first task and the whole day feels lighter.', 'Morning minds are clear; focusing now is twice as valuable.', 'The roosters have gone quiet, it’s our turn. Shall we start the day with a win?');
    else if (h >= 12 && h < 18) out.push('If the afternoon slump has set in, one round will clear it.', 'Half the day has melted away; let’s plan the rest.', 'The work you start now is the work your evening self will thank you for.');
    else if (h >= 18 && h < 23) out.push('The quiet of the evening is here; let’s crown the day with good work.', 'A task finished before bed is the softest pillow.', 'TV can wait; first, this half hour you set aside for yourself.');
    else out.push('Night owl, spread your wings. A short round, then sweet sleep.', 'Few people work at this hour; you’re one of them.', 'Midnight goals grow quietly. Take one step, then rest.');
    if (now.getDay() === 0 || now.getDay() === 6) out.push('Weekend laziness is sweet; crowning it with one tiny round is sweeter.', 'Working on a day off makes the workweek feel different.');
    if (S.stats && S.stats.sessions > 0) out.push(`Shall we add one more to today’s ${S.stats.sessions} rounds?`, 'Keep the streak alive: one more round, then the break is yours.');
    return out;
  }
  const lines = [
    'Bugün ne yapıyorsun? Birlikte çalışalım mı?',
    'Aklımda bir fikir var: sen çalış, ben kitap okuyayım.',
    'Kitabımın arasına kuru bir yaprak koydum; uğur getirsin diye. Başlayalım mı?',
    'Masan hazır mı? Ben köşeme geçtim bile.',
    `Sadece ${S.focusMin} dakika ayır; gerisini birlikte hallederiz.`,
    'Küçük bir hedef seç, gerisi kendiliğinden gelir. Ben yanındayım.',
    'Ertelemek yorucu, başlamak hafifletici. Hangisini seçelim?',
    'Bir fincan kahve, bir sayaç, bir de ben... Takım tamam.',
    'Bugün kendine bir iyilik yap: tek bir odak turu. Söz, pişman olmazsın.',
    'Patilerimi ısıttım, kuyruğumu kabarttım; sıra sende.'
  ];
  /* Bildirimler ve baloncuklar seçili temanın dilini konuşsun. */
  if (S.theme === 'noel') {
    lines.unshift(
      `${name} kardan şapkasını taktı; sıcak çikolata hazır. Başlayalım mı?`,
      'Dışarıda lapa lapa kar var. İçeride bir fincan sıcaklık ve bir odak turu...',
      'Kar tanelerini sayıyorum; sen gelince birlikte sayarız.',
      'Pencere kenarı ısındı, patilerim ısındı. Bir tur ne dersin?'
    );
  } else if (S.theme === 'halloween') {
    lines.unshift(
      `${name} kazanın başında seni bekliyor. Bir odak büyüsü yapalım mı?`,
      'Yarasa dostlarım haber getirdi: hâlâ çalışmaya başlamamışsın.',
      'Balkabağı feneri yandı; masana bir gölge daha düştü.',
      'Kuyruğum gölgede kıpırdıyor... Birlikte çalışmaya ne dersin?'
    );
  }
  if (h >= 5 && h < 12) lines.push('Günaydın! İlk işi aradan çıkarırsan gün boyu hafif olursun.', 'Sabah zihni berraktır; bu saatte çalışmak iki kat değerli.', 'Horozlar sustu, sıra bizde. Güne bir zaferle başlayalım mı?');
  else if (h >= 12 && h < 18) lines.push('Öğle rehaveti çöktüyse tek bir tur onu dağıtır.', 'Günün yarısı eridi; kalanını planlı geçirelim.', 'Şu an başlayacağın iş, akşam teşekkür edeceğin iştir.');
  else if (h >= 18 && h < 23) lines.push('Akşamın sessizliği geldi; günü güzel bir işle taçlandıralım.', 'Yatmadan önce biten bir iş, en rahat yastıktır.', 'Televizyon bekleyebilir; önce kendine ayırdığın bu yarım saat.');
  else lines.push('Gece kuşu, kanatlarını aç. Kısa bir tur, sonra tatlı bir uyku.', 'Bu saatte çalışanlar nadirdir; sen onlardan birisin.', 'Gece yarısı hedefleri sessizce büyür. Bir adım at, sonra dinlen.');
  if (now.getDay() === 0 || now.getDay() === 6) lines.push('Hafta sonu tembelliği tatlıdır; küçücük bir turla taçlandırmak daha tatlı.', 'Tatil günü çalışanın hafta içi rahatı başkadır.');
  if (S.stats && S.stats.sessions > 0) lines.push(`Bugünkü ${S.stats.sessions} turun yanına bir yenisini ekleyelim mi?`, 'Seri bozulmasın: bir tur daha, sonra mola senin.');
  return lines;
}
function catMissLines() {
  if (S.lang === 'en') {
    return [
      `Finally! ${S.cat.name} nearly fell asleep on your keyboard from missing you.`,
      'My ears were waiting for your voice; I’m so glad you’re back.',
      'I folded the page to save our place. Shall we continue where we left off?',
      'Even my yarn ball was boring without you. Shall we start now?',
      'I’ve been staring at the window for hours. You’re here, and my day lit up.',
      'I purred your name; now let those purrs turn into work.',
      'You’re the returning hero! Your corner is still warm, come in.',
      `What does a ${S.cat.name} do without you? Waits. But no more waiting now.`
    ];
  }
  return [
    `Sonunda! ${S.cat.name} az kalsın üstüne yatacaktı özlemekten.`,
    'Kulaklarım sesini bekliyordu; iyi ki döndün.',
    'Kitabın sayfasını kıvırdım, yerini ayırdım. Kaldığımız yerden devam mı?',
    'Yokluğunda yumağım bile sıkıcıydı. Şimdi başlayalım mı?',
    'Saatlerdir pencereye bakıyordum. Geldin ya, günüm aydınlandı.',
    'Mırıldanarak seni andım; şimdi mırıltılar çalışmaya dönüşsün.',
    'Dönen kahraman sensin! Köşen hâlâ sıcak, buyur.',
    `Bir ${S.cat.name} sensiz ne yapar? Bekler. Ama artık beklemek yok.`
  ];
}
function catAwayNoteLines() {
  const name = S.cat.name;
  if (S.lang === 'en') {
    const out = [
      `${name} misses you. Please come back and let’s work together.`,
      'The book is open, the corner is ready, the cat is waiting. You’re the only missing piece.',
      'Which task was left half-done today? Come, let’s finish it together.',
      'The yarn ball rolled away and I watched it… Nothing is fun without you.',
      'I’m keeping watch by the window; I’ll be the first to see you return.',
      `${name} is purring: “I wonder what they’re doing?” Come and ease my curiosity?`,
      'The timer is quiet, the room is quiet. One touch from you and both come alive.',
      'I don’t want to be the queen of breaks; I want to be your focus partner. Come back and let’s start.',
      'My tail is swishing with impatience; that’s how much I hope you’ll come.',
      'Brew a cup of tea, open the tab; I’ll take care of the rest.'
    ];
    if (S.theme === 'noel') {
      out.unshift(
        `${name} put on the snow hat and is waiting for you.`,
        'It’s snowing outside, warm inside; how about a focus round?',
        'The hot chocolate is ready and my paws are warm. Come and let’s start.',
        'I’m counting snowflakes by the window; we’ll count them together when you arrive.'
      );
    } else if (S.theme === 'halloween') {
      out.unshift(
        `${name} is waiting by the cauldron for you.`,
        'Midnight is near; shall we cast a focus spell?',
        'My bat friends brought news: you still haven’t worked.',
        'The pumpkin lantern is lit; another shadow fell across your desk.'
      );
    }
    return out;
  }
  const lines = [
    `${name} seni özledi. Lütfen gel, birlikte çalışalım.`,
    'Kitap açık, köşe hazır, kedi bekliyor. Eksik olan tek şey sensin.',
    'Bugün hangi iş yarım kaldı? Gel, beraber tamamlayalım.',
    'Yumak yuvarlandı, ben baktım... Sen olmayınca oyunun tadı yok.',
    'Pencere önünde nöbet tutuyorum; dönüşünü görecek ilk ben olacağım.',
    `${name} mırıldanıyor: "Acaba ne yapıyor?" Merakımı gider, gelir misin?`,
    'Sayaç sessiz, oda sessiz. Bir dokunuşunla ikisi de canlanacak.',
    'Molaların kraliçesi değil, odakların ortağı olmak istiyorum. Dön de başlayalım.',
    'Kuyruğum sabırsızlıktan sallanıyor; bu, geldiğini umut ettiğimden.',
    'Bir bardak çay demle, sekmeyi aç; gerisi bende.'
  ];
  /* Arka plan bildirimleri de tema atmosferini taşısın. */
  if (S.theme === 'noel') {
    lines.unshift(
      `${name} kardan şapkasını taktı ve seni bekliyor.`,
      'Dışarıda kar yağıyor, içerisi sıcak; bir odak turu ne dersin?',
      'Sıcak çikolata hazır, patilerim ısındı. Gel de başlayalım.',
      'Pencere kenarında kar tanelerini sayıyorum; sen gelince birlikte sayarız.'
    );
  } else if (S.theme === 'halloween') {
    lines.unshift(
      `${name} kazanın başında seni bekliyor.`,
      'Gece yarısı yaklaşıyor; bir odak büyüsü yapalım mı?',
      'Yarasa dostlarım haber getirdi: hâlâ çalışmadın.',
      'Balkabağı feneri yandı; masana bir gölge daha düştü.'
    );
  }
  return lines;
}
/* Odak/mola bitiş bildirimi: tema seçiliyse onun dilini kullanır. */
function completionNotice(kind, doneMin) {
  const name = S.cat.name;
  if (S.lang === 'en') {
    if (S.theme === 'noel') {
      if (kind === 'focus') return {
        title: 'Time for a snowflake break',
        body: `${doneMin} minutes of focus done. ${name} shook the snow off the hat; hot chocolate is waiting for you.`
      };
      return { title: 'Rested as lightly as a snowflake', body: `${name} warmed up their paws for a new focus round.` };
    }
    if (S.theme === 'halloween') {
      if (kind === 'focus') return {
        title: 'The cauldron is starting to bubble',
        body: `${doneMin} minutes of focus done. ${name} is by the cauldron; your break is waiting.`
      };
      return { title: 'The spell is complete', body: `${name} is ready for a new spell. The night is still young.` };
    }
    if (kind === 'focus') return { title: `${S.sessionName} complete`, body: `${doneMin} minutes of focus done. ${name} is ready for a break.` };
    return { title: 'Break complete', body: `${name} is ready for a new focus round.` };
  }
  if (S.theme === 'noel') {
    if (kind === 'focus') {
      return {
        title: 'Kardan bir mola zamanı',
        body: `${doneMin} dakika odak bitti. ${name} kardan şapkasını silkeledi; sıcak çikolata seni bekliyor.`
      };
    }
    return { title: 'Kar tanesi kadar dinlendin', body: `${name} yeni bir odak için patilerini ısıttı.` };
  }
  if (S.theme === 'halloween') {
    if (kind === 'focus') {
      return {
        title: 'Kazan kaynamaya başladı',
        body: `${doneMin} dakika odak bitti. ${name} kazanın başında; mola seni bekliyor.`
      };
    }
    return { title: 'Büyü tamamlandı', body: `${name} yeni bir büyü için hazır. Gece hâlâ genç.` };
  }
  if (kind === 'focus') {
    return { title: `${S.sessionName} tamamlandı`, body: `${doneMin} dakika odak bitti. ${name} molaya hazır.` };
  }
  return { title: 'Mola tamamlandı', body: `${name} yeni bir odak için hazır.` };
}
/* Boşta baloncuk havuzu: davet ve hava cümleleri birkaç dakikada bir araya girer, dır dır etmez. */
function idleCatLines() {
  const now = Date.now();
  const w = weatherLines(false);
  if (w.length && now - lastWeatherLineAt > MSG_INAPP_GAP && Math.random() < .5) {
    lastWeatherLineAt = now;
    return w;
  }
  if (S.catMessages && now - lastInviteAt > MSG_INAPP_GAP && Math.random() < .5) {
    lastInviteAt = now;
    return catInviteLines();
  }
  return catContextLines();
}
function canSendCatMessage(now = Date.now()) {
  if (!S.catMessages || !('Notification' in window) || Notification.permission !== 'granted') return false;
  if (timer && timer.running) return false;
  if (quietHours(new Date(now))) return false;
  return now - (S.lastMsgAt || 0) >= MSG_GAP;
}
async function sendCatMessage(body) {
  const title = S.cat.name;
  const opts = { body, icon: notifyIcon(), badge: NOTIFY_BADGE, tag: 'vespir-hello', data: { url: location.origin + location.pathname } };
  try {
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && reg.active) { await reg.showNotification(title, opts); return true; }
    }
    const n = new Notification(title, opts);
    n.onclick = () => { try { window.focus(); } catch (e) {} n.close(); };
    return true;
  } catch (e) {
    return false;
  }
}
async function fireCatMessage() {
  msgAwayTimer = 0;
  if (document.visibilityState !== 'hidden' || !S.catMessages) return;
  /* Gizli sekmede yeniden kur: 3 saatlik aralık dolunca mesaj gelsin, sessizce düşmesin. */
  if (!canSendCatMessage()) { armCatMessage(); return; }
  const w = weatherLines(false);
  const body = pick(w.length && Math.random() < .4 ? w : catAwayNoteLines());
  if (!(await sendCatMessage(body))) { armCatMessage(); return; }
  S.lastMsgAt = Date.now();
  saveNow();
  writeMessagePrefs();
  armCatMessage();
}
function armCatMessage() {
  clearTimeout(msgAwayTimer);
  msgAwayTimer = 0;
  if (!S.catMessages || document.visibilityState !== 'hidden') return;
  msgAwayTimer = setTimeout(fireCatMessage, rand(25, 45) * 60000);
}
function greetAfterAway() {
  if (document.visibilityState !== 'visible' || (timer && timer.running) || rewardActive) return;
  if (['#intro', '#settings', '#focusInvite'].some((sel) => { const el = $(sel); return el && el.classList.contains('open'); })) return;
  const w = weatherLines(false);
  catWaveHello(pick(w.length && Math.random() < .3 ? w : catMissLines()));
}
let locationExplained = false;
let locationAskDeclined = false;
const GEO_LATER_KEY = 'vespir-geo-later';
const GEO_LATER_MS = 3 * 24 * 3600 * 1000;
function geoAskSnoozed() {
  if (locationAskDeclined) return true;
  try {
    const t = Number(localStorage.getItem(GEO_LATER_KEY));
    return t > 0 && Date.now() - t < GEO_LATER_MS;
  } catch (e) { return false; }
}
function ensureGeoAskStyle() {
  if (document.getElementById('geoAskStyle')) return;
  const st = document.createElement('style');
  st.id = 'geoAskStyle';
  st.textContent = `
.geo-ask { position: fixed; inset: 0; z-index: 190; display: grid; place-items: center; padding: 14px; overflow: hidden;
  background: var(--scrim, rgba(30,12,28,.4)); -webkit-backdrop-filter: blur(7px); backdrop-filter: blur(7px); animation: geoFade .28s ease both; }
.geo-card { width: min(340px, 100%); max-height: calc(100vh - 28px); max-height: calc(100dvh - 28px); overflow-y: auto; box-sizing: border-box;
  border-radius: 22px; padding: 18px 16px 12px; text-align: center; color: var(--ink);
  background: linear-gradient(160deg, var(--accent-soft), transparent 62%), var(--bg-0, #fff);
  border: 1px solid color-mix(in srgb, var(--accent) 38%, var(--line-2, transparent));
  box-shadow: 0 40px 90px -34px color-mix(in srgb, var(--accent) 75%, transparent);
  animation: geoPop .45s cubic-bezier(.34,1.56,.64,1) both; }
.geo-badge { width: 42px; height: 42px; margin: 0 auto 8px; border-radius: 50%; display: grid; place-items: center; font-size: 21px; line-height: 1;
  background: linear-gradient(140deg, var(--accent), var(--accent-2) 70%, var(--accent-3)); box-shadow: 0 10px 22px -10px var(--accent), inset 0 1px 0 rgba(255,255,255,.6); }
.geo-card h2 { margin: 0 0 4px; font-size: 17px; line-height: 1.25; letter-spacing: -.015em; font-weight: 750; }
.geo-lead { margin: 0 0 10px; font-size: 12px; line-height: 1.5; color: var(--ink-2); }
.geo-list { list-style: none; margin: 0 0 12px; padding: 0; display: grid; gap: 6px; text-align: left; }
.geo-list li { display: flex; align-items: center; gap: 9px; padding: 8px 10px; border-radius: 13px; font-size: 12px; line-height: 1.4; color: var(--ink-2);
  background: color-mix(in srgb, var(--accent) 7%, transparent); border: 1px solid color-mix(in srgb, var(--accent) 16%, transparent); }
.geo-list li span { font-size: 16px; flex: none; width: 20px; text-align: center; }
.geo-actions { display: grid; gap: 2px; }
.geo-actions .btn { width: 100%; min-width: 0; }
.geo-actions .btn.primary { height: 46px; font-size: 13.5px; }
.geo-actions .btn.text { height: 38px; }
@keyframes geoFade { from { opacity: 0; } to { opacity: 1; } }
@keyframes geoPop { from { opacity: 0; transform: translateY(24px) scale(.92); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .geo-ask, .geo-card { animation: none; } }`;
  document.head.appendChild(st);
}
/* Tarayıcının konum izni penceresi özel metin taşıyamaz; bu yüzden soru çıkmadan hemen önce
   nedenini açıkça anlatan bir kart gösteririz. Yalnızca izin henüz sorulmamışsa çıkar;
   "Şimdi değil" denirse 3 gün boyunca tekrar sorulmaz. true = izin sorusuna geçilebilir. */
async function explainLocationAsk() {
  if (locationExplained) return true;
  if (geoAskSnoozed()) return false;
  try {
    if (navigator.permissions && navigator.permissions.query) {
      const st = await navigator.permissions.query({ name: 'geolocation' });
      if (st.state !== 'prompt') return true;
    }
  } catch (e) {}
  ensureGeoAskStyle();
  return new Promise((resolve) => {
    const prevFocus = document.activeElement;
    const wrap = document.createElement('div');
    wrap.className = 'geo-ask';
    wrap.style.zIndex = '240';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-modal', 'true');
    wrap.setAttribute('aria-labelledby', 'geoAskTitle');
    const en = S.lang === 'en';
    wrap.innerHTML = `
      <div class="geo-card">
        <div class="geo-badge" aria-hidden="true">📍      </div>
        <h2 id="geoAskTitle">${en ? 'Location permission needed' : 'Konum izni gerekiyor'}</h2>
        <p class="geo-lead">${en ? 'Your browser is about to ask for permission. Here’s why:' : 'Tarayıcı birazdan izin isteyecek. Neden istendiği:'}</p>
        <ul class="geo-list">
          <li><span aria-hidden="true">🎯</span><div>${en ? 'Used only for current weather and weather alerts.' : 'Yalnızca güncel hava ve hava uyarısı için kullanılır.'}      </div></li>
          <li><span aria-hidden="true">🔒</span><div>${en ? 'Rounded approximate coordinates (~10 km) are sent to Open-Meteo to get weather information.' : 'Yuvarlanmış yaklaşık koordinat (~10 km), hava bilgisi almak için Open-Meteo’ya iletilir.'}      </div></li>
          <li><span aria-hidden="true">⚙️</span><div>${en ? 'You can decline; the app still works.' : 'Reddedebilirsin; uygulama yine çalışır.'}      </div></li>
        </ul>
        <div class="geo-actions">
          <button type="button" class="btn primary" data-geo="yes">${en ? 'Continue' : 'Devam et'}</button>
          <button type="button" class="btn text" data-geo="later">${en ? 'Not now' : 'Şimdi değil'}</button>
              </div>
            </div>`;
    const finish = (ok) => {
      document.removeEventListener('keydown', onKey, true);
      wrap.remove();
      const intro = $('#intro.open');
      const returnFocus = intro ? intro.querySelector('button:not([disabled])') : prevFocus;
      try { if (returnFocus && returnFocus.isConnected && returnFocus.focus) returnFocus.focus({ preventScroll: true }); } catch (e) {}
      if (ok) { locationExplained = true; }
      else {
        locationAskDeclined = true;
        try { localStorage.setItem(GEO_LATER_KEY, String(Date.now())); } catch (e) {}
      }
      resolve(ok);
    };
    const onKey = (ev) => {
      if (ev.defaultPrevented) return;
      if (ev.key === 'Tab') {
        trapPanelFocus(wrap.querySelector('.geo-card') || wrap, ev);
        ev.stopPropagation();
      } else if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); finish(false); }
    };
    document.addEventListener('keydown', onKey, true);
    const shownAt = Date.now();
    wrap.addEventListener('click', (ev) => {
      if (Date.now() - shownAt < 450) return; /* kartı açan dokunuşun yanlışlıkla kapatmasını önle */
      const t = ev.target.closest('[data-geo]');
      if (t) finish(t.getAttribute('data-geo') === 'yes');
      else if (ev.target === wrap) finish(false);
    });
    document.body.appendChild(wrap);
    const yes = wrap.querySelector('[data-geo="yes"]');
    if (yes) yes.focus();
  });
}
function updateWeather(force) {
  if (weatherDenied || !navigator.geolocation || !window.isSecureContext) return Promise.resolve(null);
  if (!force && weatherNow && Date.now() - weatherNow.at < WEATHER_TTL) return Promise.resolve(weatherNow);
  if (weatherBusy) return weatherBusy;
  weatherBusy = explainLocationAsk().then((ok) => ok ? new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(resolve, (error) => resolve({ error }), { enableHighAccuracy: false, maximumAge: WEATHER_TTL, timeout: 15000 });
  }) : { error: { code: 0 } }).then(async (pos) => {
    if (pos.error) {
      if (pos.error.code === 1) {
        weatherDenied = true;
        weatherNow = null;
        toast('Konum izni verilmedi. Vespır hava mesajları olmadan konuşmaya devam eder.');
      }
      return null;
    }
    const lat = pos.coords.latitude.toFixed(1);
    const lon = pos.coords.longitude.toFixed(1);
    weatherGeo = { lat: Number(lat), lon: Number(lon) };
    const ctrl = new AbortController();
    const stop = setTimeout(() => ctrl.abort(), 10000);
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day,wind_speed_10m&timezone=auto`,
        { credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store', signal: ctrl.signal });
      if (!res.ok) return null;
      const data = await res.json();
      const c = data && data.current;
      if (!c || !Number.isFinite(Number(c.weather_code))) return null;
      weatherNow = { code: Number(c.weather_code), temp: Number(c.temperature_2m), day: Number(c.is_day) !== 0, wind: Number(c.wind_speed_10m), at: Date.now() };
      writeMessagePrefs();
      return weatherNow;
    } catch (e) {
      return null;
    } finally {
      clearTimeout(stop);
    }
  }).finally(() => {
    weatherBusy = null;
    updateMsgStatus();
  });
  updateMsgStatus();
  return weatherBusy;
}
/* Hava mesajları uygulamanın doğal parçasıdır: izin önceden verilmişse açılışta
   sessizce tazelenir; izin sorusu ancak ilk dokunuştan sonra gelir. */
function bootWeather() {
  if (!navigator.geolocation || !window.isSecureContext) return;
  const onTouch = () => updateWeather();
  const later = () => document.addEventListener('pointerdown', onTouch, { capture: true, once: true });
  if (navigator.permissions && navigator.permissions.query) {
    navigator.permissions.query({ name: 'geolocation' }).then((st) => {
      if (st.state === 'granted') updateWeather();
      else if (st.state === 'prompt') later();
      else weatherDenied = true;
    }).catch(later);
  } else later();
}
/* Vespır hava hakkında konuşurken bayat veri kullanmasın: uygulama açıkken
   10 dakikada bir, sekme öne gelince de hava yeniden alınır. */
setInterval(() => {
  if (document.visibilityState !== 'visible' || weatherDenied || !navigator.geolocation) return;
  if (weatherBusy || !weatherNow) return; /* izin yoksa kendiliğinden pencere açma */
  updateWeather(true);
}, WEATHER_TTL);
function updateMsgStatus() {
  const el = $('#msgStatus');
  if (!el) return;
  const en = S.lang === 'en';
  const parts = [];
  let tone = '';
  if (!S.catMessages) {
    parts.push(en ? '<b>Off.</b> Vespır only talks through her own bubbles.' : '<b>Kapalı.</b> Vespır sadece kendi baloncuklarıyla konuşur.');
  } else if (!('Notification' in window) || Notification.permission !== 'granted') {
    parts.push(en ? '<b>On inside the app.</b> Notification permission is needed to reach you while you’re away.' : '<b>Uygulama içinde açık.</b> Sen uzaktayken mesaj alabilmen için bildirim izni gerekir.');
  } else {
    tone = 'ok';
    parts.push(en
      ? '<b>On.</b> While you’re away a message arrives at most every three hours; only 23:00–05:00 is quiet, including weather alerts.'
      : '<b>Açık.</b> Sen uzaktayken en fazla üç saatte bir mesaj gelir; hava uyarısı da dahil yalnızca 23.00 ile 05.00 arası sessizdir.');
    if (typeof ServiceWorkerRegistration === 'undefined' || !('periodicSync' in ServiceWorkerRegistration.prototype)) parts.push(en
      ? 'This browser does not support background messages (e.g. iPhone/Safari); messages arrive only while the app is open.'
      : 'Bu tarayıcı arka plan mesajlarını desteklemiyor (örneğin iPhone/Safari); mesajlar yalnızca uygulama açıkken gelir.');
  }
  const w = freshWeather();
  if (w) parts.push((en ? 'Weather: ' : 'Hava: ') + `<b>${t(WEATHER_LABELS[weatherKind(w.code, w.day)])}${Number.isFinite(w.temp) ? ', ' + Math.round(w.temp) + ' °C' : ''}</b>.`);
  else if (weatherDenied) parts.push(en ? 'Location permission is off, so weather messages and weather alerts are unavailable. Location is requested only for these; you can enable it in browser settings.' : 'Konum izni kapalı olduğu için hava mesajları ve hava uyarısı yok. Konum yalnızca bunlar için istenir; istersen tarayıcı ayarlarından izni açabilirsin.');
  else parts.push(en ? (weatherBusy ? 'Getting the weather…' : 'Weather has not been received yet.') : (weatherBusy ? 'Hava durumu alınıyor…' : 'Hava durumu henüz alınamadı.'));
  el.className = 'notify-status' + (tone ? ' ' + tone : '');
  el.innerHTML = parts.join(' ');
}
/* Uygulama kapalıyken service worker'ın okuyacağı küçük tercih kaydı (yuvarlanmış yaklaşık konum içerir). */
async function writeMessagePrefs() {
  if (!('caches' in window) || !/^https?:$/.test(location.protocol)) return;
  try {
    const key = new URL(MSG_PREFS_PATH, location.href).href;
    const cache = await caches.open(MSG_PREFS_CACHE);
    if (!S.catMessages) { await cache.delete(key); return; }
    const old = await cache.match(key);
    let umbrellaDay = '';
    let umbrellaCheckedDay = '';
    let prevGeo = null;
    if (old) {
      const prev = await old.json().catch(() => null);
      if (prev && Number(prev.lastMsgAt) > (S.lastMsgAt || 0)) S.lastMsgAt = Number(prev.lastMsgAt);
      /* Service worker'ın yazdığı "bugün şemsiye gönderildi" bilgisi korunur. */
      if (prev && typeof prev.umbrellaDay === 'string') umbrellaDay = prev.umbrellaDay;
      if (prev && typeof prev.umbrellaCheckedDay === 'string') umbrellaCheckedDay = prev.umbrellaCheckedDay;
      if (prev && prev.geo && Number.isFinite(Number(prev.geo.lat)) && Number.isFinite(Number(prev.geo.lon))) prevGeo = prev.geo;
    }
    const w = freshWeather();
    const prefs = {
      enabled: !!S.catMessages,
      lang: S.lang === 'en' ? 'en' : 'tr',
      name: S.cat.name,
      url: location.origin + location.pathname,
      icon: notifyIcon(),
      badge: NOTIFY_BADGE,
      lines: catAwayNoteLines(),
      weatherLines: w ? weatherLines(false) : [],
      weatherAt: w ? w.at : 0,
      weatherCondition: w ? weatherAlertKind(w) : '',
      wet: w ? wetKind(w) : '',
      geo: weatherDenied ? null : (weatherGeo || prevGeo),
      lastMsgAt: S.lastMsgAt || 0,
      umbrellaDay,
      umbrellaCheckedDay
    };
    await cache.put(key, new Response(JSON.stringify(prefs), { headers: { 'Content-Type': 'application/json' } }));
  } catch (e) {}
}
async function syncPeriodicMessages() {
  if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg || !reg.periodicSync) return;
    const want = S.catMessages && 'Notification' in window && Notification.permission === 'granted';
    if (want) {
      const st = await navigator.permissions.query({ name: 'periodic-background-sync' });
      if (st.state === 'granted') await reg.periodicSync.register('vespir-hello', { minInterval: 3 * 3600 * 1000 });
    } else {
      const tags = await reg.periodicSync.getTags();
      if (tags.includes('vespir-hello')) await reg.periodicSync.unregister('vespir-hello');
    }
  } catch (e) {}
}
function syncMessageSchedule() {
  writeMessagePrefs();
  syncPeriodicMessages();
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    msgHiddenAt = Date.now();
    armCatMessage();
    writeMessagePrefs();
    return;
  }
  clearTimeout(msgAwayTimer);
  msgAwayTimer = 0;
  const away = msgHiddenAt ? Date.now() - msgHiddenAt : 0;
  msgHiddenAt = 0;
  if (!weatherDenied && (!weatherNow || Date.now() - weatherNow.at > WEATHER_TTL)) updateWeather();
  if (S.catMessages && away >= MSG_RETURN_AFTER) setTimeout(greetAfterAway, 700);
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  if (timer && timer.running) {
    /* Sekmeye dönünce saati hemen gerçek zamanla eşitle: arka plandaki
       kısılmış aralıklar birikmiş gecikme bırakmaz. */
    timerTick();
    armFinish();
  }
});
/* ============================================================
   SES — hiçbir şey indirilmez, her şey tarayıcıda üretilir
   ============================================================ */
const customSounds = { start: null, end: null };
/* Bellek sınırları: kodlanmış ses IndexedDB'de tutulur, çözülmüş hali RAM'de.
   2 MB / 30 sn sınırı, özel sesin cihazda ve bellekte çok az yer kaplamasını sağlar. */
const MAX_SOUND_BYTES = 2 * 1024 * 1024;
const MAX_SOUND_SECONDS = 30;
let AC = null;
let masterGain = null;
let noiseCache = null;
let soundPersistReady = false;
function audioCtx() {
  if (!AC) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    try {
      AC = new Ctx();
      masterGain = AC.createGain();
      masterGain.gain.value = S.volume;
      masterGain.connect(AC.destination);
    } catch (e) { AC = null; return null; }
  }
  return AC;
}
function initAudio() {
  const ctx = audioCtx();
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  if (!soundPersistReady) restorePersistedSounds();
}
/* İlk dokunuşta ses bağlamını uyandır ve saklanan sesleri önceden çöz.
   Böylece miyav/pati animasyonuyla ses aynı karede başlar. */
let audioWarm = false;
function warmAudio() {
  if (audioWarm) return;
  const ctx = audioCtx();
  if (!ctx) return;
  audioWarm = true;
  decodeMeowSample(ctx);
  /* Sessiz bir tampon çal: ses hattı bu dokunuşta açılır, ilk gerçek ses
     (başlama zili, miyav) cihaz kurulumu beklemeden anında duyulur. */
  const unlock = () => {
    try {
      const b = ctx.createBuffer(1, 1, 22050);
      const s = ctx.createBufferSource();
      s.buffer = b;
      s.connect(ctx.destination);
      s.start(0);
    } catch (e) {}
  };
  if (ctx.state === 'suspended') ctx.resume().then(unlock).catch(() => {});
  else unlock();
  if (soundPersistReady) {
    ['start', 'end'].forEach((kind) => {
      const entry = customSounds[kind];
      if (entry && !entry.buffer) decodeSoundEntry(entry).catch(() => {});
    });
  } else {
    restorePersistedSounds();
  }
}
window.addEventListener('pointerdown', warmAudio, { capture: true, passive: true });
window.addEventListener('keydown', warmAudio, { capture: true });
window.addEventListener('touchstart', warmAudio, { capture: true, passive: true });
function audioOut(level = 1) {
  const ctx = audioCtx();
  if (!ctx) return null;
  const g = ctx.createGain();
  g.gain.value = level;
  g.connect(masterGain);
  return g;
}
function setMasterVolume() {
  if (masterGain && AC) {
    masterGain.gain.cancelScheduledValues(AC.currentTime);
    masterGain.gain.setTargetAtTime(S.volume, AC.currentTime, .04);
  }
}
function tone(out, freq, at, dur, peak = .12, type = 'sine', freqEnd = 0) {
  const ctx = AC;
  if (!out || !ctx) return;
  const t = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (freqEnd) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freqEnd), t + dur * .82);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + Math.min(.014, dur * .18));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g); g.connect(out);
  osc.start(t); osc.stop(t + dur + .05);
}
function synthChime(level = 1, soft = false) {
  initAudio();
  if (!AC) return;
  const out = audioOut(level);
  const notes = soft ? [1046.5, 1318.51] : [880, 1108.73, 1318.51, 1760];
  notes.forEach((f, i) => {
    tone(out, f, .02 + i * (soft ? .12 : .082), soft ? 1.7 : 2.2, (soft ? .055 : .085) / (1 + i * .18), 'sine');
    if (!soft) tone(out, f * 2, .02 + i * .082, 1.1, .018, 'sine');
  });
}
let meowNoise = null;
/* Gerçek kedi miyavı: bigsoundbank.com "Meow cat #14" (CC0 / kamu malı)
   22.05 kHz mono WAV, ~1.4 sn tam bir miyav, tek dosyaya gömülü. İnternet gerekmez. */
const MEOW_SAMPLE = 'UklGRmjzAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YUTzAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAP///v///wAA/////wEAAAABAAEAAgAAAAAAAAAAAP////8AAAEAAQADAP/////9///////6//r//f8AAP7///8DAAIA/P/9//3/+f/3//v/+//5/wAA///6////BQACAAIACAAHAAcACAAHAAgABQABAAIAAQD7/////v/9//v//v/+/wAA///+/wEAAgABAAAA/P8EAAYAAgD9/woAAAACAPn/BAADAAEA/v8FAAkAAQD9/wMAAAD5/wAA+/8HAPT//v/9/wEAAwADAP3////7//7/AgD5/wEABwABAAAAAgACAPf/+f8AAP3/9v/+/wQABgD+/wUABAAGAP//BgABAAkA/f8DAAEA7v/8//3/7v/x/+f/5v/x/+//9v/y//f/+/8BAPX/6f/3////+f/r/wMACAATAPv//P8KAPv//v/9/wwA/f8BABoADAAAAAsABAAGAAQA+P/6/wUACQAHAAEACwANAAoABwD8/wMACQAGAAEABAAGAAEA7//7//X/3P/p/9n/7//i/+L/9f8CAPf/+P/4/wcABgAGAAYADAAWAA8A/f/9//r/+f/5/+///v/4/wkABQDw//r//P8NAPb/AgDq//f/9f/U/+//5f/i/+j/3v/j/+z/8//5//f/8v/d/+//8//p/+/////3/+v/8/8DANf/4v/l/9//1v/q//7/+f/7/woAEQALAPf/5//o/+P/0P/m/9r/2//l/+f/8//4/8//8v/w/+L/2f/1//D/AAAFAPb/9//3/+z/zP/U/9P/3P/b/97///8PABUAEQAjACcANQAhACIADwASABYA///r//n/CgATABoAFQANABgADgD7/+//+v/k/+3//P/6/xkAFwAOAB4A/f8HAOz///8MAP3/IgA3ACUAOwA8AEEAOwAvACYAKwAmACwAKQAXABgAFwAPAAcA7f/y/+z/wf/e//L/3//e/wIAEAD8//v/6/8NABMAFAATAEYAHABqAEgASwBIADUAJQAdABIADQDI/9j/xP+n/3f/Xv9J/yz/I//5/gj/MP9c/8j/UADuAEcBkQEOAi4CIQKDAdgAVwDb/0v/uv6l/s/+JP94/63/xv/c/5z/7/5Y/gL+6P3G/cv9Q/7p/vv/dwDVAF0BBAKEAqMChQJYAv8BOgHV/0D+Ev0V/E37Bvug+6X8NP4lAH0BXwJ6A38EVATrAzkDaAKcAacBQwKEApUDAgXsBQ4FmgONAZD+z/sL+fL2Bvb/9f725vZm9zP5TPsx/WL/cAIaBu4IxArjC1EMZgr7B+AFMwIg/h/7I/kR9kf02vSm9Zr2JflZ/M3+rgJ2BicJ6gphDBcNHA2jCkcHywSdA+QCcgJwAw8GUghzCcMI9QUCAkf9D/dP8UHtzOsy7OHtmvHT9VD7RwHHBUQJSAzcDj8P2w3iDEELCQgUBDQBy/6j+sD3p/Xf83/ypPLM9Pb2afkQ/oUC9QRBCG4M1w6jDjsP1BFJEU8OSAxSCb0EgAC3/RD61vdi+cX6zPle+W/5Vffp8qnwD+9i7ffunvVW+sn9awQDCyMMpQqQDnEQbgz/Cl4MJwn2AbH9bPkD8Wvqsepe65/r/PG3+9cB3gRnDJYStBHUDwISWhJxD/8N/Q6bC3YGuQNeAHD4kfN28grwv+xz7Tjv3+6P7vvvVfBR8fr0m/lT/awB0QZ0D0YVphZ6GGgb4RlREfEHHf/O86bpTuNM3sbbF+Fx6rzwFPeVBLsR3hhFHbsjGiiIJsgiVh6hFlcO1gcjAKn1h+537QPpVOIw4Djh69883wfjcOd7633z//0/BJYJzBG+HLIh2yH8I7kl6CAOFtkJKvw57EDg8dhI0q3PEtgW5Y/udPj0B+wXVCBGJEQpayzZKrQluB8VF+UMVgXu/BLwy+QK4F/ZIdAjzLLOltLo117jje+n+0AO5h9JKGkupjbBOO0tAyG7FOYDJfIj5FLZO9JM00/ZnN8i51n1YQTFDmwVLh3mI7ImdCQTInUeEBllExMMagHi9vvuVOSQ1wPQCc7GzUTRrdoa6Fr6yQ2tHacohzJ0Ni0wqSNeFfMEq/TK5i3dt9g82hrg6+UT7gn5owMHDOYRSRc3HJMfBiDhHd4bLxg/FH0O0QY2/qL1Fuww4ADWTtFi0NvRbNjO5bn4fAzDHOYpSTOZNs4wQyQfFIUClfNp5UPZENTX1W/b2N9+52fyVf2WBUELRQ8FE94VuBbyFGYTuxNXEzMQPg3RCZoGkQLN/FX3SPS288zzh/MS9QX51Pzt/Cv86/tj+oj3y/SL8rTwIvNu9nX6SgJmCkkSqxc4G9carxX7DmwF3/nx707pruQO4/LkJOoe8PP2M/+7BekKlw1dD+cQMA8ODRYNcwuvCacJigtDCg4JqQhXBRwAxfu19ivxcO1o7OPssu6u8yH6dQCIBrgMUBIjFR8WvhRAEREMBgaq/8D5w/Tn8abwxe+h8IryofS59nr5Wv03Am8F7QdoCgEMkApqCGgF8QGq/Rz69Pfb9Zv0TfUF9kL3CPlA/O7+3f9BAuADewPhAe4CcANYApICcQb9CIYKYg24D0EPqQ01DBsIAQMG/0H8FPrv+Mb6EP5WAA4CwgRJBZYDEQGT/jr70Peq9pX29/U59075Pvv++6T8CP6K/m//RgDyAQQDCwO+A1cCgf60+6z44vQI8pTxHfPh9Rn6BgAsBZkKkg4zESwSvw8QDZoK9QUmAQH/bv3j+7b+7wIBBhwKlA9pEpAQZQ0tClYD8ftp9SrxHe/z7gfxpfQT91b7sv8LAR//Y//X/1b9//l8+cH6V/xj//wBpANkB/EJPAgbBAEBY/ya9xTz6e6c7qbw3PNH96H7yAEuB38LOAxCDbAOrg6oC2kJBAkWCJAHBQjzB00JvwkZCLAFXAG//N72tu9C6XLlxeQx5KTnTO0u9HH7MgIuCeUPQxXYF0caDBsGGDUTmQwhBRb7EPTb7RrnceSO5c3mfui67eX1Sf1eA1EK4RF4FzAaVBxYHQQcnhmxFqgR9gokBTABLfqV83/vR+x757zi8eCx3xvf5uGL5gDuqvcrAsYLZBWRH3QmQiiNKGklhh0KEYUEh/ZX6JbentjG1s/aseJO7WX4dANFD+AXNRyCHTYfzh2UGFsUOhEEDNsGmwM//Ur1xu1j5vPdb9eh1WLXPttt5JfzCgOREIQd4CeNLEYpfyN0GS4KQfwn78nkYt5m3X7gyeQ37QD4NwISCjgPcRXIGBgZUBd9FtoUlhJqERQQtw7rDaMLrwZVAOP5jvA45/ze2Nk91rvWJtzf4tfrsPYMBJsOABalHdMgwSDgHLsVVA2EA7r5ePGG6jrmHuWm5oDoL+yD87P66//7BSsMSRFlFVwYnxmcGsQb2BqxGGwWKBRlEcIN+QYhAZj7iPPO6tnhDt2b2ALVWNdh2pHh7Otk+Y0FRBF5HVcnTCv3KPEjMhxRDvv9R/DJ5LzaRdX91b7YXd/R6WH1kf2DBgwPJBTnFW4XYBdMF1oVfxQ8E3gSURKiEOQMrghABAn/Zfeu8M/sBurV6ODp0+y08PD1SvtG/zkCgAS7BjEG/AQWBEoCNQCK/+gBCwMlAxAGoAdtBksC4wC++3X0WPDz7SXs4Ozp76vzBfgN/ecBaQZrCGQJlwx0DcELxQt7DSMM7gnLCZ8I7QWwAwsB1Pyw+Vr4CPdh9Tb2uvoeAD8DZAfVC90NhQ02C0MHDwOj/kj7nPg/9m/2mfcH+Kr4SPtT/mL+N//mAJIB9gDcAGIA3/4j/l79O/y8+jL5Vfh09172nvbK+LL69vu3//UD+QWwB+oJJQvpCkgLfgsvCw8Mtw0DDqcNxw0eDSQKYwUIAXn8Kfdn8kXvUu4U7x7x0PRT+UT+awPrBrEIDgnbByQGsQThAScBSwCeALAA3f+S/4T9Y/n49Rvyg+5t65Dq2uve7YDyjfqhAdYHCg/7FKgXeBY4FXsRKAwlB0sDAgBZ/vv9XAB7AGEBtgIDA8EBoQBIAH//mv47/73/kQCeAHEBjQAU/8/+Tf7B/Ov7Y/xe/A78SP3T/Ub9kf1c/UL+zf0B/UP9kvxx/Pf6/vu5/Iz71PwG/jD+1P4Y/53+y/3C/Y3+wf/8/5wBNQQABy0I/QgGCm4ImAYxBrQDIwLDASgC1wHQAsoDTgPUAfAAqP7b+0L5LPgD9//1fff9+Cv6XPydAGICeQSPB+8HHwbhB3EHTQQJAwUCEP8Q/Rb7M/nn9Rf19vPY87fzN/Qe9ib5E/qu/eICJQW4BuMKsw3SDDsNsQ1SCjIHWAXfAt3/vv76/jr+mP1T/nv++Py5+137efpF+QH78v1j/0ACKwauCNUHgAjkCO8DFQDa/+D8Cvvm+SX89Pv4+kX8Lv0A+475nfm7+GX3TveK+Hf5LvpK/kMDHQZCCa4NkRAuEI0P9Q2VCiIGXwP0/9n80PpS+gD5xffF98j2IfQl8o3x6fHT8kb2uvlJ/5cHTw+lE2IYoBt/GocV3Q9NB0D8bPIJ6yjlheHO4ivmAes68Z356gKWCGUNdxNkFl0VGRWcFKASRRBID1oNXQodCCoE2v02+ATy2ukN4/rdZNyY3Nze8uVx7hn4kgLaDaYW4xvFIHoiwB64GakT1AqI/2v3FfLX7O7pVuq87VTx3vXR/LAC5gaSCwwQCxNbFJkUuhPWDhIJDgL9+hnzTe356Pfm3ug/7oP1+vzABMILTBDtEBwPNwo3AjT6dfKP69zmROb25hLq2PB5+d8BfwuBFNEbkCHFI2kj5iBqHG0VPQ7nBqr+HPdl7grmrOAX347drt6i5HfuKPfKArsOOhi9H8MkByXRIgMb1hDVA3T2uekf4ZXaVNai15feleYg8Ir8pgjCESgZYR+8ISggSB3JF40QawhJ/szzAOsM5TrgUN7s4I7o+vKy/v0KAxYAHgYi4CGgHk8WsAuOABX19+sq53zki+P/5jDvLfjm/1UIaw96FNMWWhYQFe4RLQ13Cb8Ebf9j+lb0lu1p6cjm1eT65OfpMvFl+msEZQ19FUkbBB75GzYX8A5dBcH7yPGd6hXmzuOo4xvoTu/W9pL+2AapDc4SYRVJFiMV5hK6ELIN5gpFCR8IkgZMBVQEQAK2/g76xfVc8RXsCelU6EHpIO0R9Bj7twPYDEUT1hdtGQ0Y1RNYDTMFU/139i3x4u2r7AHtS+/38aD0HPau+F/6EPux/I3/qwH5BAoJ+wvgD6YRChIDERMPdwsnCWMG0QPQAiYCnwFbAj8CgQEQAJ79LfvS9+70//E28AvxOPOc9pr6a/+PA9AFQwfjB7sFTQLU/5j97/ke+Vz5wPij+az63fsr+nb5rPgn92P2b/du+y7/wgOBC6oRoBUqGJQYIBUGEFYKYgMy/LX3D/Wd8+n0pfca+4L9QABBAvACHwJYAI3+z/yK+yn76fs4/Xr/vQHLAkUDEwNeASL/rv0I/Gf7hvs3/BP+CACVAQADdgJmAbP/4Pwf+rH3w/Z19iL3vfm8/TABawTCBsQI0ghiBw0F4gI2ACz+Rf3d/FX9jv6e/6z/fQDvAOsAcP+J/zYAoAETA2oFFQifCtAM/A2yDHIKKgffAr795fhb9nX0m/Kt8+P1JPjD+uD9rv8wAXYCgQJXARsB+AA2AHz/vv9O/zv+H/0R/OP5Rvi29uD2h/bJ91/6I/0HAFgDxQaqB1YIGwhJB64EOgJlAFf/dP5W/wQBiQIUBJoGTQhzCLII/AdlB2MGVAVUBGYDpQHmAD//u/48/mv9IP3A/CP9Gf2U/Lz9t/1G/uz+X//o//gALAHbAD0A9v/L/pf8cvph95b1Q/Qy8wf0VPVu+Gz8WQCVBFUIDgwrDS4NZgy8CoYGXgOdAKz+hf2p/94BUAQeCNQLQQ2JDZEMkwlUBfEAtvxA+Qb3EfZS9kP5Ivsb/uP/cwFGApcBZgFp/0j+hP3X/En9z/7V/4sANgGVATYAj/5f+6r4LvZv9CH0s/S99sj5of05AIwDFQY/CKUInAg7CHMHiAUoBHQDswIsApcCRwJkAasA8P4g/Ev5F/fA9or2zvbx+SL+3gCBAzQFZgeICC8IMwfdBbYE7gJVAaj+4fse+uP4Zvhs9wb4yPjR+UL6G/yw/q0AMQIuBKUGnQj9CCwJtQjtBnIEggKm/6L7e/hu9vf0RvMp89fzd/QD9bP2Rvre/XoAOwSZCBYMFA6GDpYOxQupB+kD+/9u+4T3YfXA9FD0dfYO+qH9pgAvBFoI5ArZDGkOKA+hD8YOJw78DHMJrQXWAGX8RvfN8yfxK+5c7dftpO5K7yzx+PSs94b6gf5xAjcEFQVjBlUFugK7AX4BIAECAHEBSAMLA2gD5ANSBMcCwQH7Aa4B5wBrAEIBj//6/cb+BP9W/rT9Ov/nAPQBgQXrB7wHAggnCPcGtQIl/s75BvSS7lHrCeqY6WnqEe/O9Lb6EQKwCX0PVhMiFtQXJhU9ELQKDAT4+8jzge+37ADrlexn8bn3qv8PCEYPsxPIFQ0WIhNtDcsFSv789prwPe2U7ADtAu9r8+T4hP3GAgMHNAq0DLcOnhAVED8O5QvdCDgDj/uL9SLx/euL6XfrpfA0+BMBFAoGEp0XChoIGT8U7Qz8BJz8tvQJ7gXrLOvW61fvFvWH+8ABNAfoC1IPrBG1E3gTnhLzEMYO6Ap/BGT97vVl7n3omeUK5S/nbu75+JQCTAtvEz0YkxnvFqMS1wqWArL7bvVx8Z3uCu/98ETycfWm+n394P8rAgUFQAfOCAcLMg0ODkoOuA2/C2AH4wJj/1H7bPc09sj1evUQ9of3efg9+fX5E/ug/BP+P/9lACkE0wc1CZwLUw5VDpUMQglbBV3/NvnS9Fvxt+627uPwuPTA9yr7vP8gAjsDXASVBXYFowSVBZUGZAZSBtMGSwaJBacEKATfAicBgf82/3f+f/1M/ff9B/5z/Yb9Xv2L/LD7jPzl/FL9XP97AAYCtAK8AvEBiQAiAPD+a/2w/DL9bf13/S/+Yf5s/kL+q/3G/Tb9y/zD/KT8Gf0u/nP/JAEIAuAD2wUrBlwGSgXEBIEDOAFDALr++/z3/Kr8f/1q/tf/wgH2At4EEAZgBjIGqgVzBP4CfgA3/lz8wvpS+u36Pfyt/bn/sQJXBAMFXgVTBuAF1wRdAysC3f9U/SD7LPk69t70gPPx8rry3vK381r02/UX+M767/3BACgEowdQCqYMvQ3UDgMOVAw7CtwHgAV9AkIAGf4F/gb+Lf4F/5wAOQLpA0oERQUkBRQFvARxBOgDxgLZAjoCAwC6/gf9BvrL9m/0dvL28VryTPNs9Rb4wfqA/KD+DP89/z7/+v6+/rP+H//r/0IAKQENAgkDVwPFA0cEOASQBDIFWQVoBVcFqgUNBqAFwQS6A2wDcQLGAcIAEAA9ANIAAgF8AVICwwKvAlwCVQFh/0T+xvw0+Xn42/et93b4L/q++2T96P7L/88A3QArAGIAaADH/+b+9/4X/9r95Pzg/Kf8t/tK+w77vvuD/LT+xAG1BNgHRAtxDhgP7A7tDVcLbQhEBUgB4/5Q/Ej6zvnx+TL61Prw+k78svwC/Uv9nv7f/vf/gv8iAJv/6P+x/xT/Yv6S/tj+O/+m/0P/+f+4/7r/MgAmAF7/R//r/ZT8FfxD+xX8ZP3P/5oDrAdkC68Nrg7gDhQNGApxBfMA1/tJ94PzgPH08J3x+PSJ91f72f6+AbgDQgSyBGcEDAQWAzkCfgHS/9/+rv4c/+f+7v8AASkCwAOABHUE7ARHBFUCQwGG/1b90vsi+ir5zvkb+937E/40ASIDnARABeADawLqAO79jfvc+Pz2p/V79Ub4wfn6+zv/YQKnBGAGXgasBHACRQCf/Wz71vjF9/f3HPnn+hH+5wKhBSkJkQu5DQEPXw7aDU8NDQyVCdAGJwSqAEL8RvhK9KbxQPHt8MDwFvQO9wr7zf40AtMEzgdfC3kLIAyQC7IJlwbsAbL72fYh8yHvzO2x7pLw7vOB+ED9pAFoBoAKMQzjDTcOiAwwCfcEYACC/B36offD9lr4y/qG/UgCbwYACa8L4wwDDdsLvAjOBMv/+/oQ90v1hfPB8QzzkfW0+G38WwD2A4MHogoADFgMXwopB9gCw/3B9/ny7fBe7/PuVvF59hT8mAKtBx4MvA/ZEBUQwQ1YCckEgf+Y+tv2G/R88iLx8PGf80r2lfrQ/p0DOQjiDIQQGhJbEUIPRgs5Ben9m/fl8j/vrO3q7xf1J/zOAdEHdQydDvkNVQtbBjsBH/yB+MH1J/RV9Zn3NPpL/X0A5QNXBjUI4AnlCjEMUQxwC0MK7AheBmYCKP0a+LDyJu5x61jrZ+xB8Fn2IP4sBXIK+Q4VEWwRYQ+JC0AHQgKL/Sv6kfcM9cvzefNf9Cb1g/dx+hr+ggEYBbgIHg1fDzQQsRCeD6EMNgg/A+n+kPqq94r2XPfy+AP7cf1p/x4B0QF5AS4BYwD/ADoBgwEFAsQCTgSXBKgEEwRCAxEBU/+7/Pn5fvia9rf1jvWT9rL3Svl/+lr7J/x5/dL9pv2P/kD/sv/hADQBqwFZAoQCuwIDA50ENwWtBfYGVwhSCYIKCQpICQ4IaAb+A7MAyP4z/Qr8E/z4+4X80fzi/A39uvyM/Jv8d/yh/Jn9WP8CAIAAOAGVAd4ARACv/x3++vxo/Oj74vv2+6L8+/ym/T7+/P52/9D/e//c/w4AlwBjATACFAI5A1gDFgOvAn0BtADl/8X/nf/K/1MASAG0AuMDkQT4BIYETwQ1BIsD2QLZAZEBYwEoAfEA2gC/AMMAIAG8AH8A2v/G/hP+E/0g/Ij75Pt4/DD8iPwt/d/8RfyG+4D6u/nO+MP4cfmF+oH75vze/kQAXQGqAlUChwLkAu0C4QJDA5kEWgUdB2kIzQjZCKQIJQiXBmYFOgMFAh0BgwBlAL7/+f5H/pT9FPzT+jv6zflM+v/64vwn/icAjgHoAnECCwI1AE7+b/uq+Hj24PT684T0OPY5+Af74/4AAcgDCwWCBscGRwVABdYDoQIHARAA7f52/t79Cv5R/iH/JgANAfoBGQNzBJ4FFAfjB4gIlAj8B+4GDgWtApIAOf7m/Jv7tft0/Dv8xvzL/8gADwE1AZoBvAHMAND/W/4V/gP8Jvol+jf52vdL99P3fvkj+3f9t/9ZAaUDsgQkBaYDLAIKAZkAT//C/k7+gv6c/ub+q/8AASkCCAMWBWoHpQhdCfwJ0gkSCQgHtASfAU/+wPqR+ED4FPh2+H36iv0nALsB3gO/BaIE4QPCAysCZv+w/QD8evqj+Oz2HfgC+Y/4h/p9/e7/nQFCBBgHdQdACNYINwicBfEBvP4v++j3LvVn9Zr21fjP+6UACQSgBlAIuQdEBloEqgAz/WX6M/iP9633zfi++mL8A/6aAMEDpwSUBdQGAQduBn0FLgSzAWv/mP4z/jL+Kv0N/vD+yf7h/s//8f8EAPsAwQJdBDQFDgYIBhEGJwSGAMX8xPnl9q70Y/OR8+L0wPVY98n6gf5MABkC/QRmBxQIBAeYBYQCSP/a/ND7y/nu+AL6y/yz/l4ABASTBl8HXAg9CaoJcQgbB8cFeQPZ/wP+Hfxx+bv3RPfq+Kn5SfsuAPgC7gTEB9II5AiXBr4Dev+g+s314PJy8WHwI/GW9HT4zPwiAvUGwwrnDGsOTg5MDU8KnQaiArz9R/kv97P1ovM69N72ZfqG/pgDRgc0CqEMxg1MDUAKFgeaA3v+/PmS9o71KvVX9KX2mfmu/AIAhQPEBX4HvQnaCicK5QgfB30EpACL+9T3qvVl80ryoPP09o78iwLMBuUK4A2VDg0NmQlJBWQAz/tK93v0k/P785D1zPe6+qL+lAOuB+kJxQyMD5YQPhBiDlEM2wk7BvwAcvsp9tzwlOyw6h7qC+xZ7wr2Yv4cBUgLQhBAE4QT9BCeDaQHqQCI+ur1avIW8NDvAfEf82z2avoI/iEBxQNCBj4IGgm7CWUKLwpoCboHWgXSA4QCFwFAAMr/4v8mALkA/QBpAHr/tP5m/ln+Ff7y/rz+O/9TAHIBSQIGAqQBdAEIAJr+pfzO+y77w/oM+zn8y/2k/lz+2v25/GH6b/i59nD0YPQo9U72z/g3/BUBnQRrBzkKCg1SDjcOcA23DEMLzwmbCLQGnQS7AlwBhv8y/dX7oPta+2P7pfte/BT9L/1K/eX97fxO/OL8G/1i/an9XP6G/tz+3f79/q//ev8LAHsAAwEmAeYAYQBl/4X+g/1q/Iz7G/tM+zb7DPzl/Dv+jQDRAaQDGgUuBmMGDQYHBaAE6AJUAm4B8wDMAPgA3QBiAIkAtABZAZwBugIXA68DNwRHBBgEswNgA14C3wAsANP/W/7g/K77m/vd+5P8Zv3C/Sn+df9o/xb/kP2g/Fj72/m9+J74ifin+LD57PqW/P79uv+7AEEBQwJuA9IDrAMoBFIF1AXPBWQHFQiZB4cHyQa+BUIE9AKpAcwA9ACwAJsA2wAjAJj/iP4z/bP8b/xU+1j7u/ug/BD9i/3r/bj+3P6q/jz+EP6H/P37V/vw+r76z/pl+yv8W/0z/nz/YQAiAdMBAAJeAa0AAwDz/lj+xv29/aX+0f8CAWkCQwRxBSEHJQi+CIcIwAdFB3UF7wM6AncA2f74/bT8z/sH+9T6BPvH+8r8VP4OAM8BugNaBSUGqgUNBXUDXQF0/h38UvrJ+O73O/g5+TT6NPto/An9qv0q/pz+JP/l/9UA7QGOAiMDHgRaBL0DaARRBGcEXwTIBMkFXQWKBZUGTgagBfUE8wNIAlwAzv4V/R38tvvz/CP9c/2i/8wACwJaAt0C7gJ3A+MCmAL6AS0As/7I/Ev5pvf19iT3+PZW+Nn7p/6rAFADXARbBdkE6APVAjwBvf87/jH8Z/p8+vz6BvsE/Iz+EwF4A/cEfQbhB+kHvQcqBlwEFQKZAMT+FP6k/BL81Pxj/cL97/6Y/ur/0v/h/uH9p/01/bH88vxH/hkAsAFZA44DRgOdAqsBt/9Z/Qj7+vlC+MT2uvaX9+f5H/yg/4wDagc8CrEL6AusCoAIDgamArf+7/uo+Tn3CfaQ9dr1kfZp99r5Qvv0/KYAEAQhBgMIDAq2CmYJkgYgBO//RPx4+bD4KvgB+GX5yvve/QoA5wNPBg4I5AlODIUNvwz7Ck8IrATq/wX7UPaD8gjwHfDV8DnzPfbj+0UB3ATYBwEKTAseCtIGfQLW/Z/4JfSm8vvxSvIO9dX5Jv60AvQHuwtZDX4OVw/XDlwMdglPBlsC/vxc+K304/JL8YnxavRJ+Gv9MwOwCBsMOg5lDoENfwkrBNT+lPj38oPuu+wV7Irs9u1O8Ur2APxOAmAI9w2vEkgXBRlYGNwV6xGkDEUF5/yj9JTsFOiA5cLkL+e+7b/1ef+xCSkRgxbtGbgaYBgcEwoMqQTc/Fv2BvJe7w3tS+zj7bfxtPWJ+Tv/OgQlCYENhBChEbMQAw+RDEsIFwI6/O32nfL/7+Tuy+/L8qz37/6kBHAJUA1ND0sQqw0CCqoFgf8i+9f2TvOB8QbxrPGr8jf26vp4/ywEAAi6C0MPQhCOEFAPJg22CksIdwTsAPf+bP0I/Of65fpJ+m/50Pci94r2ffZW90L6+fzd/zAE5ggjC0UMKg2sDNkJ0wVTAdX78PbX8s7wDPDk79bxIfVw+Jb7fv9jAicElAVlCLUJdwl/CfwJXAhcBgsGPwbZA+kCQwOhA64CVQGLALz+NP1i/UH9gvs++x38K/zV+ov7Cf3u/Wb+v/+gAJQBmALDAiwCLQFgAcMAW/6q/N77dvo3+az4dvn6+Bb5tvkZ+uv5O/vW/aYAhAM7BmQK2w07D0QPpg7DDIgJEwd+A5D/+vzf+yD6mfj895z3Bvgu+Uz6H/o5/D3+8v7u/9EAlAGZAUAClwNIBEsEVwS/A3kCwQAr/uv7CPm/95D33ffp+Er6G/uZ/CL+1P+KAX4C5gM8Bo8HmAiECGoItAe8BhsGoQRXA/QCswF1AP3+rf1Y/LD7gPvT+sr6C/xO/C38cP57/x4BJQIzA7kEpgVABrYE3wI2AHv9evsj+X/3G/ec+D36TPyC/gcAEgHnALIACP9b/b78lftM+qX65vwBAAsCowRKCGkKqQrOCcMIGwZKBL4COQEjANQA2gHlAWcC7AG3AUQATP4a/fn7S/s5+rP6ufwE/sj90f6+/0r/Pv7U/Er7gvkQ+dH5C/v3/Ob/PwPVBBEGXga4BOUBof5Z/N/68vm6+Vj6RPwl/gUAnQJnBMsFUgieCkULDwu7CzcLBQrYCHAGvQNLAFf9wvo09+70QvQo9ZP2HPlt/JIABwM3Ba8G7QaSBU4D6QDE/If6gfnj+Ej5Fvse/94BjwM2BYoFFATaAkEBc/56/G37NPur+T35JPrl+8j9+/+wA1AHnQoyDfYO4w47DnMMeQmDBegAEv3y+Rf3KPVT8+Py3vTl9Q/3ovjg+gf9mv7A/2ABjgJWA7UD4wPPA40DigKXAMX+tv1V/ar8avs7+7H7qPtp+yf7dftw/VoAHwSsCPYMvBB3E8MTRxLMDo4JoAMs/cn27/EA7qbr8usc7dnvIPK59r/8egEOBbEI9QuCDRIMXwl6BoABK/3r+JT1LvOD84z0wfbh+fr+vATSCPML3g5QEc0R6RAMDyAMGAjMA6n+nvjO9HXyI/Ct7+fxG/RK9rP6zP+rAmYFjAgCCxEL4wiIB+sCkf3D+IL1pPKD8DTxkfSh94b8VwOsCVwNjhA+E+gTMBIED0oLQwYyAQX7JfTw7ePqnOmm6EXqFO939af8RQRqC38QcBMYFscVZREgDPQF4P2W9RTwWu3/6uXpyOwV8tb3p/7YBU4MtRADFlkYARg9FTcRDgyJBBX8t/MQ7VbpLueB5kbpcO5M9VT9VQQNCpMNlhAWER8ORglkBIf+lvjz8xHy9PEZ8q/zGPey+8MAsQWECS8NThFJFLsUHBNhELQM/gb8/1r35++/61Pp+efQ6VrvafitATAKqhD+FEsX+BWHEBwJAgE6+d3x5esL6sfrqu0y8F/0wvqAAEkFYAmtDHAQqhMGFVUTYxD0DU8JOQIh+a7xEO1J6rboeemc73b4tQJcC5cRYxYdGf4W3hApCfIBSfv19Ibvve3L78XyPvQF9sL6jgDABIgH+gkSDuURShMJEpIPtA3kCe0D5Pth9BPu7Oix5TjkAOYA6yfz3Pz/BcIO3RRnGUIazBe7EyAOOAd1APj5VfXK8iPxme9f7obvEPOR9ir53/xTAtwHBgy9DswPiBAsEHoOxgruBnUDqQBp/XX7efq6+nr7HPzc+2H7ivpa+Xn3Tva29m75evwBAQYFOQi/C50NXwuXB48D6wEU/y39l/zz/UgACwHr/5P+KvwD+Sf1n/Fz73vwVvKJ9NT38vxgAh4GBAhGCXsIogkjCaYH5gXTBu4I6gghCYoICQlGB/EEsACz/Mz54vcz9gb1aPaU+Rr9/P+BAQEDcwQkBcMCNQCD/zT/u/4k/a38eP3J/hH/2/zz+/361/rc+An3B/bO9tP4RPnl+on9RgA9AtACcgNOBCkGiQZVBYAFEgeGB2oGvQSkA8MCBgLA/5/+lf6W/zsA4QD4AfMCswPaA7MCTQGP/xL+u/xq+237Ff0X/yEBmwKSBHoG8gXgA+MByf/j/CP6xPjQ+GL5aPq4/Cf/aAA7AJr/4f2O+0H5fPc+94D46/lT/LD/OwMuBpwHiAhXCCcImQdWBVME2AP3AygF3ATXBQgHAgjLBh0FOQNFAZj+jft++Vb51Pm++ir8sf7xAasDxQR3BFcEoQT4AuwAZP9o/rH8LPsQ+4H6Mfuy+2D8YP26/eD9JP1K/fX7AP3F/q//KAEBAiUEfQMGBFEEDQRmBKYEIQfvB2gIdQfiBvIEXQEO/m37dPlp9y/2GfcO+bT7aP3k/twA1QNGBH4CAgG+/zj/kP+S/zEAyAIVBr0H5wc/ByYFuQKq/d33SfW09ADzafJU9Ej2Ifoj/fr+zgAfBQ4KnQs1DnwQdRKyEtcP9QoRB58B5PpA9G/vt+sZ62zrW+3v72n19vvX/vMB8wPMBq4IZwizCP4JHQscC6QIJwbzAin/QPrE9f7yYvOR8570hPYS+cP9UQGXBBQHMwtwEGQTQxR1E8YRVw5fCFcAWPm788PtlOnO5qvnC+qK7ZzxRfVY/HwE8AltDeoPZhQ/FPcO0QhQAkf8hfSJ7gjrgus079bzOPgH/zsIAA+HEnUU0hXdFlIUqA9pC6IHLwSX/gP4MfIC7fnozuXx46HmD+1w86f5GAC7COsOhRICEx4TtxM0ENAKiQO5/I71ge/w6qLnvucw7ObyCPlEAQMMJBX9GZgbMh6HHJoWYg/nCPL/Nvbz7Y3mqOBq3qzf5ePh6g/01/6aC/QVtxslH5Ehax9CF/4NNwS5+LTsteQd4bjfxuCz5tLwePrNBB8Q9xkkHp4f2yCIHvYV5QzjBCT85/HG56/gc93l3J/dHeE56r71HAIbDpAX/h7EJIIlwR4CFQgMtQJt9rzqBuYR5r/ntOg+7LL0Cf6TBUgNpxM/GZYdAx+5Gv4TyQ7EB9T8gfBS5Sbgxd0s2/fbxuIS8I/9WQoRFgkfDybRJ/UhIxjVDYgEtPjx7NDk2+Lo5fnmf+gN7Sz3ZgHYB5QOPBYwHhwiZiANG/UUUg7FBTr68e8q6SvlQuFx3czd5uLu6XbxrfwnCf4U1R6TJYcn2SNtHpkVywk1/HXxmekK5F3hqODC4kLnmO7G9n3+YQa6DiwWqBq+G5sadxkoFgUQAwkEBMQAKP3V+BP3L/Yt9ov1MvON77/rT+pS6OvmAOkc8ML6AgXjDfcYVyKGJrIk8CCKGwMSGQZD+sbveOac4Crdw9x933flw+xE9KH7RQRRDI0R0xW2GhMeRByyGXsWJBADB/H+9PjO9M7yS/Tw+JL95AGhBDIEPACQ+jr1kfBj68fpEO5S9MD5eP7rBTINNxMSFlQXABjuFxYV5wwzA+/5mPH26UTil94w4W7nA+2E8f33pwHCCHcN4xCrFYEajxypGzAZERQVD+oILQLW+tH2cvZe9if1kfSN9e312fNw8S3w6fCZ9NH1N/ri/pgFCgrGDP0Owg17DYgOTQwkCDcEAAW1AMb65fT58Y/u1+ta64XukvMd+Wf/PQTWBdIIQgsEDKgKcQsODoEQbg/lDIUIEQR8/s/3GPPU8UbzYvbx+vL+KADsAPz/5vwu+bX0A/Uc97b5s/vXAMcIWAouCy4LdwsAC1sI+gd4A2UBbwC4/Af4xvHc77jvPO8T7xfyW/rG/vkBeASyBiAHmAi9CgsKGwxQEBsTqBDjC3IITAKJ+RbypOx46lHrge188cT1CfuFACoERQV2BAsFYQfiAz8B3v5CAfUCJQGGA98EBQjGCCQGYwOR/4n9evnH9nz0uvb4+6z9Nf74/bcA3AA+/pT92v66BEAKXw5xET8VpxYAFKANZQVo/mr3i/CM6Xnks+VR59vnBurD71P22vq4/2QEVwl/Eb4X1RugHesg2B8TGJMNxAJd+HLtSOXK4eXjPuho7cL1BPwSAbMFsgmuC+UN8ROyGAEbtBsJGiMW3A1dA4r4me7x5U3fjtum2gPcxt5t5OPqBPNjAcUPlxxPJtUvNDZjMMMk8RUwBLXxI+E91nrQWdJr2m/kru4d/PULahbmHKsgbiQaJZUfthk+EtcJ9wCB94Hu0eb24PrczNrP2x7g4OgW8lP7YwRaDv4Y1x9hIpwi6CENH/4VZQqi/mjyseef3vzY9NYW233i2+qE9MoASw/0Gn0ibShBLA4tLyaXG18QlgLt8yrm9dmszvbJcMvQznPVC+PC9TsH7BjJKjQ4CkB4QVQ9wzCCHZwIdvL228TIgb8VvmnB0MkD2obtFf/TEf8jFzHqN1M9cjw6M3ImmBcfCQT4XOlS3yrXUdEMyrLJJM7v0pTbf+g1/IsMpxw5ML87Tz++PqE7JS/lGhEJnvXG4VnQZshOyGzIn8/T3g7xK/90DGsdTCgpLHIupy2uJjgb/w+MA+XyIuNa1/LO9cpeyR7QOdy/63AA9xaNKmY3qj83RKs8VSujF/oD0e4G2RLLV8ZUyMbMzdax5Bz2nwgQGP0kgy0nM+01Ii/CIu8U+QYL9vTketbDy+7Ilssw0WHaDOlj/d0SjiMqL1s4Mj4HPPQumxyaCpX5I+eC1cXJd8ilzy3Vf9xa6Q790w6JGjMkJyyDMaExGCjPGYMLcP4M8Pred9B7ycPLAdDJ0zTdxu8QCCUcZysON59AAEaQPqMseBmqBzT3MuSY0W/H9MdqzW/Pz9Jy4L/1UAdbFK8hPi9dOgo8GTNFJJkWswmO+jPqXN+B31bjB+Mh3i7druGu5Ini4uMn7Zf9kRC5HrEpkDOCPCE7xitRGAYIdvkX6RHXq83RzfHSdtbL2s/l7vSLBd4RtBp/I0Ysmy9OKUMgEBjqD7sG2fzf9bfwPfDi8HfvheyP6yfsduqo5lTldOjy7uX20f8DCmoVnR81JVIjDx7fGe4RwgZ5++fyxu2I6W/mKeRF473ljeio64/w4vjnAk8NthV7Hp4klCaoJeseJxUTCs7/CfZ17vPsp++S9Vb9pwMHCPIJRgdV/1/24+0C6Hnl9eb36F3vzPiyAdIGHwwkEZISjBPcFagWJBWPEIgNKgek/EbxPuoi4i3evN3/46jsUvTw/0UIqg1rEckV/xeKF/wYOhuzG54XiRKUDKADXPmm8CLrzef86IjsjvCj9Lv3L/kf+vj4L/ga/Tv/AAViCjYPUhDHDNYLHgotArT+E/5HAfAC4gD3AJsALP3d+Gfz6O7l7qTwyPXS+bz9qQe8EOMUnhXxGJ4c8BolFC8OxwZc/kb1Oesi5MneR90o4OLiRecH7sT3Ff/aBSUQNhkzIOUj+iePJGocqhJoBQb3Xuno3wzcA9th3vvjwevZ85z9zgfGDosTfxq/HwwfzxxEGvcVrw9yCckFOAGa/hH8pPf78ZHqpuCS2CXVr8/k0frYDeYX9g4EKRSFI5kxuDk7O5g54jbUKooYOQMB7QHZd8odvb64yrw1yzjcSeun/RYTlybUMd046T62QjM/gzMZJYcTpv/66h/TK71Ir0+swa7ZtcLHXuJR/ycaRDIsRaBQ91PSTnE/TyimEez6a+RYzzXB477iwdPHctBb3+jw2QP/FaUkbzGYPHdFrUF6NXImPRZvAvXq3dW2yO3AQbxYu2LD/s6n3hXx0ARqFesmTjlkQuVBDz2XOAwq1BNs/LPoVNg3y/vFtsm+0XzfkfGtAk8OChoHJncssSs9KgUpGiFrFNgEX/R+4rLPDMGJuwy7uMHF0dfmwv9jGmE1FEimT3RSZ07PO4ki/wYy7UbUjL67sTKvGrQjvS7MVeCg+PcSISu5P0xRZ126YIpWNUTyLMMQOPO82KfDmLWarROqyq4Ku0XGA9UI6FX/iROCKEE+iU3sVRZWvU9/P/Anhg5R8rXXq8I4uS64Gbn2wkXV4+je95kHOhkYJpctUjMJNpgysSmYHRUOmfmD5ZfR38M/vRu79MJK0gvowgVCIVg4CUduT1FRukG6KQ8QRvhS4IvIkbq6uGG/pcgJ1IjlbP2AFnwpbDdeQyFMyUqUPGYmNA+l+ATgz8j4uJqxw7Dct8LCR8/p31f25BD8J4057Et8Wc5c21BfPFwjkwal6LHL47UvrGSwobsZxlbXp/FsD/IiQzDzPDFHYEkRPicsdhrEB5Dz1N2Yyy3ApbwEvpPB/McC1zjuUAj1HhwzD0Z2VNRVSUhuMg8aCABc5rnO+rtptom72cMkyv7UWurrAyoXKSZcOM5LrlWzUCNB3y3+F038q+CCyjy/WL8JxWrIvM/u3NXrlvFl9eEBUhWuJRYz5z3mRepHBT64KhsRcvfz4TjPYL4Lt9i7o8bEz1Tb9e5lBFkWxCTWMRU85j+ZO0wwgyDCEHwAn/NJ6hbmhukY7wbzxfXY+J/4l/Ko6izkWOAM4RzlLeyW+esJnBuyKOAwFjXsM64tciEaEDgB0/Pg5qnbN9Rs0njU7Naq2t3hbu48+1IHWxPqHzoqpi8HMDArNiJ0FyYKbPos7V7laePw5IDpVvN3/90J1RCkEKUK8ACZ9LDoJtv40PLSl9pQ5W71dAuIIp81fkFJRttD3TheKF0Qj/bh4KXPqsPduim49b6+ykDYS+j4++IQGiM1Mt89sUNhQ5c9QTJmIYQOVvwa7eHhCdk81+XZjt4G42XneOq37JDvKvFk8V312fu2AykOChkjIy0t6TSSNTUuISLZEuH9pOaV0XPEWb0NvZPDvc8Z5HX3/gqkGyUnFi9lM04yJiwhI7cbahRWCUv+lfUr8b/txehG59bq0++B8sTzKvMo9PD1PvJK7l3up/L0+cYC3QnxE0UfCSjnJ/ohhx0LFpEJYPoy7Z7lAeF12vvVpNf73QjmvfCA/GAKsBciJOorPC3lLIcpgiA/FvII+AH9/df3yfMN8kzxv+xn4yvaV9LryoHJwMyH17XoAgBpGhEvYkBpTvJTPE6uPnMqchT++sjhrcxqv264n7cyvG7F7NVq67AAmBTRJpE4E0YTS0VIAEDiNLwiBgqo8qTes88gw3S7VrqgvhfKytUF4J3t8f4UEvIkUjE1PcxGfUiZP64siRr/Bjfx99yOzb3HxctrzznUedyc6N/3LgYjEhwedC/ZPB8+XDhsLiUg2Qtq8+/d8s+4y0LL8MqG0crc7ufn76j2RPxzCCYZ1iIZKmgzCDrRN/cnhhRZAAXud9zRzAXG3M7w2eHmhfQgAxMUViIxKVkqMCweLcMmYhcYBu/3KusR3B3P+clBzaTTItvO4/vvTP4eCrcVhCETLE42oDu2OZgw6SC9DhD3g93XyXK8Dbnyvv/GpNdx7uYE2Bm8KwM8jkajTKVKdT/CLpsa3gIK5r3M/7o+rTioday1tPDG1Nyp8ucMcydWPeBO61nMXGZWSUNZK20NhO8f1FO7Aq5trkaz9b4y0Sbn8/8/FCIlDjOpPNlAzTzqM2oo8xc0BHbvdNrkxt67hbgNt7i+AtEN6rgHuCLOOJpLAFbQU5JDbivvEYn3jN4Ayn295r5zx/DRDd6j7Y8DnBUhIros6jXTPKc7XjH+IfkQ6P2r5pbPw71EsT+u3rEXuVXK8eMMA8wjmT4uVeNmzGznY1NKVyvtChroRMdIrWChyaUKspLBT9aM7+4MiyO8MRc8eETRSTREXjW/JEcV+wAi6PfPcb0ksbSrA6v4sknGuuPrBVwn0ECZVnNkC2HuTdUxzRUF+p3e28hEvm6+eMZwzZnVO+Ea8b8AcQzqFh0mdDZMQK9AdzteNn0oehMW/FLpU92t1EDOgMz9zgHUYdoT3c/em+Kq7Sv8wwl1GicvmEKdTiJQIklgOhYlvwc26KnMB7gVrTSq4q0UvLPSX+0wBVAZKi5hPlVF5kHoOv8yGCm3GG0JG//H957v1ei14lDfV9w22WPUoNGZ1dHbM+Lk7P36jBAiJJkx0Tw5RAtFwDrLJmUTqf7N6F7Wv8d/w53Hp8xd09PdgutR+f4D0Qx+FTMguijMKjYr2Sk6JmsdHQ9ZADf0lOrq5MTivOeg8yH/CgthEBEPXAqF/iXu497/0i/NKM9Q1sTjY/VYDEYj1TRHQhJKn0qMQqUvJRa++5Dip8qzuPqvzbE5uwDLbt3R8vwJTRw5KW0xRjfWOa00Ji1ZJGMaug7BAST23+5j6SjlruSk5qvoQOpr66zpkehZ5wflLeTE5h3vFf0vDF0e0TNORvxP405WRYkzpRYJ9DHSKbf1pWSeWKELsGfJOuhXB/kfrTRRQydJJ0WGOa4qxhwKDrr97fCk61/pdehg6ajs//Nf/FIACALYAxcGgAWn/2r4GvPA7mPrdueN5mrstfTM/WwGvxGWHxIqWy1tLPQokiGnEg//meyC3gLTXMuXyUzP2NtX6Zf2eAM5EJIakh/EH/8ejB4EHLMVqBD2CwIHFQI2/Ij3QvSt8ujwSvDR73TvHO/W7gLvh/DY9Hj7NgMqDPYUdR0gIxUjaB9rFzAMp/9T8TLlBNzA1y3Z/9xI5uXxwP+SDEEWNB0ZImMhpRt5Eg0GG/ug7zvmbOHy3knhneZI7UX1X/0TB5wPbRP5F7gbihxVGXkU8w/nCpkF+wD//Lz7CPlG9RDz8u7N6njoYui85w3sP/N6+/IDwg2/FKEZ0hkPGgkXpRFVCloE0f1Z+WT0ge/w7K/qBeqG6x/u6PKg+ND+UATAB0UJNAlhCIIHegVgB4kJTQ70EvUWdhoqGlAWwQ8cBrT6GvA85Qbd59nG2MnaNeF+6mjzp/yaBBINJBXMG8YhiiPoJrcm8SHdF1oM2v7I8vXkOdxx2T/eDeSV7Tj3VwHPCOkL0wnaBJoBzv0C+Xf45P3lB4YSlhz8JlItTi2yJRAWbQJ47QHYGcYwuFuzVLlUwoLWTO8WCD4kZTynTR9Uv1FrR4gzJRsTBGnpWdl3z1PI6Mhpzw7ZpuYX8Zv86gUwEEcYORgNGEMZqhZ0EV4JkAFp+172/uzB5Jzkbezb8uT54wdCFQog1SFaHC4SswbI+JboWN1X3DPhUun08xcAHA+kG20f/x0vHREbZRTcCakAEvys+IH0Ee5/7Mfu3O7P6hjt/e6F7VfwZu8v7xrzm/vzAxkMKBiDJ4EwJTXBMYYp4R0+C1P0X+In037Mqclwy1rXSeb3+WALiRcCJj0uiS7bKWMfyBJUBJHyEeGR04vMYsgXx1HOFt7T8zQLcx8NNaNFukjaQuYylhsTAgjmocwJvTK7acFuzqLjHP2ZFqssAzmBPno+MDZdJooR5f1e6yDZnsn4v2q+2cNiy6XXzuosA9kd1DJqQgxPH1LoSL8y6hUQ+f/awsCvrgaqnrS2xz7ek/e+ErcruTm6PEA6yDKeJtYUiwDM8rzoGN8a2PnTG9Rc2MbbsODR6Wz5hQ4cIvIyUkNOTJxMUT3vJJAIUevyz5S6JrBZterF2NoL8cIHxB4YLaAwFi7oKjYlFxyxEK0HUwJy/e31/es75ZveJdXLzTzKgsxB1ZrjRvqRE6gsNUPvUCFTVUj7MwIahvyo4PrMOMKKwcrLftni6M74dgdQEbAUWBbuFakVchUnE08QHA+MDuMKiQLH+2L5evnR+DD5mP1XBZ0G/AFx++Pxgel13KnSrs8z1fbiUPYZCdMeazYXR0VJ5kTFN0EkhAnL6svPUb/CtlS2k76x0Zbr/AQ2GqsnOTA+M94tTiErFU4LKwVZASH+O/2YAWQFiwN9/7j93/u99lDuYulM5Uvkm+Rx4Tzk0eyB8hH6JwXPD/Eb2ChgMMwxtTB9Kn8bsQbn8OTbdMxPv1y4C70jysHdCfQUCqchRjRrPntBljs9MVQjlBC8/krwE+bl4cjhGuWx6/30uf86BSYJCgzCCUQFgfwx8+bqNuPP3iPgWeQh8BEBHRKuIkQwnDiJOekwxCH5DKT3beJs0ZvGg8T4xyjS4+A88coBuxG5HRkn+CxALwEsCya9HMAP1gHQ9CrrdeQu4ZHkOO7z+FQEAQwcEeARIwrp/Tnx6ON52RbVkdaR32Hv8AOqGaErVjpPRLlBRjaSIrgKYfF32FzFhrnNuFzA4Mx+4Lf20QkPHWAoji4GM/IwhylkII4YwA2bAa35BfN97FnrlusI7B/xkPY5+Zr6hPqO+j77tfiw9W/2fPcZ+MT2sPig+vb+NwZoDTAWXyC7J08m5R4/FJQEufAS3vzNlMdDyl/Sk96s8H0FDBYVIP0kHiaPJBMdhBMWDUIKwgYVBAoEwQT2AxMB6Po888jtZuYn4H/drN8V5hbtZfUFAtoLABOjFckVfRZfFR4RLA5ODZkN4Ap1Bp8Axfox9GHr1+Xb5mnpE/HY+tYCOAyqE2UU1Q84CTkDWP2C9JvxS/O799P9TQQdDLAQxRHoDZwFj/oV7v/l/eOx4uvok/jDBz0UZh4AI0wjlxtNEIEBm/ZZ71vpf+ZK6fXusPfO/swBxQYEDIUMhQydDt4RExMXFFgSfAwtCM8Cz/ew8e7vC/EW8/n2VfynAV0C1wJ0AWX/R/5b+or6H/oh+nP8ygB7ApEGygpXDskPXhAhD8gIQQSE/BzyMets5ubia+P35xfte/kfBfMOjhe7Hp4kIiPLHHAVbwx8AmH38etb5PLh0+B937biIugs7k7z9ffI+eH9pwJICBEOgBQXHiMn+SlDJ88gXhcMCNP1DeWS2HLRi9BW0g3a4eQp8y0BTgyQFjEfSiYbKOwl2CEyHGIT3Ag7/lT1g/Cb7hnuyvCh9TH7z/6M/vz62/VF8oTtgOQg5bfq+/DG91QBjgxnFIAZVhpZGMMTtxGdCooCa/1Z+kD3dvJa7djul/MW+KD7CwSYECYYuhmLFxcUmg+LBmr6cvGa7Ybrk+Zg43rkMOXN6IXrke7t+PoKMhpCJakxIj33Ppkz7x/IB3Lv19RFvCmv8LIiwMbRaenBBLoeFjO+PKc7fTeMMDciNQ+p/5bzpOiH3dvSmMzNzMnOVNBj1T/lLPgeDmIiyDPTQ/xNg0mLOOsgXAdv6q7OobsutbK7uMqA3ejzhgyuIgouHDFaMRUsQCOwFt0IC/659MbpU9821k3Qxc/2zmjUS+Iy+YsTIiyqQnlVbV4GWYtD2SaEBQrj1MGtq0CllqwavcXTdO5rC3gkBzJ/Nqs2HjMdKTsaLA0mA+/4Ge4o4s/ZKtQl0KTM/80f2Hjq7AEqGYEuQUPuUOJPZEA5KdANfe9J05y9ArbivofOSeKY+qYU0in8M4Ay2Cz/IloVFQSD9Unu0upl51fkB+MI413jYeGe3uHj+fPEBmIYUyzQQGdMWUrmOUYhJQXg5XTIu7QQr7a3Csp63xP3XhFIKRQzHjHALeopvx1QDooCAfwp+kj4kva393n6Bvn88enoNeHL3TnY/db83hnw5gS1F/8n2TS7OQI0Eib0FFcCSPKE5ofgdeGP50zu3/Po9FT4H/pZ9uvzcPZc/bMEIg1tFg8g4iaWJpgfNhgJEbMFxfos9sv1n/bP96H2qPN48OzpLOH12nvbouD46R738ghfHDgrljMsNhI0tyhXFaQBDO7F3Q/T/81l0EHarOZb9Dz/ngkIEnMVxBTqEYoQuhBCDjsMXAypDDQKsQNl/DP3pPGE7bjqN+0r9Of6eP9qAdUBvQP7Ah79f/oS/dMBpwKgAw0Jcg2uDcYJaQRoAWP9TfV67kHsEe5G8wb3x/x6A4sLFw+vDVgO/g21DPMLawqxC7kOjQ4zC8sH6gM4/dz1P+xT5CXfm9273QzioemD9XH/NAh5D0EWshqMGtEXZxdqFUEPNQjaANL5KPND7AjmdOTi5pTpfe0T9Mf7WQRsCg4OWBIjF0oZjhXzEiwRGA0iB7YBgP0e/PT5NPf682nyY/AM7VLo2ORd5N3m4umK85T+8QpFFqMglCQ3JYQiOBtkEQsH6P699pvxFe7C6d/n7+bw59rpteye8E/1df+KCGML3hJ6HN4fZh4QHm4cCBeZDpsF6v6T+Uzz5ex96D/kt+D54N3gXuKo6JT0o/6yBr4RjhzcIFkeYBoME2sJ+P0v82vszes775T1Ef55CCIQXBVvFvYRlgp5A6/6J/CA6eHnJOgl6uTwAfpfA5kMZhKBFW4W7hZ4E5kNfAh3BEH/hPna8S7pYOJ+3JvcdN445fHyZQRzFC0hfypMLkUrBCGyEUoBTPK+5Q/dP9rC3JfoCPZ5AlwMbxatHF0ZJRHXCjME4/4d+936kAE7CjsQbhOhFf8TEA7uA1X4E+0V5mzhS+AO4rrqc/ZL/GIEJQ1YEBUQ5w2yC5QFDgJV/wn96Pm1+HD4gPXe8oby/vNN9lr6bAArCRMQRBQPGCoY3RSTDy8JnwAo+ovz7e9A7sPuWfL3+BUBGAiiDqATkRQLD7gEHvhi6rrdeNPuzrzRKNrW6SYBMBXoJ9Y43EI5Qik3KSf0EOj2Ot6ryp6/NL3uwrXPDeJj92UOsiFMLw426Dn0NmorIB05ENYCcPX76xPoBOca6AbpGOmM6dLoT+pr7NLrIe9R9x0AzAMCBmoMXhH8EeAPyBETF7UX2BW6FP4QLwwoBT/7J/GS6UfoHug85i7shvlQBTcNHxTEGu0dRBfeCjP9Lu/z4U7Z7tRB1pnhjPEHBdkWEScuNfo7ZTdnK7QaLgf67zzY6MaDv6DA7cgS1tDpuAFhGVUsjDleQj5Fk0CIM8AeAwrn8hTa9MITswqsG6+1ue7JCOFR/ewYHTDkQPVKY0y/Rr04aiMbDIb3keNt0hDIM8cAz0rZ+uSZ8y0FuxRgHQojjicPKCokZBuSDkwCJvVL5nvXdsxSyBrLiNDh2mjrVQSyHfsvJj7lSItLrkE6LY8U4fza5ebRn8NFwTnJp9cn5uD1pQgzHGYlQCfKKAwqGif7GzwPhwS8+DfrttwW0S7KsMikzZLVO+EU85sIqByJKwc1sTxTPtk18yQ8EWwAzfBh4P7Tfs9g087b7OJC62v3ZQfAEyYZxh4rJg0p0yLFFz4OYwXH+UbupOaQ5CnnjuvB7h3xufQq+br51/UF8qP1/vwZAT4Ftg5DHBkj7iEmHYEYhhCsA4D0Xuml48DikuFD4Ybl1PB++pr+/AEeC8wUdhdNFkQZFx3hG+0WxxBFCzYFZf4C9vfumeqo6R3qQ+jd51DsCvNc+Lz4Zf6BCBwNRQwhDvQOmQ0ICXcErwLiAFoBowLRA9kFBwZZBpQAyfgv8kbt2OcU4pbifukY8Mj4swRXEHsZgx87JHAjzhysFt8QQQfj/BH4oPZX9bL0dfaS+PP6//k09k7yB+9M7MjqWuwN8QH4jwFRCtIOTBIFFUwVpBFbD28MBgu9COUEwv/K+XDzCu1b5frfo+Do5NLqvfEE/LQH2g+xFAcXQBj8F1MVnxBdC7AIVgWRAAn7j/fg9Rr0m/Im9Bv3dPtH/+cCqQSEBZAGugSIAaD/zv6F/m3//ADwAiUFrwYIB9AF9ANWAoUAU/52+gX4p/dD9gz1Q/Sx9g76zv1vARsEpQejCuIKvghQB00FBARH/+v6AvkS+Tv5L/i9+Vj8DgJGBrsIlwqKDZoQmQ5HDCUKxgcNBFr+Mvhl88rwAO7J7ZbuzfEu+hwCEAUIB2QNYQ/9Cf0DlQH6/or7Nvk3+a37jwBhBEsECgTsBP4D2/5p94D15PbK9j71J/aA+gr9lfy1+5v9kP+AA0AHywxPEY0WfRp+GMgSpwx/BTL69uz95LreBdvm2oXf8edc8nr+rQuEFEUa3B8bIdYcnRR/ELUJy/8k+Vv1yPCz7izvLvNu9PH14/ul/V/9tf0M/4f/Of54ALsEVQjVDFQT+BaIFTsV2hLUCbv/3vYZ8ELoD+JU4MfiXOMv5qPqd/Ci98wF6RJdHO0nwDVUObIubSKFEwT+m+fI1xbPk87O1uPjBPBb/YoNphbAFSkRsw/ODa0GZAHnArQGUwngCp8I+wIP/7v2QekA3VbaO9tv4Jzsm/zkDTQf3yzILHUmPh95ETX9Iut04oHfyN8S5X3wa/z6B3IU/hlKGXEYQhlYEn0FBQCV/uX5q/TP9Gv1h/Jq7hDsuehQ5JnkYOns8Nf3DAOHElofSCZIKR8sPyjRHpMPKP888Bvkhtu91v7Y9eDf7QH5pQL9DEYYSh2BGtcZghr3FvYOjgmBBGb78e/S5OzZos/eyzDLsdBc3HzyTQ0nIwI1nEWkTjtIXDfGIs4Jqe7L1yjHLMDhwwTOhtw97JwAeRWHIvQpri5WMQAulyJQFo0I8/j050PYEMn1vzjA9cTMy4HcoPaYE+YryD/6TPZT6U+mPCMgEwTk6VXRMb3vtMC65skP2u3qtP7cFJwj2imMLFUu/i7OKKoeNBQiCpv+SfI95TrZ+s+Uy2PMxs7m1XTmfftZEdUj2jNPQNlFbj/vLhcb2gj29Y7iUNMxzmHTM9q833jnjfUvBLgLRQ+3FTkdACB6HTYZyRMoDoQEtffr6qDgRtoo1hvVLtmG4ofx2gM5FLAhLy5oNZE0aCojHWwP2ACK8c3lsd8131rhu+Q76CDt7PSq/FoAuwOdCpgSORSmEn8SDhKzDvsHtAHi/Of5wPn++X/64vxYAZEBNP3l9wL0Mu1F5AjfP+A45NHv8f3eC6Ebxi0EOO42qDD7JZEUlP0L5rTUN8n3w33GzNAL4QH1gwmEGZkiCinHLcon/hyMFgUQzgaA/Wj6bPdk8v7vnO4w7Czqcuu+7IPubvK6+QAANAV+CYsQsBTQEtkRehSoEIkJFwU6Apj6ZvMz8C/tHurj6Wjtz+6Q8b74pAAFB+cNGBb2Hu4i7iF7IbEdpxOKBVD6i+/v5Orf597Y4PXncvGY+m4ADQYpC9MLGgdkAxQFngUqAUwAnwV0CPoHFwjEB6oFrAN5/9v5APXQ8grxMu0K66vu7fQo+iD/ZwkTFWAawx9rJMgh/BlSE2MMdgDc9A/wK+236mzqdOy67s3xcfT89Nj13fg4/DL9h/2y/h8DCAWaBEIEcwebChQMdA0DDgwNzgxxCSwDcvwo+E7ye+u35tflleYM6bDsIPIN+78FrQ4mFwYe2yENI/kdphX4CtICWfyi9YLzEPf5+x0AWAF+AKH9tfm085js8Ofd6S3sTfH99Vf+ugftDBUO9g30DhMLCgW3AZ7+uvx7/Wv/n/+UAH8BoP+K+xD3TPRZ8yn0PvUG+Xz+DAQIBwUJxQr5CnML9At8CgcMyw6dED0P6gyMChoFBv0L80HogOK53Yvb49rY4VjrwfNp/M8FUhWmIG0nfCzzMEYwGykZG9gJmPmM6UPcBNKX0P7WsuD867D3QwYPER8WChY+EokQPQxKCeEHvwjLCwUQ2xERDlcIdgNu+53xCer05lTnxOi36SnrU/CP9C/1vvXz+V4BiQtoFPobUCXXLPIrHCIpF5QIZvli7ALhRt0u4EjnL+3z8uP5XwBXAiIAk/2PAQsF8ATjBVUKng7IDZUJlQIx/Xb3L+7A5x7pLvLt+jsEDQ9kGKsbpBgRDbH/lvVz7PHkreKJ6dHzFP1LBX4JSQ7vE1sSXQ3IC0UQ5BLGETgR1xC7DvEILf4482XrTuaq4MbbZNuZ4z7sXO8a8pX7OQYfCsELog+WE9kWYhkEF+ATeBLcEBAJIfxm80PwfOwa6L/mmexb9Wj86wH5BDgK3BBdFOAScRG6Ey8URwxgAMn0AOso4e7UfM760CLboehA+TkOrCKmM5I9mD5RNekngRal/rrmMNQ6yoPHscof0pzhN/XuCewaJCmlM/o6Djz9MsAlVRf7BOjuQ9jTxve817gBuoHBaNDQ5Sf9AhVdKrk6F0fCTOBGPTgtJWIPfPWE3XvLl8JzwrLHrdM55nj8fBBkH3kqgS9/MA4q4R2nD6cBI/P95OrW5M1izbTPt9ID3CruwgRPGiws2TmGRENGID1uKSYTNv3b533U1ca2xADOL9iE44z0UwqbG3cl9Sr2LnAv9CjlHEIOgAB18tLkuNanyXfF/8iSzUnUSuPN/GYXNCvKOtlGgEzSROIwTRUw+1Xlp9KxwiO95cYf1zjlwfK1BUQZuSTXJ0MpJCu0KOAgFRZACvD/3/gb77fjE9vE1/zVWNTf1MbaNuc495QJ4Ro7K9o4PD8uO0csuRozCLXzxd+s0lzP2tRa3H7jE+2M+cMEdQiJCvwNeRJTF0cY2xdaFwQXQRU0DfICrvuj+TL5/fa/9dT42Pyd+cbw8+e74gfcC9fg14/gM/DKBKIYDSmYOSNF6EUlOhopchUA/Z7iVM1Xv3+6gb30xrTVk+ad+VINehmfHlUkqCpLKsck7CK1IYodKxaRDKsCffgM8IHnzd+K3cjgHecZ6vHqxPCb9mr2MvOj9PD6GQPNDNsVZCDFLCM0tjAjJXsY6QhJ9Snfjc4NyODI28ma0KzfC/SjBXkSnBwdJjQuzy44JxwgRhyCFgELHf5E9X/uVOdM3mHXYdcn3PXgjuUI7RL8qw3aGKEeAiXCKw4pmBydDWoAovRv6XXfQtuu3vbnD+858xP8gwfODwcRVRE5FZ8XYxZuErIMIAeAA6D9j/OX7PrtSvJv9QD5GQOUDvATYRNbD40LpAXM/Gn0le7h7qPyivXn9tj5Bf5F/wL9Z/q3+qf93v5F/9sC6gjOCxgNEgzRCSEHewK++mf0x/BK8ADxB/M694n9qANYBB0DrQO+BPMD4QGjBGUKtQ6AEbQUHxSFEiQQ/go2AgX89PYL8T/raemq6QzsSvCT9eP81QLGBiMKmQqrBvkDfgEN/6b9FAAuAyMH2As5Dq0LNwgXAqf5vO8l6Cbk7eJK5czr/PIC/PMFzw0hEZEUlRYnFkQU9RKtEFAPXQ/BDLYImwScAIb6SPK56qbkD+PA4mDk9+qN82r93AY/DScRTBVzFk4Sog/OC4MHqAJCAHD8nvhf9972YfYQ9Y71/viT+33+sQFZBrQILwlOCDkFK/+W+vn2mfKQ8Xv0pPi5/LQCaQoSEJgSTRUZFlcTdA61CK0BNvdk7/voOOMc3+3gPeQd58jtBflkB7oPFRnnI/Qqsyl1I1kbMg7v/+LytOh64i7jfuhF7m70ePw+BdkGjgRgAw0FPANx/uX99QCGA2IGtQkGC9AKhgriB8QCP/iS9FnxIeu65Q7nc/Ch9eX7wAa6E/UaNCBAIgQfSBnpEsAKVf7Y9OvvPupZ43Pg+OUY7Ojx+PcSAj4NORTgGIUbJByRGnsYfBINCIn/YPri8jTp2+L+4rHhUuDA4MzjOetm978Dpg+CHYQr/TPMMp0rSR9jEkMD3fDs5GriVOQ85sfrh/Qm/jQFLwbSA2gC+wCz/dT5PfZ89/b6hPw9/Q39K/50/bz6f/mz/HcBSAZWDUAT5BVqFpgSeQjo+h/vDucX4MDbO97w5xD1qQJ3EiEhZCltLoIuhSW6FwwKnPv961HfPtjw1bDVw9ny4VnpwfAE+4AEuwmJEJUZER68H0whwCDdGLoMDAD08f/kXtyv2jreAuaB9EkEug+2GEoh4SGPGVoRcQgX+33uluUs3m/YpNiW3tfjKOsW+HQFEBL1Hs0rNzPsNTc1yyzWHWwLLfiW5GrTQ8m9ydjOItjO52L8Sg5IHM0ndiz0Knom5hucDXj94e/W4QPVIc3RzEjQ+tYM4oLxuAOlF2EpUjZrPvNDU0B2MSMc8AWr7uHW0sQavkXBPsxk3ZfziAwMI4cy0zlFOPIxGCUZEdn7GuiY2KbMNMWGxSPMVtf15Ur22AZmGxMu6zjVPv5Byzy2Lqga6QIN65TWb8Yjv4DBkcuz28DvmgftG5oswDdeOm84Ly/QID0QLv3N6QzaF82HxOPBY8XmzlTb7+xFBAcdRDAzPgFILkrKP+QsmRUG+1fh+cw8v4O7ScIu0IvhvPf6Dxwk+jDoNsA3IzMrJ+cWBAdm+N/r3uLx23LVQ9MR1evX5Npk4snvOQIgF0EojTYCQvFHwz79KuETZ/uu4jvN1b/yvUrG5NQY5dX2TwoWGgUifCO9IzIi7xxgFecPjwrrB+cEuf8++eL0Ye+B5d3ahNXx1o/ZV99x6zX78AouGSsjqiYaKGwnRyHtFQEOkwjcAOb3d/FZ7ebnuuOX4A/fQ99E5ovwg/gmAYMPbhsUHzAi2CVgI9AbWBVFD0gHLwCD+xr2jO6Y6GLjXdub1K3ThdjW30/r+/xXD1whvjDmORA7hjd5L+geFQpO9iHmk9gt0ILNjdEG2RrkBe/O+CsDFQvSD4ESYRaJGucc1h4TIMQf5R2CFzMM0f7v8hrnX9xz1GzSrtUW3ejmofHx/JAIQhIXG2cfdSATIY4f/xeEDjAFjvte8TDoSeIM31XgUOQt6aTvqfjXBOAMmBGOF+wdcR5fG4oZjhUND8EIlQNg/Mb1+PKr73rqaul762Pr5+v37+X05fhF/cUCtATvCFwODhC9D+MREBQYEZ4MLwimAd352/NA7nfocuX/52zr8Owd8238oQTLC3gUVRxUHiAhKCKiGxURXwnhAd72dO7O65bq5Orh6rfsoe5b8/v3Vvpu/RAEEQpYC7cI2Qc/CeoH4ANYAW4E0wY/BpEF/QJIAngBaf6I+Zn1xvWH9UvxwO688Af1vvi6/dUHuxCRGnMi9yPvHwEa7BEPAujwHOYF38TaSdv94HHrsvZhAmYKBxAQESAS5A3bA7r76PoK+6r5QP1XBlINCRDUEQsOBQZY/9j4YvHg6cTqSfDR86/3ov82Cd4M8A+cE8cTOBHBECQO2AbeAPj+avhe7gnqJegY5s7le+oN8mj5QgNsCxoPcxDKE0cUmwwqBpAFzwEs+/D4VvjG+GH6lPzZ/bX+MQOnBSkFkgSpBt0IWQccBnEFPgR+A9ECNv9x+7b7XPxK+J/18fVt92T4evn8+uL7of1g/jL6p/SB83r39vql/q8HJxVzHSQfwRygFMgJdv7m8EfkMOKr6fHwuPYTAq4P6RUqFSYRtwyTCCYExQH4/v79YAAgAPL4b+9r6xboLuFJ4GbnQvD6+CQENxAeF3wdECEzHwgZExQwD8wDXvnI837vSekD5hrmw+Z156zs5PZc/w0J4xe9JVgqQixvL6Aqhh07Ed4EWvWS5/jdZtJvyEjIIs4R0XzYPuto/bEIixjUKnM07zkGPrA74S6tIMQQZ/jY3+vQ7scEwJfB4M6R3z3vPgVHGmslWywoNL0yySWNG+ETxwMy8WrmHty80J7N0M990WfZEuvG+00Lah6XL+M3tDupO/EwCiA9Dcz5SeRC04TL6Mg8yhPSO+O09JcFmhm3KVAxijeuOIcukx3RDGv4QOGazZK/XLcNuPvALc6s4S75gBLqKxM+q0gvUBZRhkQlMKcaVADt5BTPTL8it+C4g8I50XDk+foTE3olWjHpOlo/XTpeLQMetwrp8mXdP8pPutGzSLdOv5/MY+Oz/XcZQjH6QltPi1XZULY/ZymkEDb3iNz+yJa+LLwawEPLdttW7UYCuBW5IvorwDSjNTkuYSRZF44EsvBw3/nOTsV8w5zHT89S3mXy/AqBH9IuvDpGREVDWDd1J+oShvxi5sbVactVx6nMYNf35c/1hwhhGs0kNCldLbQruyA0FNEGpvUF5YrY+szZxmHJQNH42mrpGf0DFPEomjcpQvVJQUqKPXQqkxJ4+FDgtssVvfq4yb4QyljbafDdBY0btCshNcU5yDlMMbQj8ROW/grqN9nYyLi85bu/wOXJVdl17g4G4h81N7lFR09ZValOEzwbJaELE/Gv2B/F+LzCvFnCR84Y39LvGwM3FhwjDixqNPU2aDG+Jysa2AWC8frc4MnwvYS6jr1IxzXa9fBtCxgmTjjLRJBNo02wP98s4RdHAK/pitZ4yBHCxcI+yBzSj+G29PEKAx8PLjk7mkO+Qc82GSV3Dmf2A99/xxC1N68as8C6hsnn34D5uBW7MB1DRU5DVpVWwUZwMEcYqv0m42/MSrwLtqy3yr4WzLjeqPaUDqIkODTvQBFKcUefOzUrchUz/QXmVc49uROtt6vJr2S6ss3q5ZoC/CEAPTJOwlrsYLpYg0SEKxYPJPHd1bPB77Pdr+Sy3LuKyiHf//ezD88lUDqyTOJT1FDLRgU1BhzRAKflTMoLtYeo3KMzqGS0y8ZG33P6BxeVMWNFI1K7WGZYu0v5N+AgMAfJ7GLWr8SquKuzF7Yqv4/LDt/I9ygQMydyPSNNbFG1TvBDvi9XFKL6teC/xiK0taniqFqvXr2X0AvptgQzIr86VUtKVp1cuFjERq4vVBXw+Kzdcsczttat+63NtLjBfNW27oIJJCQ7OidNoVV7VHVK4jbKHAUBTuYzyyG2/atjq0+xMb7w0HzmRf/hGWswvz8NTn9ZcVkjTVE7RyQqB8Docc7At2aq7abPrRO6Y89z7CcJqSJFOTRLsFA8TY9CLTD1GA8B6Ohqz5K8V7Jur7SvM7m7yijhevuJGmk1j0mcXHZoGGTpUkM9VR8+/Ffbu8FAr6mmLKk0tRDGJ9wN98gP4yL+NHtEp0aTQrY6eio9Ek/6aeH9xmC2RbDirpy1qMb93PL3CBcCMSBFI1fiYVZdUlD8OmodAP5e3kPEC7WkrBmsxbidzeHiyfw1FsAnWDgHRt9GTj60Nc4lmQ3n9I3cQ8UXtSKv1qw/tbfHH94W+4QZFDRaSPJZ+WCZWJlJ9TOsFrL2qNs9x166drM1taPBBNIH5lv9FxKpIoA0wUG3Qag7mDNAImEIO+9h1uHBGrVxsFGyeL9K1LPsWwgZJRg87k3LW9hdVFIdP+ImRgjr59/M8brUsNSt+rSmxYXZtfCIC/kfazCWQL5ItkLhOOYqQhOe97/e1cdTtqGw2bFduAXLBeOA/BcYPTGKQ5NSSVy3WMVJNzZoG/T7st6Hx5i2SK5Gr5G6X8pu3gL5ixG4JRo3WUYtSSdC+TWbICQDU+UqzGC1L6qxqi2yP8IA2rH04xBxK8ZAaVDJXM1eRVUqQ4gpewsU67zOKrlFrF+owq/4v2XUjO5eCgAigTUkSPFPr0tCQTsvnxL+8DLSabdHpdWePqI7rzjGCuRhBNojlz73VDRmLGyRZKZTGTo3Gh338tY/vFWqJ6MwpzK0uMWA3yX9TRbQK4pBe09uUXJNWT9JJAwFmuV0xpmsH58enSimk7gX1BD2LRfKMzRMw2HPaAxlgVjqQWUk3wT7573MlbgUrU2snbLiv/HTi+zGBIQceTSbQ3FKCkzAQSoqKQyT7pLR37nwqtWm4K6lwNzal/loFW0uJkanVp9ZhlXYSQ40fRoKAFXm8dCvwlG7BLqWwXzNnN5z8ZsE9Bf/KOEzDTktOrkvmhzrBU/vN9mOx/O9zLpkw1/T5OloA3cZei+pQuhNRkz4RDw2tSGbCUHzG+DR0LzJgsgeztDWreN48qv/+gzSGuwiySRZJdog4xIW/7LsHNyPzSbFH8X7yxbbTfLEDLgg3DLKRKNN6EkqPz4uFBbT/djnxdSax2DCycbXz6/dxu0u/7wMORlZJSwqWyjMJNUc3QsF+NzkZtOixmbAWcHFyZDYMe6pBwke2S93QIxLS0uUQ8E1lCDTByvzpt8A0C/HhcZyzILYVuhJ9/wFNBPoIHYoLyn4JZQgHhPY/w/tK9r/y/vCnsI+x47TS+Zk/nYVfCc3N0BFcEoiRoQ8eipRFNL83+h11nzKk8T3xvHQXd+b76wAYA8hHUwqtC7+Kx0oqR01C2T2xOL60BHEPsBMwhXLwtoO8QwLHyA6MXNAbExxTABE7jVDIHwITvI43prNucQJxKzKJNeY5t743gjVFmgkZy3gKwMouSEREoj81+nJ2ffKqsIRxETKndfV6pYDDBoHKy88REpiTYZGrDtfJ5UN9fXk4hTQecMnw4TJtNQw5aD48giYFuEk8i23LPQmKSFxEpj8i+jD2APLOcFCwtfIFdRX5sL/+RXOJl44XEhYTHJHRz+tLN8SIPod5aPR+8KBwODFA9F+4ZX4gQuAGcEoazPiMY4pZyCqDl32h+CJ0KbDpruOvhzIm9U76HsBIBhJKeQ6TUubUC9NIkWWM4YaJwAv6DzQP73dtVe30r8t0PfoOgBvFG8qfzqAPgE7pjLCH+oEBOxa1r7Dpbf3tmC8ncdw2WXygAlAHDkxU0VTT19RRE+/QCIqoxHj+W3epMdvu6O2VbhRwxDYd+x9AQ4a7C54OEA8zDq9LKUVQf0b5wjRzsCLu4O9r8O40CbnoPxLDzIkKDj+RKxKkU0ARLUxMBxJB07vydi5yqbC7MEFyEfXeedE+KgMZyFMLekx3zMYLPsZuQTg8CTcWsvbxJbDy8dF0pzkefiBCfQcqS/DPd5EmUiZQoAylCCaDfn3/+Fr08vKn8dZy97V1eIv8MgBehVnIp0oWiyPJwIYXgat9hrlJdWw0JbSNNYu4A/xRgDoC8obHivHMO8zzzbLL6MfuRDaA8XydeIS2wbZctiO3q3rofQo/YQKERYlGL4XvhbxCkX6ue775SvZkNPS2UHiB+vp+j0MWxaLILktbzKhLjkrpyW7FqcEMvnN7KLfLdrU3FrfCeUN9PUBpAm8Euoe4B+vGhUVXQi888HkcdzS0KTK+9DO3cXpFfsnDQUbFyfAM345KDTYLL8j2hMvAPnvB+MH2IPULdps4Sbqn/odCpwTgRs5IhQheRktEUkCJe4G387VX831yePQqd1a64f/HxGRH08tDjqZPkg7wDIyJfoRXv346DfWkckKxrHLC9aY5er3RAshG78nvC5ELUEn2hupCqT1JuQF1XXJMcXGya/SKOIa9/8IMBnRKZE4JT4mPv44jizvGdYG7PPv3pjO0MfMyDLOnNrx6zv8eAwRHqopFSyaLAYo9hlKBtL1uOSf00bKesgUzJ/UIuYz+RoJeRvaLgc7uT84Qes6uyvZGCEHm/J93Z7Pk8vNyoDPcdzY6ij4mwiRGuIiXSY9KVUjoxOsA8n10uNI1mfRRtJx1BDgOvHn/qIMuh4lLh00BzicOCIvqx+bECQAp+t03IXVNtJx0H7ZP+a/77L7fAuUFR4ZbR1bHLkR4wRj/TDyuOX+4a3jX+Qp6ub2UP9tBq0TQSBDJFgnPyr4JW8apQ8JA1PxouKe3OXZsde93+/sFvg6AxMRLBg0FywW9A8aAYLytOqZ4unbft5G533vAPvPCSoTThq5Iz8qRSlUJR8iThlgDHYAaPRv5lDc3tmu2VPcDuUR8hb+3AqhF+Ecrxv0F6YOrv7474rkadrc1TraaOI57BD8MQpUFochACwoMC0wUC3HJAsYygp+/ULuvuGg2t7Y29rK4SLsfPZeARIPyxfGGb0YlBMgB873Le7D4rzYqNjF4BTodfNIA4QPUBh3JKos6SyOLOAooB+9EWIF/PeU6ZjenNnG2cfcceZ08rD8zAeHFQ8dFxwvGZURTwLS9Onqot1V1WvY2+Ca6Qz4uwaeEaoczygdLc0sCiyyJlwc2Q9vAz72Y+k34BrcL9vK3znqx/Tk/eMI4hOzFxYVNBAPBfn2oO5b52vd7Nux5GjtJfgDBjIQehfyIkQrYyq8KbMm7h2jEIgEJPad50TdTNlC2MLbT+b58xH/rAnCFsMezh62GocR5AD18o/puN170yLWkt/+6NX24wV4ENoaDijSLbstKC2LJ80bnQ4kAYrxQeSz22vYsdn73zLsNfgqAiINkxjZHM0aTRaWCVj5zu3h40jXwNHr1+TfUewo/u8L3xZ/I7EvWTFXMBMs/yDzEOsBVvKH4u3WZNLt0vvXrONR80AA6ArIF+IhRiLVHVEWawa19mTsIOD60pDSatmP4BLuCABXDikbOyyNNg84QDftMPwhmg68+4ToidemzEDJvMte1ITkGvYqA9cPuxzhIqsfnxoHD3X+P/Qc6+zfcdnH3mnjmurA+EgDWgzzGtgodi5+MqQzEyzcHYANxvmE5lzXYs7xyl3O8df76Bv3OgP+EJMbCx0PG7IU3QUy+6nzFepc4JHjIurg7jD7tgXZDKYVeCHMJd0mZyhzJJEarA4xAbPyBObQ3fHYvdoV4GbrNPar/iEISxEjEykPogpT/9r0MO+t6ZrjGOj28YP50gWrEk8asx9fJ94nUiQkIdQZcQ2qAe72j+va4gnfn96U4V/pkfPS/sQGnQ7JFOcVCxHeCTj8Uu2i5XHeeteC2jjnm/KXA5UW3CNVLUs46DtzNVsuLiQDEub/Re9r31TTEc/7z/PUTuAy8DsB8gu4F1AgMCIWG9URgwLE7wblLdv30AnQ0Nyh6PT3bw2PHhosaTzzRYxCEj2ANKIhOgof8wneGMx3wZ2/Z8RM0bHjLfquCc4X7SPHKOIhMBc5B3301OlR3+rT8NJd3rznYfWABjcVlSNgM9w8UzxOOxY0rCTREDj51+Mz0pHFgcAfxK3OqeAo9W8FPBRxIRgm2h4hFjQHfffY7B7hgNf02KTh2uiN9VcENhKUIZ4x2zgOPIo8CzRkJCURLPlu42bU2sclwyDJUNSB46L0EwNDDn8XHxj1EfMK1gDW+NTw8el15m/riO1a8Wv6iwMeDfkZiCZkK/QxqzIhKZUb+Atd+ZXme9sQ1CfVFtwc5rzwNftfA4MHRwXF/CP2tPIG773r7OwK81r8/QReCYAMSRI1F/MaPB1kHvchCSCZFZoK//p07IfgSdj91YHf5O82/VEKShXbG8QamRAM/nrthORo3nXa89cD4g3zt/9pB9oNSxbSHtMkcyZrJlInCiaMGRkHhvTQ5TbY4s/izUXX0+qI/7UOKxlZIrUksBqtBxH0Fehn4RbatNbN3e3sp/otBIIMWhM2Hv0luCeUJ2om2SJpFiIFc/GZ4ufYqdKa0yzd/e6ZAGkOABehHGYcjxKjBEz4vO8K62Xm++VX7LD1zfxYAqgJKhBmGCgeOSEJIBse8RV6COv3MuoQ4APbmtyA5NvyDgIGDz0V5RjXFl8OJAEI9Q7vv+wc6kvpw++v9zv/eQLbCecOlxiXIIwkkyTIIskbVw3N+qbnB9z51S7WFN2W69v95wxsFaIWqhI1DFn/IfKk68brWfBM9Xz8HQMlCVIKdwvdC3cO5xT/Gkoguh5iGncO/vy26FPYfM/oz1TaBes1AKkUBiKcJHQfzRIB/0rsGN902sbdk+OD78z9nwoJEK0TNRe9FxkccCC8I0QjiCDdFKcBeOzX2E7KEsR9yQvatvHFC1IfByo2LD0liRNA/Gzoj9wm2LrZu9/h6g758QOpCTcPMxTjHF0kUCpFL0gu+ydHFyUAruVN0SrEv76lxZPYR/KfC+4d1SdUKRMhEg/k+tHq1eJS4V7ibupL9oQB3gb+CtwNoxDFFvMcNiJyJOUlJB47Dy77mOcy2AbOws331yLqywBeE/AdMiIFHtMN8fnp5yDeYtu93Ynnc/a+Bo8RqhcMG8AabR0xHTUdMxtEGdQR1wNb8qjgRNQozDXMOdbF6L0AehZVJaArHiuaH4cLl/Ui5QTcstck2hvjt/Fz/sYHWBAqFckcYiJJJ3koNyZXIdETt/896r/YFcxuxrHMmdvm7+wGIRlVIyQnzyIiFNYBLvL66CDjbd+a41XtpvZ7/cMFGQwdEtgbZiRlJxcpfijkHT4MUPgz5Y3VA8yFy1HTCOMR+LEJHBXJGs0dVRVYBqP3qO606obnmOlk8Nb6DAIcCfIN8A/eF/AdgCC2Iachphw2DzT+Nuwf3fDT9M/d1GnhAfSnBi8TVhnHHI0YlQkK+oftKuja5K/kFenI8wn/ZAjqDzoUlxpgIl8nLSYRJLwg/RMZA+nvyd4Q08zNcNFO233rSgHJEG0ZCB0+HPsP+/3Y7t7lFuPY4WLmve8k/g4HUw8eFVUX/B+NJqontiaQJZQdTg2l+VXl/NQyzGjKZ9E54fj3vQw2G3ggMiLrGn4HGfTx5aLf79u63SXnVfSEANYLIBOGFw4ezSb3K+MqAStHKMIaHAZe8HHbWcwIxZrId9I45h8BUhQhHX8ipiEFEa78fO3w5EzeXt5l5kHxI/ylBq0OeBICF0ogvia1KLssQixvIRkOq/mZ4+LQ3MTrxIzNpt9P+tIPwRsnIhkkahbNABjwaeem4S7hMOk29BP/vgc9DfwM0g2GFRQcoR7NI3govSROFfADdu+r2+TOmcxQ0T7fXffTC2wXphyeHCwPpfls6HPeL9ri2nnmCPb4A3cQeBjZGaAZnR7BIbQh0iTkJm0gKA8//JXm59HrwyrChMup3LH5rhS3JGUr9CvKHIcBT+u43VHTL9Gc3Kzt0fvOCgMVGRfQF/sdoyI6I6wpoy4hKQUYJwR+7JrSc7/yuorBy9GL8HkOSCINLswwMCGTBezwqeFx033QP90y7xv9VAyFFMUVJRjpHBgduh3PJfQsRiZ+FkgF7u9d1fTBMb0BwUzTFPFSDEoeeyxzLuob/wLA8JThQNM61pzljvauBYEUKRpKGGMa3BubGewaQSOeJlocMg7U/bvlFM3rv7y+J8bs3lz9sxXpJvYyji0NFkYBVPEv4AvVHNyl6533/AWsD3QQDRE9Fg8ZJhmNIQcs0SqnHpIOJvni22/GXr2kvL3K9uemBGQZZSnQLDUdEAhD+Hnpp9zY3unsmvvmB98RUBMLDwkPdRDRD/oVlSFDJ6EhZhgNCBvtttS9x73CBciK3SX4lA0BHhElfxqxB5r66O6D4n7ibvCa/zQLiBSgFZYQcA4cDUQLVRB0G5Yj6h9nF7oJ7vES2OrJb8W+ymXez/fSDRwe8SQbGtcEefZR62Lg19/y7eD+iQocE8UR4ApNB6MGxgb2DWUddyqPK8oj6hXI+y7fDsz6wmXFFtlu8uAH/xj2ICwXdgFF8fHm+N6h4hvz/weoFsgenBsHDx4Dhvzj+Hr+Ew55H8QmjSY6Hr8G9ei+1OLJWsiS2LHxlwgDGpMjixgFAezvduJo19Dbou+5BrMZfSYYJFIXUgrj/erzSfc8BbcUGx4OIuodJgkG8BbdbdGB0GvgXPejC2sd5iO2Fgb+hOyP3aPR8tbp62cEFRpqKS8pJx1NEUMElfcp91kDng9AFNQXEhPx/1zpqdsY013VCupfAhEVeySgKdoY7f7e7CrcKtES2mDwDgZWGskntCQoFjkJ2Px88jz11AT2ERoYARsAFLH88+Qx1oPNUNH06N8DgBiQKBAs3BoQAETr7di2z5zaX/LOCAsfzCzPKW0b4gpE+9/x+/Q7AN4LqBPqF4MPbvj/4cbV88/J1bPsMgdQHFErkiciEh/7fufM1MHQXeI5/P8UIit8My4s7hyOCfb1OO0f8jz9gQbEDQsRuwVS71Hcw9ARzh3c3PS/DW0jli7pJc4Nhvii4TDQKtQs6hMEEB8ZNEM5ZC/fHVkI3PRn77n1f/5vBhwOQgwD+YXhBtJ4xyrJrt+d/GgWEi37NGElmw1u9jjcGc7y2SnxUQniImQzwTLFJd8RQvu/7QruZPnHBEkQqhmYEun7Q+Q+0ZPEHsls3bv1pQ4EI/0l+hj2B4Hw/Nyh2+nrQAK+GzAx6jkjNEYhcAik8BvkZ+V17sX6eAnAEggLs/vK7BrfuNif4SPzRgUtFhEdwRNeBOHwnNorz9DYIu1iBkohlTQkO8gz2SJiC1P57fDw8J/1xf5GCBwHePsI8EXlAN1G4E7tU/2XDfwXcxWiCgH9h+jj2Avbful//OQSmyRiLRoszCCQDWH9XfTj8jv23P0YCJYK2ARO+/Dxvem96enxlfsqBtsObQx1Atb4iOiM2dvaWemo+/8Q1yIGLQYttiNME1MBW/UA8cDxUfQk+4EAbPxI9aryEe+d8EX8ugksEy8Y6RS2B/L5XekJ2fjWhOMf9goLExwwJmwnFx67DmL/W/Xd8aHzfvji/y8Djv8T+JPzTPDk8Wb8FwqFFHobaheeCSL7oukJ2cPVe+Ex9BgLJB+pK44s9SSEFWoEevat7SXsD+7X8iL1k/LQ7IfrdewQ8fj+cRHeH6kmTyNiF3AHsvG63JHVtdxl6yIAmxJJH2Al2SCuFIwIigAf+k749fgd+w/6K/PO6VXks+Ku52T1fwfiFyoj5iGLFm0Lovg65qjfM+dT8lMEuRQEHUoeaxn/DRUCZPyO+TL7Nf3c/4/+ZfVA6qnj8t5J41bymgQkFRAhlyB8FpUKY/bM5JvhEuqh9iwJAxlAHwofJRXkBmj7fPU89KD59gEGCEUJmf+C8UfoQOBV3yPq5frICigYPhnoElgKZfj/617s2vOY/zERCB47IFYbZA2i/NXw9elC6Qvxof0FCMgM0Qfa/kj3NO4v7qP1oACoC+cTHhIyC2YAXO7U5B/oI/Gn/4sTeSC9I/kd2A5L+8TsEuFs32XnL/TdAeYJ3AogCYkE3P2+/acCWAhrDpwRvwy4CGn84esL5z7sQvDG/ZMP8RgEHG8XJAuc+47t1+IW37niDOxP95X9OgEACZMJaAi8DdcSPBP0FLkR8wq3AyD3+u7K8SP38P0CChsUUBfXFCIJTPxz8T/jLdrg2g7fNOdk8J71hv0mB+YLahN8G40e8x8cHrMWzg6EAh32LPXp+b/6dwK9DaURhRF5CsH/W/ey7Wvi+dwq3N7e7eSV51HsE/kiAggK8BRkHdscdx2JGNkRHAzRAgYE/wp8DsURTBbkE3cNDQQ39cbqn+YN4JPcf99b4Vrk/eW+5j/vJfqiBH8SSB5LIIEeBxe9CRIAcvR080wBMhKwHNspBjGfKUQapQLQ6wzdI9KuzOHPf9eI4GPnaucv7Kr3uP4GCj4aOiNfJXAkbxwaDk/9t/Lk9AH/uwhBF7MlbCngJcsXpQLm8H7hJNQwzTjQAdZv3WPgDOc68V/4iAObEGMYEByYH+ge4hl6D2oGjwhGDhMRMRa4HRscShjODHf7ZOxK3gHTZczOzFHSItws5MruKv3yBVgO4hcCGUcTLxGNDeYHewLKAiIL9RWpHKcjbijjIxoc9A/A/87wzeLk1STMlMeAxqXKnc+83a3xPwJqFNwjnClYJPgcvxKoBpT8tfnwA/oPhhlvI88qmCWBHKEP8wDo8wPp8N9d2MHUwNIW0QTPDNiM57n1jAaRGYEjSyIVH8cWoQkK/sX8mgV1Dz4asiYVLm4oDx6ED4L+Ge/p4ZHZ+dPo0v3Ty9Ry1JLfne6S+zsLCR1xJO4gFx1mFeQHB/pC+p0DmwuUFh4lritkJukeoxF/AivxFeN02EXRSs8T0HDPGNKq4dfyBACNEHsiNylzJlwh5BhhCy/+UP+XAxEH9w/tHOgfZhsFFvsN8QIi9KfnWNz70grQ+c5VyorOHuL78mQB/BPeIxsovCZdIxsbdA51CEcOaRCLD+MWWhzNFWsMzQS9+2j0Ae1m5U7cy9fE11fSH8rVz8HiAPLXAgAWNCMxJwUnZCIwFoQK8QxRFoIWWRlxI40mrxoEDD3///KF6bnhAtn60HnSf9Zf0N3Kstbk6fP3sgcOGMshVyM2JKcdpg77B9ARFxpiGCceWiqFKbgb0gzM/pDy2OhM4J/TXMsX0K7RzMf3xinZUeyD+9UNwx2EI/8lFyYUGtoJpAkEF3wZ/RdpInUqdCOVFbAHOvri8LnqEuT5197TqtnC0xPGzsjT2THnV/b4CskZGiCCJncmjBd3DOcT4x03Gmwd3im5K70eGRBs/1/v0uRp31LWO89s2AzgQ9mD1KXfyeq18SX9TgppEhQZ9yExHicSdBOPH88dVRYEHSMlHyB5FN0J4/zz8QLr6d/dz0LMedbt1XTP3tix7FH56wOBDtUTcBRbGakZaw4jC9MZ2SavIcEgayZQI9YUqgUa+IDvLuzV6X3g0taD2/neptMrzRHcbu1T+eIGBhNlFxwZTRyeEsAFAAuOH2sm8STHLNgyRSkRFB8AU+2h4rLeddlYz3vSDuDf3onUzdgH6/P2pwHhDocYIhtYHl0bkgscAwsPtBySHMciOjDPMk4lcROjAEbuKuMf3BzSBMtm1aXeNdgp1PThIvHx+mkHlBSZHG4f2SENGEMI7wZtFGgXnBUjInguSStAHMgLLfpa63Hg99aOzHLOud3e4J/Yw93y7qz20vyYBx8Saxh9HOwdwhIHCVoPZxgrEz0VnSOPK/0krhmLDST+Q/BC4djQacOxx3fSOtHa0BvkJ/qSAoMLoRVpGmoaDRvsFgIMnArSF5scihalHMQnpiQhF4gNjANh+AvvM+Op0gXJOM4BztnEzcgw4oT1uAFBEjkghSNoIdkfjBOLB6wM4Bj7F1AZsSbbLPEh9hPGBwX6a+815iDbqs4Mzv3TC80mxBbPHuWP8n0AmBNiIh0nMynsJKcWzg7LFa4ZoxIuF0QkiiR8F/oLpAJK+IzvgOZK2nzRMtak11bMiscc2Jnoq/Fl/08Q7hofH40i6h2WElsVkyErIXEckiWULXMkORNbBpf52+3V5Lbaes/kzZ/W4dQwy4LRP+WA8Gz5/gc0FcIaQR1hHjEWvhAhGbQj+x93IewruCwKHwoQPgR29y3tMuQ52VHOFNFP1aTMlsZC1XTo8fGp/rINLBj9GUgbThcBDg8PZR4KJj4kMC2jNrsuFhsbCjb6B+yN4ibbyNKWz6PYgNlgzljOPd9f63z06QOKEq8aBB0yHaYSJQgiDUUZqhoVH9cutzjzMF0hmBLAAALwseER1frIkcrU02HQw8pD1U3miO119tQEOBEdF7gcsx6nFrcUOB6TItAcNSEkK98pdB3tELcGhPrb7tfiDtdnzkTTYdfQ0K3Rv+MI88/3SwDCCU8OoQyBDVIKRQaRDxshlCYoJxYzWzkzL/ocDQ94ATL19egQ3evQqczU0HrMd8TtzQ3k5fIw//MOxhv1HnIalhV9CfkBlArJFqcXRB/aL9gzQScPF5oKgf2H8Uvn5N7A17rbJd+h1LDMldfq5Vrqw/SRBdgRLRXRF8YUFwvUChEWrBv1GRYmBzPAMGIiqRSYB+n3rOlO3YjRKM221XDXZdCw1FDnxPPf+OsDshCHFiMVbhWxDmgHtQzuF/oX8RkYKDsvYSf/GCUPlwPM9XzoMt3m0aPRztfZ0pLMpdj57G706Pu5CIwUEhiaFjAVhA32CmcUuBwBGtkfsSwFLRAgFxKPCLb8n+8u46DXfc670SXVNM10zAbeTfAr9y4C+g42FkwVwBSSEH4IjQxKGxMhNiG8LGM1HS71HJMOpAJe9Rjpbd6U1HjQJtai0xzKcs7N4Sbu9Pa3BOQSzBhjF/sVeQ0dB/MN3ho7HLAiNzIuOOktUx3eD/8AZvEf4gTX0M1g0BDXyNFnzfDZlusn8iP6JAdNEcoTXBPSEDkI3QY+Egwaxhj8IqAwCjEHJSsYCA1s/xbxjuMV2JLQGNZQ2FPR5dOm5b7yHfiLAY0LIhEzD5UOewltAxcJbhZxGWUaJie/Lp8n2Bi9DRME9vl57eXipNmU2E7e9Nng0wndHPA0+qUAHgoNE/wSIA1/BxL+zfpyBXYSQBWpH7kvlDT5KDEYKgzT/qPvjOFp11DPy9O62GXToNKW5Ab3hf8UCjoXhh/YHNwXjg9UAzgApwn/DPwMpRnTJugl2hpZENQHL/1q73Hjt9n+1GHZ/Ncg0YTWcOm89Zj9YAmFFi8cghk3F2wQpAnkDccWyhXUF2UjAyjhHVIOWgQB+/vtu+Ec2f/Rt9MR2rLW9NNb4mX15/22BV8ROBooGf0UKxEsCCwF7A9OFwgW8h0FKhMpdxuEDr4Fsfrp7crhWdfWz0TTOdOSzFvQdeRj9kUAsgsxGtYfExuiFrkPrAYzCUUVvhhEGj4mAS2tJNYTSQiw/3r0XOjt39LXF9Wl2GXTm8vS1D7pufXX/yUOCBwWHjQY7RPzCd0Evw0aGAgZtCDLLlMvmCAHDyIDWvgh7NLgSdos1abYvNpj0WHO+dxv7pz34wPwFOsggSDUG5kTlQdzBiMQvBNGFVIjWy99K34abQuLALnz4uSJ2o/UkdQP3BnadNLJ15joofO8+u8FHhQWHP0a8RhAEGQKphEkGjAZRR3MKTAu9CIWEFwDRPkd68rcLdSazqjTe9mK057S++FR81r8bQVoEe4bbhzuGPgRsgcZCWsTSheLFw8jmS2TKnMZGAkB/ufyj+TT1/nPu9A42RXXfNFl2Rvsvvg2AQMLeRfgHYMbXBdYDNkH/Q9zGCgXSBwnKaotAiN5EJQD4Pnv7U7gsdXTzx/VN9lp0SjQEt+C8P36wAQGET8chx1lGlMTxQdqCQ8VJxdIFnIi0CwPKuUZcwkH/3j1k+jH2+bSHNOY2xjZ3tBk2AnrDPer/xsKxBURHAgaehYFDO0FYw9mGToYOB3nKtMvOyX/EtQFdvvv79Dip9dW0c3V3tp20uHPXd4V8Hn5kAOnEPAbiR01GugTuAi0CNYTARfAFOwf4isfKRgb/wvYAhL5nexq4OvVDtOx2U/Wp83709zm+vRx/bEInBUyHIAYZhTqC/QEqA3PGN8Yqh3rKnkvKSUTEm0EPvw08d/kBtxz1dvXbNyH03XOM9tU7XX3AwKXD1gcRh10F/kQ5AQDARsM6xFIEagdPiuoK80eow+tBrD9BPFs5XTcwtZ/25nYwczAz+/g3O8U+akG/BWqH9Mc2xcMD8IEngcfEn0SHRUYI/wpfSLbEacEt/029ODpA+PZ3TLg+uS/3OHS4Nmd6Qbyivo6CF8X8htMF0UTlwhCAqQKTBJTERYbfinvKyEfWA0rAs73iuoJ3ybZ6dZW3lrizdl12drni/U/+6kEQBI0HKwa1hagEIYFlwWjD1gRqBFCH4spBSW6FugIn/899J7mFtyI1C/UDdx22mTUlt3v8Az85gNVDwobBh51GbgU2godAysLpRPkEJ8W8SI3JiEcWAytArb7/PDr5cfcedU/2Jbal9Eo0FHhffR//5MLzBh6IuUffBm0EFcEMQSaEY8WBhbEIU4r0SVhFFQD8/me8Wfnz9872gDZA+Bu2znQNNWS53j1KwBQDiwd+SOaHtYYQQwyAcMHCROuEvIY1SeZLbMiPA9GAQ/4He3H4svcVNgB3lDjLdl/0tPeUO7p94QCexGeHl8gbxwPFTYHMgPDDucSHxL6HfQqBymdGcMHTvxU8j7mg9xA1j7XOuHe4E7XzduN7En4uP8lCv0Wlh0NGs0VVgsXABUHAhJkEacWeCVGLLEirhC8Ao74rOyf4M/YPNMp2dzghNl11RHjyvO1/SgGVBK1HdYePBqJFKwGAQNBD5UUVhLqHLIpvigBGksJYv639P3nCd0d1AXRbdlg2SHQe9YY6sz43wJ/DkQbbyENHlIaYw/mBCkN8hguF74ZxiWNKggfcQxd/mb2PO0341vbP9TK19XcyNKXzd7bvu5b+/IGPxZNIk4iux3EFjgH/gViFBQZdBiyIwcu/igBFqcCHfak657gKtkm0wvUod6z3KPR9Nfp6CD1o/6cCkYZyh88HXYa1A4DBUIPyBlyF/gceiqILfkgcAxg/RvzqebG213U4c5T1+XdbdR70yXkzfQ+/s8IHhVUH4Adwxh5EfkCswSgFJQY0xjKJUowfytwGL8FJPq47qPiMtk40JDQb9oi1vzLidWb6dn3IQO2EH8fWiTCHz8bmwwnA84NshiqFgcd6St6LuYgugsv/dzyIeeb3d/V3ND72A3dxtDbzqfeOO/R+RYGUBZsIpshvR3lFiUHLgfmFdEYoRj2JegwhStlGH0GNPvM7tLhb9ks0cDRbdt81mnM+NVF6en0yf4QDbEcoSAEHBsZMQ3YAwMPKRrmGOAf7i3oL5shLg2W/6n1lOiA3yXY6NJe2gXdLNF4z3TfO/Bo+lAGrBaFIcodqhjLEH0BtQESEUQWIxkHKLYzYC57GuQHu/s+7+fhMdqM0x7VFN4r2eXO+taO6Ez0yv29DE8duyEmHU4a7wyuAmIMUBbkFI4cQSteL9EhhQ3jAGf2tugX3oPWotE32rnd2NJf0vPi4fJR/CYGvRXGH1odCRt0E4YGpgl1GAIa4hnoJUUuRSZnEXcA3fb660DgU9hF0QrV9N2u1p3QK92H8Gn8BQboES8eGx+tGj8VSwgYBygW+B51HmAmMjFXLhwZfgL99AnqD95n1ffNts5J2knZuNDi1+frjfvzBZQQ1x0jI0wfxRmODEIFghGbHlEeCSMgLzYyHyJLCeb4Te5G4tTXpc4My33U9tdYziTQfOPL9hEEBw9oHM0kKCJVHNMOWwPGChMb9R2PIJ0sxjNZKPkO1vqY7ybkmdlx0XfMD9Rb2m7R18wz27fuQP3lB/8VnyKTJBEgfRV8B7MJgRnFHuQf7imeM1QtQBXI/cTvg+Q/2XfQ4coZ0dvbVtY6z5zZKOzf+REEcA8yHeQhZx6fFdUHtwbpFIYdmx9xKJczaTIjH6YFUvQw6Xnc/tEOykbNBdqB10bPdtaY6Mf36gJ7DLsZOCIXIVkZoQtDCJYUVB7HH3smTDF1MjYjWAkj9oLrBt8V1PzKxsqv1gHZH8+s0tbklvW5AZsLsxdOIRkhUBoEDewFgxDYHVIgdyaHMqY1lihCD7P5Muyw4IbVoMzuyE3T+tkGz1/NHd6Q7zH9RglHFmQhDyWoIL8SggfQDh0dPiBLJCgw6TXfK4wUaPwT7FLhpNd4z4PL7tNx3w3YNdKK3ajutvpfBiwSTx0QIWYeTxPwBCgGlxV3HJQgOS49OP4zYCBQB8zzkuWz2PvOzccEzIjZAdgY0CHZLOwZ+U0E/hBAHf0iWyF5GmYLhwYqE9Icnh0GJ3UzKDIzIkQLgfgf6/3e4dW8zQrMxNYl2TfOfdAR4xnzgv8eDpgcriXgJF8fnhC2BQgOWxvDHSIknTM5N4IqxxGp+7DrOd4k09zLgciT0QHb8NETztTckO7t+rgH0hcQJU0oJCR0GcwK0gsCGd0ccR+OLDQ2ey+DGWkCP/HH4pnVG833xurL59e61AHNkdYa6WL2VQIWEBwfiCVkI9EcqA5eCsoWrh/5IOMqDTc/NmQk8QpU+I7p1drJzxfHrMay0VjTYMoozpzg8vHa/u8MjB3RJ78meCHTE+UJhBAtHFkeiyTyMJ01iCnlD1v7N+wn3pHS38rjx3zQ89eOz1rN29p57FH5WgW4FWQklCe2I5ga5Q2YDtMaZh/1IfYspzXwLxQaLQIK80PlA9fdzbXHvctx1fDQp8p71I7mQfXWASsPux8cJowiWxxfEBkNoxgjIq8kPS3YNm81ViINB0f0sucT2RDPTcmfyp7UfdTYy3/Ptt+Q7xP9sQnVGVEmTSQLHmUSVApAEbcdHiJKKkk2vzoYLysT0fsN7QbeWc+hx0vGYc/r1EXNsMyN2kvrOPmyBecUoCTyJj8hlBZdCwwNGRkyHwcmyTJnOzM3Qx+kBBb0muXj1NnJZMTqygzU8M0byVnT4uSx80kBlA9KIa8pXiXRHDYPqAsqFbQceSAuLHU3zziTJyQMePg+68naps1Exq3IKtSg0hPKa8+331DuufurCL0Z1ibsJlAgtBNBDE0TexyWHxIo+jS9OfouPRXM/ubveeCd0HXGB8S/zsvSico/zDPcMOyu+YkGWRW4I8Yn0yKEFy4OKRKGHOcffSV6MdA3TjEOG/sC6/Lh5SPWNMt2xmHNm9T4zJXJq9aF57v0KgIOEFofeibrI/oZ9Q6lEDoccSG/JVMx1DmJNdshfQhU9RPn0NdWy67DBMi60Z3N3ce50aLjM/JKAPANjR3dJnomKh5IEW0P0hlbIIojzCwNN8M13STYC6j3Memi2oTOGca4x7/Ra9B8yHXOkt9j7hn8gApLGi8liSaWILQSfw0tFxggjiKgLCE5QDr0K2US0vsC6/DasM1ExArEJc9D0tDJgsxt3OHqkPdIBQ0W0iMbKEUlOBmfD34VCx+vH/IlUzNDOMwuQRguAnzxk+Ck0XbHTcPMy1nTOc3ZzGvbZOsg96wCZxHtHgckfyLrGj8RvBQ8IMMjFiexMuo4czGaHO0ENPR85LvTMMkfw0THis9sy7bImtRz5oD13AF0ELwfQCZiI4wcBBHiD/MaPiLvJocxATvXNxclAgxb+FjocddiymjEdcYlz/7NxMdDzyrgH+97/P4KnRvbJgcmrSBLFY4P5Ba6HzgkZS2DOXI7AC5hFaf/x+6+3CXN08M0wk3K0MwoxuHJ29l66dj38AYcGB4mNSj6Iwka2hCPE7Ed2iGIKVM2PDzgNLMe7AaN9XjkBdMMyOrCDsgRzi7HBcUQ0i7ievDJ/yURriJpKfAlVR6kExARfRlHH+wkwjF3O2059CjRD+j8gOy32u7LwcPvxJLM88hGwmjKBNvX6Rj5Bgq1HDsp2Sj3I3kZCBL9FiAeXCEFK7A1rjg9LiUXsAH/8oDiS9Kox9PDZ8pey17CjsT206fjD/ODA80VPSZIKdUkvBzpEkgTWBxJICEnZDIzOB0z2x7wBhn3cuhW2FTMmMU9yQvOesanwcPMod2q7H38dQ64IdEqDCdkIM8VERFNGMUe5yMOL2Q4sDeUKE0Pl/w27jzdYc92x5jGRM6NypzBKcfW1vPmyfboB7ockCtBK9olnxxYE7MVkh17ITQqFDW1OaAwvBgRAi709+N/0znKDMYCzKLOfMVyw6/QBOHd73L/VhMCJ0Ys1CctIdMWwxM6G80guSZDMa85nDZyI30K1/nw6t7YWMxUxW7Gv8wax/S/vsiq2u3q//kIDOoh5SyTKDsjlBlHEh0Xxh8vJAYu5jjBOmAsAxMT/0rxguDL0ZLJucYczHPK8r8OwL3PJeGO8a4C7hlFLOIsDCf6HmQUhhPMHM0i2SqxNgQ+lTZUHlMF0/Wq5WrUY8oBxpPJ3sxhxNy9YMeP2G/oKfiADQclDi7CKKgjMBnSEkkZ+SCQJ3QyvD0YPgAs9RAy/rPuONuRzKXF/8RvyjTHWL0DwnvTMuOI8hUFihwKLHsqvSTnHEkUFxYiIOglXi5ZOoU/8zMdGkQEm/Wz49HR/sjExGHIksecvXy7F8pR3FLsIf5hFWEq8y0cJ6AgrRZaE0wcWSMvK6w2zT/hOqskvgpZ+23rd9i/zNfHf8jcyivCqLlMwtrTSOMe9MMJSyIaLi4pjCPQGtkTRRnoIe4nrjInPsI+yi2pEtT/nvHs3gLQX8mqyGDMs8dXvPK+u83q3aztPwCIGJIqLSpnJDEdQxWjFoAg/iYRMPw7F0HbNrUcRQXk9gTmetQ7y6zHPsv7yqu/brtJyBHZC+kb+lsQmCYOLdgmkx+1FiYVRR50Jb4t7DklQjY9siYjC+f5VuqW19bKIMWGx6PKD8JsubPC2tP+4wH1gAlAIVItMCpiIwgaOhUpHHQk4Sp9Nd8/mj+tLugSU/6Y74XeSs/RxrnFIMrWxES4zLt3zAfdgO7xAb0ZmCsXLMwl/BxrFisbrSVDKxM1YkD0QtM1fBl8AGPwtOCM0BLHO8WByuLJ9Lz2uRvIx9j16F/7TxJ7Jw4uzydvHwsWhRfiIYsnITEZPv1EUT3ZJP8IK/bS5RvUJcflwbrGT8rJvyu4OsO51AjkPPVeCkEhriwPKpIiKBlcGLQheyhZL9U7kESKQAEs6w7c+ebpadgqyn/CvsTDyjbEnrnUv47RoOH38eQEyhsyK24slCXmGqsX9CC9KacuVTnmRG5E1TKeFY39vuyz21jLPsFWwf/IM8bPumC8UM0E33ru4//1Ff8nziyRJ2EdVhg1IB0qii52NlFCtUTBNsAZXwCP7vTdCc23wVa/ZcZrxxO9I7woy3bd1+21/dARzCSCK8InMh6rFi8dbygZLrs1QkGWRRE78R8XBErwR997zjPCkr0gw6LGfb7luhvHKdnW6tD70A55IhQs2yr6IDkXXRrSJVIruzGlPLhDUjxNJEUIufMC4//RPsWcvmfCpsZqwEy6z8Ov1Kvm/Pc6CgcecyoRLJ4k6hr8Gz4n+i2MM+88HETiPUsoAgyt9qfk/dOTx4HAScILx/vB3rs5wknRduJL9JoGXBrwJ0ArWyYHHHcbuCXnLB0zHDxuRLs/2CuOD9342OWE1OrHVsGpwqjIS8WuvmHDctBX33fwUQLmFhIlfynKJjwdRRnbIf4pYDB5OSND6UERMm4X8/5j65XYYcrCwsXBY8e2xoi/SsJNzrXbgOy0/uQSESPwKPQnNyDsGXof2CfXLcg2FUF9QoA2SR7XBf3xp9+bz1/G7cPax0fIpcBgwAPLc9d052j5LQ0YH0wnvidtIoEapR1MJ2cs1zTMPtFCcDmjI+QJe/X04zXTqcgXxfHHmcrcw/K+lcfB0y/hDPOoBoYa/iWLJxwkQR3OHJklQCwmM0I+AEQTPkArthAs+mXos9b2yWrEN8aVyvbFEb+7xKPRfN0Z7qQBlBWQIz8nmSSBHekaPCLhKUUw4zrgQ2tB3jGLGCwAL+1t21rMZcNKwzXIP8anvQXAn8wx2W7oEPuhD+4fRCamJbseDRrXH88o7y1JN0pCJEMgN5UfxAZz8gbhe9AfxXvBSsYsx7m9C7yJyBzWGOQB9hcLuR33JuQnZiLnG7gfdiksLjk1GkCVRLs6jCSwCs31qOQQ1AnHjcEexfPINcGrulzEKtPK4GnwmgRcGbIlmycHJHIcpx2ZJ1kteTN7PVRFfD9mKwwR1/r56NrXesnAwYHDFskoxDi76cBV0MXdhuxq/5YU7CPiJ64l/x2/G+MkVSzAMD06lEPaQXcx4xZQ/wnto9t2zKHCccHFx4LHbL3MvkfNvdvO6Z764A+KIfYnySYnIJAb0SGDK5kvCThuQstEvDhyH/YFBPOK4YfRDcatwfDGYMluwIm8KsfZ1t3kYfQRCHUcdSaXJr4huRtPHg0pOS/KNdk/uEW6Pn0oHA2H+GHnGNZmydTBysQdyv3Dtrv+whDSLeB97lIAeBU4I1Ql6SJjHKMc9Cb7Lrg0Rj4eRplCKi+UE8r8UOvb2fHLIMO2wjPJQcYYvJe+18xy3Gbqqvp8D+QgKCW8IjscCBo+IwYuPDSEPExH1UfXOGAcuQJW8GXeD84xw9PAocaWx2C997q1x5zXg+Xx9DoJFx12JdEjpB2rGG4exSk1MMU4O0SSSfc/yyYRCzj3m+Wr01bGr8FDxZrIUcC9uU3DOtOG4fnvUQMNGRclDiUmICEarBzvJkcuazZIQX1J+EM6LxISQPy36hHYKsnJwSrEmcjTw8W6mL8lzsbcI+vt/JYS4yJsJbwheRubGo8jPyzBM+o9hEffRs82mBpSAvXvZt6uzUHDNMOlx5rFrLv2u0bJmNh45gf3AAwdH4QlEyPqHNgaqSGuK4oyfTz8RrlJdj2uI1oISvSS46zR8MRcwVPGWsZHvbW5HcVM1NriRfMTCJcbsSW3JD8eJxkTHfwmii7xN6dDm0ljQlYscRDt+lfpgNcoybPCdcXZxwDAtbgcv+bNk9x07OEAgxaOJAom8iH5Gr8ajCIhK58zhD5/R9pE3TNAGBgAJu5z3e3NLcQ5xXzJ2cTMutG7Xchc16nlGvhdDtQfRCUcIisc3hjFHpQohzCOO7ZGG0k3PaEjYQmK9cfkp9OHx2PEZMhmyNu93bgVwyPSsd9g8BMGCxucJJojGB6sGFkbqSSiLOc2YULOSTtDTy7cEkH9h+xN26LMQcWPx6bJzMAqt2W8+8p32RLpKP1EFAIjLyTNH08ZhhgQIdkpwTIUP0BJMUgROPocEgVp80fiMtKEx5TGX8o3xee4brgtxTHUNuPw9ZQNySCCJtAiTBy9F/Mcbya6LlY6ekYdS7JAKygcDe/54egw2BLLdcYkysbJpr70tru/Hs/p3dftugSnG1AmuCTGH9wYrhlYIxEswDUIQkBLuEflMokWqQB975PdKc4MxYjG98h2wfW1zbloyYjY4Of3+zkUFiUjJughBxu4GCsg3CmcMeM8TkiXSc061x7fBqH1r+R7087HwMVfycrE5bcHtUbC09KH4aPzrwtZIBQnWyMYHMUXSBy1JtYulDmhRWtLREICKAENOPqM6T3YrMnixMvIHMggvB+0wrzMzTfcvet3AjsZOCZOJN8dPBgcGjwkhiwcNjxCHkwqSOQy3BWGAHXvidyhy97CE8TJxte+9bNjuUHKtdrv6RT+yBVTJtAnSiLdGjga9SJZK3cyTT1BR/ZFIDRDF1L/PO5g3Y7MTMKwwl7H0sOEuBq6JcoW3K7rc/3KExQm9SgTIqwYARX3GkwkoivsNkpD20brOWsfaQUE9GrkRtSFyJTHEM3oy1PAhLtxxjvWUOR89L8JYx3vJfMg0RczEXYUEh4SJrAxwT8CSIpBiCuxEGf8duvl2gjNsMdJy13NqMSuuxHCj9Fw30TupAGDFgwjDCKTGjcTkBMCHfAlGTCaPdNIK0fuNLEa3AOF8jnh/9G6yB7KWs3wxyC91L5/zd3blOkr+/kPBx8aIWUaBxK0Dx0X7yHbK8w400V1SSY8NiMdCwT5xece2IDMS8qozrTLo8DgvfzIGNgY5bn1Hwq0G4AhwRzdFL0PPBSuHiwooDRkQjpJxEEXK4QRKf7X7DbcRs+PysfMKM2MwzC8PcQ406fgyvCZBPsXACLIH6oYHhG2EfgaiiQRL888bkchRP8xHhk+A7nyuOGU05TMAs1kz+bInb7hwRTPGN1L66T9hRIuH1EgeRqMEvMP4xYuIXErMzi5RG1GFDl1IJYJo/eB5rHX6M1MzEXPLcyfwZK/mcqC2SrnOfj8DIcdUCGtHDMVuA+fEpQc/SWYMiI/H0VKPVoovA+A/C7sCN2W0l/MSdAQ0IjEbMCLxyPUaeJP84UHjBolIbYejRnND58O7hfaIGkrszo9QZs/ADAjFuAA9+874BnVWs3OzQvRs8wewiLGEdKT31/vtwFhFbYg8SB7GhYSjAtPD8gZ9yNKMC09/T/qNjAh0gp++WDpB9xL0sjOHNGkzlHFNsD4yd7X7uUD9xkLTxvAH18bnBSyDLgL6BRUH7wrzzhaQEU8bSrAEoP/iu7T4BrW7s/v0D7SxcsVwwPGW9Pq4FzwrgOVFlwgoB3OF4cOdQnHDf0YaiT+MWc9wkA9NdkeJwna94noEtwa043QmtPn0NjGwsPOzSzbXenI+cYNOR2kH+karhPzC2UMGBYMID4sDjmyQGc7qSiuEWP/w+8a4ZDVtc8b0v3RIcrxwuPIktZI5FXzAgY3F68f7RypFusOrQwzFF8eRyk6Nt8/zz9xMK0ZPQXu9Inm5dj1z47P5NFgzNTCWMTf0JPfUO44ANUT/B8xIO4ZHRLFC+EOlBncI5IweTxoQfk4biNrDCb7Du3C3fnPTtMxz1nPs8mIvobM7tu64238jgsuG6UkPBtgFZMPvwopEa4f4yiJNPA/qjsWKpcXUP4z8+HjWdVt0ifRDtISzq7EjMdb1ZThnfGtAjsVBR/LHZMWTg/lCJ4NHRioItkvIzucPyo1xx/KCd35WuvO3HbSatDl0jDQSsY7xNfOUNww6t76kw2AHLAfmRrTE1kMOgzKFJMezSmBNvU99TgUKL0R1P858gTjZ9cU0srSnNN0y/zDvcrK1u7k/fPDBd0Xvh+7HCIWeQ7PCl8P6RlMJPAwUDuBPAYw7RqWBrL3dely3KXTLNK61P/P9caxxmfR6N+57Jv+QRFWHd8fShlVEhAM+QvxFc4e5imVN7Y81jYeJC0PA//Z7/rhVdZ50ZPTYNK0ykHFW80B25PnwfauCAoZmh7VGlwVoA44DAwTSxzpJX4yZjuEOXUrrhZRBeL2fuce21fTfdLo0lLNTMVnyJrVBeO68JsCFhXFHioechiWEkMNjA81GVkily2wNwU7+DDjHUUK1vqg7JLfs9Wu0kjTetHuyBrGLNDA3bbqkfqRDbYbDR+XGTsUow3XC6sSzxz1Jp8zzzpWN64nmxMCAmnz2+TI2PHSoNFH0k/MjcVuynPXdeTJ8uwE+hXlHuEcABiTEZQM+w9tGIchES3HNo44zy0pHJ8IOvl66nXdqtPM0EHSF9CTyIrIm9Ol4H/t9vwuD50bvR0rGXQU7g6oDfQU7B0VJywzWDhBM/ojphCbANvx0+Og16PRLtGA0aLLjMaqzXbbPec69jsHPxg8Hv8afBadELQM1g9pGNQh3CyoNS42ICvAGeQHvPm56hXex9Wh0h7TAtDHyAzKydQy4hfvzP7GEYIdNh3tGDUUVg7yDBMTaBxKJgExrjUEMHAhjw/x/6vxS+Tv2XzUSdR206LNzMniz8vcteg09p8IBRjRHX8asBVIEawMUg6FFycg9ir2M8ozXykKGc0HuvlC60PexdbU01fTYdByyvTLRtaj4g/v/P4ZESAcghw9F5wTBQ+SCxERmhpsIwIuozIkLm0hfBAPAnH0suZn3NjWOdW905POfMtW0Y7diOk896QIehf0HDQZMxXgEYYM5w1fFhwfAylbMVAxmCjmGBcJw/v47Urhntlf1rnUyNEEzVvOIti74wXwz//pD7sapRquFbUTLw9sC/UQLxrUIlcsjTCOLNQg3BBnApL1BeeQ3czXgdSA0/LPO81W01Le3uoO+FoICBcvHJEYfhWvEiUNfQ3sFIIeTyaoLcwuTCfbGM8Juvwv737ipNok1ifUt9HBzuPPhdiP5ZLxTgBIEFYabxpRFtwThg9mC/QOqxisIOEnyyx0Ko8fKRFRAxf3OOoY4GvaDNc61DnS4c9w07Teq+p79zUHABU/G3AYoBS9EiQN4wrPEW8bsCGeKDQrciXWGHcKZ/7M8U7lw93h2QjWSdS20vTSFdmj5HLw0/10DD8XRhloFbkTXxARCq0LthQHHGAiIijwKB8h5xP7Bm77ze4n5LTdYdn31X3VzdND1bbdHeqS9T8DQRBAGIYXARTmEhMOmQnyDucXWR1VIxwozCWeG08OgwJE96jqTOG93PzXmdbn1RzVHNkM49butfrwB8oTzhj6FdoTNhLoC/kJgBEmGFEd4yIuJvUgYBbhCfb+qPMu6HThudx+2OHXEdhn18DcbOi48wgAfwyAFiEZNhWDEz8QWQl2CrARVxeeHLYhPyNQHYARtwXv+3vwP+bp4O7bLdla2n/ZJ9lK4HjsEfj0AnYPWhi3GOsVABNcDlEIQgpQEdwV3RoZIfsgghm4DX4DNfqL7k/lMeBj3DnbN9wA2zzcF+Wq8HP6bQWGEc4YpRcxFEESWA3TB8YKYhEkFYkaFSDZHjUWLQtNAs/4X+0e5QfhZN303OLdetsZ3+XoavMD/TEHLBN6GEIVXhJPEK4KcQYrCiAQHhQSGmsejBtHEgsJFwFh913s3OUS4nfeYt4j3jjcF+FN6yv13v5yCoAVxhjxFJ0R/w93CHgFvwmoD14TNBqgHS8ZFRAACDIAEPbo61XmGuNi4ErgCd+P3m/kve6Q908BNA7lF+AYJxT1EMwNuwUjAlsHRQw2EYwXdxoWFkcOGwes/0D1KOzE57nkcuE74UfgZuAY5gbwovjTAgcPwxdsF4YSVxBIDNcDOAGgBuELHxCXFiMZrRSBDTwHSP8u9WPtwenP5dPiyOIB4hTisOd68YL6lwQ5EKsX4xZSEhMP3greAbX/twVOChgP9RXgGKYVbQ42CZMBi/cs8BzsIuf740bkU+Pd4hXpt/K5+3QFCRGqF+QVThGIDtEI9v9y/ikElgiQDc0UKhhwFeIPuglDA5b5GvJt7ebnB+Wv5Lnii+IE6TvzhfsjBXkQNBfVFLYPzQyHBwj++fzUAsAHag36FOkYyBbrEI4LNQWK+wXzH+5/6YDlzuTW4iHi6OiE8n36RASUD5EWuRO1DnMM2QZf/SH8bQLpBtgM7xSxGQkXcRIyDQEHmPzT89nu0um95W/kPOP/4o7pLPOX+gAFDBDDFUMTNg76C3cGb/zh+tEA/QV9DH4UkxlRF1gTfQ7ZB//7IPRA717pIOTX49PiouJt6I3xvPnoA9wOXBQjEoMNPgszBRz7yvmz/4UFIgzwFD0aehnkFZgQegin/T/1p+/w6MPjFeTH4jji3uc08Xz5PQOCDYsT3hHUDNkJBwTi+QT4Zv69BGcLDRS9GvUZiBUhEDwInf3n9O7uzOgo5DTk6eKs4cbmifDh+IwB3wu5EiwRygurCKMCWPlz9yn+JQX0C4AVRhwkHBoXXhGSCdH+GfVG7y3pkuRE5AzieeAs5rDvSPc5AHkLmRJmEZALowgOA5L5Qfij/+QGOg62GBIfHR4iGFUS4AlR/kL04+5D6VvkHOQ64dPfTOZ47/D2uwCyDPkTWBJWDD0JRAN4+Wv4OQBaB2gP1BldIH8e1RjVEssKXf4c9QTw2Oku5ZzjXOBL3/rkKO699QIAjwykFMkRBgxDCUIDjfnr+NIAvggpEV4biSFiH7AZchNzCpf++PUI8VTqcOXn4zHgwt4a5DHtJfVFAK0MDBTTEUcMIgkoA+T5I/nbAFUJkBJmG68hch+oGu0T9Qp1/+r27PGo6tzkOOPf36vdJuML7EP0EgBgDKsTfRHfC1QJXgMz+uf4YgFDCiYS+hp9INEf6Bk1E/8KpACU+Dby+upA5Yvind5b3CnhVeoH81D+rApEEnQQ5Aq9CKIDOvrn+dAC5ArCEkIbPiEtIAsaRxPVC+kAQviN8QHq1+N34bLc39rY30Lp0fKf/TQKRxHoD68KNAm7A0L7NPtbBMkLABOgG1AhhB9NGZYSHAwAAbj3s/CU6c/icN8/20DZ7d4n6Wryvv1tCnoSZxBNC/gJCgX2/Er9NAZSDSkU2hzoIVsflxlOE5cMAAFP9wfxKelv4WXe0NkF2GTeZujn8a/92QpgEl8Qsgt6CuoEd/2l/Y0GiA0FFV0dKCKNH6MZ+xNgDF0A1PZA8I7npOAI3TTYddf83dvn9fHj/WYLmRJ/EKgMpgqSBRP+bv5TBywORBWYHfUhvh5vGQkUuwv5/8D2xu/a5qbfmdsY1yTWbt6H5+Txb/5dDDYTjhALDOgKaAVh/Sv+NwedDtkVuB0UIt8fjRpfFKsLpf8L98LvIObz3s3aetYe1lLd6uYL8rj+AQ3IEzoRGw3/C+gFuv3Z/vsHDg/QFuMevCPlId8bqBVxDEIAFvfg7nrl6t3T2brVI9Us3C3mLPHz/s0MIBTdEQIOxAx/BqD9VP5jB7UOhhbeHi8kpSI7HSEWpwyPAMn2b+5E5K7c7tmW1ZHU3dtA5hXxDv81DMsTghLVDnkNvQYn/lP/WQcpDtgV7R4XJKIiHx3bFdcMbAAB9nbtxuJA3K7Z59Tv07zbOOZu8bb+RwwRFOcSOw8EDSkGUP5H/28HcA44FyYh6yVoJM0ewxYFDSYAavUx7C3ibNtH2MrTj9M82wjmNPGz/mYM2hQ/FBsQRA1SB2r/V/96B0YP2hcrIbUmpiStHvoWdAzX/vTzluoV4SXaptdk0+fS4tpE5inx0/5FDUEWMxUQELANYQjA/0v/0AcGEJMY2yEOJ/Aj1B2eFdMKWv3/8Qzp9N/72dXWD9OD0jvbNeYK8Wz+jQ0kFoIUVA/mDdgIQgAQALoJMRLPGgck8icBJUEeKxXbCTX8GPEK6e7fDNpc1+bTjdNX3PbmqvFr/+gO4RaUFNMP1g7qCFUAzAB8CoIS/xpGIysntiOJHEwTtAci+gXw7ufD3gPZi9Yr0+fTI9zo5lbynQBvD/MVOxRAEOwO8Qi9AMoCygwvFJEcxyQJKFEjkhseEvMGO/n170bnzd4m2ZXWB9PD05LcPOfr8noBkw8RFiAUAhDMDiQJewEXBBEO7hUJHncl5SehInoaGBFeBaD4Fe8x59nebtn91l/TQdQX3FPn5vKsAYYPmhXvE5kQFA+gCEMCIgWpDukVox2KJLsmniAVGIMO+QMq97TtyuUV3hLZV9ar0p/TXtzW533zaAEXD4QVLhOhDwoPtAhiAzwHsBAaF84eDSWTJe0eghbVDSwD+fZG7kLmaN4J2bjVwdEp01XcP+ev8zACbg97FS0TMhDRD0UJnATbCKcROhiVHkIkdSTZHCUUBwyuAZb1be1d5uHeHNoj1tnRotMl3cbn5vNpAnQQNBa5E3kRUhDUCTMFSArnElYYJh/fJKcj+xtOE3oLswDF9ffsjOa73rXZB9Zt0TTTR90z57rz6wLOEKsWvRRgEmsRJQt9BoYKZhKiF1oeWiPNIXEaqRJAC18By/XT7Vbnk9842m7VUdEf0x3dLee38xYDWxE5F0UVVhOuEqQMkAeHDOESsxd3Hm8iox8PGa4RVAqUANj0n+3u5qvek9ls1FPQDtTC3XjnT/R+BAMTDhdsFfMTVBOhDIEIrAw3E+sX2R2TIWUf+Bj2ERwLTAD39bnuAOdY3jLZFtRx0OjTLt6Y6N319AXoE/wXARZAFaAUfg2hCdYNaRRzGP8dISFoHiYYrRGOCj4AMPYK7+jmid2A2ArTsM+j01je1ujN9i8H7xNhF84UbhQdE0wLlweBDRcTfxfJHGMg6x0MFyERUgq4//v1Ye7f5TLdX9fm0djO79Op3oDpMPj7CBYVmxdgFUIV9RJLCvQHNA7AEhIXvBzfH9ocZBYpEJgJtf7m9BrtWORk2xXWqtBOzgHUJN/26mT5uwm2FQMYqBVEFUQSNwpbCPgNSxJvF5Mclx96HHYWpxDhCdv+tfT47MHjSNt61RjQLs7A1F/g4Ovn+o4LdBYPGJ8VUxVBEXcJlQdLDakRxxZIHE8faRzYFiIRawmG/t/0m+zo4qfalNVd0K/OX9ab4fzt6/wkDWoYpBmIFsIVCRF8CM8GHwwSEQMW9hs6H+scUheXETYKp/7X9BjsXOKF2m/VWtAtz3TXo+Ko7q/9Pg7oGL0ZExfrFSARbgctBeEK5Q/nFMgadx/UHd4YGRMNC8z/XvWq7A3i+Nlm1SzQoc/B11rj9+/v/tAOzhktGl8X8RWOEP0GYgRZCjwPQBT2Gg4gyR63GfIT6QsaAOj1GOzo4QvaNtVj0NzP9tdp45/vxP4dEMIZTxofF9QVMBAlBioD6ggXDqoTvRtlICYffRqBFHMLAf8c9NrqlOCk2I3UL9Aa0NnXoePN79j+YA5DGFgZHxaDFPEOEgVrA6oJAA8XFSYdoSLaIKgbahU4DN7+cvP/6a7ff9cP1PHPQtAK2WLl/fCm/2MPyRgAGTEVPRPrDRYF4wNtCi0Q2BbDHoEj1iAEG5oUwgqN/IfxXOj63TjW0NJBz93PONl55QzyuwBlEB4ZRBjkEw4Sawy1AyYDtwrDEPYX7h+HI18gWhomE6UIOfsw8KDnC9721rjTK9AN0m3bZueW8yQCrhELGccXoBPtEeQLKARiBOEM5hIPGmohmCRLIEQZQRL8Boj5hO/T5o/dz9YH02XQINIh3JHn5/MPA7QReRiAFo8SERHFCjMDEgXLDQwUCRvbIa0kqx+xGHEQ6wUt+M/ukeYV3fvWstO10PrSKN0k6OH0vQMEEsQXuBW9EdYQFwpcA4YFKA+CFQEcqiIJJR4fzhetD9IEEPiF7nLmaN0F10LUe9GR0xrdNOjN9OsCGREXF7sUexF9EKAJpwPBBgQQQxayHBojRCVFH6gXuA+CBPj3J+/g5qTdM9gy1aLRr9N03X7owfT2ApQQNBZrFB4RbhDRCVYEugd+EIsWMRwIIxckCh4xFlkO6QOR97/ujObn3czYCdW00eHTG9046I305wHyD8gVEBQ9ESwQiQozBdEIBRFQFuscySIiIwYdyxWRDT8DL/d67rvm/t0Z2fTVAdIa1JrdVOiI9OcBPBAWFlwU5RHlEYwLqwauCVQRfxZXHAEiKCJKHNAUlg1kAzv3vu5m5tDdi9ir1AvRNtMC3ejnTvOjAfsPkRXCE2gRfxGaC0MGegkqEb8V4xvkIB8h/xrhFNENyAMj+GvwbOgY36rZj9Xa0a/TaN3B55fzvQK1EHMWjRRfEj0SBwwSBg8JqhCAFQYbGiBUIAMbJhWjDTkDyfj+8PbomN+s2VvW/NEC0wrcx+aY8pUBzA+hFi8WFRMIE5YNIgaxB68OgROiGNMd1B4HG2QVOQ6KBLj5LPLi6cTfvNnM1gzSOdID2/zlDPKSACMPExfhFmAU3hM3D7EGrQZpDTsS+RYbHGQeSxx1F1gQgge9/ef0O+xs4ZDa+Nez0tjRmtqm5R7xQP8lDtMXtxh7FUMVnBGzB+gFHQz7D0YUihlrHHMbgxexEPIHDP6E9ZDroeBh2fbWGNKi0JHY6uQ28GD+aA2oGBYaBBerFvASjAhOBSkKUQ4vEn0YEx22HNQZrhO5C1IBGfjM7QniQNrp1jrS+M+W16njzO5Z/JYMnxhfGvoXJBcrFPcJlgS7CJcM1hBNF7gbtRyyGnYVcA3tAu34tu7I4u3ZWdZ90hXQ79Yj47ruPvxgDKIYaxsMGYgXyxRQCkcEzQfKC08PwhavG3UdhxttFl4OxQN9+dfupeLK2LLV+9EEz/bUA+Ke7Rj7VQv8GI8c5hnpF1QVJgvpA+IF+Qn3DRQVzRolHPoaaxZfDokDxPgk7vDhudfY0+vQv81v0+fgGu2Z+lsLRBlnHVEaIRiVFc4KAgPQBGwJYA3QE4wa9RzkGzUXDQ8uBWn6vu8V48rY1NRz0ejNcNKb4PvsL/qTCocZVx5dG/gXTBXVC90C1wPdCOAMLBS9GkQdEBxNGGEQ3QUU++bv6eOc2YjUb9EYzsnSzN9p7N/5DwpjGTUebhsCGGMVywvRAiEDXgjSDOATfxpzHUwcTxi9EIgGyPpp7+LjKdmF013Q7s1M0jnfa+y3+e0JUBn6HtQbsBe7FfkMsAIzAt8HhAwBE3sZ1BxSHJ0YRBFAB3/7p/BL5dfZkdMx0aLOxNJW3ubrkPkmCd4YCR9eHCsYvRUxDp4D/AClBrgLZBEHGDUcjRwlGeESfQjn/ETyzebb2gPUAdJL0FnSzN3w6/D4BAjlFm4eXBwpGEkVvg67AzkAWAVNClMPTxYgG6YcqxmoE64Kq/8D9U/phd2m1YzTHtEo0kzchOpK97sFqRRDHdMcFhh1FTsPsATo/ykESwlbDscUmxrLHJwa/xRIDJwBa/YI69Le2dZU1CvSGNMT3BjqwvZGBG0SUBzlHAgYfhS5D5sFWv9/AkUIrQzXE1Qa+RxyG5gWJA6HA773iOzk4FjXvtQn06fSzNou6Mn0qgEhEAYbvhzlGB8VXhHNB5v/6wDZBggLWRJSGHIcnBvyFzAQMAW2+dPuFuPX2F3VPtS803DZVubm8m//fA3AGDAcNRmAFMUREArv/4L/pgWyCUYQ0xbUGpwbVhiAEGUGdvoP8Izkpdlm1TzVcNRP2EzkAPEk/aQK4BaOGz4ZzxQqEqYKCwBQ/u8DxQiLDgIWTBuvHLEZmRJSCAb9YvK35qLbM9Z61lnVctda4qrvLPvxB70UWRvFGYkVvRJzDMwB5/4LBLkIDQ5FFoAb3hxaGssTEQp8/uXz1Oi33fjW4tYY1qPWOuCU7cD4jQWeEucaSRrqFe8Swg1xAnL+ZANNCOcMZhV+GzkdwRpWFZwLKQBT9c/qyN471+fWWdag1Ujd4OtB95EDoBBuGk0b+BZHE+4OxgPT/VMBCQdgC9AT9hraHCcbahbqDK0ByvZw7PzgRdgq167WQNVV23Hpk/XWANUO4Bm0GzoXWxM4DyUFjv0XAA8GBgvQEn0aPh0SHCwYIw/bA6f4se4L4unYf9Zp1uDTFNm35gLzrv49DKMYLBu3F/ITFBAxB4H++/8LBm8K8hHxGRUdmBxnGfQQ0QXk+urwpeQo2uHW2dbH1GLYOeVJ8rf9OQspGFwcSxm4FfcR5QmbAHoAVwa2CvURuRnCHaAdrxpMEuMHxvwZ8vnlENtY1lHWhtR71kPiU/C3+30IPBXZG5YZABV/EdMKOgGA/8gEyQkbEIEY5RzJHTkbRRTOCav+qPO151/cyNVs1aDU7NS03wTuf/m+BfISQxs1Gv4V9BFSDP4CPf+RAwQJ5A4VF5EcQB4yHFAWPwzQAJn10Omb3SDWONVh1NfT7Nyl6/T23gLwD/EZZBqNFTwRAg3FA+D97QBfB9UM+RRUG/QdRx1rF/UNIgOg9uvrad/N1vXUlNSw05Ta8egQ9WYArw1iGHkasxaVEhUPAgdg/w8CUAhLDREVIByMHt8dyhhMDxAEnvc+7O/gV9eP1MnUW9R92T7nAvQF/x8MghdjG9EXhxNpEMgIlgDoARsIqAzWE3MbbR6CHfMYQBDSBHn4MO2Q4XbXUtMI1EnTC9dG5KHxlPytCSUWDhuMGI4UBBGVCsQBSAGfB6gMGBMzG9wepx4EGt8RcgZK+sDuX+Mi2VfUpNRk1GvWM+JC8JX6Ggc8FEAbzBkYFb8RLQw7A+AAjwaoC7ERIho2HhEeJBpDEkwHL/uB7/7kK9oi1KLUxtMn1RTg6O2D+NIEdxLvGoQa7xUwEwgPFgVYAYYG1QsEEeIYDR6rHuoaUhSmCVj9vfGN54HcKdUr1dTUqdSk3Y7roPYTAoUPJxotGwwW4BKuD3QGuAB3BMAKFA/aFkgcVx21GrsUdAq5/nTzJun33ojWBtV01TDVANy06ar1ZACMDr4ZihxPGIsUwBFICSkC6gOWCmIOsBU3HLsdMBsdFhYN6ABn9W3r7+CR1xPV3tUu1Y/ZKOey83n+3AsyGNkcExrTFXkSwQubAroCNwg5DBESsBkgHJ0avBZoDhsDHPeJ7Zjj6ti31GHW5NVb2G3klvFD/PgI4BUTHNYavxYsE3sNdwTKAbcFEgq0DxwX3hkRGs8X0BCOBXL6sfCZ5hrbKtVP1m3W4dYc4fru7PkcBjMTwRtQHL8YqhQlEDsHOgKSBLoIxAyrFMkY6RhDGM8S3Ac2/YvzoukB3m/WE9Zd1wXXmN5x7Iz3qAKXEGMalRwWGrkVTxF7CcsCYwLZBU8KdRFHFpkX+xfvFP4KSwCg9m7tJuLD2JfWh9jp14Pckemt9dX/iw1vGLsc8RsRGPMS1QysBNoBOwRbCIYOwBSjFowYcBZ2DrEDNvqU8I/lydpW16jYzdhc20/mKfO2/fIJ4xWIHHkc9xj2E2kOagaHAYEBSQXpClwRzhNMFrMWWhDbBdL8sPNe6eHdo9c32MvZD9pp4prvHvrcBdoR0RmoHOUZnxShD7kIrgGc/zoCngetDasRExS+FloSDwk2ADn3V+3J4bjZrdgd2oXaE+BX7Mb31QJZDwgYxxwpHD0X7xHvC5QE2f/hANUFDwtdELYSDRZiFJoMjQMc+8jxuebG3MnZF9uh22newei59Fv/PAtmFZQbBx2hGUsT3g2HB4wA6/72AncIpg0TEaoUPhVXDwMH3/7P9Trr9+B2233bptxJ3mrlS/H8+8EGuREgGSAcaBqnFP4OkglVAnf+1ABQBjsLlw9EEuIUjhHqCXsBV/mG72Ll8t0/3Pzcd97Y4ljtsfi/AmEO+xaRG30bhRe7ECEMhQXE/mD/SATUCIEN3BCTE8ASuAyNBLD8zfOq6UHhytwQ3X/elODp6Kz0nv7BCfMSxxj8GoUXlxFtDP4G3/+w/acBKQZBCz8OYxEuE34OkAf2/6n3eO5d5FneAd0t3ozfOuVj8Bv7VQYREEQXGxutGQAUmg7hCbMCJv7J/04EKwhCDCkP2xH7D+QJvwJF+yHyWuhF4F/dc9253kficeyV91UBjgz0FH0ZZxkHFYYPZAsmBIn+5v6IAxwHFwsjDmURJBEGDNYEGf5a9efrpeKu3aTdjN074O7opvR0/lsJnhKPGG8ZyxX3D6cMQQYBAP3+awP0BgcL7Q31EP8RAA4pB+f/8fd17l7k693r3PbcFt6D5ZPxwPtmBlURDRhlGkoXXxJSDg8JewFuAOEDDgcpC6kOHRFHE4UPawknAvz6vfEe55zfnd1N3djchOIN7635QwNnD8QXhBpVGBMU9w+HCh0DcwA0A7sG5gn5DTgQ8hGCEHUKnQOm/Knza+n54MXdlt0F3AjgQ+zc9rz/JAz/FYIZZhi2FGsRTwwkBNgA9QLEBRkJkg2ZDyAS4xGkDJkFTv/x9urs+OKM3obdMdwr3tbo3vOL/LIIkBOVGNUXahQlERMN+AQ6AAoCLAU2BwoMYQ9dEfsRFA6xBtsAdflN7wXlud8a3uTcA90S5tvxOfpbBW0RBxgDGGMVixLyDgsHmgESAisFXgedC+UO9BAsEkkPOAgeAhj7zvH05tnf/t2O3A3b5OFd7s32ZQE/DlcWZRhOFmMToRD3CLcBNQHaA8QFwAmBDa8PORLgELcKKwQz/sr1KOqT4bLeWN2A2izfoOqB9BX+EQu4FPsXFRdOFEcRRwsyAyYBYwPrBD4I6QxtD10SXhLFDWgHSAHX+XPuC+Sd3yHeT9tj3J3nGfIj+24HfxK4F1IXVBUGEkoN1QT8AKsB6AMXBikL0Q3DEGQSsw8NCc0DefxE8ormleBa3nHcfNtL5OTvwvjrA88PWRacF8cVdhKzDvsGnwF5Ae0C1ASyCbwMjQ94Eh4RLQtNBuL/xva26pLieN833SfbTOEl7N71BgCIDDwUXhesFiYT3g9cCS0DtQBeAncD0gdWCzIOERL9ESAN8gcQAgL5v+0m44nflt3h2uXdE+k282L8iwjNEekVpBbBE+YPRAt7BK0A7QBMAlwG/gqiDfERJBQ9ENgKmQXW/CfyVuaA4KHeRdz93FLmFfEz+mEFwA+DFUYXwxV4Ed8NZwf/AQkBdgIdBe0Jygy0EBEUGhLeDB4Hv//T9Ejp6+Bi3h3d1ttL48ru7vexAtwN2hTMFzMXJBNiD+EJOgOYAEcBNgQKCMQLOA+CE+sSBg5wCL8B6fdl7H7ir95S3Uzb4t8y6+/0xf5aCkUS+BZYFwcU7Q8PDCgFcQHXAAQDIAfeCnUNdBKiE18Pmgl/AzH66e6040beddyx2t7cxOZc8R/7rAYzEBwWAxiXFfkQAQ5XB78BTAC+AuYF6AnnDFQRmRMqEQgLYAU7/UjyCeeZ30rddNsV3N3jPu/k+KoDuQ4LFtUYARdxEjAP4AkFAoL/SAFgBGEH8Ar5DiITeRFADPgG7/+E9TfqC+Et3crbBtv632PrLPV0//gKNRNmGPUXohPcDwcMYAQd/+f/3wKrBXkJNg0ZEiQT3g7oCFUCXfnv7Ujj+d2B3Lnb3t4m6HLzYv3lCFcSBRjoGRwX/xHfDpgHqwDP/k4BTANPB8YKmBDiEoMQkAsABpf9NfPS54Pf9Nw23AfdfeRO7xj5KwTeDm4WLBk9GHMTmA+aCpABn/2W/gQBzgNICFMNVBIxEp0Nywi6AXH3/esf4tbd29wB3Unh1OuU9t8AjwsLFPcY9hnJFaUQiw0HBUn+5vwa/2kBuAW7CqgQ7xJ/EFQLFQZC/C3xguY1333dxd3l3xPoQ/MC/UsI9hBbFxEaXhepER4OTAis/7j7Jv30/4MDIQhFDhYT6hF4DYkIYgBZ9XHqauHZ3RjeV9+V5HvvpvkKBLsNiBTvGIwYXBNGDnUK8wGE+9j7EP/pAckGXgyrEsATEhDzCuUDdfkB7tzjL96R3e7eQeIs69r2nwCTCjsSABiJGdUU6Q5iDPwEmvxB+6L9SgDPBDUKrhBcEywRbww3Boj8YPFq5vneSt3u3c/foecY8wv9DgfuD1EWbhlHFlEQTQ1dB4j+s/qq/Fb/UwOsCUgP4RNgE/QOiwnoAKD1q+qD4bzdp96d34vkO/C2+ioEAA5tFdQZTxj2EWoOvgpNAar7dvwu/4QCwQiODfQSvhOaEAcLfwNW+EjupuMV3lze1N4q4g3sGvdLAIAKBBP/F9wXqBPUDuoL8QJv/JX8ov5gAXYHyQwlEpUUMRITDeYF5fvQ8Q3nVd8Z38zfXeGB6Tz1xv1oBx0RPRcDGXMVPRA8DQ4G+v3V+9f9FgBNBf8KUBC1FAMTcQ7QB1b/hfSW6ZrghN4G34Pf4+V38af6/wNDDlcVXBhnFhoRBA6iCDf/sPvU/B7/VwNKCZEOjxP5Ey0QXwqMAsX3VO354vneL98B3+riIO4K+GQAPwtyE+gXwBbREtAOhgpTAaL7Fvz3/dwA/QbXC7IRARQiEdwLIwXG+8fw8OXX393fZ9+74GPqNPXr/O4G1hAeFn8W4xN6D78L2gMC/AP7lfzF/pgE/wneDzEU8RIUDmUIBQAT9TDqBuJW4AHgO+AB5+PxHPqKAxUO1RSOFoEV6RAyDR8HT/44+1f8Av6hAskIaw5xFMUUphBjC8AEJ/ps7qTk9uD54BTg9uOZ7mz3zP7tCb8RvBQgFYkRDw00CYEAQvvw+iX9aACCBs8L/hEBFRESVw3ZB3X+/vL55w3iYeHD4JzhqerQ9BD8VAa6D8QTIBVdEzUOFwuuAxj9gPvW/KL/FwV5Cn8QlRXgE0cPbAq2Asf2lutE40/hluAE4IjmMvHp+FoChwzlEgkVWRTgDy4MwQbC/hH73PsQ/pECeggUDqIUlhVtEfsMsQaP+5nv1+Wt4T/hht/I4rDs2/VZ/R4ItQ9HEyIUohAPDFsIPwEe+zf6OPwDAO4F+grOEZ0VbRMFDwUKoAAr9S7qn+N74o3hs+Fo6U/zV/r7A0oNuRFfFAcTEw6VClYF8P3L+q77CP8cBF8JoQ/gFYYVKBHHDDIFrfmY7mPlkuIV4mfh3eXD7533xP82CV4PaBNlE+QOJgtYBxUAnfp1+jf9fwHdBlQNjhQJFtsSlQ7ICDn+hvJo6CTjMeJi4cfieeuz9H/8xQWdDTATBxVsEuYMWAohBE/8zvlT/Jz/bgRhCicSfhayFKoQnQuqAtf2ZOxQ5Fvi1uGL4TPn3/Df+EoB8wlTECwUpBMnDi4LpwdU/7P5cvod/gsCOAfpDUAVIhXEEQ4O3gal+/Lwhuff4kfi/OEx5CztOPZ6/kkHFg41FLYV9RAFDDcK4QIo+q/4FPws/7YDwQo/EjsV3RPiDzcLEQFZ9jvsTeQt4k3ixuGP5xzxaflVAlUKzxDVFNkSag3bCpwGi/0k+Hn68v2JARsI7Q+CFVkVvBLEDlEGE/sx8ZznTeO94qPi3+Rd7df2k/7aBj8O2ROVFJ4PzwsGCpkB4fnR+Qb9TQB8BcwMvBPJFQoUfhBkCvr/UfU46/LjVeJw4rPisOje8i77uAO8Cy4SUhU9EnkMxAr4BLr7bvg4+xb+VgL5CCgQ/xQ3FJMRoAzFA4D5qe/55XTiqOJi4rblFe9s+MQAIQlOEFwVcxSuDwMMywgmAPf44fmq/A4AHQYvDWoT6xRgE6sPWQid/erz6OnB4jTil+IG4yLqbPTU/C0FMw0KE+4UaBEsDBcKcQOZ+tH3yfpT/dUC6AnIEOcUBhWHEp0MSQOw+Ynv5+XT4rTjruPr5sXw8fn5AfMJ5hAPFd0TlA7hCgcH+/2h9174QPvX/iYGZw1HEzEVFhRqDwwI6f169L7pbuNU4wbkQeSr6xD2qv1ZBQgNkhPaFMERVwyZCbYChPmo9iv5BfzMATgJHhAYFeMVCxI5DMID9fn4703mnOPB5GTkkefG8Bv6vQFcCYMQ8xQDFHwOIAqmBnz95/XQ9vP5F/5VBagMQRNMFn8U8w8CCAf/8PSU6hjkcuT25Arlt+vM9aD9SgX+DCkT/xStEbMLswhPAsX3iPQr99X6ygD/B1cPwBSnFdIRZQweBBP6CfAr517kZOUi5Zbn9/A1+j0B7wgRENEU7RMYDkoJGAba/JX06PRT+Q797wMKDH8SYxacFK4PZgmWAGH2yuyQ5ePlhObo5eDrBfav/eME3wwRE38V1BGtC/UHMALQ9xzzi/Yp+mb/ZgeVDm0UdxWgEbMMSgX/+1LypuiR5UvnSOeR6Inwj/pAAWQICw9eFCgUnw6lCHEF8Py184TzuPdO/BYDGAs+EhIX0BXPEK8KxQJ2+OLui+f85k3oaed369/17v0CBJcL6BFDFU4RYgswB/sBKvcK8tz0OPm2/hkH6g4QFdwWCRMfDmQHq/0H9HjrPOeQ6FXooOh48IP6gQDlBicPDxQWFHwOygiDBTr9APS88lz3hPz5ApcKexJmFwQWMxEGDKcD5fmR8Ezpvucw6afn/Opu9LD8sQIuCgIRdRTWEUALOwZlAfn25fDZ8sf3c/0ZBSoNZhTfFjIU7w44CT0A8PYx7qHo3emd6QfpC++q+L/+lQUYDdgSqBPUD6QIlQTj/Qr0zPBB9dn69QCtCPkQ6xa9FoUS4g0WB2D9svTY7G3p/Omj6O7pCfKF+n0A6gcQD4ITsBH1C7sFpAH9+J/wT/Hz9k78sQIdC/US7RbEFK8QTww8BDX7tPLZ67Tq1uoa6arszPW9/MMCJApvEMMSPQ+8CJwD/f5y9Rrw5/KW+Lr9KAU4DbMUNxY2E5QP3wpOApz5XvHZ6yHrsuon6cHulfcO/ngETAvgEK4RvQwkBqQBzvvI8sDvtfTK+UH/dAe0DxAVARYOEzUP9girAAf4tO+i6/frderB6tHxQfoGAIEGugzEEHEP/wlkA2r/ifgf8Vzw5PUu+5sB8AlyEUkWmhU2EkAOlAeh/sj1YO5k63zrt+mC673z3vvoAJkHpg01EJANcgfYAd/9kvZU8Pnxvfco/ewDXQybEyoXwxUGEugNIAbF/Ofzku1D67rquunW7Tv2J/3AAg4J/g2/DnALAgXO/5L7hfQB8MXyG/nd/oEGHg6PFbMXIhV2EQIN/wMz+h/yquwb66rqaur070b4Rf5xBNMJQA1VDeQI9wE+/tv56PJc8Dz14/vPAfsIyxG5FyIYCBXIEZsLRQER+JDwMuuF6jfqz+t48h36SgAPBuwK6w1hDLsG0wB5/bf41/E98p74Ev/CBMsMaRUqGtgX6hQnEb4IHv729Ujuv+qc6mLqmO0E9YL8LAKeB+wLSA1sClYEOv+K/Ej2zfBQ9EX78gAOB94PaRh5GZUW+RMjD1gEjfp78rvrJ+le6cPpcO6D9mT9BwPLBxkMewyRCIMC+P6n+8r0qPHf9hL+rwJ7CTwThBnaGPUVdxPtCxIB2vde8B/q2ugm6ZDqUfDQ91f+RAMyCI0Lwwr0BesAk/3G+czyMvLY+Br/vAMWDHcVPxl0FxkVXBEoCOv9afXE7fLoFumZ6Yzr9PG7+S7/ZARVCXALqgmDBJz/Iv339xDyzvPA+qH/LwXTDnEW5hcnFowTGA5KBHv6B/Np6xDoIOnt6bTsyfN1+/cA4QWFCvkLKAp6BEP/4vwS9+jxiPX1+9UA2AecEe4XdRh6FnQTmwxbApz5L/II6xjpT+tz66Tuu/ZJ/TkC4wbqCrILVAlFAwz/4fyX9kzztvfk/UADOws9FNMYHBklFxgTJQvWAMT4XfFZ6sPpuetn7GXwRvjY/lED3QcIC6gLlAhTAjT/C/wE9vrzyPmb/1IF6Qw6FQkZbhjxFccQcwhQ/5736e/d6frqmOzA7KjxM/r9/wYElgfbCpcLnAaWAAf+//qD9OLzlvkjAKgFKA2HFDQYEBegEzIOcQZY/f/1Y+6t6Y3rvOzu7E3y4fqdAE0E2wcVC78KdAXE/8r9gvqK9ML0gvt7AQwHkw6mFQoYwRZjE9EMYgSD/Nf0/Oyb6fbrsOxi7WbzAvwXAXIDYAdyCkIJPwPu/T79H/mO8w72svzvAdEHrg/PFVQX3hUrEj4LwQIB+8zzauw96gLtrO1i7kP14P1xAdIDUgiwClsIhgKi/p/9nvgA9Lz3lP7jAmkJyxF9Fi0XlxXREBEKygEB+l3yS+vK6mLttuyA7uX2sP0JANAC4wfHCAMFdwC5/bb7vfaV9Oz59f9TBI0LbhMnF8QWoxRWD7sHNQAG+Hjwkuo268Ltf+zL71v5ev7u/68EqAgKCEMEyv+c/Wv7O/bt9Un7dwDLBRcNnBMtFtMV8hL7DMoFH/6Y9uvu1OpT7LvtMu0W8tf6bv40AbYFhQiaB24Evf/O/XH7SPeC9xz9/AG/By0P/xNUFoMVkxGZC5MEpvwF9fXt4epU7BztY+2O8/z6X/6jAWAG5we3BqoD6/7y/H/6oPa09379igKxCBYP/BOoFVMUkRC8CiYEU/zy9BHvQuwG7jvuRu8C9jr87f/AA4wHAgnhB80DgP8o/pH7wfef+YT/PgTkCSwQzBT7FY4UVxDiCssDUfz/9LTufuyU7gTuou/m9bb8JgBRAyMHxQhhB/kCOP+//nr7Z/eV+V3/5QMtCcwONROYFAsTqw5dCeUCffuR9EnuvewT74Duwe/c9m39IwAWAy4HugjIBqkChf9r/p37h/eY+cL+IgNDCFENIxLaE4EScw48Cj8E1vy09WvvJu678D/vtO9Z94H9If/YARsGzwcSBg8DN//I/gz8bvcA+VH+WAKlBlgM0hBhExASJg4yCkwE6Pzu9d7vr+4a8bfvzu8Z96n8rv1gALAEMQZ6BZwCm//s/uX8J/jJ+CT9EwHUBWML3Q8lE9gSDA+qCx8GGv/G97/x2+//8b7wUfDV9tj7Bv1N/3QDFQURBUcDzf8J/yz+C/nS9//7MAD/A1cJWA6CEuUSyA+DDKcH7wBJ+nr0ufGa87DykvEV9tr7efwS/kUCBwW6BWcEvABkALP/IPqb9z37F/+aAtEHNQyqELwRWA/TCykHNQEL+9b0c/E38+vyafDt87D5gvqv+5H/8wLbBNoDpAHYANkArfu++Nf6Sf7uAbYGEQvjD5YSkBChDBYJOQN9/ef2t/Ld80/0WvFw88b4VPqg+jf+PwK9BO0EcQJrAZYBof1T+cf6hP4wAsIGrAoYEPwSXRFUDdUJ3QQk/rD3J/O489vzuPCC8X73+vjF+SX9swHwBCcFfQKjATUC//0K+dX6Y/4BAn8GLgoSDyESdxCdDGQJJwTt/Qf4S/Ot84L00fCS8fr2BfmX+QL98QHcBDkF4wKrATgCJv51+b36Of47AcEF2wnRDosRPRBZDFcJ1ASk/sD4L/Qu9PP0xvFa8cn2fPkp+dP8/AHEBe0FxQMDAyoD5/69+T361v13AJsE6Ai/DToRzxDtDFYKiQaRAFf6oPUM9Vb1w/Hb8Pf1xfjV+D/8qQFFBZwFAwSdAuQCjP8i+u35u/2mAJ8D8gcBDQ0RdhCZDYcLXwhkAln8aPeh9U328PJl8OD0PPhG+Nz6cQDnA7cFmgTsAkUD9ABM+8L5Cf29/58CjAbQCyoQOhDkDYMMGwnRA+X90fiL9c71JfOZ71ryvPbe9gz5Q/5GA6EFbgXHA90DwAK5/O35fPws/zABDQWGCtgOpQ8fDk0MUgmXBGX//fn79cr18fN87wLxTfUe9hH3uPyhAnIFqwU3BYAE8AOQ/gP6q/vh/cb/xwPwBxoN8A+jDv0MSwufBqUBH/wX9zX22/Rc7xjvzvMC9Yn14fo3AdYEuAbNBUgFSAWuAIf7vPpu/Ej+sgGZBY8KsQ7jDt0M7QupCMADT/4b+NT12/TS7/Psv/Dw8qfz7/cU/8cD4ga3B2IGuAZkA439rPpW+6H9LwBBA+EIpg4wEMkO5Q2tCwgHzgD1+ZH10PRy8F3r2u2X8pPzTPf+/Y8EGAhnCQUJ7QfyBX0AsfuE+i78Q//yAfwFDQ3NEL0Pbw5ODmQJ9AJ6+xH2zvR38Y/rOuzt8JjysPXm+w0DiAeeCksKfQgkB0kDtPxH+Qb7Uv6GAEsEUQvREMAQdw9LDzoLhARn/Ur2mPPP8bnr/urM78fyOfWa+/YCHQhiDN8MKQoICS8Gxf7j+YD6PP2m/8YCGApkEEARMBBwDyMMiwXg/bT2W/KF8DPsIulg7bfxjPRy+kwBUwf7C/wMSwqbCHcGPf9K+EP4/vv8/RcB8AfODj0RJRBED2IMsgXK/lD3fvEK8OXsqOn561Pxj/Q6+UMACAfzCwQOcws5CcIHCgEP+VP34PnE+0T/TAWUDH8QWRDYDvsMGAep/8D4MPJ070ju/+pN6xDxZPUj+Z3/UwbXC60Omw3GCnMIoANU+y33Mfin+vL9zwI5CT4PZBCLDksNewhgARz6QvMi7zPuyusl6s3uh/Rh+BP+0gRGCysPXg+yC+sIbQUf/vX28PX6+Mz78/9bBhANvA/yDnsN8wmYAwj9o/aD8OTv9e5B7Jrua/TM+L/8bAMQCh4PSxHxDQ0KXQe+AYz4nPRu96/61fz3AQQKnA5SDgMN8grHBeP/R/nO8oPw0fBt7oXtBfNw+L779AD1B5cOPxGeD3ALAwnuBJX7lPSU9f/4Mvvi/mIGZgyQDhwNQAvnB7kCUPy19bfxsPKs8ZfuVPE/+Jn75/7LBYUMYRDcEFcNqAkwB63/nvZe9Bb3gfn2++EBRwmmDZoM2AoACsgFUv+O+VX0SPNj83PwB/Cs9aP6bv1fAgcKgw+DEQMQugvvCMwD7fkt8w708fZ9+FX8SgQfC70LfAt7C2QIJwOw/an4y/Sw9Erz9++b8vX45vtQ/9wF2gx0EVURfQ0aCiQGZf7j9NTxPfRM9nz4m/6DBtAKEgsMC0wKZgZBAhX9ZPfJ9fX1qvJw8Ej2Gfu+/HcB2Al2DxMRhg+SC34H/QFO+B/x3/BV9PH1wPmiAeEIuwt5C4sLCQoTBkgBAvvy9oj3FfWH8BLzRfn5+1b+uAV9DNwPNBAwDboHZAPW/KTyw+3s8GPzE/VT+8QEQgr4CpgLMAxcCZwEz/77+UH3LfeW87XxSfb6+pX9WALgCF0OrRC8DusIwQR1AN72xO1g7s7xYPNm9zQACQgdC1UM9gySC78HLgOH/Rz4jfd397Dz5PMM+iv+SQBeBSAMdxCID6sLZwaFAgj8x/DB66TulvER9KH61QNcClEMZw16DbMKggaQASD75/ey+Ir2SPKE9vP8bv6TAUYIqQ3kDhsNnQiwA7/+bvZg7QXsRPA085b3pv96CHMNUw6yDhkOvgrPBdT/Jfrp+eX5D/VG9Av6Kf7j/pYDcgqwDZgNkQosBWQA+fpA8Zjqy+zn8eT0SPrOAzgMGQ/tDhcQjg76CbQERv8I+3D7rfnm9NL21PyM/vX/bwXuCtUM9gvBB2oCW/7g92ru2+oK71XzsPaW/fMH9Q0VD0IQlhCFDeoItAPt/Z/7bPsV+CP01PeR/D79pP+4BdAKXAywCQIFjgCI/E30yOv164bxivSB+GABeQoyDtEPkxDLD7UM1QhMA539jfy6+7r2//NF+aH89PvI/wMHDAv4CdoH4AME/+z5PPFk60rtJvJc9Sj7OATYC6QPkBDkEN4P6gxyB74BZ/0K/av58/N99PL5lfqN+1ABugdMCR0J6gaHAdP87fds7/nqSu6K8+n2ZfwBBpgNrQ98D8sQrg+TC8sFZwCf/NL7xPfx8t70evmB+iv8AAIuBy0JNwnABJH/xPxN9vPsDOuW8G30B/dY/uUIbg68DxkRvhHtDuoKsAX7/gf8Tvtt9qfxUvXz+Vv62vwvA7AIDQoqCAsEJACP/ET0CeyN7M7xovTv92oBJAs6D3sRdxLREQQPhAqUAzb9svuV+fHzFvFf9lf6pflv/VoFpwmcCbQHxwO1/7T6EfJ662ztSfKY9Jz6wANuDJUQvBFBEqEReg7cCKQBzPyU+6v4iPLA8QH47flg+qf/1wbECQUK0QdJA1P/cvqP8Zbs9e6483z2FvzlBawNOhHrEU4SphGVDc4HygDy+4P70Pfd8eryr/hE+tH6OgGZBygKsQnLB/4CqP6v+fbwaexg7wL0+PbK/LEGnQ41EcARzxL0EDgMXQZq/xz7cfpq9ivxL/RL+XX66/uyAh0IVgqpCccGNQJn/iH4++9X7M/v4vNL9xX+8gc8DgkR2BEnEr0PCgufBLf93vmd+dj0G/H89Az60vqm/VgEkQmKCiMKdAfXAUn9pvek7o7r7+849PX2zf65CAwPBREFElsRvg6wCW8D9vx8+vj5qvXv8rL3O/yB/Lr/kgYkCoELSgslB0QBZv2X9l3sauq17/Ty6/Wl/qkJbQ+TEBkSARJ8DqgJWQNB/Tn7wvrX9SnzO/g6/GL83v/2BgsLyQsTC1YGdQCg+xT0U+pI6Mzt1PEL9aj+HgpzD6EQrhHAERMPfgmFA37+UPyD+wj3jfRq+fL83PxYACwHogvdC5gKWwYnANf6BfM06Svov+2E8QX10/6FCqcPlBBREZQS4Q90CnYEDAAk/qT8a/cD9e/4f/xk/IH/XAbHClQLAAm5BNb+G/lI8XPoNudn7LfwXvS0/bEIuQ4UEKIRNRN1EcwMVQfWAsMAYv4n+pX2bfnS/B39yP57BOMI2giWB3YDvP3n957x++ns5ojrz++e8+j7OAYaDe4PthE4FI4Tgw9BCrIFWgLE/3X7APcP+Dr7Efxe/HwB5gWSBnkFrQKT/bf3gPKX65vmJeoD8Efzn/liBGoN4RDpEtIVyRbJEoUNYgm+BJgAWP3k+Pr2/Pns+qD6CP4RA6EEQASvAhH+e/nY9Nrtqeev6F7up/H39hUCuAufEIITzxYzGNQUPhCmCzcG5wEq/wT6KPas93v5gvd/+Qz/fgH4ATgCVwD0+uz1QPFj64/o1ex08ob3cv8ECtARlRQrF04ZiRfDEm4OeAnyA5oAO/xr9pv0L/aP9ZT1n/lQ/s8ADQIJAVj9wPiN9MzuJ+ru6wnyZ/Z+/GcG1w/LEz0W9RinGHYVthF3DIEFTAKK/rf2PvLI8nzzFPLR9Or6U//RAe4CpwBQ/HP4J/TJ7VXrj/Hz9ur5DQLADNYSvRRtF90YzxeeFBoPeghkAxH/Lfh98GHuFfBe74vvwPVB/GwAhQIDAwUAVfwi+fDyaO0S8Jb1hvcf/KwGnQ+3EicVnBg1GZcW/RFxCywF0QAc+znyN+1d7g3vR+2y8R36yv+sArcFoAXTAa/9+vlZ8xjvbPNJ9yL5lgDkCnkQ0xKEFhMZxBiWFEAPWwmQA2v9lfWX7tDrieyo7JPukvVa/bUCDwcyCRcH0wJ2/wH5wfEq8V/0Nfcs++UCvAumEGgTgRZNGJMWzhHiDIsGgf8x+Z/xMOvi6dbrEe0P8ar50QE+B5IKvQrkBxADGf1Y9urwFfHL9Cn3yPvkBIsMAxBWE/8WORfsFOEQVwozA9D8m/Wu7Ybpguq77Czv0PX8/jAGegoZDaULmgYEAej7GfS07iXxM/XT9mT8ygVZDMoPiBOuFv8WORTvDmMI6wBB+kTzPewg6S/sne+e8r/5rQPUCYIMNQ1NCoIE6f7z+MfwJ+0L8ffzPPVs/FwGnAzYDw4UORcHF28Tig0dBgT/EvnO8WPrXetH8B/yovWa/hwHyQofDQINaAgHAoj9kfVs7cvs6vC+8fnzBf00B40LLA/yFCoYNRc7ErYMWQWv/kT4X/Bg63ftCPFY8mb3HgGfBx0KsgvLC7YGUgDV+rzz4exV7B3vLPB79O39kQbcC9kRshcnGY0X8RMIDowF0v1w+MDxPOy27uDxzvMZ+bYATQYiCZ4LCgqLBFT/ePps8oXrOOv47cnvqfN+/acHNQ5JFP0YuhoQGsIVQA3DBJ//TPl48Azt3u9V8bzyp/goAP0EhggXC+wIpgMI/5/5jfAY6anp5+yu7b3zdP9yCTIQvRbcG8sdpBt3FnEO/QVG/z748O/d69/tffDj8TX3dv8iBYQI2QpaCdMEn/8c+aHwuekj6WTsHO7z9HkAmgsVEzEZ9h4+IGYezxiwDzAHLADn97buk+pv7P7t/u8z9bX93ANNBy4KHAneBB4ArfmT8IHq8uqY7PTuP/bUAkMNZBQkG+MgxCGNHkUY8w4hBun9EvXB7E7p7uoz7PHtS/Rt/CICUgaPCdwJugZIATT6JPPB7ebq8+tu8LP3zwGLDLUUexs2IGMhOB2XFygPkAVJ/P/zke0L6UToG+od7VPyKvmN/0kFTQk2CrAIPgTy/a73G/Hu7Obt2PEO9wwATQpDE6kZ9h08H4kc6BZcDgwFyPvL8yvt3uf+5azomuvx7/32tv4JBRAKvgxgDLIIjgO//KH1QvCG7rDw8fRh+58FFg/GFcUaHh1oG9oVlw5BBaX7afO+7ITnJeUo5xzqQu/G9f/9hQW2C3kPHBG0Dg4J1AL7+orz6O5p7x/ysfe9ADAL2BIBGD0bsBpsFTwP3QbR/GH0Qu7H6RjmfOZi6l3vi/X1/cIFegx2Ec0TeRGgDIQFSf1E9LDtn+sE7sfyqfrABJcNOBQuGGMY6RQKEJ0IHf+M9rrwAe3e6Bvoxetp8d32nf30BTwMgxEkFMkSaw7eB8n/KfeV72vrI+wD8Jb1pv5FCOQPLxQJFswUlBCTCrsCOvq19Pfwme0a7Aru6vKt99j8DAOuCfsOJREqESoPJwoTA5364vID7qbrku158VP4pAEICrAP3BH8E5kShA3IB7gBT/zs92X0S/IZ8lj0WPdd+k3/YAWoCsgNxg+7EDkNegdLAOn4vfGg7Jzrge0f8g76cwLjCIkOJRLYEsAQpQ08CWEDaf7H+pf3BPWi8w/1hvcX+ib/6wR6CcgMXw8wD/QKuQTd/Qv2Yu926wvrjO218tj5KQJ1CVAPgxJXEzUSmA87Cm4EW/+C+rz1WPO98nTzoPW1+aT/zARxCWUNOg/MDXMJfgNF+2Pz7O1G6nHp0eyP83H7iAP6C9URzhTXFDUTKw/ACSID1fzu9wz0VPEB8avxk/XN+m3/QAQsCuQNgQ5eDFYIEQLk+S3yLOwq6bHpnu7s9BH9LwewD0cUKBYEF/wU2g8eCX4CiPwU92vyMfCO7+Hwo/T4+Jv+twT1CRgNvw1aDJkHYwB1+I/w7+r153bo9uxI9PP9hQeRD7EViRiUGIcVeBBDCT8B0vov9Qjw+u2h7sjwKvVZ+ukApAcIDXcP6xBWDjUJ/QEY+aTwjerX55fofexm9af/GwnQEDAXdxrzGE8U8w2ZBjz+3vbX8AXu0uy77QjxvfaE/Y0DsgmPDiMR/RG+Dk0IeQCO99Xueujp5Zvn7Ow/9hEBIgsyFN8ZuxrRGLkTbQykA5j7b/V/8avuZe6/8HX01PiZ/v4E9wl4DrkQVBDcDP0Gh/7D9TXtged/5vDoXu/S+DIEaA5rFZ4ZjhrrFugQiglbAub7O/bp8gnxZ/Fn85r2h/rZ/6gFPwq5Da0PBg/5C+UFsf5M9v7vgOtn6hbt5PKn/EsHlw02EjAWMxUqDgAI4gLQ+1f2sfOl8tjyK/Wt98P5bf0/A2MH9gdGCrMNCAxMB8MCg/2y9efvRO0P60HtWvQi+ysBQwjwDuAPEw6uDOMJ9AXmAmsAmP1//Cr9Pfxb+lT7//0+/63/8QMqCKMIBgikBxcEuv62+XT01PCl88jyuvYMAOMF+AikDX0OhQznCZ4G0gHcAGj/4/ua++X7BP1u+4j4xvxM/8D9sf9hBHEFNgRuBZsDRv6s+5n4ZfKS79TypvQu9gD9mgQxCUkNXg+HEL0OGw3TCp8F2QDN/jD8yPcO9gf3T/eI+Nb8RQDRA74H+An8CFYHeAW4/w744POo8Z/wBvET9SX8XQJYCBcNhA+/D8gOXwuEB6QDkv9u+634AfbD9M701fSv9vf6tP41AlAGYQkBCsUIvQV+AWr8q/dp81jxb/Kd9a75tv95BUkJNQxODVkMwwlVB+kEXgHQ/tf8ovl59wP22PXM9fD25vo7/4YC1AZcCl0LigkLB2ED6vxD+EP1S/Lc8gj2+vmw/UED0QeTCdcKdQvBCsMIVQb3A28ACfyV+K/12PJl8qT0Vfe0+54BPAcvCwkNtg2aC8UGLwES/EH2B/L+8F/yw/N8+BP+6AIrBxYLoQ0DDrAMcAuJCKUDDv6Y+Wf12/E28avy8vQ/+0sCEQejC8APthA6Dh8KIAXR/tv4FPTE8GPw6PI79nD68P9KB0cMVwyZDesPQQxgBaoCJ/7x97LzHPNC8f7yJPcP+lb+NAUuC6UMUg0TD7YN1QexATz9uvjp8vrxpvKD8yj3Rvxg/7UB7AVvCCcHEweJB7cG9AM1Abf/Zv2W+un5WPkg+h39/gBWBJsGMgpzC6AJzgZqA03+DPlz9VfyQ/Fn8ib1YfiD/H0BwQUlCTMLVA1mDScMkAlYBisB//u691H0//EK85j1E/pA/+oE1wkPDVcORg1gCgMGlgBl+/n1pPKp8Zzyu/T69wr9QwIGBskJ6Qt5DJcLAAnoBPMAHPzz9+D0KPPF8zT2UfrD/uME4QlFDRMQyw+PDRQJngMe/T/4OPRR8ZLxDPRZ93H7FAF2BH4GHAl1CdMH/AVNBMQBs/5f/Cz7bvn1+I/51vtr/uAB/AVvCUYLMQzoCogHKgMB/8b6gffT9Cn1n/Yt+IP6FP3i/6wBrwLpAyIFKAUBBV4EmwNfAo3/tf2n+7H69vrf+wH+kADYA1MGDAfSB/cGYgRZAbf+5Pux+bX4N/jo95X4cfoC+2L8U/4zAPcBOgPEBDYFhgSoA9ABoP8F/k39L/1j/Zn/EgLbA+IFTAdoB08G9AQGAgD/xPyd+oH4R/eB90T4EfmA+pr8U//qABACBgR5BMgDmwPdAk4BCAB9/7b/j/78/4wD7QinCe0J2QwbDBcGyP+7+kX0+O9d7qruV/Eo94n7gP4JBEkKQgoJB3QGQgY8AaD84Pqz+aj4cfoB/AP9JgBfA4MD6QGDA1YEfwFIAKkA9P8kABcB5wBAABcBnAGx/6L9vv1c/iz9lvzl/QH/RP+x/0gATv8G/9T/av9h/oT/TwJ+AyIDwgTeBZEETAMrAqD/RP5a/j/9G/wg/cT+Sf7j/VX+iP6I/qb+u/76/jj/JwCiAKH/AAD2ANoAGACHAfoCtgOsBEcFwAViBRkFrQNkAab/x/6H/C/75PrM+1v7jvy6/tH/SAB/AaUBfwE+AagA1P+1/63/PABpANAANALeAvkCFgOXBCAEQQPFAxMDUAG4AG3/g/w1+/L7S/s/+939bACDAPEAmQL9AUcAvv8r/2/+W/5w/xb+qf5IALP/FP97AGYCdgJPAmIDRgRWApcA6P4i/UT6TPkx+Sj4dfmH/HD+yP+JAtYERgTlA60DegHl/8f+gv7C/Hv9Xf8mAAcAnADQAlQCCQFbAREBFgCYAIv/A/6U/VH+PP3d+gj89P63/pX+IwD7AnUDfgD2/wQAbP6V/cf9Sv17/nYBrQHB/2oBQgMUAPL8qP+uAED97f2aABAA2v1PAM0A1v0c/zABAgC2/ugAywGQ/wP/HgIbACr+wwCYAPj+p/5gAWsBjf8SAbIDwwHCAKQCHgLt/uT/2wE7/vf9nAEYAPr8ZP69/+L9DPy+/qAApP/8AUgDhgKSAgEESgK1/7EASAIJAHX/ZQG/AdP/1f/YAKj+kv74//L+2P2f/msACABd/3sAlgEfAvMBIwKtAHEBMAKL/zn+IQAGAeH/rv95AUMC5AETAdj/o//a/x7/zPwu/fn/RQDl/goASQK+AUEAuAC+AP7+mgC2AKL/UwCSAV8ANP9oAFQAMP8iACMC+gI3AqsEEQW5A4MDSwN1Aen+VP1f/F36UPqH+uT7zf3O/xwC4wI+AhsDMwIRAJv+i/4J/iD+Yv8ZAt4CvQGdA1sFKgTpAgkDLgJRAWIAj/3r+x38YPoZ+F35U/pd+438XP4hAtoE7AT5BRMHMQa0A98AZP4Y/Ij65Prx+hb8Qf54AboB9AHqAxUD7ABTALL/5/6t/GP7NPyD+1r7P/zh/MT9OwFdA4sCDAT4BuYF2wLeAZIB8v3o+rr5jvm6+M/5/fqj/EoAoQMFBM0EOQfCBiwD/f/X/zL+6vrM+Vb6SvvR/HD9QP7qAN4CJgJXAc8B7AGC/8j9Hf6j/Xz8Ffzt/Qn/u/+d/2gCMgNIAlICmgLaAB8B+AAy/gz+0/+b/pD84P0u/kH+Nf7e/uv/7ADbAK8BIQJ8Ab0BYAHGAP3/9v/X/zH/4/1q/2AAUf9uAKoC2QLYAtgDIQSLAvL/N/7d/I76HPqI+tf71v1jATsDhwMSBIgEhwSHAXD/GwCb//v9J/6LADoADQAYAvMBKQFzAUwCagF3AMYBJALuANsA9ACGAKf/EADGADAAHQBXAc4Ayf69/i7/9v18+yr9m/6a/aT+VAHAA6oCmQMVBQsE1gIZApQA7P5q/24AcP9j/6oBZQN0AKj+cQAs/0n75Pq8/FD8pPxc/jL/sv99AfMB7AAYAcYCUgL3/2sAjgJSAYv/mgBvAt4B8f/mAOMB/AC/AC8A//8IADoAKf9A/af9Yf6Q/Sv8cf2L/9r/oP8eArUCiQETAhMC9v/0/n//2P+a/vn/DALoAfgAZQFHAhAA4P4j/+T+SP6L/Tr+1/2W/W/9j/4h/hD/LwBQAAAA/ACzAAgAJAA5//f+cP43/l/+mP5J//j/6AGAA6cEaQVOBr4FYAN/Ac/+O/xz+pv5HPnt+bb8Kv74/hQBwAORA88CgQO2AxUCAABfAHQA4v+6/0cA2QDJAJ4BzgCZAAIBHQJgAQgAmf/DAGn/r/2T/XP+dP4E/of+Gv+U//X/VP9F/xEAhQB5/zj/LgD2ADf/qP7a/+n/eP7C/lEAjQBXAIABRwJsAjECGAEbAJz/iv+1/fD8df68/z//sf+aAYsCmwEMAYYAyv+C//L+ef7n/Rn/LwBV/2H/eQCUAakBAwLcAioEEwQ9AxcCjwHZAF3/Qf6U/Tn+EP4b/aP9kf6v/Tr+qv5V/+r/UQCbAWEB+wC9ASAB4f9s/1T/av/q/oz/EwCZAH4AnACTAMX/lv8PACL/6/4gALYArP/D/7cABQBY/vn+QgCQ/2D/hQFiAi0CqAGyAcAAy/7w/bn8e/w+/Ur+s//nAP0C0AQABGsDugJ5Acr+R/09/OH7UvuJ/Pb9Q/5i/9cAswCSABsAkwAmAMX/0v91/zUAbv/d/vT+lv6X/Yz9I/4s/2D/igHBAgMDBAOpA3QCef/O/n7+5fzO+w79cv0e/Uv+af9k/wsAIgEQAWwAKwDRABf/Uf5b/q3+6P08/o//AAB7AOwBegJnAkcDTgM4AowA8f9s/u/8NPyC/Ov8Y/28/q7/5v/8/6UAyv91/2v/pP94/x3/dP+p/+j+0v7G/3f/CwC9ASwDjAMcBHoEpgNmAusAc/95/p39p/2N/YP+PgC/ABkBqAFsAqwBWAGeAIj/Tv/C/ob+lf0d/iP+D/5K/gP/QABcAD8BKAJuA7QDhgMIAzcDXwLfAJf/dP/a/nP+Bv9N/7v/xQBeAWAAEAGCAbAAjf6m/iv/H/6O/dz9Av/K/8UAyAEzAmEDwQS8A7QDKQT1A8QBMgAxAMv+Yf1F/dj82fxv/XP+WP4T/9sAAgH+/3kACAFYAIb/Yf8s/wP/GP/2/mj/FQErAkICxAJNBKQEDAPkAdYBMgAY/8b9vvz0/MT9b/0r/QL/7wClADAAEQGWAVIBqgBpAK0AjQCWAGz/5P6V/8r/Lf8z/6sBuwIlAmgCkAMmBOwBHQE8ADz/W/41/Xb89fws/oP+9f0q/3UAvP+t/sr+mf8Q/4/+uv63/xoA5f/S/1QAcgG6AdQAmwAFAigCTQGjAAgBQwFnANX+e/7H/uz9N/28/Cf+uP52/l3+1/9QABAA8v9XALEALAAxAJb/wP8iAOv/i//i/4IAwQAzAD0BWwH6AI8B0gFeAe3/aP/4/u/96vyu/Uv9qv1b/ur/GwCBAGsBbQHkAJkALAA3//L+1P70/jv/1f9UAEUALAF9AScBIwGfAfMBDgE7ACwAz/8f/vr86vwZ/dL8/vwI/jj/XgDNABwBBwLDAj0BnwBXAL7/Fv/d/Rz+qf6X/7T/gwDIASoDMwMIAzgDzwK1AeL/fv6F/ff8Qvy7+3P8tP0o//3/8QAqAigD2AI3AqoBfwF8AGH/Av/A/jr/uP78/vz+IQC+ANAAQAHiAegCDAIMAaoABADx/j/+k/0t/vP+Uv/m/zIAcgEdAYwAZ//P/ygAxP+3//j/zQAiAW4AKgBFAIMALwAmAIoA0QETApwB7ACUAKr/UP4L/X/8R/08/r7+SQC9AUYDgAI6AhMCJwHR/7P+rv6O/qf+A/9X//D+KP+N/1X/gf8YAOcA7QGBArICggI6At0B3f+M/uH9Kv44/U39av5f/78ArgDBAPIABQGqAJL/E/9p/wMAU/8D/9f/kwBDAJn/3P/MAOoAXwBAANMAPQHoADgAAADK/7//Wv8a/9n+wP/x/0n/sv9SAKAAcf8U/5P/d//x/on+ff7a/qH/7f+//9H/+gBKAVMAewBcAdkBcAHVAC4BGgFTABH/uv7+/kf/Hf8m/ygAWQEuAU4ANQBVAND/TP4E/jz+3/7G/kT/1/9vAPYAMAHaAE0BvwGxAT4B+ABrAeAA/P9I/+f+q/5Q/mX+P/4F/8v/vP8v/yb/Y/8s/1P+DP7x/ggANQBJADQBgwGBAfsAmQCsAH0AUwAtAEwAYgCHAFQA+/85APz/sf9k/xj/RP9y/4D/aP8d/0b/hf9U/7f+mf6V/7X/g//Y/zsAoQB0ABkA4P9+AJQA4QCXABQBYQE7AcoAEQDv/9f/pf/y/vn+WP9j/1T/ZP+p/33/uv+K/zv/3/9QALgAmACCAHQB2gEUAWMAegCvAPz/QP95/ycAKAA1AMX/jwB0AEcAlP9C/5b/SP8C/93+A/82/zr/7v7X/rr/zv8mACYA5QBpAUIBDQELAf0AwgBeAO3/zP8SAEMABQAqAOYAAgHdALIAzQCWABEAuP9S/xL/+f7S/r7+Hf9T/wgATgCcANUABwH5AJMANQDB/8b/TP+Y/5H/cv/s/+n/DQDl/7//nv+r/3b/nf96//H/p/+5/5X/Wv9k/2j/YP+P/zEA8AAgAXMBoAG3AXgBowBPAMf/fv80//7+PP9s/+L/yf8SAB0AMwAEAKX/xv/E/8L/2P/v/wgAPAAqANf/AgBxAGgAbgB6ABoB2ACJAEUAFQDC/0L/Sv81/3L/u/++/+j/IgA9AAoA5P/z//v/3P/3/yYAYgBNAHAAXgASADsAEwADAMX/EQAEAP//LwBAADgAKADw/9H/nf+M/6f/s//a/woAcgB/AGQAjABTADAAAADX/6b/ov/A/5f/o//2/0AAPQAMAFoAbABZAAgAMAArAGEAMQAwADwAZgBDACMAPwAJAD0AGQAEAAYA3f8EAMH/hv+j/7D/yP/M/9j//v8qAFsAVwA8AHAAPgBMADcANQBTAEkAVwBQAGgAMwAWAND/vP+p/5H/lP+V/6j/j/+l/9L/rv+e/9P/5v8uAC8AXgB3AIEAbwBCAPH/5//c/6L/qf/d////+v8gACQAGgAHAAEA+P/p/9T/x/+7/6n/uv+d/6j/uv/W/+D/8v8HACcAIgAfACUA//8hAOv/6P/C/+X/3f/b//z/BgA0AC8ATgAoACIAMAAkAOr/2//j/87/sf+g/6r/rv+x/8b/2v/2/wgAJAAgAB4AMgAjABMA/v8UABoAFwAZAB0AJwAhABEADADx/+z/6f/f/+r/6//k/+H/4P/m/+D/2v/U/+z/5/8BAP7/BQAgAB0AFwAeAB0AIQAOAA8AEAAKAP7/+f8JAAwACAAFAAgABAACAPL/7//1/+X/2v/Y/+D/6//b/+b/6//9//3//v8BABAADgAKAAIAAwABAAQABgADAA4ADQAOAA0ADwAKAP/////7//j/7//z//P/8P/0//b/9f/2//z//P/9/wAAAwACAAcABwAIAAYACQAIAAYABQADAAUAAAABAAIAAgD//wQAAAD///7////+//3//P/+//////8AAAEAAQABAAEAAQAAAA==';
let meowBuffer = null;
let meowLoading = false;
let meowFailed = false;
let meowPending = 0;
function decodeMeowSample(ctx) {
  if (meowBuffer || meowLoading || meowFailed || !ctx || !MEOW_SAMPLE) return;
  meowLoading = true;
  try {
    const bin = atob(MEOW_SAMPLE);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const decoding = ctx.decodeAudioData(bytes.buffer, (buf) => {
      meowBuffer = buf;
      meowLoading = false;
      if (meowPending) {
        const level = meowPending;
        meowPending = 0;
        playMeowSample(level);
      }
    }, () => {
      meowLoading = false;
      meowFailed = true;
      const level = meowPending;
      meowPending = 0;
      if (level) synthMeowFallback(level);
    });
    if (decoding) decoding.catch(() => {});
  } catch (e) {
    meowLoading = false;
    meowFailed = true;
    const level = meowPending;
    meowPending = 0;
    if (level) synthMeowFallback(level);
  }
}
function playMeowSample(level = 1) {
  const ctx = AC;
  if (!ctx || !meowBuffer) return;
  const out = audioOut(clamp(level, .15, 1) * .9);
  const src = ctx.createBufferSource();
  src.buffer = meowBuffer;
  /* Her miyavda perde hafifçe değişir; aynı kayıt robotik tekrar gibi durmaz. */
  src.playbackRate.value = .94 + Math.random() * .12;
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass'; hp.frequency.value = 130; hp.Q.value = .6;
  const g = ctx.createGain();
  const t = ctx.currentTime + .01;
  const dur = Math.min(2, meowBuffer.duration / src.playbackRate.value);
  g.gain.setValueAtTime(.0001, t);
  g.gain.linearRampToValueAtTime(.58, t + .012);
  g.gain.setValueAtTime(.58, t + Math.max(.02, dur - .02));
  g.gain.linearRampToValueAtTime(.0001, t + dur);
  src.connect(hp); hp.connect(g); g.connect(out);
  src.start(t);
  src.stop(t + dur + .06);
}
/* Kayıt çözülemezse (çok eski tarayıcı) daha parlak, ince bir sentez yedeği. */
function synthMeowFallback(level = 1) {
  const ctx = AC;
  if (!ctx) return;
  const out = audioOut(clamp(level, .15, 1) * .9);
  const t = ctx.currentTime + .02;
  const dur = .62 + Math.random() * .14;
  const f0 = 560 + Math.random() * 130;
  const saw = ctx.createOscillator();
  const tri = ctx.createOscillator();
  saw.type = 'sawtooth';
  tri.type = 'triangle';
  tri.detune.value = 6;
  [saw, tri].forEach((o) => {
    o.frequency.setValueAtTime(f0 * .9, t);
    o.frequency.linearRampToValueAtTime(f0 * 1.18, t + .13);
    o.frequency.linearRampToValueAtTime(f0 * 1.04, t + .3);
    o.frequency.exponentialRampToValueAtTime(f0 * .66, t + dur);
  });
  const vib = ctx.createOscillator();
  const vibGain = ctx.createGain();
  vib.frequency.value = 6 + Math.random() * 1.5;
  vibGain.gain.setValueAtTime(0, t);
  vibGain.gain.linearRampToValueAtTime(8, t + .18);
  vibGain.gain.linearRampToValueAtTime(3, t + dur);
  vib.connect(vibGain); vibGain.connect(saw.frequency); vibGain.connect(tri.frequency);
  const source = ctx.createGain();
  source.gain.value = .4;
  saw.connect(source); tri.connect(source);
  const air = ctx.createBiquadFilter();
  air.type = 'highpass'; air.frequency.value = 320; air.Q.value = .5;
  source.connect(air);
  const soft = ctx.createBiquadFilter();
  soft.type = 'lowpass'; soft.frequency.value = 6800; soft.Q.value = .4;
  air.connect(soft);
  const master = ctx.createGain();
  master.gain.setValueAtTime(.0001, t);
  master.gain.linearRampToValueAtTime(.3, t + .045);
  master.gain.setValueAtTime(.27, t + .38);
  master.gain.exponentialRampToValueAtTime(.0001, t + dur);
  master.connect(out);
  const formant = (start, mid, end, q, gain) => {
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass'; f.Q.value = q;
    f.frequency.setValueAtTime(start, t);
    f.frequency.linearRampToValueAtTime(mid, t + dur * .4);
    f.frequency.linearRampToValueAtTime(end, t + dur * .84);
    const g = ctx.createGain(); g.gain.value = gain;
    soft.connect(f); f.connect(g); g.connect(master);
  };
  formant(500, 940, 460, 3.2, .5);
  formant(2500, 1700, 1150, 4.8, .24);
  formant(4200, 3400, 3000, 7, .07);
  if (!meowNoise) {
    const len = Math.floor(ctx.sampleRate * .45);
    meowNoise = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = meowNoise.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.sin(i / len * Math.PI);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = meowNoise;
  const nf = ctx.createBiquadFilter();
  nf.type = 'bandpass'; nf.frequency.value = 2100; nf.Q.value = .8;
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(.0001, t);
  ng.gain.linearRampToValueAtTime(.02, t + .06);
  ng.gain.exponentialRampToValueAtTime(.0001, t + .42);
  noise.connect(nf); nf.connect(ng); ng.connect(master);
  saw.start(t); saw.stop(t + dur + .05);
  tri.start(t); tri.stop(t + dur + .05);
  vib.start(t); vib.stop(t + dur + .05);
  noise.start(t); noise.stop(t + .45);
}
function synthMeow(level = 1) {
  initAudio();
  if (!AC) return;
  if (meowBuffer) { playMeowSample(level); return; }
  /* Kayıt bir kez çözülemezse kalıcı olarak senteze düşer;
     her miyavda aynı 65 KB'ı yeniden çözmeye çalışmaz. */
  if (meowFailed) { synthMeowFallback(level); return; }
  /* İlk miyavda gerçek kaydın çözülmesi beklenir; sentez asla öne geçmez.
     Kayıt gerçekten çözülemezse decode hatası yedeği devreye alır. */
  meowPending = level;
  decodeMeowSample(AC);
  if (meowBuffer) { playMeowSample(level); meowPending = 0; }
}
function synthDrop(level = 1) {
  initAudio();
  if (!AC) return;
  const out = audioOut(level);
  tone(out, 920, .01, .32, .085, 'sine', 270);
  tone(out, 1380, .005, .07, .03, 'sine');
  tone(out, 640, .15, .4, .028, 'sine', 230);
}
function synthBreath(level = 1) {
  initAudio();
  if (!AC) return;
  const ctx = AC;
  if (!noiseCache) {
    const len = Math.floor(ctx.sampleRate * 1.1);
    noiseCache = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = noiseCache.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (.4 + .6 * Math.sin(i / len * Math.PI));
  }
  const out = audioOut(level);
  const src = ctx.createBufferSource();
  src.buffer = noiseCache;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.value = 1.2;
  filter.frequency.setValueAtTime(620, ctx.currentTime);
  filter.frequency.linearRampToValueAtTime(1450, ctx.currentTime + .42);
  filter.frequency.linearRampToValueAtTime(720, ctx.currentTime + 1);
  const g = ctx.createGain();
  const t = ctx.currentTime + .02;
  g.gain.setValueAtTime(.0001, t);
  g.gain.linearRampToValueAtTime(.09, t + .26);
  g.gain.exponentialRampToValueAtTime(.0001, t + 1.05);
  src.connect(filter); filter.connect(g); g.connect(out);
  src.start(t); src.stop(t + 1.1);
}
function synthBell(level = 1) {
  initAudio();
  if (!AC) return;
  const out = audioOut(level);
  [1568, 2093, 2637].forEach((f, i) => {
    tone(out, f, .02 + i * .16, 2.4, .045 / (1 + i * .4), 'sine');
    tone(out, f * 1.5, .02 + i * .16, .9, .008, 'sine');
  });
}
function playSoftChime(scale = .6) {
  synthChime(clamp(scale * S.chimeVolume, 0, 1), true);
}
function playIdleSound(id, level = 1) {
  if (!id || id === 'none') return;
  if (id === 'meow') return synthMeow(level);
  if (id === 'drop') return synthDrop(level);
  if (id === 'breath') return synthBreath(level);
  if (id === 'bell') return synthBell(level);
  return synthChime(level);
}
function waveEl(kind) { return kind === 'start' ? $('#startWave') : $('#endWave'); }
function flashWave(kind) {
  const el = waveEl(kind);
  if (!el) return;
  clearTimeout(el._waveTimer);
  /* Eskiden animasyonu yeniden başlatmak için void offsetWidth ile zorunlu
     senkron yerleştirme yapılıyordu. Bu, kedi/kart stilleri tam değişmişken
     tüm düzeni baştan hesaplatıp kasmayı büyütüyordu. Sınıf zaten yoksa
     doğrudan eklenir; varsa bir sonraki karede tazelenir. */
  if (el.classList.contains('playing')) {
    el.classList.remove('playing');
    requestAnimationFrame(() => { if (el.isConnected) el.classList.add('playing'); });
  } else {
    el.classList.add('playing');
  }
  el._waveTimer = setTimeout(() => el.classList.remove('playing'), 2300);
}
function playCue(kind) {
  const id = kind === 'start' ? S.startSound : S.endSound;
  initAudio();
  if (!AC || id === 'none') return;
  if (id === 'custom' && customSounds[kind]) return playCustomSound(kind);
  if (id === 'custom') return synthChime();
  playIdleSound(id);
  flashWave(kind);
}
function playHourly() {
  if (!S.hourlyChime) return;
  initAudio();
  synthBell(clamp(S.chimeVolume, 0, 1));
}
function playCustomSound(kind) {
  const entry = customSounds[kind];
  const ctx = audioCtx();
  if (!entry || !ctx) return;
  const startBuffer = (buffer) => {
    if (!buffer || customSounds[kind] !== entry) return;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const g = ctx.createGain();
    g.gain.value = 1;
    src.connect(g); g.connect(masterGain);
    src.start(); /* aynı görevde başlar; çözülmüş ses bekletilmez */
    const el = waveEl(kind);
    if (el) {
      el.classList.add('playing');
      clearTimeout(el._waveTimer);
      /* Üst üste çalmalarda ilk biten ses dalgayı erken kapatmasın:
         her çalma kendi sürüm numarasını taşır, yalnızca son çalma kapatır.
         onended hiç gelmezse (askıya alınmış bağlam) yedek zamanlayıcı kapatır. */
      const token = (el._waveToken = (el._waveToken || 0) + 1);
      const stopWave = () => { if (el._waveToken === token) el.classList.remove('playing'); };
      src.onended = () => { clearTimeout(el._waveTimer); stopWave(); };
      el._waveTimer = setTimeout(stopWave, (buffer.duration + .25) * 1000);
    }
  };
  if (entry.buffer) { startBuffer(entry.buffer); return; }
  decodeSoundEntry(entry).then(startBuffer).catch(() => {});
}
function decodeSoundEntry(entry) {
  if (!entry) return Promise.resolve(null);
  if (entry.buffer) return Promise.resolve(entry.buffer);
  const ctx = audioCtx();
  if (!ctx || !entry.data) return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const decoding = ctx.decodeAudioData(entry.data.slice(0), (buf) => { entry.buffer = buf; resolve(buf); }, () => resolve(null));
      if (decoding) decoding.catch(() => resolve(null));
    } catch (e) { resolve(null); }
  });
}
function buildWaveBars() {
  ['startWave', 'endWave'].forEach((id) => {
    const el = document.getElementById(id);
    if (!el || el.childElementCount) return;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < 30; i++) {
      const bar = document.createElement('i');
      bar.style.setProperty('--h', String(randInt(16, 92)));
      bar.style.setProperty('--i', String(i));
      frag.appendChild(bar);
    }
    el.appendChild(frag);
  });
}
/* ---------- özel ses: dosya, IndexedDB, temizlik ---------- */
const soundEpoch = { start: 0, end: 0 };
const soundWrites = { start: Promise.resolve(), end: Promise.resolve() };
function dbOpen() {
  return new Promise((resolve) => {
    if (!('indexedDB' in window)) return resolve(null);
    let req;
    try { req = indexedDB.open('vespir-sounds', 1); } catch (e) { return resolve(null); }
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('sounds')) db.createObjectStore('sounds');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}
async function dbGet(key) {
  const db = await dbOpen();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction('sounds', 'readonly');
      const req = tx.objectStore('sounds').get(key);
      req.onsuccess = () => { db.close(); resolve(req.result || null); };
      req.onerror = tx.onabort = () => { db.close(); resolve(null); };
    } catch (e) { db.close(); resolve(null); }
  });
}
async function dbPut(key, value) {
  const db = await dbOpen();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction('sounds', 'readwrite');
      tx.objectStore('sounds').put(value, key);
      tx.oncomplete = () => { db.close(); resolve(true); };
      tx.onerror = tx.onabort = () => { db.close(); resolve(false); };
    } catch (e) { db.close(); resolve(false); }
  });
}
async function dbDelete(key) {
  const db = await dbOpen();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction('sounds', 'readwrite');
      tx.objectStore('sounds').delete(key);
      tx.oncomplete = () => { db.close(); resolve(true); };
      tx.onerror = tx.onabort = () => { db.close(); resolve(false); };
    } catch (e) { db.close(); resolve(false); }
  });
}
/* WAV/AIFF gibi sıkıştırılmamış biçimler gzip ile küçültülür; mp3/ogg
   zaten sıkıştırılmış olduğu için olduğu gibi, boyut sınırıyla saklanır. */
async function packSoundData(data, type) {
  const raw = /wav|aiff|aif/i.test(type || '');
  if (!raw || typeof CompressionStream !== 'function') return { data };
  try {
    const packed = await new Response(new Blob([data]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer();
    if (packed.byteLength < data.byteLength * .9) return { data: packed, gz: true };
  } catch (e) {}
  return { data };
}
async function unpackSoundData(rec) {
  if (!rec || !rec.data) return null;
  if (!rec.gz) return rec.data;
  if (typeof DecompressionStream !== 'function') return null;
  try {
    return await new Response(new Blob([rec.data]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
  } catch (e) { return null; }
}
function isPersistableBytes(bytes) {
  return Number.isFinite(bytes) && bytes > 0 && bytes <= MAX_SOUND_BYTES;
}
async function restorePersistedSounds() {
  if (soundPersistReady) return;
  soundPersistReady = true;
  for (const kind of ['start', 'end']) {
    if (customSounds[kind]) continue;
    const epoch = soundEpoch[kind];
    const rec = await dbGet(kind);
    if (!rec || epoch !== soundEpoch[kind] || resetting) continue;
    const data = await unpackSoundData(rec);
    if (epoch !== soundEpoch[kind] || resetting) continue;
    if (!isPersistableBytes(data && data.byteLength)) { dbDelete(kind); continue; }
    customSounds[kind] = { name: rec.name || 'Ses dosyası', type: rec.type || 'audio/mpeg', data, buffer: null };
  }
  updateSoundsUI();
  /* Çözme işini boş zamana bırak; ilk çalışta hazır buffer bulunur. */
  const warm = () => {
    ['start', 'end'].forEach((kind) => {
      if (customSounds[kind]) decodeSoundEntry(customSounds[kind]).catch(() => {});
    });
  };
  if ('requestIdleCallback' in window) requestIdleCallback(warm, { timeout: 3500 });
  else setTimeout(warm, 900);
}
async function loadCustomFile(kind, file) {
  if (!file) return;
  if (!/^audio\//i.test(file.type || '') && !/\.(mp3|wav|ogg|m4a|aac|flac|webm)$/i.test(file.name || '')) {
    toast('Bu bir ses dosyası gibi görünmüyor.'); return;
  }
  if (file.size > MAX_SOUND_BYTES) {
    toast('Ses dosyası en fazla 2 MB olabilir. Kısaltıp tekrar dene.'); return;
  }
  const epoch = ++soundEpoch[kind];
  initAudio();
  try {
    const data = await file.arrayBuffer();
    if (epoch !== soundEpoch[kind] || resetting) return;
    const entry = { name: file.name || 'Kendi sesim', type: file.type || 'audio/mpeg', data, buffer: null };
    const buffer = await decodeSoundEntry(entry);
    if (epoch !== soundEpoch[kind] || resetting) return;
    if (!buffer) { toast('Bu ses dosyası çalınamadı. Başka bir dosya dene.'); return; }
    if (buffer.duration > MAX_SOUND_SECONDS + .25) {
      toast(`Ses en fazla ${MAX_SOUND_SECONDS} saniye olabilir. Dosyayı kısaltıp tekrar dene.`); return;
    }
    customSounds[kind] = entry;
    S[kind + 'Sound'] = 'custom';
    await persistSound(kind, entry, epoch);
    if (epoch !== soundEpoch[kind] || resetting) return;
    updateSoundsUI();
    saveNow();
    playCustomSound(kind);
    toast(kind === 'start' ? 'Başlangıç sesin hazır.' : 'Bitiş sesin hazır.');
  } catch (e) {
    if (epoch !== soundEpoch[kind] || resetting) return;
    toast('Ses yüklenemedi. Tarayıcı bu biçimi desteklemiyor olabilir.');
  }
}
/* Yazmadan önce boş alanı ölç: kota taşması uygulamayı kilitlemesin. */
async function hasStorageRoom(bytes) {
  if (!navigator.storage || !navigator.storage.estimate) return true;
  try {
    const est = await navigator.storage.estimate();
    const free = (est.quota || 0) - (est.usage || 0);
    return free > bytes * 2 + 1024 * 1024;
  } catch (e) { return true; }
}
async function persistSound(kind, entry, epoch = soundEpoch[kind]) {
  const room = await hasStorageRoom(entry.data.byteLength);
  if (epoch !== soundEpoch[kind] || resetting) return false;
  if (!room) {
    toast('Cihazda yeterli boş alan yok; ses bu oturumda çalınacak, diske yazılmadı.');
    return false;
  }
  const packed = await packSoundData(entry.data, entry.type);
  if (epoch !== soundEpoch[kind] || resetting) return false;
  const write = soundWrites[kind].then(() => {
    if (epoch !== soundEpoch[kind] || resetting) return false;
    return dbPut(kind, { name: entry.name, type: entry.type, data: packed.data, gz: !!packed.gz });
  });
  soundWrites[kind] = write;
  const ok = await write;
  if (epoch !== soundEpoch[kind] || resetting) return false;
  if (!ok) toast('Ses diske yazılamadı. Bu oturumda çalınacak.');
  return ok;
}
async function clearCustomSound(kind) {
  const epoch = ++soundEpoch[kind];
  customSounds[kind] = null;
  const deletion = soundWrites[kind].then(() => dbDelete(kind));
  soundWrites[kind] = deletion;
  if (S[kind + 'Sound'] === 'custom') S[kind + 'Sound'] = kind === 'start' ? 'chime' : 'meow';
  updateSoundsUI();
  saveNow();
  const ok = await deletion;
  if (epoch !== soundEpoch[kind] || resetting) return;
  toast(ok ? 'Özel ses ve cihazdaki kopyası silindi.' : 'Özel ses kaldırıldı; cihazdaki kopyası temizlenemedi.');
}
function updateSoundsUI() {
  [
    ['start', 'startFileName', 'startClearBtn', 'startSoundOptions'],
    ['end', 'endFileName', 'endClearBtn', 'endSoundOptions']
  ].forEach(([kind, nameId, clearId, optionsId]) => {
    const entry = customSounds[kind];
    const nameEl = document.getElementById(nameId);
    const clearEl = document.getElementById(clearId);
    if (nameEl) {
      nameEl.textContent = entry ? entry.name : t('Kendi sesin · seçilmedi');
      nameEl.classList.toggle('has-file', !!entry);
    }
    if (clearEl) clearEl.hidden = !entry;
    const box = document.getElementById(optionsId);
    if (box) {
      $$('.sound-option', box).forEach((btn) => {
        const isCustom = btn.dataset.sound === 'custom';
        btn.classList.toggle('active', S[kind + 'Sound'] === btn.dataset.sound);
        btn.classList.toggle('locked', isCustom && !entry);
      });
    }
  });
}
/* ============================================================
   ZAMANLAYICI — focus / kısa mola, uzun mola yok
   ============================================================ */
const RING_LEN = 2 * Math.PI * 132;
const timer = {
  phase: 'focus',
  running: false,
  total: S.focusMin * 60,
  remaining: S.focusMin * 60,
  endAt: 0,
  nextChime: 3600,
  interval: 0,
  shown: -1,
  lastMinText: '',
  lastSecText: ''
};
/* Kesin bitiş bekçisi. setInterval arka planda kısılsa bile endAt ile
   Date.now() farkı gerçeği söyler; bu zamanlayıcı fazı vaktinde kapatır. */
let finishTimer = 0;
let autoStartTimer = 0;
function stopAutoStart() {
  clearTimeout(autoStartTimer);
  autoStartTimer = 0;
}
function scheduleAutoStart(phase, delay, setting = null) {
  stopAutoStart();
  autoStartTimer = setTimeout(() => {
    autoStartTimer = 0;
    if (!resetting && !rewardActive && !timer.running && timer.phase === phase && (!setting || S[setting])) startTimer();
  }, delay);
}
function stopFinishTimer() {
  if (finishTimer) clearTimeout(finishTimer);
  finishTimer = 0;
}
function armFinish() {
  stopFinishTimer();
  if (!timer.running || !timer.endAt) return;
  finishTimer = setTimeout(() => {
    finishTimer = 0;
    if (!timer.running) return;
    timerTick();
    if (timer.running) armFinish();
  }, Math.max(0, timer.endAt - Date.now()) + 40);
}
function phaseWord() {
  if (timer.phase === 'focus') return t(timer.running ? 'odak zamanı' : 'odak hazır');
  return t(timer.running ? 'nefes zamanı' : 'mola hazır');
}
function startIconSVG(running) {
  return running
    ? '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6.5" y="5" width="3.6" height="14" rx="1.4"/><rect x="13.9" y="5" width="3.6" height="14" rx="1.4"/></svg>'
    : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.2c0-.9 1-1.4 1.7-.9l9.2 6.1c.7.5.7 1.5 0 2l-9.2 6.1c-.7.5-1.7 0-1.7-.9Z"/></svg>';
}
/* ---------- yumuşak geçiş (FLIP): yerleşim bir kez değişir, kayma yalnızca transform ile ---------- */
const sceneAnimations = [];
let sceneMotionTimer = 0;
function flipBegin() {
  if (perfModeOn()) return null;
  /* Yalnızca kedi FLIP ile taşınır. Kart da ölçeklenirse halkanın içindeki
     rakamlar dikeyde gerilip aşağı kaymış gibi görünüyordu. */
  const before = [$('#catMount')].map((el) => ({ el, rect: el.getBoundingClientRect() }));
  while (sceneAnimations.length) sceneAnimations.pop().cancel();
  return before;
}
function flipEnd(before) {
  if (!before) return;
  const catFlip = $('#catFlip');
  if (!catFlip) return;
  const positions = before.map((item) => ({ ...item, next: item.el.getBoundingClientRect(), width: item.el.offsetWidth }));
  const catOrigin = catFlip.getBoundingClientRect();
  for (const { el, rect, next, width } of positions) {
    const cat = el.id === 'catMount';
    const target = cat ? catFlip : el;
    /* Ölçüsü sıfır olan öğede oranlar NaN/Infinity üretir; animasyon atlanır. */
    if (!target || typeof target.animate !== 'function' || !width || !next.width || !next.height || !rect.width || !rect.height) continue;
    const parentScale = cat ? 1 : next.width / width;
    const dx = (rect.left - next.left) / parentScale;
    const dy = (rect.top - next.top) / parentScale;
    const sx = rect.width / next.width;
    const sy = rect.height / next.height;
    const origin = cat ? `${next.left - catOrigin.left}px ${next.top - catOrigin.top}px` : '0 0';
    const animation = target.animate([
      { transformOrigin: origin, transform: `translate3d(${dx}px, ${dy}px, 0) scale(${sx}, ${sy})` },
      { transformOrigin: origin, transform: 'translate3d(0, 0, 0) scale(1)' }
    ], { duration: 750, easing: 'cubic-bezier(.22, .8, .25, 1)' });
    sceneAnimations.push(animation);
  }
}
function syncTimerChrome(before = null, scrollY = null) {
  const app = $('main.app');
  const stage = $('#catStage');
  const timerCard = $('#timerCard');
  const nextPhase = timer.running ? timer.phase : 'idle';
  /* Faz ve çalışma durumu yalnızca etkilenen üç kabuğa yazılır.
     Eskiden <body> üzerindeydi; her başlat/duraklat tüm sayfanın
     stilini yeniden çözdürüyordu. Artık kapsam dar: sayaç kartı ve kedi. */
  const phaseChanged = ((stage && stage.dataset.phase) || 'idle') !== nextPhase;
  const flip = phaseChanged ? (before || flipBegin()) : null;
  if (flip) {
    clearTimeout(sceneMotionTimer);
    timerCard.classList.add('is-scene-moving');
    stage.classList.add('is-scene-moving');
  }
  if (app) app.dataset.phase = nextPhase;
  if (stage) stage.dataset.phase = nextPhase;
  if (timerCard) {
    timerCard.dataset.phase = timer.phase;
    timerCard.dataset.running = timer.running ? 'true' : 'false';
  }
  const phaseText = $('#phaseText');
  if (phaseText) phaseText.textContent = t(timer.phase === 'focus' ? 'Odak' : 'Mola');
  const pill = $('#phasePill');
  if (pill) pill.dataset.phase = timer.phase;
  const word = $('#phaseWord');
  if (word) word.textContent = phaseWord();
  const btn = $('#startBtn');
  const label = $('#startLabel');
  const icon = $('#startIcon');
  if (btn) {
    btn.classList.toggle('running', timer.running);
    /* Ödül sahnesi boyunca düğme gerçekten pasif; metin de bunu söyler. */
    btn.disabled = rewardActive;
    if (rewardActive) btn.setAttribute('aria-busy', 'true');
    else btn.removeAttribute('aria-busy');
  }
  if (label) {
    const rewardVerb = rewardMode() === 'cocoa' ? t('içiyor…') : rewardMode() === 'cauldron' ? t('ikram topluyor…') : t('yiyor…');
    label.textContent = rewardActive ? S.cat.name + ' ' + rewardVerb
      : timer.running ? t('Duraklat')
      : (timer.id || timer.remaining < timer.total - .5) ? t('Devam et')
      : timer.phase === 'break' ? t('Molaya başla') : t('Başla');
  }
  if (icon) icon.innerHTML = startIconSVG(timer.running);
  const skip = $('#skipBtn');
  if (skip) skip.disabled = timer.phase !== 'break' || rewardActive;
  updatePerch();
  syncFocusScene(scrollY);
  if (flip) {
    cancelAnimationFrame(stageFitRaf);
    stageFitRaf = 0;
    fitStage();
    flipEnd(flip);
    sceneMotionTimer = setTimeout(() => {
      timerCard.classList.remove('is-scene-moving');
      stage.classList.remove('is-scene-moving');
      invalidateSnowSurface();
    }, 800);
  }
}
function popDigit(el) {
  if (perfModeOn()) return;
  if (!el) return;
  /* Sekme arkada/ekran kapalıyken boş yere animasyon kuyruğu üretmeyelim. */
  if (document.hidden) return;
  /* Saniye her değiştiğinde tam sayfa yerleşimi hesaplanmasın:
     aynı pop animasyonu Web Animations ile yeniden başlatılır.
     Yalnızca transform (translate3d) kullanılır: metin yeniden çizilmez. */
  if (typeof el.animate === 'function') {
    if (el._tickAnim) { try { el._tickAnim.cancel(); } catch (e) {} }
    el._tickAnim = el.animate([
      { transform: 'translate3d(0, 0, 0) scale(1)' },
      { transform: 'translate3d(0, -3px, 0) scale(1.04)', offset: .38 },
      { transform: 'translate3d(0, 0, 0) scale(1)' }
    ], { duration: 380, easing: 'cubic-bezier(.18, 1.3, .42, 1)' });
  } else {
    el.classList.remove('tick');
    requestAnimationFrame(() => el.classList.add('tick'));
  }
}
/* Dairenin içindeki kısa satır: odakta molanın ne zaman geleceğini,
   molada ise sıradaki odağın ne kadar süreceğini söyler. */
function ringSubText() {
  const finish = () => {
    const d = new Date(Date.now() + Math.max(0, timer.remaining) * 1000);
    return pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  };
  const focusMin = Math.max(1, Math.round(timer.phase === 'focus' ? timer.total / 60 : S.focusMin));
  const breakMin = Math.max(1, Math.round(timer.phase === 'break' ? timer.total / 60 : S.breakMin));
  const paused = !timer.running && timer.remaining < timer.total - .5;
  if (S.lang === 'en') {
    if (timer.phase === 'focus') {
      if (timer.running) return 'Break ' + breakMin + ' min · ends ' + finish();
      if (paused) return 'Break ' + breakMin + ' min · paused';
      return focusMin + ' min focus · break ' + breakMin + ' min';
    }
    if (timer.running) return 'Focus ' + focusMin + ' min · ends ' + finish();
    if (paused) return 'Focus ' + focusMin + ' min · paused';
    return breakMin + ' min break · next ' + focusMin + ' min';
  }
  if (timer.phase === 'focus') {
    if (timer.running) return 'Mola ' + breakMin + ' dk · bitiş ' + finish();
    if (paused) return 'Mola ' + breakMin + ' dk · duraklatıldı';
    return focusMin + ' dk odak · mola ' + breakMin + ' dk';
  }
  if (timer.running) return 'Odak ' + focusMin + ' dk · bitiş ' + finish();
  if (paused) return 'Odak ' + focusMin + ' dk · duraklatıldı';
  return breakMin + ' dk mola · sırada ' + focusMin + ' dk';
}
function updateTimerDisplay(force = false, digits = null) {
  const display = Math.max(0, Math.ceil(timer.remaining - .0001));
  if (!force && display === timer.shown) return;
  const h = Math.floor(display / 3600);
  const m = Math.floor((display % 3600) / 60);
  const s = display % 60;
  const minText = h ? h + ':' + pad2(m) : pad2(m);
  const secText = pad2(s);
  const minEl = cachedEl('#timeMin');
  const secEl = cachedEl('#timeSec');
  const timeEl = cachedEl('#timeDisplay');
  if (timeEl) timeEl.classList.toggle('long', timer.total >= 3600);
  if (force || !minEl || minEl.textContent !== minText) {
    if (minEl) {
      minEl.textContent = minText;
      if (timer.running) {
        if (digits) digits.push(minEl); else popDigit(minEl);
      }
    }
  }
  const secChanged = force || !secEl || secEl.textContent !== secText;
  if (secChanged) {
    if (secEl) {
      secEl.textContent = secText;
      if (timer.running) {
        if (digits) digits.push(secEl); else popDigit(secEl);
      }
    }
    const ratio = clamp(timer.remaining / Math.max(1, timer.total), 0, 1);
    const ring = cachedEl('#ringProgress');
    if (ring) {
      if (!ring.style.strokeDasharray) ring.style.strokeDasharray = RING_LEN.toFixed(2);
      const prevRatio = Number.isFinite(timer.lastRingRatio) ? timer.lastRingRatio : ratio;
      ring.classList.toggle('is-shifting', Math.abs(ratio - prevRatio) > .02);
      ring.style.strokeDashoffset = (RING_LEN * (1 - ratio)).toFixed(2);
      timer.lastRingRatio = ratio;
    }
    const orb = cachedEl('#ringOrbWrap');
    if (orb) orb.style.setProperty('--angle', (ratio * 360).toFixed(2) + 'deg');
    const sub = cachedEl('#ringSub');
    if (sub) {
      const text = ringSubText();
      if (sub.textContent !== text) sub.textContent = text;
    }
  }
  const perchTime = cachedEl('#perchTime');
  if (perchTime) {
    const perchText = fmtClock(timer.remaining);
    if (perchTime.textContent !== perchText) perchTime.textContent = perchText;
  }
  timer.shown = display;
  timer.lastMinText = minText;
  timer.lastSecText = secText;
  updateDocumentTitle();
}
const BASE_TITLE = 'Vespır - En İyi Dostun';
const LONELY_TITLE = 'Seni özledim, lütfen buraya geri dön 🥺';
let lonelyTitleOn = false;
function updateDocumentTitle() {
  const title = S.lang === 'en'
    ? (lonelyTitleOn ? 'I miss you, please come back 🥺' : 'Vespır - Your Best Friend')
    : (lonelyTitleOn ? LONELY_TITLE : BASE_TITLE);
  if (document.title !== title) document.title = title;
}
function updateSessionUI() {
  const input = $('#sessionNameInput');
  if (input && document.activeElement !== input) input.value = S.sessionName;
  const qf = $('#quickFocus');
  if (qf) qf.textContent = String(S.focusMin);
  const qb = $('#quickBreak');
  if (qb) qb.textContent = String(S.breakMin);
  updateGoalUI();
  updateTimerDisplay(true);
}
function updateGoalUI() {
  if (rollStatsDay()) saveNow();
  const en = S.lang === 'en';
  const min = Math.floor(Math.max(0, S.stats.sec) / 60);
  const goal = Math.max(15, S.dailyGoal || 120);
  const pct = clamp(Math.round(min / goal * 100), 0, 100);
  const now = $('#goalNow');
  if (now) now.innerHTML = min + '<small>/' + goal + (en ? ' min</small>' : ' dk</small>');
  const pctEl = $('#goalPct');
  if (pctEl) pctEl.innerHTML = '%' + pct + '<br>' + (en ? 'complete' : 'tamamlandı');
  const fill = $('#goalFill');
  if (fill) fill.style.transform = 'scaleX(' + (pct / 100).toFixed(3) + ')';
  const left = $('#goalLeft');
  if (left) left.textContent = min >= goal ? t('Hedef tamam!') : fmtDuration(goal - min) + (en ? ' left' : ' kaldı');
  const sessions = $('#goalSessions');
  if (sessions) sessions.textContent = S.stats.sessions + (en ? ' sessions' : ' seans');
  const target = $('#goalTarget');
  if (target) target.textContent = (en ? 'Goal: ' : 'Hedef: ') + fmtDuration(goal);
}
function persistTimer(intentional = false) {
  if (!intentional) {
    const remote = loadSettings();
    if (!sameState(remote.timer, savedBaseline.timer)) { syncStoredState(); return; }
  }
  S.timer = {
    id: timer.id || null,
    phase: timer.phase,
    total: timer.total,
    remaining: timer.running ? Math.max(0, (timer.endAt - Date.now()) / 1000) : timer.remaining,
    endAt: timer.running ? timer.endAt : 0,
    running: timer.running,
    at: Date.now()
  };
  saveNow();
}
function startTimer() {
  /* Ödül sahnesi bitmeden yeni seans başlamaz. */
  if (rewardActive || resetting || timer.running) return;
  stopAutoStart();
  const scrollY = window.scrollY;
  const before = $('#catStage').dataset.phase !== timer.phase ? flipBegin() : null;
  const fromInvite = $('#focusInvite').classList.contains('open');
  if (fromInvite) closeFocusInvite(false);
  initAudio();
  if (!stillAway()) endLoneliness();
  if (timer.remaining <= .5) timer.remaining = Math.max(1, timer.total);
  if (timer.remaining <= 0) return;
  cancelAnimationFrame(timer.interval);
  timer.running = true;
  if (!timer.id) timer.id = (crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(36).slice(2));
  timer.endAt = Date.now() + timer.remaining * 1000;
  timer.shown = -1;
  timer.nextChime = (Math.floor((timer.total - timer.remaining) / 3600) + 1) * 3600;
  timer.interval = requestAnimationFrame(rafTimerTick);
  rafTimerRunning = true;
  armFinish();
  if (timer.phase === 'focus') beginFocusCat(); else beginBreakCat();
  const digits = [];
  updateTimerDisplay(true, digits);
  syncTimerChrome(before, scrollY);
  digits.forEach(popDigit);
  if (fromInvite) $('#startBtn').focus({ preventScroll: true });
  playCue('start');
  if (S.notify) {
    ensureNotifyPermission().then((ok) => {
      if (!ok && S.notify) { S.notify = false; syncSettingsUI(); save(); }
    });
  }
  persistTimer(true);
}
function pauseTimer() {
  stopAutoStart();
  if (!timer.running) return;
  stopFocusCatch();
  endLoneliness();
  timer.remaining = Math.max(0, (timer.endAt - Date.now()) / 1000);
    if (timer.remaining <= .01) {
      timer.remaining = 0;
      finishPhase();
      /* Faz yine de kapanmazsa düğme "Duraklat" olarak ölü kalmasın. */
      setTimeout(() => {
        if (timer.running && timer.remaining <= .01) {
          settleZeroTimer();
          syncTimerChrome();
          updateTimerDisplay(true);
        }
      }, 1400);
      return;
    }
  timer.running = false;
  timer.endAt = 0;
  cancelAnimationFrame(timer.interval);
  timer.interval = 0;
  stopFinishTimer();
  syncTimerChrome();
  updateTimerDisplay(true);
  catReset();
  clearBubbleTimers();
  setCatState('idle');
  scheduleIdleCat();
  showBubble(pick(['mola mı? patiler hazır.', 'mrrp… devam edince uyurum.', 'kısa bir nefes. iyi geldi.']), { duration: 2600 });
  persistTimer(true);
}
function toggleTimer() {
  stopAutoStart();
  if (timer.running) pauseTimer();
  /* "Başla" her tarayıcıda doğrudan sayacı başlatır. Kurulum daveti odaklanmayı
     engellemez; isteyen Ayarlar > Ana ekrana ekle bölümünden kurar. */
  else startTimer();
}
function resetTimer() {
  stopAutoStart();
  stopFocusCatch();
  if (rewardActive) stopFocusReward();
  endLoneliness();
  cancelAnimationFrame(timer.interval);
  timer.interval = 0;
  stopFinishTimer();
  timer.running = false;
  timer.phase = 'focus';
  timer.id = null;
  timer.total = Math.max(60, Math.round(S.focusMin * 60));
  timer.remaining = timer.total;
  timer.endAt = 0;
  timer.nextChime = 3600;
  timer.shown = -1;
  catReset();
  clearBubbleTimers();
  hideBubble();
  setCatState('idle');
  scheduleIdleCat();
  syncTimerChrome();
  updateTimerDisplay(true);
  persistTimer(true);
  showBubble(pick(['temiz bir sayfa. miyav!', 'hazırım. yeniden başlayalım.', 'prr… patiler taze.']), { duration: 2300 });
}
function skipBreak() {
  if (timer.phase !== 'break' || rewardActive) return;
  stopAutoStart();
  cancelAnimationFrame(timer.interval);
  timer.interval = 0;
  stopFinishTimer();
  timer.running = false;
  timer.phase = 'focus';
  timer.id = null;
  timer.total = Math.max(60, Math.round(S.focusMin * 60));
  timer.remaining = timer.total;
  timer.endAt = 0;
  timer.nextChime = 3600;
  timer.shown = -1;
  catReset();
  clearBubbleTimers();
  hideBubble();
  setCatState('idle');
  scheduleIdleCat();
  syncTimerChrome();
  updateTimerDisplay(true);
  persistTimer(true);
  toast('Mola atlandı. Yeni odak hazır.');
  showBubble(pick(['miyav! yeni odak?', 'mola bitti sayılır. hazırım.', 'prr… yeniden çalışalım.']), { duration: 2400 });
}
function setPhase(phase, autoStart = false) {
  stopAutoStart();
  cancelAnimationFrame(timer.interval);
  timer.interval = 0;
  stopFinishTimer();
  timer.phase = phase === 'break' ? 'break' : 'focus';
  timer.id = null;
  timer.total = Math.max(60, Math.round((timer.phase === 'focus' ? S.focusMin : S.breakMin) * 60));
  timer.remaining = timer.total;
  timer.running = false;
  timer.endAt = 0;
  timer.nextChime = 3600;
  timer.shown = -1;
  catReset();
  clearBubbleTimers();
  hideBubble();
  setCatState('idle');
  scheduleIdleCat();
  syncTimerChrome();
  updateTimerDisplay(true);
  persistTimer(true);
  if (autoStart) scheduleAutoStart(timer.phase, 320);
}
let phaseFinishing = false;
/* Sayaç 00:00'da "Duraklat" olarak asılı kalırsa düğme ölü kalmasın:
   fazı ilerletemediysek en azından temiz bir "Devam et" durumuna dön. */
function settleZeroTimer() {
  if (!timer.running || timer.remaining > .01) return;
  cancelAnimationFrame(timer.interval);
  timer.interval = 0;
  stopFinishTimer();
  timer.running = false;
  timer.endAt = 0;
  timer.remaining = 0;
  catReset();
  clearBubbleTimers();
  setCatState('idle');
  scheduleIdleCat();
  syncTimerChrome();
  updateTimerDisplay(true);
  persistTimer(true);
}
function finishPhase() {
  if (phaseFinishing || !timer.running || resetting) return;
  phaseFinishing = true;
  let done = false;
  const expectedId = timer.id || timer.phase + ':' + timer.endAt + ':' + timer.total;
  const expectedEndAt = timer.endAt;
  const complete = () => {
    if (done) return;
    const currentId = timer.id || timer.phase + ':' + timer.endAt + ':' + timer.total;
    if (resetting || !timer.running || currentId !== expectedId || timer.endAt !== expectedEndAt) return;
    done = true;
    const remote = loadSettings();
    if (remote.completedSessions.includes(expectedId)
        || (remote.timer && S.timer && !sameState(remote.timer, S.timer))) {
      syncStoredState();
      /* Başka pencere fazı kapatmış olsa da bu pencere 00:00'da asılı kalmasın. */
      settleZeroTimer();
      return;
    }
    S = mergeStoredState(S, savedBaseline, remote);
    savedBaseline = copyState(remote);
    S.completedSessions = Array.from(new Set([...(S.completedSessions || []), expectedId])).slice(-64);
    finishPhaseNow();
  };
  if (navigator.locks && typeof navigator.locks.request === 'function') {
    /* Kilit başka bir pencerede takılı kalırsa (donmuş sekme) faz hiç kapanmıyordu.
       Kısa bir beklemeden sonra kilidi beklemeden tamamlıyoruz; complete() yalnızca
       bir kez çalışır, geç gelen kilit boşa döner. */
    const fallback = setTimeout(() => { phaseFinishing = false; complete(); }, 1200);
    navigator.locks.request('vespir-phase-completion', complete)
      .catch(() => {})
      .finally(() => { clearTimeout(fallback); phaseFinishing = false; });
  } else {
    try { complete(); } finally { phaseFinishing = false; }
  }
}
function finishPhaseNow() {
  const completedAt = timer.endAt || Date.now();
  stopFocusCatch();
  /* Oturum arka planda bittiyse "geri dön" başlığı kilitli kalmasın;
     yalnızlık anısı dönüş mesajı için korunur. */
  if (lonelyActive) {
    lonelyActive = false;
    setLonelyTitle(false);
  }
  cancelAnimationFrame(timer.interval);
  timer.interval = 0;
  stopFinishTimer();
  timer.running = false;
  timer.endAt = 0;
  timer.remaining = 0;
  const doneMin = Math.max(1, Math.round(timer.total / 60));
  if (timer.phase === 'focus') {
    rollStatsDay();
    if (todayKey(completedAt) === todayKey()) {
      S.stats.sec += timer.total;
      S.stats.sessions += 1;
    }
    bumpStreak(completedAt);
    updateStatsUI();
    playCue('end');
    buzz([90, 60, 140]);
    const notice = completionNotice('focus', doneMin);
    notifyUser(notice.title, notice.body);
    const celebrateNow = () => showCelebrate('odak tamam',
      pick(S.lang === 'en' ? ['You’re amazing!', 'Magnificent focus!', 'Paws in the air!'] : ['Harikasın!', 'Muhteşem odak!', 'Patiler havada!']),
      S.lang === 'en'
        ? `${fmtDuration(doneMin)} of focus done. ${S.cat.name} is proud of you.`
        : `${fmtDuration(doneMin)} odak bitti. ${S.cat.name} seninle gurur duyuyor.`);
    setPhase('break', false);
    /* Ödül sahnesi beş saniye sürer; tebrik ve otomatik mola ondan sonra
       gelir ki ikisi kedinin üstünde üst üste binmesin. */
    const rewardStarted = playFocusReward(() => {
      celebrateNow();
      if (S.autoStart) scheduleAutoStart('break', 320, 'autoStart');
    });
    if (!rewardStarted) {
      celebrateNow();
      showBubble(pick(['miyav! harikaydın.', 'prr… gurur duyuyorum.', 'mola! patilerim uyuştu.']), { duration: 3000 });
      if (S.autoStart) scheduleAutoStart('break', 2200, 'autoStart');
    }
  } else {
    playCue('end');
    buzz([60, 50, 60]);
    const notice = completionNotice('break', doneMin);
    notifyUser(notice.title, notice.body);
    showCelebrate('mola tamam',
      pick(S.lang === 'en' ? ['You breathed!', 'Ready for a new round.'] : ['Nefes aldın!', 'Yeni tura hazırız.']),
      S.lang === 'en'
        ? `${doneMin}-minute break is over. A new focus is waiting for you.`
        : `${doneMin} dakikalık mola bitti. Yeni odak seni bekliyor.`);
    setPhase('focus', false);
    setCatState('idle');
    showBubble(pick(['miyav! yeni odağa hazırım.', 'prr… taze patiler.', 'hazırım. başlayalım mı?']), { duration: 3000 });
    if (S.autoFocus) scheduleAutoStart('focus', 2400, 'autoFocus');
  }
  syncTimerChrome();
  updateTimerDisplay(true);
  saveNow();
}
function timerTick() {
  if (!timer.running) return;
  timer.remaining = Math.max(0, (timer.endAt - Date.now()) / 1000);
  if (timer.phase === 'focus' && S.hourlyChime && timer.total >= 3600) {
    const elapsed = timer.total - timer.remaining;
    let guard = 0;
    while (elapsed + .3 >= timer.nextChime && timer.nextChime < timer.total && guard < 6) {
      playHourly();
      timer.nextChime += 3600;
      guard++;
    }
  }
  updateTimerDisplay();
  if (timer.remaining <= .01) finishPhase();
}

/* requestAnimationFrame-based timer tick: smoother than setInterval(200),
   pauses automatically when tab is hidden, resumes on visibility change. */
let rafTimerRunning = false;
function rafTimerTick() {
  if (!timer.running) { rafTimerRunning = false; return; }
  timerTick();
  if (timer.running) timer.interval = requestAnimationFrame(rafTimerTick);
  else rafTimerRunning = false;
}
function restoreTimer() {
  const saved = S.timer;
  if (!saved || typeof saved !== 'object' || !['focus', 'break'].includes(saved.phase)) {
    timer.phase = 'focus';
    timer.total = Math.max(60, Math.round(S.focusMin * 60));
    timer.remaining = timer.total;
    timer.running = false;
    timer.id = null;
    timer.endAt = 0;
    timer.shown = -1;
    return false;
  }
  timer.phase = saved.phase;
  timer.id = typeof saved.id === 'string' ? saved.id : saved.phase + ':' + saved.endAt + ':' + saved.total;
  timer.total = clamp(Number(saved.total) || (saved.phase === 'focus' ? S.focusMin * 60 : S.breakMin * 60), 60, 14400);
  const endAt = Number(saved.endAt);
  const validRunning = saved.running === true && Number.isFinite(endAt) && endAt > 0;
  const live = validRunning ? (endAt - Date.now()) / 1000 : Number(saved.remaining);
  timer.remaining = clamp(Number.isFinite(live) ? live : timer.total, 0, timer.total);
  timer.shown = -1;
  if (validRunning) {
    timer.running = true;
    timer.endAt = Math.min(endAt, Date.now() + timer.total * 1000);
    timer.nextChime = (Math.floor((timer.total - timer.remaining) / 3600) + 1) * 3600;
    timer.interval = requestAnimationFrame(rafTimerTick);
    rafTimerRunning = true;
    armFinish();
    return true;
  }
  timer.running = false;
  timer.endAt = 0;
  if (timer.remaining <= .01) timer.remaining = timer.total;
  return false;
}
const APP_VERSION = 'v28';
function updateStatsUI() {
  if (rollStatsDay()) saveNow();
  const min = Math.floor(Math.max(0, S.stats.sec) / 60);
  const minEl = $('#statMin');
  const sessionsEl = $('#statSessions');
  const cyclesEl = $('#statCycles');
  if (minEl) minEl.textContent = String(min);
  if (sessionsEl) sessionsEl.textContent = String(S.stats.sessions);
  if (cyclesEl) cyclesEl.textContent = String(Math.floor(S.stats.sessions / 4));
  const versionEl = $('#appVersion');
  if (versionEl) versionEl.textContent = APP_VERSION;
  const todayChip = $('#todayFocusChip');
  if (todayChip) todayChip.textContent = (S.lang === 'en' ? 'Today ' : 'Bugün ') + min + (S.lang === 'en' ? ' min focus' : ' dk odak');
  syncCycleDots();
  updateGoalUI();
}
function renderCycleDots() {
  const box = $('#cycleDots');
  if (!box) return;
  box.innerHTML = '';
  for (let i = 0; i < 4; i++) {
    const dot = document.createElement('span');
    dot.className = 'cycle-dot';
    dot.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.4-4.7-9.3-9A5.6 5.6 0 0 1 12 6.4 5.6 5.6 0 0 1 21.3 12C19.4 16.3 12 21 12 21Z"/></svg>';
    box.appendChild(dot);
  }
  syncCycleDots();
}
function syncCycleDots() {
  const dots = $$('#cycleDots .cycle-dot');
  const rem = S.stats.sessions % 4;
  const filled = rem || (S.stats.sessions > 0 ? 4 : 0);
  dots.forEach((dot, i) => dot.classList.toggle('on', i < filled));
}
/* ============================================================
   PWA — kurulum ve çevrimdışı
   ============================================================ */
let deferredPrompt = null;
let swRegistered = false;
let pwaInstalled = false;
try { localStorage.removeItem('vespir.pwaInstalled'); } catch (e) {}
let focusSceneScrollY = 0;
let focusInviteCleanup = 0;
function hasInstalledPwa() {
  if (isStandalone()) return true;
  /* Kurulum penceresi sunuluyorsa uygulama şu anda kurulmamış demektir. */
  if (deferredPrompt || window.__vespirInstall) return false;
  return pwaInstalled;
}
/* Davet için gerçek bir kurulum yolu gerekir: Chromium’un kurulum penceresi
   ya da iOS’ta Safari’nin “Ana Ekrana Ekle” adımı. Diğer tarayıcılarda davet
   açılmaz; düğme doğrudan sayacı başlatır. */

function rememberPwaInstalled() {
  pwaInstalled = true;
}
function clearPwaInstalled() {
  pwaInstalled = false;
}
function syncFocusScene(scrollY = null) {
  const active = timer.running && timer.phase === 'focus';
  const wasActive = document.body.classList.contains('focus-active');
  if (active === wasActive) return;
  if (active) focusSceneScrollY = scrollY ?? window.scrollY;
  document.body.classList.toggle('focus-active', active);
  $('main.app').classList.toggle('focus-active', active);
  $('#catStage').classList.toggle('focus-active', active);
  $('.focus-veil').classList.toggle('active', active);
  $('.topbar').classList.toggle('focus-hidden', active);
  $('.topbar').inert = active;
  $$('.timer-head, .session-edit, .quick-tune, .stats-strip, #resetBtn, #skipBtn').forEach(el => { el.inert = active; });
  if (active) {
    snow.piles.delete('timer');
    snow.surfaces = [];
  }
  snow.surfaceDirty = true;
  if (!active && focusSceneScrollY) window.scrollTo(0, focusSceneScrollY);
  syncSceneEffects();
}
function syncFocusInviteCopy() {
  const en = S.lang === 'en';
  const name = $('#focusInviteName');
  if (name) name.textContent = S.cat.name;
  /* Davetin bütün metni, açıldığı anda seçili dile göre yazılır. */
  const kind = $('#focusInviteKind');
  if (kind) kind.textContent = en ? 'your focus friend' : 'odak arkadaşın';
  const appTitle = $('#focusInviteTitle');
  if (appTitle) appTitle.textContent = en ? 'Add Vespır as an app?' : 'Vespır’ı uygulama olarak ekleyelim mi?';
  const appDesc = $('#focusInviteDescription');
  if (appDesc) appDesc.textContent = en
    ? 'Add Vespır to your phone’s home screen or your computer’s apps. Then you can open it without searching for the site every time.'
    : 'Vespır’ı telefonunun ana ekranına veya bilgisayarının uygulamalarına ekleyebilirsin. Böylece siteyi her seferinde aramadan açarsın.';
  const appBenefits = $$('#focusStepApp .focus-invite-benefits li');
  const appLines = en
    ? ['Tap the Vespır icon and it opens right away.',
       'Focus without tabs and an address bar.',
       'On supported devices, get a notification when focus ends if you allow it.']
    : ['Vespır simgesine bas, hemen aç.',
       'Sekmeler ve adres çubuğu olmadan odaklan.',
       'Destekleyen cihazlarda, izin verirsen odak bitince bildirim al.'];
  appBenefits.forEach((li, i) => { if (appLines[i]) li.textContent = appLines[i]; });
  const install = $('#focusInstallBtn');
  if (install) install.textContent = en ? 'Okay, let’s do it' : 'Tamam, yapalım';
  const skip = $('#focusSkipInstallBtn');
  if (skip) skip.textContent = en ? 'Not now' : 'Hayır, şimdi değil';
  const status = $('#focusInstallStatus');
  if (status) status.textContent = en
    ? 'Choose “Okay, let’s do it” to see install options. Choose “Not now” to focus without installing.'
    : '“Tamam, yapalım” ile kurulum seçeneklerini gör. “Hayır, şimdi değil” ile kurmadan odaklan.';
}
function prepareFocusInvite() {
  const appStep = $('#focusStepApp');
  const panel = $('#focusInvite .focus-invite-panel');
  if (!appStep || !panel) return;
  appStep.hidden = false;
  syncFocusInviteCopy();
  /* iOS kurulum penceresi sunmaz: “Ana Ekrana Ekle” adımını hemen göster. */
  if (isIOSDevice() && !(deferredPrompt || window.__vespirInstall)) {
    const iosStatus = $('#focusInstallStatus');
    if (iosStatus) iosStatus.textContent = installHint();
  }
  appStep.classList.remove('enter');
  void appStep.offsetWidth;
  appStep.classList.add('enter');
  panel.setAttribute('aria-labelledby', 'focusInviteTitle');
  panel.setAttribute('aria-describedby', 'focusInviteDescription');
  const target = $('#focusInstallBtn');
  if (target) target.focus({ preventScroll: true });
}
function openFocusInvite() {
  if (rewardActive) return;
  const invite = $('#focusInvite');
  if (invite.classList.contains('open')) return;
  clearTimeout(focusInviteCleanup);
  catReset();
  clearBubbleTimers();
  hideBubble();
  $('#focusInviteCat').innerHTML = catMarkup('wave', false);
  updateCatVisuals();
  $('#focusInstallBtn').disabled = false;
  invite.inert = false;
  invite.setAttribute('aria-hidden', 'false');
  document.body.classList.add('install-invite-open');
  syncSceneEffects();
  $('main.app').inert = true;
  $('#catStage').inert = true;
  $('.topbar').inert = true;
  invite.classList.add('open');
  prepareFocusInvite();
}
function closeFocusInvite(restoreFocus = true) {
  const invite = $('#focusInvite');
  invite.classList.remove('open');
  clearTimeout(focusInviteCleanup);
  focusInviteCleanup = setTimeout(() => { $('#focusInviteCat').replaceChildren(); }, 500);
  invite.inert = true;
  invite.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('install-invite-open');
  syncSceneEffects();
  $('main.app').inert = false;
  $('#catStage').inert = false;
  $('.topbar').inert = false;
  if (restoreFocus) $('#startBtn').focus({ preventScroll: true });
}
function skipFocusInstall() {
  startTimer();
}
async function installForFocus() {
  const btn = $('#focusInstallBtn');
  const status = $('#focusInstallStatus');
  if (!deferredPrompt && window.__vespirInstall) deferredPrompt = window.__vespirInstall;
  if (!deferredPrompt) {
    /* Kurulum penceresi yok (iOS, Safari, Firefox): yolu yaz, butonu kilitleme. */
    if (status) status.textContent = installHint();
    return;
  }
  btn.disabled = true;
  btn.textContent = S.lang === 'en' ? 'Opening install…' : 'Kurulum açılıyor…';
  const outcome = await promptInstall();
  if (!$('#focusInvite').classList.contains('open')) return;
  btn.disabled = false;
  btn.textContent = S.lang === 'en' ? 'Okay, let’s do it' : 'Tamam, yapalım';
  if (hasInstalledPwa() || outcome === 'accepted' || outcome === 'installed') {
    startTimer();
  } else if (outcome === 'dismissed') {
    status.textContent = S.lang === 'en'
      ? 'You closed the install prompt. You can try again or focus without installing now.'
      : 'Kurulumu kapattın. İstersen tekrar deneyebilir ya da şimdi kurulumsuz odaklanabilirsin.';
  } else {
    status.textContent = installHint();
  }
}
function isStandalone() {
  return (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
}
function isIOSDevice() {
  return /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}
function installHint() {
  if (S.lang === 'en') {
    if (location.protocol === 'file:') return 'To install, open Vespır from a secure HTTPS address; installation isn’t possible directly from an HTML file.';
    if (window.top !== window.self) return 'Installation can’t open from an embedded page like Google Sites. Open Vespır’s published HTTPS address in a separate tab and install from the browser menu.';
    if (isIOSDevice()) return 'Open the Share menu, choose “Add to Home Screen”, then open Vespır from its home-screen icon.';
    return 'The browser isn’t offering an install prompt right now. Choose “Install app” or “Add to Home Screen” from the menu; if it’s missing, open the page in a supporting browser.';
  }
  if (location.protocol === 'file:') return 'Kurulum için Vespır’ı güvenli bir HTTPS web adresinden açmalısın; doğrudan HTML dosyasından kurulum yapılamaz.';
  if (window.top !== window.self) return 'Google Sites gibi gömülü bir sayfadan kurulum açılamaz. Vespır’ın yayınlandığı HTTPS adresini ayrı sekmede açıp tarayıcı menüsünden yükle.';
  if (isIOSDevice()) return 'Paylaş menüsünü aç, “Ana Ekrana Ekle”yi seç, sonra Vespır’ı ana ekranındaki simgesinden aç.';
  return 'Tarayıcı şu an kurulum penceresi sunmuyor. Menüden “Uygulamayı yükle” ya da “Ana ekrana ekle”yi seç; bu seçenek yoksa destekleyen bir tarayıcıda aç.';
}
function updatePwaUI() {
  const detail = $('#pwaDetail');
  const cardBtn = $('#installBtn2');
  const standalone = isStandalone();
  const installed = hasInstalledPwa();
  const canPrompt = !!deferredPrompt;
  if (cardBtn) {
    cardBtn.disabled = installed;
    cardBtn.textContent = installed ? t('Kurulu') : t('Ana ekrana ekle');
  }
  if (!detail) return;
  if (S.lang === 'en') {
    if (standalone) detail.textContent = `${S.cat.name} is in your pocket! No tabs, no nagging; just paws and a warm corner.`;
    else if (installed) detail.textContent = 'Vespır is installed. Open her from the home-screen or app icon to focus without tabs.';
    else if (canPrompt) detail.textContent = `Ready: tap “Add to Home Screen” and confirm in the browser prompt. ${S.cat.name} opens with one tap.`;
    else if (location.protocol === 'file:') detail.textContent = 'Vespır lives in this file. Tap “Add to Home Screen” in the browser menu; her paws will handle the rest.';
    else if (isIOSDevice()) detail.textContent = 'Open the Share menu and choose “Add to Home Screen”. Let Vespır move into your pocket.';
    else detail.textContent = 'Works in every browser: choose “Install app” or “Add to Home Screen” from the menu.';
    return;
  }
  if (standalone) {
    detail.textContent = `${S.cat.name} cebinde! Sekme yok, dırdır yok; sadece patiler ve sıcak bir köşe.`;
  } else if (installed) {
    detail.textContent = 'Vespır kurulu. Sekmesiz odaklanmak için ana ekranındaki veya uygulamalarındaki Vespır simgesinden aç.';
  } else if (canPrompt) {
    detail.textContent = `Hazır: “Ana ekrana ekle”ye bas, tarayıcının onayında ekle’yi seç. ${S.cat.name} tek dokunuşla açılır.`;
  } else if (location.protocol === 'file:') {
    detail.textContent = 'Vespır bu dosyada yaşıyor. Tarayıcı menüsünden “Ana ekrana ekle”ye dokun; gerisini patileri halleder.';
  } else if (isIOSDevice()) {
    detail.textContent = 'Paylaş menüsünü aç, “Ana Ekrana Ekle”yi seç. Vespır cebine taşınsın.';
  } else {
    detail.textContent = 'Her tarayıcıda çalışır: menüden “Uygulamayı yükle” ya da “Ana ekrana ekle”yi seç.';
  }
}
async function promptInstall() {
  if (hasInstalledPwa()) { toast('Vespır zaten kurulu.'); return 'installed'; }
  if (!deferredPrompt && window.__vespirInstall) deferredPrompt = window.__vespirInstall;
  const prompt = deferredPrompt;
  if (prompt) {
    deferredPrompt = null;
    window.__vespirInstall = null;
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice && choice.outcome === 'accepted') toast('Vespır kuruluyor. Patiler hazır!');
      updatePwaUI();
      return choice ? choice.outcome : 'dismissed';
    } catch (e) {
      updatePwaUI();
      toast(installHint());
      return 'unavailable';
    }
  }
  toast(installHint());
  return 'unavailable';
}
function primeShellCache(reg) {
  const worker = (reg && reg.active) || navigator.serviceWorker.controller;
  if (!worker) return;
  try { worker.postMessage({ type: 'CACHE_SHELL', url: location.origin + location.pathname }); } catch (e) {}
}
function setupPWA() {
  if (isStandalone()) rememberPwaInstalled();
  deferredPrompt = window.__vespirInstall || deferredPrompt;
  if (deferredPrompt) clearPwaInstalled();
  const standalone = matchMedia('(display-mode: standalone)');
  const onStandaloneChange = () => {
    if (!isStandalone()) return;
    rememberPwaInstalled();
    if ($('#focusInvite').classList.contains('open')) {
      if (!timer.running) startTimer();
      else closeFocusInvite();
    }
    updatePwaUI();
  };
  if (standalone.addEventListener) standalone.addEventListener('change', onStandaloneChange);
  else if (standalone.addListener) standalone.addListener(onStandaloneChange);
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    window.__vespirInstall = e;
    /* Kurulum penceresi sunulabildiğine göre uygulama kurulu değil. */
    clearPwaInstalled();
    updatePwaUI();
  });
  window.addEventListener('appinstalled', () => {
    rememberPwaInstalled();
    deferredPrompt = null;
    window.__vespirInstall = null;
    updatePwaUI();
    if ($('#focusInvite').classList.contains('open')) {
      if (!timer.running) startTimer();
      else closeFocusInvite();
    }
    toast('Vespır artık uygulama olarak kurulu.');
  });
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    /* İlk kurulumda da controllerchange tetiklenir; yalnızca sayfa bir worker
       tarafından yönetiliyorken (yani gerçek bir güncellemede) yeniden yükle. */
    const hadController = !!navigator.serviceWorker.controller;
    let reloadingForUpdate = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      swRegistered = true;
      primeShellCache();
      updatePwaUI();
      if (!hadController || reloadingForUpdate) return;
      reloadingForUpdate = true;
      /* Odak sürerken sayfayı altından çekmeyelim: güncelleme bir sonraki
         açılışta uygulanır. Aksi hâlde yeni HTML hemen devreye girer. */
      try {
        if (document.hidden || !timer.running) location.reload();
        else toast('Vespır güncellendi. Bir sonraki açılışta yeni sürüm hazır.');
      } catch (e) {}
    });
    const checkUpdate = (reg) => { try { reg.update(); } catch (e) {} };
    navigator.serviceWorker.register('./sw.js', { scope: './', updateViaCache: 'none' }).then((reg) => {
      swRegistered = true;
      updatePwaUI();
      syncMessageSchedule();
      primeShellCache(reg);
      navigator.serviceWorker.ready.then(primeShellCache).catch(() => {});
      if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      /* Yeni worker kurulunca beklemeden devral: eski önbellekte takılı kalma. */
      reg.addEventListener('updatefound', () => {
        const fresh = reg.installing;
        if (!fresh) return;
        fresh.addEventListener('statechange', () => {
          if (fresh.state === 'installed' && navigator.serviceWorker.controller) {
            fresh.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      });
      setTimeout(() => checkUpdate(reg), 4000);
      document.addEventListener('visibilitychange', () => { if (!document.hidden) checkUpdate(reg); });
      window.addEventListener('online', () => checkUpdate(reg));
    }).catch(() => { swRegistered = false; });
  }
  /* Durum sekmeye dönünce tazelenir: teklif sonradan gelse de kart çalışır. */
  window.addEventListener('focus', updatePwaUI);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) updatePwaUI(); });
  updatePwaUI();
}
/* ============================================================
   AYAR ARAYÜZÜ — kedi, görünüm, zaman, ses
   ============================================================ */
const catSwatchRows = [];
let settingsBuilt = false;
function syncSegments() {
  $$('#genderGroup [data-gender]').forEach((b) => b.classList.toggle('active', b.dataset.gender === S.cat.gender));
  $$('#modeGroup [data-mode]').forEach((b) => b.classList.toggle('active', b.dataset.mode === S.mode));
}
function syncBreedCards() {
  $$('#breedGroup [data-breed]').forEach((b) => b.classList.toggle('active', b.dataset.breed === S.cat.breed));
}
function syncAccessories() {
  const list = (S.cat.accessories || []);
  $$('#accessoryGroup [data-accessory]').forEach((b) => {
    const key = b.dataset.accessory;
    const on = key === 'none' ? list.length === 0 : list.includes(key);
    b.classList.toggle('active', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
}
function syncThemeGrid() {
  $$('.theme-card').forEach((el) => el.classList.toggle('active', el.dataset.themeCard === S.theme));
}
function refreshSwatches() {
  catSwatchRows.forEach((row) => {
    const current = S.cat[row.key];
    const known = row.colors.includes(current);
    $$('.swatch', row.container).forEach((btn) => {
      if (btn.classList.contains('custom')) {
        btn.classList.toggle('active', !known);
        const input = $('input', btn);
        if (input && input.value !== current) input.value = current;
      } else {
        btn.classList.toggle('active', btn.dataset.color === current);
      }
    });
    if (row.key === 'collar') row.container.style.opacity = S.cat.collarOn ? '1' : '.45';
  });
}
function buildSegmented(container, items, attr, onPick) {
  if (!container) return;
  container.innerHTML = '';
  items.forEach((item) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset[attr] = item.v;
    btn.innerHTML = (item.icon || '') + '<span>' + item.label + '</span>';
    container.appendChild(btn);
  });
  container.addEventListener('click', (e) => {
    const btn = e.target.closest('button[' + 'data-' + attr + ']');
    if (!btn) return;
    onPick(btn.dataset[attr]);
  });
}
function buildGenders() {
  const items = Object.keys(GENDERS).map((v) => ({ v, label: GENDERS[v] }));
  buildSegmented($('#genderGroup'), items, 'gender', (v) => {
    S.cat.gender = v;
    syncSegments();
    updateCatVisuals();
    save();
  });
}
function buildBreeds() {
  const box = $('#breedGroup');
  if (!box) return;
  box.innerHTML = '';
  Object.keys(BREEDS).forEach((key) => {
    const b = BREEDS[key];
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'breed-card';
    btn.dataset.breed = key;
    const plainDot = ['tekir', 'sarman', 'british'].includes(key);
    btn.innerHTML = `<span class="breed-dot"${plainDot ? ` style="background:linear-gradient(140deg,${b.fur},${b.patch} 62%,${b.patch2})"` : ''}><i class="breed-eyes" style="--e1:${b.eyes};--e2:${b.eyes2 || b.eyes}"></i></span><span>${b.label}</span>`;
    box.appendChild(btn);
  });
  box.addEventListener('click', (e) => {
    const btn = e.target.closest('.breed-card');
    if (!btn) return;
    const key = btn.dataset.breed;
    const b = BREEDS[key];
    if (!b) return;
    S.cat.breed = key;
    S.cat.fur = b.fur;
    S.cat.belly = b.belly;
    S.cat.eyes = b.eyes;
    S.cat.patch = b.patch;
    S.cat.patch2 = b.patch2;
    syncBreedCards();
    refreshSwatches();
    updateCatVisuals();
    previewPop();
    save();
    if (currentCatState() !== 'sleep') {
      setCatState('happy', { force: true });
      setTimeout(() => {
        if (!timer.running) setCatState('idle');
        updateStageMeta();
      }, 1700);
    }
  });
}
const SWATCH_LABELS = { fur: 'Tüy rengi', belly: 'Göbek ve patiler', eyes: 'Göz rengi', collar: 'Tasma rengi' };
const SWATCH_LABELS_EN = { fur: 'Fur color', belly: 'Belly & paws', eyes: 'Eye color', collar: 'Collar color' };
function swatchLabel(key) {
  const en = S.lang === 'en';
  return (en ? SWATCH_LABELS_EN[key] : SWATCH_LABELS[key]) || (en ? 'Color' : 'Renk');
}
/* Dil değişince mevcut swatch'ların etiketleri de döner. */
function relabelSwatches() {
  const en = S.lang === 'en';
  (typeof catSwatchRows === 'undefined' ? [] : catSwatchRows).forEach((row) => {
    const label = swatchLabel(row.key);
    row.container.querySelectorAll('button.swatch[data-color]').forEach((btn) => {
      btn.setAttribute('aria-label', label + ': ' + btn.dataset.color);
    });
    const input = row.container.querySelector('input[type="color"]');
    if (input) input.setAttribute('aria-label', (en ? 'Custom ' : 'Özel ') + label.toLowerCase());
    const custom = row.container.querySelector('.swatch.custom');
    if (custom) custom.title = en ? 'Choose a custom color' : 'Özel renk seç';
  });
}
function buildSwatchRow(containerId, colors, key) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const en = S.lang === 'en';
  const label = swatchLabel(key);
  container.innerHTML = '';
  colors.forEach((color) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'swatch';
    btn.dataset.color = color;
    btn.title = color;
    btn.setAttribute('aria-label', label + ': ' + color);
    btn.style.background = color;
    container.appendChild(btn);
  });
  const custom = document.createElement('label');
  custom.className = 'swatch custom';
  custom.title = en ? 'Choose a custom color' : 'Özel renk seç';
  const input = document.createElement('input');
  input.type = 'color';
  input.value = /^#[0-9a-f]{6}$/i.test(S.cat[key]) ? S.cat[key] : '#ffffff';
  input.setAttribute('aria-label', (en ? 'Custom ' : 'Özel ') + label.toLowerCase());
  custom.appendChild(input);
  container.appendChild(custom);
  container.addEventListener('click', (e) => {
    const btn = e.target.closest('button.swatch');
    if (!btn) return;
    setCatColor(key, btn.dataset.color);
  });
  const onPick = () => setCatColor(key, input.value);
  input.addEventListener('input', onPick);
  input.addEventListener('change', onPick);
  catSwatchRows.push({ container, colors, key });
}
function setCatColor(key, color) {
  if (!/^#[0-9a-f]{6}$/i.test(color || '')) return;
  S.cat[key] = color.toLowerCase();
  refreshSwatches();
  updateCatVisuals();
  save();
}
function buildAccessories() {
  const box = $('#accessoryGroup');
  if (!box) return;
  box.innerHTML = '';
  const keys = Object.keys(ACCESSORIES);
  keys.forEach((key) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip';
    btn.dataset.accessory = key;
    btn.setAttribute('aria-pressed', 'false');
    btn.textContent = ACCESSORIES[key];
    box.appendChild(btn);
  });
  if (box.dataset.bound) return;
  box.dataset.bound = '1';
  box.addEventListener('click', (e) => {
    const btn = e.target.closest('.chip');
    if (!btn) return;
    const key = btn.dataset.accessory;
    if (key === 'none') {
      S.cat.accessories = [];
    } else {
      const list = (S.cat.accessories || []);
      S.cat.accessories = list.includes(key) ? list.filter((k) => k !== key) : list.concat(key);
    }
    syncAccessories();
    updateCatVisuals();
    save();
  });
}
const COLD_LINE = 'Üşüyorum… daha kalın bir şey giydirir misin?';
function isThinOutfit(key) {
  const o = OUTFITS[key];
  return !!(o && o.thin);
}
/* Noel'de ince kıyafet: kedi gerçekten üşür. Baloncuk ve kısa bir titreme. */
function showColdBubble(prefix = '') {
  if (S.theme !== 'noel') return false;
  showBubble((prefix ? prefix + ' ' : '') + COLD_LINE, { title: S.cat.name + ' üşüyor', duration: 6200 });
  const wrap = $('#catMount .cat-wrap');
  if (wrap) {
    if (wrap.classList.contains('is-cold')) {
      wrap.classList.remove('is-cold');
      requestAnimationFrame(() => { if (wrap.isConnected) wrap.classList.add('is-cold'); });
    } else {
      wrap.classList.add('is-cold');
    }
    clearTimeout(showColdBubble.timer);
    showColdBubble.timer = setTimeout(() => wrap.classList.remove('is-cold'), 2900);
  }
  return true;
}
function buildOutfits() {
  const box = $('#outfitGroup');
  if (!box) return;
  box.innerHTML = '';
  const keys = Object.keys(OUTFITS);
  keys.forEach((key) => {
    const o = OUTFITS[key];
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'outfit-card';
    btn.dataset.outfit = key;
    btn.setAttribute('aria-pressed', 'false');
    btn.style.setProperty('--of-a', o.a || '#5b6474');
    btn.style.setProperty('--of-b', o.b || '#3c4350');
    btn.style.setProperty('--of-t', o.t || '#f4f6fa');
    btn.style.setProperty('--of-d', o.d || '#d7b45e');
    /* Önizlemede kedi başı yer almaz; yalnızca kıyafetin kendisi görünür. */
    const thumb = key === 'none'
      ? ''
      : `<span class="outfit" data-kind="${o.kind}" style="--of-a:${o.a || '#5b6474'};--of-b:${o.b || '#3c4350'};--of-t:${o.t || '#f4f6fa'};--of-d:${o.d || '#d7b45e'}"><i class="of-body"></i><i class="of-collar"></i><b class="of-badge"></b><span class="of-extra"></span><span class="of-extra2"></span></span>`;
    btn.innerHTML = `<span class="outfit-thumb" aria-hidden="true">${thumb}</span><span>${o.label}</span>`;
    box.appendChild(btn);
  });
  if (box.dataset.bound) return;
  box.dataset.bound = '1';
  box.addEventListener('click', (e) => {
    const btn = e.target.closest('.outfit-card');
    if (!btn) return;
    const key = btn.dataset.outfit;
    if (S.cat.outfit === key) return;
    S.cat.outfit = key;
    syncOutfits();
    updateCatVisuals();
    previewPop();
    save();
    /* Kalın bir şey seçilince "üşüyorum" balonu ve titreme hemen bitsin. */
    if (!isThinOutfit(key)) {
      clearTimeout(showColdBubble.timer);
      const coldWrap = $('#catMount .cat-wrap');
      if (coldWrap) coldWrap.classList.remove('is-cold');
      const coldBubble = $('#catBubble');
      if (coldBubble && coldBubble.classList.contains('show') && /üşüyor/i.test(coldBubble.textContent)) hideBubble();
    }
    if (currentCatState() !== 'sleep') {
      if (key !== 'none' && isThinOutfit(key) && showColdBubble()) return;
      const o = OUTFITS[key];
      showBubble(o && o.kind !== 'none' ? pick(['bu bana çok yakıştı.', 'miyav! yeni kıyafet.', 'prr… aynaya bakmalıyım.']) : 'tüylerim daha rahat.', { duration: 2200 });
    }
  });
}
function syncOutfits() {
  $$('#outfitGroup [data-outfit]').forEach((b) => {
    const on = b.dataset.outfit === S.cat.outfit;
    b.classList.toggle('active', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
}
function buildModes() {
  const sun = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4"/></svg>';
  const moon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20 15.2A8.3 8.3 0 0 1 8.8 4a8.3 8.3 0 1 0 11.2 11.2Z"/></svg>';
  const auto = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="8"/><path d="M12 4v16" opacity=".55"/><path d="M12 4a8 8 0 0 1 0 16Z" fill="currentColor" opacity=".22" stroke="none"/></svg>';
  buildSegmented($('#modeGroup'), [
    { v: 'light', label: 'Aydınlık', icon: sun },
    { v: 'dark', label: 'Karanlık', icon: moon },
    { v: 'auto', label: 'Otomatik', icon: auto }
  ], 'mode', (v) => {
    S.mode = v;
    applyTheme(true, $('#modeGroup') || null);
    save();
  });
}
function buildThemeGrid() {
  const box = $('#themeGrid');
  if (!box) return;
  box.innerHTML = '';
  const checkIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 13 4 4L19 7"/></svg>';
  Object.keys(THEMES).forEach((key) => {
    const t = THEMES[key];
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'theme-card';
    btn.dataset.themeCard = key;
    btn.innerHTML = `<span class="theme-swatch" data-preview="${key}"></span>
      <span class="theme-info"><span><b>${t.label}</b><small>${t.tag}</small></span>
      <div class="theme-check">${checkIcon}      </div></span>`;
    box.appendChild(btn);
  });
  if (box.dataset.bound) return;
  box.dataset.bound = '1';
  box.addEventListener('click', (e) => {
    const card = e.target.closest('.theme-card');
    if (!card) return;
    const key = card.dataset.themeCard;
    if (S.theme === key) return;
    S.theme = key;
    applyTheme(true, card);
    syncThemeGrid();
    save();
    if (key === 'noel') {
      if (!(isThinOutfit(S.cat.outfit) && showColdBubble('Kar yağdı!'))) {
        showBubble(pick(['kar yağdı! şapkamı taktım.', 'tepede kar birikti, birazdan silkerim.', 'beyaz bir dünya. hadi odaklanalım.']), { duration: 2800 });
      }
    } else if (currentCatState() !== 'sleep') {
      showBubble(pick(['bu dünya güzelmiş.', 'miyav! renkler değişti.', 'prr… yeni bir köşe.']), { duration: 2400 });
    }
  });
}
/* Cadılar Bayramı sahnesi tema seçiliyken CSS ile her zaman görünür;
   tarih kontrolü veya açılma bildirimi yoktur. */
function buildSoundOptionsFor(kind, boxId) {
  const box = document.getElementById(boxId);
  if (!box) return;
  box.innerHTML = '';
  SOUND_OPTIONS.forEach((opt) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sound-option';
    btn.dataset.sound = opt.id;
    btn.textContent = opt.label;
    box.appendChild(btn);
  });
  const custom = document.createElement('button');
  custom.type = 'button';
  custom.className = 'sound-option';
  custom.dataset.sound = 'custom';
  custom.textContent = 'Kendi sesim';
  box.appendChild(custom);
  box.addEventListener('click', (e) => {
    const btn = e.target.closest('.sound-option');
    if (!btn) return;
    const id = btn.dataset.sound;
    if (id === 'custom' && !customSounds[kind]) {
      const input = document.getElementById(kind + 'FileInput');
      if (input) input.click();
      return;
    }
    ++soundEpoch[kind];
    S[kind + 'Sound'] = id;
    updateSoundsUI();
    save();
    if (id !== 'none') playCue(kind);
  });
}
function buildWavesUI() { buildWaveBars(); }
function setBreakMinutes(value) {
  const next = clamp(Math.round(value), 1, 30);
  if (next === S.breakMin) return;
  S.breakMin = next;
  if (!timer.running && timer.phase === 'break') {
    timer.total = next * 60;
    timer.remaining = timer.total;
    timer.shown = -1;
    updateTimerDisplay(true);
    syncTimerChrome();
    persistTimer(true);
  }
  const qb = $('#quickBreak');
  if (qb) qb.textContent = String(S.breakMin);
  save();
}
function setFocusMinutes(value, source = 'ui') {
  const next = clamp(Math.round(value), 1, 240);
  if (next === S.focusMin) return;
  S.focusMin = next;
  if (!timer.running && timer.phase === 'focus') {
    timer.total = next * 60;
    timer.remaining = timer.total;
    timer.shown = -1;
    updateTimerDisplay(true);
    syncTimerChrome();
    persistTimer(true);
  }
  const qf = $('#quickFocus');
  if (qf) qf.textContent = String(S.focusMin);
  save();
}
function previewPop() {
  const preview = $('#previewCat');
  if (!preview) return;
  const r = preview.getBoundingClientRect();
  heartBurst(r.left + r.width / 2, r.top + r.height * .4, 10);
  const panel = $('.preview-panel');
  if (panel) {
    try { panel.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.012)' }, { transform: 'scale(1)' }], { duration: 380, easing: 'ease-out' }); } catch (e) {}
  }
}
function syncSettingsUI() {
  const nameInput = $('#catNameInput');
  if (nameInput && document.activeElement !== nameInput) nameInput.value = S.cat.name;
  const sessionInput = $('#sessionNameInput');
  if (sessionInput && document.activeElement !== sessionInput) sessionInput.value = S.sessionName;
  const collar = $('#collarToggle');
  if (collar) collar.checked = S.cat.collarOn;
  const haptic = $('#hapticToggle');
  const perfBox = $('#perfModeToggle');
  if (perfBox) perfBox.checked = perfModeOn();
  if (haptic) haptic.checked = S.haptic;
  const auto = $('#autoStartToggle');
  if (auto) auto.checked = S.autoStart;
  const autoFocus = $('#autoFocusToggle');
  if (autoFocus) autoFocus.checked = S.autoFocus;
  const hourly = $('#hourlyToggle');
  if (hourly) hourly.checked = S.hourlyChime;
  const hourlySound = $('#hourlyToggleSound');
  if (hourlySound) hourlySound.checked = S.hourlyChime;
  const notify = $('#notifyToggle');
  if (notify) notify.checked = S.notify;
  const catMsg = $('#catMsgToggle');
  if (catMsg) catMsg.checked = S.catMessages;
  const volume = $('#volRange');
  if (volume) { volume.value = String(Math.round(S.volume * 100)); volume.style.setProperty('--fill', (S.volume * 100).toFixed(1) + '%'); }
  const volVal = $('#volVal');
  if (volVal) volVal.textContent = Math.round(S.volume * 100) + '%';
  const chime = $('#chimeVolRange');
  if (chime) { chime.value = String(Math.round(S.chimeVolume * 100)); chime.style.setProperty('--fill', (S.chimeVolume * 100).toFixed(1) + '%'); }
  const chimeVal = $('#chimeVolVal');
  if (chimeVal) chimeVal.textContent = Math.round(S.chimeVolume * 100) + '%';
  syncSegments();
  syncBreedCards();
  syncAccessories();
  syncOutfits();
  syncThemeGrid();
  refreshSwatches();
  updateSessionUI();
  updateGoalUI();
  updateNotifyStatus();
  updateMsgStatus();
  updateSoundsUI();
  updateStatsUI();
  updatePwaUI();
}
function buildSettingsUI() {
  if (settingsBuilt) return;
  settingsBuilt = true;
  /* Bütün listeler tek karede kurulunca panel açılışı tek bir uzun kareye
     takılıyordu. Görünen sekmenin iskeleti hemen kurulur; geri kalan bölümler
     süzülme sırasında kare kare eklenir. Hiçbir bölüm kaybolmaz. */
  ensurePreviewCat();
  buildGenders();
  buildBreeds();
  buildSwatchRow('furSwatches', FUR_SWATCHES, 'fur');
  buildSwatchRow('bellySwatches', BELLY_SWATCHES, 'belly');
  buildSwatchRow('eyeSwatches', EYE_SWATCHES, 'eyes');
  buildSwatchRow('collarSwatches', COLLAR_SWATCHES, 'collar');
  syncSettingsUI();
  const steps = [
    () => buildAccessories(),
    () => buildOutfits(),
    () => { buildModes(); buildThemeGrid(); },
    () => { buildSoundOptionsFor('start', 'startSoundOptions'); buildSoundOptionsFor('end', 'endSoundOptions'); },
    () => buildWavesUI(),
    () => { syncSettingsUI(); applyLanguageDom($('#settings')); }
  ];
  /* Sekme arkada/ekran kapalıyken kare beklenmez: parçalar hemen kurulur,
     yoksa panel eksik içerikle kalır. Görünürken iş karelere bölünür. */
  const runAll = () => steps.forEach((fn) => { try { fn(); } catch (e) {} });
  if (document.hidden) { runAll(); return; }
  let step = 0;
  const next = () => {
    if (step >= steps.length) return;
    try { steps[step](); } catch (e) {}
    step += 1;
    if (step < steps.length) setTimeout(next, 0);
  };
  setTimeout(next, 0);
}
/* ============================================================
   OLAYLAR — tek yerden, sıfır çakışma
   ============================================================ */
let lastFocused = null;
let settingsReadyTimer = 0;
let settingsFocusTimer = 0;
let tabReadyTimer = 0;
function setSettingsTab(tab) {
  const target = ['cat', 'look', 'time', 'sound', 'about'].includes(tab) ? tab : 'cat';
  $$('#settingsTabs .tab-btn').forEach((btn) => {
    const on = btn.dataset.tab === target;
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  $$('#settings .pane').forEach((pane) => pane.classList.toggle('active', pane.dataset.pane === target));
  if (target === 'time') { updateGoalUI(); updateNotifyStatus(); updateMsgStatus(); }
  const scroll = $('#settingsScroll');
  if (scroll) {
    scroll.scrollTop = 0;
    /* Sekme süzülmesi bitene kadar önizleme kedisinin animasyonları bekler;
       sonra kaldığı yerden akar. Animasyon silinmez, sadece sıraya girer. */
    scroll.classList.add('is-tab-switching');
    clearTimeout(tabReadyTimer);
    tabReadyTimer = setTimeout(() => scroll.classList.remove('is-tab-switching'), 480);
  }
}
/* Açık panelin içinde kal: arkadaki uygulamaya Tab ile geçilmesin. */
function trapPanelFocus(container, e) {
  if (!container) return;
  const nodes = container.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
  const list = Array.from(nodes).filter((el) => el.offsetParent !== null || el === document.activeElement);
  if (!list.length) return;
  const first = list[0];
  const last = list[list.length - 1];
  const active = document.activeElement;
  const inside = container.contains(active);
  if (e.shiftKey && (!inside || active === first)) {
    e.preventDefault();
    last.focus({ preventScroll: true });
  } else if (!e.shiftKey && (!inside || active === last)) {
    e.preventDefault();
    first.focus({ preventScroll: true });
  }
}
/* Panelin ilk boyanması ~80 ms'lik tek bir uzun kare oluşturuyordu.
   Sayfa daha açılırken panel görünmez opaklıkta bir kez boyanır; sonra
   ekran dışına sessizce geri konur. Açılış yalnızca süzülmeden ibaret kalır. */
let settingsWarmed = false;
let settingsWarmSeq = 0;
function warmSettingsPanel() {
  const el = $('#settings');
  if (settingsWarmed || !el || el.classList.contains('open') || el.classList.contains('warming')) return false;
  const intro = $('#intro');
  if (intro && intro.classList.contains('open')) return false;
  settingsWarmed = true;
  const seq = ++settingsWarmSeq;
  buildSettingsUI();
  el.classList.remove('warming-off');
  el.classList.add('warming');
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (seq !== settingsWarmSeq || el.classList.contains('open')) return;
    /* Önce geçişsiz olarak ekran dışına dön, sonra geçişi geri aç. */
    el.classList.remove('warming');
    el.classList.add('warming-off');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (seq === settingsWarmSeq) el.classList.remove('warming-off');
    }));
  }));
  return true;
}
function openSettings(tab = 'cat') {
  const el = $('#settings');
  if (!el) return;
  settingsWarmed = true;
  settingsWarmSeq++;
  el.classList.remove('warming', 'warming-off');
  buildSettingsUI();
  lastFocused = document.activeElement;
  setSettingsTab(tab);
  el.removeAttribute('inert');
  el.classList.remove('panel-ready');
  el.classList.add('open');
  el.setAttribute('aria-hidden', 'false');
  document.body.classList.add('sheet-open');
  clearTimeout(settingsReadyTimer);
  settingsReadyTimer = setTimeout(() => { if (el.classList.contains('open')) el.classList.add('panel-ready'); }, 760);
  clearTimeout(settingsFocusTimer);
  settingsFocusTimer = setTimeout(() => {
    const close = $('#settingsClose');
    if (close && el.classList.contains('open') && !$('.geo-ask, #intro.open, #about.open, #contact.open, #account.open, #privacy.open')) { try { close.focus({ preventScroll: true }); } catch (e) {} }
  }, 220);
}
function closeSettings() {
  const el = $('#settings');
  if (!el || !el.classList.contains('open')) return;
  clearTimeout(settingsReadyTimer);
  clearTimeout(settingsFocusTimer);
  clearTimeout(tabReadyTimer);
  settingsReadyTimer = settingsFocusTimer = tabReadyTimer = 0;
  const scroll = $('#settingsScroll');
  if (scroll) scroll.classList.remove('is-tab-switching');
  closeAbout();
  closeContact();
  closeAccount();
  closePrivacy();
  el.classList.remove('open');
  el.setAttribute('aria-hidden', 'true');
  el.setAttribute('inert', '');
  document.body.classList.remove('sheet-open');
  if (lastFocused && typeof lastFocused.focus === 'function') {
    try { lastFocused.focus({ preventScroll: true }); } catch (e) {}
  }
}
/* “Vespır Nedir?”: ayarların üzerinde açılan, arkasını bulanıklaştıran sayfa. */
let aboutLastFocus = null;
function openAbout() {
  closeContact();
  closeAccount();
  closePrivacy();
  const el = $('#about');
  if (!el) return;
  aboutLastFocus = document.activeElement;
  el.classList.add('open');
  el.removeAttribute('inert');
  el.setAttribute('aria-hidden', 'false');
  document.body.classList.add('about-open');
  const scroll = $('#aboutScroll');
  if (scroll) scroll.scrollTop = 0;
  setTimeout(() => {
    const close = $('#aboutClose');
    if (close && el.classList.contains('open') && !$('.geo-ask, #intro.open')) { try { close.focus({ preventScroll: true }); } catch (e) {} }
  }, 200);
}
function closeAbout() {
  const el = $('#about');
  if (!el || !el.classList.contains('open')) return;
  el.classList.remove('open');
  el.setAttribute('aria-hidden', 'true');
  el.setAttribute('inert', '');
  document.body.classList.remove('about-open');
  if (aboutLastFocus && typeof aboutLastFocus.focus === 'function') {
    try { aboutLastFocus.focus({ preventScroll: true }); } catch (e) {}
  }
}
/* “İletişim”: Instagram sayfası, e-posta kopyalama ve geri bildirim başlıkları. */
let contactLastFocus = null;
let copyMailTimer = 0;
const CONTACT_MAIL = 'vespirfocuslabs@gmail.com';
function resetCopyFeedback() {
  clearTimeout(copyMailTimer);
  const btn = $('#copyMail');
  if (btn) btn.classList.remove('done', 'fail');
  const label = $('#copyMailText');
  if (label) label.textContent = S.lang === 'en' ? 'Copy' : 'Kopyala';
}
function openContact() {
  closeAbout();
  closeAccount();
  closePrivacy();
  const el = $('#contact');
  if (!el || el.classList.contains('open')) return;
  contactLastFocus = document.activeElement;
  el.classList.add('open');
  el.removeAttribute('inert');
  el.setAttribute('aria-hidden', 'false');
  document.body.classList.add('contact-open');
  const scroll = $('#contactScroll');
  if (scroll) scroll.scrollTop = 0;
  resetCopyFeedback();
  setTimeout(() => {
    const close = $('#contactClose');
    if (close && el.classList.contains('open') && !$('.geo-ask, #intro.open')) { try { close.focus({ preventScroll: true }); } catch (e) {} }
  }, 200);
}
function closeContact() {
  const el = $('#contact');
  if (!el || !el.classList.contains('open')) return;
  el.classList.remove('open');
  el.setAttribute('aria-hidden', 'true');
  el.setAttribute('inert', '');
  document.body.classList.remove('contact-open');
  resetCopyFeedback();
  if (contactLastFocus && typeof contactLastFocus.focus === 'function') {
    try { contactLastFocus.focus({ preventScroll: true }); } catch (e) {}
  }
}
function markMailCopied() {
  const btn = $('#copyMail');
  if (!btn) return;
  btn.classList.add('done');
  const label = $('#copyMailText');
  if (label) label.textContent = S.lang === 'en' ? 'Copied' : 'Kopyalandı';
  clearTimeout(copyMailTimer);
  copyMailTimer = setTimeout(resetCopyFeedback, 1800);
}
function markMailFailed() {
  const btn = $('#copyMail');
  if (!btn) return;
  btn.classList.add('fail');
  const label = $('#copyMailText');
  if (label) label.textContent = S.lang === 'en' ? 'Couldn’t copy' : 'Kopyalanamadı';
  clearTimeout(copyMailTimer);
  copyMailTimer = setTimeout(resetCopyFeedback, 2000);
}
function copyMailAddress() {
  const ok = () => markMailCopied();
  const fail = () => markMailFailed();
  const legacy = () => {
    try {
      const ta = document.createElement('textarea');
      ta.value = CONTACT_MAIL;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:0;left:-9999px;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, CONTACT_MAIL.length);
      const copied = document.execCommand('copy');
      ta.remove();
      if (copied) ok(); else fail();
    } catch (e) { fail(); }
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(CONTACT_MAIL).then(ok, legacy);
  } else legacy();
}
/* Hesap doğrulaması aşağıdaki Firebase modülünde çalışır. */
let accountLastFocus = null;
function openAccount() {
  closeAbout();
  closeContact();
  closePrivacy();
  const el = $('#account');
  if (!el || el.classList.contains('open')) return;
  accountLastFocus = document.activeElement;
  el.classList.add('open');
  el.removeAttribute('inert');
  el.setAttribute('aria-hidden', 'false');
  document.body.classList.add('account-open');
  const body = $('#accountBody');
  if (body) body.scrollTop = 0;
  setTimeout(() => {
    const close = $('#accountClose');
    if (close && el.classList.contains('open') && !$('.geo-ask, #intro.open') && !el.contains(document.activeElement)) { try { close.focus({ preventScroll: true }); } catch (e) {} }
  }, 200);
}
function closeAccount() {
  const el = $('#account');
  if (!el || !el.classList.contains('open')) return;
  el.classList.remove('open');
  el.setAttribute('aria-hidden', 'true');
  el.setAttribute('inert', '');
  document.body.classList.remove('account-open');
  if (accountLastFocus && typeof accountLastFocus.focus === 'function') {
    try { accountLastFocus.focus({ preventScroll: true }); } catch (e) {}
  }
}
/* “Gizlilik ve Güvenlik”: yerel mimariyi anlatan politika sayfası. */
let privacyLastFocus = null;
function openPrivacy() {
  closeAbout();
  closeContact();
  closeAccount();
  const el = $('#privacy');
  if (!el || el.classList.contains('open')) return;
  privacyLastFocus = document.activeElement;
  el.classList.add('open');
  el.removeAttribute('inert');
  el.setAttribute('aria-hidden', 'false');
  document.body.classList.add('privacy-open');
  const scroll = $('#privacyScroll');
  if (scroll) scroll.scrollTop = 0;
  setTimeout(() => {
    const close = $('#privacyClose');
    if (close && el.classList.contains('open') && !$('.geo-ask, #intro.open')) { try { close.focus({ preventScroll: true }); } catch (e) {} }
  }, 200);
}
function closePrivacy() {
  const el = $('#privacy');
  if (!el || !el.classList.contains('open')) return;
  el.classList.remove('open');
  el.setAttribute('aria-hidden', 'true');
  el.setAttribute('inert', '');
  document.body.classList.remove('privacy-open');
  if (privacyLastFocus && typeof privacyLastFocus.focus === 'function') {
    try { privacyLastFocus.focus({ preventScroll: true }); } catch (e) {}
  }
}
function toggleScheme() {
  const current = resolveMode();
  S.mode = current === 'dark' ? 'light' : 'dark';
  applyTheme(true, $('#schemeBtn'));
  syncSegments();
  save();
}
function randomizeCat() {
  const genders = Object.keys(GENDERS);
  const breeds = Object.keys(BREEDS);
  const accs = Object.keys(ACCESSORIES).filter((k) => k !== 'none');
  S.cat.gender = pick(genders);
  const breed = pick(breeds);
  S.cat.breed = breed;
  const b = BREEDS[breed];
  S.cat.fur = b.fur;
  S.cat.belly = b.belly;
  S.cat.eyes = b.eyes;
  S.cat.patch = b.patch;
  S.cat.patch2 = b.patch2;
  S.cat.accessories = accs.sort(() => Math.random() - .5).slice(0, randInt(1, 2));
  S.cat.outfit = pick(Object.keys(OUTFITS).filter((k) => k !== 'none'));
  S.cat.collar = pick(COLLAR_SWATCHES);
  S.cat.collarOn = Math.random() < .85;
  updateCatVisuals();
  syncSettingsUI();
  previewPop();
  save();
  if (currentCatState() !== 'sleep') {
    setCatState('happy', { force: true });
    setTimeout(() => {
      if (!timer.running) setCatState('idle');
      updateStageMeta();
    }, 1700);
  }
  toast('Yeni bir Vespır doğdu.');
}
function armDanger(btn, confirmText, action) {
  if (!btn) return;
  let armed = false;
  let resetTimerId = 0;
  let original = btn.textContent;
  btn.addEventListener('click', () => {
    if (!armed) {
      armed = true;
      original = btn.textContent;
      btn.textContent = confirmText;
      btn.classList.add('armed');
      clearTimeout(resetTimerId);
      resetTimerId = setTimeout(() => {
        armed = false;
        btn.textContent = original;
        btn.classList.remove('armed');
      }, 3400);
      return;
    }
    armed = false;
    clearTimeout(resetTimerId);
    btn.textContent = original;
    btn.classList.remove('armed');
    action();
  });
}
async function resetEverything() {
  if (resetting) return;
  resetting = true;
  clearTimeout(saveTimer);
  saveTimer = 0;
  cancelAnimationFrame(timer.interval);
  timer.interval = 0;
  timer.running = false;
  stopFinishTimer();
  stopAutoStart();
  catReset();
  if (rewardActive) stopFocusReward();
  await Promise.all(['start', 'end'].map(async (kind) => {
    soundEpoch[kind]++;
    await soundWrites[kind];
    return dbDelete(kind);
  }));
  try { localStorage.removeItem('vespir.v1'); } catch (e) {}
  try { await caches.delete(MSG_PREFS_CACHE); } catch (e) {}
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg && reg.periodicSync) await reg.periodicSync.unregister('vespir-hello');
  } catch (e) {}
  location.reload();
}
function bindStaticEvents() {
  $('#focusInstallBtn').addEventListener('click', installForFocus);
  $('#focusSkipInstallBtn').addEventListener('click', skipFocusInstall);
  /* intro */
  const introStart = $('#introStart');
  if (introStart) introStart.addEventListener('click', () => finishIntro(false));
  const introCustomize = $('#introCustomize');
  if (introCustomize) introCustomize.addEventListener('click', () => finishIntro(true));
  const introClose = $('#introClose');
  if (introClose) introClose.addEventListener('click', () => finishIntro(false));
  /* top bar */
  const brand = $('#brandBtn');
  if (brand) brand.addEventListener('click', () => openSettings('cat'));
  const settingsBtn = $('#settingsBtn');
  if (settingsBtn) settingsBtn.addEventListener('click', () => openSettings('cat'));
  const soundBtn = $('#soundBtn');
  if (soundBtn) soundBtn.addEventListener('click', () => openSettings('sound'));
  const schemeBtn = $('#schemeBtn');
  if (schemeBtn) schemeBtn.addEventListener('click', toggleScheme);
  const themeBtn = $('#themeBtn');
  if (themeBtn) themeBtn.addEventListener('click', () => openSettings('look'));
  const installBtn2 = $('#installBtn2');
  if (installBtn2) installBtn2.addEventListener('click', promptInstall);
  const langGroup = $('#langGroup');
  if (langGroup) langGroup.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-lang]');
    if (btn) setLanguage(btn.dataset.lang);
  });
  /* timer */
  const startBtn = $('#startBtn');
  if (startBtn) startBtn.addEventListener('click', toggleTimer);
  const resetBtn = $('#resetBtn');
  if (resetBtn) resetBtn.addEventListener('click', resetTimer);
  const skipBtn = $('#skipBtn');
  if (skipBtn) skipBtn.addEventListener('click', skipBreak);
  const focusMinus = $('#focusMinus');
  if (focusMinus) focusMinus.addEventListener('click', () => setFocusMinutes(S.focusMin - 5));
  const focusPlus = $('#focusPlus');
  if (focusPlus) focusPlus.addEventListener('click', () => setFocusMinutes(S.focusMin + 5));
  const breakMinus = $('#breakMinus');
  if (breakMinus) breakMinus.addEventListener('click', () => setBreakMinutes(S.breakMin - 1));
  const breakPlus = $('#breakPlus');
  if (breakPlus) breakPlus.addEventListener('click', () => setBreakMinutes(S.breakMin + 1));
  /* settings shell */
  const close = $('#settingsClose');
  if (close) close.addEventListener('click', closeSettings);
  const backdrop = $('#settingsBackdrop');
  if (backdrop) backdrop.addEventListener('click', closeSettings);
  const aboutBtn = $('#aboutBtn');
  if (aboutBtn) aboutBtn.addEventListener('click', openAbout);
  const aboutClose = $('#aboutClose');
  if (aboutClose) aboutClose.addEventListener('click', closeAbout);
  const aboutBackdrop = $('#aboutBackdrop');
  if (aboutBackdrop) aboutBackdrop.addEventListener('click', closeAbout);
  const contactBtn = $('#contactBtn');
  if (contactBtn) contactBtn.addEventListener('click', openContact);
  const contactClose = $('#contactClose');
  if (contactClose) contactClose.addEventListener('click', closeContact);
  const contactBackdrop = $('#contactBackdrop');
  if (contactBackdrop) contactBackdrop.addEventListener('click', closeContact);
  const copyMail = $('#copyMail');
  if (copyMail) copyMail.addEventListener('click', copyMailAddress);
  const accountBtn = $('#accountBtn');
  if (accountBtn) accountBtn.addEventListener('click', openAccount);
  const accountClose = $('#accountClose');
  if (accountClose) accountClose.addEventListener('click', closeAccount);
  const accountBackdrop = $('#accountBackdrop');
  if (accountBackdrop) accountBackdrop.addEventListener('click', closeAccount);
  const privacyBtn = $('#privacyBtn');
  if (privacyBtn) privacyBtn.addEventListener('click', openPrivacy);
  const privacyClose = $('#privacyClose');
  if (privacyClose) privacyClose.addEventListener('click', closePrivacy);
  const privacyBackdrop = $('#privacyBackdrop');
  if (privacyBackdrop) privacyBackdrop.addEventListener('click', closePrivacy);
  const settingsScroll = $('#settingsScroll');
  if (settingsScroll) {
    let scrollEndTimer = 0;
    settingsScroll.addEventListener('scroll', () => {
      settingsScroll.classList.add('is-scrolling');
      clearTimeout(scrollEndTimer);
      scrollEndTimer = setTimeout(() => settingsScroll.classList.remove('is-scrolling'), 150);
    }, { passive: true });
  }
  const tabs = $('#settingsTabs');
  if (tabs) tabs.addEventListener('click', (e) => {
    const btn = e.target.closest('.tab-btn');
    if (btn) setSettingsTab(btn.dataset.tab);
  });
  /* cat */
  const nameInput = $('#catNameInput');
  if (nameInput) {
    nameInput.addEventListener('input', () => {
      const raw = nameInput.value.slice(0, 16);
      S.cat.name = raw.trim() ? raw.trim() : 'Vespır';
      updateCatVisuals();
      updateDocumentTitle();
      save();
    });
    nameInput.addEventListener('blur', () => { nameInput.value = S.cat.name; });
  }
  const catScaleRange = $('#catScaleRange');
  if (catScaleRange) {
    /* Sürükleme boyunca kısa süreli geçiş: kedi fareyi anında takip eder.
       Yalnızca GPU'daki transform değişir; sayfa yeniden yerleşmez. */
    let sizingTimer = 0;
    const endSizing = () => {
      clearTimeout(sizingTimer);
      sizingTimer = setTimeout(() => document.body.classList.remove('is-sizing'), 160);
    };
    const applyScale = (ev) => {
      document.body.classList.add('is-sizing');
      S.cat.scale = clamp(parseInt(catScaleRange.value, 10) / 100, .8, 1.2);
      updateCatVisuals();
      if (ev && ev.type === 'change') endSizing();
      else {
        clearTimeout(sizingTimer);
        sizingTimer = setTimeout(() => document.body.classList.remove('is-sizing'), 500);
      }
      save();
    };
    catScaleRange.addEventListener('input', applyScale);
    catScaleRange.addEventListener('change', applyScale);
    catScaleRange.addEventListener('pointerup', endSizing);
    catScaleRange.addEventListener('blur', endSizing);
  }
  const collarToggle = $('#collarToggle');
  if (collarToggle) collarToggle.addEventListener('change', () => {
    S.cat.collarOn = collarToggle.checked;
    updateCatVisuals();
    refreshSwatches();
    save();
  });
  const randomBtn = $('#randomCatBtn');
  if (randomBtn) randomBtn.addEventListener('click', randomizeCat);
  /* haptic */
  const hapticToggle = $('#hapticToggle');
  if (hapticToggle) hapticToggle.addEventListener('change', () => {
    S.haptic = hapticToggle.checked;
    save();
  });
  const perfToggle = $('#perfModeToggle');
  if (perfToggle) perfToggle.addEventListener('change', () => {
    S.perf = perfToggle.checked;
    applyPerfMode();
    save();
  });
  /* time */
  const sessionInput = $('#sessionNameInput');
  if (sessionInput) {
    sessionInput.addEventListener('input', () => {
      const raw = sessionInput.value.slice(0, 28);
      S.sessionName = raw.trim() ? raw.trim() : 'Derin Odak';
      updateSessionUI();
      save();
    });
    sessionInput.addEventListener('blur', () => { sessionInput.value = S.sessionName; syncSettingsUI(); });
  }
  const autoToggle = $('#autoStartToggle');
  if (autoToggle) autoToggle.addEventListener('change', () => { S.autoStart = autoToggle.checked; if (!S.autoStart && timer.phase === 'break') stopAutoStart(); save(); });
  const autoFocusToggle = $('#autoFocusToggle');
  if (autoFocusToggle) autoFocusToggle.addEventListener('change', () => { S.autoFocus = autoFocusToggle.checked; if (!S.autoFocus && timer.phase === 'focus') stopAutoStart(); save(); });
  /* Günlük hedef: hazır süreler kaldırıldı. "Düzenle" saat + dakika
     seçicisini açar; hedefi kullanıcı kendi kurar. */
  const goalPicker = $('#goalPicker');
  const goalEditBtn = $('#goalEditBtn');
  const goalHourOut = $('#goalHourOut');
  const goalMinOut = $('#goalMinOut');
  const goalSaveBtn = $('#goalSaveBtn');
  const goalDraft = { h: Math.floor((S.dailyGoal || 120) / 60), m: (S.dailyGoal || 120) % 60 };
  const paintGoalDraft = () => {
    goalDraft.h = clamp(goalDraft.h, 0, 12);
    goalDraft.m = clamp(goalDraft.m, 0, 59);
    if (goalHourOut) goalHourOut.textContent = String(goalDraft.h);
    if (goalMinOut) goalMinOut.textContent = pad2(goalDraft.m);
    if (goalSaveBtn) goalSaveBtn.disabled = goalDraft.h * 60 + goalDraft.m < 15;
  };
  const openGoalPicker = () => {
    if (!goalPicker) return;
    goalDraft.h = Math.floor((S.dailyGoal || 120) / 60);
    goalDraft.m = (S.dailyGoal || 120) % 60;
    paintGoalDraft();
    goalPicker.hidden = false;
    if (goalEditBtn) goalEditBtn.setAttribute('aria-expanded', 'true');
  };
  const closeGoalPicker = () => {
    if (!goalPicker) return;
    goalPicker.hidden = true;
    if (goalEditBtn) goalEditBtn.setAttribute('aria-expanded', 'false');
  };
  if (goalEditBtn) goalEditBtn.addEventListener('click', () => {
    if (goalPicker && goalPicker.hidden) openGoalPicker();
    else closeGoalPicker();
  });
  const goalCancelBtn = $('#goalCancelBtn');
  if (goalCancelBtn) goalCancelBtn.addEventListener('click', closeGoalPicker);
  if (goalPicker) goalPicker.addEventListener('click', (e) => {
    const step = e.target.closest('[data-goal-step]');
    if (!step) return;
    const dir = Number(step.dataset.dir) || 0;
    if (step.dataset.goalStep === 'hour') goalDraft.h += dir;
    else goalDraft.m += dir;
    paintGoalDraft();
  });
  if (goalSaveBtn) goalSaveBtn.addEventListener('click', () => {
    const total = goalDraft.h * 60 + goalDraft.m;
    S.dailyGoal = clamp(total < 15 ? 15 : total, 15, 720);
    updateGoalUI();
    save();
    closeGoalPicker();
    toast(S.lang === 'en' ? 'Daily goal updated.' : 'Günlük hedef güncellendi.');
  });
  /* PWA onarımı: bozuk bir kurulumdan sonra kalan servis kaydını ve
     önbellekleri temizler; uygulama temiz bir kabukla yeniden açılır. */
  const hourlyToggle = $('#hourlyToggle');
  if (hourlyToggle) hourlyToggle.addEventListener('change', () => {
    S.hourlyChime = hourlyToggle.checked;
    syncSettingsUI();
    save();
  });
  const hourlySound = $('#hourlyToggleSound');
  if (hourlySound) hourlySound.addEventListener('change', () => {
    S.hourlyChime = hourlySound.checked;
    syncSettingsUI();
    save();
  });
  const notifyToggle = $('#notifyToggle');
  if (notifyToggle) notifyToggle.addEventListener('change', async () => {
    if (notifyToggle.checked) {
      const ok = await ensureNotifyPermission();
      S.notify = ok;
      if (!ok) { notifyToggle.checked = false; }
    } else {
      S.notify = false;
    }
    updateNotifyStatus();
    save();
  });
  const notifyTestBtn = $('#notifyTestBtn');
  if (notifyTestBtn) notifyTestBtn.addEventListener('click', testNotification);
  const catMsgToggle = $('#catMsgToggle');
  if (catMsgToggle) catMsgToggle.addEventListener('change', async () => {
    S.catMessages = catMsgToggle.checked;
    save();
    if (S.catMessages && 'Notification' in window && Notification.permission === 'default') await ensureNotifyPermission();
    updateMsgStatus();
    syncMessageSchedule();
  });
  /* sound */
  const volRange = $('#volRange');
  if (volRange) {
    volRange.addEventListener('input', () => {
      S.volume = clamp(Number(volRange.value) / 100, 0, 1);
      volRange.style.setProperty('--fill', (S.volume * 100).toFixed(1) + '%');
      const out = $('#volVal');
      if (out) out.textContent = Math.round(S.volume * 100) + '%';
      setMasterVolume();
      save();
    });
    volRange.addEventListener('change', () => { initAudio(); synthChime(.7); });
  }
  const chimeVol = $('#chimeVolRange');
  if (chimeVol) {
    chimeVol.addEventListener('input', () => {
      S.chimeVolume = clamp(Number(chimeVol.value) / 100, 0, 1);
      chimeVol.style.setProperty('--fill', (S.chimeVolume * 100).toFixed(1) + '%');
      const out = $('#chimeVolVal');
      if (out) out.textContent = Math.round(S.chimeVolume * 100) + '%';
      save();
    });
    chimeVol.addEventListener('change', () => synthBell(S.chimeVolume));
  }
  const startTest = $('#startTestBtn');
  if (startTest) startTest.addEventListener('click', () => playCue('start'));
  const endTest = $('#endTestBtn');
  if (endTest) endTest.addEventListener('click', () => playCue('end'));
  const startFileBtn = $('#startFileBtn');
  if (startFileBtn) startFileBtn.addEventListener('click', () => $('#startFileInput').click());
  const endFileBtn = $('#endFileBtn');
  if (endFileBtn) endFileBtn.addEventListener('click', () => $('#endFileInput').click());
  const startFileInput = $('#startFileInput');
  if (startFileInput) startFileInput.addEventListener('change', async () => {
    await loadCustomFile('start', startFileInput.files && startFileInput.files[0]);
    startFileInput.value = '';
  });
  const endFileInput = $('#endFileInput');
  if (endFileInput) endFileInput.addEventListener('change', async () => {
    await loadCustomFile('end', endFileInput.files && endFileInput.files[0]);
    endFileInput.value = '';
  });
  const startClear = $('#startClearBtn');
  if (startClear) startClear.addEventListener('click', () => clearCustomSound('start'));
  const endClear = $('#endClearBtn');
  if (endClear) endClear.addEventListener('click', () => clearCustomSound('end'));
  const meowBtn = $('#meowBtn');
  if (meowBtn) meowBtn.addEventListener('click', () => catMeowNow());
  const chimeBtn = $('#chimeBtn');
  if (chimeBtn) chimeBtn.addEventListener('click', () => synthBell(clamp(S.chimeVolume, .2, 1)));
  const resetAllBtn = $('#resetAllBtn');
  if (resetAllBtn) armDanger(resetAllBtn, 'Her şey silinsin mi?', resetEverything);
  /* keyboard */
  document.addEventListener('keydown', (e) => {
    if (e.defaultPrevented) return;
    const geo = $('.geo-ask');
    if (geo) {
      if (e.key === 'Tab') trapPanelFocus(geo.querySelector('.geo-card') || geo, e);
      return;
    }
    const intro = $('#intro');
    if (intro && intro.classList.contains('open')) {
      if (e.key === 'Escape') { e.preventDefault(); finishIntro(false); }
      else if (e.key === 'Tab') trapPanelFocus(intro.querySelector('.intro-card') || intro, e);
      return;
    }
    const focusInvite = $('#focusInvite');
    if (focusInvite.classList.contains('open')) {
      if (e.key === 'Escape') { e.preventDefault(); skipFocusInstall(); }
      else if (e.key === 'Tab') trapPanelFocus(focusInvite.querySelector('.focus-invite-panel'), e);
      return;
    }
    if (e.key === 'Escape' && document.body.classList.contains('focus-active')) {
      e.preventDefault();
      pauseTimer();
      return;
    }
    if (e.key === 'Escape') {
      const account = $('#account');
      if (account && account.classList.contains('open')) { closeAccount(); return; }
      const privacy = $('#privacy');
      if (privacy && privacy.classList.contains('open')) { closePrivacy(); return; }
      const contact = $('#contact');
      if (contact && contact.classList.contains('open')) { closeContact(); return; }
      const about = $('#about');
      if (about && about.classList.contains('open')) { closeAbout(); return; }
      const settings = $('#settings');
      if (settings && settings.classList.contains('open')) { closeSettings(); return; }
    }
    if (e.key === 'Tab') {
      const account = $('#account');
      if (account && account.classList.contains('open')) {
        trapPanelFocus(account.querySelector('.about-card') || account, e);
        return;
      }
      const privacy = $('#privacy');
      if (privacy && privacy.classList.contains('open')) {
        trapPanelFocus(privacy.querySelector('.about-card') || privacy, e);
        return;
      }
      const contact = $('#contact');
      if (contact && contact.classList.contains('open')) {
        trapPanelFocus(contact.querySelector('.about-card') || contact, e);
        return;
      }
      const about = $('#about');
      if (about && about.classList.contains('open')) {
        trapPanelFocus(about.querySelector('.about-card') || about, e);
        return;
      }
      const settings = $('#settings');
      if (settings && settings.classList.contains('open')) {
        trapPanelFocus(settings.querySelector('.settings-panel'), e);
        return;
      }
    }
    const account = $('#account');
    if (account && account.classList.contains('open')) return;
    const privacy = $('#privacy');
    if (privacy && privacy.classList.contains('open')) return;
    const contact = $('#contact');
    if (contact && contact.classList.contains('open')) return;
    const about = $('#about');
    if (about && about.classList.contains('open')) return;
    const settings = $('#settings');
    if (settings && settings.classList.contains('open')) return;
    const t = e.target;
    const tag = (t && t.tagName ? t.tagName : '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || (t && t.isContentEditable)) return;
    if (e.code === 'Space') {
      if (t && t.closest && t.closest('button, a')) return;
      e.preventDefault();
      toggleTimer();
    } else if ((e.key === 'r' || e.key === 'R') && !e.ctrlKey && !e.metaKey && !e.altKey) {
      resetTimer();
    }
  });
  /* page lifecycle */
  window.addEventListener('beforeunload', () => { if (timer.running) persistTimer(); else if (saveTimer) saveNow(); });
  window.addEventListener('pagehide', () => { if (timer.running) persistTimer(); else if (saveTimer) saveNow(); });
  document.addEventListener('visibilitychange', () => {
    syncSceneEffects();
    if (document.visibilityState === 'hidden') {
      if (timer.running) persistTimer();
      else if (saveTimer) saveNow();
    } else if (timer.running) {
      timerTick();
    }
  });
  if (window.matchMedia) {
    try {
      const mq = matchMedia('(prefers-color-scheme: dark)');
      const onChange = () => { if (S.mode === 'auto') applyTheme(true); };
      if (mq.addEventListener) mq.addEventListener('change', onChange);
      else if (mq.addListener) mq.addListener(onChange);
    } catch (e) {}
  }
}
/* ============================================================
   AÇILIŞ
   ============================================================ */
function prepareSoundState() {
  const valid = SOUND_OPTIONS.map((o) => o.id).concat('custom');
  if (!valid.includes(S.startSound)) S.startSound = 'chime';
  if (!valid.includes(S.endSound)) S.endSound = 'meow';
  if (S.startSound === 'custom' && !customSounds.start) S.startSound = 'chime';
  if (S.endSound === 'custom' && !customSounds.end) S.endSound = 'meow';
}
/* Ana ekranı tam ortalar: masaüstünde kartın gerçek yüksekliğini ölçüp
   üst çubuk ile alt bilgi arasındaki alana sığdırır. Böylece ne kırpılma
   ne de kaydırma olur; kart her zaman aynı yerde durur. */
let stageFitRaf = 0;
function fitStage() {
  const col = $('.stage-col');
  const card = $('#timerCard');
  if (!col || !card) return;
  if (document.body.classList.contains('focus-active')) return;
  /* Dikey mobilde kart sağ sütunda sabit durur: ölçekleme ve ortalama gerekmez. */
  if (innerWidth <= 768 && innerHeight >= innerWidth) {
    if (col.style.getPropertyValue('--stage-fit')) col.style.removeProperty('--stage-fit');
    if (col.style.getPropertyValue('--stage-top')) col.style.removeProperty('--stage-top');
    return;
  }
  const app = $('main.app');
  const vh = app && app.clientHeight ? app.clientHeight : innerHeight;
  let top, bottom;
  if (innerWidth >= 901) {
    const topbar = $('.topbar');
    top = (topbar ? topbar.getBoundingClientRect().bottom : 0) + 14;
    bottom = 22;
  } else {
    /* Mobil: üstteki kedi sahnesinin altından başla, alt güvenli alanı koru. */
    const cs = app ? getComputedStyle(app) : null;
    top = (parseFloat(cs ? cs.paddingTop : 0) || 0) + 6;
    bottom = (parseFloat(cs ? cs.paddingBottom : 0) || 0) + 8;
  }
  const avail = Math.max(220, vh - top - bottom);
  const scale = Math.max(.4, Math.min(1, avail / Math.max(1, card.offsetHeight)));
  const fit = scale.toFixed(4);
  const stageTop = Math.round(top + avail / 2) + 'px';
  if (col.style.getPropertyValue('--stage-fit') !== fit) col.style.setProperty('--stage-fit', fit);
  if (col.style.getPropertyValue('--stage-top') !== stageTop) col.style.setProperty('--stage-top', stageTop);
  invalidateSnowSurface();
}
function queueFitStage() {
  if (stageFitRaf) cancelAnimationFrame(stageFitRaf);
  stageFitRaf = requestAnimationFrame(() => { stageFitRaf = 0; fitStage(); });
}
function runSelfTest() {
  const issues = [];
  const required = ['#startBtn', '#resetBtn', '#ringProgress', '#catMount .cat-wrap', '#settings', '#themeGrid .theme-card', '#catBubble', '#sessionNameInput', '#quickFocus'];
  required.forEach((sel) => { if (!$(sel)) issues.push('eksik ' + sel); });
  if (!timer || typeof timer.remaining !== 'number') issues.push('zamanlayıcı yok');
  if (!S || !S.cat) issues.push('ayarlar yok');
  document.documentElement.dataset.vespirReady = '1';
  document.documentElement.dataset.vespirIssues = issues.join(' | ');
  try {
    const card = $('#timerCard');
    const r = card ? card.getBoundingClientRect() : null;
    const cs = card ? getComputedStyle(card) : null;
    document.documentElement.dataset.vespirLayout = JSON.stringify({
      vw: innerWidth, vh: innerHeight,
      card: r ? { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), opacity: cs.opacity, display: cs.display, animation: cs.animationName } : null
    });
  } catch (e) {}
  try { console.log('[Vespir] hazır', { issues, theme: S.theme, phase: timer.phase, remaining: Math.round(timer.remaining), cat: S.cat.name }); } catch (e) {}
}
window.addEventListener('error', (e) => {
  try {
    const list = (document.documentElement.dataset.vespirErrors || '').split('|').filter(Boolean);
    list.push(String(e.message || 'hata'));
    document.documentElement.dataset.vespirErrors = list.slice(-4).join('|');
  } catch (err) {}
});
/* Kasma koruması: sekme gizliyken CSS animasyonları durur; ölçülen kare hızı art arda
   iki pencerede düşükse ağır süslemeler (lowfx) kendiliğinden kapanır ve hatırlanır.
   Ana animasyonlar kalır. Elle sıfırlamak için adrese ?lowfx=0 eklenir. */
(function perfGuard() {
  const html = document.documentElement;
  const syncHidden = () => { html.dataset.hidden = document.hidden ? '1' : '0'; };
  document.addEventListener('visibilitychange', syncHidden);
  syncHidden();
  try { if (new URLSearchParams(location.search).get('lowfx') === '0') localStorage.removeItem('vespir.lowfx'); } catch (e) {}
  /* Elle yapılan seçim (açık ya da kapalı) otomatik ölçümle ezilmez. */
  let manualPerf = '';
  try { manualPerf = localStorage.getItem('vespir.lowfx') || ''; } catch (e) {}
  if (manualPerf === '1' || manualPerf === '0') return;
  let bad = 0;
  const measure = () => {
    if (html.dataset.lowfx === '1') return;
    if (document.hidden) { setTimeout(measure, 8000); return; }
    let last = 0, sum = 0, n = 0;
    const step = (t) => {
      if (document.hidden) { setTimeout(measure, 8000); return; }
      if (last) { sum += t - last; n++; }
      last = t;
      if (n < 90) { requestAnimationFrame(step); return; }
      bad = sum / n > 26 ? bad + 1 : 0;
      if (bad >= 2) {
        html.dataset.lowfx = '1';
        try { localStorage.setItem('vespir.lowfx', '1'); } catch (e) {}
        return;
      }
      setTimeout(measure, 10000);
    };
    requestAnimationFrame(step);
  };
  setTimeout(measure, 6000);
})();
async function boot() {
  const qp = new URLSearchParams(location.search);
  if (qp.has('nointro') || qp.has('start') || qp.has('pane') || qp.has('test') || qp.has('phase') || qp.has('action')) S.welcomed = true;
  if (THEMES[qp.get('theme')]) S.theme = qp.get('theme');
  /* ?halloween=1 ile gelindiyse tema doğrudan Cadılar Bayramı'na çevrilir ki
     tüm içerik (kıyafet, aksesuar, korku sahnesi) ilk karede görünsün. */
  if (qp.has('halloween')) {
    const hv = (qp.get('halloween') || '').toLowerCase();
    if (hv !== '0' && hv !== 'false' && hv !== 'off') S.theme = 'halloween';
  }
  if (['light', 'dark', 'auto'].includes(qp.get('mode'))) S.mode = qp.get('mode');
  /* Kayıtlı performans tercihi ilk kare kararını da düzeltsin; önbellekteki
     kopya da aynı kalsın ki bir sonraki açılış doğru kareyle başlasın. */
  if (S.perf === true || S.perf === false) {
    document.documentElement.dataset.lowfx = S.perf ? '1' : '0';
    try { localStorage.setItem('vespir.lowfx', S.perf ? '1' : '0'); } catch (e) {}
  }
  await restorePersistedSounds();
  prepareSoundState();
  /* Ayar DOM'u ilk açılışta kurulur; boş zamanda önceden hazırlanır.
     Açılış karesinde yüzlerce düğüm oluşturmak yerine sahne hemen çizilir. */
  const buildSettingsLater = () => buildSettingsUI();
  if ('requestIdleCallback' in window) requestIdleCallback(buildSettingsLater, { timeout: 1600 });
  else setTimeout(buildSettingsLater, 700);
  const resumed = restoreTimer();
  renderCats();
  /* Karşılama kedisi, kart süzülmeye başlamadan boş zamanda kurulsun:
     açılış anında onlarca düğüm oluşturmak süzülmeyi geciktirmesin. */
  if (!S.welcomed) {
    const warmIntro = () => { if (!S.welcomed) ensureIntroCat(); };
    if ('requestIdleCallback' in window) requestIdleCallback(warmIntro, { timeout: 900 });
    else setTimeout(warmIntro, 420);
  }
  renderCycleDots();
  initFx();
  applyTheme(false);
  applyAtmosphere();
  syncTimerChrome();
  updateTimerDisplay(true);
  updateSessionUI();
  updateStatsUI();
  syncSettingsUI();
  /* Ayar panelinin ilk boyanması burada, sayfa hâlâ açılırken yapılır.
     Sonradan kullanıcının gözü önünde bir kare donmasın. */
  /* Açılış süzülmesi (≈1,15 sn) bitmeden ağır, görünmeyen işler (ayar paneli boyaması, PWA, hava)
     yapılmaz: animasyonun ilk karelerinde ana iş parçacığı boş kalır. Sonra boş zamanda çalışır. */
  const lateBoot = () => { warmSettingsPanel(); setupPWA(); bootWeather(); };
  setTimeout(() => {
    if ('requestIdleCallback' in window) requestIdleCallback(lateBoot, { timeout: 800 });
    else lateBoot();
  }, 1200);
  bindStaticEvents();
  syncSceneEffects();
  /* Seçili dil düğmesi açılışta da işaretli olsun; İngilizce kayıtlıysa arayüz de çevrilsin. */
  syncLangButtons();
  if (S.lang === 'en') refreshLanguageChrome();
  fitStage();
  requestAnimationFrame(fitStage);
  setTimeout(fitStage, 620);
  window.addEventListener('resize', queueFitStage, { passive: true });
  window.addEventListener('orientationchange', () => setTimeout(fitStage, 220), { passive: true });
  if ('ResizeObserver' in window) {
    try { new ResizeObserver(queueFitStage).observe($('#timerCard')); } catch (e) {}
  }
  if (resumed) {
    const resumedEndAt = timer.endAt, resumedPhase = timer.phase;
    let resumedEpoch = catEpoch;
    const stillResumed = () => timer.running && timer.endAt === resumedEndAt && timer.phase === resumedPhase && catEpoch === resumedEpoch;
    setTimeout(() => {
      if (!stillResumed()) return;
      if (timer.phase === 'focus') beginFocusCat(); else beginBreakCat();
      resumedEpoch = catEpoch;
    }, 900);
    setTimeout(() => {
      if (stillResumed() && timer.phase === 'focus') showBubble('kaldığımız yerden devam. miyav.', { duration: 3000 });
    }, 1500);
    toast('Kaldığın yerden devam ediyoruz.');
  }
  if (qp.get('pane')) setTimeout(() => openSettings(qp.get('pane')), 620);
  if (qp.get('start') === '1' || qp.get('action') === 'start') setTimeout(() => { if (!timer.running) startTimer(); }, 720);
  if (qp.get('action') === 'settings') setTimeout(() => openSettings('cat'), 620);
  if (qp.get('phase') === 'break') setTimeout(() => { if (!timer.running) { setPhase('break', false); startTimer(); } }, 720);
  if (qp.get('test') === 'complete') {
    setTimeout(() => {
      timer.phase = 'focus';
      timer.total = 60;
      timer.remaining = 60;
      timer.running = true;
      timer.endAt = Date.now() - 120;
      finishPhase();
      setTimeout(() => {
        document.documentElement.dataset.vespirTest = JSON.stringify({
          phase: timer.phase,
          sessions: S.stats.sessions,
          sec: S.stats.sec,
          celebrate: $('#celebrate').classList.contains('show'),
          bubble: $('#catBubble').classList.contains('show')
        });
      }, 650);
    }, 700);
  }
  setTimeout(maybeIntro, 560);
  const selfTestLater = () => runSelfTest();
  if ('requestIdleCallback' in window) requestIdleCallback(selfTestLater, { timeout: 2400 });
  else setTimeout(selfTestLater, 1400);
  /* Ses bağlamının ~130 ms'lik kurulumu ilk "Başla" tıklamasına binmesin:
     boş zamanda hazırlanır, kullanıcı dokunduğunda yalnızca resume edilir.
     Miyav kaydı da burada çözülür; ilk miyav beklemeden gerçek sesle çalar. */
  const prewarmAudio = () => {
    const c = audioCtx();
    if (c) decodeMeowSample(c);
  };
  if ('requestIdleCallback' in window) requestIdleCallback(prewarmAudio, { timeout: 900 });
  else setTimeout(prewarmAudio, 700);
}
window.Vespir = {
  get settings() { return S; },
  get timer() { return timer; },
  start: startTimer,
  pause: pauseTimer,
  reset: resetTimer,
  skipBreak,
  setPhase,
  playCue,
  get audio() { return AC; }
};
boot();

/* Hakkında bölümündeki Noel görseli yüklenemezse (dosya eksik/bozuksa)
   tarayıcının bozuk resim simgesi görünmesin diye kutu gizlenir; alt metin
   ekran okuyucuda kalır. Görsel yüklenirse hiçbir şey değişmez. */
(function () {
  function guardAboutImage() {
    var img = document.querySelector('img.about-cta-img');
    if (!img) return;
    function hide() { if (img.parentElement) img.parentElement.style.display = 'none'; }
    img.addEventListener('error', hide);
    if (img.complete && img.naturalWidth === 0) hide();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', guardAboutImage);
  else guardAboutImage();
})();
