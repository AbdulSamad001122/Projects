import os, io, time, zipfile
import pandas as pd
import streamlit as st
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import Table, TableStyle
from datetime import datetime
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
    
    # Find Part Name column index for text truncation
    part_name_col_idx = None
    for i, col in enumerate(df.columns):
        col_clean = str(col).lower().strip()
        if "part" in col_clean and "name" in col_clean:
            part_name_col_idx = i
            break
    
    # Truncate Part Name column text to fit fixed width (limit to 10 characters to ensure it fits)
    processed_data = []
    for row in data:
        processed_row = []
        for col_idx, cell in enumerate(row):
            cell_text = str(cell) if cell is not None else ""
            
            # Truncate Part Name column text if too long - very strict limit to prevent overflow
            if col_idx == part_name_col_idx and len(cell_text) > 12:
                cell_text = cell_text[:8] + ".."
            elif col_idx == part_name_col_idx and len(cell_text) > 14:
                cell_text = cell_text[:10]
            
            processed_row.append(cell_text)
        processed_data.append(processed_row)
    
    # Define column widths - only specify Part Name width, others auto-size
    col_widths = None
    if part_name_col_idx is not None:
        num_cols = len(data[0]) if data else 12
        col_widths = [None] * num_cols  # None means auto-width
        col_widths[part_name_col_idx] = 80  # Even smaller width to ensure text fits completely
    
    t = Table(processed_data, repeatRows=1, rowHeights=[20] * len(processed_data), colWidths=col_widths)
    rows, cols = len(processed_data), len(processed_data[0])

    # Find Rate PKR column index
    rate_pkr_col_idx = None
    for i, col in enumerate(df.columns):
        col_clean = str(col).lower().strip()
        if "rate" in col_clean and "pkr" in col_clean:
            rate_pkr_col_idx = i
            break


    style = [
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1),
         [colors.white, colors.white]),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9.5),
        ("TOPPADDING", (0, 0), (-1, -1), 9.5)
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
        if all(str(processed_data[r][col]).strip() == "" for col in range(len(processed_data[r]))):
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
            col_clean = str(col).lower().strip()
            if "challan" in col_clean:
                delivery_challan_col_idx = i
                break
        if delivery_challan_col_idx is not None:
            style.append(("ALIGN", (delivery_challan_col_idx, r), (delivery_challan_col_idx, r), "CENTER"))
        
        # Apply center alignment to Receiving Date column for this data row
        receiving_date_col_idx = None
        for i, col in enumerate(df.columns):
            col_clean = str(col).lower().strip()
            if "rec" in col_clean and "date" in col_clean:
                receiving_date_col_idx = i
                break
        if receiving_date_col_idx is not None:
            style.append(("ALIGN", (receiving_date_col_idx, r), (receiving_date_col_idx, r), "CENTER"))
        
        # Apply center alignment to Quantity column for this data row
        quantity_col_idx = None
        for i, col in enumerate(df.columns):
            col_clean = str(col).lower().strip()
            if "quantity" in col_clean or "qty" in col_clean:
                quantity_col_idx = i
                break
        if quantity_col_idx is not None:
            style.append(("ALIGN", (quantity_col_idx, r), (quantity_col_idx, r), "CENTER"))

    for r in range(rows):
        for c in range(cols):
            # Skip empty spacing rows (no borders)
            if all(str(processed_data[r][col]).strip() == "" for col in range(len(processed_data[r]))):
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
        style.append(("FONTSIZE", (0, total_row_idx), (-1, total_row_idx), 10))
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

def get_robust_header_map(df_columns):
    """Create a robust header map that handles trailing spaces in column names."""
    base_header_map = {
        "Del.Challan": "Delivery Challan",
        "P.O #": "P.O #",
        "PO Line": "PO Line",
        "In-Bound #": "In-Bound #",
        "GR No.": "GR No.",
        "Part No.": "Part no.",
        "Part Name": "Part Name",
        "Quantity": "Qty",
        "Rate (PKR)": "Rate (PKR)",
        "Amount (PKR)": "Amount (PKR)",
        "Plant": "Plant",
        "Rec. Date": "Receiving Date"
    }
    
    # Create mapping for actual column names (including those with trailing spaces)
    robust_map = {}
    for actual_col in df_columns:
        # Strip and check if it matches any base key
        stripped_col = actual_col.strip()
        if stripped_col in base_header_map:
            robust_map[actual_col] = base_header_map[stripped_col]
        else:
            # If no match, keep original
            robust_map[actual_col] = actual_col
    
    return robust_map

