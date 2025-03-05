from moviepy.editor import VideoFileClip
import streamlit as st
import tempfile
import os

# Set page configuration
st.set_page_config(page_title="Audio Extractor", page_icon="🔊", layout="wide")

st.title("🎵 Extract Audio from Video")
st.write("Upload a video file, and this app will extract its audio for you.")

# File uploader
uploaded_file = st.file_uploader("Upload a video file", type=["mp4", "avi", "mov"])

if uploaded_file:
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as temp_file:
            temp_file.write(uploaded_file.read())
            temp_filepath = temp_file.name

        st.info("Processing video... Please wait.")

        # Load video clip
        video_clip = VideoFileClip(temp_filepath)

        # Check if the video has audio
        if video_clip.audio is None:
            st.error("🚨 The uploaded video has no audio stream.")
        else:
            # Get user-defined filename
            user_input = st.text_input("Enter the file name for the extracted audio", "audio.mp3").strip()

            if not user_input.endswith(".mp3"):
                user_input += ".mp3"

            # Show progress bar
            progress_bar = st.progress(0, text="Extracting audio...")
            
            # Extract and save the audio
            audio_file_path = os.path.join(tempfile.gettempdir(), user_input)
            video_clip.audio.write_audiofile(audio_file_path)
            
            # Close video and audio resources
            video_clip.close()

            # Update progress bar
            progress_bar.progress(100, text="✅ Audio extraction complete!")

            st.success("🎉 Audio extracted successfully!")

            # Provide download button
            with open(audio_file_path, "rb") as f:
                st.download_button(label="⬇️ Download Audio", data=f, file_name=user_input, mime="audio/mp3")

    except Exception as e:
        st.error(f"❌ An error occurred: {e}")
    finally:
        if 'video_clip' in locals():
            video_clip.close()
