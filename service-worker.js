"use strict";

const CACHE_NAME = "pass-deck-shell-v41";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css?v=41",
  "./fonts/biz-ud-pgothic-regular.woff2",
  "./fonts/biz-ud-pgothic-bold.woff2",
  "./curriculum.js?v=20",
  "./plan-library.js",
  "./practice.js?v=36",
  "./trial-questions.js",
  "./materials/oracle-silver/oracle-silver-dba.js?v=31",
  "./materials/oracle-silver/oracle-silver-sql.js?v=31",
  "./materials/oracle-silver/oracle-silver-dba-extra.js?v=31",
  "./materials/oracle-silver/oracle-silver-sql-extra.js?v=31",
  "./materials/oracle-silver/oracle-silver-cases.js?v=31",
  "./materials/oracle-silver/scenarios.js?v=31",
  "./materials/oracle-silver/dba-practice.js?v=31",
  "./materials/oracle-silver/sql-practice.js?v=31",
  "./materials/oracle-silver/final-practice.js?v=31",
  "./materials/oracle-silver/mock-a.js?v=31",
  "./materials/oracle-silver/mock-b.js?v=31",
  "./materials/oracle-silver/oracle-silver.js?v=31",
  "./timed-mock.js?v=31",
  "./google-config.js",
  "./google-sync.js?v=11",
  "./study-storage.js",
  "./calendar-reminder.js",
  "./app.js?v=39",
  "./manifest.webmanifest",
  "./icons/app-icon.svg",
  "./offline.html"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith("pass-deck-shell-") && key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("./index.html", copy));
          return response;
        })
        .catch(async () => (await caches.match("./index.html")) || caches.match("./offline.html"))
    );
    return;
  }

  if (url.pathname.endsWith("/google-config.js")) {
    event.respondWith(fetch(request).catch(() => caches.match(request)));
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      }
      return response;
    }))
  );
});
