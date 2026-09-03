import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings


def _build_otp_html(username: str, otp: str) -> str:
    return f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f3f4f6;">
        <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e5e7eb;">
            <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #4f46e5; margin: 0; font-size: 24px;">Issue Tracker</h1>
            </div>
            <h2 style="color: #1f2937; margin-bottom: 8px; font-size: 20px;">Verification Code</h2>
            <p style="color: #4b5563; margin-bottom: 24px; font-size: 15px;">
                Hi <strong>{username}</strong>, use the following 6-digit OTP code to verify your email address:
            </p>
            <div style="text-align: center; margin: 32px 0;">
                <div style="display: inline-block; background-color: #f3f4f6; border: 2px dashed #6366f1; border-radius: 12px; padding: 16px 32px; letter-spacing: 8px; font-size: 32px; font-weight: 700; color: #4338ca;">
                    {otp}
                </div>
            </div>
            <p style="color: #6b7280; font-size: 14px; text-align: center; margin-bottom: 24px;">
                ⏰ This code will expire in <strong>10 minutes</strong>.
            </p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                If you did not request this verification code, please ignore this email.
            </p>
        </div>
    </body>
    </html>
    """


def send_verification_otp(to_email: str, username: str, otp: str) -> None:
    """
    Send an HTML email containing a 6-digit OTP code via SMTP.
    Called as a background task.
    """
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"{otp} is your Issue Tracker verification code"
    msg["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.SMTP_USER}>"
    msg["To"] = to_email

    html_part = MIMEText(_build_otp_html(username, otp), "html")
    msg.attach(html_part)

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.ehlo()
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_USER, to_email, msg.as_string())
