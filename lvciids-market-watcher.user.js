// ==UserScript==
// @name         lvciid's Market Watcher (Aurora)
// @namespace    https://github.com/lvciid/lvciids-market-watcher
// @version      1.1.0
// @description  Monitors the Torn Item Market and alerts when items cross your price thresholds; highlights hits with an aurora-styled UI.
// @author       lvciid
// @homepageURL  https://github.com/lvciid/lvciids-market-watcher
// @supportURL   https://github.com/lvciid/lvciids-market-watcher/issues
// @source       https://github.com/lvciid/lvciids-market-watcher
// @updateURL    https://raw.githubusercontent.com/lvciid/lvciids-market-watcher/main/lvciids-market-watcher.user.js
// @downloadURL  https://raw.githubusercontent.com/lvciid/lvciids-market-watcher/main/lvciids-market-watcher.user.js
// @icon         https://raw.githubusercontent.com/lvciid/lvciids-market-watcher/main/icon.png
// @match        https://www.torn.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @grant        GM_notification
// @grant        GM_xmlhttpRequest
// @connect      api.torn.com
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const AuroraCSS = `
    .imwatch-button, .imwatch-drawer, .imwatch-popup {
      font-family: "Inter", "Segoe UI", sans-serif;
      letter-spacing: 0.01em;
    }
    .imwatch-button {
      position: fixed;
      right: 20px;
      bottom: 20px;
      padding: 10px 16px;
      border: none;
      border-radius: 18px;
      cursor: pointer;
      color: #f9faff;
      min-width: 110px;
      background: linear-gradient(135deg, rgba(83,109,254,0.9), rgba(178,69,255,0.85));
      box-shadow: 0 12px 22px rgba(62,0,140,0.35);
      z-index: 9999;
      overflow: hidden;
      user-select: none;
    }
    .imwatch-button.imwatch-paused { opacity: 0.6; }
    .imwatch-drawer {
      position: fixed;
      right: 20px;
      bottom: 70px;
      width: 320px;
      max-height: 440px;
      border-radius: 18px;
      background: rgba(12,11,27,0.92);
      backdrop-filter: blur(12px);
      box-shadow: 0 18px 34px rgba(18,2,56,0.45);
      color: #f0f3ff;
      padding: 16px;
      display: none;
      z-index: 9999;
      overflow-y: auto;
    }
    .imwatch-drawer.imwatch-open {
      display: block;
      animation: imwatch-drift 300ms ease-out;
    }
    .imwatch-popup {
      position: fixed;
      right: 20px;
      bottom: 140px;
      width: 280px;
      border-radius: 16px;
      background: rgba(19,16,46,0.95);
      color: #ffffff;
      padding: 14px;
      box-shadow: 0 16px 30px rgba(0,0,0,0.38);
      z-index: 10000;
      overflow: hidden;
    }
    .imwatch-popup + .imwatch-popup {
      margin-top: 12px;
    }
    .imwatch-popup h4 {
      margin: 0 0 6px;
      font-size: 15px;
      font-weight: 600;
    }
    .imwatch-popup a {
      color: #7fc7ff;
      text-decoration: none;
      font-weight: 500;
    }
    .imwatch-popup button {
      margin-top: 10px;
      padding: 6px 10px;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      background: rgba(255,255,255,0.14);
      color: #fff;
      font-size: 13px;
    }
    .imwatch-api-input {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .imwatch-api-input input {
      flex: 1;
    }
    .imwatch-api-input button,
    .imwatch-api-pill button {
      padding: 6px 12px;
      border-radius: 12px;
      border: none;
      cursor: pointer;
      background: rgba(122,182,255,0.22);
      color: #d4e6ff;
      font-weight: 600;
      letter-spacing: 0.01em;
    }
    .imwatch-api-pill {
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(122,98,255,0.15);
      border: 1px solid rgba(148,182,255,0.35);
      padding: 6px 12px;
      border-radius: 999px;
    }
    .imwatch-pill-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #6fffc7;
      box-shadow: 0 0 8px rgba(125,255,222,0.7);
    }
    .imwatch-pill-text {
      flex: 1;
      font-size: 12px;
      color: #e6f0ff;
      font-weight: 500;
    }
    .imwatch-field-error {
      margin-top: 6px;
      color: #ff9aa7;
      font-size: 12px;
      letter-spacing: 0.01em;
    }
    .imwatch-title {
      font-family: "Brush Script MT", "Lucida Handwriting", cursive;
      font-size: 22px;
      font-weight: 600;
      letter-spacing: 0.05em;
      color: #f8ecff;
      text-shadow: 0 2px 6px rgba(83,30,140,0.35);
    }
    .imwatch-form-group {
      margin-bottom: 14px;
    }
    .imwatch-form-group label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .imwatch-form-group input,
    .imwatch-form-group select {
      width: 100%;
      padding: 7px 10px;
      border-radius: 10px;
      border: 1px solid rgba(125,129,173,0.4);
      background: rgba(28,28,48,0.7);
      color: #eaf0ff;
      box-sizing: border-box;
    }
    .imwatch-inline {
      display: flex;
      gap: 8px;
    }
    .imwatch-inline .imwatch-form-group {
      flex: 1;
    }
    .imwatch-rules {
      border-top: 1px solid rgba(145,148,199,0.2);
      padding-top: 12px;
      margin-top: 8px;
    }
    .imwatch-rule-row {
      display: flex;
      flex-direction: column;
      border-radius: 12px;
      padding: 8px 10px;
      background: rgba(33,30,61,0.75);
      margin-bottom: 10px;
      gap: 6px;
    }
    .imwatch-rule-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
    }
    .imwatch-rule-actions {
      display: flex;
      gap: 6px;
    }
    .imwatch-pill {
      padding: 4px 8px;
      border-radius: 999px;
      background: rgba(255,255,255,0.12);
      font-size: 11px;
    }
    .imwatch-toggle {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      font-size: 12px;
    }
    .imwatch-toggle input {
      width: 16px;
      height: 16px;
    }
    .imwatch-toast {
      position: fixed;
      right: 20px;
      bottom: 140px;
      transform: translateY(110%);
      transition: transform 320ms ease-out;
      background: rgba(229,76,131,0.92);
      color: white;
      padding: 12px 16px;
      border-radius: 14px;
      box-shadow: 0 12px 25px rgba(102,3,43,0.4);
      z-index: 10001;
      max-width: 300px;
    }
    .imwatch-toast.imwatch-visible { transform: translateY(0); }
    .imwatch-starfield {
      position: absolute;
      left: 0;
      top: 0;
      width: 150%;
      height: 150%;
      pointer-events: none;
    }
    .imwatch-star {
      position: absolute;
      width: 2px;
      height: 2px;
      border-radius: 50%;
      background: rgba(255,255,255,0.85);
      opacity: 0.7;
    }
    .imwatch-aurora {
      position: absolute;
      inset: -30%;
      background: radial-gradient(ellipse at center, rgba(112,137,255,0.35), transparent);
      filter: blur(20px);
      opacity: 0.9;
      pointer-events: none;
    }
    @keyframes imwatch-aurora-shift {
      0% { transform: translate(-10%, -5%) rotate(0deg) scale(1); }
      50% { transform: translate(5%, 10%) rotate(12deg) scale(1.05); }
      100% { transform: translate(-10%, -5%) rotate(0deg) scale(1); }
    }
    @keyframes imwatch-star-drift {
      0% { transform: translateY(0); opacity: 0; }
      15% { opacity: 0.8; }
      85% { opacity: 0.9; }
      100% { transform: translateY(-80px); opacity: 0; }
    }
    @keyframes imwatch-drift {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .imwatch-starfield .imwatch-star {
      animation: imwatch-star-drift 8s linear infinite;
    }
    .imwatch-aurora {
      animation: imwatch-aurora-shift 18s ease-in-out infinite;
    }
    .imwatch-secondary {
      position: fixed;
      right: 20px;
      bottom: 120px;
      width: 240px;
      border-radius: 16px;
      background: rgba(20,18,42,0.95);
      box-shadow: 0 12px 28px rgba(15,2,55,0.4);
      color: #f3f5ff;
      padding: 14px;
      display: none;
      z-index: 10000;
      overflow: hidden;
    }
    .imwatch-secondary.imwatch-open {
      display: block;
      animation: imwatch-drift 240ms ease-out;
    }
    .imwatch-secondary h5 {
      margin: 0 0 10px;
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 0.04em;
    }
    .imwatch-secondary label {
      font-size: 12px;
      display: block;
      margin-bottom: 6px;
    }
    .imwatch-secondary input[type="range"] {
      width: 100%;
      margin-top: 4px;
    }
    .imwatch-secondary-info {
      font-size: 11px;
      color: rgba(218,224,255,0.78);
      margin-top: 12px;
      line-height: 1.4;
    }
    @media (prefers-reduced-motion: reduce) {
      .imwatch-starfield .imwatch-star,
      .imwatch-aurora,
      .imwatch-drawer.imwatch-open,
      .imwatch-secondary,
      .imwatch-button,
      .imwatch-popup { animation: none !important; transition: none !important; }
    }
    .im-watch-hit {
      position: relative;
      box-shadow: inset 0 0 0 2px rgba(112,189,255,0.75);
      background-image: linear-gradient(90deg, rgba(112,189,255,0.12), rgba(112,189,255,0));
    }
    .imwatch-hit-star {
      position: absolute;
      top: 8px;
      right: 12px;
      font-size: 16px;
      color: #ffe18f;
      text-shadow: 0 0 6px rgba(255,228,157,0.8);
    }
  `;
  GM_addStyle(AuroraCSS);

  const Storage = (() => {
    const CONFIG_KEY = 'imwatch.config';
    const ITEMS_KEY = 'imwatch.items';
    const HITS_KEY = 'imwatch.pendingHits';
    const LISTENERS = [];

    const DEFAULT_CONFIG = {
      apiKey: '',
      polling: { min: 15, max: 30 },
      rules: [],
      logging: false,
      volume: 0.6,
    };

    /**
     * Loads the persisted configuration object.
     * @returns {ConfigState}
     */
    function getConfig() {
      const raw = GM_getValue(CONFIG_KEY);
      if (!raw) {
        return structuredClone(DEFAULT_CONFIG);
      }
      try {
        return Object.assign(structuredClone(DEFAULT_CONFIG), JSON.parse(raw));
      } catch (err) {
        console.error('[Market Watch] Failed to parse config, resetting.', err);
        return structuredClone(DEFAULT_CONFIG);
      }
    }

    /**
     * Persists the configuration object and notifies subscribers.
     * @param {ConfigState} cfg
     */
    function saveConfig(cfg) {
      GM_setValue(CONFIG_KEY, JSON.stringify(cfg));
      LISTENERS.forEach((fn) => {
        try { fn(structuredClone(cfg)); } catch (e) { console.error(e); }
      });
    }

    /**
     * Registers a listener invoked when configuration changes.
     * @param {(cfg: ConfigState) => void} fn
     */
    function subscribe(fn) {
      LISTENERS.push(fn);
    }

    /**
     * Loads the cached items dictionary metadata.
     * @returns {ItemsCache|null}
     */
    function loadItems() {
      const raw = GM_getValue(ITEMS_KEY);
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch (err) {
        console.warn('[Market Watch] Items cache parse failed.', err);
        return null;
      }
    }

    /**
     * Saves the items dictionary cache.
     * @param {ItemsCache} cache
     */
    function saveItems(cache) {
      GM_setValue(ITEMS_KEY, JSON.stringify(cache));
    }

    /**
     * Loads pending highlight entries.
     * @returns {PendingHighlight[]}
     */
    function loadPendingHighlights() {
      const raw = GM_getValue(HITS_KEY);
      if (!raw) return [];
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed;
        }
        return [];
      } catch {
        return [];
      }
    }

    /**
     * Persists pending highlight entries.
     * @param {PendingHighlight[]} hits
     */
    function savePendingHighlights(hits) {
      GM_setValue(HITS_KEY, JSON.stringify(hits));
    }

    return {
      getConfig,
      saveConfig,
      subscribe,
      loadItems,
      saveItems,
      loadPendingHighlights,
      savePendingHighlights,
      DEFAULT_CONFIG,
    };
  })();

  let currentConfig = Storage.getConfig();
  Storage.subscribe((cfg) => { currentConfig = cfg; });

  const Logger = (() => {
    let enabled = Storage.getConfig().logging;

    Storage.subscribe((cfg) => { enabled = !!cfg.logging; });

    /**
     * Emits a debug message when logging is enabled.
     * @param {...any} args
     */
    function debug(...args) {
      if (!enabled) return;
      console.debug('[Market Watch]', ...args);
    }

    /**
     * Emits an info message when logging is enabled.
     * @param {...any} args
     */
    function info(...args) {
      if (!enabled) return;
      console.info('[Market Watch]', ...args);
    }

    /**
     * Emits an error message regardless of logging flag.
     * @param {...any} args
     */
    function error(...args) {
      console.error('[Market Watch]', ...args);
    }

    return { debug, info, error };
  })();

  const RateLimiter = (() => {
    const MIN_INTERVAL_MS = 650;
    let last = 0;

    /**
     * Ensures API calls do not exceed Torn API rate limits.
     * @returns {Promise<void>}
     */
    async function wait() {
      const now = Date.now();
      const delta = now - last;
      if (delta < MIN_INTERVAL_MS) {
        await new Promise((resolve) => setTimeout(resolve, MIN_INTERVAL_MS - delta + Math.random() * 120));
      }
      last = Date.now();
    }

    return { wait };
  })();

  const Api = (() => {
    const BASE = 'https://api.torn.com';

    /**
     * Performs an HTTP GET through GM_xmlhttpRequest.
     * @param {string} url
     * @returns {Promise<any>}
     */
    function gmGet(url) {
      return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
          method: 'GET',
          url,
          headers: { 'Accept': 'application/json' },
          onload: (response) => {
            const { status, responseText } = response;
            if (status >= 200 && status < 300) {
              try {
                resolve(JSON.parse(responseText));
              } catch (err) {
                reject({ type: 'parse', error: err, responseText });
              }
            } else {
              reject({ type: 'http', status, responseText });
            }
          },
          onerror: () => reject({ type: 'network' }),
          ontimeout: () => reject({ type: 'timeout' }),
        });
      });
    }

    /**
     * Fetches Torn item market listings for a given item.
     * @param {number} itemId
     * @param {string} apiKey
     * @returns {Promise<TornMarketResponse>}
     */
    async function fetchItemMarket(itemId, apiKey) {
      await RateLimiter.wait();
      const url = `${BASE}/market/${itemId}?selections=itemmarket&key=${encodeURIComponent(apiKey)}`;
      Logger.debug('Fetching market', itemId);
      return gmGet(url);
    }

    /**
     * Fetches Torn items dictionary.
     * @param {string} apiKey
     * @returns {Promise<Record<string, TornItem>>}
     */
    async function fetchItemsDictionary(apiKey) {
      await RateLimiter.wait();
      const url = `${BASE}/torn/?selections=items&key=${encodeURIComponent(apiKey)}`;
      Logger.info('Refreshing items dictionary');
      return gmGet(url);
    }

    return { fetchItemMarket, fetchItemsDictionary };
  })();

  const ItemsCache = (() => {
    let cached = Storage.loadItems();

    /**
     * Returns true when cached dictionary is stale.
     * @param {ItemsCache|null} cache
     * @returns {boolean}
     */
    function isStale(cache) {
      if (!cache) return true;
      const age = Date.now() - cache.timestamp;
      return age > 24 * 60 * 60 * 1000;
    }

    /**
     * Ensures items dictionary is loaded, optionally forcing refresh.
     * @param {string} apiKey
     * @param {boolean} force
     * @returns {Promise<ItemsCache>}
     */
    async function ensure(apiKey, force = false) {
      if (!apiKey) throw new Error('API key required for items dictionary.');
      if (force || isStale(cached)) {
        const json = await Api.fetchItemsDictionary(apiKey);
        if (json.error) {
          throw json.error;
        }
        const items = json.items || {};
        const mapByName = {};
        Object.values(items).forEach((item) => {
          mapByName[item.name.toLowerCase()] = {
            id: Number(item.id),
            name: item.name,
          };
        });
        cached = {
          timestamp: Date.now(),
          byName: mapByName,
        };
        Storage.saveItems(cached);
      }
      return cached;
    }

    /**
     * Performs case-insensitive lookup by item name.
     * @param {string} name
     * @returns {{id:number,name:string}|null}
     */
    function findByName(name) {
      if (!cached) return null;
      return cached.byName[name.trim().toLowerCase()] || null;
    }

    /**
     * Returns alphabetically sorted item names for typeahead.
     * @returns {string[]}
     */
    function listNames() {
      if (!cached) return [];
      return Object.values(cached.byName)
        .map((entry) => entry.name)
        .sort((a, b) => a.localeCompare(b));
    }

    return { ensure, findByName, listNames };
  })();

  const Toast = (() => {
    let toastEl = null;
    let timeoutId = null;

    /**
     * Displays a toast with message text.
     * @param {string} text
     */
    function show(text) {
      if (!toastEl) {
        toastEl = document.createElement('div');
        toastEl.className = 'imwatch-toast';
        document.body.appendChild(toastEl);
      }
      toastEl.textContent = text;
      toastEl.classList.add('imwatch-visible');
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        toastEl.classList.remove('imwatch-visible');
      }, 5000);
    }

    return { show };
  })();

  const Popup = (() => {
    const activePopups = [];

    /**
     * Shows an alert popup summarizing a listing hit.
     * @param {PopupPayload} payload
     */
    function show(payload) {
      const el = document.createElement('div');
      el.className = 'imwatch-popup';
      el.innerHTML = `
        <h4>${payload.itemName}</h4>
        <div><strong>Price:</strong> ${formatPrice(payload.price)}</div>
        <div><strong>Seller:</strong> ${payload.seller}</div>
        <div><strong>Qty:</strong> ${payload.quantity}</div>
        <div><strong>Seen:</strong> ${payload.timeSeen}</div>
        <a href="${payload.link}" class="imwatch-link">Go to market listing →</a>
        <button type="button">Dismiss</button>
      `.trim();
      attachAurora(el);

      const button = el.querySelector('button');
      button.addEventListener('click', () => {
        close(el);
      });

      const link = el.querySelector('a');
      link.addEventListener('click', (evt) => {
        evt.preventDefault();
        window.location.href = payload.link;
        close(el);
      });

      document.body.appendChild(el);
      activePopups.push(el);
      layoutPopups();
      setTimeout(() => close(el), 15000);
    }

    /**
     * Removes a popup node from DOM.
     * @param {HTMLElement} el
     */
    function close(el) {
      const idx = activePopups.indexOf(el);
      if (idx !== -1) activePopups.splice(idx, 1);
      if (el && el.parentNode) el.parentNode.removeChild(el);
      layoutPopups();
    }

    /**
     * Stacks popups without overlap.
     */
    function layoutPopups() {
      let offset = 140;
      activePopups.forEach((node) => {
        node.style.bottom = `${offset}px`;
        offset += node.offsetHeight + 12;
      });
    }

    return { show };
  })();

  const AudioChime = (() => {
    let ctx = null;

    /**
     * Ensures an AudioContext instance exists and is resumed.
     * @returns {AudioContext|null}
     */
    function ensureContext() {
      if (!ctx) {
        const Ctor = window.AudioContext || window.webkitAudioContext;
        if (!Ctor) return null;
        ctx = new Ctor();
      }
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      return ctx;
    }

    /**
     * Plays a soft chime using Web Audio oscillators.
     * @param {number} volume
     */
    function play(volume) {
      const audio = ensureContext();
      if (!audio) return;
      const gain = audio.createGain();
      const vol = clamp(volume ?? Storage.DEFAULT_CONFIG.volume, 0, 1);
      if (vol <= 0) return;
      const now = audio.currentTime + 0.02;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(Math.max(vol, 0.0001), now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);
      gain.connect(audio.destination);

      const oscA = audio.createOscillator();
      oscA.type = 'sine';
      oscA.frequency.setValueAtTime(880, now);
      oscA.frequency.exponentialRampToValueAtTime(660, now + 0.9);
      oscA.connect(gain);

      const oscB = audio.createOscillator();
      oscB.type = 'triangle';
      oscB.frequency.setValueAtTime(1320, now);
      oscB.frequency.exponentialRampToValueAtTime(990, now + 0.9);
      oscB.connect(gain);

      oscA.start(now);
      oscB.start(now + 0.04);
      oscA.stop(now + 1.2);
      oscB.stop(now + 1.1);

      setTimeout(() => {
        try {
          oscA.disconnect();
          oscB.disconnect();
          gain.disconnect();
        } catch (err) {
          Logger.debug('Chime cleanup issue', err);
        }
      }, 1600);
    }

    return { play };
  })();

  const Highlight = (() => {
    const observers = [];
    let lastHighlights = [];

    /**
     * Applies highlight markers to matching listings on page.
     * @param {PendingHighlight[]} hits
     */
    function apply(hits) {
      if (!hits.length) return;
      lastHighlights = hits;
      ensureObserver();
      highlightNow();
    }

    /**
     * Sets up MutationObserver on item market lists.
     */
    function ensureObserver() {
      if (observers.length) return;
      const target = () => document.querySelector('[class*="imMarket"]') ||
        document.querySelector('.item-market-page') ||
        document.querySelector('.imarket-container') ||
        document.body;

      const observer = new MutationObserver(() => {
        window.requestAnimationFrame(() => highlightNow());
      });
      const node = target();
      if (node) {
        observer.observe(node, { childList: true, subtree: true });
        observers.push(observer);
      } else {
        setTimeout(ensureObserver, 500);
      }
    }

    /**
     * Performs DOM mutation to highlight rows.
     */
    function highlightNow() {
      if (!lastHighlights.length) return;
      const rows = Array.from(document.querySelectorAll('tr, li, div'));
      lastHighlights.forEach((hit) => {
        const priceText = formatPrice(hit.price).replace(/,/g, '');
        rows.forEach((row) => {
          const text = row.innerText || '';
          if (!text) return;
          const idMatch = text.includes(String(hit.listingId));
          const priceMatch = text.includes(String(hit.price)) || text.includes(priceText);
          const itemMatch = text.toLowerCase().includes(hit.itemName.toLowerCase());
          if ((idMatch || priceMatch) && itemMatch) {
            if (!row.classList.contains('im-watch-hit')) {
              row.classList.add('im-watch-hit');
              const star = document.createElement('span');
              star.className = 'imwatch-hit-star';
              star.textContent = '⭐';
              row.appendChild(star);
            }
          }
        });
      });
    }

    return { apply };
  })();

  const Rules = (() => {
    /**
     * Evaluates if a listing satisfies a rule.
     * @param {WatchRule} rule
     * @param {MarketListing} listing
     * @returns {boolean}
     */
    function shouldAlert(rule, listing) {
      if (!rule.enabled) return false;
      if (!listing || typeof listing.price !== 'number') return false;
      if (rule.direction === 'lower') {
        return listing.price <= rule.thresholdPrice;
      }
      if (rule.direction === 'higher') {
        return listing.price >= rule.thresholdPrice;
      }
      return false;
    }

    /**
     * Normalises a rule name for display.
     * @param {WatchRule} rule
     * @returns {string}
     */
    function displayName(rule) {
      return rule.itemName || `Item ${rule.itemId}`;
    }

    return { shouldAlert, displayName };
  })();

  const Backoff = (() => {
    let penalty = 0;
    const MAX_BACKOFF = 5 * 60 * 1000;

    /**
     * Returns milliseconds until next allowed request after backoff.
     * @returns {number}
     */
    function getDelay() {
      return penalty;
    }

    /**
     * Registers a backoff-worthy error.
     */
    function increase() {
      penalty = penalty ? Math.min(penalty * 2, MAX_BACKOFF) : 15000;
    }

    /**
     * Resets accumulated backoff.
     */
    function reset() {
      penalty = 0;
    }

    return { getDelay, increase, reset };
  })();

  let lastBadKeyToast = 0;
  let lastBadKeyNotification = 0;

  const Watcher = (() => {
    let timer = null;
    let paused = false;
    const seen = new Map();

    document.addEventListener('visibilitychange', () => {
      paused = document.hidden;
      togglePausedState(paused);
      if (!paused) {
        schedule(1000 + Math.random() * 1000);
      }
    });

    Storage.subscribe(() => {
      schedule(2000);
    });

    /**
     * Starts the watcher loop.
     */
    function start() {
      if (!timer) {
        schedule(2000);
      }
    }

    /**
     * Schedules the next poll after delay milliseconds.
     * @param {number} delay
     */
    function schedule(delay) {
      clearTimeout(timer);
      timer = setTimeout(() => cycle(), delay);
    }

    /**
     * Executes one polling cycle, respecting visibility and backoff.
     * @param {boolean} manual
     */
    async function cycle(manual = false) {
      if (paused) return;
      const backoffDelay = Backoff.getDelay();
      if (backoffDelay && !manual) {
        Logger.info('Backoff active, delaying poll', backoffDelay);
        schedule(backoffDelay + Math.random() * 1000);
        return;
      }
      const config = Storage.getConfig();
      if (!config.apiKey) {
        Logger.info('API key missing; watcher idle.');
        schedule(10000);
        return;
      }
      const enabledRules = config.rules.filter((r) => r.enabled !== false);
      if (!enabledRules.length) {
        schedule(20000);
        return;
      }
      try {
        await ItemsCache.ensure(config.apiKey);
      } catch (err) {
        handleApiError(err);
        schedule(20000);
        return;
      }

      let anyAlerts = false;
      const grouped = groupRulesByItem(enabledRules);

      for (const [itemId, rules] of grouped.entries()) {
        try {
          const resp = await Api.fetchItemMarket(itemId, config.apiKey);
          if (resp.error) {
            handleApiError(resp.error);
            continue;
          }
          const listings = (resp.itemmarket && Object.values(resp.itemmarket)) || [];
          Logger.debug('Listings fetched', itemId, listings.length);
          for (const listing of listings) {
            const listingId = getListingId(listing);
            if (!listingId || hasSeen(listingId)) continue;
            for (const rule of rules) {
              if (Rules.shouldAlert(rule, listing)) {
                anyAlerts = true;
                rememberListing(listingId);
                produceAlert(rule, listing);
              }
            }
          }
        } catch (err) {
          handleApiError(err);
        }
      }
      if (anyAlerts) {
        Backoff.reset();
      }
      const interval = nextInterval(config.polling);
      schedule(interval);
    }

    /**
     * Forces a manual poll immediately.
     */
    function manualPoll() {
      cycle(true);
    }

    /**
     * Groups rules by item identifier.
     * @param {WatchRule[]} rules
     * @returns {Map<number, WatchRule[]>}
     */
    function groupRulesByItem(rules) {
      const map = new Map();
      rules.forEach((rule) => {
        if (!map.has(rule.itemId)) map.set(rule.itemId, []);
        map.get(rule.itemId).push(rule);
      });
      return map;
    }

    /**
     * Returns a random next interval obeying min/max constraints.
     * @param {{min:number,max:number}} polling
     * @returns {number}
     */
    function nextInterval(polling) {
      const min = clamp(polling.min || 15, 10, 300);
      const max = clamp(polling.max || 30, min + 5, 600);
      const interval = min * 1000 + Math.random() * (max - min) * 1000;
      Logger.debug('Next poll in', interval);
      return interval;
    }

    /**
     * Extracts numeric listing ID from API response.
     * @param {any} listing
     * @returns {number|null}
     */
    function getListingId(listing) {
      if (!listing) return null;
      const id = listing.ID || listing.id || listing.listingID;
      return id ? Number(id) : null;
    }

    /**
     * Checks if listing was already alerted.
     * @param {number} id
     * @returns {boolean}
     */
    function hasSeen(id) {
      pruneSeen();
      return seen.has(id);
    }

    /**
     * Stores listing ID in dedupe map.
     * @param {number} id
     */
    function rememberListing(id) {
      seen.set(id, Date.now());
    }

    /**
     * Removes stale entries from dedupe map.
     */
    function pruneSeen() {
      const cutoff = Date.now() - 60 * 60 * 1000;
      for (const [id, ts] of seen.entries()) {
        if (ts < cutoff) seen.delete(id);
      }
      if (seen.size > 5000) {
        const entries = Array.from(seen.entries()).sort((a, b) => a[1] - b[1]);
        entries.slice(0, entries.length - 3000).forEach(([id]) => seen.delete(id));
      }
    }

    /**
     * Handles API failures with backoff and toasts.
     * @param {any} error
     */
    function handleApiError(error) {
      Logger.error('API error', error);
      if (!error) return;
      const code = error.code || error.status;
      if (code === 429 || code === 5) {
        Backoff.increase();
        Toast.show('Torn API busy. Backing off and retrying shortly.');
      } else if (code === 2) {
        handleApiKeyFailure();
      } else if (error.type === 'timeout' || error.type === 'network') {
        Toast.show('Network issue reaching Torn API. Will retry.');
      }
    }

    /**
     * Creates alert UI, stores highlight data.
     * @param {WatchRule} rule
     * @param {MarketListing} listing
     */
    function produceAlert(rule, listing) {
      const payload = {
        itemName: Rules.displayName(rule),
        price: listing.price,
        seller: listing.seller_name || listing.seller || `ID ${listing.seller_id || '?'}`,
        quantity: listing.quantity || listing.qty || 1,
        timeSeen: new Date().toLocaleTimeString(),
        listingId: listing.ID || listing.id || listing.listingID,
        link: `https://www.torn.com/imarket.php#/p=shop&step=shop&type=${rule.itemId}`,
      };
      Popup.show(payload);
      AudioChime.play(currentConfig.volume ?? Storage.DEFAULT_CONFIG.volume);
      if (typeof GM_notification === 'function') {
        const comparator = rule.direction === 'lower' ? '≤' : '≥';
        const notificationText = `${payload.itemName}: ${formatPrice(payload.price)} (${comparator} ${formatPrice(rule.thresholdPrice)}) Qty ${payload.quantity}`;
        try {
          GM_notification({
            title: "lvciid's Market Watcher",
            text: notificationText,
            timeout: 8000,
            onclick: () => {
              try { window.focus(); } catch (err) { Logger.debug('window focus failed', err); }
              window.location.href = payload.link;
            },
          });
        } catch (err) {
          Logger.error('GM_notification failed', err);
        }
      }
      const pending = Storage.loadPendingHighlights();
      pending.push({
        listingId: payload.listingId,
        itemId: rule.itemId,
        price: listing.price,
        itemName: Rules.displayName(rule),
        timestamp: Date.now(),
      });
      Storage.savePendingHighlights(pending);
    }

    /**
     * Updates floating button paused appearance.
     * @param {boolean} state
     */
    function togglePausedState(state) {
      UI.setPaused(state);
    }

    return { start, manualPoll };
  })();

  const UI = (() => {
    let button = null;
    let drawer = null;
    let secondaryPanel = null;
    let volumeSlider = null;
    let isOpen = false;
    let secondaryOpen = false;
    let editingApiKey = false;
    let apiKeyError = false;
    let focusApiKeyField = false;

    /**
     * Initializes dashboard controls and bindings.
     */
    function init() {
      const cfg = Storage.getConfig();
      editingApiKey = !cfg.apiKey;
      button = document.createElement('button');
      button.className = 'imwatch-button';
      button.type = 'button';
      button.textContent = 'Market Watch';
      attachAurora(button);
      button.addEventListener('click', () => toggleDrawer());
      button.addEventListener('contextmenu', onButtonContextMenu);
      document.body.appendChild(button);

      drawer = document.createElement('div');
      drawer.className = 'imwatch-drawer';
      attachAurora(drawer);
      drawer.innerHTML = renderDrawer(cfg);
      if (editingApiKey) {
        requestApiKeyFocus();
      }
      bindDrawer(drawer);
      document.body.appendChild(drawer);

      secondaryPanel = document.createElement('div');
      secondaryPanel.className = 'imwatch-secondary';
      secondaryPanel.innerHTML = renderSecondary(cfg);
      document.body.appendChild(secondaryPanel);
      bindSecondary(secondaryPanel);
      updateVolume(cfg.volume);

      document.addEventListener('click', onDocumentClick);
      document.addEventListener('keydown', onDocumentKeydown);
    }

    /**
     * Renders drawer HTML string from configuration.
     * @param {ConfigState} cfg
     * @returns {string}
     */
    function renderDrawer(cfg) {
      const items = ItemsCache.listNames();
      const rules = cfg.rules || [];
      const polling = cfg.polling || { min: 15, max: 30 };
      const itemsOptions = items.map((name) => `<option value="${escapeHtml(name)}"></option>`).join('');
      const rulesHTML = rules.map((rule, index) => renderRule(rule, index)).join('') || '<div>No rules yet.</div>';
      const showApiInput = editingApiKey || !cfg.apiKey;
      const errorHtml = apiKeyError ? '<div class="imwatch-field-error">Torn rejected this API key. Please verify and try again.</div>' : '';
      const apiKeySection = showApiInput
        ? `<div class="imwatch-form-group">
          <label for="imwatch-api">API Key</label>
          <div class="imwatch-api-input">
            <input id="imwatch-api" type="password" placeholder="Paste Torn API key" value="${editingApiKey ? escapeHtml(cfg.apiKey || '') : ''}" autocomplete="off" />
            <button type="button" class="imwatch-save-key-btn">Save</button>
          </div>
          ${errorHtml}
        </div>`
        : `<div class="imwatch-form-group">
          <label>API Key</label>
          <div class="imwatch-api-pill" title="Click to update your Torn API key">
            <span class="imwatch-pill-dot"></span>
            <span class="imwatch-pill-text">API key saved</span>
            <button type="button" class="imwatch-edit-key">Change</button>
          </div>
        </div>`;

      return `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <div class="imwatch-title">lvciid's Market Watcher</div>
          <button type="button" class="imwatch-test-btn" style="padding:6px 10px;border-radius:12px;border:none;cursor:pointer;background:rgba(121,211,255,0.18);color:#9fd6ff;">Test</button>
        </div>
        ${apiKeySection}
        <div class="imwatch-inline">
          <div class="imwatch-form-group">
            <label for="imwatch-poll-min">Poll min (s)</label>
            <input id="imwatch-poll-min" type="number" min="10" max="600" value="${polling.min || 15}" />
          </div>
          <div class="imwatch-form-group">
            <label for="imwatch-poll-max">Poll max (s)</label>
            <input id="imwatch-poll-max" type="number" min="10" max="600" value="${polling.max || 30}" />
          </div>
        </div>
        <div class="imwatch-form-group">
          <label class="imwatch-toggle"><input type="checkbox" id="imwatch-logging"${cfg.logging ? ' checked' : ''}/> Enable debug log</label>
        </div>
        <div class="imwatch-form-group">
          <label for="imwatch-item-name">Add Rule</label>
          <input list="imwatch-items" id="imwatch-item-name" placeholder="Item name (typeahead)" autocomplete="off"/>
          <datalist id="imwatch-items">${itemsOptions}</datalist>
        </div>
        <div class="imwatch-inline">
          <div class="imwatch-form-group">
            <label for="imwatch-direction">Comparator</label>
            <select id="imwatch-direction">
              <option value="lower">Lower than</option>
              <option value="higher">Higher than</option>
            </select>
          </div>
          <div class="imwatch-form-group">
            <label for="imwatch-threshold">Price</label>
            <input id="imwatch-threshold" type="number" min="1" placeholder="e.g. 150000"/>
          </div>
        </div>
        <button type="button" class="imwatch-add-btn" style="width:100%;padding:8px 0;border:none;border-radius:12px;background:rgba(124,162,255,0.25);color:#dbe6ff;font-weight:600;cursor:pointer;">Add rule</button>
        <div class="imwatch-rules">
          ${rulesHTML}
        </div>
        <div style="font-size:11px;margin-top:8px;color:rgba(221,229,255,0.74);">
          ⭐ Data and API key stored locally only; not shared. Conforms to Torn API ToS.
        </div>
      `;
    }

    /**
     * Builds the auxiliary panel content.
     * @param {ConfigState} cfg
     * @returns {string}
     */
    function renderSecondary(cfg) {
      const volumePercent = Math.round(clamp(cfg.volume ?? Storage.DEFAULT_CONFIG.volume, 0, 1) * 100);
      return `
        <h5>Audio & Support</h5>
        <label>Chime volume
          <input class="imwatch-volume-slider" type="range" min="0" max="100" value="${volumePercent}" />
        </label>
        <div class="imwatch-secondary-info">If there are any problems contact lvciid [3888554]</div>
      `;
    }

    /**
     * Renders a single rule row.
     * @param {WatchRule} rule
     * @param {number} index
     * @returns {string}
     */
    function renderRule(rule, index) {
      const dir = rule.direction === 'lower' ? 'Lower than' : 'Higher than';
      return `
        <div class="imwatch-rule-row" data-index="${index}">
          <div class="imwatch-rule-head">
            <div>
              <div style="font-weight:600;">${escapeHtml(Rules.displayName(rule))}</div>
              <div style="font-size:11px;color:rgba(203,219,255,0.78);">${dir} ${formatPrice(rule.thresholdPrice)}</div>
            </div>
            <div class="imwatch-rule-actions">
              <label class="imwatch-toggle">
                <input type="checkbox" class="imwatch-rule-toggle"${rule.enabled !== false ? ' checked' : ''}/>
                On
              </label>
              <button type="button" class="imwatch-delete-btn" style="border:none;background:rgba(255,255,255,0.12);color:#ffeaf8;border-radius:10px;padding:4px 8px;cursor:pointer;">✕</button>
            </div>
          </div>
        </div>
      `;
    }

    /**
     * Binds event handlers for drawer controls.
     * @param {HTMLElement} root
     */
    function bindDrawer(root) {
      root.querySelector('.imwatch-add-btn').addEventListener('click', onAddRule);
      root.querySelector('.imwatch-test-btn').addEventListener('click', () => Watcher.manualPoll());
      root.querySelector('#imwatch-poll-min').addEventListener('change', onPollingChange);
      root.querySelector('#imwatch-poll-max').addEventListener('change', onPollingChange);
      root.querySelector('#imwatch-logging').addEventListener('change', onLoggingToggle);
      const saveKeyBtn = root.querySelector('.imwatch-save-key-btn');
      if (saveKeyBtn) saveKeyBtn.addEventListener('click', onSaveApiKey);
      const editKeyBtn = root.querySelector('.imwatch-edit-key');
      if (editKeyBtn) editKeyBtn.addEventListener('click', onEditApiKey);
      const apiInput = root.querySelector('#imwatch-api');
      if (apiInput) {
        apiInput.addEventListener('keydown', (evt) => {
          if (evt.key === 'Enter') onSaveApiKey();
        });
      }
      root.addEventListener('click', (evt) => {
        const row = evt.target.closest('.imwatch-rule-row');
        if (!row) return;
        const index = Number(row.dataset.index);
        if (evt.target.classList.contains('imwatch-delete-btn')) {
          deleteRule(index);
        } else if (evt.target.classList.contains('imwatch-rule-toggle')) {
          toggleRule(index, evt.target.checked);
        }
      });
      if (focusApiKeyField) {
        focusApiKeyField = false;
        const input = root.querySelector('#imwatch-api');
        if (input) setTimeout(() => input.focus(), 0);
      }
    }

    /**
     * Binds events for the secondary panel.
     * @param {HTMLElement} root
     */
    function bindSecondary(root) {
      volumeSlider = root.querySelector('.imwatch-volume-slider');
      if (volumeSlider) {
        volumeSlider.addEventListener('input', onVolumeInput);
      }
    }

    /**
     * Handles Add rule button.
     */
    async function onAddRule() {
      const cfg = Storage.getConfig();
      const apiKey = cfg.apiKey;
      if (!apiKey) {
        Toast.show('Enter your Torn API key first.');
        flagApiKeyError();
        return;
      }
      await ItemsCache.ensure(apiKey).catch((err) => {
        Logger.error(err);
        Toast.show('Failed to refresh items dictionary. Check API key.');
      });
      const nameInput = drawer.querySelector('#imwatch-item-name');
      const direction = drawer.querySelector('#imwatch-direction').value;
      const thresholdInput = drawer.querySelector('#imwatch-threshold');
      const threshold = Number(thresholdInput.value.trim());
      const name = nameInput.value.trim();
      if (!name || !Number.isFinite(threshold)) {
        Toast.show('Provide item name and price.');
        return;
      }
      const item = ItemsCache.findByName(name);
      if (!item) {
        Toast.show('Item not found in dictionary.');
        return;
      }
      const rules = cfg.rules.slice();
      rules.push({
        itemId: item.id,
        itemName: item.name,
        direction,
        thresholdPrice: threshold,
        enabled: true,
      });
      cfg.rules = rules;
      Storage.saveConfig(cfg);
      redraw();
      nameInput.value = '';
      thresholdInput.value = '';
    }

    /**
     * Handles polling min/max change.
     */
    function onPollingChange() {
      const cfg = Storage.getConfig();
      const min = Number(drawer.querySelector('#imwatch-poll-min').value);
      const max = Number(drawer.querySelector('#imwatch-poll-max').value);
      cfg.polling = {
        min: clamp(min, 10, 600),
        max: clamp(max, 10, 600),
      };
      Storage.saveConfig(cfg);
      redraw();
    }

    /**
     * Handles debug logging toggle.
     * @param {Event} evt
     */
    function onLoggingToggle(evt) {
      const cfg = Storage.getConfig();
      cfg.logging = evt.target.checked;
      Storage.saveConfig(cfg);
    }

    /**
     * Handles volume slider input.
     * @param {Event} evt
     */
    function onVolumeInput(evt) {
      const pct = Number(evt.target.value);
      if (Number.isNaN(pct)) return;
      const cfg = Storage.getConfig();
      cfg.volume = clamp(pct / 100, 0, 1);
      Storage.saveConfig(cfg);
    }

    /**
     * Persists API key from the input field.
     */
    function onSaveApiKey() {
      const input = drawer.querySelector('#imwatch-api');
      if (!input) return;
      const value = input.value.trim();
      if (!value) {
        apiKeyError = true;
        Toast.show('API key cannot be empty.');
        requestApiKeyFocus();
        redraw();
        return;
      }
      const cfg = Storage.getConfig();
      cfg.apiKey = value;
      Storage.saveConfig(cfg);
      editingApiKey = false;
      apiKeyError = false;
      Toast.show('API key saved.');
      redraw();
    }

    /**
     * Switches the API key section into edit mode.
     */
    function onEditApiKey() {
      editingApiKey = true;
      apiKeyError = false;
      requestApiKeyFocus();
      redraw();
    }

    /**
     * Handles auxiliary button context menu.
     * @param {MouseEvent} evt
     */
    function onButtonContextMenu(evt) {
      evt.preventDefault();
      evt.stopPropagation();
      toggleSecondaryPanel();
    }

    /**
     * Handles document-wide clicks to dismiss panels.
     * @param {MouseEvent} evt
     */
    function onDocumentClick(evt) {
      if (secondaryOpen && secondaryPanel && !secondaryPanel.contains(evt.target) && evt.target !== button) {
        closeSecondary();
      }
    }

    /**
     * Handles ESC key to close panels.
     * @param {KeyboardEvent} evt
     */
    function onDocumentKeydown(evt) {
      if (evt.key === 'Escape') {
        closeSecondary();
      }
    }

    /**
     * Deletes rule by index.
     * @param {number} index
     */
    function deleteRule(index) {
      const cfg = Storage.getConfig();
      cfg.rules = cfg.rules.filter((_, i) => i !== index);
      Storage.saveConfig(cfg);
      redraw();
    }

    /**
     * Toggles rule enabled flag.
     * @param {number} index
     * @param {boolean} enabled
     */
    function toggleRule(index, enabled) {
      const cfg = Storage.getConfig();
      if (cfg.rules[index]) {
        cfg.rules[index].enabled = enabled;
        Storage.saveConfig(cfg);
        redraw();
      }
    }

    /**
     * Redraws drawer content with latest configuration.
     * @param {HTMLElement} [root]
     */
    function redraw(root) {
      const cfg = Storage.getConfig();
      const target = root || drawer;
      if (!target) return;
      target.innerHTML = renderDrawer(cfg);
      bindDrawer(target);
    }

    function requestApiKeyFocus() {
      focusApiKeyField = true;
    }

    /**
     * Sets drawer open state.
     * @param {boolean} state
     */
    function setDrawerOpen(state) {
      if (!drawer) return;
      isOpen = state;
      drawer.classList.toggle('imwatch-open', isOpen);
    }

    /**
     * Toggles drawer open/closed.
     */
    function toggleDrawer() {
      closeSecondary();
      setDrawerOpen(!isOpen);
    }

    /**
     * Opens the drawer if currently closed.
     */
    function openDrawer() {
      if (!isOpen) {
        closeSecondary();
        setDrawerOpen(true);
      }
    }

    /**
     * Closes the drawer if currently open.
     */
    function closeDrawer() {
      if (isOpen) {
        setDrawerOpen(false);
      }
    }

    /**
     * Updates floating button paused appearance.
     * @param {boolean} state
     */
    function setPaused(state) {
      if (!button) return;
      button.classList.toggle('imwatch-paused', state);
      button.textContent = state ? 'Market Watch (paused)' : 'Market Watch';
    }

    /**
     * Sets secondary panel open state.
     * @param {boolean} state
     */
    function setSecondaryOpen(state) {
      if (!secondaryPanel) return;
      secondaryOpen = state;
      secondaryPanel.classList.toggle('imwatch-open', secondaryOpen);
    }

    /**
     * Opens the secondary panel.
     */
    function openSecondary() {
      setSecondaryOpen(true);
    }

    /**
     * Closes the secondary panel.
     */
    function closeSecondary() {
      setSecondaryOpen(false);
    }

    /**
     * Toggles the secondary panel.
     */
    function toggleSecondaryPanel() {
      setSecondaryOpen(!secondaryOpen);
    }

    /**
     * Updates the volume slider to reflect stored volume.
     * @param {number} volume
     */
    function updateVolume(volume) {
      if (!volumeSlider) return;
      const value = Math.round(clamp(volume ?? Storage.DEFAULT_CONFIG.volume, 0, 1) * 100);
      if (Number(volumeSlider.value) !== value) {
        volumeSlider.value = String(value);
      }
    }

    /**
     * Flags the API key input with an error and focuses it.
     */
    function flagApiKeyError() {
      apiKeyError = true;
      editingApiKey = true;
      requestApiKeyFocus();
      openDrawer();
      redraw();
    }

    return {
      init,
      setPaused,
      redraw,
      toggleDrawer,
      openDrawer,
      closeDrawer,
      openSecondary,
      closeSecondary,
      updateVolume,
      flagApiKeyError,
    };
  })();

  Storage.subscribe((cfg) => {
    UI.updateVolume(cfg.volume ?? Storage.DEFAULT_CONFIG.volume);
  });

  /**
   * Notifies the user about API key failures and opens the editor.
   */
  function handleApiKeyFailure() {
    const now = Date.now();
    const hasKey = !!(currentConfig && currentConfig.apiKey);
    const message = hasKey
      ? 'Torn API rejected your API key. Please update it in Market Watch.'
      : 'Add your Torn API key in Market Watch to enable alerts.';
    if (now - lastBadKeyToast > 12000) {
      Toast.show(message);
      lastBadKeyToast = now;
    }
    if (typeof GM_notification === 'function' && now - lastBadKeyNotification > 60000) {
      try {
        GM_notification({
          title: "lvciid's Market Watcher",
          text: message,
          timeout: 10000,
          onclick: () => {
            try { window.focus(); } catch (err) { Logger.debug('window focus failed', err); }
            UI.openDrawer();
          },
        });
      } catch (err) {
        Logger.error('GM_notification failed', err);
      }
      lastBadKeyNotification = now;
    }
    UI.flagApiKeyError();
  }

  /**
   * Escapes HTML characters.
   * @param {string} text
   * @returns {string}
   */
  function escapeHtml(text) {
    return (text || '').replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[ch]));
  }

  /**
   * Formats number into Torn price string.
   * @param {number} value
   * @returns {string}
   */
  function formatPrice(value) {
    if (!Number.isFinite(value)) return `${value}`;
    return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }

  /**
   * Clamps number into inclusive bounds.
   * @param {number} value
   * @param {number} min
   * @param {number} max
   * @returns {number}
   */
  function clamp(value, min, max) {
    if (!Number.isFinite(value)) return min;
    return Math.min(Math.max(value, min), max);
  }

  /**
   * Adds aurora/starfield layers to target node.
   * @param {HTMLElement} target
   */
  function attachAurora(target) {
    const aurora = document.createElement('div');
    aurora.className = 'imwatch-aurora';
    if (!prefersReducedMotion) {
      const starfield = document.createElement('div');
      starfield.className = 'imwatch-starfield';
      const stars = 20;
      for (let i = 0; i < stars; i += 1) {
        const star = document.createElement('div');
        star.className = 'imwatch-star';
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.animationDelay = `${Math.random() * 6}s`;
        starfield.appendChild(star);
      }
      target.appendChild(starfield);
    }
    target.appendChild(aurora);
  }

  /**
   * Prompts user for API key if missing.
   */
  function ensureApiKey() {
    const cfg = Storage.getConfig();
    if (!cfg.apiKey) {
      const key = prompt("lvciid's Market Watcher\\nEnter your Torn API key (kept locally):");
      if (key) {
        cfg.apiKey = key.trim();
        Storage.saveConfig(cfg);
      }
    }
  }

  /**
   * Consumes pending highlight queue and applies to DOM on item page.
   */
  function consumeHighlights() {
    const pending = Storage.loadPendingHighlights();
    if (!pending.length) return;
    const typeMatch = /type=(\\d+)/.exec(window.location.href);
    if (!typeMatch) return;
    const currentItemId = Number(typeMatch[1]);
    const matches = pending.filter((hit) => hit.itemId === currentItemId);
    if (!matches.length) return;
    Highlight.apply(matches);
    const remaining = pending.filter((hit) => hit.itemId !== currentItemId || Date.now() - hit.timestamp > 30 * 60 * 1000);
    Storage.savePendingHighlights(remaining);
  }

  function init() {
    ensureApiKey();
    UI.init();
    if (typeof GM_registerMenuCommand === 'function') {
      GM_registerMenuCommand("Open Market Watcher dashboard", () => UI.openDrawer());
      GM_registerMenuCommand("Toggle Market Watcher dashboard", () => UI.toggleDrawer());
      GM_registerMenuCommand("Audio settings", () => UI.openSecondary());
    }
    Watcher.start();
    consumeHighlights();
    window.addEventListener('hashchange', () => consumeHighlights());
  }

  // ---- Type annotations ----
  /**
   * @typedef {Object} ConfigState
   * @property {string} apiKey
   * @property {{min:number,max:number}} polling
   * @property {WatchRule[]} rules
   * @property {boolean} logging
   * @property {number} volume
   */

  /**
   * @typedef {Object} WatchRule
   * @property {number} itemId
   * @property {string} itemName
   * @property {"lower"|"higher"} direction
   * @property {number} thresholdPrice
   * @property {boolean} [enabled]
   */

  /**
   * @typedef {Object} MarketListing
   * @property {number} price
   * @property {number} quantity
   * @property {number} ID
   * @property {string} seller_name
   */

  /**
   * @typedef {Object} PopupPayload
   * @property {string} itemName
   * @property {number} price
   * @property {string} seller
   * @property {number} quantity
   * @property {string} timeSeen
   * @property {number} listingId
   * @property {string} link
   */

  /**
   * @typedef {Object} PendingHighlight
   * @property {number} listingId
   * @property {number} itemId
   * @property {number} price
   * @property {string} itemName
   * @property {number} timestamp
   */

  /**
   * @typedef {Object} ItemsCache
   * @property {number} timestamp
   * @property {Record<string,{id:number,name:string}>} byName
   */

  init();
})();
