// Add global to window
(window as any).global = window;
// Add process to window if needed by some libraries
(window as any).process = {
  env: { DEBUG: undefined },
  browser: true
};


