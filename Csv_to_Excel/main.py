import streamlit as st
import pandas as pd
from io import BytesIO

# Set page configuration
st.set_page_config(page_title="CSV to Excel", page_icon=":bar_chart:", layout="wide")


st.title("File Converter & Cleaner")
st.write("This app converts CSV files to Excel and helps clean the data before downloading.")


# File uploader
files = st.file_uploader("Upload your CSV or Excel files", type=['csv', "xlsx"], accept_multiple_files=True)

if files:
    for file in files:
        ext = file.name.split(".")[-1]

        # Read the file based on its extension
        try:
            df = pd.read_csv(file, encoding="ISO-8859-1") if ext == "csv" else pd.read_excel(file)
        except Exception as e:
            st.error(f"Error reading {file.name}: {e}")
            continue

        st.subheader(f"{file.name} - Preview")

        # Checkbox to show full file
        show_full_file = st.checkbox(f"Show full file - {file.name}")
        st.dataframe(df if show_full_file else df.head(10))  # Show all or first 10 rows

        # Remove duplicates
        if st.checkbox(f"Remove duplicates - {file.name}"):
            df.drop_duplicates(inplace=True)
            st.success("Duplicates removed.")
            st.dataframe(df)

        # Fill missing values
        if st.checkbox(f"Fill missing values - {file.name}"):
            df.fillna(df.select_dtypes(include=["number"]).mean(), inplace=True)
            st.success("Missing values filled with column mean.")
            st.dataframe(df)

        # Column selection
        selected_columns = st.multiselect(f"Select columns to keep - {file.name}", df.columns, default=df.columns)
        df = df[selected_columns]
        st.dataframe(df)

        # Show chart if numeric data exists
        if st.checkbox(f"Show chart - {file.name}"):
            numeric_df = df.select_dtypes(include=["number"])
            if not numeric_df.empty:
                st.bar_chart(numeric_df)
            else:
                st.warning("No numeric columns available for visualization.")

        # File format selection
        format_choice = st.radio(f"Convert {file.name} to:", ["csv", "xlsx"], key=file.name)

        # Download button
        if st.button(f"Download {file.name} as {format_choice}"):
            output = BytesIO()
            if format_choice == "csv":
                df.to_csv(output, index=False)
                mime = "text/csv"
                new_name = file.name.replace(ext, "csv")
            else:
                df.to_excel(output, index=False, engine="openpyxl")
                mime = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                new_name = file.name.replace(ext, "xlsx")

            output.seek(0)
            st.download_button(label="Download from here!", data=output, file_name=new_name, mime=mime)

        st.success(f"{file.name} cleaned and converted to {format_choice}")
