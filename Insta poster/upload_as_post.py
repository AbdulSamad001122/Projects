from PIL import Image, ImageDraw, ImageFont
import textwrap
import os
import random
from datetime import datetime
import google.generativeai as genai
from instagrapi import Client
from moviepy.editor import ImageClip, AudioFileClip, vfx, afx
import uuid  # Import uuid for generating unique identifiers

# Configure API key
genai.configure(api_key="AIzaSyDAtkQs1Q7Nq7iFc2_iNTCO8fl_nUB8RFU")

# Load the model
model = genai.GenerativeModel("gemini-1.5-flash")

# Function to generate a short motivational quote
def generate_quote():
    messages = [
        {"role": "user", "parts": [
            "You are a dynamic quote generator known for creating fresh, captivating, and deeply relatable motivational quotes. Your focus covers a wide range of themes such as money, success, business, relationships, personal growth, lifestyle, faith, and more. Each quote you craft should be unique, easily understood, and uplifting, offering new perspectives that resonate on a personal level. Aim for simplicity, but make sure the quote sparks motivation and inspires positive change across different aspects of life."
        ]},
        {"role": "user", "parts": [
            "Create a short, unique, and impactful quote. Make it feel personal and empowering, while covering themes like success, growth, money, relationships, or faith. Keep it simple but powerful enough to spark motivation and change."
        ]},
    ]


    # Generate response
    response = model.generate_content(messages)
    quote = response.text.strip()  # Clean up the generated text
    print(f"Generated Quote: {quote}")  # Debug info
    return quote

# Configuration
IMAGE_FOLDER = "backgrounds"
OUTPUT_FOLDER = "output"
FONT_PATH = r"E:\Projects\Insta poster\Poppins-Bold.ttf"  # Path to your font file
FONT_COLOR = (255, 255, 255)  # White text
MAX_FONT_SIZE = 100
MIN_FONT_SIZE = 20
LINE_SPACING = 10

# Function to add text on the center of the image
def add_text_on_image(image_path, text):
    # Open the image
    image = Image.open(image_path).convert("RGB")
    draw = ImageDraw.Draw(image)
    
    # Start with the maximum font size
    font_size = MAX_FONT_SIZE
    image_width, image_height = image.size
    
    while font_size >= MIN_FONT_SIZE:
        # Create font object
        font = ImageFont.truetype(FONT_PATH, font_size)
        
        # Split text into lines to fit the image width
        wrapped_text = textwrap.wrap(text, width=40)
        text_lines = []
        
        # Check each line's width and adjust
        for line in wrapped_text:
            line_width, line_height = draw.textbbox((0, 0), line, font=font)[2:]
            if line_width <= image_width * 0.9:  # 90% of image width
                text_lines.append(line)
            else:
                font_size -= 5  # Reduce font size if text doesn't fit
                break
        
        # If all lines fit, break the loop
        if len(text_lines) == len(wrapped_text):
            break
    
    # Calculate text block height
    total_text_height = len(text_lines) * font_size + (len(text_lines) - 1) * LINE_SPACING
    
    # Starting Y position to center the text block
    y_position = (image_height - total_text_height) // 2
    
    # Draw each line of text
    for line in text_lines:
        line_width, line_height = draw.textbbox((0, 0), line, font=font)[2:]
        x_position = (image_width - line_width) // 2  # Center the line
        draw.text((x_position, y_position), line, font=font, fill=FONT_COLOR)
        y_position += font_size + LINE_SPACING  # Move to the next line
    
    # Save the image with a timestamp to ensure unique output
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_path = os.path.join(OUTPUT_FOLDER, f"output_{timestamp}.jpg")
    
    # Save the new image
    image.save(output_path)
    print(f"Saved: {output_path}")
    return output_path

# Function to generate a unique output video name
def generate_unique_video_name():
    # Generate a unique identifier based on UUID
    unique_id = uuid.uuid4().hex[:8]  # Using only the first 8 characters for simplicity
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    return f"output_video_{timestamp}_{unique_id}.mp4"

# Create output folder if it doesn't exist
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# Get a list of all images in the backgrounds folder
image_files = [f for f in os.listdir(IMAGE_FOLDER) if f.endswith(('.png', '.jpg', '.jpeg'))]

# Generate the quote
quote = generate_quote()

# Randomly select one image from the backgrounds folder
if image_files:
    random.shuffle(image_files)  # Shuffle the list for better randomness
    random_image = random.choice(image_files)  # Randomly choose one image
    print(f"Selected background: {random_image}")  # Debug info
    image_path = os.path.join(IMAGE_FOLDER, random_image)
    post_image_path = add_text_on_image(image_path, quote)
else:
    print("No images found in the backgrounds folder.")

# Create a video from the generated image

# Path to your audio file
audio_path = r"E:\Projects\Insta poster\audio.mp3"  # Change this to your audio file's path

# Create an image clip
clip = ImageClip(post_image_path)

# Set the duration of the video (in seconds)
clip = clip.set_duration(10)  # This makes the video 5 seconds long

# Apply video effects (fade-in, fade-out)
video_clip = clip.fx(vfx.fadein, 2).fx(vfx.fadeout, 2)

# Load the audio file and trim it to 5 seconds
audio_clip = AudioFileClip(audio_path).subclip(0, 10)  # Trim to the first 5 seconds

# Set the audio to the video and apply audio fade effects
final_video = video_clip.set_audio(audio_clip).fx(afx.audio_fadein, 2).fx(afx.audio_fadeout, 2)

# Generate the unique output video path
output_video_path = os.path.join(OUTPUT_FOLDER, generate_unique_video_name())

# Write the final video with fades and audio to the unique path
final_video.write_videofile(output_video_path, fps=24)

print(f"Video generated successfully: {output_video_path}")

# Instagram login details
USERNAME = "inspiring_capsule"
PASSWORD = "abdulsamad#12345"

# Define relevant hashtags
hashtags = ["#Motivation", "#Success", "#Business", "#Money", "#Inspirational", "#DailyQuote"]

# Join hashtags into a single string
hashtag_string = " ".join(hashtags)

# Append hashtags to the caption
CAPTION = f"{quote}\n\n{hashtag_string}"

# Create an Instagram client instance and login
cl = Client()
cl.login(USERNAME, PASSWORD)

# Upload the video with caption
media = cl.video_upload(output_video_path, CAPTION)

print("Video uploaded successfully!")
