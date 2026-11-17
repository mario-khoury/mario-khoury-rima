// Offline support: the game page is saved first, then the photo packs one by one in the background.
const C='spy-v4';
const CORE=['./','index.html','manifest.json','icon-192.png','icon-512.png','apple-touch-icon.png'];
const PHOTOS=['photos/places.json','photos/food.json','photos/jobs.json','photos/animals.json','photos/sports-hobbies.json','photos/things.json'];

async function savePhotos(){
  const c=await caches.open(C);
  for(const f of PHOTOS){
    if(await c.match(f))continue;
    try{const r=await fetch(f,{cache:'no-cache'});if(r.ok)await c.put(f,r);}catch(e){}
  }
}
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(CORE)));});
self.addEventListener('activate',e=>e.waitUntil(
  caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k))))
  .then(()=>self.clients.claim()).then(savePhotos)));
self.addEventListener('message',e=>{if(e.data==='save-photos')e.waitUntil(savePhotos());});
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET'||new URL(req.url).origin!==location.origin)return;
  e.respondWith((async()=>{
    const c=await caches.open(C);
    const hit=await c.match(req,{ignoreSearch:true})||(req.mode==='navigate'?await c.match('./'):null);
    const net=fetch(req).then(r=>{if(r.ok&&r.type==='basic')c.put(req,r.clone());return r;});
    if(hit){net.catch(()=>{});return hit;}
    return net.catch(()=>new Response('',{status:504}));
  })());
});
