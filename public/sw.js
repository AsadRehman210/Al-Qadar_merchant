// sw.js
self.addEventListener("fetch", (event) => {
  const req = event.request;

  if (req.destination === "script" && req.url.includes("/assets/")) {
    event.respondWith(
      fetch(req)
        .then((response) => {
          const contentType = response.headers.get("content-type") || "";
          if (contentType.includes("text/html")) {
            // Chunk is missing (HTML instead of JS)
            self.clients.matchAll({ type: "window" }).then((clients) => {
              clients.forEach((client) => {
                client.postMessage({ type: "FORCE_RELOAD_IF_ACTIVE" });
              });
            });
          }
          return response;
        })
        .catch(() => {
          // Network failure or bad chunk
          self.clients.matchAll({ type: "window" }).then((clients) => {
            clients.forEach((client) => {
              client.postMessage({ type: "FORCE_RELOAD_IF_ACTIVE" });
            });
          });
          return Response.error();
        })
    );
  }
});
