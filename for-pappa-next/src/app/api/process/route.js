export const runtime = 'nodejs';
export const maxDuration = 60; // optional: give Puppeteer time

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { v2 as cloudinary } from "cloudinary";
import * as XLSX from "xlsx";
import puppeteerCore from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import path from "path";
import fs from "fs";
import { Readable } from "stream";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Function to convert XLSX data to HTML table
 * Enhanced version from quick-split-to-pdf.js
 * @param {Array} data - Array of objects representing Excel rows
 * @returns {string} HTML string with table
 */
function convertToHTML(data) {
  if (!data || data.length === 0) return "<p>No data found</p>";

  const headers = Object.keys(data[0]);

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 2px solid #000000; padding: 8px; text-align: left; }
        th { background-color:rgb(255, 255, 255); font-weight: bold; }
        tr:nth-child(even) { background-color:rgb(255, 255, 255); }
      </style>
    </head>
    <body>
      <table>
        <thead>
          <tr>
  `;

  // Add headers
  headers.forEach((header) => {
    html += `<th>${header}</th>`;
  });

  html += `
          </tr>
        </thead>
        <tbody>
  `;

  // Add data rows
  data.forEach((row) => {
    html += "<tr>";
    headers.forEach((header) => {
      html += `<td>${row[header] || ""}</td>`;
    });
    html += "</tr>";
  });

  html += `
        </tbody>
      </table>
    </body>
    </html>
  `;

  return html;
}

/**
 * Function to convert HTML to PDF using Puppeteer (returning Buffer instead of saving to file)
 * Enhanced version from quick-split-to-pdf.js
 * @param {string} html - HTML content
 * @param {number} rowCount - Number of rows to help determine dynamic width
 * @returns {Buffer} PDF buffer
 */
async function convertHTMLToPDFBuffer(html, rowCount = 0) {
  const isProduction = process.env.NODE_ENV === 'production';

  // Prefer an explicit Chrome path if provided by the platform
  const envExecutablePath = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_EXECUTABLE_PATH;

  let browser;
  if (!isProduction) {
    console.log('[pdf] Launching local Puppeteer (dev mode)');
    // Local development uses full puppeteer
    browser = await (await import('puppeteer')).default.launch({ headless: true });
  } else if (envExecutablePath) {
    console.log('[pdf] Launching puppeteer-core with env executable path:', envExecutablePath);
    // Platforms with preinstalled Chrome/Chromium (Docker, VM, some PaaS)
    browser = await puppeteerCore.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      executablePath: envExecutablePath,
      headless: 'new',
    });
  } else {
    // Serverless (AWS Lambda/Vercel) with @sparticuz/chromium
    const chromiumExecPath = await chromium.executablePath();
    console.log('[pdf] Launching puppeteer-core with @sparticuz/chromium. execPath:', chromiumExecPath);
    browser = await puppeteerCore.launch({
      args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: chromiumExecPath,
      headless: chromium.headless,
    });
  }
  const page = await browser.newPage();

  // Determine dynamic width based on rowCount with a minimum of 1450px
  // Scales gently after 50 rows, capped to prevent extreme sizes
  const minWidthPx = 1450;
  const maxWidthPx = 5000;
  const extraRows = Math.max(0, (rowCount || 0) - 12);
  const computedWidthPx = Math.max(minWidthPx, Math.min(maxWidthPx, minWidthPx + extraRows * 8));

  // Ensure the viewport matches our intended PDF width for accurate layout measurements
  await page.setViewport({ width: computedWidthPx, height: 800 });
  await page.setContent(html, { waitUntil: 'networkidle0' });

  // Measure the full document height so the PDF captures all rows without clipping
  const contentHeightPx = await page.evaluate(() => {
    const body = document.body;
    const htmlEl = document.documentElement;
    return Math.max(
      body.scrollHeight,
      body.offsetHeight,
      htmlEl.clientHeight,
      htmlEl.scrollHeight,
      htmlEl.offsetHeight
    );
  });

  // Use fixed base height for up to 12 rows; beyond that, expand to full content height
  const baseHeightPx = 500;
  const shouldExpandHeight = (rowCount || 0) > 12;
  // Add generous buffer to avoid accidental spillover to a second page
  const targetHeightPx = shouldExpandHeight ? (contentHeightPx + 200) : baseHeightPx;

  const pdfBuffer = await page.pdf({
    width: `${computedWidthPx}px`,
    height: `${targetHeightPx}px`,
    printBackground: true,
    // Remove margins when expanding height so all content fits on a single page
    margin: shouldExpandHeight ? {
      top: "0px",
      right: "0px",
      bottom: "0px",
      left: "0px",
    } : {
      top: "20px",
      right: "20px",
      bottom: "20px",
      left: "20px",
    },
  });

  await browser.close();
  return pdfBuffer;
}

export async function POST(request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { publicId, serialColumn = "Del.Challan", createXlsxFiles = false } = await request.json();

    if (!publicId) {
      return NextResponse.json(
        { error: "Public ID required" },
        { status: 400 }
      );
    }

    console.log(`Starting processing for publicId: ${publicId}, serialColumn: ${serialColumn}`);

    // Step 1: Download file from Cloudinary
    const fileUrl = cloudinary.url(publicId, { resource_type: "raw" });
    const response = await fetch(fileUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Step 2: Process XLSX data
    console.log('Reading and processing XLSX data...');
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (!data || data.length === 0) {
      throw new Error('No data found in the uploaded file');
    }

    console.log(`Loaded ${data.length} rows from Excel file`);

    // Step 3: Group data by serial number (Enhanced from quick-split-to-pdf.js)
    const groupedData = new Map();
    let skippedRows = 0;
    
    data.forEach((row, index) => {
      const serialNumber = row[serialColumn]?.toString();
      
      if (!serialNumber || serialNumber === "undefined" || serialNumber.trim() === "") {
        console.log(`Skipping row ${index + 1} with missing serial number:`, Object.keys(row).slice(0, 3));
        skippedRows++;
        return;
      }

      if (groupedData.has(serialNumber)) {
        groupedData.get(serialNumber).push(row);
      } else {
        groupedData.set(serialNumber, [row]);
      }
    });

    console.log(`Grouped data into ${groupedData.size} unique serial numbers`);
    console.log(`Skipped ${skippedRows} rows with missing serial numbers`);

    if (groupedData.size === 0) {
      throw new Error(`No valid data found for serial column '${serialColumn}'`);
    }

    // Step 4: Generate files for each serial number group
    const results = [];
    let pdfsCreated = 0;
    let xlsxCreated = 0;
    const timestamp = Date.now();

    // Sort serial numbers for consistent processing order
    const sortedSerialNumbers = Array.from(groupedData.keys())
      .map(s => ({ original: s, numeric: parseInt(s) }))
      .sort((a, b) => {
        // Try numeric sort first, fall back to string sort
        if (!isNaN(a.numeric) && !isNaN(b.numeric)) {
          return a.numeric - b.numeric;
        }
        return a.original.localeCompare(b.original);
      })
      .map(item => item.original);

    console.log(`Processing ${sortedSerialNumbers.length} serial numbers...`);
    const forcePdfLib = (process.env.FORCE_PDF_LIB || '').toLowerCase() === '1' || (process.env.FORCE_PDF_LIB || '').toLowerCase() === 'true';
    if (forcePdfLib) {
      console.log('[pdf] FORCE_PDF_LIB is enabled. Using pdf-lib for generation.');
    }

    for (const serialNumber of sortedSerialNumbers) {
      const rows = groupedData.get(serialNumber);
      
      try {
        console.log(`Processing serial ${serialNumber} (${rows.length} rows)...`);
        
        // Create XLSX file if requested
        let xlsxUrl = null;
        let xlsxPublicId = null;
        
        if (createXlsxFiles) {
          try {
            // Create new workbook for this serial number
            const newWorkbook = XLSX.utils.book_new();
            const newWorksheet = XLSX.utils.json_to_sheet(rows);
            XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, "Sheet1");
            
            // Convert to buffer
            const xlsxBuffer = XLSX.write(newWorkbook, { type: 'buffer', bookType: 'xlsx' });
            
            // Upload XLSX to Cloudinary
            const xlsxUploadResult = await new Promise((resolve, reject) => {
              const uploadStream = cloudinary.uploader.upload_stream(
                {
                  folder: "processed-xlsx",
                  resource_type: "raw",
                  public_id: `${userId}_${timestamp}_Serial_${serialNumber}_xlsx`,
                  format: "xlsx",
                },
                (error, result) => {
                  if (error) reject(error);
                  else resolve(result);
                }
              );
              uploadStream.end(xlsxBuffer);
            });
            
            xlsxUrl = xlsxUploadResult.secure_url;
            xlsxPublicId = xlsxUploadResult.public_id;
            xlsxCreated++;
            console.log(`Created XLSX for serial ${serialNumber}`);
          } catch (xlsxError) {
            console.error(`Error creating XLSX for serial ${serialNumber}:`, xlsxError.message);
          }
        }

        // Generate PDF using Puppeteer; if it fails (Chromium missing libs), fallback to pdf-lib
        const html = convertToHTML(rows);
        let pdfBuffer;
        try {
          pdfBuffer = await convertHTMLToPDFBuffer(html, rows.length);
        } catch (pdfErr) {
          console.error(`[pdf] Primary generation failed, using pdf-lib fallback: ${pdfErr?.message || pdfErr}`);
          // Minimal tabular PDF via pdf-lib (no HTML rendering)
          const doc = await PDFDocument.create();
          const page = doc.addPage([595.28, 842]); // A4 portrait
          const font = await doc.embedFont(StandardFonts.Helvetica);
          const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
          const marginLeft = 40;
          const marginTop = 40;
          const lineHeight = 14;
          const maxWidth = 515; // page width - margins

          const headers = Object.keys(rows[0] || {});
          let cursorY = 842 - marginTop;

          // Title
          const title = `Serial ${serialNumber} (${rows.length} rows)`;
          page.drawText(title, { x: marginLeft, y: cursorY, size: 12, font: fontBold, color: rgb(0,0,0) });
          cursorY -= lineHeight * 2;

          // Header row
          const headerText = headers.join(" | ");
          page.drawText(headerText.slice(0, 180), { x: marginLeft, y: cursorY, size: 10, font: fontBold });
          cursorY -= lineHeight;

          // Data rows
          for (const row of rows) {
            const line = headers.map(h => String(row[h] ?? '')).join(" | ");
            // wrap very long lines naively
            const chunks = line.match(/.{1,180}/g) || [''];
            for (const chunk of chunks) {
              if (cursorY < marginTop + lineHeight) {
                // new page
                const newPage = doc.addPage([595.28, 842]);
                cursorY = 842 - marginTop;
                newPage.drawText('(continued)', { x: marginLeft, y: cursorY, size: 10, font });
                cursorY -= lineHeight * 2;
              }
              page.drawText(chunk, { x: marginLeft, y: cursorY, size: 10, font });
              cursorY -= lineHeight;
            }
          }

          pdfBuffer = Buffer.from(await doc.save());
        }

        // Upload PDF to Cloudinary as completely public raw resource
        const pdfUploadResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: "processed-pdfs",
              resource_type: "raw",
              public_id: `${userId}_${timestamp}_Serial_${serialNumber}`,
              format: "pdf",
              type: "upload",
              access_mode: "public", // Make completely public
              invalidate: true, // Invalidate cached version
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(pdfBuffer);
        });

        pdfsCreated++;
        console.log(`Created PDF for serial ${serialNumber}`);

        const result = {
          serialNumber,
          rowCount: rows.length,
          pdfUrl: pdfUploadResult.secure_url,
          pdfPublicId: pdfUploadResult.public_id,
        };
        
        // Add XLSX info if created
        if (xlsxUrl) {
          result.xlsxUrl = xlsxUrl;
          result.xlsxPublicId = xlsxPublicId;
        }
        
        results.push(result);
        
      } catch (error) {
        console.error(`Error processing serial ${serialNumber}:`, error.message);
        // Continue processing other serial numbers
      }
    }

    // Log final summary (similar to quick-split-to-pdf.js)
    console.log(`\n=== PROCESSING COMPLETE ===`);
    console.log(`Total unique serial numbers found: ${groupedData.size}`);
    console.log(`Total PDF files created: ${pdfsCreated}`);
    if (createXlsxFiles) {
      console.log(`Total XLSX files created: ${xlsxCreated}`);
    }
    console.log(`Original file had: ${data.length} total rows`);
    console.log(`Skipped rows: ${skippedRows}`);
    
    // Serial number range info
    const numericSerials = sortedSerialNumbers
      .map(s => parseInt(s))
      .filter(n => !isNaN(n))
      .sort((a, b) => a - b);
    
    if (numericSerials.length > 0) {
      console.log(`Serial number range: ${numericSerials[0]} to ${numericSerials[numericSerials.length - 1]}`);
    }

    return NextResponse.json({
      success: true,
      totalGroups: groupedData.size,
      totalRows: data.length,
      skippedRows,
      pdfsCreated,
      xlsxCreated: createXlsxFiles ? xlsxCreated : null,
      serialNumberRange: numericSerials.length > 0 ? {
        min: numericSerials[0],
        max: numericSerials[numericSerials.length - 1]
      } : null,
      results,
    });
    
  } catch (error) {
    console.error("Processing failed:", error);
    return NextResponse.json(
      { error: `Processing failed: ${error.message}` },
      { status: 500 }
    );
  }
}
