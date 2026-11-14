const CACHE='routely-shell-v3';
const ASSETS=['./','./index.html','./styles.css','./app.js','./manifest.webmanifest','./icon.svg'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  const requestUrl=new URL(event.request.url);
  // Do not intercept third-party requests (maps, geocoding, currency APIs).
  if(requestUrl.origin!==self.location.origin) return;
  event.respondWith(caches.match(event.request).then(cached=>{
    if(cached) return cached;
    return fetch(event.request).then(response=>{
      if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}
      return response;
    }).catch(()=>{
      if(event.request.mode==='navigate') return caches.match('./index.html');
      return Response.error();
    });
  }));
});
