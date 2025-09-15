import os, io, time, zipfile
import pandas as pd
import streamlit as st
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import Table, TableStyle
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv

# Load .env if present
load_dotenv()

def configure_cloudinary():
    """Configure Cloudinary from either .env (local) or st.secrets (cloud)."""
    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME") or st.secrets["cloudinary"]["CLOUD_NAME"]
    api_key    = os.getenv("CLOUDINARY_API_KEY")    or st.secrets["cloudinary"]["API_KEY"]
    api_secret = os.getenv("CLOUDINARY_API_SECRET") or st.secrets["cloudinary"]["API_SECRET"]

    cloudinary.config(cloud_name=cloud_name, api_key=api_key, api_secret=api_secret, secure=True)
    return True

configure_cloudinary()

def build_table(data, df, amount_pkr_col_idx, total_row_indices, header_row_indices=None, table_end_indices=None):
    """Build a ReportLab Table with custom borders for each cell."""
    t = Table(data, repeatRows=1)
    rows, cols = len(data), len(data[0])

    # Find Rate PKR column index
    rate_pkr_col_idx = None
    for i, col in enumerate(df.columns):
        if "rate" in str(col).lower() and "pkr" in str(col).lower():
            rate_pkr_col_idx = i
            break


    style = [
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1),
         [colors.white, colors.white])
    ]

    # Handle total_row_indices as either single index or list of indices
    if total_row_indices is None:
        total_row_indices = []
    elif isinstance(total_row_indices, int):
        total_row_indices = [total_row_indices]
    
    # Handle header_row_indices as either single index or list of indices
    if header_row_indices is None:
        header_row_indices = []
    elif isinstance(header_row_indices, int):
        header_row_indices = [header_row_indices]

    # Apply right alignment to Rate PKR and Amount PKR columns for data rows only
    # (excluding header rows and total rows)
    for r in range(rows):
        # Skip header rows and total rows
        if r in header_row_indices or r in total_row_indices:
            continue
        # Skip empty spacing rows
        if all(str(data[r][col]).strip() == "" for col in range(len(data[r]))):
            continue
        
        # Apply right alignment to Rate PKR column for this data row
        if rate_pkr_col_idx is not None:
            style.append(("ALIGN", (rate_pkr_col_idx, r), (rate_pkr_col_idx, r), "RIGHT"))
        
        # Apply right alignment to Amount PKR column for this data row
        if amount_pkr_col_idx is not None:
            style.append(("ALIGN", (amount_pkr_col_idx, r), (amount_pkr_col_idx, r), "RIGHT"))
        
        # Apply center alignment to Delivery Challan column for this data row
        delivery_challan_col_idx = None
        for i, col in enumerate(df.columns):
            if "challan" in str(col).lower():
                delivery_challan_col_idx = i
                break
        if delivery_challan_col_idx is not None:
            style.append(("ALIGN", (delivery_challan_col_idx, r), (delivery_challan_col_idx, r), "CENTER"))
        
        # Apply center alignment to Receiving Date column for this data row
        receiving_date_col_idx = None
        for i, col in enumerate(df.columns):
            if "rec" in str(col).lower() and "date" in str(col).lower():
                receiving_date_col_idx = i
                break
        if receiving_date_col_idx is not None:
            style.append(("ALIGN", (receiving_date_col_idx, r), (receiving_date_col_idx, r), "CENTER"))

    for r in range(rows):
        for c in range(cols):
            # Skip empty spacing rows (no borders)
            if all(str(data[r][col]).strip() == "" for col in range(len(data[r]))):
                continue
            
            if r in total_row_indices and c in [0, 1, 2, 10, 11, 5, 6, 7, amount_pkr_col_idx]:
                continue  # no border for these cells on total row
            style.append(("BOX", (c, r), (c, r), 0.5, colors.black))
    
    # Apply header row styling to all header rows
    for header_row_idx in header_row_indices:
        style.append(("BACKGROUND", (0, header_row_idx), (-1, header_row_idx), colors.white ))
        style.append(("TEXTCOLOR", (0, header_row_idx), (-1, header_row_idx), colors.black))
        style.append(("FONTNAME", (0, header_row_idx), (-1, header_row_idx), "Helvetica-Bold"))
        style.append(("FONTSIZE", (0, header_row_idx), (-1, header_row_idx), 9))
        style.append(("ALIGN", (0, header_row_idx), (-1, header_row_idx), "CENTER"))
    
    # Handle table_end_indices for visual separation
    if table_end_indices is None:
        table_end_indices = []
    elif isinstance(table_end_indices, int):
        table_end_indices = [table_end_indices]
    
    # Add thick bottom border to separate tables visually (removed for cleaner look)
    # for table_end_idx in table_end_indices:
    #     style.append(("LINEBELOW", (0, table_end_idx), (-1, table_end_idx), 2, colors.black))

    # Apply total row styling to all total rows
    for total_row_idx in total_row_indices:
        style.append(("BACKGROUND", (0, total_row_idx), (-1, total_row_idx), colors.white))
        style.append(("FONTNAME", (0, total_row_idx), (-1, total_row_idx), "Helvetica-Bold"))
        style.append(("FONTSIZE", (0, total_row_idx), (-1, total_row_idx), 9))
        style.append(("ALIGN", (amount_pkr_col_idx, total_row_idx),
                      (amount_pkr_col_idx, total_row_idx), "RIGHT"))

        # Center align the "Total" text in column 4 of total row
        style.append(("ALIGN", (4, total_row_idx), (4, total_row_idx), "CENTER"))

        # 🔻 CUSTOM: remove just certain sides
        # 6th col (index 5) remove right border
        style.append(("LINEAFTER", (5, total_row_idx), (5, total_row_idx), 0, colors.transparent))

        # 7th col (index 6) remove left & right borders
        style.append(("LINEBEFORE", (6, total_row_idx), (6, total_row_idx), 0, colors.transparent))
        style.append(("LINEAFTER", (6, total_row_idx), (6, total_row_idx), 0, colors.transparent))

        # 8th col (index 7) remove left & right borders
        style.append(("LINEBEFORE", (7, total_row_idx), (7, total_row_idx), 0, colors.transparent))
        style.append(("LINEAFTER", (7, total_row_idx), (7, total_row_idx), 0, colors.transparent))
        style.append(("LINEBEFORE", (8, total_row_idx), (8, total_row_idx), 0, colors.transparent))

        # Remove left border from Amount (PKR) column in total row
        # if amount_pkr_col_idx is not None:
        #     style.append(("LINEBEFORE", (amount_pkr_col_idx, total_row_idx), (amount_pkr_col_idx, total_row_idx), 0, colors.transparent))

        # Add bottom and right borders to Amount (PKR) column in total row
        if amount_pkr_col_idx is not None:
            style.append(("LINEBELOW", (amount_pkr_col_idx, total_row_idx), (amount_pkr_col_idx, total_row_idx), 0.5, colors.black))
            style.append(("LINEAFTER", (amount_pkr_col_idx, total_row_idx), (amount_pkr_col_idx, total_row_idx), 0.5, colors.black))

        # 🔻 Add bottom borders:
        style.append(("LINEBELOW", (5, total_row_idx), (5, total_row_idx), 0.5, colors.black))
        style.append(("LINEBELOW", (6, total_row_idx), (6, total_row_idx), 0.5, colors.black))
        style.append(("LINEBELOW", (7, total_row_idx), (7, total_row_idx), 0.5, colors.black))
        style.append(("LINEBELOW", (8, total_row_idx), (8, total_row_idx), 0.5, colors.black))

    t.setStyle(TableStyle(style))
    return t

