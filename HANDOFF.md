# Bill Layne Insurance Home Inventory App Handoff

Last updated: 2026-09-01

## Program Links

- Local folder: `C:\Users\bill\OneDrive\Documents\Playground\HOME-INVENTORY`
- GitHub repository: `https://github.com/BillLayne/HOME-INVENTORY`
- **Live app (canonical): `https://www.billlayneinsurance.com/home-inventory/`**
- **Live source folder (edit this one): `C:\Users\bill\OneDrive\Documents\Playground\Bill-Layne-Insurance-Agency-penn-national-blog\home-inventory\`** — byte-identical to the live site as of 2026-09-01; part of the main website repo/deploy.
- This HOME-INVENTORY repo's `index.html` is now only a redirect stub to the live URL; its `assets/` bundle is stale and no longer served (GitHub Pages redirects to the main domain).
- AI API endpoint used by the compiled app: `https://home-inventory-bi2.pages.dev`
- Cloudflare Pages project: `home-inventory`
- Bill Layne Insurance homepage: `https://www.billlayneinsurance.com`

## 2026-09-01 Front-End Improvement Pass

Applied to the live source folder (`Bill-Layne-Insurance-Agency-penn-national-blog\home-inventory\`). Originals preserved as `index-CA0zizbw.js.bak` and `index.html.bak` next to the patched files — delete the `.bak` files after the deploy is confirmed good.

Bundle (`assets/index-CA0zizbw.js`) changes, all exact-string surgery:

- Print report client bar: fixed bug where `Property:` printed the customer name; now prints the address (both report variants share the helper).
- Print report rebrand: indigo `#4f46e5` -> BLI navy `#003f87`, headings `#001d42`, green coverage box -> navy scheme, Outfit font added to the print document.
- Detailed report no longer prints "No photos for this room." when empty.
- Barcode scan button only renders when `BarcodeDetector` + camera API exist (hides on iOS Safari instead of erroring).
- Confirm dialogs on item delete, room delete, and collection delete.
- Step 1 "Let's Start Inventory" is disabled until a name is entered.
- Inventory state (rooms, collections, customer info) persists to `localStorage` key `bliHomeInventoryState` and restores on reload; on quota failure it retries with photo data stripped. Step number is not persisted.
- Printing no longer uses `window.open` popups (popup blockers broke mobile). Reports render into a hidden same-page iframe and print from there. Note: `window.print()` is a no-op on iOS Safari regardless of approach — iPhone users should use the CSV export or print from the on-screen report.
- Distinct room icons for Garage (warehouse), Den (sofa), Basement (stairs), Attic (house).

`index.html` shim additions:

- Currency values use Outfit with tabular numerals instead of monospace.
- Report summary-card label kept to one line on mobile.

Still not done (future work): recovering the React source into version control (only the compiled bundle exists); true client-side PDF generation (jsPDF) for iOS users.

## What This App Does

This is a mobile-first home inventory tool for Bill Layne Insurance customers and prospects.
The customer takes or uploads room photos, the AI identifies household items, and the app creates a simple inventory with estimated replacement values.

The app is intended as a helpful insurance resource and starting point. It is not a final claims settlement tool or binding coverage recommendation.

## Hosting And Deployment

### Front End

The public front end is served from the main website at `https://www.billlayneinsurance.com/home-inventory/` (source: `Bill-Layne-Insurance-Agency-penn-national-blog\home-inventory\`). The old GitHub Pages URL `https://billlayne.github.io/HOME-INVENTORY/` now redirects there.

Primary files:

- `index.html`
- `assets/index-CA0zizbw.js`
- `assets/home-inventory-hero-visual.webp`
- `assets/home-inventory-hero-mobile.webp`

Most styling and UX work lives in `index.html` as CSS and small JavaScript shims layered over the compiled bundle. The React source is not available anywhere; the React bundle is compiled and committed as `assets/index-CA0zizbw.js`. Bundle edits are done as exact-string patches on the minified file — always keep a `.bak` copy and verify occurrence counts before writing.

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

### App-Specific Key Ledger

| App | Google Cloud Project | API Key Name | Cloudflare Pages Project | Cloudflare Secret | GitHub Repo Secret | Last Rotated | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Home Inventory App | Bill Layne Insurance - Home Inventory App | home-inventory-prod-gemini-2026-05 | home-inventory | GEMINI_API_KEY | None; frontend is GitHub Pages only | 2026-05-28 | Rotated in Cloudflare production and tested |

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
   Bill Layne Insurance - Home Inventory App
   ```

   Suggested API key name:

   ```text
   home-inventory-prod-gemini-2026-05
   ```

3. Copy the key once and store it in a secure password manager.

4. Open Cloudflare Dashboard.

5. Go to Workers & Pages.

6. Open the Pages project named:

   ```text
   home-inventory
   ```

   This project serves:

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

1. Open `https://www.billlayneinsurance.com/home-inventory/`.
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

Normal deployment flow for the live app: edit files in `Bill-Layne-Insurance-Agency-penn-national-blog\home-inventory\` and deploy with the main website's normal flow (Cloudflare Pages on that repo). This HOME-INVENTORY GitHub repo no longer serves the app — pushing here only updates the redirect stub and the backend function source copies.

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
