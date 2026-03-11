import resend

from ..config import settings

resend.api_key = settings.resend_api_key


def send_magic_link_email(to: str, url: str) -> None:
    resend.Emails.send(
        {
            "from": settings.from_email,
            "to": to,
            "subject": "Sign in to Specz",
            "html": f"""
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #2d2d2d; font-size: 24px; margin-bottom: 24px;">Sign in to Specz</h1>
                <p style="color: #5a5a5a; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
                    Click the button below to sign in. This link expires in 15 minutes.
                </p>
                <a href="{url}"
                   style="display: inline-block; background: #2d2d2d; color: #f5f5f4;
                          padding: 12px 24px; text-decoration: none; border-radius: 6px;
                          font-size: 16px;">
                    Sign in to Specz
                </a>
                <p style="color: #888; font-size: 14px; margin-top: 24px;">
                    If you didn't request this email, you can safely ignore it.
                </p>
                <p style="color: #888; font-size: 12px; margin-top: 16px;">
                    Or copy this link: {url}
                </p>
            </div>
            """,
        }
    )
