# lvciids-market-watcher

lvciid's Market Watcher is a Tampermonkey userscript for torn.com that keeps an eye on Item Market listings and alerts you when prices move above or below the thresholds you set. The dashboard lets you manage multiple rules, tweak polling intervals, and test your setup on demand. Alerts are delivered both as in-page popups and optional browser notifications, and matching listings on the market page are highlighted with an aurora-styled accent and ⭐ icon so you can spot them instantly.

## Key Features
- Item lookup with cached Torn item dictionary (refreshes every 24 hours).
- Multiple watch rules with “Lower than” and “Higher than” comparators.
- Randomized polling cadence (15–30s by default) that pauses while the tab is hidden.
- Friendly popups, optional `GM_notification`, soft notification chime, and MutationObserver-powered highlights.
- Right-click the floating button for volume control and a quick support link.
- Local-only storage of API key, rules, and settings via `GM_setValue`.
- Aurora-themed floating control button with accessibility fallback for reduced motion.

## Installation
1. Install the Tampermonkey browser extension if you have not already.
2. Click the download link below and approve the install prompt in Tampermonkey.

Download via Tampermonkey: [Install lvciid's Market Watcher](lvciids-market-watcher.user.js)

## Usage
1. Open torn.com and wait for the floating “Market Watch” button to appear in the lower-right corner.
2. Click the button to open the dashboard, then paste your Torn API key into the field provided. (The key is stored locally and never shared.)
3. Use the typeahead to add rules for the items you want to monitor, set price thresholds, and choose whether you want alerts for lower or higher prices.
4. Leave the dashboard open or closed as you prefer—the watcher will continue polling in the background when the tab is visible.
5. When an alert fires, follow the popup link to the Item Market page; matching rows will be highlighted automatically.
6. Right-click the floating button any time to adjust the chime volume or grab the support contact.

## Support
If there is any issue with this script please contact lvciid: https://www.torn.com/profiles.php?XID=3888554
