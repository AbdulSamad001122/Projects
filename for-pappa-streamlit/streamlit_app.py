import os
import io
import time
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
import zipfile

import os
import streamlit as st
from dotenv import load_dotenv
import cloudinary



# Load local .env if it exists
load_dotenv()

def configure_cloudinary():
    """Configure Cloudinary from either .env (local) or st.secrets (cloud)."""

    # 1st: try local environment variables
    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
    api_key    = os.getenv("CLOUDINARY_API_KEY")
    api_secret = os.getenv("CLOUDINARY_API_SECRET")

    # 2nd: if empty, try st.secrets (Streamlit Cloud)
    if not cloud_name:
        cloud_name = st.secrets["cloudinary"]["CLOUD_NAME"]
    if not api_key:
        api_key = st.secrets["cloudinary"]["API_KEY"]
    if not api_secret:
        api_secret = st.secrets["cloudinary"]["API_SECRET"]

    cloudinary.config(
        cloud_name=cloud_name,
        api_key=api_key,
        api_secret=api_secret,
        secure=True,
    )
    return True

configure_cloudinary()



def dataframe_to_pdf_buffer(df: pd.DataFrame, title: str = "Report") -> bytes:
    buffer = io.BytesIO()

    # Build table data
    headers = list(df.columns)
    data = [headers] + df.astype(str).values.tolist()

    # Limit extremely long cell text for readability
    max_cell_len = 80
    for r in range(len(data)):
        for cidx in range(len(data[r])):
            val = str(data[r][cidx]) if data[r][cidx] is not None else ""
            data[r][cidx] = (val[: max_cell_len - 1] + "…") if len(val) > max_cell_len else val

    # Create table and measure its natural size
    table = Table(data, repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.whitesmoke),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.black),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.Color(0.98, 0.98, 0.98)]),
            ]
        )
    )

    # Measure intrinsic table size
    tw, th = table.wrap(0, 0)

    # Page sizing rules (treat px as points for simplicity)
    min_page_width = 500  # px/pt
    side_margin = 20 * mm
    top_margin = 20 * mm
    bottom_margin = 20 * mm

    # Ensure all columns are visible: page width grows to fit table
    page_width = max(min_page_width, tw + side_margin * 2)

    # Dynamic height: base height for small tables, expand for larger
    base_height = 300  # px/pt
    content_height = th
    # If rows > 12, expand to content height + small buffer, else use base height
    should_expand_height = len(df) > 12
    page_height = (content_height + top_margin + bottom_margin + 200) if should_expand_height else (base_height + top_margin + bottom_margin)

    # Prepare canvas with dynamic page size
    c = canvas.Canvas(buffer, pagesize=(page_width, page_height))

    # No title: render only the table

    # Center the table horizontally; draw below the title with spacing
    available_width = page_width - side_margin * 2
    # Wrap with the available width to finalize layout calculations
    table.wrapOn(c, available_width, page_height - top_margin - bottom_margin)
    tw, th = table._width, table._height
    x = (page_width - tw) / 2.0
    y = (page_height - top_margin)  # start at top margin since no title
    table.drawOn(c, x, y - th)

    c.showPage()
    c.save()
    buffer.seek(0)
    return buffer.getvalue()


def upload_raw_to_cloudinary(file_bytes: bytes, public_id: str, folder: str = "processed-pdfs"):
    return cloudinary.uploader.upload(
        io.BytesIO(file_bytes),
        resource_type="raw",
        folder=folder,
        public_id=public_id,
        format="pdf",
        type="upload",
    )


def upload_xlsx_to_cloudinary(df: pd.DataFrame, public_id: str, folder: str = "processed-xlsx"):
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Sheet1")
    output.seek(0)
    return cloudinary.uploader.upload(
        output,
        resource_type="raw",
        folder=folder,
        public_id=public_id,
        format="xlsx",
        type="upload",
    )


