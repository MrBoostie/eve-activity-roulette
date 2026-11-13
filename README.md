# EVE Activity Roulette

A small, unofficial EVE Online fan tool for choosing what to do in New Eden.
26 equally likely activities, one questionable assignment at a time.

## Run locally

Open `index.html` directly in your browser, keeping `styles.css`, `roulette.js`,
and `app.js` alongside it. No installation is required.

Alternatively, with Node.js 22.12 or newer installed:

```sh
npm start
```

Open <http://127.0.0.1:4173>. This local preview server binds only to loopback.
There is no build step, runtime package dependency, account, or external API.
Both HTTP hosting and direct `file://` opening work with the classic scripts.

For deployment, publish `index.html`, `styles.css`, `app.js`, and `roulette.js`
together on any static host, including GitHub Pages. Asset paths are relative,
so repository subpaths work too. The development server is not a production server.

## Activities and wheel behaviour

`roulette.js` contains the activity catalogue and testable wheel mathematics.
Each activity has a title, duration, and description. Add entries there: the
segment angles, colour stops, numbered labels, outcome count, and cards all
derive from that one catalogue. Numbers keep 26 long titles from colliding on
the wheel; the full names and durations remain in the ordered outcome list.
The current assignment also shows its description and marks the matching card.

Each spin chooses one equal-sized random interval. Segment zero is centred at
the top pointer; later spins account for the current rotation before targeting
the next segment. The button stays disabled until the transform ends, with a
CSS-duration-based fallback if the browser omits the transition event.

Keyboard activation and visible focus are supported. The result is an atomic,
polite live region; decorative wheel labels are hidden from assistive technology.
Reduced-motion preferences skip the wheel animation. The spin button uses
`aria-disabled` during animation with an explicit re-entry guard, preserving
keyboard focus across browsers. No automatic scrolling or focus changes occur
after a result.

## Tests

```sh
npm ci
npm test
npx playwright install --with-deps chromium firefox webkit
npm run test:browser
```

The Node tests cover the original 16 plus exactly 10 new options, random selection
boundaries, data-driven rendering geometry, and repeated-spin pointer alignment.
Playwright checks Chromium, Firefox, and WebKit: every outcome, actual on-screen
pointer alignment, keyboard input, reduced motion, duplicate-click protection,
missing transition events, direct-file opening, JavaScript-disabled messaging,
and widths from 320 to 1440 pixels. Axe checks for automatically detectable WCAG A/AA violations before
and after a spin. Automated checks do not replace manual screen-reader testing.

GitHub Actions runs both suites on pushes and pull requests. npm dependencies are
development-only and locked in `package-lock.json`.
