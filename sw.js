var CACHE = 'k9fieldlog-v4';
var ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-180.png'];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(ASSETS); }));
  self.skipWaiting();
});

self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k!==CACHE; }).map(function(k){ return caches.delete(k); }));
  }));
  self.clients.claim();
});

self.addEventListener('fetch', function(e){
  var url = new URL(e.request.url);
  if(url.origin === location.origin){
    e.respondWith(
      caches.match(e.request).then(function(cached){
        var fetchPromise = fetch(e.request).then(function(res){
          var resClone = res.clone();
          caches.open(CACHE).then(function(c){ c.put(e.request, resClone); });
          return res;
        }).catch(function(){ return cached; });
        return cached || fetchPromise;
      })
    );
  }
  /* cross-origin requests (map tiles, fonts, weather API) go straight to the network */
});