def format_cell_value(value, column_name):
    """Format cell values, especially dates to remove timestamps."""
    if pd.isna(value):
        return ""
    
    # Check if this is a date column and the value is a datetime
    col_clean = str(column_name).lower().strip()
    if ("date" in col_clean or "rec" in col_clean) and hasattr(value, 'strftime'):
        # Format date without time
        return value.strftime('%Y-%m-%d')
    
    return str(value)

def build_single_page_pdf(serial_groups, header_map: dict = None) -> bytes:
    """
    Build a single page PDF with multiple serial number groups.
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
        col_clean = str(col).lower().strip()
        if "amount" in col_clean and "pkr" in col_clean:
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
            row_data = [format_cell_value(row[col], col) for col in df.columns]
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

def build_combined_pdf(serial_groups, header_map: dict = None) -> bytes:
    """
    Build a combined PDF with multiple serial number groups.
    Each group includes header + data rows + total row.
    Maximum 22 rows per page including headers and totals.
    Adds spacing (blank rows) between serial number groups.
    """
    # Use the single page function for backward compatibility
    return build_single_page_pdf(serial_groups, header_map)

def build_annexure_table(data, amount_pkr_col_idx, total_row_indices, header_row_indices=None, title_row_index=None):
    """Build a ReportLab Table specifically for Annexure format with compact borders."""
    
    t = Table(data, repeatRows=1, rowHeights=[20] * len(data))
    rows, cols = len(data), len(data[0])

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

    style = [
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),  # Compact padding
        ("TOPPADDING", (0, 0), (-1, -1), 3),     # Compact padding
    ]
    
    # Handle title row styling if present
    if title_row_index is not None:
        # Title row spans across columns, bold text
        style.append(("FONTNAME", (0, title_row_index), (-1, title_row_index), "Helvetica-Bold"))
        style.append(("FONTSIZE", (0, title_row_index), (-1, title_row_index), 12))
        style.append(("ALIGN", (0, title_row_index), (0, title_row_index), "LEFT"))  # Title left aligned
        style.append(("ALIGN", (-1, title_row_index), (-1, title_row_index), "RIGHT"))  # Date right aligned
        # Add horizontal lines above and below title
        style.append(("LINEABOVE", (0, title_row_index), (-1, title_row_index), 0.5, colors.black))
        style.append(("LINEBELOW", (0, title_row_index), (-1, title_row_index), 0.5, colors.black))
        # Remove borders for other cells in title row
        for c in range(1, cols-1):
            style.append(("LINEBEFORE", (c, title_row_index), (c, title_row_index), 0, colors.transparent))
            style.append(("LINEAFTER", (c, title_row_index), (c, title_row_index), 0, colors.transparent))

    # Apply right alignment to amount columns (7, 8, 9) for data rows
    for r in range(rows):
        # Skip header rows, total rows, and title row
        if r in header_row_indices or r in total_row_indices or r == title_row_index:
            continue
        # Apply right alignment to amount columns
        style.append(("ALIGN", (7, r), (9, r), "RIGHT"))
        # Apply center alignment to Del.Challan column
        style.append(("ALIGN", (1, r), (1, r), "CENTER"))
        # Apply center alignment to Date column
        style.append(("ALIGN", (6, r), (6, r), "CENTER"))
    
    # Add borders to all cells except title row special handling
    for r in range(rows):
        for c in range(cols):
            if r == title_row_index:
                # Special handling for title row - only top and bottom borders
                if c == 0 or c == cols-1:  # First and last column get side borders
                    style.append(("BOX", (c, r), (c, r), 0.5, colors.black))
            else:
                style.append(("BOX", (c, r), (c, r), 0.5, colors.black))
    
    # Apply header row styling
    for header_row_idx in header_row_indices:
        style.append(("BACKGROUND", (0, header_row_idx), (-1, header_row_idx), colors.white))
        style.append(("TEXTCOLOR", (0, header_row_idx), (-1, header_row_idx), colors.black))
        style.append(("FONTNAME", (0, header_row_idx), (-1, header_row_idx), "Helvetica-Bold"))
        style.append(("FONTSIZE", (0, header_row_idx), (-1, header_row_idx), 9))
        style.append(("ALIGN", (0, header_row_idx), (-1, header_row_idx), "CENTER"))
    
    # Apply total row styling
    for total_row_idx in total_row_indices:
        style.append(("BACKGROUND", (0, total_row_idx), (-1, total_row_idx), colors.white))
        style.append(("FONTNAME", (0, total_row_idx), (-1, total_row_idx), "Helvetica-Bold"))
        style.append(("FONTSIZE", (0, total_row_idx), (-1, total_row_idx), 10))
        # Right align amount columns in total row
        style.append(("ALIGN", (7, total_row_idx), (9, total_row_idx), "RIGHT"))
        # Center align the "Grand Total" text
        style.append(("ALIGN", (6, total_row_idx), (6, total_row_idx), "CENTER"))

    t.setStyle(TableStyle(style))
    return t


def build_annexure_pdf(df: pd.DataFrame, header_map: dict = None) -> bytes:
    """
    Build Annexure of Periodic Billing PDF that exactly matches the user's attached image.
    Creates a standalone table with title, proper columns, and automatic tax calculations.
    """
    buffer = io.BytesIO()
    
    # Page setup
    side_margin, top_margin, bottom_margin = 20 * mm, 20 * mm, 20 * mm
    page_height, page_width = A4  # A4 portrait
    
    c = canvas.Canvas(buffer, pagesize=(page_width, page_height))
    
    # Prepare table data exactly like the image
    headers = [
        "S.No.", "Del.Challan", "P.O #", "In-Bound #", "GR No.", "Plant", 
        "Date", "Amount ( PKR )", "Sales Tax @ 18%", "Amount Incl Sales Tax"
    ]
    
    # Find column mappings in the Excel data
    col_mapping = {}
    for col in df.columns:
        col_clean = str(col).lower().strip()
        if "challan" in col_clean or "del" in col_clean:
            col_mapping['challan'] = col
        elif "p.o" in col_clean or ("po" in col_clean and "#" in str(col)):
            col_mapping['po'] = col
        elif "in-bound" in col_clean or "inbound" in col_clean or "in bound" in col_clean:
            col_mapping['inbound'] = col
        elif "gr" in col_clean and ("no" in col_clean or "number" in col_clean):
            col_mapping['gr'] = col
        elif "plant" in col_clean:
            col_mapping['plant'] = col
        elif "date" in col_clean:
            col_mapping['date'] = col
        elif "amount" in col_clean and "pkr" in col_clean:
            col_mapping['amount'] = col
    
    # Build table data with calculations - GROUP BY SERIAL ENDING
    table_data = [headers]
    
    
    # Group data by serial ending (last 2 digits)
    serial_groups = {}
    
    for idx, (_, row) in enumerate(df.iterrows()):
        # Get serial number (Del.Challan)
        serial_num = str(row.get(col_mapping.get('challan', ''), '')).strip()
        
        # Get last 2 digits for grouping
        if len(serial_num) >= 2:
            serial_ending = serial_num[-2:]  # Last 2 digits
        else:
            serial_ending = serial_num  # Use full number if less than 2 digits
        
        # Get amount from Excel
        amount_value = row.get(col_mapping.get('amount', ''), 0)
        
        # Clean and convert amount to float
        if pd.isna(amount_value):
            amount = 0.0
        else:
            amount_str = str(amount_value).replace(',', '').replace('PKR', '').strip()
            try:
                amount = float(amount_str)
            except (ValueError, TypeError):
                amount = 0.0
        
        # Initialize group if not exists
        if serial_ending not in serial_groups:
            serial_groups[serial_ending] = {
                'serial_numbers': [],
                'total_amount': 0.0,
                'po_numbers': [],
                'inbound_numbers': [],
                'gr_numbers': [],
                'plants': [],
                'dates': [],
                'info_combined': []
            }
        
        # Add data to group
        serial_groups[serial_ending]['serial_numbers'].append(serial_num)
        serial_groups[serial_ending]['total_amount'] += amount
        
        # Collect other info for concatenation
        po_val = str(row.get(col_mapping.get('po', ''), '')).strip()
        if po_val and po_val not in serial_groups[serial_ending]['po_numbers']:
            serial_groups[serial_ending]['po_numbers'].append(po_val)
            
        inbound_val = str(row.get(col_mapping.get('inbound', ''), '')).strip()
        if inbound_val and inbound_val not in serial_groups[serial_ending]['inbound_numbers']:
            serial_groups[serial_ending]['inbound_numbers'].append(inbound_val)
            
        gr_val = str(row.get(col_mapping.get('gr', ''), '')).strip()
        if gr_val and gr_val not in serial_groups[serial_ending]['gr_numbers']:
            serial_groups[serial_ending]['gr_numbers'].append(gr_val)
            
        plant_val = str(row.get(col_mapping.get('plant', ''), '')).strip()
        if plant_val and plant_val not in serial_groups[serial_ending]['plants']:
            serial_groups[serial_ending]['plants'].append(plant_val)
            
        # Handle date - improved date handling and mapping
        date_val = row.get(col_mapping.get('date', ''), '')
        if pd.notna(date_val) and str(date_val).strip():
            if hasattr(date_val, 'strftime'):
                date_str = date_val.strftime('%d/%m/%y')
            else:
                date_str = str(date_val).strip()
                # Handle common date formats
                if len(date_str) >= 8:  # Basic date string validation
                    pass  # Keep as is
                else:
                    date_str = str(date_val)
            
            # Only add if not empty and not already in the list
            if date_str and date_str not in serial_groups[serial_ending]['dates']:
                serial_groups[serial_ending]['dates'].append(date_str)
    
    # Build table rows from grouped data - SORT BY SMALLEST DEL.CHALLAN NUMBER
    total_amount = 0.0
    total_sales_tax = 0.0
    total_incl_tax = 0.0
    
    # Sort groups by the smallest Del.Challan number in each group
    def get_min_challan(serial_ending):
        group = serial_groups[serial_ending]
        challan_numbers = []
        for challan in group['serial_numbers']:
            try:
                # Convert to integer for proper numerical sorting
                challan_numbers.append(int(challan))
            except (ValueError, TypeError):
                # If conversion fails, use string sorting
                challan_numbers.append(float('inf'))  # Put non-numeric at end
        return min(challan_numbers) if challan_numbers else float('inf')
    
    # Sort serial endings by their smallest challan number
    sorted_serial_endings = sorted(serial_groups.keys(), key=get_min_challan)
    
    row_num = 1
    for serial_ending in sorted_serial_endings:
        group = serial_groups[serial_ending]
        
        # Calculate taxes for this group
        amount = group['total_amount']
        sales_tax = amount * 0.18
        amount_incl_tax = amount + sales_tax
        
        # Update running totals
        total_amount += amount
        total_sales_tax += sales_tax
        total_incl_tax += amount_incl_tax
        
        # Build combined info strings - SHOW UNIQUE VALUES ONLY ONCE
        # Del.Challan: Show unique value only once
        unique_challans = list(set(group['serial_numbers']))
        if len(unique_challans) == 1:
            challan_combined = unique_challans[0]  # Show single value
        else:
            challan_combined = ', '.join(unique_challans[:2])  # Show first 2 unique
            if len(unique_challans) > 2:
                challan_combined += f" (+{len(unique_challans)-2} more)"
            
        # P.O #: Show ONLY the first unique value (no multiple values, no +more)
        if len(group['po_numbers']) >= 1:
            po_combined = group['po_numbers'][0]  # Show ONLY first value
        else:
            po_combined = ''  # Empty if no P.O # data
            
        inbound_combined = ', '.join(group['inbound_numbers'][:2]) if group['inbound_numbers'] else ''
        if len(group['inbound_numbers']) > 2:
            inbound_combined += " (+more)"
            
        gr_combined = ', '.join(group['gr_numbers'][:2]) if group['gr_numbers'] else ''
        if len(group['gr_numbers']) > 2:
            gr_combined += " (+more)"
            
        plant_combined = ', '.join(group['plants']) if group['plants'] else ''
        
        # Date: Show the first date from the group (instead of combined)
        if group['dates']:
            date_combined = group['dates'][0]  # Show only the first date
        else:
            # If no dates found, try to get any date from the original data
            date_combined = "No Date"  # Temporary debug text
        
        # Build row data for this serial ending group
        row_data = [
            str(row_num),  # S.No.
            challan_combined,  # Del.Challan (combined)
            po_combined,  # P.O # (combined)
            inbound_combined,  # In-Bound # (combined)
            gr_combined,  # GR No. (combined)
            plant_combined,  # Plant (combined)
            date_combined,  # Date (combined)
            f"{amount:,.2f}",  # Amount (PKR) - SUMMED
            f"{sales_tax:,.2f}",  # Sales Tax @18%
            f"{amount_incl_tax:,.2f}"  # Amount Incl Sales Tax
        ]
        table_data.append(row_data)
        row_num += 1
    
    # Add Grand Total row exactly like in the image
    grand_total_row = [
        "", "", "", "", "", "", "Grand Total",
        f"{total_amount:,.2f}",
        f"{total_sales_tax:,.2f}",
        f"{total_incl_tax:,.2f}"
    ]
    table_data.append(grand_total_row)
    
    # Create table with proper styling like the image
    table = Table(table_data, rowHeights=[24] * len(table_data))  # Increased from 20 to 24
    
    # Apply styling exactly like in the image
    style_commands = [
        # Basic formatting
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),  # Changed to Bold
        ('FONTSIZE', (0, 0), (-1, -1), 11),  # Increased from 9 to 11
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),  # Increased padding for better spacing
        ('TOPPADDING', (0, 0), (-1, -1), 4),     # Increased padding for better spacing
        
        # Header row styling
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),  # Increased from 9 to 11
        ('BACKGROUND', (0, 0), (-1, 0), colors.white),
        
        # Apply individual cell borders (like regular mode)
        # Grid is removed - borders applied individually with skip logic below
        
        # Right align amount columns (7, 8, 9) for data rows
        ('ALIGN', (7, 1), (9, -2), 'RIGHT'),  # Data rows only
        
        # Center align Del.Challan and P.O # columns
        ('ALIGN', (1, 1), (1, -2), 'CENTER'),  # Del.Challan column
        ('ALIGN', (2, 1), (2, -2), 'CENTER'),  # P.O # column
        
        # Grand Total row styling
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, -1), (-1, -1), 12),  # Increased from 9 to 12 for total row
        ('BACKGROUND', (0, -1), (-1, -1), colors.white),
        ('ALIGN', (6, -1), (6, -1), 'CENTER'),  # "Grand Total" text
        ('ALIGN', (7, -1), (9, -1), 'RIGHT'),  # Amount columns in total row
    ]
    
    # Apply individual cell borders with skip logic (same as regular mode)
    rows, cols = len(table_data), len(table_data[0])
    for r in range(rows):
        for col in range(cols):
            # Skip borders for specific columns in Grand Total row (same logic as regular mode)
            # For Annexure: skip columns 0,1,2,3,4,5 in total row (only show 6,7,8,9)
            if r == len(table_data) - 1 and col in [0, 1, 2, 3, 4, 5]:  # Grand Total row
                continue  # no border for these cells on total row
            style_commands.append(("BOX", (col, r), (col, r), 0.5, colors.black))
    
    table.setStyle(TableStyle(style_commands))
    
    # First, wrap table to get its actual dimensions
    available_width = page_width - 2 * side_margin
    table.wrapOn(c, available_width, page_height)
    
    # Get actual table dimensions after wrapping
    table_width, table_height = table.wrap(available_width, page_height)
    
    # Now draw title section with same width as table
    title_y = page_height - 60
    
    # Calculate table position for title bar alignment
    table_x = (page_width - table_width) / 2.0
    
    # Draw title bar with borders (same width as table)
    title_bar_height = 25
    
    # Draw title bar background and borders
    c.setLineWidth(0.5)
    c.rect(table_x, title_y - 5, table_width, title_bar_height, stroke=1, fill=0)
    
    # Draw title on left within the bar
    c.setFont("Helvetica-Bold", 12)
    title_text = "ANNEXURE OF PERIODIC BILLING"
    c.drawString(table_x + 5, title_y + 5, title_text)
    
    # Draw date on right within the bar
    date_text = f"Date : {datetime.now().strftime('%d-%m-%y')}"
    c.setFont("Helvetica-Bold", 10)
    date_width = c.stringWidth(date_text, "Helvetica-Bold", 10)
    c.drawString(table_x + table_width - date_width - 5, title_y + 5, date_text)
    
    # Position table on page - below the title bar
    table_y_position = title_y - 13  # Position below title bar
    y = table_y_position - table_height
    
    table.drawOn(c, table_x, y)
    
    # Create table with proper styling like the image
    table = Table(table_data, rowHeights=[20] * len(table_data))
    

    
    c.showPage()
    c.save()
    buffer.seek(0)
    return buffer.getvalue()


def build_multi_page_pdf(page_groups, header_map: dict = None) -> bytes:
    """
    Build a multi-page PDF document where each page contains one or more serial groups.
    Each page is treated as a slide in the final document.
    """
    buffer = io.BytesIO()
    
    # Page setup
    side_margin, top_margin, bottom_margin = 20 * mm, 20 * mm, 20 * mm
    page_height, page_width = A4  # A4 portrait
    
    c = canvas.Canvas(buffer, pagesize=(page_width, page_height))
    
    for page_idx, page_serials in enumerate(page_groups):
        # Generate PDF content for this page using the single page function
        page_pdf_bytes = build_single_page_pdf(page_serials, header_map)
        
        # Create a new page in the main document
        if page_idx > 0:
            c.showPage()
        
        # Get the table for this page
        first_group_df = page_serials[0]['df']
        headers = list(first_group_df.columns)
        if header_map:
            headers = [header_map.get(h, h) for h in headers]
        
        # Find amount column index
        amount_pkr_col_idx = None
        for i, col in enumerate(first_group_df.columns):
            col_clean = str(col).lower().strip()
            if "amount" in col_clean and "pkr" in col_clean:
                amount_pkr_col_idx = i
                break
        
        combined_data = []
        total_row_indices = []
        header_row_indices = []
        table_end_indices = []
        current_row_index = 0
        
        for group_idx, group in enumerate(page_serials):
            df = group['df']
            
            # Add spacing rows before each group (except the first one)
            if group_idx > 0:
                for _ in range(4):
                    combined_data.append([""] * len(headers))
                    current_row_index += 1
            
            # Add header row for each serial group
            combined_data.append(headers)
            header_row_indices.append(current_row_index)
            current_row_index += 1
            
            # Add data rows
            for _, row in df.iterrows():
                row_data = [format_cell_value(row[col], col) for col in df.columns]
                combined_data.append(row_data)
                current_row_index += 1
            
            # Add total row
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
                table_end_indices.append(current_row_index)
                current_row_index += 1
        
        # Truncate long cell values
        max_cell_len = 80
        for r in range(len(combined_data)):
            for cidx in range(len(combined_data[r])):
                val = str(combined_data[r][cidx]) if combined_data[r][cidx] is not None else ""
                combined_data[r][cidx] = (val[: max_cell_len - 1] + "…") if len(val) > max_cell_len else val
        
        table = build_table(combined_data, first_group_df, amount_pkr_col_idx, total_row_indices, header_row_indices, table_end_indices)
        
        # Wrap the table and get actual dimensions
        available_width = page_width - side_margin * 2
        available_height = page_height - top_margin - bottom_margin
        table.wrapOn(c, available_width, available_height)
        
        # Get actual table dimensions after wrapping
        table_width = table._width
        table_height = table._height

        # Perfect horizontal and vertical centering
        x = (page_width - table_width) / 2.0
        y = (page_height - table_height) / 2.0
        table.drawOn(c, x, y)
    
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

    # Format data with proper date handling
    data_rows = []
    for _, row in df.iterrows():
        formatted_row = [format_cell_value(row[col], col) for col in df.columns]
        data_rows.append(formatted_row)
    
    data = [headers] + data_rows

    amount_pkr_col_idx = None
    for i, col in enumerate(df.columns):
        col_clean = str(col).lower().strip()
        if "amount" in col_clean and "pkr" in col_clean:
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
        ensure_cloud = st.checkbox("Upload to Cloudinary", value=False)
        
        # Add toggle for Annexure PDF
        st.write("---")  # Separator line
        generate_annexure = st.checkbox("📋 Generate Annexure PDF", value=False, help="Generate 'Annexure of Periodic Billing' PDF with sales tax calculations")

    uploaded = st.file_uploader("Upload XLSX", type=["xlsx"])
    if uploaded is None:
        st.info("Choose an Excel file to begin.")
        return

    df = pd.read_excel(uploaded)
    
    # Clean column names by stripping whitespace
    df.columns = df.columns.str.strip()
    
    # Display information about the toggle
    if generate_annexure:
        st.info("📋 **Annexure Mode**: Will generate a single 'Annexure of Periodic Billing' PDF with sales tax calculations for all data.")
    else:
        st.info("📄 **Regular Mode**: Will generate grouped PDFs by delivery challan as usual.")
    
    # Check if serial_column exists (with case-insensitive and stripped matching)
    column_found = False
    actual_serial_column = None
    
    # First try exact match
    if serial_column in df.columns:
        actual_serial_column = serial_column
        column_found = True
    else:
        # Try case-insensitive and stripped matching
        serial_column_lower = serial_column.lower().strip()
        for col in df.columns:
            if col.lower().strip() == serial_column_lower:
                actual_serial_column = col
                column_found = True
                break
    
    if not column_found:
        st.error(f"Column '{serial_column}' not found. Available columns: {', '.join(df.columns.astype(str))}")
        st.info("💡 Tip: Column names are automatically trimmed for whitespace. Try checking the exact column name from the list above.")
        
        # Show columns with their lengths for debugging
        with st.expander("🔍 Debug: Column names with lengths"):
            for col in df.columns:
                st.write(f"'{col}' (length: {len(col)})")
        return
    else:
        # Show successful column detection
        if actual_serial_column != serial_column:
            st.info(f"✅ Column found: Using '{actual_serial_column}' (matched from input '{serial_column}')")

    ok_cloud = configure_cloudinary() if ensure_cloud else True

    user_id = os.getenv("USER") or os.getenv("USERNAME") or "user"
    timestamp = int(time.time() * 1000)

    serial_values = df[actual_serial_column].astype(str).fillna("").str.strip()
    groups = {}
    for idx, value in serial_values.items():
        if value:
            groups.setdefault(value, []).append(idx)

    # st.write(df.columns.tolist())

    results = []
    progress = st.progress(0)
    done = 0

    # Create robust header mapping that handles trailing spaces
    header_map = get_robust_header_map(df.columns)


    # Group serials into pages (max 22 rows per page)
    page_groups = []
    current_page = []
    current_page_rows = 0
    max_rows_per_page = 25
    
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
    
    # Generate Annexure PDF if toggle is enabled
    if generate_annexure:
        # For annexure, we use the entire dataframe as one document
        annexure_pdf_bytes = build_annexure_pdf(df, header_map=header_map)
        
        annexure_public_id = f"{user_id}_{timestamp}_Annexure_Billing"
        annexure_pdf_url = None
        
        if ensure_cloud and ok_cloud:
            try:
                annexure_res = upload_raw_to_cloudinary(annexure_pdf_bytes, public_id=annexure_public_id)
                annexure_pdf_url = annexure_res.get("secure_url")
            except Exception as e:
                st.warning(f"Failed to upload Annexure PDF: {e}")
        
        # Add annexure result
        results.append({
            "type": "annexure",
            "page": "Annexure",
            "serials": ["All Data"],
            "total_rows": len(df),
            "pdf_url": annexure_pdf_url,
            "xlsx_urls": {},
            "pdf_bytes": annexure_pdf_bytes,
        })
        
        st.success("Annexure PDF generated successfully!")
        
        # Show download option for Annexure PDF
        st.subheader("Download Annexure PDF")
        st.download_button(
            label="📋 Download Annexure of Periodic Billing",
            data=annexure_pdf_bytes,
            file_name=f"Annexure_Periodic_Billing_{timestamp}.pdf",
            mime="application/pdf",
            key="dl_annexure"
        )
        st.write("---")  # Add separator line
        
        # Don't process regular grouped PDFs when annexure is enabled
        return
    
    # Regular PDF processing (when annexure toggle is OFF)
    for page_idx, page_serials in enumerate(page_groups):
        # Generate PDF for this page
        pdf_bytes = build_single_page_pdf(page_serials, header_map=header_map)
        
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
    
    # Generate single multi-page PDF document with all pages as slides
    if results and page_groups:
        multi_page_pdf_bytes = build_multi_page_pdf(page_groups, header_map=header_map)
        st.download_button(
            label="📄 Download Single PDF Document (All Pages as Slides)",
            data=multi_page_pdf_bytes,
            file_name=f"all_pages_combined_{timestamp}.pdf",
            mime="application/pdf",
            key="dl_single_document"
        )
        st.write("---")  # Add separator line
    
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
