from moviepy.editor import VideoFileClip
import streamlit as st
import tempfile

# Set page configuration
st.set_page_config(page_title="CSV to Excel", page_icon=":bar_chart:", layout="wide")

st.title("File Converter & Cleaner")
st.write("This app converts CSV files to Excel and helps clean the data before downloading.")


# File uploader
uploaded_file = st.file_uploader("Upload a video file", type=["mp4", "avi", "mov"], accept_multiple_files=False)

if uploaded_file is not None:
     
     with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as temp_file:
        temp_file.write(uploaded_file.read())  # Save uploaded file to temp file

        temp_filepath = temp_file.name  # Get the file path

        # Define the input video file and output audio file

        mp3_file = "audio.mp3"

        # Load the video clip
        video_clip = VideoFileClip(temp_filepath)

        # Extract the audio from the video clip
        audio_clip = video_clip.audio

        # Write the audio to a separate file
        audio_clip.write_audiofile(mp3_file)

        # Close the video and audio clips
        audio_clip.close()
        video_clip.close()

        print("Audio extraction successful!")

        st.download_button(label="Download from here!", data=mp3_file, file_name=mp3_file)