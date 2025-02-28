import os
import json
import whisper
import ffmpeg
from moviepy.editor import VideoFileClip, TextClip, CompositeVideoClip
from moviepy.config import change_settings
from moviepy.editor import TextClip
import matplotlib.font_manager as fm

fonts = sorted([f.name for f in fm.fontManager.ttflist])
print(fonts)



# Configure ImageMagick path for MoviePy
change_settings({"IMAGEMAGICK_BINARY": r"E:\\Projects\\video_editing\\ImageMagick-7.1.1-Q16\\magick.exe"})




# Paths
font_path = r"c:\windows\fonts\sigmar-regular.ttf"
FFMPEG_PATH = r"E:\Projects\video_editing\ffmpeg\bin\ffmpeg.exe"
os.environ["PATH"] += os.pathsep + os.path.dirname(FFMPEG_PATH)

# Step 1: Get video file path
videofilename = input("Enter the full path of the video file: ").strip()

if not os.path.exists(videofilename):
    print(f"❌ Error: The file '{videofilename}' does not exist.")
    exit(1)

print(f"🔄 Processing video: {videofilename}")

# Step 2: Extract Audio
audiofilename = os.path.splitext(videofilename)[0] + ".mp3"

if not os.path.exists(audiofilename):
    print(f"🎵 Extracting audio to: {audiofilename}")
    try:
        ffmpeg.input(videofilename).output(audiofilename, format='mp3', acodec='libmp3lame').run(overwrite_output=True)
        print(f"✅ Audio extracted: {audiofilename}")
    except Exception as e:
        print(f"❌ Failed to extract audio: {e}")
        exit(1)
else:
    print(f"⚡ Audio file already exists: {audiofilename}, skipping extraction.")

# Step 3: Transcribe Audio using Whisper
word_timestamps_path = 'word_timestamps.json'
if not os.path.exists(word_timestamps_path):
    print("📝 Transcribing audio with Whisper...")
    try:
        model = whisper.load_model("medium")
        result = model.transcribe(audiofilename, word_timestamps=True)
    except Exception as e:
        print(f"❌ Whisper transcription failed: {e}")
        exit(1)

    wordlevel_info = [
        {'word': word["word"].strip(), 'start': word["start"], 'end': word["end"]}
        for segment in result.get("segments", [])
        for word in segment.get("words", [])
    ]

    with open(word_timestamps_path, 'w') as f:
        json.dump(wordlevel_info, f, indent=4)
    print(f"✅ Word-level timestamps saved to '{word_timestamps_path}'.")
else:
    print(f"⚡ Word timestamps file already exists: {word_timestamps_path}, skipping transcription.")
    with open(word_timestamps_path, 'r') as f:
        wordlevel_info = json.load(f)

# Step 4: Convert to Line-Level Subtitles
line_timestamps_path = 'line_timestamps.json'
if not os.path.exists(line_timestamps_path):

    def split_text_into_lines(data):
        MaxChars = 35
        MaxDuration = 2.8
        MaxGap = 1.0

        subtitles = []
        line = []
        line_start = 0

        for idx, word_data in enumerate(data):
            word = word_data["word"].strip()
            start = word_data["start"]
            end = word_data["end"]

            if not line:
                line_start = start
            line.append(word_data)

            temp = " ".join(item["word"] for item in line)
            duration = end - line_start

            duration_exceeded = duration > MaxDuration
            chars_exceeded = len(temp) > MaxChars
            maxgap_exceeded = idx > 0 and (start - data[idx-1]['end']) > MaxGap

            if duration_exceeded or chars_exceeded or maxgap_exceeded:
                if line:
                    subtitles.append({
                        "text": " ".join(item["word"] for item in line).strip(),
                        "start": line_start,
                        "end": line[-1]["end"]
                    })
                    line = []

        if line:
            subtitles.append({
                "text": " ".join(item["word"] for item in line).strip(),
                "start": line_start,
                "end": line[-1]["end"]
            })

        return subtitles

    linelevel_subtitles = split_text_into_lines(wordlevel_info)
    with open(line_timestamps_path, 'w') as f:
        json.dump(linelevel_subtitles, f, indent=4)
    print(f"✅ Line-level timestamps saved to '{line_timestamps_path}'.")
else:
    print(f"⚡ Line timestamps file already exists: {line_timestamps_path}, skipping processing.")
    with open(line_timestamps_path, 'r') as f:
        linelevel_subtitles = json.load(f)

# Step 5: Burn Subtitles into Video
def create_subtitle_clips(subtitles, video_clip):
    subtitle_clips = []
    video_w, video_h = video_clip.size
    fontsize = max(24, int(video_h * 0.05))

    for subtitle in subtitles:
        text = subtitle["text"]
        start_time = subtitle["start"]
        end_time = subtitle["end"]

        txt_clip = (TextClip(
            text,
            fontsize=fontsize,
            font = font_path,  # Use the font name instead of path
            color="lime",
            stroke_color="black",
            stroke_width=2,
            method="caption",
            size=(video_w * 0.85, None)
        )
        .set_position(("center", video_h * 0.75))  # Adjust text placement
        .set_duration(end_time - start_time)
        .set_start(start_time))
        
        subtitle_clips.append(txt_clip)
    
    return subtitle_clips

# Load video and add subtitles
print("🎬 Adding subtitles to video...")
try:
    video = VideoFileClip(videofilename)
    subtitle_clips = create_subtitle_clips(linelevel_subtitles, video)
    final_video = CompositeVideoClip([video] + subtitle_clips)

    output_video_path = os.path.splitext(videofilename)[0] + "_subtitled.mp4"
    final_video.write_videofile(output_video_path, codec="libx264", fps=video.fps)

    print(f"✅ Final video saved as: {output_video_path}")
except Exception as e:
    print(f"❌ Error processing video: {e}")


