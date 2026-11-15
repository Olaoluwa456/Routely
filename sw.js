'use strict';
const CACHE='routely-shell-v4';
const ASSETS=['./','./index.html','./styles.css','./app.js','./manifest.webmanifest','./icon.svg'];
self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(CACHE);await cache.addAll(ASSETS);await self.skipWaiting()})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(key=>key.startsWith('routely-shell-')&&key!==CACHE).map(key=>caches.delete(key)));await self.clients.claim()})()));
self.addEventListener('fetch',event=>{
 const req=event.request;if(req.method!=='GET')return;
 const url=new URL(req.url);if(url.origin!==self.location.origin)return;
 // Never cache navigational query strings or non-shell content. App data stays in browser storage.
 if(req.mode==='navigate'){
  event.respondWith((async()=>{try{const fresh=await fetch(req,{cache:'no-store'});return fresh}catch{return (await caches.match('./index.html'))||Response.error()}})());return;
 }
 if(!ASSETS.some(path=>new URL(path,self.location.href).pathname===url.pathname))return;
 event.respondWith((async()=>{const cached=await caches.match(req);if(cached)return cached;try{const response=await fetch(req);if(response.ok&&response.type==='basic'){const cache=await caches.open(CACHE);await cache.put(req,response.clone())}return response}catch{return Response.error()}})());
});
