// ==UserScript==
// @name         Claude Auto-Continue
// @namespace    https://github.com/YOUR-USERNAME/claude-autocontinue
// @version      1.0.0
// @description  Automatically clicks the "Continue" button on claude.ai when a turn stops early
// @match        https://claude.ai/*
// @updateURL    https://raw.githubusercontent.com/YOUR-USERNAME/claude-autocontinue/main/claude-autocontinue.user.js
// @downloadURL  https://raw.githubusercontent.com/YOUR-USERNAME/claude-autocontinue/main/claude-autocontinue.user.js
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  const STORAGE_KEY = 'claude-autocontinue-enabled';
  const CHECK_INTERVAL_MS = 1500;   // how often to poll as a fallback
  const CLICK_COOLDOWN_MS = 4000;   // don't click again within this window

  // Button text to match, lowercased. Add variants here if Claude.ai's
  // wording changes or differs by locale.
  const BUTTON_TEXT_MATCHES = ['continue', 'continue generating'];

  let enabled = GM_getValue(STORAGE_KEY, true);
  let lastClickTime = 0;

  function log(...args) {
    console.log('[Claude Auto-Continue]', ...args);
  }

  function isVisible(el) {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.visibility !== 'hidden' &&
      style.display !== 'none'
    );
  }

  function findContinueButton() {
    // We match on visible button text rather than a specific class name,
    // since claude.ai's class names are auto-generated and change often.
    const candidates = Array.from(document.querySelectorAll('button'));
    return candidates.find((btn) => {
      const text = (btn.textContent || '').trim().toLowerCase();
      return (
        BUTTON_TEXT_MATCHES.includes(text) &&
        isVisible(btn) &&
        !btn.disabled
      );
    });
  }

  function tryClick() {
    if (!enabled) return;

    const now = Date.now();
    if (now - lastClickTime < CLICK_COOLDOWN_MS) return;

    const btn = findContinueButton();
    if (btn) {
      log('Found Continue button, clicking it.');
      btn.click();
      lastClickTime = now;
    }
  }

  // Poll on an interval as a reliable fallback...
  setInterval(tryClick, CHECK_INTERVAL_MS);

  // ...plus a MutationObserver so we react the instant the button appears,
  // instead of waiting for the next poll tick.
  const observer = new MutationObserver(() => tryClick());
  observer.observe(document.body, { childList: true, subtree: true });

  // Toggle on/off from Tampermonkey's menu without editing code.
  if (typeof GM_registerMenuCommand === 'function') {
    GM_registerMenuCommand('Toggle Claude Auto-Continue', () => {
      enabled = !enabled;
      GM_setValue(STORAGE_KEY, enabled);
      alert(`Claude Auto-Continue is now ${enabled ? 'ON' : 'OFF'}`);
    });
  }

  log(`Loaded. Auto-continue is ${enabled ? 'ON' : 'OFF'}.`);
})();
