# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project overview
- This repo contains two parts:
  - Next.js app in for-pappa-next (Clerk auth, Cloudinary uploads, XLSX processing, PDF generation via Puppeteer)
  - Standalone Node scripts at the repo root to inspect and split/convert an Excel file

Prerequisites and environment
- Install dependencies separately in both locations:
  - Root: npm install
  - for-pappa-next: npm install
- Environment variables (used by the Next.js app):
  - NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
  - Place them in for-pappa-next/.env.local for local development. Do not commit secrets.

Common commands
- Root (utility scripts):
  - Install deps: npm install
  - Inspect Excel columns (updates path in the script if needed):
    - pwsh: node .\check-columns.js
  - Split and convert to PDFs (uses hardcoded file path/column and Puppeteer):
    - pwsh: node .\quick-split-to-pdf.js

- Next.js app (for-pappa-next):
  - Install deps: npm install
  - Start dev server: npm run dev
  - Build production: npm run build
  - Start production server (after build): npm run start
  - Lint: npm run lint

- Single-test note: There is no test framework configured in this repository. Add a test runner (e.g., Jest/Playwright) before running single tests.

High-level architecture and flow
- Frontend (src/app/page.js)
  - Client component with Clerk user context; presents an XLSX file upload UI (10 MB limit, .xlsx enforced in UI)
  - POSTs the selected file as multipart/form-data to /api/upload
  - After upload, presents processing options:
    - Serial Column Name input (default: "Del.Challan")
    - Checkbox to also create split XLSX files alongside PDFs
  - POSTs JSON to /api/process with { publicId, serialColumn, createXlsxFiles }
  - Renders enhanced processing summary with detailed statistics and per-serial PDF/XLSX links

- API routes
  - Upload (src/app/api/upload/route.ts)
    - Requires auth (checked via Clerk; also protected by middleware matcher – see Middleware)
    - Validates MIME type (xlsx/xls/csv/pdf/images) and size (<= 10 MB)
    - Uploads to Cloudinary
      - resource_type: image for image/*, otherwise raw
      - public_id template: {userId}_{timestamp}_{originalNameWithoutExt}
      - Returns publicId, secureUrl, originalFilename, format, resourceType, bytes
  - Process (src/app/api/process/route.js) - Enhanced with quick-split-to-pdf.js logic
    - Checks auth in-route (returns 401 if not signed in)
    - Downloads the uploaded file from Cloudinary (resource_type: raw)
    - Parses first sheet with xlsx; groups rows by serialColumn (configurable, default "Del.Challan")
    - Enhanced grouping with better error handling, skipped row tracking, and sorted serial number processing
    - For each group:
      - Optionally creates split XLSX file (if createXlsxFiles=true) and uploads to Cloudinary (folder processed-xlsx)
      - Renders an HTML table representing that group
      - Generates a PDF with Puppeteer (enhanced with better browser args) directly to a Buffer
      - Uploads the PDF to Cloudinary (folder processed-pdfs, resource_type raw, format pdf)
    - Responds with enhanced data: { success, totalGroups, totalRows, skippedRows, pdfsCreated, xlsxCreated, serialNumberRange, results: [{ serialNumber, rowCount, pdfUrl, pdfPublicId, xlsxUrl?, xlsxPublicId? }] }

- Helpers (inline within routes)
  - convertToHTML(data): creates a simple styled HTML table from an array of row objects

- Middleware (src/middleware.ts)
  - Clerk middleware runs for all API routes (matcher includes /(api|trpc)(.*))
  - It explicitly protects /api/upload via auth.protect(); /api/process enforces auth inside the route handler

- Configuration (for-pappa-next)
  - next.config.mjs maps Cloudinary vars (CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET) from env
  - package.json scripts: dev/build/start/lint
  - Tailwind and ESLint are present (Tailwind v4 setup via @tailwindcss/postcss)

Development notes
- Running locally
  - Ensure for-pappa-next/.env.local defines valid Cloudinary credentials. Clerk must also be configured for sign-in to work.
  - Puppeteer downloads its own Chromium. If you encounter launch issues on Windows, consider setting PUPPETEER_EXECUTABLE_PATH to a local Chrome/Chromium.
- File handling
  - The frontend restricts uploads to .xlsx in the file picker, but the API accepts additional formats; rely on server-side validation.
  - Serial column default is "Del.Challan"; adjust in the UI request if your XLSX differs.
- Large inputs
  - The PDF page size is fixed (width 1450px, height 500px). If rows overflow, adjust sizes or switch to pagination.

How to exercise endpoints manually (without UI)
- Upload (multipart/form-data) and receive Cloudinary publicId in response, then POST to /api/process with that publicId. Both endpoints require an authenticated Clerk session; use the web UI to sign in first, then call endpoints from the browser or a client authenticated to the same session.

