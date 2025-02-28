import streamlit as st
import pandas as pd
from io import BytesIO
import openpyxl


if __name__ == "__main__":
    st.set_page_config(page_title="CSV to Excel", page_icon=":bar_chart:", layout="wide")

    st.title("File converter & Cleaner")
    st.write("This app is used to convert CSV files to Excel files and clean the data in the Excel file.")

    files = st.file_uploader("Upload your CSV files.", type=['csv', "xlsx"], accept_multiple_files=True)

    if files:
        for file in files:
            ext = file.name.split(".")[-1]
            df = pd.read_csv(file, encoding="ISO-8859-1") if ext == "csv" else pd.read_excel(file)

            st.subheader(f"{file.name} - Preview")

            # ✅ Add Checkbox to Show Full File
            show_full_file = st.checkbox(f"Show full file - {file.name}")

            # ✅ If checked, show full DataFrame; else, show first few rows
            if show_full_file:
                st.dataframe(df)
            else:
                st.dataframe(df.head(10))  # Show only first 10 rows by default

            if st.checkbox(f"Remove duplicates - {file.name}"):
                df.drop_duplicates(inplace=True)
                st.success("Duplicates removed")

            if st.checkbox(f"Fill missing values - {file.name}"):
                df.fillna(df.select_dtypes(include=["number"]).mean(), inplace=True)
                st.success("Missing values filled with mean.")
                st.dataframe(df)  # Show preview after filling missing values

            selected_columns = st.multiselect(f"Select Columns - {file.name}", df.columns, default=df.columns)
            df = df[selected_columns]
            st.dataframe(df)  # Show preview after selecting columns

            if st.checkbox(f"Show chart - {file.name}") and not df.select_dtypes(include=["number"]).empty:
                st.bar_chart(df.select_dtypes(include=["number"]).iloc[:, :2])

            format_choice = st.radio(f"Convert {file.name} to:", ["csv", "xlsx"], key=file.name)

            if st.button(f"Download {file.name} as {format_choice}"):
                output = BytesIO()
                if format_choice == "csv":
                    df.to_csv(output, index=False)
                    mime = "text/csv"
                    new_name = file.name.replace(ext, "csv")
                else:
                    df.to_excel(output, index=False, engine="openpyxl")
                    mine = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    new_name = file.name.replace(ext, "xlsx")

                output.seek(0)
                st.download_button(label=f"Download from here!", data=output, file_name=new_name, mime=mine)

            st.success(f"{file.name} cleaned and converted to {format_choice}")
