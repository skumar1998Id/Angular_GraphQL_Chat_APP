/**
 * This file includes polyfills needed by Angular and is loaded before the app.
 * You can add your own extra polyfills to this file.
 */

// Zone.js is required by default for Angular
import 'zone.js';

// Add global to window for libraries that expect it
(window as any).global = window;
// Add process to window if needed by some libraries
(window as any).process = {
  env: { DEBUG: undefined },
  browser: true
};
