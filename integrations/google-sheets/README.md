# Connect BuildFeast registration to Google Sheets

The registration page is at /register. It supports individual and team entries, selection of one of the eight problem statements, consent, and a review step. Nothing is submitted until the server connection below is enabled. No payment is collected by this flow.

## 1. Prepare your sheet

Open https://docs.google.com/spreadsheets/d/1A-z-BM13Nj8y9DAM_-DX3ouGfQE6ulT9CVxOjB25sAQ/edit and choose **Extensions → Apps Script**.

Replace the editor contents with **Code.gs** from this directory. Save, choose **setupRegistrationSheet** in the function selector, and click **Run**. Authorize the spreadsheet access under your own Google account. This creates the **Registrations** tab, headers and a random server secret. Existing unrelated tabs are preserved.

Keep spreadsheet access limited to authorized organizers. The web app can accept entries without making the spreadsheet public.

## 2. Deploy the receiver

Choose **Deploy → New deployment → Web app**:

- Execute as: **Me** (the spreadsheet owner).
- Who has access: **Anyone**. The script checks a separate secret before accepting writes.

Authorize and deploy. Copy the **Web app URL** ending in **/exec**. The spreadsheet edit URL and /dev test URL are not submission endpoints.

In Apps Script, open **Project Settings → Script properties** and copy the generated **REGISTRATION_SECRET**. Do not put it in the browser, Google Sheet cells, chat, Git, or any VITE_ variable.

## 3. Connect the server

In Vercel → project → Settings → Environment Variables, add:

    REGISTRATION_SHEETS_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
    REGISTRATION_SHEETS_SECRET=the-generated-script-property-value
    ENABLE_REGISTRATION_SUBMISSIONS=true

For local development, put the same variables in the ignored .env file and restart the API server. Vite proxies /api requests to that server. Existing waitlist/mentoring and paid-checkout flags remain separate.

Redeploy Vercel after changing production environment variables. No new packages are required for the receiver: /api/registration/submit is a Vercel function and is also mounted on the local Express server.

## Stored fields

One row per entry: registration reference, request ID, UTC timestamp, participant name, email, optional phone, institution, city/state, participation mode, team name, team size (up to 4 including the lead), teammates with names, emails and optional phone numbers as JSON, problem statement, consent timestamp, teammate consent, entry status, and a fingerprint used to protect retries.

An entry receipt is not admission or proof of payment. Event fee and final rules remain pending. Retrying an unchanged request returns the same reference; changing an already received request requires organizer follow-up.

## Before opening entries

Set the confirmed privacy contact in the event configuration. Agree on organizer access and a deletion/retention policy. This implementation has input validation, duplicate-email checks, same-origin browser checks and a best-effort per-instance rate limit; production traffic controls should also be configured in Vercel if needed.

The /exec deployment URL is safe to share with the developer; keep its secret only in your server environment. To update receiver code later, use **Deploy → Manage deployments → Edit → New version**.

Official reference: https://developers.google.com/apps-script/guides/web
