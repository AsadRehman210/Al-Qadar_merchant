import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import Router from "./Router";
import { Provider } from "react-redux";
import { store, persistor } from "store";
import { PersistGate } from "redux-persist/integration/react";
import i18n from "i18next";
import { I18nextProvider } from "react-i18next";
import { FCMProvider } from "./context/FCMContext";
import { SocketProvider } from "./context/SocketContext.jsx";
import { registerServiceWorker } from "../public/register-service-worker";
import { APP_VERSION } from "global/config";

import "global/i18n";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "react-toastify/dist/ReactToastify.css";
import "assets/css/fontfamily.css";
import "./index.css";

// ✅ Boot app after version & SW check
async function bootstrapApp() {
  // Version check
  const storedVersion = localStorage.getItem("app_version");
  if (storedVersion && storedVersion !== APP_VERSION) {
    localStorage.setItem("app_version", APP_VERSION);
    window.location.reload(true);
    return;
  } else {
    localStorage.setItem("app_version", APP_VERSION);
  }

  // Register SW
  if ("serviceWorker" in navigator) {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      console.log("✅ Service Worker registered:", reg.scope);
    } catch (err) {
      console.error("❌ SW registration failed:", err);
    }
  }

  // Handle reload message only in active tab
  navigator.serviceWorker?.addEventListener("message", (event) => {
    if (event?.data?.type === "FORCE_RELOAD_IF_ACTIVE") {
      if (document.visibilityState === "visible") {
        console.log("🔄 Reloading active tab...");
        window.location.reload(true);
      } else {
        console.log("🕒 Inactive tab. Deferring reload.");
        sessionStorage.setItem("pending_reload", "true");
      }
    }
  });

  // Reload when hidden tab becomes active
  document.addEventListener("visibilitychange", () => {
    const shouldReload = sessionStorage.getItem("pending_reload");
    if (document.visibilityState === "visible" && shouldReload === "true") {
      sessionStorage.removeItem("pending_reload");
      console.log("🔄 Reloading deferred tab...");
      window.location.reload(true);
    }
  });
  // Register service worker
  registerServiceWorker();

  createRoot(document.getElementById("root")).render(
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <I18nextProvider i18n={i18n}>
          <FCMProvider>
            <SocketProvider>        
              <BrowserRouter>
                <Router />
              </BrowserRouter>
            </SocketProvider>
          </FCMProvider>
        </I18nextProvider>
      </PersistGate>
    </Provider>
  );
}
bootstrapApp();