def build_combined_pdf(serial_groups, header_map: dict = None) -> bytes:
    """
    Build a combined PDF with multiple serial number groups.
    Each group includes header + data rows + total row.
    Maximum 22 rows per page including headers and totals.
    Adds spacing (blank rows) between serial number groups.
    """
    buffer = io.BytesIO()
    
    # Get headers from the first group to apply header_map
    first_group_df = serial_groups[0]['df']
    headers = list(first_group_df.columns)
    if header_map:
        headers = [header_map.get(h, h) for h in headers]
    
    # Find amount column index
    amount_pkr_col_idx = None
    for i, col in enumerate(first_group_df.columns):
        if "amount" in str(col).lower() and "pkr" in str(col).lower():
            amount_pkr_col_idx = i
            break
    
    combined_data = []
    total_row_indices = []
    header_row_indices = []
    table_end_indices = []
    current_row_index = 0  # keep track of current row index for styling
    
    for group_idx, group in enumerate(serial_groups):
        df = group['df']
        
        # 🔹 Add spacing rows before each group (except the first one)
        if group_idx > 0:
            for _ in range(4):  # four blank rows for better margin between tables
                combined_data.append([""] * len(headers))
                current_row_index += 1
        
        # 🔹 add header row for each serial group
        combined_data.append(headers)
        header_row_indices.append(current_row_index)
        current_row_index += 1
        
        # 🔹 add data rows
        for _, row in df.iterrows():
            row_data = [str(row[col]) if pd.notna(row[col]) else "" for col in df.columns]
            combined_data.append(row_data)
            current_row_index += 1
        
        # 🔹 add total row
        if amount_pkr_col_idx is not None:
            total_amount = pd.to_numeric(df.iloc[:, amount_pkr_col_idx], errors="coerce").sum()
            total_row = [""] * len(df.columns)
            if "In-Bound #" in df.columns:
                inbound_idx = df.columns.get_loc("In-Bound #")
                inbound_number = df["In-Bound #"].iloc[-1] if not df.empty else ""
                total_row[inbound_idx] = str(inbound_number)
            if len(df.columns) >= 5:
                total_row[4] = "Total"
            total_row[amount_pkr_col_idx] = f"{total_amount:,.2f}"
            blank_col_names = ["Delivery Challan", "P.O #", "PO Line", "Plant", "Receiving Date"]
            for name in blank_col_names:
                if name in df.columns:
                    total_row[df.columns.get_loc(name)] = ""
            combined_data.append(total_row)
            total_row_indices.append(current_row_index)
            table_end_indices.append(current_row_index)  # Mark end of this table
            current_row_index += 1
    
    # truncate long cell values
    max_cell_len = 80
    for r in range(len(combined_data)):
        for cidx in range(len(combined_data[r])):
            val = str(combined_data[r][cidx]) if combined_data[r][cidx] is not None else ""
            combined_data[r][cidx] = (val[: max_cell_len - 1] + "…") if len(val) > max_cell_len else val
    
    table = build_table(combined_data, first_group_df, amount_pkr_col_idx, total_row_indices, header_row_indices, table_end_indices)
    
    # Page setup
    side_margin, top_margin, bottom_margin = 20 * mm, 20 * mm, 20 * mm
    page_height, page_width = A4  # A4 portrait (swap if you want landscape)
    
    c = canvas.Canvas(buffer, pagesize=(page_width, page_height))
    
    # Wrap the table and get actual dimensions - following project specification for proper centering
    available_width = page_width - side_margin * 2
    available_height = page_height - top_margin - bottom_margin
    table.wrapOn(c, available_width, available_height)
    
    # Get actual table dimensions after wrapping
    table_width = table._width
    table_height = table._height

    # Perfect horizontal and vertical centering as per project specifications
    x = (page_width - table_width) / 2.0  # center horizontally
    y = (page_height - table_height) / 2.0  # center vertically
    table.drawOn(c, x, y)

    c.showPage()
    c.save()
    buffer.seek(0)
    return buffer.getvalue()


