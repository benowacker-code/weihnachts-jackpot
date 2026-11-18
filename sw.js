/* Weihnachts-Jackpot – Service Worker (Cache-first, versioniert). Version: e5703b0bdb41 */
const CACHE='wj-e5703b0bdb41';
const FILES=["./", "index.html", "manifest.webmanifest", "icons/apple-touch-icon.png", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png", "icons/favicon-32.png", "music/deck-the-halls.mp3", "music/azure.mp3", "music/this-is-christmas.mp3", "music/merry-early-christmas.mp3", "music/christmas-shopping-centre.mp3", "music/bells-of-yuletides-past.mp3", "music/a-cloudy-morning.mp3", "music/gingerbread-waltz.mp3", "music/hope-for-the-year.mp3", "music/faster-does-it.mp3", "music/jingle-em-bell-ish.mp3", "music/top-of-the-tower.mp3", "music/a-conversation-with-saul.mp3"];
self.addEventListener('install',e=>{
  // alles (auch die Musik) bei der Installation laden; ohne HTTP-Cache, damit ein Update wirklich neu lädt
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES.map(f=>new Request(f,{cache:'reload'})))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('wj-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
// Admin → Infos fragt: Wie viele Dateien der Liste liegen im Cache? („Offline bereit: ja/nein“)
self.addEventListener('message',e=>{
  if(!e.data||e.data.type!=='wj-status')return;
  e.waitUntil((async()=>{
    let have=0;try{const c=await caches.open(CACHE);for(const f of FILES)if(await c.match(f,{ignoreSearch:true}))have++;}catch(_){}
    if(e.source)e.source.postMessage({type:'wj-status',version:CACHE,have,total:FILES.length});
  })());
});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);if(u.origin!==self.location.origin)return;
  e.respondWith((async()=>{
    const c=await caches.open(CACHE);
    const hit=await c.match(r,{ignoreSearch:true});if(hit)return hit;
    if(r.mode==='navigate'){const idx=await c.match('index.html')||await c.match('./');if(idx)return idx;}
    try{const res=await fetch(r);if(res&&res.ok&&res.type==='basic')c.put(r,res.clone());return res;}
    catch(err){if(r.mode==='navigate'){const idx=await c.match('index.html');if(idx)return idx;}throw err;}
  })());
});
