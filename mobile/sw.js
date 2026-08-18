const CACHE='oakline-mobile-beta1-v1';
const STATIC=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(STATIC)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const u=new URL(e.request.url);
  if(u.pathname.includes('/api/'))return;
  e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request)));
});
self.addEventListener('push',e=>{
  let data={};try{data=e.data?e.data.json():{}}catch{data={title:'Oakline Mobile',body:e.data?.text()||'Oakline update'}}
  e.waitUntil((async()=>{
    if('setAppBadge' in self.navigator && Number.isFinite(Number(data.badgeCount))){try{await self.navigator.setAppBadge(Number(data.badgeCount))}catch{}}
    await self.registration.showNotification(data.title||'Oakline Mobile',{
      body:data.body||'New Oakline update',icon:'./icon-192.png',badge:'./icon-192.png',
      tag:data.tag||'oakline-update',renotify:true,
      data:{url:data.url||'/mobile/',requestId:data.requestId||null}
    });
  })());
});
self.addEventListener('notificationclick',e=>{
  e.notification.close();
  const target=new URL(e.notification.data?.url||'/mobile/',self.location.origin).href;
  e.waitUntil((async()=>{
    const list=await clients.matchAll({type:'window',includeUncontrolled:true});
    for(const c of list){
      if(c.url.startsWith(self.location.origin+'/mobile/')){
        await c.focus();c.postMessage({type:'OPEN_REQUEST',requestId:e.notification.data?.requestId||null});return;
      }
    }
    await clients.openWindow(target);
  })());
});
