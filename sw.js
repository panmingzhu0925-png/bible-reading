const CACHE="bible-reading-v12-family-trees-expanded";
const ASSETS=["./","./index.html","./genealogy-images.html","./family-tree/index.html","./family-tree/app.css","./family-tree/app.js?v=12","./family-tree/data.js","./family-tree/vendor/echarts.min.js","./manifest.webmanifest","./people-data.js","./people-data.json","./icons/icon-180.png","./icons/icon-192.png","./icons/icon-512.png","./assets/genealogy-front-transparent.png","./assets/genealogy-back-transparent.png"];
const assetURL=path=>new URL(path,self.location.href).href;

self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE)
    .then(cache=>cache.addAll(ASSETS.map(path=>new Request(assetURL(path),{cache:"reload"}))))
    .then(()=>self.skipWaiting()));
});
self.addEventListener("activate",event=>{
  event.waitUntil(caches.keys()
    .then(keys=>Promise.all(keys.filter(key=>key.startsWith("bible-reading-")&&key!==CACHE).map(key=>caches.delete(key))))
    .then(()=>self.clients.claim()));
});
self.addEventListener("fetch",event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=="GET"||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    if(request.mode==="navigate"){
      try{
        const response=await fetch(request,{cache:"no-cache"});
        if(response.ok)await cache.put(request,response.clone()).catch(()=>{});
        return response;
      }catch{
        return await cache.match(request,{ignoreSearch:true})||await cache.match(assetURL("./index.html"))||Response.error();
      }
    }
    const cached=await cache.match(request);
    if(cached)return cached;
    try{
      const response=await fetch(request);
      if(response.ok)await cache.put(request,response.clone()).catch(()=>{});
      return response;
    }catch{return Response.error();}
  })());
});
