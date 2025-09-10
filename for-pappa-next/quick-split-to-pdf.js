// Import the XLSX library for reading and writing Excel files
const XLSX = require("xlsx");
// Import the path module from Node.js for file path operations
const path = require("path");
// Import puppeteer for PDF generation
const puppeteer = require("puppeteer");
// Import fs for file system operations
const fs = require("fs");

/**
 * Function to convert XLSX data to HTML table
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
 * Function to convert HTML to PDF using Puppeteer
 * @param {string} html - HTML content
 * @param {string} outputPath - Path where PDF should be saved
 */
async function convertHTMLToPDF(html, outputPath) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.setContent(html);
  await page.pdf({
    path: outputPath,
    width: "1450px", // Custom width - adjust as needed
    height: "500px", // Custom height - adjust as needed
    // landscape: true, // Add this line for landscape orientation
    printBackground: true,
    margin: {
      top: "20px",
      right: "20px",
      bottom: "20px",
      left: "20px",
    },
  });

  await browser.close();
}

/**
 * Function to split an Excel file into separate files based on unique serial numbers
 * and optionally convert each to PDF
 * @param {string} filePath - The full path to the Excel file to be split
 * @param {string} serialColumn - The name of the column containing serial numbers
 * @param {boolean} convertToPDF - Whether to also create PDF versions
 */
async function splitByUniqueSerialNumbers(
  filePath,
  serialColumn = "Del.Challan",
  convertToPDF = false
) {
  // STEP 1: READ THE EXCEL FILE
  const workbook = XLSX.readFile(filePath);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(worksheet);

  // STEP 2: GROUP DATA BY SERIAL NUMBER
  const groupedData = new Map();

  data.forEach((row) => {
    const serialNumber = row[serialColumn]?.toString();

    if (!serialNumber || serialNumber === "undefined") {
      console.log("Skipping row with missing serial number:", row);
      return;
    }

    if (groupedData.has(serialNumber)) {
      groupedData.get(serialNumber).push(row);
    } else {
      groupedData.set(serialNumber, [row]);
    }
  });

  // STEP 3: CREATE SEPARATE FILES FOR EACH SERIAL NUMBER GROUP
  const outputDir = path.dirname(filePath);
  const baseName = path.basename(filePath, path.extname(filePath));
  let filesCreated = 0;
  let pdfsCreated = 0;

  for (const [serialNumber, rows] of groupedData) {
    // Create XLSX file
    // const newWorkbook = XLSX.utils.book_new();
    // const newWorksheet = XLSX.utils.json_to_sheet(rows);
    // XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, "Sheet1");

    // const outputFileName = `${baseName}_Serial_${serialNumber}.xlsx`;
    // const outputPath = path.join(outputDir, outputFileName);
    // XLSX.writeFile(newWorkbook, outputPath);
    // filesCreated++;

    // console.log(
    //   `Created: ${outputFileName} (${rows.length} rows for serial ${serialNumber})`
    // );

    // Create PDF file if requested
    if (convertToPDF) {
      try {
        const html = convertToHTML(rows);
        const pdfFileName = `${baseName}_Serial_${serialNumber}.pdf`;
        const pdfPath = path.join(outputDir, pdfFileName);

        await convertHTMLToPDF(html, pdfPath);
        pdfsCreated++;
        console.log(`Created PDF: ${pdfFileName}`);
      } catch (error) {
        console.error(
          `Error creating PDF for serial ${serialNumber}:`,
          error.message
        );
      }
    }
  }

  // STEP 4: PRINT SUMMARY
  console.log(`\n=== SPLITTING COMPLETE ===`);
  console.log(`Total unique serial numbers found: ${groupedData.size}`);
  console.log(`Total XLSX files created: ${filesCreated}`);
  if (convertToPDF) {
    console.log(`Total PDF files created: ${pdfsCreated}`);
  }
  console.log(`Original file had: ${data.length} total rows`);

  const serialNumbers = Array.from(groupedData.keys())
    .map((s) => parseInt(s))
    .filter((n) => !isNaN(n))
    .sort((a, b) => a - b);
  if (serialNumbers.length > 0) {
    console.log(
      `Serial number range: ${serialNumbers[0]} to ${
        serialNumbers[serialNumbers.length - 1]
      }`
    );
  }
}

// STEP 5: EXECUTE THE FUNCTION
// Set the third parameter to true to also create PDF files
splitByUniqueSerialNumbers(
  "d:\\Abdul Samad\\Projects\\For-Pappa\\-SRM Data.xlsx",
  "Del.Challan",
  true // Set to true to create PDF files, false for XLSX only
);
