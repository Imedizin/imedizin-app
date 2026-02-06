self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("message", (event) => {
  const d = event.data;
  if (d?.type === "SHOW_TEST_NOTIFICATION") {
    self.registration.showNotification("Test notification", {
      body: "Triggered at " + new Date().toLocaleTimeString(),
      icon: "/favicon.ico",
      silent: false,
    });
  }
  if (d?.type === "SHOW_EMAIL_NOTIFICATION" && d?.title != null) {
    self.registration.showNotification(d.title, {
      body: d.body ?? "",
      icon: d.icon ?? "/favicon.ico",
      silent: d.silent ?? false,
      tag: d.tag ?? "email-received",
      data: d.data ?? {},
    });
  }
});
