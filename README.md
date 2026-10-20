# VistaCortex BuildFeast 2027

The public SEO URL is `https://buildfeast.vistacortex.in`. FAQs live at `/faq`, with their own title, description, and canonical URL. The homepage links to them rather than rendering the entire FAQ list. `server/seo.mjs` supplies crawlable HTML and Organization/WebSite/WebPage structured data; Vite uses the same renderer in development and builds. `public/robots.txt` and `public/sitemap.xml` include the confirmed domain and public pages. The organizer page sends `noindex`. Exact dates and venue addresses are pending, so Event rich-result markup is deliberately withheld until those details are confirmed. This configuration does not deploy the website or configure DNS.

Responsive React + TypeScript + Vite site, Tailwind CSS, Framer Motion, a Canvas particle globe, and an Express API with durable SQLite storage. Node.js **24 or newer** is required for built-in SQLite. There was no existing code or logo in the supplied workspace.

## Run locally

```powershell
npm.cmd install
Copy-Item .env.example .env
# Set ADMIN_PASSWORD in .env to a unique password (16+ characters).
npm.cmd run dev
```

Open http://localhost:5173. The API runs on port 3001; Vite forwards `/api` requests to it. The dashboard is at `/organizer`. It is disabled until a valid server-side administrator password is configured. No default credentials are shipped.

## Build, test, and serve

```powershell
npm.cmd test
npm.cmd run build
npm.cmd start
```

The production server serves `dist` and the API at http://localhost:3001. Keep the server running for forms to work. **Uploading only `dist` to a static host will not provide the registration database or dashboard.**

## Deployment

For a temporary Vercel frontend preview, import this repository with the root directory set to the repository root. `vercel.json` configures Vite, `npm run build`, the `dist` output directory, and FAQ page routing. No environment variables are needed for this preview. The frontend uses its bundled event configuration when the API is unavailable. The Express API, SQLite database, organizer dashboard authentication, payments, and participant submissions are unavailable on this static preview. Connect a supported backend/storage integration before enabling submissions. The SEO canonical domain remains `https://buildfeast.vistacortex.in`.

Deploy to a Node 24+ host with a persistent disk. Run `npm ci`, `npm run build`, and `npm start`. Put the server behind an HTTPS reverse proxy forwarding to `127.0.0.1:3001`. Set `NODE_ENV=production`, `PUBLIC_ORIGIN=https://your-real-domain`, `ADMIN_PASSWORD`, and `DATABASE_PATH` pointing at persistent private storage. If needed, configure `TRUST_PROXY_HOPS` for the exact number of trusted proxy hops; do not trust arbitrary forwarding headers.

Keep `.env`, SQLite files, and database backups private. SQLite is not encrypted by this application; use encrypted storage, restrict file permissions to the service account, and secure backups. Use a single server instance or migrate to a managed database for horizontal scaling. Back up SQLite using its backup facilities, including correct handling of WAL state. Review security, data retention, and organizer access before public launch.

## One place for event content

`src/config/event.json` contains official event details, fee and fee basis, dates, workshop topics, speakers, team rules, prizes, internships, partner names/logo paths, social links, contact details, and policies. `src/config/event.ts` supplies its frontend type/defaults. The API reads the JSON as its initial configuration.

Authenticated organizers can edit the same structured configuration in `/organizer`; edits persist as a database override. Once an override exists, it takes precedence over the file. Edit through the dashboard to update it, or deliberately remove the `event` settings row to restore file-based configuration. Never store credentials in the public configuration. Unknown fields, unsafe links, and invalid structures are rejected.

The official VistaCortex BuildFeast 2027 logo is used in the header, hero, and footer at `public/assets/vistacortex-buildfeast-2027.png`, with its original proportions preserved. Older saved event configurations pointing to the previous logos also display the official event logo. Partner names remain plain text until genuine partner logos are supplied. To add approved SEO assets, place them in `public/` and add the favicon and `og:image` tags to `index.html`, using an absolute deployed URL for the sharing image.

## Implemented integrations

