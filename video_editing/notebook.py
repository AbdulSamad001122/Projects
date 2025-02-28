import os
import json
import whisper
import ffmpeg
from moviepy.editor import VideoFileClip, TextClip, CompositeVideoClip
from moviepy.config import change_settings
from moviepy.video.fx.all import mask_color

change_settings({"IMAGEMAGICK_BINARY": r"E:\Projects\video_editing\ImageMagick-7.1.1-Q16\magick.exe"})

# Set FFmpeg Path
FFMPEG_PATH = r"E:\Projects\video_editing\ffmpeg\bin\ffmpeg.exe"
os.environ["PATH"] += os.pathsep + os.path.dirname(FFMPEG_PATH)

# Get video file path
videofilename = input("Enter the full path of the video file: ").strip()

if not os.path.exists(videofilename):
    print(f"❌ Error: The file '{videofilename}' does not exist.")
    exit(1)

print(f"🔄 Processing video: {videofilename}")

# Extract Audio
audiofilename = os.path.splitext(videofilename)[0] + ".mp3"

if not os.path.exists(audiofilename):
    print(f"🎵 Extracting audio to: {audiofilename}")
    try:
        ffmpeg.input(videofilename).output(audiofilename, format='mp3', acodec='libmp3lame').run(cmd=FFMPEG_PATH, overwrite_output=True)
        print(f"✅ Audio extracted: {audiofilename}")
    except Exception as e:
        print(f"❌ Failed to extract audio: {e}")
        exit(1)
else:
    print(f"⚡ Audio file already exists: {audiofilename}, skipping extraction.")

# Transcribe Audio
word_timestamps_path = 'word_timestamps.json'
if not os.path.exists(word_timestamps_path):
    print("📝 Transcribing audio with Whisper...")
    try:
        model = whisper.load_model("medium")
        result = model.transcribe(audiofilename, word_timestamps=True)
    except Exception as e:
        print(f"❌ Whisper transcription failed: {e}")
        exit(1)

    wordlevel_info = []
    for segment in result.get("segments", []):
        for word in segment.get("words", []):
            wordlevel_info.append({'word': word["word"].strip(), 'start': word["start"], 'end': word["end"]})

    with open(word_timestamps_path, 'w') as f:
        json.dump(wordlevel_info, f, indent=4)
    print(f"✅ Word-level timestamps saved to '{word_timestamps_path}'.")
else:
    print(f"⚡ Word timestamps file already exists: {word_timestamps_path}, skipping transcription.")
    with open(word_timestamps_path, 'r') as f:
        wordlevel_info = json.load(f)

# Convert to Line-Level Subtitles
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

# Burn Glowing Subtitles into Video
def create_subtitle_clips(subtitles, video_clip):
    subtitle_clips = []
    video_w, video_h = video_clip.size
    fontsize = max(22, int(video_h * 0.05))

    for subtitle in subtitles:
        text = subtitle["text"]
        start_time = subtitle["start"]
        end_time = subtitle["end"]

        txt_clip = TextClip(
            text,
            fontsize=fontsize,
            font="Arial-Bold",
            color="lightgreen",
            stroke_color="black",
            stroke_width=4,
            method="caption",
            size=(video_w * 0.8, None)
        ).set_position(("center", video_h * 0.85))

        glow_clip = txt_clip.fx(mask_color, color=[144, 238, 144], thr=100, s=5)
        final_txt_clip = CompositeVideoClip([glow_clip, txt_clip])
        final_txt_clip = final_txt_clip.set_start(start_time).set_end(end_time)
        subtitle_clips.append(final_txt_clip)

    return subtitle_clips

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
