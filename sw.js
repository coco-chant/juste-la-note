/* Service worker de "Juste la note".
   Rôle : rendre l'app installable et utilisable hors-ligne en gardant
   une copie locale ("cache") des fichiers.

   Stratégie (importante pour que les mises à jour arrivent vite) :
   - La PAGE elle-même (index.html) est servie en « RÉSEAU D'ABORD » :
     tant qu'il y a de la connexion, on affiche toujours la dernière version
     en ligne ; on ne retombe sur la copie locale que si on est hors-ligne.
   - Les fichiers annexes (icônes, manifeste) sont servis en « CACHE D'ABORD »
     (rapides, ils changent rarement).
   Quand on met l'app à jour, on incrémente le numéro de version ci-dessous. */

const CACHE = "justenote-v5";

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

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  // Est-ce la page (navigation vers un document HTML) ?
  const isPage = req.mode === "navigate" || req.destination === "document";

  if (isPage) {
    // RÉSEAU D'ABORD : on va chercher la dernière version en ligne...
    event.respondWith(
      fetch(req)
        .then((res) => {
          // ...et on rafraîchit la copie locale pour le mode hors-ligne.
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put("./index.html", copy));
          return res;
        })
        // Pas de réseau → on sert la dernière copie connue.
        .catch(() => caches.match("./index.html").then((hit) => hit || caches.match("./")))
    );
    return;
  }

  // Reste des fichiers : CACHE D'ABORD, complété par le réseau si absent.
  event.respondWith(
    caches.match(req).then((hit) => hit || fetch(req))
  );
});
