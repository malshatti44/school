const C='tt-v1';const F=['./','./index.html','./app.js','./manifest.json','./icon.svg','./vendor/xlsx.full.min.js'];
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>Promise.allSettled(F.map(u=>c.add(u)))).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(fetch(e.request).then(r=>{const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp));return r}).catch(()=>caches.match(e.request)))});
