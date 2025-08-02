import React from "react";
import ReactDOM from "react-dom/client";
import App from "./studio_main_app.tsx";
import "./index.css";
import { ClerkProvider } from "@clerk/clerk-react";
// import { Buffer } from 'buffer';

// if (!(window as any).Buffer) {
//   (window as any).Buffer = Buffer;
// }


const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Add your Clerk Publishable Key to the .env file");
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <App />
    </ClerkProvider>
  </React.StrictMode>
);

// Use contextBridge
window.ipcRenderer.on("main-process-message", (_event, message) => {
  console.log(message);
});
