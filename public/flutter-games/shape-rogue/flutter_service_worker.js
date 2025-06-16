'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';

const RESOURCES = {"flutter_bootstrap.js": "aef9f17812504d2c2cb68c4dc463e738",
"version.json": "ee455e2727d27ff4960d48e974941d86",
"index.html": "cc63c0ea676c5e76390eff440605b5f5",
"/": "cc63c0ea676c5e76390eff440605b5f5",
"main.dart.js": "d0f93a2e862034b86dceacaba71cff04",
"flutter.js": "f393d3c16b631f36852323de8e583132",
"favicon.png": "5dcef449791fa27946b3d35ad8803796",
"icons/Icon-192.png": "ac9a721a12bbc803b44f645561ecb1e1",
"icons/Icon-maskable-192.png": "c457ef57daa1d16f64b27b786ec2ea3c",
"icons/Icon-maskable-512.png": "301a7604d45b3e739efc881eb04896ea",
"icons/Icon-512.png": "96e752610906ba2a93c65f8abe1645f1",
"manifest.json": "8603aa4f3e262f6c9ad9c34543921bc5",
"assets/AssetManifest.json": "ae093142ec683a70e0e586c4d9d5d817",
"assets/NOTICES": "aea21e1a178b8782b3a282922b011e36",
"assets/FontManifest.json": "dc3d03800ccca4601324923c0b1d6d57",
"assets/AssetManifest.bin.json": "83f7ed78585247ec0f6c342d86b79b24",
"assets/packages/cupertino_icons/assets/CupertinoIcons.ttf": "e986ebe42ef785b27164c36a9abc7818",
"assets/shaders/ink_sparkle.frag": "ecc85a2e95f5e9f53123dcaf8cb9b6ce",
"assets/AssetManifest.bin": "3e17538bd4759e17117495fd397d124a",
"assets/fonts/MaterialIcons-Regular.otf": "010412ab026924422ef5e57453099f2b",
"assets/assets/config/items.json": "f4c7f306917b63cc13c75974fb7f77f9",
"assets/assets/config/heroes.json": "87b01401f7dc7d9f6a66d06e082b7eb5",
"assets/assets/config/waves.json": "a41cfa4b5d613750d9cb97031d8e5f05",
"assets/assets/images/background1.png": "8cec5eed74e03e7fbdb6d4c0a575e104",
"assets/assets/images/attack_speed_transparent.png": "81163c0d59b278f3ae1ac498108b54d6",
"assets/assets/images/ability_mastery.png": "d84711254a82287f83c8d1f6e540d432",
"assets/assets/images/ability_mastery_transparent.png": "664955b42e7026831168030d18416930",
"assets/assets/images/max_health_up_transparent.png": "01e2df9a51bd24c187f2832e6fc0e24b",
"assets/assets/images/speed_boost.png": "a3f4bdc3a1c78a1c3eefba11a720f9da",
"assets/assets/images/speed_boost_transparent.png": "7122496e225438ef95b70cbafca128ce",
"assets/assets/images/attack_speed.png": "7c0745bc977f30e950a989d89e6f4c2a",
"assets/assets/images/max_health_up.png": "cceb754d62a7048666965f058c78cb5b",
"assets/assets/images/health_potion_transparent.png": "33fb51395db12c88f29379ae154484dc",
"assets/assets/audio/shield_bash_trim.mp3": "ddf91d23cb2cb0157cf5a2279c0e389f",
"assets/assets/audio/fail.mp3": "6ccea966be0bf61ae50218b6eee6a00c",
"assets/assets/audio/shield_bash.mp3": "f8eba728924bda30f5387fa4cb85ba78",
"assets/assets/audio/spike_shot.mp3": "b3eef1e0842d29607136c9ea3cbf8191",
"assets/assets/audio/hex_field.mp3": "b5b7b5de0f3e883a6fd0fe096eb76d48",
"assets/assets/audio/dash_trim.mp3": "9cbc798f7127c6780b19773347165e12",
"assets/assets/audio/clear.m4a": "01a079cc2f7a3f588ad8688e44be0799",
"assets/assets/audio/star_flare_trim.mp3": "05639cef79d38f9424c662b8de8bcd87",
"assets/assets/audio/clear.mp3": "f40ebba5180ea24638147245fc62d277",
"assets/assets/audio/spike_shot_trim.mp3": "db6475324f90113858e55de24b028b25",
"assets/assets/audio/victory.mp3": "82997a274733ad4a15a383ad772105cc",
"assets/assets/audio/dash.mp3": "7bd6110bccd6652b0a7d4f455ddec714",
"assets/assets/audio/purchase.mp3": "47e3f05d428af4e1db614c7b7a393470",
"assets/assets/audio/Geometric%2520Pulse.mp3": "3197ca70bd3b527552da6954f581655b",
"assets/assets/audio/star_flare.mp3": "5464543b9aad4e6c3a000cfafd36dfeb",
"canvaskit/skwasm.js": "694fda5704053957c2594de355805228",
"canvaskit/skwasm.js.symbols": "262f4827a1317abb59d71d6c587a93e2",
"canvaskit/canvaskit.js.symbols": "48c83a2ce573d9692e8d970e288d75f7",
"canvaskit/skwasm.wasm": "9f0c0c02b82a910d12ce0543ec130e60",
"canvaskit/chromium/canvaskit.js.symbols": "a012ed99ccba193cf96bb2643003f6fc",
"canvaskit/chromium/canvaskit.js": "671c6b4f8fcc199dcc551c7bb125f239",
"canvaskit/chromium/canvaskit.wasm": "b1ac05b29c127d86df4bcfbf50dd902a",
"canvaskit/canvaskit.js": "66177750aff65a66cb07bb44b8c6422b",
"canvaskit/canvaskit.wasm": "1f237a213d7370cf95f443d896176460",
"canvaskit/skwasm.worker.js": "89990e8c92bcb123999aa81f7e203b1c"};
// The application shell files that are downloaded before a service worker can
// start.
const CORE = ["main.dart.js",
"index.html",
"flutter_bootstrap.js",
"assets/AssetManifest.bin.json",
"assets/FontManifest.json"];

// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  self.skipWaiting();
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      return cache.addAll(
        CORE.map((value) => new Request(value, {'cache': 'reload'})));
    })
  );
});
// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');
      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        // Claim client to enable caching on first launch
        self.clients.claim();
        return;
      }
      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      // Claim client to enable caching on first launch
      self.clients.claim();
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});
// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (key.indexOf('?v=') != -1) {
    key = key.split('?v=')[0];
  }
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#') || key == '') {
    key = '/';
  }
  // If the URL is not the RESOURCE list then return to signal that the
  // browser should take over.
  if (!RESOURCES[key]) {
    return;
  }
  // If the URL is the index.html, perform an online-first request.
  if (key == '/') {
    return onlineFirst(event);
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache only if the resource was successfully fetched.
        return response || fetch(event.request).then((response) => {
          if (response && Boolean(response.ok)) {
            cache.put(event.request, response.clone());
          }
          return response;
        });
      })
    })
  );
});
self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
    return;
  }
  if (event.data === 'downloadOffline') {
    downloadOffline();
    return;
  }
});
// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey of Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.push(resourceKey);
    }
  }
  return contentCache.addAll(resources);
}
// Attempt to download the resource online before falling back to
// the offline cache.
function onlineFirst(event) {
  return event.respondWith(
    fetch(event.request).then((response) => {
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch((error) => {
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response != null) {
            return response;
          }
          throw error;
        });
      });
    })
  );
}
