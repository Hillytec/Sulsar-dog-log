var CACHE = 'k9fieldlog-v21';
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
  if(e.request.method==='GET' && url.origin === location.origin){
    /* network first (so a new version shows on the very next open), cache as the offline fallback */
    e.respondWith(
      new Promise(function(resolve, reject){
        var done = false;
        var timer = setTimeout(function(){ if(!done){ done = true; reject(new Error('slow network')); } }, 3500);
        fetch(e.request).then(function(res){
          if(done) return;
          done = true; clearTimeout(timer);
          var resClone = res.clone();
          caches.open(CACHE).then(function(c){ c.put(e.request, resClone); });
          resolve(res);
        }).catch(function(err){ if(!done){ done = true; clearTimeout(timer); reject(err); } });
      }).catch(function(){
        return caches.match(e.request).then(function(cached){ return cached || fetch(e.request); });
      })
    );
  }
  /* cross-origin requests (map tiles, fonts, weather API) go straight to the network */
});
