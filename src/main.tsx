import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { PrivacyPage } from "./components/PrivacyPage";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {window.location.pathname === "/privacy" ? <PrivacyPage /> : <App />}
  </StrictMode>
);
