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

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const threadId = data.threadId;
  const emailId = data.emailId;
  let path = "/mails";
  if (threadId) {
    path = "/mails/" + encodeURIComponent(threadId);
  } else if (emailId) {
    path = "/mails?openEmailId=" + encodeURIComponent(emailId);
  }
  const targetUrl = new URL(path, self.location.origin).toString();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        const client = clientList[0];
        client.navigate(targetUrl);
        return client.focus();
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
