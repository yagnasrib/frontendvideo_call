import React from "react";
import ReactDOM from "react-dom/client"; // Make sure this import is correct
import App from "./App";

// Create the root element
const root = ReactDOM.createRoot(document.getElementById("root"));

// Render the app
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
