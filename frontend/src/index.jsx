/**
 * Application entry point with React DOM rendering and URL fix interceptor.
 * Sets up BrowserRouter and applies server URL corrections for deployment compatibility.
 */

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import "./index.css";

/**
 * URL fix interceptor - corrects hardcoded server URLs for proper routing.
 * Runs immediately when the application loads to override fetch and XMLHttpRequest.
 */
(function() {
  // Override fetch API
  const originalFetch = window.fetch;
  window.fetch = function(input, init) {
    if (typeof input === "string") {
      // Handle both HTTP and HTTPS variants
      if (input.indexOf("http://134.199.171.168:8080/api") !== -1 ||
          input.indexOf("https://134.199.171.168:8080/api") !== -1) {
        input = input.replace(/https?:\/\/134\.199\.171\.168:8080\/api/g, "/api");
      }

      if (input.indexOf("http://134.199.171.168:8080/uploads") !== -1 ||
          input.indexOf("https://134.199.171.168:8080/uploads") !== -1) {
        input = input.replace(/https?:\/\/134\.199\.171\.168:8080\/uploads/g, "/uploads");
      }
    }
    return originalFetch.call(this, input, init);
  };

  // Override XMLHttpRequest
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
    if (typeof url === "string") {
      if (url.indexOf("http://134.199.171.168:8080/api") !== -1 ||
          url.indexOf("https://134.199.171.168:8080/api") !== -1) {
        url = url.replace(/https?:\/\/134\.199\.171\.168:8080\/api/g, "/api");
      }

      if (url.indexOf("http://134.199.171.168:8080/uploads") !== -1 ||
          url.indexOf("https://134.199.171.168:8080/uploads") !== -1) {
        url = url.replace(/https?:\/\/134\.199\.171\.168:8080\/uploads/g, "/uploads");
      }
    }
    return originalOpen.call(this, method, url, async, user, password);
  };
})();

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