def main():
    st.set_page_config(page_title="XLSX → Grouped PDFs", page_icon="📄", layout="wide")
    st.title("XLSX → Grouped PDFs (Cloudinary)")

    with st.sidebar:
        st.header("Options")
        serial_column = st.text_input("Serial Column", value="Del.Challan")
        create_xlsx = st.checkbox("Also create per-group XLSX", value=False)
        ensure_cloud = st.checkbox("Upload to Cloudinary", value=True)

    st.write("Upload an .xlsx file. Rows will be grouped by the selected serial column; one PDF per group will be created and uploaded to Cloudinary.")

    uploaded = st.file_uploader("Upload XLSX", type=["xlsx"])

    if uploaded is None:
        st.info("Choose an Excel file to begin.")
        return

    try:
        df = pd.read_excel(uploaded)
    except Exception as e:
        st.error(f"Failed to read Excel: {e}")
        return

    if serial_column not in df.columns:
        st.error(f"Column '{serial_column}' not found. Available: {', '.join(df.columns.astype(str))}")
        return

    ok_cloud = True
    if ensure_cloud:
        ok_cloud = configure_cloudinary()
        if not ok_cloud:
            st.stop()

    user_id = os.getenv("USER") or os.getenv("USERNAME") or "user"
    timestamp = int(time.time() * 1000)

    serial_values = df[serial_column].astype(str).fillna("").str.strip()
    groups = {}
    for idx, value in serial_values.items():
        if value:
            groups.setdefault(value, []).append(idx)

    st.write(f"Found {len(groups)} groups. Total rows: {len(df)}")

    results = []
    progress = st.progress(0)
    done = 0

    for serial, row_indices in groups.items():
        group_df = df.loc[row_indices].copy()

        # Generate PDF
        pdf_bytes = dataframe_to_pdf_buffer(group_df, title=f"Serial {serial}")

        pdf_public_id = f"{user_id}_{timestamp}_Serial_{serial}"
        xlsx_public_id = f"{user_id}_{timestamp}_Serial_{serial}_xlsx"
        pdf_url = None
        xlsx_url = None

        if ensure_cloud and ok_cloud:
            try:
                pdf_res = upload_raw_to_cloudinary(pdf_bytes, public_id=pdf_public_id)
                pdf_url = pdf_res.get("secure_url")
            except Exception as e:
                st.warning(f"Failed to upload PDF for {serial}: {e}")

            if create_xlsx:
                try:
                    xlsx_res = upload_xlsx_to_cloudinary(group_df, public_id=xlsx_public_id)
                    xlsx_url = xlsx_res.get("secure_url")
                except Exception as e:
                    st.warning(f"Failed to upload XLSX for {serial}: {e}")

        results.append({
            "serial": serial,
            "rows": len(group_df),
            "pdf_url": pdf_url,
            "xlsx_url": xlsx_url,
            "pdf_bytes": pdf_bytes,
        })

        done += 1
        progress.progress(int(done / max(len(groups), 1) * 100))

    st.success("Processing complete!")

    # Show summary and links
    summary_cols = ["serial", "rows", "pdf_url"] + (["xlsx_url"] if create_xlsx else [])
    res_df = pd.DataFrame([{k: r.get(k) for k in summary_cols} for r in results])
    
    # Let it automatically stretch
    st.dataframe(res_df, use_container_width=True)

    pdfs_created = sum(1 for r in results if r.get("pdf_url")) if ensure_cloud else len(results)
    st.write(f"PDFs Created: {pdfs_created}")

    # Per-group download buttons
    st.subheader("Download PDFs")
    for r in results:
        col1, col2 = st.columns([3, 2])
        with col1:
            st.write(f"Serial: {r['serial']} (rows: {r['rows']})")
        with col2:
            st.download_button(
                label=f"Download PDF: Serial {r['serial']}",
                data=r["pdf_bytes"],
                file_name=f"Serial_{r['serial']}.pdf",
                mime="application/pdf",
                key=f"dl_{r['serial']}"
            )

    # ZIP download for all PDFs
    if results:
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
            for r in results:
                filename = f"Serial_{r['serial']}.pdf"
                zf.writestr(filename, r["pdf_bytes"])
        zip_buffer.seek(0)
        st.download_button(
            label="Download all PDFs as ZIP",
            data=zip_buffer,
            file_name=f"grouped_pdfs_{timestamp}.zip",
            mime="application/zip",
            key="dl_all_zip"
        )


if __name__ == "__main__":
    main()


