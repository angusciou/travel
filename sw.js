// 更新網頁後，把版本號 +1，使用者下次開啟就會換成新版
const VER = 'ledger-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VER).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VER).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET') return;
  if (u.hostname.endsWith('supabase.co') || u.hostname.endsWith('supabase.in') || u.hostname === 'open.er-api.com') return;   // 資料與匯率一律走網路，不快取
  if (r.mode === 'navigate') {                                   // 頁面：優先連網取得最新版，離線時用快取
    e.respondWith(fetch(r).then(res => { const cp = res.clone(); caches.open(VER).then(c => c.put('./index.html', cp)); return res; }).catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(r).then(hit => hit || fetch(r).then(res => {   // 靜態資源（含 CDN 套件與字型）：快取優先
    if (res.ok || res.type === 'opaque') { const cp = res.clone(); caches.open(VER).then(c => c.put(r, cp)); }
    return res;
  })));
});
