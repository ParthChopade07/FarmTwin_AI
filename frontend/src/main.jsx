import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "./i18n";

// Register Service Worker for PWA Background Notifications
if ("serviceWorker" in navigator && process.env.NODE_ENV !== "test") {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        console.log("FarmTwin PWA Service Worker registered:", reg.scope);
      })
      .catch((err) => {
        console.warn("Service Worker registration optional:", err);
      });
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
