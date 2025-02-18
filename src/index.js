import React from "react";
import ReactDOM from "react-dom/client"; // Use "client" instead of "react-dom"
import { GoogleOAuthProvider } from "@react-oauth/google"; // Import the GoogleOAuthProvider
import App from "./App"; // Assuming App.js is the main component where CreateRoom will be used

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    {/* Wrap your application in GoogleOAuthProvider to provide Google OAuth context */}
    <GoogleOAuthProvider clientId="1015560032092-mqnets80kbhbf9pmvs72ksn31ofguple.apps.googleusercontent.com">
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);