def dataframe_to_pdf_buffer(df: pd.DataFrame, header_map: dict = None) -> bytes:
    """
    Convert a DataFrame to a styled PDF buffer.
    Pass header_map={old_name: new_name} to change headers only in the PDF.
    """
    buffer = io.BytesIO()

    headers = list(df.columns)
    if header_map:
        headers = [header_map.get(h, h) for h in headers]

    data = [headers] + df.astype(str).values.tolist()

    amount_pkr_col_idx = None
    for i, col in enumerate(df.columns):
        if "amount" in str(col).lower() and "pkr" in str(col).lower():
            amount_pkr_col_idx = i
            break

    if amount_pkr_col_idx is not None:
        total_amount = pd.to_numeric(df.iloc[:, amount_pkr_col_idx], errors="coerce").sum()
        total_row = [""] * len(df.columns)

        if "In-Bound #" in df.columns:
            inbound_idx = df.columns.get_loc("In-Bound #")
            inbound_number = df["In-Bound #"].iloc[-1] if not df.empty else ""
            total_row[inbound_idx] = str(inbound_number)

        if len(df.columns) >= 5:
            total_row[4] = "Total"

        total_row[amount_pkr_col_idx] = f"{total_amount:,.2f}"

        blank_col_names = ["Delivery Challan", "P.O #", "PO Line", "Plant", "Receiving Date"]
        for name in blank_col_names:
            if name in df.columns:
                total_row[df.columns.get_loc(name)] = ""

        data.append(total_row)

    max_cell_len = 80
    for r in range(len(data)):
        for cidx in range(len(data[r])):
            val = str(data[r][cidx]) if data[r][cidx] is not None else ""
            data[r][cidx] = (val[: max_cell_len - 1] + "…") if len(val) > max_cell_len else val

    has_total_row = amount_pkr_col_idx is not None and len(data) > len(df) + 1
    total_row_idx = len(data) - 1 if has_total_row else None

    table = build_table(data, df, amount_pkr_col_idx, total_row_idx, [0] if total_row_idx else None)

    tw, th = table.wrap(0, 0)
    side_margin, top_margin, bottom_margin = 20 * mm, 20 * mm, 20 * mm
    
    # Use A4 page size in landscape orientation
    page_height, page_width = A4  # Swap width and height for landscape
    
    # If table is wider than A4, scale it to fit
    if tw > page_width - side_margin * 2:
        scale_factor = (page_width - side_margin * 2) / tw
        table._width = tw * scale_factor
        table._height = th * scale_factor
        tw = table._width
        th = table._height

    c = canvas.Canvas(buffer, pagesize=(page_width, page_height))
    
    # Wrap the table and get actual dimensions
    table.wrapOn(c, page_width - side_margin * 2, page_height - top_margin - bottom_margin)
    
    # Get actual table dimensions after wrapping
    table_width = table._width
    table_height = table._height
    
    # Center table both horizontally and vertically
    x = (page_width - table_width) / 2.0  # center horizontally
    y = (page_height - table_height) / 2.0  # center vertically on entire page
    table.drawOn(c, x, y)
    c.showPage()
    c.save()
    buffer.seek(0)
    return buffer.getvalue()

