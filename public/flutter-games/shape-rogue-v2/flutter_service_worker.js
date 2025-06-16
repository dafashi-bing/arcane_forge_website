'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';

const RESOURCES = {"assets/AssetManifest.bin": "40e0d7714b8888fa82494c60d158e6f2",
"assets/AssetManifest.bin.json": "9fa04929600657641c22ce776b61f996",
"assets/AssetManifest.json": "882dd735ef0181b38c9575c4d538369d",
"assets/assets/audio/bgm/digital_clash.mp3": "67dfa501085f087180fd664fc9344b16",
"assets/assets/audio/bgm/digital_clash_2.mp3": "91f975f5872b8ef7cbf25209cc8fd936",
"assets/assets/audio/bgm/digital_clash_2_original.mp3": "8b2eb4b6c13de8206fbf0008123e958b",
"assets/assets/audio/bgm/digital_clash_original.mp3": "51413b85bf01ce4250f69a8afe5998a5",
"assets/assets/audio/bgm/geometric_pulse.mp3": "3197ca70bd3b527552da6954f581655b",
"assets/assets/audio/chaser_shield_break.mp3": "0a13c4d5a1b96cdf60951c2c014eda2a",
"assets/assets/audio/clear.m4a": "01a079cc2f7a3f588ad8688e44be0799",
"assets/assets/audio/clear.mp3": "f40ebba5180ea24638147245fc62d277",
"assets/assets/audio/dash.mp3": "7bd6110bccd6652b0a7d4f455ddec714",
"assets/assets/audio/dash_trim.mp3": "9cbc798f7127c6780b19773347165e12",
"assets/assets/audio/fail.mp3": "6ccea966be0bf61ae50218b6eee6a00c",
"assets/assets/audio/heptagon_resonance.mp3": "4e9c643cb299c9f1be5df8cdd7d100ef",
"assets/assets/audio/hex_field.mp3": "b5b7b5de0f3e883a6fd0fe096eb76d48",
"assets/assets/audio/purchase.mp3": "47e3f05d428af4e1db614c7b7a393470",
"assets/assets/audio/retry_token_collect.mp3": "9020ac9abcd5a39927e061b9d843141e",
"assets/assets/audio/shield_bash.mp3": "f8eba728924bda30f5387fa4cb85ba78",
"assets/assets/audio/shield_bash_trim.mp3": "ddf91d23cb2cb0157cf5a2279c0e389f",
"assets/assets/audio/spike_shot.mp3": "b3eef1e0842d29607136c9ea3cbf8191",
"assets/assets/audio/spike_shot_trim.mp3": "db6475324f90113858e55de24b028b25",
"assets/assets/audio/star_flare.mp3": "5464543b9aad4e6c3a000cfafd36dfeb",
"assets/assets/audio/star_flare_trim.mp3": "05639cef79d38f9424c662b8de8bcd87",
"assets/assets/audio/victory.mp3": "82997a274733ad4a15a383ad772105cc",
"assets/assets/config/display.json": "f9e201d5c31d14698f13009f925f7035",
"assets/assets/config/game_modes.json": "21c818a0b2f5754a075a43a52906b642",
"assets/assets/config/heroes.json": "906c652910c42e7c9f6dfe88951e760f",
"assets/assets/config/items.json": "cbb97e47ebb1bc507e9cd7d6498e54a2",
"assets/assets/config/waves.json": "a66152e20f821bd11b35eab60192d284",
"assets/assets/images/ability_mastery.png": "d84711254a82287f83c8d1f6e540d432",
"assets/assets/images/ability_mastery_transparent.png": "664955b42e7026831168030d18416930",
"assets/assets/images/attack_speed.png": "7c0745bc977f30e950a989d89e6f4c2a",
"assets/assets/images/attack_speed_transparent.png": "81163c0d59b278f3ae1ac498108b54d6",
"assets/assets/images/background1.png": "8cec5eed74e03e7fbdb6d4c0a575e104",
"assets/assets/images/extended_reach.png": "7673a799ee30155be1068a8bea99aa25",
"assets/assets/images/extended_reach_transparent.png": "ee4f4c8d64e0709058effb132f1ad1eb",
"assets/assets/images/health_potion_transparent.png": "33fb51395db12c88f29379ae154484dc",
"assets/assets/images/logo-512.png": "d88c1a77bbcfdf67479f9769596abd74",
"assets/assets/images/logo.png": "40e8b1baec8473511a0a4282c7387be6",
"assets/assets/images/max_health_up.png": "cceb754d62a7048666965f058c78cb5b",
"assets/assets/images/max_health_up_transparent.png": "01e2df9a51bd24c187f2832e6fc0e24b",
"assets/assets/images/speed_boost.png": "a3f4bdc3a1c78a1c3eefba11a720f9da",
"assets/assets/images/speed_boost_transparent.png": "7122496e225438ef95b70cbafca128ce",
"assets/FontManifest.json": "dc3d03800ccca4601324923c0b1d6d57",
"assets/fonts/MaterialIcons-Regular.otf": "fe09a1781cc41a1e86f5fc1282f22e28",
"assets/NOTICES": "4c2b2db35e6ce001f3ad252a34e977db",
"assets/packages/cupertino_icons/assets/CupertinoIcons.ttf": "33b7d9392238c04c131b6ce224e13711",
"assets/shaders/ink_sparkle.frag": "ecc85a2e95f5e9f53123dcaf8cb9b6ce",
"canvaskit/canvaskit.js": "728b2d477d9b8c14593d4f9b82b484f3",
"canvaskit/canvaskit.js.symbols": "bdcd3835edf8586b6d6edfce8749fb77",
"canvaskit/canvaskit.wasm": "7a3f4ae7d65fc1de6a6e7ddd3224bc93",
"canvaskit/chromium/canvaskit.js": "8191e843020c832c9cf8852a4b909d4c",
"canvaskit/chromium/canvaskit.js.symbols": "b61b5f4673c9698029fa0a746a9ad581",
"canvaskit/chromium/canvaskit.wasm": "f504de372e31c8031018a9ec0a9ef5f0",
"canvaskit/skwasm.js": "ea559890a088fe28b4ddf70e17e60052",
"canvaskit/skwasm.js.symbols": "e72c79950c8a8483d826a7f0560573a1",
"canvaskit/skwasm.wasm": "39dd80367a4e71582d234948adc521c0",
"favicon.png": "cba3eca4fda4c3e82c4e474a534cafba",
"flutter.js": "83d881c1dbb6d6bcd6b42e274605b69c",
"flutter_bootstrap.js": "f0ae5ef00ac8a468c0d1539a23433cfa",
"icons/Icon-192.png": "6be1115785c41ef8f3e06140e4ad1405",
"icons/Icon-512.png": "540b28a601c3517735466af3a9822827",
"icons/Icon-maskable-192.png": "654b89b19cf429cbc4937959eb07f161",
"icons/Icon-maskable-512.png": "327c72127caf7131e167b9171c86c453",
"index.html": "5550975fbd58fbccac19fac887b6825f",
"/": "5550975fbd58fbccac19fac887b6825f",
"main.dart.js": "f206466d24a9f625d274df60cc80e2fe",
"manifest.json": "6e0f07c424c456db95945e97f006d9b0",
"version.json": "ee455e2727d27ff4960d48e974941d86"};
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
