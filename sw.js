// 오프라인 실행용: 새 버전을 배포하면 VERSION 값을 올려주세요
const VERSION="dsm-rank-v2";
const FILES=["./","./index.html","./manifest.webmanifest","./icon-192.png","./icon-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
// 페이지는 네트워크 우선(최신 버전), 실패하면 캐시. 나머지는 캐시 우선.
self.addEventListener("fetch",e=>{
  const req=e.request;if(req.method!=="GET")return;
  if(req.mode==="navigate"){e.respondWith(fetch(req).then(r=>{const c=r.clone();caches.open(VERSION).then(x=>x.put("./index.html",c));return r}).catch(()=>caches.match("./index.html")));return}
  e.respondWith(caches.match(req).then(r=>r||fetch(req)));
});
