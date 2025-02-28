import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Email credentials
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
EMAIL_ADDRESS = "iamabdulsamad2.0@gmail.com"  # Replace with your Gmail
APP_PASSWORD = "xsxs fcsn dxkr zbyh"  # Replace with the generated App Password

# Email content
receiver_email = "iamabdulsamad3.0@gmail.com"
subject = "Test Email"
body = "This is a test email sent using SMTP with an App Password."

# Create email message
msg = MIMEMultipart()
msg["From"] = EMAIL_ADDRESS
msg["To"] = receiver_email
msg["Subject"] = subject
msg.attach(MIMEText(body, "plain"))

# Send email
try:
    server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
    server.starttls()  # Secure the connection
    server.login(EMAIL_ADDRESS, APP_PASSWORD)
    server.sendmail(EMAIL_ADDRESS, receiver_email, msg.as_string())
    print("Email sent successfully!")
except Exception as e:
    print(f"Error: {e}")
finally:
    server.quit()
