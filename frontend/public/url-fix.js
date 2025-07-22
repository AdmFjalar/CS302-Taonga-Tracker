(function() {
  const originalFetch = window.fetch;
  window.fetch = function(input, init) {
    if (typeof input === "string") {
      if (input.indexOf("http://134.199.171.168:8080/api") !== -1) {
        input = input.replace("http://134.199.171.168:8080/api", "/api");
      }
      if (input.indexOf("http://134.199.171.168:8080/uploads") !== -1) {
        input = input.replace("http://134.199.171.168:8080/uploads", "/uploads");
      }
    }
    return originalFetch.call(this, input, init);
  };

  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
    if (typeof url === "string") {
      if (url.indexOf("http://134.199.171.168:8080/api") !== -1) {
        url = url.replace("http://134.199.171.168:8080/api", "/api");
      }
      if (url.indexOf("http://134.199.171.168:8080/uploads") !== -1) {
        url = url.replace("http://134.199.171.168:8080/uploads", "/uploads");
      }
    }
    return originalOpen.call(this, method, url, async, user, password);
  };

  function fixImages() {
    const images = document.querySelectorAll('img');
    images.forEach(function(img) {
      if (img.src && img.src.indexOf("http://134.199.171.168:8080/uploads") !== -1) {
        img.src = img.src.replace("http://134.199.171.168:8080/uploads", "/uploads");
      }
    });
  }

  if (document.readyState === "complete" || document.readyState === "interactive") {
    setTimeout(fixImages, 100);
  } else {
    document.addEventListener("DOMContentLoaded", fixImages);
  }

  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === "childList") {
        mutation.addedNodes.forEach(function(node) {
          if (node.tagName === "IMG") {
            if (node.src && node.src.indexOf("http://134.199.171.168:8080/uploads") !== -1) {
              node.src = node.src.replace("http://134.199.171.168:8080/uploads", "/uploads");
            }
          }
        });
      }
    });
  });

  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  } else {
    document.addEventListener("DOMContentLoaded", function() {
      observer.observe(document.body, { childList: true, subtree: true });
    });
  }
})();
