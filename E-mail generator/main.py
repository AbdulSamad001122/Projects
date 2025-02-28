import google.generativeai as genai
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Configure API key
genai.configure(api_key="AIzaSyBGHzipRrmsQ_2zW56XtXLzgPva6vx0ciM")

while True :

    # Load the model
    model = genai.GenerativeModel("gemini-1.5-flash")
    prompt = input("Enter your prompt: ")

    # Modify prompt to ensure AI generates subject and body separately
    messages = [
        {"role": "user", "parts": ["Generate a professional email with a clear subject line followed by the body. Format: \nSubject: [Subject Line]\nBody: [Email Content]"]},
        {"role": "user", "parts": [prompt]}
    ]

    # Generate response
    response = model.generate_content(messages)
    email_text = response.text

    # Split the response into subject and body
    lines = email_text.split("\n", 1)  # Split at the first newline
    subject = lines[0].replace("Subject: ", "").strip() if lines else "No Subject"
    body = lines[1].replace("Body: ", "").strip() if len(lines) > 1 else "No Body"

    # Print extracted subject and body
    print("Extracted Subject:", subject)
    print("Extracted Body:", body)

    # code for email sending

    user_email = input("Enter your email adress : ")

    # Gmail SMTP settings
    SMTP_SERVER = "smtp.gmail.com"
    SMTP_PORT = 587
    EMAIL_ADDRESS = user_email  # Replace with your Gmail
    APP_PASSWORD = "xsxs fcsn dxkr zbyh"  # Replace with the generated App Password

    # Step 1: Get recipient email addresses from the user
    emails_input = input("Enter recipient email addresses (comma-separated): ")
    receiver_emails = [email.strip() for email in emails_input.split(",")]  # Convert input into a list

    # Step 2: Get email subject and body from the user
    subject = (subject)
    body = (body)

    # Step 3: Create the email
    msg = MIMEMultipart()  # Create an email object
    msg["From"] = EMAIL_ADDRESS  # Sender email
    msg["To"] = ", ".join(receiver_emails)  # Display recipients
    msg["Subject"] = subject  # Email subject
    msg.attach(MIMEText(body, "plain"))  # Attach the email body

    # Step 4: Send the email
    try:
        # Connect to Gmail SMTP server
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()  # Secure the connection
        server.login(EMAIL_ADDRESS, APP_PASSWORD)  # Login with App Password
        
        # Send the email to all recipients
        server.sendmail(EMAIL_ADDRESS, receiver_emails, msg.as_string())
        
        print("\n✅ Email sent successfully to multiple recipients!")
    except Exception as e:
        print(f"\n❌ Error: {e}")
    finally:
        server.quit()  # Close the connection