# === Cloudinary upload helpers ===
def upload_raw_to_cloudinary(file_bytes: bytes, public_id: str, folder: str = "processed-pdfs"):
    return cloudinary.uploader.upload(
        io.BytesIO(file_bytes),
        resource_type="raw", folder=folder, public_id=public_id,
        format="pdf", type="upload",
    )

def upload_xlsx_to_cloudinary(df: pd.DataFrame, public_id: str, folder: str = "processed-xlsx"):
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Sheet1")
    output.seek(0)
    return cloudinary.uploader.upload(
        output, resource_type="raw", folder=folder,
        public_id=public_id, format="xlsx", type="upload",
    )

def main():
    st.set_page_config(page_title="XLSX → Grouped PDFs", page_icon="📄", layout="wide")
    st.title("XLSX → Grouped PDFs (Cloudinary)")

    with st.sidebar:
        st.header("Options")
        serial_column = st.text_input("Serial Column", value="Del.Challan")
        create_xlsx = st.checkbox("Also create per-group XLSX", value=False)
        ensure_cloud = st.checkbox("Upload to Cloudinary", value=True)

    uploaded = st.file_uploader("Upload XLSX", type=["xlsx"])
    if uploaded is None:
        st.info("Choose an Excel file to begin.")
        return

    df = pd.read_excel(uploaded)

    if serial_column not in df.columns:
        st.error(f"Column '{serial_column}' not found. Available: {', '.join(df.columns.astype(str))}")
        return

    ok_cloud = configure_cloudinary() if ensure_cloud else True

    user_id = os.getenv("USER") or os.getenv("USERNAME") or "user"
    timestamp = int(time.time() * 1000)

    serial_values = df[serial_column].astype(str).fillna("").str.strip()
    groups = {}
    for idx, value in serial_values.items():
        if value:
            groups.setdefault(value, []).append(idx)

    # st.write(df.columns.tolist())

    results = []
    progress = st.progress(0)
    done = 0

    # 📝 define all your visible header names here
    header_map = {
        "Del.Challan": "Delivery Challan",
        "P.O #": "P.O #",
        "PO Line": "PO Line",
        "In-Bound #": "In-Bound #",
        "GR No.": "GR No.",
        "Part No.": "Part no.",          # fixed key
        "Part Name": "Part Name",
        "Quantity": "Qty",               # fixed key
        "Rate (PKR)": "Rate (PKR)",
        "Amount (PKR)": "Amount (PKR)",
        "Plant": "Plant",
        "Rec. Date": "Receiving Date"    # fixed key
    }


    # Group serials into pages (max 22 rows per page)
    page_groups = []
    current_page = []
    current_page_rows = 0
    max_rows_per_page = 22
    
    for serial, row_indices in groups.items():
        group_df = df.loc[row_indices].copy()
        # Calculate rows needed: header (1) + data rows + total (1) + spacing (4 between groups)
        group_rows_needed = 1 + len(group_df) + 1  # header + data + total
        spacing_rows = 4 if current_page else 0  # Add spacing if not first group
        total_rows_needed = group_rows_needed + spacing_rows
        
        # Check if this group fits in current page
        if current_page_rows + total_rows_needed > max_rows_per_page and current_page:
            # Start new page
            page_groups.append(current_page)
            current_page = []
            current_page_rows = 0
            spacing_rows = 0  # No spacing for first group on new page
        
        # Add group to current page
        current_page.append({
            'serial': serial,
            'df': group_df,
            'row_indices': row_indices
        })
        current_page_rows += group_rows_needed + spacing_rows
    
    # Add the last page if it has content
    if current_page:
        page_groups.append(current_page)
    
    # Process each page
    results = []
    done = 0
    total_pages = len(page_groups)
    
    for page_idx, page_serials in enumerate(page_groups):
        # Generate PDF for this page
        pdf_bytes = build_combined_pdf(page_serials, header_map=header_map)
        
        # Create page identifier
        page_serials_list = [group['serial'] for group in page_serials]
        page_id = f"Page_{page_idx + 1}_Serials_{'-'.join(page_serials_list)}"
        
        pdf_public_id = f"{user_id}_{timestamp}_{page_id}"
        pdf_url = None
        
        if ensure_cloud and ok_cloud:
            try:
                pdf_res = upload_raw_to_cloudinary(pdf_bytes, public_id=pdf_public_id)
                pdf_url = pdf_res.get("secure_url")
            except Exception as e:
                st.warning(f"Failed to upload PDF for page {page_idx + 1}: {e}")
        
        # Create XLSX for each serial in this page (if requested)
        xlsx_urls = {}
        if create_xlsx:
            for group in page_serials:
                try:
                    xlsx_public_id = f"{user_id}_{timestamp}_Serial_{group['serial']}_xlsx"
                    xlsx_res = upload_xlsx_to_cloudinary(group['df'], public_id=xlsx_public_id)
                    xlsx_urls[group['serial']] = xlsx_res.get("secure_url")
                except Exception as e:
                    st.warning(f"Failed to upload XLSX for {group['serial']}: {e}")
        
        results.append({
            "page": page_idx + 1,
            "serials": page_serials_list,
            "total_rows": sum(len(group['df']) for group in page_serials),
            "pdf_url": pdf_url,
            "xlsx_urls": xlsx_urls,
            "pdf_bytes": pdf_bytes,
        })
        
        done += 1
        progress.progress(int(done / max(total_pages, 1) * 100))

    st.success("Processing complete!")
    # res_df = pd.DataFrame([{k: r.get(k) for k in ["page", "serials", "total_rows", "pdf_url"]} for r in results])
    # st.dataframe(res_df, use_container_width=True)

    st.subheader("Download PDFs")
    
    # Download all PDFs as ZIP - moved to top
    if results:
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
            for r in results:
                filename = f"Page_{r['page']}_Serials_{'-'.join(r['serials'])}.pdf"
                zf.writestr(filename, r["pdf_bytes"])
        zip_buffer.seek(0)
        st.download_button(
            label="📦 Download all PDFs as ZIP",
            data=zip_buffer,
            file_name=f"combined_pdfs_{timestamp}.zip",
            mime="application/zip",
            key="dl_all_zip"
        )
        st.write("---")  # Add separator line
    
    # Individual PDF downloads
    for r in results:
        serials_str = ", ".join(r['serials'])
        st.download_button(
            label=f"Download PDF: Page {r['page']} (Serials: {serials_str})",
            data=r["pdf_bytes"],
            file_name=f"Page_{r['page']}_Serials_{'-'.join(r['serials'])}.pdf",
            mime="application/pdf",
            key=f"dl_page_{r['page']}"
        )

if __name__ == "__main__":
    main()
