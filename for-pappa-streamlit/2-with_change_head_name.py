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

def build_table(data, df, amount_pkr_col_idx, total_row_idx):
    """Build a ReportLab Table with custom borders for each cell."""
    t = Table(data, repeatRows=1)
    rows, cols = len(data), len(data[0])

    style = [
        ("BACKGROUND", (0, 0), (-1, 0), colors.white),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.black),
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1),
         [colors.white, colors.Color(0.98, 0.98, 0.98)])
    ]

    for r in range(rows):
        for c in range(cols):
            if r == total_row_idx and c in [0, 1, 2, 10, 11 , 5 , 6 , 7]:
                continue  # no border for these cells on total row
            style.append(("BOX", (c, r), (c, r), 0.5, colors.black))

    if total_row_idx is not None:
        style.append(("BACKGROUND", (0, total_row_idx), (-1, total_row_idx), colors.white))
        style.append(("FONTNAME", (0, total_row_idx), (-1, total_row_idx), "Helvetica-Bold"))
        style.append(("FONTSIZE", (0, total_row_idx), (-1, total_row_idx), 9))
        style.append(("ALIGN", (amount_pkr_col_idx, total_row_idx),
                      (amount_pkr_col_idx, total_row_idx), "RIGHT"))

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

        # 🔻 Add bottom borders:
        style.append(("LINEBELOW", (5, total_row_idx), (5, total_row_idx), 0.5, colors.black))
        style.append(("LINEBELOW", (6, total_row_idx), (6, total_row_idx), 0.5, colors.black))
        style.append(("LINEBELOW", (7, total_row_idx), (7, total_row_idx), 0.5, colors.black))
        style.append(("LINEBELOW", (8, total_row_idx), (8, total_row_idx), 0.5, colors.black))

    t.setStyle(TableStyle(style))
    return t

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

    table = build_table(data, df, amount_pkr_col_idx, total_row_idx)

    tw, th = table.wrap(0, 0)
    side_margin, top_margin, bottom_margin = 20 * mm, 20 * mm, 20 * mm
    page_width = max(500, tw + side_margin * 2)
    base_height = 300
    page_height = (th + top_margin + bottom_margin + 200) if len(df) > 12 \
        else (base_height + top_margin + bottom_margin)

    c = canvas.Canvas(buffer, pagesize=(page_width, page_height))
    available_width = page_width - side_margin * 2
    table.wrapOn(c, available_width, page_height - top_margin - bottom_margin)
    x = (page_width - table._width) / 2.0
    y = (page_height - top_margin)
    table.drawOn(c, x, y - table._height)
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

    st.write(df.columns.tolist())

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


    for serial, row_indices in groups.items():
        group_df = df.loc[row_indices].copy()
        pdf_bytes = dataframe_to_pdf_buffer(group_df, header_map=header_map)

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
    res_df = pd.DataFrame([{k: r.get(k) for k in ["serial", "rows", "pdf_url", "xlsx_url"]} for r in results])
    st.dataframe(res_df, use_container_width=True)

    st.subheader("Download PDFs")
    for r in results:
        st.download_button(
            label=f"Download PDF: Serial {r['serial']}",
            data=r["pdf_bytes"],
            file_name=f"Serial_{r['serial']}.pdf",
            mime="application/pdf",
            key=f"dl_{r['serial']}"
        )

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
