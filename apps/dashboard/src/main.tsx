import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Service worker: register and request notification permission (test via header button)
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/sw.js")
    .then(() => navigator.serviceWorker.ready)
    .then(() => {
      if (Notification.permission === "default") {
        Notification.requestPermission().catch(() => {});
      }
    })
    .catch(() => {});
}
