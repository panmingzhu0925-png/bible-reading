const CACHE="bible-reading-v18-all-family-branches";
const ASSETS=["./","./index.html","./genealogy-images.html","./family-tree/index.html","./family-tree/app.css?v=18","./family-tree/style.css?v=18","./family-tree/app.js?v=18","./family-tree/compact-layout.js?v=18","./family-tree/tree-data.js?v=18","./family-tree/vendor/echarts.min.js","./manifest.webmanifest","./people-data.js?v=18","./people-data.json","./people-index/index.html","./people-index/app.css?v=18","./people-index/app.js?v=18","./people-index/data.js?v=18","./people-index/local-data.js?v=18","./icons/icon-180.png","./icons/icon-192.png","./icons/icon-512.png","./assets/genealogy-front-transparent.png","./assets/genealogy-back-transparent.png"];
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
