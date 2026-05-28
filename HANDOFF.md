# Bill Layne Insurance Home Inventory App Handoff

Last updated: 2026-05-28

## Program Links

- Local folder: `C:\Users\bill\OneDrive\Documents\Playground\HOME-INVENTORY`
- GitHub repository: `https://github.com/BillLayne/HOME-INVENTORY`
- Public app: `https://billlayne.github.io/HOME-INVENTORY/`
- AI API endpoint used by the compiled app: `https://home-inventory-bi2.pages.dev`
- Bill Layne Insurance homepage: `https://www.billlayneinsurance.com`

## What This App Does

This is a mobile-first home inventory tool for Bill Layne Insurance customers and prospects.
The customer takes or uploads room photos, the AI identifies household items, and the app creates a simple inventory with estimated replacement values.

The app is intended as a helpful insurance resource and starting point. It is not a final claims settlement tool or binding coverage recommendation.

## Hosting And Deployment

### Front End

The public front end is served by GitHub Pages:

- Live URL: `https://billlayne.github.io/HOME-INVENTORY/`
- Main branch: `main`
- Primary files:
  - `index.html`
  - `assets/index-CA0zizbw.js`
  - `assets/home-inventory-hero-visual.webp`
  - `assets/home-inventory-hero-mobile.webp`

Most recent styling and UX work lives in `index.html` as CSS and small JavaScript shims. The React source is not in this repository; the React bundle is compiled and committed as `assets/index-CA0zizbw.js`.

### AI Back End

The compiled React app calls these Cloudflare Pages Function URLs directly:

- `https://home-inventory-bi2.pages.dev/api/inventory`
- `https://home-inventory-bi2.pages.dev/api/product`
- `https://home-inventory-bi2.pages.dev/api/reevaluate`

The function source files in this repo are:

- `functions/api/inventory.ts`
- `functions/api/product.ts`
- `functions/api/reevaluate.ts`

Important: GitHub Pages does not run the `functions/api` files. Those functions must be deployed through Cloudflare Pages or another compatible serverless host.

## AI Provider And Required Key

The backend uses Google Gemini through `@google/genai`.

Current model:

```text
gemini-2.5-flash
```

Required environment variable:

```text
GEMINI_API_KEY
```

Fallback supported by the code:

```text
API_KEY
```

Use `GEMINI_API_KEY` for the new setup. Do not put the API key in `index.html`, the React bundle, GitHub, screenshots, or any public file.

Official reference:

- Google Gemini API key docs: `https://ai.google.dev/gemini-api/docs/api-key`
- Google AI Studio key page: `https://aistudio.google.com/apikey`
- Cloudflare Pages variables/secrets docs: `https://developers.cloudflare.com/pages/functions/bindings/`

## Recreating The Deleted API Project And Key

1. Go to Google AI Studio:

   `https://aistudio.google.com/apikey`

2. Create a new API key.

   Suggested project name:

   ```text
   Bill Layne Home Inventory
   ```

3. Copy the key once and store it in a secure password manager.

4. Open Cloudflare Dashboard.

5. Go to Workers & Pages.

6. Open the Pages project that serves:

   ```text
   home-inventory-bi2.pages.dev
   ```

7. Go to Settings, then Variables and Secrets.

8. Add a production secret:

   ```text
   GEMINI_API_KEY = your_new_google_ai_studio_key
   ```

9. If preview deployments are used, add the same secret to Preview as well.

10. Redeploy the Cloudflare Pages project after adding the secret.

11. Test the API directly before testing the full app.

## Quick API Test

After adding the new Gemini key in Cloudflare, run this from PowerShell:

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri "https://home-inventory-bi2.pages.dev/api/product" `
  -ContentType "application/json" `
  -Body '{"barcode":"036000291452"}'
```

Expected result:

- A JSON response with a product name and notes.

Common failure results:

- `API_KEY not set`: the Cloudflare secret is missing or named incorrectly.
- `Product lookup failed`: the key may be invalid, quota may be unavailable, Gemini may be down, or the AI returned malformed JSON.
- Browser app says AI failed: test the API endpoint first, then test the full app.

## Full App Test Checklist

After the new key is working:

1. Open `https://billlayne.github.io/HOME-INVENTORY/`.
2. Start the inventory.
3. Enter basic customer details.
4. Choose a room.
5. Upload or take a room photo.
6. Click the AI list/create action.
7. Confirm the wait overlay appears while parsing.
8. Confirm inventory items are returned.
9. Generate the report.
10. Confirm print/download works.

## Important Implementation Notes

- The app is intentionally mobile-first.
- The frontend privacy language says photos stay private and are used only to identify items.
- The final report should use print/download, not email, because there is no email API.
- The AI endpoint URL is hard-coded inside the compiled bundle.
- If the Cloudflare project URL changes, the compiled React bundle must be regenerated or edited to point to the new API URL.
- Keep `GEMINI_API_KEY` server-side only.
- Do not expose the key in client-side JavaScript.

## Current Git Status Notes

The `.claude/` folder may appear as untracked locally. It is not part of the app and should not be committed unless there is a specific reason.

Normal deployment flow:

```powershell
git status
git add index.html assets functions
git commit -m "Describe the change"
git push origin main
```

GitHub Pages usually updates shortly after the push, but it can take a minute or two.

## Future Developer Notes

If rebuilding in Google AI Studio:

- Preserve the Bill Layne Insurance standalone hero styling.
- Preserve mobile-first room/photo flow improvements.
- Preserve the AI parsing wait overlay.
- Preserve print/download report behavior.
- Preserve HEIC/iPhone image handling.
- Keep the API key out of the front-end bundle.

If the backend is moved away from Cloudflare:

- Keep the same three routes if possible:
  - `/api/inventory`
  - `/api/product`
  - `/api/reevaluate`
- Update the compiled app endpoint URL or rebuild the app.
- Retest CORS.
- Retest photo upload and barcode/product lookup.
