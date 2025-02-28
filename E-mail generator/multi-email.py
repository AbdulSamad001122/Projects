import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Gmail SMTP settings
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
EMAIL_ADDRESS = "iamabdulsamad2.0@gmail.com"  # Replace with your Gmail
APP_PASSWORD = "xsxs fcsn dxkr zbyh"  # Replace with the generated App Password

# Step 1: Get recipient email addresses from the user
emails_input = input("Enter recipient email addresses (comma-separated): ")
receiver_emails = [email.strip() for email in emails_input.split(",")]  # Convert input into a list

# Step 2: Get email subject and body from the user
subject = input("Enter email subject: ")
body = input("Enter email body: ")

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