- Public submissions are disabled by default with `ENABLE_FORM_SUBMISSIONS=false`. Google Sheets is not connected. Enabling submissions currently uses SQLite; integrate the chosen storage before turning this on. Third-party checkout also requires `ALLOW_THIRD_PARTY_CHECKOUT=true`. Existing database records are not deleted.
- When enabled, waitlist entries and mentoring questions are validated on both client and server, saved in SQLite, and deduplicated. Consent timestamps are stored. Form success/error/loading/retry states are implemented. No browser-local registration storage is used.
- Organizer authentication uses a server-side password hash comparison, random session tokens stored hashed in SQLite, 1-hour expiration, and bearer tokens held only in page memory (no cookies or browser storage; refresh signs out). Organizer data and CSV export are protected. CSV cells are escaped against formula injection. The dashboard provides search, relevant filters, payment statuses, question review, and a central configuration editor.
- Requests have size limits, rate limits, same-origin checks, and security headers. Client responses never contain server credentials.
- Razorpay order creation, backend signature verification, provider-side payment status/amount/order/currency verification, and a signed webhook are implemented. Frontend callbacks do not mark payments paid. Emails are unique, orders are reserved before contacting the provider, repeated callbacks are idempotent, and ambiguous order errors require organizer reconciliation to prevent duplicate charges.
- **Live payments are inactive and have not been live-tested.** Supply `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` as server secrets. Configure automatic capture in Razorpay, register `https://your-domain/api/payments/webhook` for `payment.captured` and `payment.failed`, test with Razorpay test credentials, and confirm pending/failed/cancelled/success flows before using live keys. Uncaptured payments remain pending. Store and reconcile orphaned provider orders rather than retrying them blindly.
- A successful verified payment displays a unique registration ID. Email sending is **not configured**; waitlist submission saves interest for organizer-managed event updates, it does not send an email. Export entries for an approved mail provider or add a server-side transactional mail integration before promising automatic email delivery.

## Business and brand details still required

- Genuine partner assets; approved favicon and social image. The supplied VistaCortex logo is integrated.
- Exact program dates; opening and registration deadlines; confirmed eligibility, fee basis (per participant or per team), team-size rules, and hackathon participation/submission/judging/presentation/certificate policies.
- Speakers/guest professional, final workshop topics, and partner links (if applicable).
- Prize categories/amounts/winners/eligibility. No amounts are inferred.
- Internship roles, duration, provider, eligibility, selection criteria, and allocation of the stated ₹20,000 value. The site does not claim the value is per participant or the total.
- Organizer contact email, privacy contact, retention/deletion policy, final terms, and refund/cancellation policy. Policy panels currently explain this pending status and the implemented data handling; obtain organizer approval before publishing.
- Set `teamRules.minimum`, `teamRules.maximum`, and `teamRules.individualAllowed` explicitly. They have no inferred defaults. Paid registration validates these rules and requires permission to submit team members' details. Set `registrationDeadline` to an ISO date/time with timezone (for example, `2027-02-01T23:59:00+05:30` only if that deadline is confirmed); orders are rejected after the configured deadline.
- Payment credentials and a persistent HTTPS deployment. Paid registration is blocked until credentials, fee basis, eligibility, team rules, deadline, rules, refund policy, and contact fields are configured.

## Accessibility and motion

The warm light interface includes green, lavender, and amber surfaces, a sticky navigation bar, scroll progress, animated program transitions with next-day navigation, searchable animated FAQs, floating globe labels, and hover feedback. Semantic sections, accessible form labels and dialogs, native dialog focus containment/escape handling, keyboard-operated day tabs and FAQs, focus outlines, and a skip link are included. Reduced motion disables transitions and globe rotation while retaining a rendered particle sphere. The globe uses capped device pixel ratio and frame rate, fewer particles on mobile, and pauses when hidden or offscreen. Fonts are system fonts with no external font requests.

Automated API checks are in `tests/api.test.mjs`; run them with `npm test`. Test records use a temporary database, not the organizer database. Real gateway behavior and email delivery require separate integration testing.
