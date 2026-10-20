# Verification — 9 October 2026

- `npm run build`: passed (TypeScript and Vite production bundle).
- `npm test`: 12 tests passed, 0 failed, using disposable SQLite databases.
- Compiled application loaded at `http://127.0.0.1:3001`; no errors or warnings in its fresh browser console.
- Responsive browser checks at desktop, tablet (820 × 1180), and mobile (390 × 844) sizes. No horizontal document overflow in inspected desktop/tablet/mobile views.
- Waitlist: empty required inputs blocked; valid form submitted and displayed a success message; its database record was verified through persistence and removed after testing. Duplicate-email normalization and server-side invalid inputs are also covered by API tests.
- Event navigation, mobile menu open/close, program day changes, keyboard arrow navigation, mentoring question dialog, FAQ expansion, and policy dialogs were exercised in the browser.
- Organizer dashboard: signed in, opened the central configuration editor, saved configuration, and signed out against a separate disposable database. Private endpoints, CSV protection, session revocation, configuration validation, and CSV formula escaping are covered by API tests.
- Registration fee is ₹300. Fee basis remains unconfirmed. The default state is `coming_soon`; server rejects paid orders in this state.
- Internship wording preserves 3 selected participants and ₹20,000 stated value with no allocation assumption. Prize amounts remain pending. Official partners are DONDEAL, COMPANY EXPRESS, and DHARMA SETU (added at the organizer's request on 10 October 2026).
- Payment security tests exercised forged signatures, signed webhook amount/currency/order mismatches, captured-payment confirmation, replay idempotency, and late failed events. **No real Razorpay orders or payments were made; live integration requires credentials and provider testing.**
- The Canvas globe renders in desktop, mobile, and compiled previews. Reduced-motion handling, frame-rate/DPR caps, visibility pausing, and mobile particle reduction are implemented. The operating system's reduced-motion setting was not toggled during browser QA.
- The supplied VistaCortex PDF logo is integrated into the header and footer. At the user's request, its cream background is removed and lettering changed to a light color for the dark website, retaining the original green symbol, lettering shapes, and proportions. Partner logo files, favicon, and approved social image remain pending.
- No email delivery provider or public deployment is configured. See README for persistent Node hosting, secrets, policies, and remaining business decisions.

Generated output: `dist/`. Source overview: `src/App.tsx`, `src/styles.css`, `src/config/event.json`, `src/components/`, `src/Dashboard.tsx`, `server/index.mjs`, `tests/`, `index.html`, and build/package configuration. No pre-existing files were replaced because the workspace was empty.
