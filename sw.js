/* Service worker de "Juste la note".
   Rôle : rendre l'app installable et utilisable hors-ligne en gardant
   une copie locale ("cache") des fichiers. Quand on met l'app à jour,
   il suffit de changer le numéro de version ci-dessous. */

const CACHE = "justenote-v1";

// Fichiers qui composent l'app ("app shell").
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-180.png"
];

// À l'installation : on télécharge et on met en cache l'app.
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

// À l'activation : on supprime les anciens caches (anciennes versions).
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// À chaque requête : on sert d'abord depuis le cache (rapide, hors-ligne),
// et on complète par le réseau si le fichier n'y est pas.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((hit) => hit || fetch(event.request))
  );
});
